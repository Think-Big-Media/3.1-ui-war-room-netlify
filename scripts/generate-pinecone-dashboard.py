#!/usr/bin/env python3
"""
Pinecone Monitoring Dashboard Generator
======================================

Generates comprehensive monitoring dashboard reports with:
- Service health status
- Performance metrics and trends
- Error analysis and alerts
- Capacity monitoring
- Recommendations

Usage:
    python3 scripts/generate-pinecone-dashboard.py [--format html|json|markdown]
    python3 scripts/generate-pinecone-dashboard.py --web-server
"""

import os
import sys
import json
import asyncio
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dashboard-generator")

# Import our monitoring components
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

try:
    from scripts.enhanced_pinecone_monitor import EnhancedPineconeMonitor, ServiceMetrics, HealthStatus
    MONITOR_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Monitor not available: {e}")
    MONITOR_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class PineconeDashboard:
    """Generates comprehensive Pinecone monitoring dashboards."""
    
    def __init__(self):
        self.log_dir = Path(__file__).parent.parent / "logs" / "pinecone_monitoring"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        self.monitor = EnhancedPineconeMonitor() if MONITOR_AVAILABLE else None
        
    def load_historical_data(self, days: int = 7) -> List[Dict[str, Any]]:
        """Load historical monitoring data from log files."""
        historical_data = []
        
        # Look for JSON report files
        for log_file in self.log_dir.glob("health_report_*.json"):
            try:
                with open(log_file, 'r') as f:
                    data = json.load(f)
                    data['source_file'] = str(log_file)
                    historical_data.append(data)
            except Exception as e:
                logger.warning(f"Failed to load {log_file}: {e}")
        
        # Sort by timestamp
        historical_data.sort(key=lambda x: x.get('health_status', {}).get('timestamp', ''))
        
        # Filter to recent data
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_data = []
        
        for entry in historical_data:
            timestamp_str = entry.get('health_status', {}).get('timestamp', '')
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                if timestamp >= cutoff_date:
                    recent_data.append(entry)
            except:
                continue
                
        return recent_data
    
    async def get_current_status(self) -> Optional[HealthStatus]:
        """Get current health status."""
        if not self.monitor:
            return None
            
        try:
            return await self.monitor.run_comprehensive_health_check()
        except Exception as e:
            logger.error(f"Failed to get current status: {e}")
            return None
    
    def analyze_performance_trends(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance trends from historical data."""
        if not historical_data:
            return {"error": "No historical data available"}
        
        # Extract metrics
        response_times = []
        error_rates = []
        performance_scores = []
        timestamps = []
        
        for entry in historical_data:
            health_status = entry.get('health_status', {})
            detailed_metrics = entry.get('detailed_metrics', [])
            
            timestamp = health_status.get('timestamp')
            if timestamp:
                timestamps.append(timestamp)
                performance_scores.append(health_status.get('performance_score', 0))
                error_rates.append(health_status.get('error_count_24h', 0))
                
                # Calculate average response time for this entry
                successful_metrics = [m for m in detailed_metrics if m.get('success', False)]
                if successful_metrics:
                    avg_response_time = sum(m.get('response_time_ms', 0) for m in successful_metrics) / len(successful_metrics)
                    response_times.append(avg_response_time)
                else:
                    response_times.append(0)
        
        # Calculate trends
        trends = {}
        
        if len(performance_scores) >= 2:
            recent_perf = sum(performance_scores[-3:]) / min(3, len(performance_scores))
            older_perf = sum(performance_scores[:3]) / min(3, len(performance_scores))
            trends['performance_trend'] = 'improving' if recent_perf > older_perf else 'declining' if recent_perf < older_perf else 'stable'
        
        if response_times:
            trends['avg_response_time_ms'] = sum(response_times) / len(response_times)
            trends['max_response_time_ms'] = max(response_times)
            trends['min_response_time_ms'] = min(response_times) if response_times else 0
        
        trends['total_entries'] = len(historical_data)
        trends['date_range'] = {
            'start': timestamps[0] if timestamps else None,
            'end': timestamps[-1] if timestamps else None
        }
        
        return trends
    
    def analyze_error_patterns(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze error patterns and failure modes."""
        error_analysis = {
            'total_errors': 0,
            'error_types': {},
            'failure_patterns': [],
            'most_common_errors': [],
            'error_frequency': {}
        }
        
        for entry in historical_data:
            detailed_metrics = entry.get('detailed_metrics', [])
            timestamp = entry.get('health_status', {}).get('timestamp', '')
            
            for metric in detailed_metrics:
                if not metric.get('success', True):
                    error_analysis['total_errors'] += 1
                    
                    # Categorize by operation
                    operation = metric.get('operation', 'unknown')
                    if operation not in error_analysis['error_types']:
                        error_analysis['error_types'][operation] = 0
                    error_analysis['error_types'][operation] += 1
                    
                    # Track error messages
                    error_msg = metric.get('error_message', 'Unknown error')
                    if error_msg not in error_analysis['error_frequency']:
                        error_analysis['error_frequency'][error_msg] = 0
                    error_analysis['error_frequency'][error_msg] += 1
        
        # Sort most common errors
        error_analysis['most_common_errors'] = sorted(
            error_analysis['error_frequency'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return error_analysis
    
    def generate_recommendations(self, current_status: HealthStatus, trends: Dict[str, Any], errors: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        # Current status recommendations
        if current_status:
            if current_status.overall_status == 'critical':
                recommendations.append("🚨 URGENT: Service is in critical state - immediate attention required")
            elif current_status.overall_status == 'degraded':
                recommendations.append("⚠️ Service is degraded - monitor closely and investigate issues")
            
            if current_status.performance_score < 0.7:
                recommendations.append(f"📉 Performance score is low ({current_status.performance_score:.1%}) - investigate slow operations")
            
            recommendations.extend(current_status.recommendations)
        
        # Trend-based recommendations
        if trends.get('performance_trend') == 'declining':
            recommendations.append("📊 Performance trend is declining - review recent changes and optimize")
        
        avg_response_time = trends.get('avg_response_time_ms', 0)
        if avg_response_time > 2000:
            recommendations.append(f"🐌 Average response time is high ({avg_response_time:.0f}ms) - consider optimization")
        
        # Error-based recommendations
        if errors['total_errors'] > 10:
            recommendations.append(f"🔥 High error count ({errors['total_errors']}) - investigate failure patterns")
        
        # Top error patterns
        for error_msg, count in errors['most_common_errors'][:2]:
            if count >= 3:
                recommendations.append(f"🐛 Recurring error ({count}x): {error_msg[:100]}...")
        
        # Configuration recommendations
        recommendations.extend([
            "🔧 Ensure API keys are properly configured and have sufficient quotas",
            "📊 Monitor vector storage capacity and index statistics regularly",
            "🔄 Set up automated backups for critical vector data",
            "⏱️ Consider implementing circuit breakers for improved resilience"
        ])
        
        return list(set(recommendations))  # Remove duplicates
    
    async def generate_dashboard_data(self) -> Dict[str, Any]:
        """Generate complete dashboard data."""
        logger.info("Generating dashboard data...")
        
        # Get current status
        current_status = await self.get_current_status()
        
        # Load historical data
        historical_data = self.load_historical_data(days=7)
        
        # Analyze trends and patterns
        trends = self.analyze_performance_trends(historical_data)
        errors = self.analyze_error_patterns(historical_data)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(current_status, trends, errors)
        
        # API health check
        api_health = None
        if REQUESTS_AVAILABLE:
            try:
                api_url = "https://war-room-oa9t.onrender.com/api/v1/documents/search/health"
                response = requests.get(api_url, timeout=10)
                if response.status_code == 200:
                    api_health = response.json()
            except Exception as e:
                logger.warning(f"API health check failed: {e}")
        
        dashboard_data = {
            'generated_at': datetime.utcnow().isoformat(),
            'current_status': current_status.__dict__ if current_status else None,
            'api_health': api_health,
            'performance_trends': trends,
            'error_analysis': errors,
            'recommendations': recommendations,
            'historical_data_points': len(historical_data),
            'monitoring_config': {
                'log_directory': str(self.log_dir),
                'monitoring_interval': '30 minutes',
                'data_retention': '7 days (dashboard), 30 days (logs)',
                'alerting_enabled': True
            }
        }
        
        return dashboard_data
    
    def generate_markdown_report(self, data: Dict[str, Any]) -> str:
        """Generate markdown format dashboard report."""
        current_status = data.get('current_status')
        trends = data.get('performance_trends', {})
        errors = data.get('error_analysis', {})
        recommendations = data.get('recommendations', [])
        
        # Status emojis
        status_emoji = {
            'healthy': '✅',
            'degraded': '⚠️',
            'critical': '❌',
            'operational': '✅',
            'unavailable': '❌'
        }
        
        report = f"""# Pinecone Monitoring Dashboard
        
**Generated:** {data['generated_at']}  
**Data Points:** {data['historical_data_points']} (7 days)

## 🎯 Current Status

"""
        
        if current_status:
            overall_emoji = status_emoji.get(current_status['overall_status'], '❓')
            pinecone_emoji = status_emoji.get(current_status['pinecone_status'], '❓')
            openai_emoji = status_emoji.get(current_status['openai_status'], '❓')
            
            report += f"""
| Service | Status | Performance |
|---------|--------|-------------|
| **Overall** | {overall_emoji} {current_status['overall_status'].upper()} | {current_status['performance_score']:.1%} |
| **Pinecone** | {pinecone_emoji} {current_status['pinecone_status'].upper()} | - |
| **OpenAI** | {openai_emoji} {current_status['openai_status'].upper()} | - |

**Last Successful Operation:** {current_status.get('last_successful_operation', 'None')}  
**Errors (24h):** {current_status.get('error_count_24h', 0)}
"""
        else:
            report += "❌ **Status check failed - service may be unavailable**\n"
        
        # API Health
        api_health = data.get('api_health')
        if api_health:
            report += f"""
## 🌐 API Health

**Status:** {status_emoji.get(api_health.get('status'), '❓')} {api_health.get('status', 'Unknown').upper()}

**Service Status:**
"""
            services = api_health.get('services', {})
            for service_name, service_info in services.items():
                service_status = service_info.get('status', 'unknown')
                emoji = status_emoji.get(service_status, '❓')
                report += f"- **{service_name.title()}:** {emoji} {service_status.upper()}\n"
        
        # Performance Trends
        report += f"""
## 📊 Performance Trends

"""
        if trends.get('avg_response_time_ms'):
            report += f"""
| Metric | Value |
|--------|-------|
| **Average Response Time** | {trends['avg_response_time_ms']:.1f}ms |
| **Max Response Time** | {trends['max_response_time_ms']:.1f}ms |
| **Min Response Time** | {trends['min_response_time_ms']:.1f}ms |
| **Performance Trend** | {trends.get('performance_trend', 'Unknown').title()} |
"""
        else:
            report += "No performance data available.\n"
        
        # Error Analysis
        report += f"""
## 🐛 Error Analysis

**Total Errors:** {errors['total_errors']}

"""
        
        if errors['error_types']:
            report += "**Errors by Operation:**\n"
            for operation, count in errors['error_types'].items():
                report += f"- **{operation.replace('_', ' ').title()}:** {count}\n"
            report += "\n"
        
        if errors['most_common_errors']:
            report += "**Most Common Errors:**\n"
            for error_msg, count in errors['most_common_errors'][:3]:
                report += f"- **{count}x:** {error_msg[:80]}{'...' if len(error_msg) > 80 else ''}\n"
            report += "\n"
        
        # Recommendations
        if recommendations:
            report += "## 💡 Recommendations\n\n"
            for rec in recommendations:
                report += f"- {rec}\n"
            report += "\n"
        
        # Monitoring Info
        config = data.get('monitoring_config', {})
        report += f"""
## ⚙️ Monitoring Configuration

- **Monitoring Interval:** {config.get('monitoring_interval', 'Unknown')}
- **Data Retention:** {config.get('data_retention', 'Unknown')}
- **Log Directory:** `{config.get('log_directory', 'Unknown')}`
- **Alerting:** {'Enabled' if config.get('alerting_enabled') else 'Disabled'}

## 📈 Next Steps

1. **Immediate Actions:** Address any critical alerts or performance issues
2. **Short-term:** Implement recommended optimizations
3. **Long-term:** Set up capacity planning and performance baselines
4. **Monitoring:** Review this dashboard regularly for trends

---

*Last Updated: {data['generated_at']}*
*Dashboard Version: 1.0*
"""
        
        return report
    
    def generate_html_report(self, data: Dict[str, Any]) -> str:
        """Generate HTML format dashboard report."""
        markdown_content = self.generate_markdown_report(data)
        
        # Simple HTML wrapper with styling
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pinecone Monitoring Dashboard</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f8f9fa; font-weight: 600; }}
        .status-healthy {{ color: #27ae60; }}
        .status-degraded {{ color: #f39c12; }}
        .status-critical {{ color: #e74c3c; }}
        .recommendations li {{ margin: 8px 0; padding: 5px 0; }}
        .metadata {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }}
        pre {{ background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }}
    </style>
</head>
<body>
    <div class="container">
        {markdown_content.replace('#', '<h1>', 1).replace('#', '</h1><h2>', 1).replace('##', '</h2><h2>').replace('\n\n', '</p><p>').replace('\n', '<br>')}
    </div>
</body>
</html>
"""
        return html


async def main():
    """Main function with CLI interface."""
    parser = argparse.ArgumentParser(description="Generate Pinecone monitoring dashboard")
    parser.add_argument(
        '--format',
        choices=['markdown', 'html', 'json'],
        default='markdown',
        help='Output format (default: markdown)'
    )
    parser.add_argument(
        '--output',
        help='Output file path (default: stdout)'
    )
    parser.add_argument(
        '--web-server',
        action='store_true',
        help='Start simple web server for HTML dashboard'
    )
    
    args = parser.parse_args()
    
    dashboard = PineconeDashboard()
    
    # Generate dashboard data
    data = await dashboard.generate_dashboard_data()
    
    # Format output
    if args.format == 'json':
        output = json.dumps(data, indent=2)
    elif args.format == 'html':
        output = dashboard.generate_html_report(data)
    else:  # markdown
        output = dashboard.generate_markdown_report(data)
    
    # Save or display output
    if args.output:
        output_path = Path(args.output)
        output_path.write_text(output)
        print(f"Dashboard saved to: {output_path}")
    else:
        print(output)
    
    # Web server mode
    if args.web_server and args.format == 'html':
        import http.server
        import socketserver
        import tempfile
        import webbrowser
        import threading
        
        # Create temporary HTML file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
            f.write(output)
            temp_file = f.name
        
        # Start simple web server
        PORT = 8080
        Handler = http.server.SimpleHTTPRequestHandler
        
        class CustomHandler(Handler):
            def do_GET(self):
                if self.path == '/' or self.path == '/dashboard':
                    with open(temp_file, 'r') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(content.encode())
                else:
                    super().do_GET()
        
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print(f"Dashboard server running at http://localhost:{PORT}/dashboard")
            webbrowser.open(f"http://localhost:{PORT}/dashboard")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServer stopped")
                os.unlink(temp_file)


if __name__ == '__main__':
    asyncio.run(main())