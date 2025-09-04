#!/usr/bin/env python3
"""
Monitoring and Reporting Dashboard for AMP Refactoring Specialist

This module provides comprehensive monitoring of optimization impact, success metrics,
and generates detailed reports for tracking the effectiveness of the AMP system.
"""

import json
import logging
import asyncio
import sqlite3
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)

@dataclass
class OptimizationMetric:
    """Represents a single optimization metric"""
    timestamp: str
    optimization_type: str
    file_path: str
    success: bool
    performance_impact: Dict[str, Any]
    before_score: float
    after_score: float
    execution_time: float
    error_message: Optional[str] = None

@dataclass
class DashboardSummary:
    """Summary statistics for the dashboard"""
    total_optimizations: int
    successful_optimizations: int
    success_rate: float
    average_performance_gain: float
    total_files_optimized: int
    optimization_types: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    top_performing_patterns: List[Dict[str, Any]]
    performance_trends: Dict[str, List[float]]

class MetricsDatabase:
    """Database for storing optimization metrics"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize the SQLite database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Optimizations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS optimizations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    optimization_type TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    success BOOLEAN NOT NULL,
                    before_score REAL,
                    after_score REAL,
                    performance_impact TEXT,
                    execution_time REAL,
                    error_message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Performance trends table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS performance_trends (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    metric_type TEXT NOT NULL,
                    metric_value REAL NOT NULL,
                    file_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Pattern usage table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS pattern_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern_id TEXT NOT NULL,
                    pattern_type TEXT NOT NULL,
                    usage_count INTEGER DEFAULT 1,
                    success_count INTEGER DEFAULT 0,
                    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                    average_impact REAL DEFAULT 0.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # System health table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_health (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    component TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
        
        logger.info(f"Metrics database initialized at {self.db_path}")
    
    async def record_optimization(self, metric: OptimizationMetric):
        """Record an optimization metric"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO optimizations 
                    (timestamp, optimization_type, file_path, success, before_score, 
                     after_score, performance_impact, execution_time, error_message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metric.timestamp,
                    metric.optimization_type,
                    metric.file_path,
                    metric.success,
                    metric.before_score,
                    metric.after_score,
                    json.dumps(metric.performance_impact),
                    metric.execution_time,
                    metric.error_message
                ))
                conn.commit()
            
            logger.debug(f"Recorded optimization metric for {metric.file_path}")
            
        except Exception as e:
            logger.error(f"Error recording optimization metric: {e}")
    
    async def get_optimization_metrics(self, days: int = 30) -> List[OptimizationMetric]:
        """Retrieve optimization metrics from the last N days"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT timestamp, optimization_type, file_path, success, before_score,
                           after_score, performance_impact, execution_time, error_message
                    FROM optimizations
                    WHERE timestamp > ?
                    ORDER BY timestamp DESC
                ''', (cutoff_date,))
                
                rows = cursor.fetchall()
                
                metrics = []
                for row in rows:
                    performance_impact = json.loads(row[6]) if row[6] else {}
                    
                    metric = OptimizationMetric(
                        timestamp=row[0],
                        optimization_type=row[1],
                        file_path=row[2],
                        success=bool(row[3]),
                        before_score=row[4] or 0.0,
                        after_score=row[5] or 0.0,
                        performance_impact=performance_impact,
                        execution_time=row[7] or 0.0,
                        error_message=row[8]
                    )
                    metrics.append(metric)
                
                return metrics
                
        except Exception as e:
            logger.error(f"Error retrieving optimization metrics: {e}")
            return []
    
    async def record_performance_trend(self, date: str, metric_type: str, value: float, file_count: int = 0):
        """Record a performance trend data point"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO performance_trends 
                    (date, metric_type, metric_value, file_count)
                    VALUES (?, ?, ?, ?)
                ''', (date, metric_type, value, file_count))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error recording performance trend: {e}")
    
    async def get_performance_trends(self, metric_type: str, days: int = 30) -> List[Tuple[str, float]]:
        """Get performance trend data"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT date, metric_value
                    FROM performance_trends
                    WHERE metric_type = ? AND date > ?
                    ORDER BY date ASC
                ''', (metric_type, cutoff_date))
                
                return cursor.fetchall()
                
        except Exception as e:
            logger.error(f"Error retrieving performance trends: {e}")
            return []
    
    async def update_pattern_usage(self, pattern_id: str, pattern_type: str, 
                                 success: bool, impact: float = 0.0):
        """Update pattern usage statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if pattern exists
                cursor.execute('''
                    SELECT usage_count, success_count, average_impact 
                    FROM pattern_usage WHERE pattern_id = ?
                ''', (pattern_id,))
                
                row = cursor.fetchone()
                
                if row:
                    # Update existing pattern
                    usage_count, success_count, avg_impact = row
                    new_usage_count = usage_count + 1
                    new_success_count = success_count + (1 if success else 0)
                    new_avg_impact = ((avg_impact * usage_count) + impact) / new_usage_count
                    
                    cursor.execute('''
                        UPDATE pattern_usage 
                        SET usage_count = ?, success_count = ?, average_impact = ?, last_used = ?
                        WHERE pattern_id = ?
                    ''', (new_usage_count, new_success_count, new_avg_impact, 
                         datetime.now().isoformat(), pattern_id))
                else:
                    # Insert new pattern
                    cursor.execute('''
                        INSERT INTO pattern_usage 
                        (pattern_id, pattern_type, usage_count, success_count, average_impact, last_used)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (pattern_id, pattern_type, 1, 1 if success else 0, impact, 
                         datetime.now().isoformat()))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error updating pattern usage: {e}")
    
    async def record_system_health(self, component: str, status: str, details: str = ""):
        """Record system health status"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO system_health (timestamp, component, status, details)
                    VALUES (?, ?, ?, ?)
                ''', (datetime.now().isoformat(), component, status, details))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error recording system health: {e}")

class PerformanceMonitor:
    """Monitors system performance and optimization effectiveness"""
    
    def __init__(self, war_room_path: Path, db: MetricsDatabase):
        self.war_room_path = war_room_path
        self.db = db
        self.monitoring_active = False
        
    async def start_monitoring(self):
        """Start continuous performance monitoring"""
        self.monitoring_active = True
        logger.info("Performance monitoring started")
        
        while self.monitoring_active:
            try:
                await self._collect_system_metrics()
                await self._check_system_health()
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in performance monitoring: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    def stop_monitoring(self):
        """Stop performance monitoring"""
        self.monitoring_active = False
        logger.info("Performance monitoring stopped")
    
    async def _collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # Calculate average optimization scores
            recent_metrics = await self.db.get_optimization_metrics(days=1)
            
            if recent_metrics:
                # Calculate daily averages
                successful_metrics = [m for m in recent_metrics if m.success]
                
                if successful_metrics:
                    avg_improvement = statistics.mean([
                        m.after_score - m.before_score 
                        for m in successful_metrics 
                        if m.after_score and m.before_score
                    ])
                    
                    # Record trend data
                    today = datetime.now().strftime('%Y-%m-%d')
                    await self.db.record_performance_trend(
                        today, "average_improvement", avg_improvement, len(successful_metrics)
                    )
                    
                    # Calculate success rate
                    success_rate = len(successful_metrics) / len(recent_metrics)
                    await self.db.record_performance_trend(
                        today, "success_rate", success_rate, len(recent_metrics)
                    )
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
    
    async def _check_system_health(self):
        """Check various system health indicators"""
        try:
            health_checks = []
            
            # Check if War Room path exists
            if self.war_room_path.exists():
                health_checks.append(("war_room_path", "healthy", "Path exists"))
            else:
                health_checks.append(("war_room_path", "error", "Path not found"))
            
            # Check components directory
            components_path = self.war_room_path / "src" / "components"
            if components_path.exists():
                component_count = len(list(components_path.rglob("*.tsx")))
                health_checks.append(("components", "healthy", f"{component_count} components found"))
            else:
                health_checks.append(("components", "warning", "Components directory not found"))
            
            # Check services directory
            services_path = self.war_room_path / "src" / "services"
            if services_path.exists():
                service_count = len(list(services_path.rglob("*.ts")))
                health_checks.append(("services", "healthy", f"{service_count} services found"))
            else:
                health_checks.append(("services", "warning", "Services directory not found"))
            
            # Check recent optimization success rate
            recent_metrics = await self.db.get_optimization_metrics(days=7)
            if recent_metrics:
                success_rate = len([m for m in recent_metrics if m.success]) / len(recent_metrics)
                if success_rate > 0.8:
                    health_checks.append(("optimization_success", "healthy", f"Success rate: {success_rate:.1%}"))
                elif success_rate > 0.6:
                    health_checks.append(("optimization_success", "warning", f"Success rate: {success_rate:.1%}"))
                else:
                    health_checks.append(("optimization_success", "error", f"Low success rate: {success_rate:.1%}"))
            
            # Record health status
            for component, status, details in health_checks:
                await self.db.record_system_health(component, status, details)
            
        except Exception as e:
            logger.error(f"Error checking system health: {e}")
            await self.db.record_system_health("health_check", "error", str(e))

class ReportGenerator:
    """Generates comprehensive reports and visualizations"""
    
    def __init__(self, db: MetricsDatabase, output_path: Path):
        self.db = db
        self.output_path = output_path
        self.output_path.mkdir(parents=True, exist_ok=True)
        
        # Set up matplotlib style
        plt.style.use('default')
        sns.set_palette("husl")
    
    async def generate_daily_report(self, date: Optional[str] = None) -> Dict[str, Any]:
        """Generate daily optimization report"""
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        report = {
            "date": date,
            "summary": {},
            "optimizations": [],
            "performance_trends": {},
            "recommendations": []
        }
        
        try:
            # Get metrics for the day
            start_date = datetime.strptime(date, '%Y-%m-%d')
            end_date = start_date + timedelta(days=1)
            
            all_metrics = await self.db.get_optimization_metrics(days=1)
            daily_metrics = [
                m for m in all_metrics 
                if start_date <= datetime.fromisoformat(m.timestamp) < end_date
            ]
            
            # Generate summary
            report["summary"] = self._generate_daily_summary(daily_metrics)
            
            # Add optimization details
            report["optimizations"] = [asdict(m) for m in daily_metrics]
            
            # Get performance trends
            trend_data = await self.db.get_performance_trends("average_improvement", days=7)
            report["performance_trends"]["improvement"] = trend_data
            
            success_data = await self.db.get_performance_trends("success_rate", days=7)
            report["performance_trends"]["success_rate"] = success_data
            
            # Generate recommendations
            report["recommendations"] = await self._generate_recommendations(daily_metrics)
            
            # Save report
            report_file = self.output_path / f"daily_report_{date}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"Generated daily report for {date}")
            
        except Exception as e:
            logger.error(f"Error generating daily report: {e}")
            report["error"] = str(e)
        
        return report
    
    async def generate_weekly_report(self) -> Dict[str, Any]:
        """Generate weekly optimization report with visualizations"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        report = {
            "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "summary": {},
            "trends": {},
            "top_patterns": [],
            "visualizations": []
        }
        
        try:
            # Get weekly metrics
            weekly_metrics = await self.db.get_optimization_metrics(days=7)
            
            # Generate summary
            report["summary"] = self._generate_weekly_summary(weekly_metrics)
            
            # Create visualizations
            viz_files = await self._create_weekly_visualizations(weekly_metrics)
            report["visualizations"] = viz_files
            
            # Get top patterns
            report["top_patterns"] = await self._get_top_patterns()
            
            # Save report
            report_file = self.output_path / f"weekly_report_{end_date.strftime('%Y%m%d')}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info("Generated weekly report with visualizations")
            
        except Exception as e:
            logger.error(f"Error generating weekly report: {e}")
            report["error"] = str(e)
        
        return report
    
    async def generate_performance_dashboard(self) -> str:
        """Generate HTML performance dashboard"""
        try:
            # Get recent metrics
            metrics = await self.db.get_optimization_metrics(days=30)
            
            # Generate dashboard data
            dashboard_data = {
                "summary": self._generate_dashboard_summary(metrics),
                "charts": await self._prepare_chart_data(metrics),
                "recent_activity": [asdict(m) for m in metrics[:10]],
                "health_status": await self._get_health_status()
            }
            
            # Generate HTML dashboard
            html_content = self._generate_dashboard_html(dashboard_data)
            
            # Save dashboard
            dashboard_file = self.output_path / "performance_dashboard.html"
            with open(dashboard_file, 'w') as f:
                f.write(html_content)
            
            logger.info(f"Generated performance dashboard: {dashboard_file}")
            return str(dashboard_file)
            
        except Exception as e:
            logger.error(f"Error generating performance dashboard: {e}")
            return ""
    
    def _generate_daily_summary(self, metrics: List[OptimizationMetric]) -> Dict[str, Any]:
        """Generate summary statistics for daily metrics"""
        if not metrics:
            return {"total": 0, "successful": 0, "success_rate": 0.0}
        
        successful = [m for m in metrics if m.success]
        
        summary = {
            "total_optimizations": len(metrics),
            "successful_optimizations": len(successful),
            "success_rate": len(successful) / len(metrics),
            "optimization_types": {},
            "average_improvement": 0.0,
            "total_execution_time": sum(m.execution_time for m in metrics)
        }
        
        # Count by type
        for metric in metrics:
            opt_type = metric.optimization_type
            if opt_type not in summary["optimization_types"]:
                summary["optimization_types"][opt_type] = {"total": 0, "successful": 0}
            summary["optimization_types"][opt_type]["total"] += 1
            if metric.success:
                summary["optimization_types"][opt_type]["successful"] += 1
        
        # Calculate average improvement
        improvements = [
            m.after_score - m.before_score 
            for m in successful 
            if m.after_score and m.before_score
        ]
        
        if improvements:
            summary["average_improvement"] = statistics.mean(improvements)
        
        return summary
    
    def _generate_weekly_summary(self, metrics: List[OptimizationMetric]) -> Dict[str, Any]:
        """Generate summary statistics for weekly metrics"""
        daily_summaries = {}
        
        # Group by day
        for metric in metrics:
            date = datetime.fromisoformat(metric.timestamp).strftime('%Y-%m-%d')
            if date not in daily_summaries:
                daily_summaries[date] = []
            daily_summaries[date].append(metric)
        
        # Calculate weekly stats
        weekly_summary = {
            "total_days_active": len(daily_summaries),
            "total_optimizations": len(metrics),
            "successful_optimizations": len([m for m in metrics if m.success]),
            "success_rate": len([m for m in metrics if m.success]) / len(metrics) if metrics else 0,
            "daily_averages": {},
            "trend_analysis": {},
            "most_optimized_files": self._get_most_optimized_files(metrics)
        }
        
        # Daily averages
        if daily_summaries:
            daily_totals = [len(day_metrics) for day_metrics in daily_summaries.values()]
            weekly_summary["daily_averages"]["optimizations_per_day"] = statistics.mean(daily_totals)
            
            daily_success_rates = [
                len([m for m in day_metrics if m.success]) / len(day_metrics)
                for day_metrics in daily_summaries.values()
            ]
            weekly_summary["daily_averages"]["success_rate"] = statistics.mean(daily_success_rates)
        
        return weekly_summary
    
    def _generate_dashboard_summary(self, metrics: List[OptimizationMetric]) -> DashboardSummary:
        """Generate comprehensive dashboard summary"""
        if not metrics:
            return DashboardSummary(
                total_optimizations=0,
                successful_optimizations=0,
                success_rate=0.0,
                average_performance_gain=0.0,
                total_files_optimized=0,
                optimization_types={},
                recent_activity=[],
                top_performing_patterns=[],
                performance_trends={}
            )
        
        successful_metrics = [m for m in metrics if m.success]
        unique_files = set(m.file_path for m in successful_metrics)
        
        # Count optimization types
        opt_types = defaultdict(int)
        for metric in metrics:
            opt_types[metric.optimization_type] += 1
        
        # Calculate performance gains
        performance_gains = []
        for metric in successful_metrics:
            if metric.after_score and metric.before_score:
                gain = ((metric.after_score - metric.before_score) / metric.before_score) * 100
                performance_gains.append(gain)
        
        avg_gain = statistics.mean(performance_gains) if performance_gains else 0.0
        
        # Recent activity (last 10)
        recent_activity = []
        for metric in metrics[:10]:
            recent_activity.append({
                "timestamp": metric.timestamp,
                "type": metric.optimization_type,
                "file": Path(metric.file_path).name,
                "success": metric.success,
                "improvement": metric.after_score - metric.before_score if metric.after_score and metric.before_score else 0
            })
        
        return DashboardSummary(
            total_optimizations=len(metrics),
            successful_optimizations=len(successful_metrics),
            success_rate=len(successful_metrics) / len(metrics),
            average_performance_gain=avg_gain,
            total_files_optimized=len(unique_files),
            optimization_types=dict(opt_types),
            recent_activity=recent_activity,
            top_performing_patterns=[],  # Will be populated by separate method
            performance_trends={}  # Will be populated by separate method
        )
    
    def _get_most_optimized_files(self, metrics: List[OptimizationMetric]) -> List[Dict[str, Any]]:
        """Get files that have been optimized most frequently"""
        file_counts = defaultdict(int)
        file_successes = defaultdict(int)
        
        for metric in metrics:
            file_counts[metric.file_path] += 1
            if metric.success:
                file_successes[metric.file_path] += 1
        
        # Sort by total optimizations
        sorted_files = sorted(file_counts.items(), key=lambda x: x[1], reverse=True)
        
        result = []
        for file_path, total in sorted_files[:10]:
            result.append({
                "file_path": file_path,
                "total_optimizations": total,
                "successful_optimizations": file_successes[file_path],
                "success_rate": file_successes[file_path] / total
            })
        
        return result
    
    async def _create_weekly_visualizations(self, metrics: List[OptimizationMetric]) -> List[str]:
        """Create visualization charts for weekly report"""
        viz_files = []
        
        try:
            # 1. Success rate over time
            daily_data = defaultdict(lambda: {"total": 0, "successful": 0})
            for metric in metrics:
                date = datetime.fromisoformat(metric.timestamp).strftime('%Y-%m-%d')
                daily_data[date]["total"] += 1
                if metric.success:
                    daily_data[date]["successful"] += 1
            
            dates = sorted(daily_data.keys())
            success_rates = [daily_data[date]["successful"] / daily_data[date]["total"] for date in dates]
            
            plt.figure(figsize=(12, 6))
            plt.plot(dates, success_rates, marker='o', linewidth=2, markersize=6)
            plt.title('Optimization Success Rate Over Time', fontsize=16, fontweight='bold')
            plt.xlabel('Date')
            plt.ylabel('Success Rate')
            plt.xticks(rotation=45)
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            
            success_chart = self.output_path / 'success_rate_chart.png'
            plt.savefig(success_chart, dpi=300, bbox_inches='tight')
            plt.close()
            viz_files.append(str(success_chart))
            
            # 2. Optimization types distribution
            opt_types = defaultdict(int)
            for metric in metrics:
                opt_types[metric.optimization_type] += 1
            
            plt.figure(figsize=(10, 8))
            types, counts = zip(*sorted(opt_types.items(), key=lambda x: x[1], reverse=True))
            colors = sns.color_palette("husl", len(types))
            plt.pie(counts, labels=types, autopct='%1.1f%%', colors=colors, startangle=90)
            plt.title('Distribution of Optimization Types', fontsize=16, fontweight='bold')
            plt.axis('equal')
            
            types_chart = self.output_path / 'optimization_types_chart.png'
            plt.savefig(types_chart, dpi=300, bbox_inches='tight')
            plt.close()
            viz_files.append(str(types_chart))
            
            # 3. Performance improvement histogram
            improvements = []
            for metric in [m for m in metrics if m.success]:
                if metric.after_score and metric.before_score:
                    improvement = metric.after_score - metric.before_score
                    improvements.append(improvement)
            
            if improvements:
                plt.figure(figsize=(10, 6))
                plt.hist(improvements, bins=20, edgecolor='black', alpha=0.7)
                plt.title('Distribution of Performance Improvements', fontsize=16, fontweight='bold')
                plt.xlabel('Performance Score Improvement')
                plt.ylabel('Frequency')
                plt.grid(True, alpha=0.3)
                
                # Add statistics
                mean_improvement = statistics.mean(improvements)
                plt.axvline(mean_improvement, color='red', linestyle='--', 
                          label=f'Mean: {mean_improvement:.2f}')
                plt.legend()
                
                improvement_chart = self.output_path / 'improvement_histogram.png'
                plt.savefig(improvement_chart, dpi=300, bbox_inches='tight')
                plt.close()
                viz_files.append(str(improvement_chart))
            
        except Exception as e:
            logger.error(f"Error creating visualizations: {e}")
        
        return viz_files
    
    async def _prepare_chart_data(self, metrics: List[OptimizationMetric]) -> Dict[str, Any]:
        """Prepare data for dashboard charts"""
        chart_data = {}
        
        try:
            # Daily activity data
            daily_activity = defaultdict(int)
            for metric in metrics:
                date = datetime.fromisoformat(metric.timestamp).strftime('%Y-%m-%d')
                daily_activity[date] += 1
            
            chart_data["daily_activity"] = {
                "dates": list(daily_activity.keys())[-14:],  # Last 14 days
                "counts": list(daily_activity.values())[-14:]
            }
            
            # Success rate by optimization type
            type_stats = defaultdict(lambda: {"total": 0, "successful": 0})
            for metric in metrics:
                type_stats[metric.optimization_type]["total"] += 1
                if metric.success:
                    type_stats[metric.optimization_type]["successful"] += 1
            
            chart_data["type_success_rates"] = {
                "types": list(type_stats.keys()),
                "rates": [type_stats[t]["successful"] / type_stats[t]["total"] for t in type_stats.keys()]
            }
            
        except Exception as e:
            logger.error(f"Error preparing chart data: {e}")
        
        return chart_data
    
    async def _get_top_patterns(self) -> List[Dict[str, Any]]:
        """Get top performing optimization patterns"""
        # This would query the pattern usage database
        # For now, return mock data
        return [
            {"pattern_id": "react_memo_001", "success_rate": 0.92, "usage_count": 45},
            {"pattern_id": "use_memo_002", "success_rate": 0.88, "usage_count": 32},
            {"pattern_id": "lazy_loading_001", "success_rate": 0.95, "usage_count": 28}
        ]
    
    async def _get_health_status(self) -> Dict[str, str]:
        """Get current system health status"""
        try:
            with sqlite3.connect(self.db.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT component, status, details
                    FROM system_health
                    WHERE timestamp > datetime('now', '-1 hour')
                    ORDER BY timestamp DESC
                ''')
                
                health_data = {}
                for row in cursor.fetchall():
                    component, status, details = row
                    health_data[component] = status
                
                return health_data
                
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            return {"system": "error"}
    
    async def _generate_recommendations(self, metrics: List[OptimizationMetric]) -> List[str]:
        """Generate optimization recommendations based on metrics"""
        recommendations = []
        
        if not metrics:
            return ["No recent optimization activity - consider running optimization analysis"]
        
        # Analyze success rates by type
        type_stats = defaultdict(lambda: {"total": 0, "successful": 0})
        for metric in metrics:
            type_stats[metric.optimization_type]["total"] += 1
            if metric.success:
                type_stats[metric.optimization_type]["successful"] += 1
        
        for opt_type, stats in type_stats.items():
            success_rate = stats["successful"] / stats["total"]
            if success_rate < 0.5:
                recommendations.append(f"Review {opt_type} patterns - low success rate ({success_rate:.1%})")
            elif success_rate > 0.9 and stats["total"] < 5:
                recommendations.append(f"Expand {opt_type} optimizations - high success rate but limited usage")
        
        # Check for optimization opportunities
        failed_metrics = [m for m in metrics if not m.success]
        if len(failed_metrics) > len(metrics) * 0.3:
            recommendations.append("High failure rate - consider reviewing optimization criteria")
        
        if not recommendations:
            recommendations.append("System performing well - maintain current optimization patterns")
        
        return recommendations
    
    def _generate_dashboard_html(self, data: Dict[str, Any]) -> str:
        """Generate HTML dashboard content"""
        html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMP Refactoring Specialist - Performance Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 0.9em; margin-top: 5px; }
        .status-good { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-error { color: #F44336; }
        .activity-list { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .activity-item { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .activity-item:last-child { border-bottom: none; }
        .timestamp { font-size: 0.8em; color: #666; }
        .health-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 20px; }
        .health-item { padding: 10px; border-radius: 5px; text-align: center; font-size: 0.9em; }
        .health-healthy { background-color: #d4edda; color: #155724; }
        .health-warning { background-color: #fff3cd; color: #856404; }
        .health-error { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 AMP Refactoring Specialist Dashboard</h1>
        <p>Real-time monitoring of optimization performance and system health</p>
        <p><small>Last updated: {timestamp}</small></p>
    </div>
    
    <div class="summary-grid">
        <div class="metric-card">
            <div class="metric-value">{total_optimizations}</div>
            <div class="metric-label">Total Optimizations</div>
        </div>
        <div class="metric-card">
            <div class="metric-value status-good">{success_rate}</div>
            <div class="metric-label">Success Rate</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">{files_optimized}</div>
            <div class="metric-label">Files Optimized</div>
        </div>
        <div class="metric-card">
            <div class="metric-value status-good">{avg_improvement}</div>
            <div class="metric-label">Avg Performance Gain</div>
        </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="activity-list">
            <h3>📊 Recent Activity</h3>
            {recent_activity_html}
        </div>
        
        <div class="activity-list">
            <h3>🏥 System Health</h3>
            <div class="health-grid">
                {health_status_html}
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        # Format data for template
        summary = data["summary"]
        
        # Generate recent activity HTML
        recent_activity_html = ""
        for activity in data["recent_activity"][:8]:
            status_class = "status-good" if activity["success"] else "status-error"
            recent_activity_html += f"""
            <div class="activity-item">
                <div>
                    <strong>{activity["type"]}</strong> - {activity["file"]}
                    <div class="timestamp">{activity["timestamp"][:19]}</div>
                </div>
                <div class="{status_class}">
                    {"✓" if activity["success"] else "✗"}
                </div>
            </div>
            """
        
        # Generate health status HTML
        health_status_html = ""
        for component, status in data["health_status"].items():
            health_class = f"health-{status}"
            health_status_html += f"""
            <div class="health-item {health_class}">
                <strong>{component.replace('_', ' ').title()}</strong><br>
                {status.title()}
            </div>
            """
        
        # Fill template
        return html_template.format(
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            total_optimizations=summary.total_optimizations,
            success_rate=f"{summary.success_rate:.1%}",
            files_optimized=summary.total_files_optimized,
            avg_improvement=f"{summary.average_performance_gain:.1f}%",
            recent_activity_html=recent_activity_html,
            health_status_html=health_status_html
        )

class MonitoringDashboard:
    """Main monitoring dashboard orchestrator"""
    
    def __init__(self, war_room_path: Path):
        self.war_room_path = war_room_path
        self.db_path = war_room_path / "agents" / "data" / "amp_specialist" / "monitoring.db"
        self.reports_path = war_room_path / "agents" / "data" / "amp_specialist" / "reports"
        
        # Initialize components
        self.db = MetricsDatabase(self.db_path)
        self.monitor = PerformanceMonitor(war_room_path, self.db)
        self.reporter = ReportGenerator(self.db, self.reports_path)
        
        # Monitoring state
        self.monitoring_task = None
        
        logger.info("Monitoring dashboard initialized")
    
    async def start_monitoring(self):
        """Start the monitoring system"""
        if self.monitoring_task is None:
            self.monitoring_task = asyncio.create_task(self.monitor.start_monitoring())
            logger.info("Monitoring system started")
        else:
            logger.warning("Monitoring system is already running")
    
    async def stop_monitoring(self):
        """Stop the monitoring system"""
        if self.monitoring_task:
            self.monitor.stop_monitoring()
            await self.monitoring_task
            self.monitoring_task = None
            logger.info("Monitoring system stopped")
    
    async def record_optimization_result(self, optimization_result: Dict[str, Any]):
        """Record an optimization result"""
        try:
            metric = OptimizationMetric(
                timestamp=datetime.now(timezone.utc).isoformat(),
                optimization_type=optimization_result["opportunity"]["type"],
                file_path=optimization_result["opportunity"]["file_path"],
                success=optimization_result.get("success", False),
                performance_impact=optimization_result.get("performance_impact", {}),
                before_score=0.0,  # Will be populated from before metrics
                after_score=0.0,   # Will be populated from after metrics
                execution_time=optimization_result.get("execution_time", 0.0),
                error_message=optimization_result.get("error_message")
            )
            
            await self.db.record_optimization(metric)
            logger.debug(f"Recorded optimization result for {metric.file_path}")
            
        except Exception as e:
            logger.error(f"Error recording optimization result: {e}")
    
    async def generate_dashboard(self) -> str:
        """Generate and return path to HTML dashboard"""
        return await self.reporter.generate_performance_dashboard()
    
    async def generate_reports(self) -> Dict[str, str]:
        """Generate all reports and return file paths"""
        report_paths = {}
        
        try:
            # Daily report
            daily_report = await self.reporter.generate_daily_report()
            if "error" not in daily_report:
                daily_file = self.reports_path / f"daily_report_{datetime.now().strftime('%Y-%m-%d')}.json"
                report_paths["daily"] = str(daily_file)
            
            # Weekly report
            weekly_report = await self.reporter.generate_weekly_report()
            if "error" not in weekly_report:
                weekly_file = self.reports_path / f"weekly_report_{datetime.now().strftime('%Y%m%d')}.json"
                report_paths["weekly"] = str(weekly_file)
            
            # Dashboard
            dashboard_path = await self.generate_dashboard()
            if dashboard_path:
                report_paths["dashboard"] = dashboard_path
            
            logger.info(f"Generated {len(report_paths)} reports")
            
        except Exception as e:
            logger.error(f"Error generating reports: {e}")
        
        return report_paths
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get current system status"""
        try:
            recent_metrics = await self.db.get_optimization_metrics(days=1)
            
            status = {
                "monitoring_active": self.monitoring_task is not None,
                "database_connected": self.db_path.exists(),
                "recent_optimizations": len(recent_metrics),
                "success_rate": len([m for m in recent_metrics if m.success]) / len(recent_metrics) if recent_metrics else 0,
                "last_activity": recent_metrics[0].timestamp if recent_metrics else None,
                "health_status": "healthy" if recent_metrics and len([m for m in recent_metrics if m.success]) / len(recent_metrics) > 0.7 else "warning"
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e)}

# Export main classes
__all__ = [
    'MonitoringDashboard',
    'MetricsDatabase',
    'PerformanceMonitor', 
    'ReportGenerator',
    'OptimizationMetric',
    'DashboardSummary'
]