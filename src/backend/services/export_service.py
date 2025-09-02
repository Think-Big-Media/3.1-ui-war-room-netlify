"""
Export service for generating PDF and CSV reports from analytics data.
Handles background processing for large exports.
"""
import io
import csv
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    Image,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas
import pandas as pd

from models.analytics import AnalyticsDashboard, DateRangeEnum
from services.analytics_service import analytics_service
from services.cache_service import cache_service
from core.config import settings
from services.posthog import posthog_service


class ExportService:
    """Service for exporting analytics data in various formats."""

    def __init__(self):
        self.export_jobs = {}  # Track background export jobs

    async def export_dashboard_data(
        self,
        org_id: str,
        date_range: DateRangeEnum,
        format: str = "csv",
        user_id: Optional[str] = None,
        filters: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Export dashboard data in specified format.

        Args:
            org_id: Organization ID
            date_range: Date range for data
            format: Export format (csv, pdf)
            user_id: User requesting export
            filters: Additional filters

        Returns:
            Export job information or direct download
        """
        # Generate job ID
        job_id = str(uuid4())

        # Store job info
        job_info = {
            "id": job_id,
            "status": "processing",
            "format": format,
            "created_at": datetime.utcnow().isoformat(),
            "org_id": org_id,
            "user_id": user_id,
        }

        # Cache job info
        await cache_service.set(f"export:job:{job_id}", job_info, ttl=3600)  # 1 hour

        # Track export event
        if user_id:
            await posthog_service.track(
                user_id=user_id,
                event_name="analytics_export_started",
                properties={
                    "format": format,
                    "date_range": date_range,
                    "org_id": org_id,
                },
            )

        # Process export in background
        asyncio.create_task(
            self._process_export(job_id, org_id, date_range, format, filters)
        )

        return job_info

    async def _process_export(
        self,
        job_id: str,
        org_id: str,
        date_range: DateRangeEnum,
        format: str,
        filters: Optional[Dict] = None,
    ):
        """Process export in background."""
        try:
            # Get analytics data
            from sqlalchemy.ext.asyncio import AsyncSession

            # This would use actual DB session in production
            dashboard_data = await analytics_service.get_dashboard_overview(
                None, org_id, date_range  # DB session would be injected
            )

            # Generate export based on format
            if format == "csv":
                result = await self._generate_csv(dashboard_data, org_id)
            elif format == "pdf":
                result = await self._generate_pdf(dashboard_data, org_id)
            else:
                raise ValueError(f"Unsupported format: {format}")

            # Update job status
            job_info = await cache_service.get(f"export:job:{job_id}")
            job_info.update(
                {
                    "status": "completed",
                    "completed_at": datetime.utcnow().isoformat(),
                    "download_url": result["url"],
                    "file_size": result["size"],
                }
            )

            await cache_service.set(f"export:job:{job_id}", job_info, ttl=3600)

        except Exception as e:
            # Update job with error
            job_info = await cache_service.get(f"export:job:{job_id}")
            job_info.update(
                {
                    "status": "failed",
                    "error": str(e),
                    "failed_at": datetime.utcnow().isoformat(),
                }
            )

            await cache_service.set(f"export:job:{job_id}", job_info, ttl=3600)

    async def _generate_csv(
        self, data: AnalyticsDashboard, org_id: str
    ) -> Dict[str, Any]:
        """
        Generate CSV export from dashboard data.

        Args:
            data: Dashboard data
            org_id: Organization ID

        Returns:
            File information
        """
        output = io.StringIO()

        # Write metadata
        writer = csv.writer(output)
        writer.writerow(["War Room Analytics Export"])
        writer.writerow(["Organization ID", org_id])
        writer.writerow(["Generated", datetime.utcnow().isoformat()])
        writer.writerow([])

        # Volunteer metrics
        writer.writerow(["VOLUNTEER METRICS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Volunteers", data.volunteer_metrics.total])
        writer.writerow(["Active Volunteers", data.volunteer_metrics.active])
        writer.writerow(["Inactive Volunteers", data.volunteer_metrics.inactive])
        writer.writerow(["Growth Rate", f"{data.volunteer_metrics.growth_rate:.2f}%"])
        writer.writerow([])

        # Event metrics
        writer.writerow(["EVENT METRICS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Events", data.event_metrics.total])
        writer.writerow(["Upcoming Events", data.event_metrics.upcoming])
        writer.writerow(["Completed Events", data.event_metrics.completed])
        writer.writerow(
            ["Average Attendance", f"{data.event_metrics.avg_attendance:.1f}"]
        )
        writer.writerow([])

        # Time series data
        if data.time_series_data:
            for metric_name, series in data.time_series_data.items():
                writer.writerow([f"{metric_name.upper()} TIME SERIES"])
                writer.writerow(["Date", "Value"])

                for point in series:
                    writer.writerow([point.timestamp.strftime("%Y-%m-%d"), point.value])
                writer.writerow([])

        # Get CSV content
        csv_content = output.getvalue()
        output.close()

        # Save to file (in production, would upload to S3/storage)
        file_path = f"/tmp/export_{org_id}_{datetime.utcnow().timestamp()}.csv"
        with open(file_path, "w") as f:
            f.write(csv_content)

        return {
            "url": f"/exports/{file_path.split('/')[-1]}",
            "size": len(csv_content),
            "content_type": "text/csv",
        }

    async def _generate_pdf(
        self, data: AnalyticsDashboard, org_id: str
    ) -> Dict[str, Any]:
        """
        Generate PDF report from dashboard data.

        Args:
            data: Dashboard data
            org_id: Organization ID

        Returns:
            File information
        """
        # Create PDF
        file_path = f"/tmp/export_{org_id}_{datetime.utcnow().timestamp()}.pdf"
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )

        # Container for flowables
        story = []

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#1a1a1a"),
            spaceAfter=30,
            alignment=TA_CENTER,
        )

        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=16,
            textColor=colors.HexColor("#333333"),
            spaceAfter=12,
        )

        # Title
        story.append(Paragraph("War Room Analytics Report", title_style))
        story.append(Spacer(1, 12))

        # Metadata
        metadata = [
            ["Organization ID", org_id],
            ["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
            [
                "Report Period",
                data.volunteer_metrics.total
                if hasattr(data, "period")
                else "Last 30 Days",
            ],
        ]

        metadata_table = Table(metadata, colWidths=[2 * inch, 4 * inch])
        metadata_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.grey),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ]
            )
        )
        story.append(metadata_table)
        story.append(Spacer(1, 20))

        # Volunteer Metrics Section
        story.append(Paragraph("Volunteer Metrics", heading_style))

        volunteer_data = [
            ["Metric", "Value"],
            ["Total Volunteers", str(data.volunteer_metrics.total)],
            ["Active Volunteers", str(data.volunteer_metrics.active)],
            ["Inactive Volunteers", str(data.volunteer_metrics.inactive)],
            ["Growth Rate", f"{data.volunteer_metrics.growth_rate:.2f}%"],
        ]

        volunteer_table = Table(volunteer_data, colWidths=[3 * inch, 3 * inch])
        volunteer_table.setStyle(self._get_table_style())
        story.append(volunteer_table)
        story.append(Spacer(1, 20))

        # Event Metrics Section
        story.append(Paragraph("Event Metrics", heading_style))

        event_data = [
            ["Metric", "Value"],
            ["Total Events", str(data.event_metrics.total)],
            ["Upcoming Events", str(data.event_metrics.upcoming)],
            ["Completed Events", str(data.event_metrics.completed)],
            ["Average Attendance", f"{data.event_metrics.avg_attendance:.1f}"],
        ]

        event_table = Table(event_data, colWidths=[3 * inch, 3 * inch])
        event_table.setStyle(self._get_table_style())
        story.append(event_table)
        story.append(Spacer(1, 20))

        # Additional sections for reach and donation metrics
        if data.reach_metrics:
            story.append(Paragraph("Reach Metrics", heading_style))
            reach_data = [["Metric", "Value"]]
            for key, value in data.reach_metrics.items():
                reach_data.append([key.replace("_", " ").title(), str(value)])

            reach_table = Table(reach_data, colWidths=[3 * inch, 3 * inch])
            reach_table.setStyle(self._get_table_style())
            story.append(reach_table)
            story.append(Spacer(1, 20))

        # Build PDF
        doc.build(story)

        # Get file size
        import os

        file_size = os.path.getsize(file_path)

        return {
            "url": f"/exports/{file_path.split('/')[-1]}",
            "size": file_size,
            "content_type": "application/pdf",
        }

    def _get_table_style(self) -> TableStyle:
        """Get standard table style for PDF."""
        return TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )

    async def get_export_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get export job status.

        Args:
            job_id: Export job ID

        Returns:
            Job information or None
        """
        return await cache_service.get(f"export:job:{job_id}")

    async def export_time_series_csv(
        self,
        org_id: str,
        metric_type: str,
        date_range: DateRangeEnum,
        data_points: List[Dict[str, Any]],
    ) -> str:
        """
        Export time series data to CSV.

        Args:
            org_id: Organization ID
            metric_type: Type of metric
            date_range: Date range
            data_points: Time series data points

        Returns:
            CSV content as string
        """
        df = pd.DataFrame(data_points)

        # Add metadata columns
        df["org_id"] = org_id
        df["metric_type"] = metric_type
        df["export_date"] = datetime.utcnow()

        # Convert to CSV
        return df.to_csv(index=False)


# Singleton instance
export_service = ExportService()
