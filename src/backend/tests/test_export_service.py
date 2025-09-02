"""
Unit tests for export service.
"""
import pytest
import csv
import io
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from PyPDF2 import PdfReader

from services.export_service import ExportService
from schemas.analytics import DateRangeEnum


class TestExportService:
    """Test suite for ExportService."""

    @pytest.fixture
    def export_service(self, test_cache_service):
        """Create export service instance."""
        with patch("app.services.export_service.AnalyticsService") as mock_analytics:
            service = ExportService(
                analytics_service=mock_analytics, cache_service=test_cache_service
            )
            return service

    @pytest.fixture
    def mock_dashboard_data(self, sample_analytics_data):
        """Mock dashboard data."""
        return sample_analytics_data

    @pytest.mark.asyncio
    async def test_export_csv_success(
        self,
        export_service,
        mock_dashboard_data,
        test_db_session,
    ):
        """Test successful CSV export."""
        org_id = "test-org-123"
        date_range = DateRangeEnum.LAST_30_DAYS

        # Mock analytics service response
        export_service.analytics_service.get_dashboard_overview = AsyncMock(
            return_value=Mock(dict=lambda: mock_dashboard_data)
        )

        # Export data
        result = await export_service.export_dashboard_data(
            test_db_session, org_id, date_range, format="csv"
        )

        # Verify result
        assert result["status"] == "processing"
        assert "job_id" in result
        assert result["format"] == "csv"

        # Get the job from cache
        job_id = result["job_id"]
        job_key = f"export:job:{job_id}"
        job_data = await export_service.cache_service.get(job_key)

        assert job_data is not None
        assert job_data["status"] == "processing"

    @pytest.mark.asyncio
    async def test_export_pdf_success(
        self,
        export_service,
        mock_dashboard_data,
        test_db_session,
    ):
        """Test successful PDF export."""
        org_id = "test-org-123"
        date_range = DateRangeEnum.LAST_30_DAYS

        # Mock analytics service response
        export_service.analytics_service.get_dashboard_overview = AsyncMock(
            return_value=Mock(dict=lambda: mock_dashboard_data)
        )

        # Export data
        result = await export_service.export_dashboard_data(
            test_db_session, org_id, date_range, format="pdf"
        )

        # Verify result
        assert result["status"] == "processing"
        assert result["format"] == "pdf"

    @pytest.mark.asyncio
    async def test_generate_csv(self, export_service, mock_dashboard_data):
        """Test CSV generation."""
        # Generate CSV
        csv_bytes = await export_service._generate_csv(mock_dashboard_data)

        # Parse CSV
        csv_file = io.StringIO(csv_bytes.decode("utf-8"))
        reader = csv.DictReader(csv_file)
        rows = list(reader)

        # Verify structure
        assert len(rows) > 0

        # Check overview section
        overview_rows = [r for r in rows if r.get("Section") == "Overview"]
        assert len(overview_rows) > 0

        # Check metrics exist
        metric_names = [r.get("Metric") for r in overview_rows]
        assert "Total Volunteers" in metric_names
        assert "Total Events" in metric_names
        assert "Total Donations" in metric_names

    @pytest.mark.asyncio
    async def test_generate_pdf(self, export_service, mock_dashboard_data):
        """Test PDF generation."""
        with patch("app.services.export_service.canvas.Canvas") as mock_canvas:
            # Mock canvas methods
            mock_canvas_instance = MagicMock()
            mock_canvas.return_value = mock_canvas_instance

            # Generate PDF
            pdf_bytes = await export_service._generate_pdf(mock_dashboard_data)

            # Verify canvas methods were called
            assert mock_canvas_instance.setTitle.called
            assert mock_canvas_instance.drawString.called
            assert mock_canvas_instance.save.called

    @pytest.mark.asyncio
    async def test_process_export_job_csv(
        self,
        export_service,
        mock_dashboard_data,
        test_db_session,
    ):
        """Test processing CSV export job."""
        job_id = "test-job-123"
        org_id = "test-org-123"

        # Mock analytics service
        export_service.analytics_service.get_dashboard_overview = AsyncMock(
            return_value=Mock(dict=lambda: mock_dashboard_data)
        )

        # Process job
        with patch.object(
            export_service,
            "_upload_to_storage",
            return_value="https://example.com/export.csv",
        ):
            await export_service._process_export_job(
                job_id, test_db_session, org_id, DateRangeEnum.LAST_30_DAYS, "csv"
            )

        # Check job status updated
        job_key = f"export:job:{job_id}"
        job_data = await export_service.cache_service.get(job_key)

        assert job_data["status"] == "completed"
        assert job_data["download_url"] == "https://example.com/export.csv"

    @pytest.mark.asyncio
    async def test_process_export_job_error(
        self,
        export_service,
        test_db_session,
    ):
        """Test export job error handling."""
        job_id = "test-job-123"
        org_id = "test-org-123"

        # Mock analytics service to raise error
        export_service.analytics_service.get_dashboard_overview = AsyncMock(
            side_effect=Exception("Analytics error")
        )

        # Process job
        await export_service._process_export_job(
            job_id, test_db_session, org_id, DateRangeEnum.LAST_30_DAYS, "csv"
        )

        # Check job status updated to failed
        job_key = f"export:job:{job_id}"
        job_data = await export_service.cache_service.get(job_key)

        assert job_data["status"] == "failed"
        assert "Analytics error" in job_data["error"]

    @pytest.mark.asyncio
    async def test_get_export_status(self, export_service):
        """Test getting export job status."""
        job_id = "test-job-123"
        job_data = {
            "status": "completed",
            "format": "csv",
            "download_url": "https://example.com/export.csv",
            "created_at": datetime.utcnow().isoformat(),
        }

        # Store job data
        job_key = f"export:job:{job_id}"
        await export_service.cache_service.set(job_key, job_data, expire=3600)

        # Get status
        result = await export_service.get_export_status(job_id)

        assert result == job_data

    @pytest.mark.asyncio
    async def test_get_export_status_not_found(self, export_service):
        """Test getting status for non-existent job."""
        result = await export_service.get_export_status("nonexistent-job")
        assert result is None

    @pytest.mark.asyncio
    async def test_upload_to_storage(self, export_service):
        """Test file upload to storage."""
        with patch("app.services.export_service.boto3.client") as mock_boto:
            # Mock S3 client
            mock_s3 = MagicMock()
            mock_boto.return_value = mock_s3

            # Upload file
            file_data = b"test data"
            filename = "test-export.csv"

            url = await export_service._upload_to_storage(file_data, filename)

            # For now, returns local path
            assert url == f"/exports/{filename}"

    @pytest.mark.asyncio
    async def test_concurrent_exports(self, export_service, test_db_session):
        """Test handling concurrent export requests."""
        org_id = "test-org-123"

        # Mock analytics service
        export_service.analytics_service.get_dashboard_overview = AsyncMock(
            return_value=Mock(dict=lambda: {"test": "data"})
        )

        # Start multiple exports
        jobs = []
        for i in range(3):
            result = await export_service.export_dashboard_data(
                test_db_session, org_id, DateRangeEnum.LAST_30_DAYS, format="csv"
            )
            jobs.append(result["job_id"])

        # Verify all jobs created
        assert len(jobs) == 3
        assert len(set(jobs)) == 3  # All unique job IDs

    @pytest.mark.asyncio
    async def test_export_data_validation(self, export_service, test_db_session):
        """Test export with invalid format."""
        with pytest.raises(ValueError) as exc_info:
            await export_service.export_dashboard_data(
                test_db_session, "org-123", DateRangeEnum.LAST_30_DAYS, format="invalid"
            )
        assert "Unsupported format" in str(exc_info.value)
