"""
Alert Routing Agent - Intelligent distribution of crisis alerts
"""

import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from .crisis_detection import CrisisAnalysis

logger = logging.getLogger(__name__)


class AlertPriority(Enum):
    """Alert priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RecipientProfile(BaseModel):
    """Profile for alert recipients"""
    id: str
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    slack_id: Optional[str] = None
    expertise_areas: List[str] = []
    availability_hours: Tuple[int, int] = (9, 17)  # Default 9 AM - 5 PM
    timezone: str = "America/New_York"
    channel_preferences: Dict[str, Dict] = {
        "email": {"enabled": True, "max_priority": "low"},
        "sms": {"enabled": True, "max_priority": "high"},
        "slack": {"enabled": True, "max_priority": "medium"},
        "phone_call": {"enabled": False, "max_priority": "critical"}
    }
    response_history: Dict = {}  # Track response times and effectiveness


class AlertRoute(BaseModel):
    """Routing plan for an alert"""
    recipient: RecipientProfile
    channels: List[str]
    message: str
    priority: AlertPriority
    expected_response_time: int = 30  # minutes
    escalation_plan: Optional[Dict] = None


class AlertRoutingAgent:
    """Intelligent alert routing based on context and recipient profiles"""
    
    def __init__(self, openai_api_key: str):
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.3,
            openai_api_key=openai_api_key
        )
        self.recipient_profiles: Dict[str, RecipientProfile] = {}
        self.routing_history: List[Dict] = []
        self._load_recipient_profiles()
        
    def _load_recipient_profiles(self):
        """Load recipient profiles from database"""
        # In production, load from database
        # For now, create sample profiles
        self.recipient_profiles = {
            "campaign_manager": RecipientProfile(
                id="cm_001",
                name="Campaign Manager",
                role="campaign_manager",
                email="manager@campaign.com",
                phone="+1234567890",
                slack_id="U123456",
                expertise_areas=["strategy", "messaging", "crisis"],
                availability_hours=(7, 22),
                channel_preferences={
                    "email": {"enabled": True, "max_priority": "medium"},
                    "sms": {"enabled": True, "max_priority": "high"},
                    "slack": {"enabled": True, "max_priority": "medium"},
                    "phone_call": {"enabled": True, "max_priority": "critical"}
                }
            ),
            "comms_director": RecipientProfile(
                id="cd_001",
                name="Communications Director",
                role="comms_director",
                email="comms@campaign.com",
                phone="+1234567891",
                slack_id="U123457",
                expertise_areas=["media", "messaging", "crisis", "press"],
                availability_hours=(6, 23)
            ),
            "digital_director": RecipientProfile(
                id="dd_001",
                name="Digital Director",
                role="digital_director",
                email="digital@campaign.com",
                slack_id="U123458",
                expertise_areas=["social_media", "digital", "online_reputation"],
                availability_hours=(8, 20)
            ),
            "legal_counsel": RecipientProfile(
                id="lc_001",
                name="Legal Counsel",
                role="legal_counsel",
                email="legal@campaign.com",
                phone="+1234567892",
                expertise_areas=["legal", "compliance", "scandal"],
                availability_hours=(9, 18)
            )
        }
    
    async def route_alert(
        self,
        crisis_analysis: CrisisAnalysis,
        mention_summary: str,
        current_time: Optional[datetime] = None
    ) -> List[AlertRoute]:
        """Intelligently route alerts based on crisis analysis"""
        
        if not current_time:
            current_time = datetime.now()
        
        # Determine alert priority
        priority = self._determine_priority(crisis_analysis)
        
        # Select optimal recipients
        recipients = await self._select_recipients(
            crisis_analysis=crisis_analysis,
            priority=priority,
            current_time=current_time
        )
        
        # Create routing plan for each recipient
        routing_plan = []
        for recipient in recipients:
            # Select channels based on priority and preferences
            channels = await self._select_channels(
                recipient=recipient,
                priority=priority,
                current_time=current_time
            )
            
            # Personalize message for recipient
            message = await self._personalize_message(
                recipient=recipient,
                crisis_analysis=crisis_analysis,
                mention_summary=mention_summary,
                priority=priority
            )
            
            # Create escalation plan if needed
            escalation_plan = None
            if priority in [AlertPriority.CRITICAL, AlertPriority.HIGH]:
                escalation_plan = self._create_escalation_plan(
                    recipient=recipient,
                    priority=priority
                )
            
            route = AlertRoute(
                recipient=recipient,
                channels=channels,
                message=message,
                priority=priority,
                expected_response_time=self._get_expected_response_time(priority),
                escalation_plan=escalation_plan
            )
            
            routing_plan.append(route)
        
        # Store routing decision for learning
        self._store_routing_decision(routing_plan, crisis_analysis)
        
        return routing_plan
    
    def _determine_priority(self, crisis_analysis: CrisisAnalysis) -> AlertPriority:
        """Determine alert priority from crisis analysis"""
        if crisis_analysis.severity >= 8:
            return AlertPriority.CRITICAL
        elif crisis_analysis.severity >= 6:
            return AlertPriority.HIGH
        elif crisis_analysis.severity >= 4:
            return AlertPriority.MEDIUM
        else:
            return AlertPriority.LOW
    
    async def _select_recipients(
        self,
        crisis_analysis: CrisisAnalysis,
        priority: AlertPriority,
        current_time: datetime
    ) -> List[RecipientProfile]:
        """Select optimal recipients using LLM reasoning"""
        
        # Build prompt for recipient selection
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at crisis management for political campaigns.
            Select the most appropriate team members to handle this crisis based on:
            1. Their expertise areas matching the crisis type
            2. Their current availability (working hours)
            3. The severity and urgency of the situation
            4. Past response effectiveness
            
            Available team members: {team_members}"""),
            ("human", """Select recipients for this crisis:
            
            Crisis Type: {threat_type}
            Severity: {severity}/10
            Priority: {priority}
            Affected Topics: {affected_topics}
            Current Time: {current_time}
            
            Return a list of recipient IDs who should be notified, ordered by importance.""")
        ])
        
        # Format team members
        team_info = []
        current_hour = current_time.hour
        
        for profile in self.recipient_profiles.values():
            is_available = (
                profile.availability_hours[0] <= current_hour <= profile.availability_hours[1]
            )
            team_info.append({
                "id": profile.id,
                "role": profile.role,
                "expertise": profile.expertise_areas,
                "available": is_available,
                "response_score": profile.response_history.get("avg_score", 0.7)
            })
        
        # Get LLM recommendation
        chain = prompt | self.llm
        
        result = await chain.ainvoke({
            "team_members": team_info,
            "threat_type": crisis_analysis.threat_type,
            "severity": crisis_analysis.severity,
            "priority": priority.value,
            "affected_topics": crisis_analysis.affected_topics,
            "current_time": current_time.strftime("%H:%M %Z")
        })
        
        # Parse recipient IDs from response
        selected_ids = self._parse_recipient_ids(result.content)
        
        # Return selected profiles
        selected = []
        for recipient_id in selected_ids:
            if recipient_id in self.recipient_profiles:
                selected.append(self.recipient_profiles[recipient_id])
        
        # Ensure minimum recipients based on priority
        if priority == AlertPriority.CRITICAL and len(selected) < 2:
            # Add campaign manager if not already included
            if "campaign_manager" not in selected_ids:
                selected.append(self.recipient_profiles["campaign_manager"])
        
        return selected
    
    async def _select_channels(
        self,
        recipient: RecipientProfile,
        priority: AlertPriority,
        current_time: datetime
    ) -> List[str]:
        """Select delivery channels based on priority and preferences"""
        
        channels = []
        current_hour = current_time.hour
        
        # Check if recipient is in working hours
        is_working_hours = (
            recipient.availability_hours[0] <= current_hour <= recipient.availability_hours[1]
        )
        
        # Priority-based channel selection
        if priority == AlertPriority.CRITICAL:
            # Use all available channels for critical alerts
            if recipient.phone and recipient.channel_preferences["phone_call"]["enabled"]:
                channels.append("phone_call")
            if recipient.phone and recipient.channel_preferences["sms"]["enabled"]:
                channels.append("sms")
            if recipient.slack_id and recipient.channel_preferences["slack"]["enabled"]:
                channels.append("slack")
            channels.append("email")  # Always include email
            
        elif priority == AlertPriority.HIGH:
            # Use fast channels for high priority
            if recipient.phone and recipient.channel_preferences["sms"]["enabled"]:
                channels.append("sms")
            if recipient.slack_id and recipient.channel_preferences["slack"]["enabled"]:
                channels.append("slack")
            channels.append("email")
            
        elif priority == AlertPriority.MEDIUM:
            # Use preferred channels for medium priority
            if is_working_hours and recipient.slack_id:
                channels.append("slack")
            channels.append("email")
            
        else:  # LOW priority
            # Email only for low priority
            channels.append("email")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_channels = []
        for channel in channels:
            if channel not in seen:
                seen.add(channel)
                unique_channels.append(channel)
        
        return unique_channels
    
    async def _personalize_message(
        self,
        recipient: RecipientProfile,
        crisis_analysis: CrisisAnalysis,
        mention_summary: str,
        priority: AlertPriority
    ) -> str:
        """Create personalized alert message using LLM"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Create a concise, actionable alert message for a campaign team member.
            Tailor the message to their role and expertise.
            Include:
            1. Clear subject/headline
            2. Brief crisis summary (2-3 sentences)
            3. Why they specifically are being notified
            4. Immediate actions they should take
            5. Escalation instructions if needed
            
            Keep it under 200 words for SMS/Slack, 500 words for email."""),
            ("human", """Create alert message for:
            
            Recipient: {role} with expertise in {expertise}
            Priority: {priority}
            
            Crisis Summary:
            - Type: {threat_type}
            - Severity: {severity}/10
            - Key Issues: {affected_topics}
            
            Mention Summary: {mention_summary}
            
            Recommended Actions: {recommended_actions}""")
        ])
        
        chain = prompt | self.llm
        
        result = await chain.ainvoke({
            "role": recipient.role,
            "expertise": ", ".join(recipient.expertise_areas),
            "priority": priority.value.upper(),
            "threat_type": crisis_analysis.threat_type,
            "severity": crisis_analysis.severity,
            "affected_topics": ", ".join(crisis_analysis.affected_topics),
            "mention_summary": mention_summary[:200],
            "recommended_actions": "\n".join(crisis_analysis.recommended_actions[:3])
        })
        
        return result.content
    
    def _create_escalation_plan(
        self,
        recipient: RecipientProfile,
        priority: AlertPriority
    ) -> Dict:
        """Create escalation plan for critical alerts"""
        
        escalation_times = {
            AlertPriority.CRITICAL: 15,  # 15 minutes
            AlertPriority.HIGH: 30,      # 30 minutes
            AlertPriority.MEDIUM: 60,    # 1 hour
            AlertPriority.LOW: 240       # 4 hours
        }
        
        # Find escalation contact (usually manager or next senior person)
        escalation_contacts = {
            "digital_director": "comms_director",
            "comms_director": "campaign_manager",
            "legal_counsel": "campaign_manager",
            "campaign_manager": "candidate"  # Ultimate escalation
        }
        
        escalation_to = escalation_contacts.get(recipient.role, "campaign_manager")
        
        return {
            "escalate_after_minutes": escalation_times[priority],
            "escalate_to": escalation_to,
            "escalation_message": f"No response from {recipient.name} after {escalation_times[priority]} minutes"
        }
    
    def _get_expected_response_time(self, priority: AlertPriority) -> int:
        """Get expected response time in minutes based on priority"""
        response_times = {
            AlertPriority.CRITICAL: 15,
            AlertPriority.HIGH: 30,
            AlertPriority.MEDIUM: 60,
            AlertPriority.LOW: 240
        }
        return response_times[priority]
    
    def _parse_recipient_ids(self, llm_output: str) -> List[str]:
        """Parse recipient IDs from LLM output"""
        # Simple parsing - look for known recipient IDs
        selected_ids = []
        
        for recipient_id in self.recipient_profiles.keys():
            if recipient_id in llm_output.lower():
                selected_ids.append(recipient_id)
        
        # If no specific IDs found, default to campaign manager
        if not selected_ids:
            selected_ids = ["campaign_manager"]
        
        return selected_ids
    
    def _store_routing_decision(
        self,
        routing_plan: List[AlertRoute],
        crisis_analysis: CrisisAnalysis
    ):
        """Store routing decision for future learning"""
        decision = {
            "timestamp": datetime.now(),
            "crisis_analysis": crisis_analysis.dict(),
            "routing_plan": [
                {
                    "recipient_id": route.recipient.id,
                    "channels": route.channels,
                    "priority": route.priority.value
                }
                for route in routing_plan
            ]
        }
        
        self.routing_history.append(decision)
        
        # In production, persist to database
        logger.info(f"Stored routing decision for {len(routing_plan)} recipients")
    
    async def update_response_effectiveness(
        self,
        recipient_id: str,
        response_time: int,
        effectiveness_score: float
    ):
        """Update recipient's response history for learning"""
        if recipient_id in self.recipient_profiles:
            profile = self.recipient_profiles[recipient_id]
            
            # Update response history
            if "responses" not in profile.response_history:
                profile.response_history["responses"] = []
            
            profile.response_history["responses"].append({
                "timestamp": datetime.now(),
                "response_time_minutes": response_time,
                "effectiveness_score": effectiveness_score
            })
            
            # Calculate average score
            scores = [
                r["effectiveness_score"] 
                for r in profile.response_history["responses"]
            ]
            profile.response_history["avg_score"] = sum(scores) / len(scores)
            
            logger.info(
                f"Updated response effectiveness for {recipient_id}: "
                f"{effectiveness_score:.2f} (avg: {profile.response_history['avg_score']:.2f})"
            )