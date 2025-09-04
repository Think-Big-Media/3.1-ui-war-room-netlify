#!/usr/bin/env python3
"""
War Room Health Check Agent Launcher
Comprehensive system for running health checks and generating reports
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path
from datetime import datetime
import webbrowser
import os

from health_check_agent import HealthCheckAgent
from html_report_generator import HTMLReportGenerator

def setup_directories():
    """Ensure required directories exist"""
    base_dir = Path(__file__).parent
    reports_dir = base_dir / "reports"
    reports_dir.mkdir(exist_ok=True)
    
    templates_dir = base_dir / "templates"
    templates_dir.mkdir(exist_ok=True)
    
    return reports_dir

def print_banner():
    """Print the agent banner"""
    print("=" * 80)
    print("🏥 SUB-AGENT 1 - HEALTH_CHECK_AGENT")
    print("   War Room Platform Migration Readiness Validator")
    print("   Version 1.0.0")
    print("=" * 80)
    print()

async def run_health_check(target_url: str, output_format: str = "all", open_browser: bool = False):
    """Run comprehensive health check"""
    
    print_banner()
    print(f"🎯 Target: {target_url}")
    print(f"📊 Output Format: {output_format}")
    print(f"🌐 Browser: {'Yes' if open_browser else 'No'}")
    print()
    
    # Setup directories
    reports_dir = setup_directories()
    
    # Run health check
    async with HealthCheckAgent(target_url) as agent:
        print("🚀 Starting comprehensive health check...")
        system_health = await agent.run_comprehensive_health_check()
        
        # Generate detailed report
        report_data = agent.generate_detailed_report(system_health)
        
        # Save JSON report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_file = reports_dir / f"health_report_{timestamp}.json"
        
        with open(json_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"📄 JSON report saved: {json_file}")
        
        # Generate outputs based on format
        if output_format in ["all", "html"]:
            generator = HTMLReportGenerator()
            html_file = generator.generate_html_report(report_data, f"health_report_{timestamp}.html")
            print(f"🌐 HTML report saved: {html_file}")
            
            if open_browser:
                try:
                    webbrowser.open(f"file://{html_file}")
                    print("🌐 Opening HTML report in browser...")
                except Exception as e:
                    print(f"⚠️ Could not open browser: {e}")
        
        if output_format in ["all", "console"]:
            print_console_summary(system_health, report_data)
        
        # Print final assessment
        print("\n" + "=" * 80)
        print("📊 FINAL ASSESSMENT")
        print("=" * 80)
        
        status_emoji = {
            "EXCELLENT": "🟢",
            "GOOD": "🟢", 
            "DEGRADED": "🟡",
            "POOR": "🟠",
            "CRITICAL": "🔴"
        }.get(system_health.overall_status, "❓")
        
        migration_emoji = "✅" if system_health.migration_ready else "❌"
        
        print(f"Overall Status: {status_emoji} {system_health.overall_status}")
        print(f"Health Score: {system_health.health_score}/100")
        print(f"Migration Ready: {migration_emoji} {'YES' if system_health.migration_ready else 'NO'}")
        print(f"Duration: {system_health.check_duration_seconds:.2f}s")
        
        if system_health.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in system_health.critical_issues:
                print(f"   • {issue}")
        
        if system_health.recommendations:
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in system_health.recommendations:
                print(f"   • {rec}")
        
        print("\n" + "=" * 80)
        
        # Exit code for CI/CD
        return 0 if system_health.migration_ready else 1

def print_console_summary(system_health, report_data):
    """Print detailed console summary"""
    health_data = report_data["war_room_health_report"]
    results = health_data["detailed_results"]
    
    print("\n" + "=" * 80)
    print("📋 DETAILED TEST RESULTS")
    print("=" * 80)
    
    for result in results:
        status_emoji = {
            "pass": "✅",
            "warning": "⚠️", 
            "fail": "❌"
        }.get(result["status"], "❓")
        
        print(f"{status_emoji} {result['name']:<30} {result['status'].upper():<8} {result['response_time_ms']:>8.2f}ms")
        
        if result.get("error"):
            print(f"    Error: {result['error']}")
        
        # Show key details
        if result.get("details") and isinstance(result["details"], dict):
            details = result["details"]
            if "status_code" in details:
                print(f"    Status Code: {details['status_code']}")
            if "success_rate_percent" in details:
                print(f"    Success Rate: {details['success_rate_percent']}%")
    
    print()

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="War Room Health Check Agent - Comprehensive platform validation"
    )
    
    parser.add_argument(
        "url",
        nargs="?",
        default="https://war-room-oa9t.onrender.com",
        help="Target URL to check (default: https://war-room-oa9t.onrender.com)"
    )
    
    parser.add_argument(
        "--format", "-f",
        choices=["console", "html", "json", "all"],
        default="all",
        help="Output format (default: all)"
    )
    
    parser.add_argument(
        "--browser", "-b",
        action="store_true",
        help="Open HTML report in browser"
    )
    
    parser.add_argument(
        "--ci",
        action="store_true", 
        help="CI/CD mode - minimal output, exit codes"
    )
    
    args = parser.parse_args()
    
    # CI mode adjustments
    if args.ci:
        args.format = "json"
        args.browser = False
        # Suppress some output for cleaner CI logs
        import logging
        logging.getLogger().setLevel(logging.WARNING)
    
    try:
        exit_code = asyncio.run(
            run_health_check(
                target_url=args.url,
                output_format=args.format,
                open_browser=args.browser
            )
        )
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        print("\n⚠️ Health check interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"💥 Fatal error: {e}")
        sys.exit(2)

if __name__ == "__main__":
    main()