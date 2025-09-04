#!/usr/bin/env python3
"""
Real-time Health Monitoring Dashboard
Continuous monitoring with live updates and alerting
"""

import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Dict, List, Any
import logging
from pathlib import Path
import signal
import sys

from health_check_agent import HealthCheckAgent, SystemHealth
from html_report_generator import HTMLReportGenerator

class HealthMonitoringDashboard:
    """Real-time health monitoring dashboard"""
    
    def __init__(self, target_url: str = "https://war-room-oa9t.onrender.com", interval: int = 300):
        self.target_url = target_url
        self.check_interval = interval  # seconds
        self.running = False
        self.health_history: List[SystemHealth] = []
        self.alerts_enabled = True
        self.max_history = 100  # Keep last 100 checks
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        self.setup_logging()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = Path(__file__).parent / "logs"
        log_dir.mkdir(exist_ok=True)
        
        # File handler
        log_file = log_dir / f"health_monitor_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Add handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        self.logger.setLevel(logging.INFO)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}. Shutting down gracefully...")
        self.running = False
    
    async def run_single_check(self) -> SystemHealth:
        """Run a single health check"""
        try:
            async with HealthCheckAgent(self.target_url) as agent:
                return await agent.run_comprehensive_health_check()
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            # Return a critical health status
            from datetime import datetime, timezone
            return SystemHealth(
                overall_status="CRITICAL",
                health_score=0,
                migration_ready=False,
                critical_issues=[f"Health check system failure: {str(e)}"],
                warnings=[],
                recommendations=["Investigate health check system issues"],
                timestamp=datetime.now(timezone.utc).isoformat(),
                check_duration_seconds=0
            )
    
    def analyze_trends(self) -> Dict[str, Any]:
        """Analyze health trends from history"""
        if len(self.health_history) < 2:
            return {"trend": "insufficient_data", "analysis": "Need more data points"}
        
        recent_scores = [h.health_score for h in self.health_history[-10:]]  # Last 10 checks
        older_scores = [h.health_score for h in self.health_history[-20:-10]] if len(self.health_history) >= 20 else []
        
        recent_avg = sum(recent_scores) / len(recent_scores)
        
        trend_analysis = {
            "current_score": self.health_history[-1].health_score,
            "recent_average": round(recent_avg, 1),
            "data_points": len(self.health_history),
            "trend": "stable"
        }
        
        if older_scores:
            older_avg = sum(older_scores) / len(older_scores)
            score_change = recent_avg - older_avg
            
            if score_change > 5:
                trend_analysis["trend"] = "improving"
                trend_analysis["change"] = f"+{score_change:.1f}"
            elif score_change < -5:
                trend_analysis["trend"] = "degrading"
                trend_analysis["change"] = f"{score_change:.1f}"
            else:
                trend_analysis["trend"] = "stable"
                trend_analysis["change"] = f"{score_change:+.1f}"
        
        # Check for consecutive failures
        recent_statuses = [h.overall_status for h in self.health_history[-5:]]
        consecutive_failures = 0
        for status in reversed(recent_statuses):
            if status in ["CRITICAL", "POOR"]:
                consecutive_failures += 1
            else:
                break
        
        if consecutive_failures >= 3:
            trend_analysis["alert"] = f"Consecutive failures detected ({consecutive_failures})"
        
        return trend_analysis
    
    def check_alert_conditions(self, health: SystemHealth, trends: Dict[str, Any]) -> List[str]:
        """Check if any alert conditions are met"""
        alerts = []
        
        # Critical status alert
        if health.overall_status == "CRITICAL":
            alerts.append("🚨 CRITICAL: System is in critical state")
        
        # Migration readiness alert
        if not health.migration_ready and len(self.health_history) > 0:
            if self.health_history[-2].migration_ready if len(self.health_history) > 1 else True:
                alerts.append("⚠️ WARNING: System is no longer migration ready")
        
        # Score drop alert
        if health.health_score < 60:
            alerts.append(f"📉 LOW SCORE: Health score dropped to {health.health_score}")
        
        # Trend alerts
        if trends.get("trend") == "degrading":
            alerts.append(f"📈 TREND ALERT: Performance is degrading ({trends.get('change', 'N/A')})")
        
        # Consecutive failures
        if "alert" in trends:
            alerts.append(f"🔄 PERSISTENCE ALERT: {trends['alert']}")
        
        return alerts
    
    def log_alerts(self, alerts: List[str]):
        """Log and display alerts"""
        for alert in alerts:
            self.logger.warning(alert)
            print(alert)
    
    def print_status_update(self, health: SystemHealth, trends: Dict[str, Any], check_count: int):
        """Print current status update"""
        status_emoji = {
            "EXCELLENT": "🟢",
            "GOOD": "🟢", 
            "DEGRADED": "🟡",
            "POOR": "🟠",
            "CRITICAL": "🔴"
        }.get(health.overall_status, "❓")
        
        migration_emoji = "✅" if health.migration_ready else "❌"
        
        print(f"\n{'='*60}")
        print(f"📊 Health Check #{check_count} - {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*60}")
        print(f"Status: {status_emoji} {health.overall_status} (Score: {health.health_score}/100)")
        print(f"Migration Ready: {migration_emoji} {'YES' if health.migration_ready else 'NO'}")
        print(f"Duration: {health.check_duration_seconds:.2f}s")
        print(f"Trend: {trends.get('trend', 'unknown').upper()}")
        
        if trends.get('change'):
            print(f"Score Change: {trends['change']}")
        
        if health.critical_issues:
            print(f"Critical Issues: {len(health.critical_issues)}")
            for issue in health.critical_issues[:3]:  # Show first 3
                print(f"  • {issue}")
        
        print(f"Next check in: {self.check_interval}s")
    
    def generate_dashboard_html(self) -> str:
        """Generate real-time dashboard HTML"""
        if not self.health_history:
            return "<html><body><h1>No health data available</h1></body></html>"
        
        latest_health = self.health_history[-1]
        trends = self.analyze_trends()
        
        # Prepare chart data for the last 24 hours of checks
        chart_data = []
        labels = []
        
        for i, health in enumerate(self.health_history[-20:]):  # Last 20 checks
            chart_data.append(health.health_score)
            timestamp = datetime.fromisoformat(health.timestamp.replace('Z', '+00:00'))
            labels.append(timestamp.strftime('%H:%M'))
        
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>War Room Health Monitor - Live Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <meta http-equiv="refresh" content="{self.check_interval}">
    <style>
        .pulse-green {{ animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }}
        .pulse-red {{ animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.7; }}
        }}
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div class="container mx-auto px-4 py-6">
        <!-- Header -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold mb-2">
                        <i class="fas fa-heartbeat mr-3 text-red-500"></i>
                        War Room Health Monitor
                    </h1>
                    <p class="text-gray-400">Real-time monitoring dashboard</p>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-400">Target</div>
                    <div class="text-lg font-mono">{self.target_url}</div>
                    <div class="text-sm text-gray-400">Updated: {datetime.now().strftime('%H:%M:%S')}</div>
                </div>
            </div>
        </div>

        <!-- Status Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div class="bg-gray-800 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="text-4xl font-bold {'text-green-400' if latest_health.overall_status in ['EXCELLENT', 'GOOD'] else 'text-yellow-400' if latest_health.overall_status == 'DEGRADED' else 'text-red-400'}">{latest_health.health_score}</div>
                    <div class="ml-4">
                        <div class="text-gray-400">Health Score</div>
                        <div class="text-sm {'text-green-400' if trends.get('trend') == 'improving' else 'text-red-400' if trends.get('trend') == 'degrading' else 'text-gray-400'}">{trends.get('change', 'N/A')}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="text-2xl {'text-green-400 pulse-green' if latest_health.migration_ready else 'text-red-400 pulse-red'}">
                        <i class="fas {'fa-check-circle' if latest_health.migration_ready else 'fa-times-circle'}"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-gray-400">Migration Ready</div>
                        <div class="font-bold {'text-green-400' if latest_health.migration_ready else 'text-red-400'}">
                            {'YES' if latest_health.migration_ready else 'NO'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="text-2xl text-blue-400">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-gray-400">Check Interval</div>
                        <div class="font-bold text-blue-400">{self.check_interval}s</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="text-2xl text-purple-400">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-gray-400">Data Points</div>
                        <div class="font-bold text-purple-400">{len(self.health_history)}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-chart-line mr-2"></i>Health Score Trend
                </h3>
                <canvas id="healthTrendChart" width="400" height="200"></canvas>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Current Issues
                </h3>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                    {self._generate_issues_list(latest_health)}
                </div>
            </div>
        </div>

        <!-- Recent Checks Table -->
        <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-history mr-2"></i>Recent Checks
            </h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-700">
                            <th class="text-left py-2">Time</th>
                            <th class="text-left py-2">Status</th>
                            <th class="text-left py-2">Score</th>
                            <th class="text-left py-2">Migration Ready</th>
                            <th class="text-left py-2">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {self._generate_history_table_rows()}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Health trend chart
        const ctx = document.getElementById('healthTrendChart').getContext('2d');
        new Chart(ctx, {{
            type: 'line',
            data: {{
                labels: {json.dumps(labels)},
                datasets: [{{
                    label: 'Health Score',
                    data: {json.dumps(chart_data)},
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.1,
                    fill: true
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    y: {{
                        beginAtZero: true,
                        max: 100,
                        grid: {{
                            color: '#374151'
                        }},
                        ticks: {{
                            color: '#9CA3AF'
                        }}
                    }},
                    x: {{
                        grid: {{
                            color: '#374151'
                        }},
                        ticks: {{
                            color: '#9CA3AF'
                        }}
                    }}
                }},
                plugins: {{
                    legend: {{
                        labels: {{
                            color: '#9CA3AF'
                        }}
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>"""
        
        return html_content
    
    def _generate_issues_list(self, health: SystemHealth) -> str:
        """Generate HTML for current issues"""
        html = ""
        
        if health.critical_issues:
            for issue in health.critical_issues[:5]:  # Show top 5
                html += f'<div class="flex items-start text-red-400"><i class="fas fa-exclamation-circle mr-2 mt-1"></i><span class="text-sm">{issue}</span></div>'
        
        if health.warnings:
            for warning in health.warnings[:3]:  # Show top 3
                html += f'<div class="flex items-start text-yellow-400"><i class="fas fa-exclamation-triangle mr-2 mt-1"></i><span class="text-sm">{warning}</span></div>'
        
        if not html:
            html = '<div class="text-green-400"><i class="fas fa-check-circle mr-2"></i>No issues detected</div>'
        
        return html
    
    def _generate_history_table_rows(self) -> str:
        """Generate table rows for recent checks"""
        html = ""
        
        for health in reversed(self.health_history[-10:]):  # Last 10 checks, newest first
            timestamp = datetime.fromisoformat(health.timestamp.replace('Z', '+00:00'))
            time_str = timestamp.strftime('%H:%M:%S')
            
            status_colors = {
                "EXCELLENT": "text-green-400",
                "GOOD": "text-green-400",
                "DEGRADED": "text-yellow-400",
                "POOR": "text-orange-400", 
                "CRITICAL": "text-red-400"
            }
            
            color_class = status_colors.get(health.overall_status, "text-gray-400")
            migration_color = "text-green-400" if health.migration_ready else "text-red-400"
            
            html += f"""
                <tr class="border-b border-gray-700">
                    <td class="py-2 text-gray-300">{time_str}</td>
                    <td class="py-2 {color_class}">{health.overall_status}</td>
                    <td class="py-2 {color_class}">{health.health_score}</td>
                    <td class="py-2 {migration_color}">{'✅' if health.migration_ready else '❌'}</td>
                    <td class="py-2 text-gray-300">{health.check_duration_seconds:.1f}s</td>
                </tr>
            """
        
        return html
    
    def save_dashboard(self):
        """Save the current dashboard to HTML file"""
        html_content = self.generate_dashboard_html()
        dashboard_dir = Path(__file__).parent / "dashboard"
        dashboard_dir.mkdir(exist_ok=True)
        
        dashboard_file = dashboard_dir / "live_dashboard.html"
        with open(dashboard_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return dashboard_file
    
    async def start_monitoring(self):
        """Start the continuous monitoring loop"""
        self.running = True
        check_count = 0
        
        self.logger.info(f"Starting health monitoring for {self.target_url}")
        self.logger.info(f"Check interval: {self.check_interval} seconds")
        
        print(f"🔄 Starting continuous health monitoring...")
        print(f"🎯 Target: {self.target_url}")
        print(f"⏱️ Interval: {self.check_interval}s")
        print(f"Press Ctrl+C to stop monitoring\n")
        
        while self.running:
            try:
                check_count += 1
                start_time = time.time()
                
                # Run health check
                health = await self.run_single_check()
                
                # Add to history
                self.health_history.append(health)
                
                # Trim history if needed
                if len(self.health_history) > self.max_history:
                    self.health_history = self.health_history[-self.max_history:]
                
                # Analyze trends
                trends = self.analyze_trends()
                
                # Check for alerts
                if self.alerts_enabled:
                    alerts = self.check_alert_conditions(health, trends)
                    if alerts:
                        self.log_alerts(alerts)
                
                # Print status update
                self.print_status_update(health, trends, check_count)
                
                # Save dashboard
                dashboard_file = self.save_dashboard()
                if check_count == 1:
                    self.logger.info(f"Dashboard available at: file://{dashboard_file}")
                
                # Wait for next check
                elapsed = time.time() - start_time
                sleep_time = max(0, self.check_interval - elapsed)
                
                if self.running and sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait a minute before retrying
        
        self.logger.info("Health monitoring stopped")
        print("\n🛑 Health monitoring stopped")

def main():
    """Main entry point for the monitoring dashboard"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="War Room Real-time Health Monitoring Dashboard"
    )
    
    parser.add_argument(
        "url",
        nargs="?",
        default="https://war-room-oa9t.onrender.com",
        help="Target URL to monitor (default: https://war-room-oa9t.onrender.com)"
    )
    
    parser.add_argument(
        "--interval", "-i",
        type=int,
        default=300,
        help="Check interval in seconds (default: 300)"
    )
    
    parser.add_argument(
        "--no-alerts",
        action="store_true",
        help="Disable alert notifications"
    )
    
    args = parser.parse_args()
    
    # Create and start dashboard
    dashboard = HealthMonitoringDashboard(
        target_url=args.url,
        interval=args.interval
    )
    
    if args.no_alerts:
        dashboard.alerts_enabled = False
    
    try:
        asyncio.run(dashboard.start_monitoring())
    except KeyboardInterrupt:
        print("\n⚠️ Monitoring interrupted by user")
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()