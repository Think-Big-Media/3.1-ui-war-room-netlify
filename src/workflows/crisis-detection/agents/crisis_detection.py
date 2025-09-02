"""
Crisis Detection Agent - Core intelligence for identifying and analyzing potential crises
"""

import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

from langchain.agents import AgentExecutor
from langchain.memory import ConversationSummaryBufferMemory
from langchain.tools import Tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.callbacks import AsyncCallbackHandler
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class CrisisMention(BaseModel):
    """Schema for crisis-related mentions"""
    mention_id: str
    content: str
    source: str
    author: Optional[str] = None
    url: Optional[str] = None
    sentiment_score: float = Field(ge=-1.0, le=1.0)
    reach_count: int = 0
    engagement_count: int = 0
    published_at: datetime
    keywords: List[str] = []


class CrisisAnalysis(BaseModel):
    """Schema for crisis analysis results"""
    severity: int = Field(ge=1, le=10)
    confidence: float = Field(ge=0.0, le=1.0)
    threat_type: str
    affected_topics: List[str]
    recommended_actions: List[str]
    escalation_required: bool
    reasoning: str


class CrisisDetectionAgent:
    """Intelligent crisis detection with context awareness and learning"""
    
    def __init__(self, openai_api_key: str, memory_max_tokens: int = 2000):
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.2,
            openai_api_key=openai_api_key
        )
        
        self.memory = ConversationSummaryBufferMemory(
            llm=self.llm,
            max_token_limit=memory_max_tokens,
            return_messages=True,
            memory_key="crisis_history"
        )
        
        self.tools = self._create_tools()
        self.crisis_patterns = []
        self._load_crisis_patterns()
        
    def _create_tools(self) -> List[Tool]:
        """Create tools for crisis analysis"""
        return [
            Tool(
                name="analyze_sentiment_context",
                func=self._analyze_sentiment_context,
                description="Analyze sentiment with historical campaign context"
            ),
            Tool(
                name="check_mention_velocity",
                func=self._check_mention_velocity,
                description="Check rate of mention increase and viral potential"
            ),
            Tool(
                name="assess_threat_level",
                func=self._assess_threat_level,
                description="Determine crisis severity on 1-10 scale with reasoning"
            ),
            Tool(
                name="identify_key_influencers",
                func=self._identify_key_influencers,
                description="Identify influential accounts spreading the narrative"
            ),
            Tool(
                name="generate_response_strategy",
                func=self._generate_response_strategy,
                description="Generate recommended response strategies"
            )
        ]
    
    async def analyze_mentions(
        self, 
        mentions: List[CrisisMention],
        campaign_context: Optional[Dict] = None
    ) -> CrisisAnalysis:
        """Analyze mentions for potential crisis indicators"""
        
        # Get historical context
        historical_context = await self._get_historical_context(mentions)
        
        # Build analysis prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a crisis detection expert for political campaigns. 
            Analyze mentions for potential crises considering:
            1. Historical patterns of similar events
            2. Current campaign context and vulnerabilities
            3. Media amplification potential
            4. Opponent activity patterns
            5. Public sentiment trends
            
            Previous relevant events: {history}
            Known crisis patterns: {patterns}"""),
            ("human", """Analyze these mentions for crisis potential:
            
            Mentions: {mentions}
            Campaign Context: {campaign_context}
            
            Provide a comprehensive crisis analysis including:
            - Severity (1-10)
            - Confidence level (0-1)
            - Threat type classification
            - Affected topics
            - Recommended immediate actions
            - Whether escalation is required""")
        ])
        
        # Format mentions for analysis
        mentions_text = self._format_mentions(mentions)
        
        # Run analysis
        chain = prompt | self.llm
        
        result = await chain.ainvoke({
            "history": historical_context,
            "patterns": self.crisis_patterns,
            "mentions": mentions_text,
            "campaign_context": campaign_context or {}
        })
        
        # Parse and validate analysis
        analysis = self._parse_analysis(result.content)
        
        # Store in memory for future context
        await self.memory.save_context(
            {"mentions": mentions_text, "campaign_context": str(campaign_context)},
            {"analysis": str(analysis.dict())}
        )
        
        # Update patterns if this is a new crisis type
        if analysis.severity >= 7:
            await self._update_crisis_patterns(mentions, analysis)
        
        return analysis
    
    async def _analyze_sentiment_context(self, mentions: List[Dict]) -> Dict:
        """Contextual sentiment analysis with campaign awareness"""
        positive_count = sum(1 for m in mentions if m.get('sentiment_score', 0) > 0.3)
        negative_count = sum(1 for m in mentions if m.get('sentiment_score', 0) < -0.3)
        neutral_count = len(mentions) - positive_count - negative_count
        
        # Calculate weighted sentiment based on reach
        weighted_sentiment = sum(
            m.get('sentiment_score', 0) * m.get('reach_count', 1) 
            for m in mentions
        ) / sum(m.get('reach_count', 1) for m in mentions)
        
        # Check for sentiment shift patterns
        sentiment_trend = await self._calculate_sentiment_trend(mentions)
        
        return {
            'positive_ratio': positive_count / len(mentions) if mentions else 0,
            'negative_ratio': negative_count / len(mentions) if mentions else 0,
            'weighted_sentiment': weighted_sentiment,
            'sentiment_trend': sentiment_trend,
            'total_reach': sum(m.get('reach_count', 0) for m in mentions)
        }
    
    async def _check_mention_velocity(self, mentions: List[Dict]) -> Dict:
        """Analyze mention velocity and viral potential"""
        if not mentions:
            return {'velocity': 0, 'acceleration': 0, 'viral_risk': 'low'}
        
        # Sort mentions by time
        sorted_mentions = sorted(
            mentions, 
            key=lambda x: x.get('published_at', datetime.now())
        )
        
        # Calculate mentions per hour
        time_span = (
            sorted_mentions[-1].get('published_at', datetime.now()) - 
            sorted_mentions[0].get('published_at', datetime.now())
        ).total_seconds() / 3600
        
        if time_span == 0:
            time_span = 1
            
        velocity = len(mentions) / time_span
        
        # Calculate acceleration (change in velocity)
        mid_point = len(sorted_mentions) // 2
        first_half_velocity = mid_point / (time_span / 2) if time_span > 0 else 0
        second_half_velocity = (len(mentions) - mid_point) / (time_span / 2) if time_span > 0 else 0
        acceleration = second_half_velocity - first_half_velocity
        
        # Determine viral risk
        viral_risk = 'low'
        if velocity > 100 and acceleration > 50:
            viral_risk = 'critical'
        elif velocity > 50 and acceleration > 20:
            viral_risk = 'high'
        elif velocity > 20 or acceleration > 10:
            viral_risk = 'medium'
        
        return {
            'velocity': velocity,
            'acceleration': acceleration,
            'viral_risk': viral_risk,
            'time_span_hours': time_span
        }
    
    async def _assess_threat_level(self, analysis_data: Dict) -> int:
        """Sophisticated threat assessment based on multiple factors"""
        threat_score = 0
        
        # Sentiment factor (0-3 points)
        if analysis_data.get('sentiment', {}).get('weighted_sentiment', 0) < -0.5:
            threat_score += 3
        elif analysis_data.get('sentiment', {}).get('weighted_sentiment', 0) < -0.3:
            threat_score += 2
        elif analysis_data.get('sentiment', {}).get('weighted_sentiment', 0) < 0:
            threat_score += 1
        
        # Velocity factor (0-3 points)
        viral_risk = analysis_data.get('velocity', {}).get('viral_risk', 'low')
        if viral_risk == 'critical':
            threat_score += 3
        elif viral_risk == 'high':
            threat_score += 2
        elif viral_risk == 'medium':
            threat_score += 1
        
        # Reach factor (0-2 points)
        total_reach = analysis_data.get('sentiment', {}).get('total_reach', 0)
        if total_reach > 100000:
            threat_score += 2
        elif total_reach > 10000:
            threat_score += 1
        
        # Influencer involvement (0-2 points)
        if analysis_data.get('has_verified_accounts', False):
            threat_score += 2
        elif analysis_data.get('has_influencers', False):
            threat_score += 1
        
        return min(threat_score, 10)
    
    async def _identify_key_influencers(self, mentions: List[Dict]) -> List[Dict]:
        """Identify influential accounts in the mention stream"""
        influencers = []
        
        for mention in mentions:
            if mention.get('author') and mention.get('reach_count', 0) > 5000:
                influencers.append({
                    'author': mention['author'],
                    'reach': mention.get('reach_count', 0),
                    'verified': mention.get('is_verified', False),
                    'source': mention.get('source'),
                    'sentiment': mention.get('sentiment_score', 0)
                })
        
        # Sort by reach
        influencers.sort(key=lambda x: x['reach'], reverse=True)
        
        return influencers[:10]  # Top 10 influencers
    
    async def _generate_response_strategy(self, analysis: Dict) -> List[str]:
        """Generate strategic response recommendations"""
        strategies = []
        severity = analysis.get('severity', 0)
        threat_type = analysis.get('threat_type', 'unknown')
        
        if severity >= 8:
            strategies.extend([
                "IMMEDIATE: Issue public statement within 2 hours",
                "IMMEDIATE: Activate crisis response team",
                "IMMEDIATE: Brief candidate/leadership"
            ])
        elif severity >= 6:
            strategies.extend([
                "HIGH: Prepare holding statement",
                "HIGH: Monitor closely for next 4 hours",
                "HIGH: Identify and engage key influencers"
            ])
        else:
            strategies.extend([
                "MEDIUM: Continue monitoring",
                "MEDIUM: Prepare FAQ for supporters",
                "MEDIUM: Consider proactive clarification"
            ])
        
        # Add threat-specific strategies
        if threat_type == 'misinformation':
            strategies.append("Create fact-check content with sources")
        elif threat_type == 'scandal':
            strategies.append("Consult legal team before responding")
        elif threat_type == 'policy_criticism':
            strategies.append("Prepare detailed policy explanation")
        
        return strategies
    
    def _format_mentions(self, mentions: List[CrisisMention]) -> str:
        """Format mentions for LLM analysis"""
        formatted = []
        for m in mentions[:20]:  # Limit to prevent token overflow
            formatted.append(
                f"[{m.source}] @{m.author or 'unknown'} "
                f"(reach: {m.reach_count}, sentiment: {m.sentiment_score:.2f}): "
                f"{m.content[:200]}..."
            )
        return "\n".join(formatted)
    
    def _parse_analysis(self, llm_output: str) -> CrisisAnalysis:
        """Parse LLM output into structured analysis"""
        # This is a simplified parser - in production, use more robust parsing
        try:
            # Extract key values using regex or structured parsing
            severity = 5  # Default
            confidence = 0.7
            threat_type = "unknown"
            
            # Simple keyword extraction for demonstration
            if "severity:" in llm_output.lower():
                # Extract severity score
                pass
            
            return CrisisAnalysis(
                severity=severity,
                confidence=confidence,
                threat_type=threat_type,
                affected_topics=["campaign_messaging"],
                recommended_actions=["Monitor closely", "Prepare response"],
                escalation_required=severity >= 7,
                reasoning=llm_output
            )
        except Exception as e:
            logger.error(f"Failed to parse analysis: {e}")
            return CrisisAnalysis(
                severity=5,
                confidence=0.5,
                threat_type="parse_error",
                affected_topics=[],
                recommended_actions=["Manual review required"],
                escalation_required=True,
                reasoning=f"Parse error: {str(e)}"
            )
    
    async def _get_historical_context(self, mentions: List[CrisisMention]) -> str:
        """Retrieve relevant historical context from memory"""
        # Extract key topics from current mentions
        keywords = set()
        for m in mentions:
            keywords.update(m.keywords)
        
        # Get relevant memories
        query = f"Crisis involving: {', '.join(list(keywords)[:5])}"
        memories = await self.memory.aget_relevant_documents(query)
        
        return "\n".join([m.page_content for m in memories[:3]])
    
    async def _calculate_sentiment_trend(self, mentions: List[Dict]) -> str:
        """Calculate sentiment trend over time"""
        if len(mentions) < 2:
            return "stable"
        
        # Sort by time and calculate moving average
        sorted_mentions = sorted(
            mentions, 
            key=lambda x: x.get('published_at', datetime.now())
        )
        
        first_third = sorted_mentions[:len(sorted_mentions)//3]
        last_third = sorted_mentions[-len(sorted_mentions)//3:]
        
        first_sentiment = sum(m.get('sentiment_score', 0) for m in first_third) / len(first_third)
        last_sentiment = sum(m.get('sentiment_score', 0) for m in last_third) / len(last_third)
        
        if last_sentiment < first_sentiment - 0.2:
            return "declining"
        elif last_sentiment > first_sentiment + 0.2:
            return "improving"
        else:
            return "stable"
    
    def _load_crisis_patterns(self):
        """Load known crisis patterns from database or config"""
        # In production, load from database
        self.crisis_patterns = [
            {
                "type": "misinformation_spread",
                "indicators": ["fact-check", "false", "lies", "misleading"],
                "typical_severity": 7
            },
            {
                "type": "scandal_emergence", 
                "indicators": ["scandal", "leaked", "exposed", "caught"],
                "typical_severity": 8
            },
            {
                "type": "policy_backlash",
                "indicators": ["oppose", "against", "reject", "protest"],
                "typical_severity": 5
            }
        ]
    
    async def _update_crisis_patterns(
        self, 
        mentions: List[CrisisMention], 
        analysis: CrisisAnalysis
    ):
        """Learn from new crisis patterns"""
        # Extract common keywords from high-severity crisis
        keywords = set()
        for m in mentions:
            keywords.update(m.keywords)
        
        new_pattern = {
            "type": f"learned_{datetime.now().strftime('%Y%m%d')}",
            "indicators": list(keywords)[:10],
            "typical_severity": analysis.severity,
            "first_seen": datetime.now().isoformat()
        }
        
        self.crisis_patterns.append(new_pattern)
        
        # In production, persist to database
        logger.info(f"Learned new crisis pattern: {new_pattern['type']}")