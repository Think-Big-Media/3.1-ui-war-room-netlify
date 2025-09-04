"""
Basic Usage Example for Crisis Detection Workflow

This example demonstrates how to use the Crisis Detection Workflow
for real-time political campaign monitoring and crisis response.
"""

import asyncio
import os
from datetime import datetime
from typing import Dict, Optional

from ..workflow import run_crisis_detection
from ..agents.monitoring import MentionlyticsConfig
from ..utils.state import WorkflowState


async def basic_crisis_detection_example():
    """
    Basic example of running crisis detection workflow
    """
    
    print("🚨 Crisis Detection Workflow - Basic Example")
    print("=" * 50)
    
    # Configuration - In production, use environment variables
    openai_api_key = os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")
    mentionlytics_api_key = os.getenv("MENTIONLYTICS_API_KEY", "your_mentionlytics_key")
    mentionlytics_api_secret = os.getenv("MENTIONLYTICS_API_SECRET", "your_mentionlytics_secret")
    
    # Campaign context - customize for your campaign
    campaign_context = {
        "candidate_name": "Sarah Johnson",
        "key_issues": ["healthcare", "economy", "education"],
        "opponents": ["Mike Thompson", "Lisa Chen"],
        "monitor_keywords": [
            "scandal", "corruption", "leaked", "controversy", 
            "Sarah Johnson", "healthcare plan", "economic policy"
        ],
        "vulnerabilities": [
            "healthcare funding position",
            "past business dealings",
            "climate change stance"
        ]
    }
    
    print(f"📊 Monitoring for: {campaign_context['candidate_name']}")
    print(f"🔍 Key issues: {', '.join(campaign_context['key_issues'])}")
    print(f"⚠️  Vulnerabilities: {len(campaign_context['vulnerabilities'])} identified")
    print()
    
    try:
        # Run the crisis detection workflow
        print("🔄 Starting crisis detection scan...")
        start_time = datetime.now()
        
        result = await run_crisis_detection(
            openai_api_key=openai_api_key,
            mentionlytics_api_key=mentionlytics_api_key,
            mentionlytics_api_secret=mentionlytics_api_secret,
            campaign_context=campaign_context
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print(f"✅ Workflow completed in {duration:.2f} seconds")
        print()
        
        # Display results
        await display_results(result)
        
    except Exception as e:
        print(f"❌ Error running crisis detection: {e}")
        return None
    
    return result


async def display_results(result: Dict):
    """Display workflow results in a user-friendly format"""
    
    state = WorkflowState(**result) if isinstance(result, dict) else result
    
    print("📈 CRISIS DETECTION RESULTS")
    print("=" * 30)
    
    # Basic metrics
    print(f"📅 Timestamp: {state.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📝 Mentions processed: {len(state.mentions)}")
    print(f"🎯 Sources monitored: {state.source_count}")
    print()
    
    # Crisis analysis
    if state.analysis:
        analysis = state.analysis
        severity_emoji = get_severity_emoji(analysis.severity)
        
        print("🧠 CRISIS ANALYSIS")
        print("-" * 15)
        print(f"{severity_emoji} Severity: {analysis.severity}/10")
        print(f"🎯 Confidence: {analysis.confidence:.1%}")
        print(f"⚠️  Threat Type: {analysis.threat_type}")
        print(f"📋 Affected Topics: {', '.join(analysis.affected_topics)}")
        print()
        
        # Threat assessment
        if state.threat_detected:
            print("🚨 THREAT DETECTED - IMMEDIATE ATTENTION REQUIRED")
            print("-" * 40)
            print("📋 Recommended Actions:")
            for i, action in enumerate(analysis.recommended_actions[:5], 1):
                print(f"   {i}. {action}")
            print()
            
            if analysis.escalation_required:
                print("🆘 ESCALATION REQUIRED")
                print("   → Notify senior leadership immediately")
                print("   → Activate crisis response team")
                print()
        else:
            print("✅ No immediate threats detected")
            print("   → Continue normal monitoring")
            print()
    
    # Alert routing
    if state.routing_plan:
        print("📤 ALERT ROUTING")
        print("-" * 12)
        print(f"🎯 Recipients: {len(state.routing_plan)}")
        print(f"📧 Alerts planned: {state.alert_count}")
        
        for route in state.routing_plan[:3]:  # Show top 3
            channels = ", ".join(route.channels)
            print(f"   → {route.recipient.name} ({route.recipient.role}): {channels}")
        
        if len(state.routing_plan) > 3:
            print(f"   → ... and {len(state.routing_plan) - 3} more recipients")
        print()
    
    # Delivery results
    if state.delivery_results:
        successful_deliveries = sum(
            1 for result in state.delivery_results.values() 
            if result.get('success', False)
        )
        total_deliveries = len(state.delivery_results)
        success_rate = successful_deliveries / total_deliveries if total_deliveries > 0 else 0
        
        print("📬 DELIVERY STATUS")
        print("-" * 13)
        print(f"✅ Successful: {successful_deliveries}/{total_deliveries} ({success_rate:.1%})")
        print(f"📊 Total alerts sent: {state.alerts_sent}")
        print()
    
    # Learning insights
    if state.learning_data:
        print("🧠 LEARNING INSIGHTS")
        print("-" * 15)
        learning = state.learning_data
        print(f"📈 Delivery success rate: {learning.get('delivery_success_rate', 0):.1%}")
        print(f"⚡ Processing efficiency: {'High' if learning.get('mentions_count', 0) > 0 else 'N/A'}")
        print()
    
    # Error handling
    if state.error:
        print("❌ ERRORS ENCOUNTERED")
        print("-" * 17)
        print(f"⚠️  Error: {state.error}")
        print()


def get_severity_emoji(severity: int) -> str:
    """Get emoji representation of severity level"""
    if severity >= 8:
        return "🔴"  # Critical
    elif severity >= 6:
        return "🟡"  # High
    elif severity >= 4:
        return "🟠"  # Medium
    else:
        return "🟢"  # Low


async def continuous_monitoring_example():
    """
    Example of continuous crisis monitoring (run every 15 minutes)
    """
    
    print("🔄 Continuous Crisis Monitoring")
    print("=" * 35)
    print("This example runs crisis detection every 15 minutes")
    print("Press Ctrl+C to stop monitoring")
    print()
    
    # Configuration
    openai_api_key = os.getenv("OPENAI_API_KEY")
    mentionlytics_api_key = os.getenv("MENTIONLYTICS_API_KEY") 
    mentionlytics_api_secret = os.getenv("MENTIONLYTICS_API_SECRET")
    
    if not all([openai_api_key, mentionlytics_api_key, mentionlytics_api_secret]):
        print("❌ Missing required API keys. Please set environment variables:")
        print("   - OPENAI_API_KEY")
        print("   - MENTIONLYTICS_API_KEY")
        print("   - MENTIONLYTICS_API_SECRET")
        return
    
    campaign_context = {
        "candidate_name": "Sarah Johnson",
        "key_issues": ["healthcare", "economy", "education"],
        "monitor_keywords": ["Sarah Johnson", "scandal", "controversy"],
        "alert_threshold": 4  # Alert on severity >= 4
    }
    
    scan_count = 0
    alerts_sent = 0
    
    try:
        while True:
            scan_count += 1
            print(f"🔍 Scan #{scan_count} - {datetime.now().strftime('%H:%M:%S')}")
            
            try:
                result = await run_crisis_detection(
                    openai_api_key=openai_api_key,
                    mentionlytics_api_key=mentionlytics_api_key,
                    mentionlytics_api_secret=mentionlytics_api_secret,
                    campaign_context=campaign_context
                )
                
                # Check for threats
                if result.get('threat_detected'):
                    severity = result.get('severity', 0)
                    alerts_sent += result.get('alerts_sent', 0)
                    
                    print(f"🚨 THREAT DETECTED - Severity {severity}/10")
                    print(f"📧 Alerts sent: {result.get('alerts_sent', 0)}")
                    
                    # In production, you might want to:
                    # - Send additional notifications
                    # - Log to monitoring system
                    # - Update dashboard
                    
                else:
                    print("✅ No threats detected")
                
                print(f"📊 Total scans: {scan_count}, Total alerts: {alerts_sent}")
                print()
                
            except Exception as e:
                print(f"❌ Scan failed: {e}")
            
            # Wait 15 minutes (900 seconds)
            print("⏱️  Waiting 15 minutes until next scan...")
            await asyncio.sleep(900)
            
    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped by user")
        print(f"📊 Final stats: {scan_count} scans completed, {alerts_sent} alerts sent")


async def webhook_integration_example():
    """
    Example of integrating with Mentionlytics webhooks for real-time alerts
    """
    
    print("🪝 Webhook Integration Example")
    print("=" * 30)
    
    # This would typically be integrated with a web framework like FastAPI
    # Here's the conceptual structure:
    
    webhook_config = {
        "endpoint": "https://your-campaign-domain.com/webhooks/mentionlytics",
        "secret": "your_webhook_verification_secret",
        "events": ["mention.created", "mention.updated"]
    }
    
    print("🔧 Webhook Configuration:")
    print(f"   Endpoint: {webhook_config['endpoint']}")
    print(f"   Events: {', '.join(webhook_config['events'])}")
    print()
    
    print("💡 Integration Steps:")
    print("1. Set up webhook endpoint in your web application")
    print("2. Configure Mentionlytics to send events to your endpoint")
    print("3. Verify webhook signatures for security")
    print("4. Trigger crisis detection workflow on high-priority mentions")
    print()
    
    # Example webhook handler (pseudo-code)
    print("📝 Example webhook handler:")
    print("""
    @app.post("/webhooks/mentionlytics")
    async def handle_mentionlytics_webhook(request):
        # 1. Verify webhook signature
        if not verify_webhook_signature(request):
            return {"error": "Invalid signature"}, 401
        
        # 2. Parse mention data
        mention_data = await request.json()
        
        # 3. Quick threat assessment
        if is_high_priority_mention(mention_data):
            # 4. Trigger immediate crisis detection
            await run_crisis_detection(
                mentions=[mention_data],
                campaign_context=get_campaign_context()
            )
        
        return {"status": "processed"}
    """)


if __name__ == "__main__":
    """
    Run the examples based on command line arguments
    """
    import sys
    
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
        
        if mode == "continuous":
            asyncio.run(continuous_monitoring_example())
        elif mode == "webhook":
            asyncio.run(webhook_integration_example())
        else:
            print("Usage: python basic_usage.py [continuous|webhook]")
            print("  continuous - Run continuous monitoring")
            print("  webhook    - Show webhook integration example")
    else:
        # Run basic example
        asyncio.run(basic_crisis_detection_example())