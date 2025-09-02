"""
Tests for Crisis Detection Agent
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch

from ..agents.crisis_detection import (
    CrisisDetectionAgent,
    CrisisMention,
    CrisisAnalysis
)


class TestCrisisMention:
    """Test CrisisMention model"""
    
    def test_crisis_mention_creation(self):
        """Test creating a crisis mention"""
        mention = CrisisMention(
            mention_id="test_123",
            content="This is a test mention about the candidate",
            source="twitter",
            author="test_user",
            sentiment_score=-0.7,
            reach_count=5000,
            engagement_count=150,
            published_at=datetime.now(),
            keywords=["candidate", "controversy"]
        )
        
        assert mention.mention_id == "test_123"
        assert mention.sentiment_score == -0.7
        assert mention.reach_count == 5000
        assert "candidate" in mention.keywords
    
    def test_sentiment_score_validation(self):
        """Test sentiment score validation"""
        # Valid scores
        CrisisMention(
            mention_id="test_1",
            content="test",
            source="twitter",
            sentiment_score=-1.0,
            published_at=datetime.now()
        )
        
        CrisisMention(
            mention_id="test_2",
            content="test",
            source="twitter",
            sentiment_score=1.0,
            published_at=datetime.now()
        )
        
        # Invalid scores should raise validation error
        with pytest.raises(ValueError):
            CrisisMention(
                mention_id="test_3",
                content="test",
                source="twitter",
                sentiment_score=1.5,  # Too high
                published_at=datetime.now()
            )


class TestCrisisAnalysis:
    """Test CrisisAnalysis model"""
    
    def test_crisis_analysis_creation(self):
        """Test creating crisis analysis"""
        analysis = CrisisAnalysis(
            severity=8,
            confidence=0.9,
            threat_type="misinformation",
            affected_topics=["policy", "character"],
            recommended_actions=["Issue statement", "Contact media"],
            escalation_required=True,
            reasoning="High severity due to viral spread"
        )
        
        assert analysis.severity == 8
        assert analysis.confidence == 0.9
        assert analysis.escalation_required
        assert len(analysis.recommended_actions) == 2
    
    def test_severity_validation(self):
        """Test severity score validation"""
        # Valid severity
        CrisisAnalysis(
            severity=5,
            confidence=0.7,
            threat_type="test",
            affected_topics=[],
            recommended_actions=[],
            escalation_required=False,
            reasoning="test"
        )
        
        # Invalid severity
        with pytest.raises(ValueError):
            CrisisAnalysis(
                severity=11,  # Too high
                confidence=0.7,
                threat_type="test",
                affected_topics=[],
                recommended_actions=[],
                escalation_required=False,
                reasoning="test"
            )


@pytest.fixture
def mock_openai_key():
    """Mock OpenAI API key"""
    return "test_openai_key"


@pytest.fixture
def sample_mentions():
    """Sample crisis mentions for testing"""
    return [
        CrisisMention(
            mention_id="mention_1",
            content="The candidate's new policy is completely wrong and will hurt families",
            source="twitter",
            author="concerned_voter",
            sentiment_score=-0.6,
            reach_count=2500,
            engagement_count=80,
            published_at=datetime.now() - timedelta(hours=2),
            keywords=["policy", "wrong", "hurt"]
        ),
        CrisisMention(
            mention_id="mention_2",
            content="Breaking: Documents leaked showing candidate knew about the issue",
            source="facebook",
            author="news_account",
            sentiment_score=-0.8,
            reach_count=15000,
            engagement_count=500,
            published_at=datetime.now() - timedelta(hours=1),
            keywords=["leaked", "documents", "issue"]
        ),
        CrisisMention(
            mention_id="mention_3",
            content="I support the candidate's position on this matter",
            source="twitter",
            author="supporter123",
            sentiment_score=0.7,
            reach_count=500,
            engagement_count=25,
            published_at=datetime.now() - timedelta(minutes=30),
            keywords=["support", "position"]
        )
    ]


@pytest.fixture
def campaign_context():
    """Sample campaign context"""
    return {
        "candidate_name": "Jane Smith",
        "key_issues": ["healthcare", "economy", "education"],
        "opponents": ["John Doe", "Bob Wilson"],
        "monitor_keywords": ["scandal", "leaked", "controversy"]
    }


class TestCrisisDetectionAgent:
    """Test Crisis Detection Agent"""
    
    @pytest.fixture
    def agent(self, mock_openai_key):
        """Create agent instance for testing"""
        with patch('langchain_openai.ChatOpenAI'):
            return CrisisDetectionAgent(mock_openai_key)
    
    def test_agent_initialization(self, agent):
        """Test agent initialization"""
        assert agent is not None
        assert len(agent.tools) > 0
        assert agent.memory is not None
        assert len(agent.crisis_patterns) > 0
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_context(self, agent, sample_mentions):
        """Test sentiment context analysis"""
        mentions_dict = [m.dict() for m in sample_mentions]
        result = await agent._analyze_sentiment_context(mentions_dict)
        
        assert "positive_ratio" in result
        assert "negative_ratio" in result
        assert "weighted_sentiment" in result
        assert "total_reach" in result
        
        # Should have more negative than positive
        assert result["negative_ratio"] > result["positive_ratio"]
        assert result["total_reach"] == 18000  # Sum of reach counts
    
    @pytest.mark.asyncio
    async def test_check_mention_velocity(self, agent, sample_mentions):
        """Test mention velocity analysis"""
        mentions_dict = [m.dict() for m in sample_mentions]
        result = await agent._check_mention_velocity(mentions_dict)
        
        assert "velocity" in result
        assert "acceleration" in result
        assert "viral_risk" in result
        assert "time_span_hours" in result
        
        assert result["velocity"] > 0
        assert result["viral_risk"] in ["low", "medium", "high", "critical"]
    
    @pytest.mark.asyncio
    async def test_assess_threat_level(self, agent):
        """Test threat level assessment"""
        analysis_data = {
            "sentiment": {
                "weighted_sentiment": -0.7,
                "total_reach": 50000
            },
            "velocity": {
                "viral_risk": "high"
            },
            "has_verified_accounts": True
        }
        
        threat_level = await agent._assess_threat_level(analysis_data)
        
        assert isinstance(threat_level, int)
        assert 1 <= threat_level <= 10
        assert threat_level >= 6  # Should be high due to negative sentiment and high viral risk
    
    @pytest.mark.asyncio
    async def test_identify_key_influencers(self, agent, sample_mentions):
        """Test key influencer identification"""
        mentions_dict = [m.dict() for m in sample_mentions]
        influencers = await agent._identify_key_influencers(mentions_dict)
        
        assert isinstance(influencers, list)
        # Only mentions with reach > 5000 should be considered influencers
        assert len(influencers) == 1  # Only mention_2 has reach > 5000
        assert influencers[0]["author"] == "news_account"
        assert influencers[0]["reach"] == 15000
    
    @pytest.mark.asyncio 
    async def test_generate_response_strategy(self, agent):
        """Test response strategy generation"""
        analysis = {
            "severity": 8,
            "threat_type": "misinformation"
        }
        
        strategies = await agent._generate_response_strategy(analysis)
        
        assert isinstance(strategies, list)
        assert len(strategies) > 0
        
        # High severity should include immediate actions
        immediate_actions = [s for s in strategies if "IMMEDIATE" in s]
        assert len(immediate_actions) > 0
        
        # Misinformation should include fact-check strategy
        fact_check_actions = [s for s in strategies if "fact-check" in s.lower()]
        assert len(fact_check_actions) > 0
    
    def test_format_mentions(self, agent, sample_mentions):
        """Test mention formatting for LLM"""
        formatted = agent._format_mentions(sample_mentions)
        
        assert isinstance(formatted, str)
        assert len(formatted) > 0
        assert "twitter" in formatted
        assert "facebook" in formatted
        assert "concern_voter" in formatted or "concerned_voter" in formatted
    
    def test_parse_analysis(self, agent):
        """Test LLM output parsing"""
        llm_output = """
        Based on the analysis, this appears to be a moderate crisis.
        Severity: 6/10
        The threat type is misinformation spread.
        Confidence: 0.8
        """
        
        analysis = agent._parse_analysis(llm_output)
        
        assert isinstance(analysis, CrisisAnalysis)
        assert analysis.severity >= 1
        assert analysis.confidence >= 0
        assert len(analysis.reasoning) > 0
    
    @pytest.mark.asyncio
    async def test_calculate_sentiment_trend(self, agent, sample_mentions):
        """Test sentiment trend calculation"""
        mentions_dict = [m.dict() for m in sample_mentions]
        trend = await agent._calculate_sentiment_trend(mentions_dict)
        
        assert trend in ["declining", "improving", "stable"]
        # With our sample data, sentiment should be declining (negative mentions are more recent)
        assert trend == "declining"
    
    def test_crisis_patterns_loading(self, agent):
        """Test crisis patterns are loaded"""
        patterns = agent.crisis_patterns
        
        assert len(patterns) > 0
        assert any(p["type"] == "misinformation_spread" for p in patterns)
        assert any(p["type"] == "scandal_emergence" for p in patterns)
        
        # Each pattern should have required fields
        for pattern in patterns:
            assert "type" in pattern
            assert "indicators" in pattern
            assert "typical_severity" in pattern
    
    @pytest.mark.asyncio
    async def test_update_crisis_patterns(self, agent, sample_mentions):
        """Test crisis pattern learning"""
        analysis = CrisisAnalysis(
            severity=8,
            confidence=0.9,
            threat_type="new_threat_type",
            affected_topics=["test_topic"],
            recommended_actions=["test_action"],
            escalation_required=True,
            reasoning="test"
        )
        
        initial_pattern_count = len(agent.crisis_patterns)
        await agent._update_crisis_patterns(sample_mentions, analysis)
        
        # Should have learned a new pattern
        assert len(agent.crisis_patterns) > initial_pattern_count
        
        # New pattern should be added
        new_patterns = [p for p in agent.crisis_patterns if "learned_" in p["type"]]
        assert len(new_patterns) > 0
        
        latest_pattern = new_patterns[-1]
        assert latest_pattern["typical_severity"] == 8
        assert "first_seen" in latest_pattern


@pytest.mark.asyncio
async def test_full_analysis_workflow(mock_openai_key, sample_mentions, campaign_context):
    """Test the complete analysis workflow"""
    with patch('langchain_openai.ChatOpenAI') as mock_llm:
        # Mock LLM response
        mock_response = Mock()
        mock_response.content = """
        Crisis Analysis Results:
        Severity: 7/10
        Confidence: 0.85
        Threat Type: misinformation
        This appears to be a significant misinformation campaign targeting the candidate.
        The leaked documents claim requires immediate fact-checking and response.
        """
        
        mock_chain = AsyncMock()
        mock_chain.ainvoke.return_value = mock_response
        
        # Mock the chain creation
        with patch.object(CrisisDetectionAgent, '_parse_analysis') as mock_parse:
            mock_parse.return_value = CrisisAnalysis(
                severity=7,
                confidence=0.85,
                threat_type="misinformation",
                affected_topics=["policy", "character"],
                recommended_actions=["Issue fact-check", "Contact media"],
                escalation_required=True,
                reasoning="Significant misinformation spread"
            )
            
            agent = CrisisDetectionAgent(mock_openai_key)
            
            # Mock the chain
            with patch.object(agent, '_get_historical_context', return_value="No similar events"):
                with patch('langchain_core.prompts.ChatPromptTemplate.from_messages') as mock_prompt:
                    mock_prompt.return_value.__or__ = Mock(return_value=mock_chain)
                    
                    result = await agent.analyze_mentions(sample_mentions, campaign_context)
                    
                    assert isinstance(result, CrisisAnalysis)
                    assert result.severity == 7
                    assert result.confidence == 0.85
                    assert result.threat_type == "misinformation"
                    assert result.escalation_required