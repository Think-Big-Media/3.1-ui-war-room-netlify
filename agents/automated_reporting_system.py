"""Automated Reporting System for War Room Knowledge Manager

Advanced reporting system that generates comprehensive insights, trends analysis,
and automated reports for the War Room knowledge base and agent activities.
"""

import asyncio
import json
import logging
import csv
import io
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import pandas as pd
import numpy as np
from jinja2 import Template, Environment, FileSystemLoader
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# Import knowledge manager components
from pieces_knowledge_manager import (
    KnowledgePattern, KnowledgeCategory, PatternPriority, 
    KnowledgeInsight, WeeklyReport, RecommendationType
)

logger = logging.getLogger(__name__)

@dataclass
class ReportConfiguration:
    """Configuration for automated reports"""
    report_type: str
    frequency: str  # daily, weekly, monthly
    recipients: List[str]
    include_charts: bool = True
    include_raw_data: bool = False
    format: str = "html"  # html, pdf, json
    template_name: Optional[str] = None
    filters: Dict[str, Any] = field(default_factory=dict)
    custom_metrics: List[str] = field(default_factory=list)

@dataclass
class ReportMetric:
    """Individual metric for reports"""
    name: str
    value: Union[int, float, str]
    change_from_previous: Optional[float] = None
    trend_direction: Optional[str] = None
    description: str = ""
    chart_data: Optional[List[Any]] = None

@dataclass
class ReportSection:
    """Section within a report"""
    title: str
    description: str
    metrics: List[ReportMetric]
    charts: List[str] = field(default_factory=list)
    insights: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

@dataclass 
class GeneratedReport:
    """Complete generated report"""
    report_id: str
    report_type: str
    title: str
    generated_at: datetime
    time_period: Dict[str, datetime]
    sections: List[ReportSection]
    summary: Dict[str, Any]
    attachments: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

class AutomatedReportingSystem:
    """Comprehensive automated reporting system"""
    
    def __init__(self, knowledge_manager, output_dir: str = "reports"):
        self.knowledge_manager = knowledge_manager
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Report configurations
        self.report_configs: Dict[str, ReportConfiguration] = {}
        self.scheduled_reports: Dict[str, asyncio.Task] = {}
        
        # Template system
        self.template_dir = self.output_dir / "templates"
        self.template_dir.mkdir(exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(str(self.template_dir)))
        
        # Chart configuration
        self.chart_style = "whitegrid"
        self.color_palette = ["#2E86AB", "#A23B72", "#F18F01", "#C73E1D", "#7209B7"]
        plt.style.use('seaborn-v0_8')
        sns.set_palette(self.color_palette)
        
        # Email configuration (optional)
        self.smtp_config = {}
        
        # Statistics
        self.stats = {
            "reports_generated": 0,
            "reports_sent": 0,
            "reports_failed": 0,
            "charts_created": 0,
            "last_generation": None
        }
        
        # Initialize components
        self._initialize_reporting_system()
    
    def _initialize_reporting_system(self):
        """Initialize the reporting system"""
        logger.info("Initializing Automated Reporting System...")
        
        # Create default report templates
        self._create_default_templates()
        
        # Set up default report configurations
        self._setup_default_reports()
        
        logger.info("Automated Reporting System initialized successfully")
    
    def _create_default_templates(self):
        """Create default report templates"""
        # HTML template for weekly reports
        html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>{{ report.title }}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            background-color: #f8f9fa;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 20px; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .section { 
            background: white;
            margin: 20px 0; 
            padding: 20px; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric { 
            display: inline-block; 
            margin: 10px; 
            padding: 15px; 
            background: #f8f9fa;
            border-radius: 6px;
            min-width: 150px;
        }
        .metric-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2E86AB;
        }
        .metric-name { 
            font-size: 12px; 
            color: #666; 
            text-transform: uppercase;
        }
        .trend-up { color: #28a745; }
        .trend-down { color: #dc3545; }
        .trend-stable { color: #6c757d; }
        .chart-container { 
            text-align: center; 
            margin: 20px 0; 
        }
        .insights { 
            background: #e3f2fd; 
            padding: 15px; 
            border-left: 4px solid #2196f3;
            margin: 15px 0;
        }
        .recommendations { 
            background: #f3e5f5; 
            padding: 15px; 
            border-left: 4px solid #9c27b0;
            margin: 15px 0;
        }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ report.title }}</h1>
        <p>Generated: {{ report.generated_at.strftime('%Y-%m-%d %H:%M:%S') }}</p>
        <p>Period: {{ report.time_period.start.strftime('%Y-%m-%d') }} to {{ report.time_period.end.strftime('%Y-%m-%d') }}</p>
    </div>
    
    {% for section in report.sections %}
    <div class="section">
        <h2>{{ section.title }}</h2>
        <p>{{ section.description }}</p>
        
        <div class="metrics">
            {% for metric in section.metrics %}
            <div class="metric">
                <div class="metric-value 
                    {% if metric.trend_direction == 'up' %}trend-up{% endif %}
                    {% if metric.trend_direction == 'down' %}trend-down{% endif %}
                    {% if metric.trend_direction == 'stable' %}trend-stable{% endif %}
                ">
                    {{ metric.value }}
                    {% if metric.change_from_previous %}
                        <span style="font-size: 14px;">
                            ({{ '+' if metric.change_from_previous > 0 else '' }}{{ "%.1f"|format(metric.change_from_previous) }}%)
                        </span>
                    {% endif %}
                </div>
                <div class="metric-name">{{ metric.name }}</div>
                {% if metric.description %}
                    <div style="font-size: 11px; color: #999; margin-top: 5px;">{{ metric.description }}</div>
                {% endif %}
            </div>
            {% endfor %}
        </div>
        
        {% for chart in section.charts %}
        <div class="chart-container">
            <img src="{{ chart }}" alt="Chart" style="max-width: 100%; height: auto;">
        </div>
        {% endfor %}
        
        {% if section.insights %}
        <div class="insights">
            <h4>Key Insights</h4>
            <ul>
                {% for insight in section.insights %}
                <li>{{ insight }}</li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}
        
        {% if section.recommendations %}
        <div class="recommendations">
            <h4>Recommendations</h4>
            <ul>
                {% for recommendation in section.recommendations %}
                <li>{{ recommendation }}</li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}
    </div>
    {% endfor %}
    
    <div class="section">
        <h2>Report Summary</h2>
        <ul>
            {% for key, value in report.summary.items() %}
            <li><strong>{{ key|title|replace('_', ' ') }}:</strong> {{ value }}</li>
            {% endfor %}
        </ul>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
        Generated by War Room Pieces Knowledge Manager - {{ report.generated_at.strftime('%Y-%m-%d %H:%M:%S') }}
    </div>
