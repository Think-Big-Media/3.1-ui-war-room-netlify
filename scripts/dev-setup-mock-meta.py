#!/usr/bin/env python3
"""
Development Setup Script for Mock Meta API

This script sets up the development environment for using the Mock Meta API
service, including configuration, testing, and demonstration.

Usage:
    python scripts/dev-setup-mock-meta.py [command]

Commands:
    setup    - Initial setup and configuration
    test     - Test mock service functionality  
    demo     - Run interactive demo
    scenarios - List and test all scenarios
    reset    - Reset configuration to defaults
"""

import os
import sys
import asyncio
import json
from pathlib import Path
from typing import Dict, Any

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "backend"))

try:
    from services.meta.meta_service_factory import (
        get_meta_service, 
        get_service_info,
        DevMetaService,
        MetaServiceFactory
    )
    from services.meta.mock_meta_service import MOCK_SCENARIOS
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the project root directory")
    sys.exit(1)


class MockMetaSetup:
    """Setup and management for Mock Meta API development environment."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.env_file = self.project_root / ".env"
        
    def setup(self):
        """Initial setup and configuration."""
        print("🚀 Setting up Mock Meta API for development\n")
        
        # Check current configuration
        print("📊 Current Configuration:")
        info = get_service_info()
        for key, value in info.items():
            print(f"  • {key}: {value}")
        print()
        
        # Update .env file with mock configuration
        self._update_env_file()
        
        # Test the setup
        print("🧪 Testing mock service setup...")
        success = self._test_basic_functionality()
        
        if success:
            print("✅ Mock Meta API setup complete!")
            print("\nNext steps:")
            print("  1. Start your development server: uvicorn main:app --reload")
            print("  2. Test different scenarios: python scripts/dev-setup-mock-meta.py scenarios")
            print("  3. Check documentation: docs/DEVELOPMENT_MOCK_DATA_SYSTEM.md")
        else:
            print("❌ Setup failed. Check error messages above.")
            return False
        
        return True
    
    def test(self):
        """Test mock service functionality."""
        print("🧪 Testing Mock Meta API Service\n")
        
        # Test current configuration
        info = get_service_info()
        print(f"📊 Service Info: {info}\n")
        
        if not info["is_mock"]:
            print("⚠️  Warning: Not using mock service!")
            response = input("Switch to mock mode? (y/N): ")
            if response.lower() == 'y':
                self._force_mock_mode()
            else:
                print("Testing real API service...")
        
        # Run comprehensive tests
        success = asyncio.run(self._run_comprehensive_tests())
        
        if success:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed. Check output above.")
        
        return success
    
    def demo(self):
        """Run interactive demo of mock service."""
        print("🎮 Interactive Mock Meta API Demo\n")
        
        while True:
            print("\n📋 Demo Options:")
            print("  1. Test OAuth Flow")
            print("  2. Explore Ad Accounts")
            print("  3. View Campaign Data")
            print("  4. Test Error Scenarios")
            print("  5. Switch Scenarios")
            print("  6. Service Information")
            print("  0. Exit")
            
            choice = input("\nSelect option (0-6): ").strip()
            
            if choice == "0":
                print("👋 Demo complete!")
                break
            elif choice == "1":
                asyncio.run(self._demo_oauth_flow())
            elif choice == "2":
                asyncio.run(self._demo_ad_accounts())
            elif choice == "3":
                asyncio.run(self._demo_campaigns())
            elif choice == "4":
                asyncio.run(self._demo_error_scenarios())
            elif choice == "5":
                self._demo_scenario_switching()
            elif choice == "6":
                self._show_service_info()
            else:
                print("❌ Invalid option. Please try again.")
    
    def scenarios(self):
        """List and test all mock scenarios."""
        print("🎭 Mock Meta API Scenarios\n")
        
        print("📋 Available Scenarios:")
        for name, config in MOCK_SCENARIOS.items():
            print(f"  • {name:15} - {config.scenario.value}")
        print()
        
        # Test each scenario
        print("🧪 Testing each scenario...")
        
        for scenario_name in MOCK_SCENARIOS.keys():
            print(f"\n--- Testing {scenario_name} ---")
            
            # Switch to scenario
            DevMetaService.use_mock(scenario_name)
            
            # Quick test
            success = asyncio.run(self._quick_scenario_test(scenario_name))
            
            if success:
                print(f"✅ {scenario_name} working correctly")
            else:
                print(f"❌ {scenario_name} test failed")
        
        # Reset to success scenario
        DevMetaService.use_mock("success")
        print("\n🔄 Reset to 'success' scenario")
    
    def reset(self):
        """Reset configuration to defaults."""
        print("🔄 Resetting Mock Meta API configuration to defaults\n")
        
        # Reset environment variables
        env_vars = {
            "ENVIRONMENT": "development",
            "DEBUG": "true",
            "FORCE_MOCK_META": "true",
            "MOCK_META_SCENARIO": "success",
            "TESTING": "false"
        }
        
        for var, value in env_vars.items():
            os.environ[var] = value
            
        # Update .env file
        self._update_env_file()
        
        # Clear service cache
        DevMetaService.use_mock("success")
        
        print("✅ Configuration reset to defaults")
        print("📊 Current configuration:")
        info = get_service_info()
        for key, value in info.items():
            print(f"  • {key}: {value}")
    
    # Private helper methods
    
    def _update_env_file(self):
        """Update .env file with mock configuration."""
        print("📝 Updating .env file...")
        
        # Read existing .env file
        env_vars = {}
        if self.env_file.exists():
            with open(self.env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key] = value
        
        # Add/update mock configuration
        mock_config = {
            "ENVIRONMENT": "development",
            "DEBUG": "true", 
            "FORCE_MOCK_META": "true",
            "MOCK_META_SCENARIO": "success"
        }
        
        env_vars.update(mock_config)
        
        # Write updated .env file
        with open(self.env_file, 'w') as f:
            f.write("# War Room Development Configuration\n")
            f.write("# Generated by dev-setup-mock-meta.py\n\n")
            
            f.write("# Mock Meta API Configuration\n")
            for key in ["ENVIRONMENT", "DEBUG", "FORCE_MOCK_META", "MOCK_META_SCENARIO"]:
                if key in env_vars:
                    f.write(f"{key}={env_vars[key]}\n")
            f.write("\n")
            
            f.write("# Other Configuration\n")
            for key, value in env_vars.items():
                if key not in mock_config:
                    f.write(f"{key}={value}\n")
        
        print(f"✅ Updated {self.env_file}")
    
    def _force_mock_mode(self):
        """Force switch to mock mode."""
        os.environ["FORCE_MOCK_META"] = "true"
        os.environ["MOCK_META_SCENARIO"] = "success"
        DevMetaService.use_mock("success")
    
    def _test_basic_functionality(self) -> bool:
        """Test basic mock service functionality."""
        return DevMetaService.test_service("setup_test_user")
    
    async def _run_comprehensive_tests(self) -> bool:
        """Run comprehensive tests of mock service."""
        test_user = "comprehensive_test_user"
        
        try:
            service = get_meta_service(test_user)
            
            # Test 1: OAuth flow
            print("🔐 Testing OAuth flow...")
            oauth_result = await service.handle_oauth_callback(
                code="test_code_123",
                redirect_uri="http://localhost:8000/callback",
                user_id=test_user
            )
            print(f"  ✅ OAuth successful: {oauth_result['access_token'][:20]}...")
            
            # Test 2: Ad accounts
            print("📊 Testing ad accounts retrieval...")
            accounts = await service.get_ad_accounts(test_user)
            print(f"  ✅ Found {len(accounts['data'])} ad accounts")
            
            if not accounts["data"]:
                print("  ⚠️  No ad accounts found - check mock data generation")
                return False
            
            # Test 3: Campaigns
            print("🎯 Testing campaigns retrieval...")
            first_account = accounts["data"][0]["id"]
            campaigns = await service.get_campaigns(first_account, test_user)
            print(f"  ✅ Found {len(campaigns['data'])} campaigns")
            
            # Test 4: Insights
            if campaigns["data"]:
                print("📈 Testing campaign insights...")
                first_campaign = campaigns["data"][0]["id"]
                insights = await service.get_campaign_insights(first_campaign, test_user)
                print(f"  ✅ Found {len(insights['data'])} insight records")
            
            # Test 5: Auth status
            print("🔍 Testing auth status...")
            auth_status = await service.get_auth_status(test_user)
            print(f"  ✅ Auth status: {auth_status['authenticated']}")
            
            # Test 6: Token refresh
            print("🔄 Testing token refresh...")
            refresh_result = await service.refresh_access_token(test_user)
            print(f"  ✅ Token refresh successful")
            
            return True
            
        except Exception as e:
            print(f"  ❌ Test failed: {e}")
            return False
    
    async def _quick_scenario_test(self, scenario_name: str) -> bool:
        """Quick test of specific scenario."""
        test_user = f"scenario_test_{scenario_name}"
        
        try:
            service = get_meta_service(test_user)
            
            # Try OAuth - some scenarios should fail here
            await service.handle_oauth_callback(
                code="test_code",
                redirect_uri="http://localhost:8000/callback",
                user_id=test_user
            )
            
            # Try getting accounts
            await service.get_ad_accounts(test_user)
            
            return True
            
        except Exception as e:
            # Some scenarios are expected to fail
            expected_failures = ["rate_limited", "no_permissions", "unreliable"]
            if scenario_name in expected_failures:
                print(f"  ✅ Expected error for {scenario_name}: {type(e).__name__}")
                return True
            else:
                print(f"  ❌ Unexpected error for {scenario_name}: {e}")
                return False
    
    async def _demo_oauth_flow(self):
        """Demo OAuth flow."""
        print("\n🔐 OAuth Flow Demo")
        
        user_id = input("Enter test user ID (or press Enter for 'demo_user'): ").strip()
        if not user_id:
            user_id = "demo_user"
        
        try:
            service = get_meta_service(user_id)
            
            print(f"📤 Initiating OAuth for user: {user_id}")
            
            result = await service.handle_oauth_callback(
                code="demo_authorization_code",
                redirect_uri="http://localhost:8000/callback",
                user_id=user_id
            )
            
            print("✅ OAuth flow completed successfully!")
            print(f"  • Access Token: {result['access_token'][:30]}...")
            print(f"  • User ID: {result['user_id']}")
            print(f"  • Account ID: {result.get('account_id', 'None')}")
            
        except Exception as e:
            print(f"❌ OAuth flow failed: {e}")
    
    async def _demo_ad_accounts(self):
        """Demo ad accounts retrieval."""
        print("\n📊 Ad Accounts Demo")
        
        user_id = "demo_user"
        service = get_meta_service(user_id)
        
        try:
            accounts = await service.get_ad_accounts(user_id)
            
            print(f"Found {len(accounts['data'])} ad accounts:\n")
            
            for i, account in enumerate(accounts["data"], 1):
                print(f"{i}. {account['name']}")
                print(f"   • ID: {account['id']}")
                print(f"   • Currency: {account['currency']}")
                print(f"   • Amount Spent: ${account['amount_spent']}")
                print(f"   • Balance: ${account['balance']}")
                print()
            
        except Exception as e:
            print(f"❌ Failed to retrieve ad accounts: {e}")
    
    async def _demo_campaigns(self):
        """Demo campaign data."""
        print("\n🎯 Campaign Data Demo")
        
        user_id = "demo_user"
        service = get_meta_service(user_id)
        
        try:
            # Get accounts first
            accounts = await service.get_ad_accounts(user_id)
            
            if not accounts["data"]:
                print("No ad accounts available for campaign demo")
                return
            
            # Use first account
            account = accounts["data"][0]
            print(f"Using account: {account['name']} ({account['id']})")
            
            # Get campaigns
            campaigns = await service.get_campaigns(account["id"], user_id)
            
            print(f"\nFound {len(campaigns['data'])} campaigns:\n")
            
            for i, campaign in enumerate(campaigns["data"][:3], 1):  # Show first 3
                print(f"{i}. {campaign['name']}")
                print(f"   • ID: {campaign['id']}")
                print(f"   • Objective: {campaign['objective']}")
                print(f"   • Status: {campaign['status']}")
                print(f"   • Daily Budget: ${campaign.get('daily_budget', 'N/A')}")
                
                # Get insights for this campaign
                insights = await service.get_campaign_insights(campaign["id"], user_id)
                if insights["data"]:
                    insight = insights["data"][0]  # Latest insight
                    print(f"   • Recent Performance:")
                    print(f"     - Spend: ${insight['spend']}")
                    print(f"     - Impressions: {insight['impressions']}")
                    print(f"     - Clicks: {insight['clicks']}")
                    print(f"     - CTR: {insight['ctr']}%")
                
                print()
            
        except Exception as e:
            print(f"❌ Failed to retrieve campaign data: {e}")
    
    async def _demo_error_scenarios(self):
        """Demo error scenarios."""
        print("\n❌ Error Scenarios Demo")
        
        error_scenarios = ["rate_limited", "no_permissions", "unreliable"]
        
        for scenario in error_scenarios:
            print(f"\n--- Testing {scenario} ---")
            
            # Switch to error scenario
            DevMetaService.use_mock(scenario)
            
            user_id = f"error_demo_{scenario}"
            service = get_meta_service(user_id)
            
            try:
                # Try operations that should fail
                if scenario == "rate_limited":
                    print("Making requests to trigger rate limiting...")
                    for i in range(5):
                        await service.get_ad_accounts(user_id)
                        print(f"  Request {i+1}: Success")
                        
                elif scenario == "no_permissions":
                    print("Attempting OAuth callback (should fail)...")
                    await service.handle_oauth_callback(
                        code="test_code",
                        redirect_uri="http://localhost:8000/callback",
                        user_id=user_id
                    )
                    
                elif scenario == "unreliable":
                    print("Making multiple requests (some may fail)...")
                    for i in range(5):
                        try:
                            await service.get_ad_accounts(user_id)
                            print(f"  Request {i+1}: Success")
                        except Exception as e:
                            print(f"  Request {i+1}: Failed ({type(e).__name__})")
                
            except Exception as e:
                print(f"  ✅ Expected error: {type(e).__name__}: {e}")
        
        # Reset to success scenario
        DevMetaService.use_mock("success")
        print("\n🔄 Reset to success scenario")
    
    def _demo_scenario_switching(self):
        """Demo scenario switching."""
        print("\n🔄 Scenario Switching Demo")
        
        print("Available scenarios:")
        scenarios = list(MOCK_SCENARIOS.keys())
        for i, scenario in enumerate(scenarios, 1):
            print(f"  {i}. {scenario}")
        
        while True:
            choice = input(f"\nSelect scenario (1-{len(scenarios)} or 0 to exit): ").strip()
            
            if choice == "0":
                break
                
            try:
                scenario_index = int(choice) - 1
                if 0 <= scenario_index < len(scenarios):
                    scenario = scenarios[scenario_index]
                    
                    print(f"🔄 Switching to '{scenario}' scenario...")
                    DevMetaService.use_mock(scenario)
                    
                    # Test the scenario
                    success = DevMetaService.test_service("scenario_switch_test")
                    
                    if success:
                        print(f"✅ Successfully switched to '{scenario}' scenario")
                    else:
                        print(f"❌ Error testing '{scenario}' scenario")
                        
                else:
                    print("❌ Invalid selection")
                    
            except ValueError:
                print("❌ Please enter a number")
    
    def _show_service_info(self):
        """Show current service information."""
        print("\n📊 Current Service Information")
        
        info = get_service_info()
        
        print("Configuration:")
        for key, value in info.items():
            print(f"  • {key}: {value}")
        
        # Show environment variables
        print("\nEnvironment Variables:")
        env_vars = [
            "ENVIRONMENT", "DEBUG", "FORCE_MOCK_META", 
            "MOCK_META_SCENARIO", "META_APP_ID", "META_APP_SECRET"
        ]
        
        for var in env_vars:
            value = os.getenv(var, "Not set")
            # Hide sensitive values
            if "SECRET" in var and value != "Not set":
                value = f"{value[:8]}..." if len(value) > 8 else "***"
            print(f"  • {var}: {value}")


def main():
    """Main entry point."""
    setup = MockMetaSetup()
    
    if len(sys.argv) < 2:
        command = "setup"
    else:
        command = sys.argv[1].lower()
    
    if command == "setup":
        setup.setup()
    elif command == "test":
        setup.test()
    elif command == "demo":
        setup.demo()
    elif command == "scenarios":
        setup.scenarios()
    elif command == "reset":
        setup.reset()
    else:
        print(f"❌ Unknown command: {command}")
        print("\nAvailable commands:")
        print("  setup     - Initial setup and configuration")
        print("  test      - Test mock service functionality")
        print("  demo      - Run interactive demo")
        print("  scenarios - List and test all scenarios")
        print("  reset     - Reset configuration to defaults")
        sys.exit(1)


if __name__ == "__main__":
    main()