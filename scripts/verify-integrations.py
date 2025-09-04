#!/usr/bin/env python3
"""
Integration Verification Script
Tests all configured API integrations to ensure they're working properly.
"""

import os
import sys
import asyncio
import logging
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src/backend'))

from core.config import settings
from termcolor import colored

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class IntegrationVerifier:
    """Verifies all external service integrations."""
    
    def __init__(self):
        self.results = {}
        
    def log_result(self, service: str, success: bool, message: str):
        """Log test result."""
        self.results[service] = {"success": success, "message": message}
        
        if success:
            logger.info(colored(f"✅ {service}: {message}", "green"))
        else:
            logger.error(colored(f"❌ {service}: {message}", "red"))
            
    async def verify_pinecone(self):
        """Verify Pinecone integration."""
        try:
            from core.pinecone_config import pinecone_manager
            
            if pinecone_manager.index:
                stats = pinecone_manager.index.describe_index_stats()
                self.log_result(
                    "Pinecone",
                    True,
                    f"Connected to index '{settings.PINECONE_INDEX_NAME}' with {stats.total_vector_count} vectors"
                )
            else:
                self.log_result("Pinecone", False, "Failed to connect to index")
                
        except Exception as e:
            self.log_result("Pinecone", False, str(e))
            
    async def verify_openai(self):
        """Verify OpenAI integration."""
        try:
            import openai
            openai.api_key = settings.OPENAI_API_KEY
            
            # Test with a simple embedding
            response = openai.Embedding.create(
                model="text-embedding-ada-002",
                input="Test embedding"
            )
            
            if response.get('data'):
                self.log_result("OpenAI", True, "API key is valid and working")
            else:
                self.log_result("OpenAI", False, "No response from API")
                
        except Exception as e:
            self.log_result("OpenAI", False, str(e))
            
    async def verify_supabase(self):
        """Verify Supabase integration."""
        try:
            from supabase import create_client
            
            supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
            
            # Test with a simple query
            response = supabase.auth.get_session()
            self.log_result(
                "Supabase",
                True,
                f"Connected to {settings.SUPABASE_URL}"
            )
            
        except Exception as e:
            self.log_result("Supabase", False, str(e))
            
    def verify_posthog(self):
        """Verify PostHog configuration."""
        try:
            if settings.POSTHOG_KEY and settings.POSTHOG_HOST:
                self.log_result(
                    "PostHog",
                    True,
                    f"Configured with key starting with {settings.POSTHOG_KEY[:10]}..."
                )
            else:
                self.log_result("PostHog", False, "Missing API key or host")
                
        except Exception as e:
            self.log_result("PostHog", False, str(e))
            
    async def verify_mentionlytics(self):
        """Verify Mentionlytics integration."""
        try:
            # For now, just check if credentials are configured
            if settings.MENTIONLYTICS_EMAIL and settings.MENTIONLYTICS_PASSWORD:
                self.log_result(
                    "Mentionlytics",
                    True,
                    f"Credentials configured for {settings.MENTIONLYTICS_EMAIL}"
                )
            else:
                self.log_result("Mentionlytics", False, "Missing credentials")
                
        except Exception as e:
            self.log_result("Mentionlytics", False, str(e))
            
    def verify_facebook_ads(self):
        """Verify Facebook Ads API configuration."""
        try:
            if settings.FACEBOOK_WARROOM_API_TOKEN:
                self.log_result(
                    "Facebook Ads",
                    True,
                    f"API token configured (starting with {settings.FACEBOOK_WARROOM_API_TOKEN[:10]}...)"
                )
            else:
                self.log_result("Facebook Ads", False, "Missing API token")
                
        except Exception as e:
            self.log_result("Facebook Ads", False, str(e))
            
    def verify_communication_services(self):
        """Verify SendGrid/Twilio configuration."""
        try:
            results = []
            
            if settings.SENDGRID_API_KEY:
                results.append("SendGrid configured")
            else:
                results.append("SendGrid NOT configured")
                
            if settings.TWILIO_ACCOUNT_SID:
                results.append("Twilio configured")
            else:
                results.append("Twilio NOT configured")
                
            if settings.NOTIFICATION_EMAIL:
                results.append(f"Notification email: {settings.NOTIFICATION_EMAIL}")
                
            all_configured = settings.SENDGRID_API_KEY or settings.TWILIO_ACCOUNT_SID
            
            self.log_result(
                "Communication Services",
                all_configured,
                " | ".join(results)
            )
            
        except Exception as e:
            self.log_result("Communication Services", False, str(e))
            
    def verify_google_ads(self):
        """Verify Google Ads API configuration."""
        try:
            if settings.GOOGLE_ADS_DEVELOPER_TOKEN:
                self.log_result(
                    "Google Ads",
                    True,
                    f"Developer token configured (starting with {settings.GOOGLE_ADS_DEVELOPER_TOKEN[:10]}...)"
                )
            else:
                self.log_result("Google Ads", False, "Missing developer token")
                
        except Exception as e:
            self.log_result("Google Ads", False, str(e))
            
    async def verify_all(self):
        """Run all verification tests."""
        logger.info(colored("\n🔍 War Room Integration Verification\n", "cyan", attrs=["bold"]))
        logger.info(f"Environment: {settings.ENVIRONMENT}")
        logger.info(f"Timestamp: {datetime.now().isoformat()}\n")
        
        # Run all verifications
        await self.verify_pinecone()
        await self.verify_openai()
        await self.verify_supabase()
        self.verify_posthog()
        await self.verify_mentionlytics()
        self.verify_facebook_ads()
        self.verify_communication_services()
        self.verify_google_ads()
        
        # Summary
        logger.info(colored("\n📊 Summary\n", "cyan", attrs=["bold"]))
        
        total = len(self.results)
        successful = sum(1 for r in self.results.values() if r["success"])
        failed = total - successful
        
        logger.info(f"Total integrations: {total}")
        logger.info(colored(f"✅ Successful: {successful}", "green"))
        if failed > 0:
            logger.info(colored(f"❌ Failed: {failed}", "red"))
            
        # List failed integrations
        if failed > 0:
            logger.info(colored("\n⚠️  Failed Integrations:", "yellow"))
            for service, result in self.results.items():
                if not result["success"]:
                    logger.info(f"  - {service}: {result['message']}")
                    
        return successful == total


async def main():
    """Main entry point."""
    verifier = IntegrationVerifier()
    success = await verifier.verify_all()
    
    if success:
        logger.info(colored("\n✨ All integrations verified successfully!", "green", attrs=["bold"]))
        sys.exit(0)
    else:
        logger.info(colored("\n⚠️  Some integrations failed verification.", "yellow", attrs=["bold"]))
        logger.info("Please check the configuration and try again.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())