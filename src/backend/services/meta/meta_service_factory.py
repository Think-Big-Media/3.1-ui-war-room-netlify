"""
Meta Service Factory

Provides a factory for creating Meta API service instances with support for
both real Meta API and mock implementations for development/testing.

Features:
- Environment-based service selection
- Configuration management
- Service interface compatibility
- Development mode detection
- Testing scenario support
"""

import os
from typing import Union, Optional
from enum import Enum

from .mock_meta_service import MockMetaService, MockConfig, MockScenario, MOCK_SCENARIOS
# from .real_meta_service import RealMetaService  # Would import real implementation


class ServiceMode(Enum):
    """Available service modes."""
    PRODUCTION = "production"
    DEVELOPMENT = "development" 
    TESTING = "testing"
    MOCK = "mock"


class MetaServiceConfig:
    """Configuration for Meta service creation."""
    
    def __init__(self):
        # Environment detection
        self.environment = os.getenv("ENVIRONMENT", "development").lower()
        self.debug_mode = os.getenv("DEBUG", "false").lower() == "true"
        self.testing = os.getenv("TESTING", "false").lower() == "true"
        
        # Meta API credentials
        self.meta_app_id = os.getenv("META_APP_ID")
        self.meta_app_secret = os.getenv("META_APP_SECRET") 
        self.meta_api_version = os.getenv("META_API_VERSION", "v18.0")
        
        # Service behavior
        self.force_mock = os.getenv("FORCE_MOCK_META", "false").lower() == "true"
        self.mock_scenario = os.getenv("MOCK_META_SCENARIO", "success")
        
        # API configuration
        self.api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        self.rate_limit_enabled = os.getenv("META_RATE_LIMIT_ENABLED", "true").lower() == "true"
        
    @property
    def service_mode(self) -> ServiceMode:
        """Determine which service mode to use based on configuration."""
        
        # Force mock if explicitly requested
        if self.force_mock:
            return ServiceMode.MOCK
        
        # Use mock if testing
        if self.testing:
            return ServiceMode.TESTING
        
        # Use mock if no credentials in development
        if (self.environment == "development" and 
            (not self.meta_app_id or not self.meta_app_secret)):
            return ServiceMode.DEVELOPMENT
        
        # Use production service if credentials available
        if self.meta_app_id and self.meta_app_secret:
            return ServiceMode.PRODUCTION
        
        # Default to mock for safety
        return ServiceMode.MOCK
    
    @property
    def is_mock_mode(self) -> bool:
        """Check if service should use mock implementation."""
        return self.service_mode in [ServiceMode.MOCK, ServiceMode.DEVELOPMENT, ServiceMode.TESTING]
    
    def validate(self) -> bool:
        """Validate configuration for production use."""
        if self.service_mode == ServiceMode.PRODUCTION:
            required_vars = [
                ("META_APP_ID", self.meta_app_id),
                ("META_APP_SECRET", self.meta_app_secret)
            ]
            
            missing = [name for name, value in required_vars if not value]
            if missing:
                raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        return True


class MetaServiceFactory:
    """
    Factory for creating Meta API service instances.
    
    Automatically selects between real Meta API service and mock service
    based on environment configuration and available credentials.
    """
    
    def __init__(self, config: MetaServiceConfig = None):
        self.config = config or MetaServiceConfig()
        self._service_cache = {}
    
    def create_service(self, user_id: str = None) -> Union[MockMetaService]:
        """
        Create Meta service instance based on configuration.
        
        Args:
            user_id: Optional user ID for service caching
            
        Returns:
            Meta service instance (real or mock)
        """
        service_key = f"{self.config.service_mode.value}_{user_id or 'default'}"
        
        # Return cached service if available
        if service_key in self._service_cache:
            return self._service_cache[service_key]
        
        # Create new service instance
        if self.config.is_mock_mode:
            service = self._create_mock_service()
        else:
            service = self._create_real_service()
        
        # Cache service for reuse
        self._service_cache[service_key] = service
        
        return service
    
    def _create_mock_service(self) -> MockMetaService:
        """Create mock Meta service with appropriate configuration."""
        
        # Get mock configuration based on scenario
        mock_config = MOCK_SCENARIOS.get(
            self.config.mock_scenario,
            MOCK_SCENARIOS["success"]
        )
        
        # Adjust configuration based on environment
        if self.config.environment == "testing":
            # Faster responses for testing
            mock_config.response_delay = 0.1
        elif self.config.debug_mode:
            # More verbose responses for debugging
            mock_config.response_delay = 0.0
        
        return MockMetaService(mock_config)
    
    def _create_real_service(self):
        """Create real Meta API service."""
        # In a real implementation, this would create the actual Meta API service
        # For now, we'll use mock service as placeholder
        
        # TODO: Implement RealMetaService
        # return RealMetaService(
        #     app_id=self.config.meta_app_id,
        #     app_secret=self.config.meta_app_secret,
        #     api_version=self.config.meta_api_version
        # )
        
        # Temporary: return mock service configured to simulate real API
        mock_config = MockConfig(
            scenario=MockScenario.SUCCESS,
            response_delay=0.8,  # Simulate real API latency
            failure_rate=0.01    # Occasional failures like real API
        )
        
        return MockMetaService(mock_config)
    
    def get_service_info(self) -> dict:
        """Get information about current service configuration."""
        return {
            "service_mode": self.config.service_mode.value,
            "is_mock": self.config.is_mock_mode,
            "environment": self.config.environment,
            "mock_scenario": self.config.mock_scenario if self.config.is_mock_mode else None,
            "has_credentials": bool(self.config.meta_app_id and self.config.meta_app_secret),
            "api_version": self.config.meta_api_version
        }
    
    def clear_cache(self):
        """Clear cached service instances."""
        self._service_cache.clear()
    
    @classmethod
    def create_for_testing(cls, scenario: str = "success") -> 'MetaServiceFactory':
        """
        Create factory configured for testing with specific scenario.
        
        Args:
            scenario: Mock scenario name
            
        Returns:
            Factory configured for testing
        """
        config = MetaServiceConfig()
        config.testing = True
        config.force_mock = True
        config.mock_scenario = scenario
        
        return cls(config)
    
    @classmethod 
    def create_for_development(cls, use_mock: bool = True) -> 'MetaServiceFactory':
        """
        Create factory configured for development.
        
        Args:
            use_mock: Whether to force mock service usage
            
        Returns:
            Factory configured for development
        """
        config = MetaServiceConfig()
        config.environment = "development"
        config.debug_mode = True
        config.force_mock = use_mock
        
        return cls(config)


