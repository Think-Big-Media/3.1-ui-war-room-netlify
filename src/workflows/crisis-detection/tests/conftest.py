"""
Pytest configuration and shared fixtures for crisis detection tests
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock

from ..agents.crisis_detection import CrisisMention, CrisisAnalysis
from ..agents.alert_routing import RecipientProfile, AlertRoute, AlertPriority
from ..agents.monitoring import MentionlyticsConfig


# Event loop fixture for async tests
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Common test data fixtures
@pytest.fixture
def mock_openai_api_key():
    """Mock OpenAI API key for testing"""
    return "sk-test-openai-key-12345"


@pytest.fixture
def sample_crisis_mentions():
    """Sample crisis mentions for testing"""
    base_time = datetime.now()
    
    return [
        CrisisMention(
            mention_id="crisis_001",
            content="BREAKING: Leaked documents show candidate knew about the corruption scandal all along #Scandal #Politics",
            source="twitter",
            author="investigative_reporter",
            url="https://twitter.com/reporter/status/123",
            sentiment_score=-0.9,
            reach_count=45000,
            engagement_count=2800,
            published_at=base_time - timedelta(hours=2),
            keywords=["leaked", "documents", "corruption", "scandal"]
        ),
        CrisisMention(
            mention_id="crisis_002",
            content="This candidate's economic policy will bankrupt middle-class families. Completely irresponsible!",
            source="facebook",
            author="concerned_citizen_mom",
            url="https://facebook.com/post/456",
            sentiment_score=-0.7,
            reach_count=8500,
            engagement_count=340,
            published_at=base_time - timedelta(hours=1, minutes=30),
            keywords=["economic", "policy", "bankrupt", "families"]
        ),
        CrisisMention(
            mention_id="crisis_003", 
            content="The candidate's response to the healthcare crisis shows they don't understand working families",
            source="reddit",
            author="healthcare_worker_jane",
            url="https://reddit.com/r/politics/comments/789",
            sentiment_score=-0.6,
            reach_count=12000,
            engagement_count=890,
            published_at=base_time - timedelta(hours=1),
            keywords=["healthcare", "crisis", "working", "families"]
        ),
        CrisisMention(
            mention_id="positive_001",
            content="Finally, a candidate who understands what working families need. Full support! #Leadership",
            source="twitter",
            author="union_leader_bob",
            url="https://twitter.com/union/status/101112",
            sentiment_score=0.8,
            reach_count=3200,
            engagement_count=150,
            published_at=base_time - timedelta(minutes=45),
            keywords=["support", "leadership", "families"]
        )
    ]


@pytest.fixture
def sample_campaign_context():
    """Sample campaign context for testing"""
    return {
        "candidate_name": "Sarah Johnson",
        "campaign_id": "campaign_2024_001",
        "key_issues": ["healthcare", "economy", "education", "climate"],
        "opponents": ["Mike Thompson", "Lisa Chen"],
        "monitor_keywords": ["scandal", "corruption", "leaked", "controversy", "crisis"],
        "campaign_staff": [
            {"role": "campaign_manager", "name": "Alex Rodriguez"},
            {"role": "communications_director", "name": "Jamie Smith"},
            {"role": "digital_director", "name": "Taylor Park"}
        ],
        "vulnerabilities": [
            "past business dealings",
            "healthcare funding position", 
            "climate change stance"
        ],
        "geographic_focus": ["Ohio", "Pennsylvania", "Michigan"],
        "election_date": "2024-11-05",
        "current_polling": {"approval": 47, "disapproval": 41, "undecided": 12}
    }


@pytest.fixture
def sample_recipient_profiles():
    """Sample recipient profiles for testing"""
    return {
        "campaign_manager": RecipientProfile(
            id="cm_001",
            name="Alex Rodriguez",
            role="campaign_manager",
            email="alex@campaign2024.com",
            phone="+15551234567",
            slack_id="U001ALEXR",
            expertise_areas=["strategy", "crisis_management", "media_relations"],
            availability_hours=(6, 23),  # Early bird, works late
            timezone="America/New_York",
            channel_preferences={
                "email": {"enabled": True, "max_priority": "medium"},
                "sms": {"enabled": True, "max_priority": "high"},
                "slack": {"enabled": True, "max_priority": "medium"},
                "phone_call": {"enabled": True, "max_priority": "critical"}
            },
            response_history={
                "avg_score": 0.9,
                "responses": [
                    {"timestamp": datetime.now() - timedelta(days=1), "response_time_minutes": 12, "effectiveness_score": 0.95},
                    {"timestamp": datetime.now() - timedelta(days=3), "response_time_minutes": 8, "effectiveness_score": 0.85}
                ]
            }
        ),
        "comms_director": RecipientProfile(
            id="cd_001", 
            name="Jamie Smith",
            role="communications_director",
            email="jamie@campaign2024.com",
            phone="+15551234568",
            slack_id="U002JAMIES",
            expertise_areas=["media_relations", "messaging", "crisis_communications", "press"],
            availability_hours=(5, 22),  # Media schedule
            timezone="America/New_York",
            channel_preferences={
                "email": {"enabled": True, "max_priority": "low"},
                "sms": {"enabled": True, "max_priority": "critical"},
                "slack": {"enabled": True, "max_priority": "high"},
                "phone_call": {"enabled": True, "max_priority": "critical"}
            },
            response_history={
                "avg_score": 0.88,
                "responses": [
                    {"timestamp": datetime.now() - timedelta(days=2), "response_time_minutes": 15, "effectiveness_score": 0.9},
                    {"timestamp": datetime.now() - timedelta(days=5), "response_time_minutes": 20, "effectiveness_score": 0.85}
                ]
            }
        ),
        "digital_director": RecipientProfile(
            id="dd_001",
            name="Taylor Park", 
            role="digital_director",
            email="taylor@campaign2024.com",
            phone="+15551234569",
            slack_id="U003TAYLORP",
            expertise_areas=["social_media", "digital_strategy", "online_reputation", "content"],
            availability_hours=(8, 20),  # Standard business hours
            timezone="America/Los_Angeles",  # West coast
            channel_preferences={
                "email": {"enabled": True, "max_priority": "medium"},
                "sms": {"enabled": True, "max_priority": "high"},
                "slack": {"enabled": True, "max_priority": "low"},  # Prefers other channels
                "phone_call": {"enabled": False, "max_priority": "critical"}  # Doesn't like calls
            }
        )
    }


@pytest.fixture
def high_severity_crisis_analysis():
    """High severity crisis analysis for testing escalation scenarios"""
    return CrisisAnalysis(
        severity=9,
        confidence=0.95,
        threat_type="major_scandal",
        affected_topics=["candidate_integrity", "campaign_viability", "donor_confidence"],
        recommended_actions=[
            "IMMEDIATE: Convene emergency crisis team meeting",
            "IMMEDIATE: Draft comprehensive public statement",
            "IMMEDIATE: Brief all surrogates and staff",
            "IMMEDIATE: Prepare for media interviews",
            "URGENT: Conduct internal investigation",
            "URGENT: Legal review of all statements"
        ],
        escalation_required=True,
        reasoning="""
        Major scandal detected with extremely high viral potential. 
        Leaked documents have high credibility and involve core campaign vulnerabilities.
        Rapid response required within 2 hours to prevent narrative lock-in.
        Multiple high-influence accounts amplifying the story.
        Traditional media pickup likely within 6 hours.
        """
    )


@pytest.fixture
def medium_severity_crisis_analysis():
    """Medium severity crisis analysis for testing standard workflows"""
    return CrisisAnalysis(
        severity=5,
        confidence=0.75,
        threat_type="policy_criticism",
        affected_topics=["healthcare_position", "working_families"],
        recommended_actions=[
            "MEDIUM: Monitor sentiment trends over next 4 hours",
            "MEDIUM: Prepare clarifying statement on healthcare position",
            "MEDIUM: Engage supportive healthcare advocates",
            "LOW: Consider proactive social media response"
        ],
        escalation_required=False,
        reasoning="""
        Policy criticism gaining some traction but within normal campaign discourse.
        Sentiment is negative but not extreme. Limited amplification by major accounts.
        Standard monitoring and response protocols appropriate.
        """
    )


@pytest.fixture
def mock_mentionlytics_config():
    """Mock Mentionlytics configuration"""
    return MentionlyticsConfig(
        api_key="test_mentionlytics_key_123",
        api_secret="test_mentionlytics_secret_456",
        base_url="https://api.mentionlytics.com/v1",
        webhook_secret="webhook_secret_789"
    )


@pytest.fixture
def mock_delivery_config():
    """Mock delivery configuration"""
    return {
        "email": {
            "enabled": True,
            "sendgrid_api_key": "SG.test_key_123",
            "from_email": "alerts@campaign2024.com",
            "from_name": "Campaign Alert System"
        },
        "sms": {
            "enabled": True,
            "twilio_account_sid": "ACtest123",
            "twilio_auth_token": "test_token_456",
            "from_number": "+15551234567"
        },
        "slack": {
            "enabled": True,
            "bot_token": "xoxb-test-token-123",
            "channel": "#crisis-alerts"
        },
        "phone_call": {
            "enabled": True,
            "twilio_account_sid": "ACtest123", 
            "twilio_auth_token": "test_token_456",
            "twiml_url": "https://campaign2024.com/twiml/crisis-alert"
        },
        "retry": {
            "max_attempts": 3,
            "backoff_seconds": [1, 5, 15]
        }
    }


# Mock utilities
@pytest.fixture
def mock_successful_llm_response():
    """Mock successful LLM response for testing"""
    mock_response = Mock()
    mock_response.content = """
    Crisis Analysis Complete:
    
    Severity: 8/10
    Confidence: 0.92
    Threat Type: leaked_documents_scandal
    
    This appears to be a serious crisis requiring immediate attention.
    The leaked documents have high credibility and involve sensitive campaign information.
    Rapid response and damage control measures are essential.
    
    Affected Topics: campaign_integrity, donor_relations, media_coverage
    
    Recommended Actions:
    1. Convene emergency crisis team meeting within 1 hour
    2. Draft comprehensive public statement addressing the leaks  
    3. Brief all surrogates and campaign staff immediately
    4. Prepare for aggressive media outreach and interviews
    5. Conduct internal audit of document security protocols
    """
    return mock_response


@pytest.fixture
def mock_failed_llm_response():
    """Mock failed LLM response for error testing"""
    mock_response = Mock()
    mock_response.content = "Error: Unable to analyze due to token limit exceeded"
    return mock_response


# Async mock helpers
@pytest.fixture
def async_mock():
    """Factory for creating async mocks"""
    def create_async_mock(return_value=None, side_effect=None):
        mock = AsyncMock()
        if return_value is not None:
            mock.return_value = return_value
        if side_effect is not None:
            mock.side_effect = side_effect
        return mock
    return create_async_mock


# Time utilities for testing
@pytest.fixture
def fixed_datetime():
    """Fixed datetime for consistent testing"""
    return datetime(2024, 1, 15, 14, 30, 0)  # Monday, 2:30 PM


@pytest.fixture
def time_windows():
    """Common time windows for testing"""
    base_time = datetime(2024, 1, 15, 14, 30, 0)
    return {
        "now": base_time,
        "1_hour_ago": base_time - timedelta(hours=1),
        "30_minutes_ago": base_time - timedelta(minutes=30),
        "15_minutes_ago": base_time - timedelta(minutes=15),
        "5_minutes_ago": base_time - timedelta(minutes=5),
        "tomorrow": base_time + timedelta(days=1)
    }