</body>
</html>
        """
        
        template_path = self.template_dir / "weekly_report.html"
        with open(template_path, 'w') as f:
            f.write(html_template.strip())
        
        # JSON template for API consumption
        json_template = """
{
    "report_id": "{{ report.report_id }}",
    "report_type": "{{ report.report_type }}",
    "title": "{{ report.title }}",
    "generated_at": "{{ report.generated_at.isoformat() }}",
    "time_period": {
        "start": "{{ report.time_period.start.isoformat() }}",
        "end": "{{ report.time_period.end.isoformat() }}"
    },
    "sections": [
        {% for section in report.sections %}
        {
            "title": "{{ section.title }}",
            "description": "{{ section.description }}",
            "metrics": [
                {% for metric in section.metrics %}
                {
                    "name": "{{ metric.name }}",
                    "value": {{ metric.value | tojson }},
                    "change_from_previous": {{ metric.change_from_previous | tojson }},
                    "trend_direction": {{ metric.trend_direction | tojson }},
                    "description": "{{ metric.description }}"
                }{% if not loop.last %},{% endif %}
                {% endfor %}
            ],
            "insights": {{ section.insights | tojson }},
            "recommendations": {{ section.recommendations | tojson }}
        }{% if not loop.last %},{% endif %}
        {% endfor %}
    ],
    "summary": {{ report.summary | tojson }},
    "metadata": {{ report.metadata | tojson }}
}
        """
        
        json_template_path = self.template_dir / "report.json"
        with open(json_template_path, 'w') as f:
            f.write(json_template.strip())
        
        logger.info("Created default report templates")
    
    def _setup_default_reports(self):
        """Setup default report configurations"""
        # Weekly knowledge report
        weekly_config = ReportConfiguration(
            report_type="weekly_knowledge_summary",
            frequency="weekly",
            recipients=["team@warroom.dev"],
            include_charts=True,
            include_raw_data=False,
            format="html",
            template_name="weekly_report.html",
            custom_metrics=["pattern_growth_rate", "recommendation_accuracy", "agent_activity"]
        )
        self.add_report_configuration("weekly_knowledge", weekly_config)
        
        # Daily activity report
        daily_config = ReportConfiguration(
            report_type="daily_activity",
            frequency="daily", 
            recipients=["dev-leads@warroom.dev"],
            include_charts=False,
            include_raw_data=True,
            format="json",
            template_name="report.json"
        )
        self.add_report_configuration("daily_activity", daily_config)
        
        # Monthly trend analysis
        monthly_config = ReportConfiguration(
            report_type="monthly_trends",
            frequency="monthly",
            recipients=["management@warroom.dev"],
            include_charts=True,
            include_raw_data=False,
            format="html",
            template_name="weekly_report.html",  # Reuse template
            custom_metrics=["knowledge_base_growth", "pattern_effectiveness", "agent_collaboration"]
        )
        self.add_report_configuration("monthly_trends", monthly_config)
        
        logger.info("Setup default report configurations")
    
    def add_report_configuration(self, config_id: str, config: ReportConfiguration):
        """Add a new report configuration"""
        self.report_configs[config_id] = config
        logger.info(f"Added report configuration: {config_id}")
    
    async def start_scheduled_reporting(self):
        """Start all scheduled reports"""
        logger.info("Starting scheduled reporting...")
        
        for config_id, config in self.report_configs.items():
            task = asyncio.create_task(self._schedule_report(config_id, config))
            self.scheduled_reports[config_id] = task
        
        logger.info(f"Started {len(self.scheduled_reports)} scheduled reports")
    
    async def stop_scheduled_reporting(self):
        """Stop all scheduled reports"""
        logger.info("Stopping scheduled reporting...")
        
        for config_id, task in self.scheduled_reports.items():
            task.cancel()
        
        self.scheduled_reports.clear()
        logger.info("Scheduled reporting stopped")
    
    async def _schedule_report(self, config_id: str, config: ReportConfiguration):
        """Schedule a recurring report"""
        while True:
            try:
                # Calculate next run time based on frequency
                if config.frequency == "daily":
                    wait_seconds = 24 * 3600  # 24 hours
                elif config.frequency == "weekly":
                    wait_seconds = 7 * 24 * 3600  # 7 days
                elif config.frequency == "monthly":
                    wait_seconds = 30 * 24 * 3600  # 30 days
                else:
                    wait_seconds = 3600  # Default to 1 hour
                
                # Wait for next scheduled time
                await asyncio.sleep(wait_seconds)
                
                # Generate and send report
                report = await self.generate_report(config_id)
                if report:
                    await self.send_report(report, config.recipients)
                
            except asyncio.CancelledError:
                logger.info(f"Scheduled report {config_id} cancelled")
                break
            except Exception as e:
                logger.error(f"Error in scheduled report {config_id}: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes before retry
    
    async def generate_report(self, config_id: str, custom_time_period: Optional[Dict[str, datetime]] = None) -> Optional[GeneratedReport]:
        """Generate a report based on configuration"""
        try:
            config = self.report_configs.get(config_id)
            if not config:
                logger.error(f"Report configuration not found: {config_id}")
                return None
            
            logger.info(f"Generating report: {config_id}")
            
            # Determine time period
            if custom_time_period:
                time_period = custom_time_period
            else:
                time_period = self._calculate_time_period(config.frequency)
            
            # Generate report sections based on type
            sections = []
            
            if config.report_type == "weekly_knowledge_summary":
                sections = await self._generate_weekly_knowledge_sections(time_period, config)
            elif config.report_type == "daily_activity":
                sections = await self._generate_daily_activity_sections(time_period, config)
            elif config.report_type == "monthly_trends":
                sections = await self._generate_monthly_trend_sections(time_period, config)
            else:
                # Generic report
                sections = await self._generate_generic_sections(time_period, config)
            
            # Generate summary
            summary = await self._generate_report_summary(sections, time_period)
            
            # Create report object
            report = GeneratedReport(
                report_id=f"{config_id}_{int(datetime.utcnow().timestamp())}",
                report_type=config.report_type,
                title=f"{config.report_type.replace('_', ' ').title()} Report",
                generated_at=datetime.utcnow(),
                time_period=time_period,
                sections=sections,
                summary=summary,
                metadata={
                    "config_id": config_id,
                    "generation_duration": "calculated_later"
                }
            )
            
            # Generate charts if requested
            if config.include_charts:
                await self._generate_report_charts(report)
            
            # Save report
            report_path = await self._save_report(report, config)
            report.attachments = [report_path] if report_path else []
            
            self.stats["reports_generated"] += 1
            self.stats["last_generation"] = datetime.utcnow().isoformat()
            
            logger.info(f"Successfully generated report: {report.report_id}")
            return report
            
        except Exception as e:
            logger.error(f"Report generation failed for {config_id}: {e}")
            self.stats["reports_failed"] += 1
            return None
    
    def _calculate_time_period(self, frequency: str) -> Dict[str, datetime]:
        """Calculate time period for report"""
        end_time = datetime.utcnow()
        
        if frequency == "daily":
            start_time = end_time - timedelta(days=1)
        elif frequency == "weekly":
            start_time = end_time - timedelta(weeks=1)
        elif frequency == "monthly":
            start_time = end_time - timedelta(days=30)
        else:
            start_time = end_time - timedelta(days=1)
        
        return {"start": start_time, "end": end_time}
    
    async def _generate_weekly_knowledge_sections(self, time_period: Dict[str, datetime], config: ReportConfiguration) -> List[ReportSection]:
        """Generate sections for weekly knowledge report"""
        sections = []
        
        # Knowledge Base Overview Section
        overview_section = await self._create_knowledge_overview_section(time_period)
        sections.append(overview_section)
        
        # Pattern Activity Section
        activity_section = await self._create_pattern_activity_section(time_period)
        sections.append(activity_section)
        
        # Agent Collaboration Section
        collaboration_section = await self._create_agent_collaboration_section(time_period)
        sections.append(collaboration_section)
        
        # Quality Insights Section
        quality_section = await self._create_quality_insights_section(time_period)
        sections.append(quality_section)
        
        # Recommendations Section
        recommendations_section = await self._create_recommendations_section(time_period)
        sections.append(recommendations_section)
        
        return sections
    
    async def _generate_daily_activity_sections(self, time_period: Dict[str, datetime], config: ReportConfiguration) -> List[ReportSection]:
        """Generate sections for daily activity report"""
        sections = []
        
        # Daily Metrics Section
        metrics_section = await self._create_daily_metrics_section(time_period)
        sections.append(metrics_section)
        
        # Pattern Updates Section
        updates_section = await self._create_pattern_updates_section(time_period)
        sections.append(updates_section)
        
        return sections
    
    async def _generate_monthly_trend_sections(self, time_period: Dict[str, datetime], config: ReportConfiguration) -> List[ReportSection]:
        """Generate sections for monthly trend report"""
        sections = []
        
        # Growth Trends Section
        growth_section = await self._create_growth_trends_section(time_period)
        sections.append(growth_section)
        
        # Usage Patterns Section
        usage_section = await self._create_usage_patterns_section(time_period)
        sections.append(usage_section)
        
        # Success Analytics Section
        success_section = await self._create_success_analytics_section(time_period)
        sections.append(success_section)
        
        return sections
    
    async def _generate_generic_sections(self, time_period: Dict[str, datetime], config: ReportConfiguration) -> List[ReportSection]:
        """Generate generic report sections"""
        sections = []
        
        # Basic metrics section
        basic_section = await self._create_basic_metrics_section(time_period)
        sections.append(basic_section)
        
        return sections
    
    # Section creation methods
    
    async def _create_knowledge_overview_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create knowledge base overview section"""
        try:
            # Get knowledge manager stats
            stats = self.knowledge_manager.get_knowledge_statistics()
            
            metrics = [
                ReportMetric(
                    name="Total Patterns",
                    value=stats.get("total_patterns", 0),
                    description="Total patterns in knowledge base"
                ),
                ReportMetric(
                    name="Pattern Categories",
                    value=len(stats.get("patterns_by_category", {})),
                    description="Number of pattern categories"
                ),
                ReportMetric(
                    name="Average Confidence",
                    value=f"{stats.get('average_confidence', 0):.2f}",
                    description="Average confidence score of patterns"
                ),
                ReportMetric(
                    name="Active Agents",
                    value=len(stats.get("patterns_by_agent", {})),
                    description="Number of contributing agents"
                )
            ]
            
            insights = [
                f"Knowledge base contains {stats.get('total_patterns', 0)} patterns across {len(stats.get('patterns_by_category', {}))} categories",
                f"Average pattern confidence is {stats.get('average_confidence', 0):.2%}",
                "Knowledge base is actively maintained by multiple agents"
            ]
            
            recommendations = [
                "Continue expanding pattern coverage in underrepresented categories",
                "Focus on improving patterns with low confidence scores",
                "Encourage more cross-agent knowledge sharing"
            ]
            
            return ReportSection(
                title="Knowledge Base Overview",
                description="Current state of the War Room knowledge base",
                metrics=metrics,
                insights=insights,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error creating knowledge overview section: {e}")
            return ReportSection(
                title="Knowledge Base Overview",
                description="Error generating overview",
                metrics=[],
                insights=["Failed to generate overview"],
                recommendations=[]
            )
    
    async def _create_pattern_activity_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create pattern activity section"""
        try:
            # Filter patterns by time period
            patterns = [
                p for p in self.knowledge_manager.knowledge_patterns.values()
                if time_period["start"] <= p.created_at <= time_period["end"]
            ]
            
            # Calculate metrics
            new_patterns = len(patterns)
            total_usage = sum(p.usage_frequency for p in patterns)
            avg_confidence = sum(p.confidence_score for p in patterns) / len(patterns) if patterns else 0
            
            # Category breakdown
            category_counts = {}
            for pattern in patterns:
                category = pattern.category.value
                category_counts[category] = category_counts.get(category, 0) + 1
            
            most_active_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else "None"
            
            metrics = [
                ReportMetric(
                    name="New Patterns",
                    value=new_patterns,
                    description="Patterns added in this period"
                ),
                ReportMetric(
                    name="Total Usage",
                    value=total_usage,
                    description="Total pattern usage in period"
                ),
                ReportMetric(
                    name="Average Confidence",
                    value=f"{avg_confidence:.2f}",
                    description="Average confidence of new patterns"
                ),
                ReportMetric(
                    name="Most Active Category",
                    value=most_active_category.replace('_', ' ').title(),
                    description="Category with most activity"
                )
            ]
            
            insights = [
                f"Added {new_patterns} new patterns in the reporting period",
                f"Most activity in {most_active_category.replace('_', ' ')} category",
                f"Average confidence of new patterns: {avg_confidence:.2%}"
            ]
            
            recommendations = []
            if new_patterns < 5:
                recommendations.append("Consider increasing pattern capture rate")
            if avg_confidence < 0.6:
                recommendations.append("Focus on improving pattern quality and validation")
            
            return ReportSection(
                title="Pattern Activity",
                description=f"Pattern activity from {time_period['start'].strftime('%Y-%m-%d')} to {time_period['end'].strftime('%Y-%m-%d')}",
                metrics=metrics,
                insights=insights,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error creating pattern activity section: {e}")
            return ReportSection(
                title="Pattern Activity",
                description="Error generating activity report",
                metrics=[],
                insights=["Failed to generate activity data"],
                recommendations=[]
            )
    
    async def _create_agent_collaboration_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create agent collaboration section"""
        try:
            stats = self.knowledge_manager.get_knowledge_statistics()
            agent_stats = stats.get("patterns_by_agent", {})
            
            total_agents = len(agent_stats)
            most_active_agent = max(agent_stats.items(), key=lambda x: x[1])[0] if agent_stats else "None"
            total_contributions = sum(agent_stats.values())
            
            metrics = [
                ReportMetric(
                    name="Active Agents",
                    value=total_agents,
                    description="Agents contributing patterns"
                ),
                ReportMetric(
                    name="Most Active Agent",
                    value=most_active_agent,
                    description="Agent with most contributions"
                ),
                ReportMetric(
                    name="Total Contributions",
                    value=total_contributions,
                    description="Total pattern contributions"
                ),
                ReportMetric(
                    name="Avg per Agent",
                    value=f"{total_contributions / total_agents:.1f}" if total_agents > 0 else "0",
                    description="Average contributions per agent"
                )
            ]
            
            insights = [
                f"Knowledge sharing involves {total_agents} active agents",
                f"{most_active_agent} is the most active contributor",
                "Good collaboration across multiple agents"
            ]
            
            recommendations = [
                "Encourage less active agents to contribute more patterns",
                "Create knowledge sharing incentives",
                "Regular collaboration reviews"
            ]
            
            return ReportSection(
                title="Agent Collaboration",
                description="Inter-agent knowledge sharing analysis",
                metrics=metrics,
                insights=insights,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error creating collaboration section: {e}")
            return ReportSection(
                title="Agent Collaboration",
                description="Error generating collaboration data",
                metrics=[],
                insights=["Failed to generate collaboration data"],
                recommendations=[]
            )
    
    async def _create_quality_insights_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create quality insights section"""
        try:
            # Analyze pattern quality
            all_patterns = list(self.knowledge_manager.knowledge_patterns.values())
            
            # Success rates
            patterns_with_usage = [p for p in all_patterns if (p.success_count + p.failure_count) > 0]
            if patterns_with_usage:
                success_rates = [
                    p.success_count / (p.success_count + p.failure_count) 
                    for p in patterns_with_usage
                ]
                avg_success_rate = sum(success_rates) / len(success_rates)
                high_quality_patterns = len([r for r in success_rates if r > 0.8])
            else:
                avg_success_rate = 0
                high_quality_patterns = 0
            
            # Confidence analysis
            avg_confidence = sum(p.confidence_score for p in all_patterns) / len(all_patterns) if all_patterns else 0
            high_confidence_patterns = len([p for p in all_patterns if p.confidence_score > 0.8])
            
            metrics = [
                ReportMetric(
                    name="Success Rate",
                    value=f"{avg_success_rate:.2%}",
                    description="Average pattern success rate"
                ),
                ReportMetric(
                    name="High Quality Patterns",
                    value=high_quality_patterns,
                    description="Patterns with >80% success rate"
                ),
                ReportMetric(
                    name="Confidence Score",
                    value=f"{avg_confidence:.2f}",
                    description="Average pattern confidence"
                ),
                ReportMetric(
                    name="High Confidence",
                    value=high_confidence_patterns,
                    description="Patterns with >0.8 confidence"
                )
            ]
            
            insights = [
                f"Overall pattern success rate is {avg_success_rate:.1%}",
                f"{high_quality_patterns} patterns have excellent success rates (>80%)",
                f"Average confidence score is {avg_confidence:.2f}"
            ]
            
            recommendations = []
            if avg_success_rate < 0.7:
                recommendations.append("Focus on improving pattern effectiveness")
            if avg_confidence < 0.6:
                recommendations.append("Enhance pattern validation processes")
            recommendations.append("Continue monitoring pattern quality metrics")
            
            return ReportSection(
                title="Quality Insights",
                description="Pattern quality and effectiveness analysis",
                metrics=metrics,
                insights=insights,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error creating quality insights section: {e}")
            return ReportSection(
                title="Quality Insights",
                description="Error generating quality data",
                metrics=[],
                insights=["Failed to generate quality insights"],
                recommendations=[]
            )
    
    async def _create_recommendations_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create recommendations section"""
        try:
            stats = self.knowledge_manager.stats
            
            # Generate strategic recommendations based on data
            recommendations = []
            insights = []
            
            # Pattern growth recommendations
            total_patterns = stats.get("total_patterns", 0)
            if total_patterns < 100:
                recommendations.append("Focus on expanding pattern coverage - target 100+ patterns")
            elif total_patterns > 500:
                recommendations.append("Consider pattern curation and archival of obsolete patterns")
            
            # Category balance recommendations
            patterns_by_category = stats.get("patterns_by_category", {})
            if patterns_by_category:
                category_counts = list(patterns_by_category.values())
                if max(category_counts) / min(category_counts) > 5:
                    recommendations.append("Balance pattern distribution across categories")
            
            # Agent engagement recommendations
            successful_recs = stats.get("successful_recommendations", 0)
            failed_recs = stats.get("failed_recommendations", 0)
            total_recs = successful_recs + failed_recs
            
            if total_recs > 0:
                success_rate = successful_recs / total_recs
                if success_rate < 0.7:
                    recommendations.append("Improve recommendation algorithm accuracy")
                insights.append(f"Recommendation success rate: {success_rate:.1%}")
            
            # General insights
            insights.extend([
                "Knowledge base is actively growing and being utilized",
                "Pattern quality metrics show positive trends",
                "Agent collaboration is functioning well"
            ])
            
            # Default recommendations
            if not recommendations:
                recommendations.extend([
                    "Continue current knowledge management practices",
                    "Monitor pattern usage and effectiveness",
                    "Encourage agent participation in knowledge sharing"
                ])
            
            metrics = [
                ReportMetric(
                    name="Action Items",
                    value=len(recommendations),
                    description="Strategic recommendations generated"
                ),
                ReportMetric(
                    name="Insights Generated",
                    value=len(insights),
                    description="Key insights from analysis"
                )
            ]
            
            return ReportSection(
                title="Strategic Recommendations",
                description="Data-driven recommendations for knowledge management",
                metrics=metrics,
                insights=insights,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error creating recommendations section: {e}")
            return ReportSection(
                title="Strategic Recommendations",
                description="Error generating recommendations",
                metrics=[],
                insights=["Failed to generate strategic insights"],
                recommendations=["Review data collection and analysis methods"]
            )
    
    # Additional section methods for other report types...
    
    async def _create_daily_metrics_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create daily metrics section"""
        # Simplified daily metrics
        stats = self.knowledge_manager.get_knowledge_statistics()
        
        metrics = [
            ReportMetric(
                name="Total Patterns",
                value=stats.get("total_patterns", 0),
                description="Current total patterns"
            ),
            ReportMetric(
                name="Categories",
                value=len(stats.get("patterns_by_category", {})),
                description="Pattern categories"
            )
        ]
        
        return ReportSection(
            title="Daily Metrics",
            description="Daily knowledge base metrics",
            metrics=metrics,
            insights=["Daily metrics captured"],
            recommendations=[]
        )
    
    async def _create_pattern_updates_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create pattern updates section"""
        # Get recent patterns
        recent_patterns = [
            p for p in self.knowledge_manager.knowledge_patterns.values()
            if time_period["start"] <= p.created_at <= time_period["end"]
        ]
        
        metrics = [
            ReportMetric(
                name="New Patterns",
                value=len(recent_patterns),
                description="Patterns added today"
            )
        ]
        
        insights = [f"{len(recent_patterns)} new patterns added"]
        
        return ReportSection(
            title="Pattern Updates",
            description="Recent pattern additions and changes",
            metrics=metrics,
            insights=insights,
            recommendations=[]
        )
    
    async def _create_basic_metrics_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create basic metrics section for generic reports"""
        stats = self.knowledge_manager.get_knowledge_statistics()
        
        metrics = [
            ReportMetric(
                name="Total Patterns",
                value=stats.get("total_patterns", 0),
                description="Total patterns in knowledge base"
            ),
            ReportMetric(
                name="Categories",
                value=len(stats.get("patterns_by_category", {})),
                description="Pattern categories"
            )
        ]
        
        return ReportSection(
            title="Basic Metrics",
            description="Basic knowledge base metrics",
            metrics=metrics,
            insights=["Basic metrics captured"],
            recommendations=[]
        )
    
    # Placeholder methods for additional section types
    async def _create_growth_trends_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create growth trends section"""
        # Implementation would analyze growth over time
        return ReportSection(
            title="Growth Trends",
            description="Knowledge base growth analysis",
            metrics=[],
            insights=["Growth trend analysis placeholder"],
            recommendations=[]
        )
    
    async def _create_usage_patterns_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create usage patterns section"""
        # Implementation would analyze usage patterns
        return ReportSection(
            title="Usage Patterns",
            description="Pattern usage analysis",
            metrics=[],
            insights=["Usage pattern analysis placeholder"],
            recommendations=[]
        )
    
    async def _create_success_analytics_section(self, time_period: Dict[str, datetime]) -> ReportSection:
        """Create success analytics section"""
        # Implementation would analyze success metrics
        return ReportSection(
            title="Success Analytics", 
            description="Pattern success analysis",
            metrics=[],
            insights=["Success analytics placeholder"],
            recommendations=[]
        )
    
    async def _generate_report_summary(self, sections: List[ReportSection], time_period: Dict[str, datetime]) -> Dict[str, Any]:
        """Generate report summary"""
        total_metrics = sum(len(section.metrics) for section in sections)
        total_insights = sum(len(section.insights) for section in sections)
        total_recommendations = sum(len(section.recommendations) for section in sections)
        
        return {
            "sections_generated": len(sections),
            "total_metrics": total_metrics,
            "total_insights": total_insights,
            "total_recommendations": total_recommendations,
            "report_period_days": (time_period["end"] - time_period["start"]).days,
            "generation_timestamp": datetime.utcnow().isoformat()
        }
    
    async def _generate_report_charts(self, report: GeneratedReport):
        """Generate charts for the report"""
        try:
            charts_dir = self.output_dir / "charts"
            charts_dir.mkdir(exist_ok=True)
            
            for section in report.sections:
                if section.metrics:
                    # Create metric chart
                    chart_path = await self._create_metrics_chart(
                        section.title,
                        section.metrics,
                        charts_dir / f"{report.report_id}_{section.title.lower().replace(' ', '_')}.png"
                    )
                    if chart_path:
                        section.charts.append(str(chart_path))
                        self.stats["charts_created"] += 1
            
            logger.info(f"Generated charts for report {report.report_id}")
            
        except Exception as e:
            logger.error(f"Chart generation failed: {e}")
    
    async def _create_metrics_chart(self, title: str, metrics: List[ReportMetric], output_path: Path) -> Optional[str]:
        """Create a chart for section metrics"""
        try:
            # Filter numeric metrics
            numeric_metrics = [m for m in metrics if isinstance(m.value, (int, float))]
            
            if not numeric_metrics:
                return None
            
            # Create chart
            fig, ax = plt.subplots(figsize=(10, 6))
            
            metric_names = [m.name for m in numeric_metrics]
            metric_values = [float(m.value) for m in numeric_metrics]
            
            bars = ax.bar(metric_names, metric_values, color=self.color_palette[:len(metric_names)])
            
            # Customize chart
            ax.set_title(f"{title} - Metrics", fontsize=16, fontweight='bold')
            ax.set_ylabel("Value", fontsize=12)
            plt.xticks(rotation=45, ha='right')
            
            # Add value labels on bars
            for bar, value in zip(bars, metric_values):
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(metric_values) * 0.01,
                       f'{value:,.0f}', ha='center', va='bottom', fontsize=10)
            
            plt.tight_layout()
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
            plt.close()
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating metrics chart: {e}")
            return None
    
    async def _save_report(self, report: GeneratedReport, config: ReportConfiguration) -> Optional[str]:
        """Save report to file"""
        try:
            # Determine file extension
            if config.format == "html":
                file_ext = "html"
                template_name = config.template_name or "weekly_report.html"
            elif config.format == "json":
                file_ext = "json"
                template_name = config.template_name or "report.json"
            else:
                file_ext = "txt"
                template_name = None
            
            # Generate filename
            filename = f"{report.report_id}.{file_ext}"
            file_path = self.output_dir / filename
            
            # Render content
            if template_name:
                template = self.jinja_env.get_template(template_name)
                content = template.render(report=report)
            else:
                # Fallback to JSON
                content = json.dumps(asdict(report), indent=2, default=str)
            
            # Save file
            with open(file_path, 'w') as f:
                f.write(content)
            
            logger.info(f"Saved report to: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error saving report: {e}")
            return None
    
    async def send_report(self, report: GeneratedReport, recipients: List[str]):
        """Send report to recipients"""
        try:
            if not self.smtp_config:
                logger.warning("SMTP not configured - report not sent")
                return False
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.smtp_config.get('sender', 'noreply@warroom.dev')
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = f"War Room Report: {report.title}"
            
            # Email body
            if report.attachments and report.attachments[0].endswith('.html'):
                # Send HTML content
                with open(report.attachments[0], 'r') as f:
                    html_content = f.read()
                msg.attach(MIMEText(html_content, 'html'))
            else:
                # Send text summary
                text_content = f"""
War Room Knowledge Management Report

Report: {report.title}
Generated: {report.generated_at}
Period: {report.time_period['start']} to {report.time_period['end']}

Summary:
{json.dumps(report.summary, indent=2)}

This is an automated report from the War Room Pieces Knowledge Manager.
                """.strip()
                msg.attach(MIMEText(text_content, 'plain'))
            
            # Add attachments
            for attachment_path in report.attachments:
                if Path(attachment_path).exists():
                    with open(attachment_path, 'rb') as f:
                        attach = MIMEBase('application', 'octet-stream')
                        attach.set_payload(f.read())
                        encoders.encode_base64(attach)
                        attach.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {Path(attachment_path).name}'
                        )
                        msg.attach(attach)
            
            # Send email
            server = smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port'])
            if self.smtp_config.get('use_tls'):
                server.starttls()
            if self.smtp_config.get('username'):
                server.login(self.smtp_config['username'], self.smtp_config['password'])
            
            server.send_message(msg)
            server.quit()
            
            self.stats["reports_sent"] += 1
            logger.info(f"Report sent to {len(recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Error sending report: {e}")
            return False
    
    def configure_email(self, smtp_host: str, smtp_port: int, username: str = None, 
                       password: str = None, use_tls: bool = True, sender: str = None):
        """Configure email settings"""
        self.smtp_config = {
            'host': smtp_host,
            'port': smtp_port,
            'username': username,
            'password': password,
            'use_tls': use_tls,
            'sender': sender or 'noreply@warroom.dev'
        }
        logger.info("Email configuration updated")
    
    def get_reporting_statistics(self) -> Dict[str, Any]:
        """Get reporting system statistics"""
        return {
            **self.stats,
            "configured_reports": len(self.report_configs),
            "scheduled_reports": len(self.scheduled_reports),
            "template_directory": str(self.template_dir),
            "output_directory": str(self.output_dir)
        }

# Export main class
__all__ = ['AutomatedReportingSystem', 'ReportConfiguration', 'GeneratedReport']