# Global factory instance
_default_factory = None


def get_meta_service(user_id: str = None) -> Union[MockMetaService]:
    """
    Convenience function to get Meta service instance.
    
    Args:
        user_id: Optional user ID
        
    Returns:
        Meta service instance
    """
    global _default_factory
    
    if _default_factory is None:
        _default_factory = MetaServiceFactory()
    
    return _default_factory.create_service(user_id)


def get_service_info() -> dict:
    """Get information about current service configuration."""
    global _default_factory
    
    if _default_factory is None:
        _default_factory = MetaServiceFactory()
    
    return _default_factory.get_service_info()


def configure_mock_scenario(scenario: str):
    """
    Configure mock scenario for current environment.
    
    Args:
        scenario: Mock scenario name
    """
    os.environ["FORCE_MOCK_META"] = "true"
    os.environ["MOCK_META_SCENARIO"] = scenario
    
    # Clear factory cache to pick up new configuration
    global _default_factory
    if _default_factory:
        _default_factory.clear_cache()
        _default_factory = None


# Development utilities
class DevMetaService:
    """
    Development utilities for Meta service.
    
    Provides convenient methods for switching between different
    configurations during development and testing.
    """
    
    @staticmethod
    def use_mock(scenario: str = "success"):
        """Switch to mock service with specified scenario."""
        configure_mock_scenario(scenario)
        print(f"✅ Switched to mock Meta service (scenario: {scenario})")
    
    @staticmethod
    def use_real():
        """Switch to real Meta API service."""
        os.environ["FORCE_MOCK_META"] = "false"
        
        # Clear factory cache
        global _default_factory
        if _default_factory:
            _default_factory.clear_cache()
            _default_factory = None
        
        print("✅ Switched to real Meta API service")
    
    @staticmethod
    def list_scenarios():
        """List available mock scenarios."""
        print("📋 Available Mock Scenarios:")
        for name, config in MOCK_SCENARIOS.items():
            print(f"  • {name:15} - {config.scenario.value}")
    
    @staticmethod
    def test_service(user_id: str = "dev_user"):
        """Quick test of current service configuration."""
        import asyncio
        
        async def _test():
            service = get_meta_service(user_id)
            info = get_service_info()
            
            print(f"🔧 Service Info: {info}")
            
            try:
                # Test OAuth
                result = await service.handle_oauth_callback(
                    code="test_code",
                    redirect_uri="http://localhost:8000/callback",
                    user_id=user_id
                )
                print(f"✅ OAuth test successful")
                
                # Test ad accounts
                accounts = await service.get_ad_accounts(user_id)
                print(f"✅ Found {len(accounts['data'])} ad accounts")
                
                return True
                
            except Exception as e:
                print(f"❌ Service test failed: {e}")
                return False
        
        return asyncio.run(_test())
    
    @staticmethod
    def demo_data():
        """Generate demo data for development."""
        service = get_meta_service("demo_user")
        
        if isinstance(service, MockMetaService):
            return {
                "ad_accounts": len(service._mock_ad_accounts),
                "campaigns": len(service._mock_campaigns),
                "insights": len(service._mock_insights),
                "scenarios": list(MOCK_SCENARIOS.keys())
            }
        else:
            return {"message": "Demo data only available in mock mode"}


# Example usage and configuration
if __name__ == "__main__":
    # Example: Development setup
    print("🚀 Meta Service Factory Demo")
    
    # Show current configuration
    info = get_service_info()
    print(f"📊 Current configuration: {info}")
    
    # List available scenarios
    DevMetaService.list_scenarios()
    
    # Test current service
    print("\n🧪 Testing current service...")
    success = DevMetaService.test_service()
    
    if success:
        print("✅ Service is working correctly")
    else:
        print("❌ Service test failed")
    
    # Demo switching scenarios
    print("\n🔄 Testing scenario switching...")
    
    scenarios_to_test = ["success", "rate_limited", "no_ad_accounts"]
    
    for scenario in scenarios_to_test:
        print(f"\n--- Testing {scenario} ---")
        DevMetaService.use_mock(scenario)
        DevMetaService.test_service()
    
    print("\n✅ Demo complete!")