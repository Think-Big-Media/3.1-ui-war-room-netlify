"""
Crisis Detection Workflow - Main orchestration using LangGraph
"""

import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage

from .agents.crisis_detection import CrisisDetectionAgent, CrisisMention, CrisisAnalysis
from .agents.monitoring import MentionlyticsAgent, MentionlyticsConfig
from .agents.alert_routing import AlertRoutingAgent, AlertRoute
from .tools.delivery import DeliveryManager
from .utils.state import WorkflowState

logger = logging.getLogger(__name__)


class CrisisDetectionWorkflow:
    """Main workflow for crisis detection and response"""
    
    def __init__(
        self,
        openai_api_key: str,
        mentionlytics_config: MentionlyticsConfig,
        delivery_config: Optional[Dict] = None
    ):
        # Initialize agents
        self.crisis_agent = CrisisDetectionAgent(openai_api_key)
        self.monitoring_agent = MentionlyticsAgent(mentionlytics_config)
        self.routing_agent = AlertRoutingAgent(openai_api_key)
        self.delivery_manager = DeliveryManager(delivery_config or {})
        
        # Build workflow graph
        self.workflow = self._build_workflow()
        self.compiled_workflow = self.workflow.compile()
        
    def _build_workflow(self) -> StateGraph:
        """Build the crisis detection workflow graph"""
        
        # Create workflow with state
        workflow = StateGraph(WorkflowState)
        
        # Add nodes
        workflow.add_node("monitor", self.monitor_sources)
        workflow.add_node("enrich", self.enrich_context)
        workflow.add_node("analyze", self.analyze_crisis)
        workflow.add_node("route", self.route_alerts)
        workflow.add_node("deliver", self.deliver_alerts)
        workflow.add_node("learn", self.learn_from_outcome)
        
        # Add edges
        workflow.add_edge("monitor", "enrich")
        workflow.add_edge("enrich", "analyze")
        
        # Conditional routing based on severity
        workflow.add_conditional_edges(
            "analyze",
            self.should_alert,
            {
                "alert": "route",
                "monitor": "learn"
            }
        )
        
        workflow.add_edge("route", "deliver")
        workflow.add_edge("deliver", "learn")
        workflow.add_edge("learn", END)
        
        # Set entry point
        workflow.set_entry_point("monitor")
        
        return workflow
    
    async def run(self, initial_state: Optional[Dict] = None) -> Dict:
        """Run the workflow"""
        state = WorkflowState(
            mentions=[],
            enriched_mentions=[],
            analysis=None,
            routing_plan=[],
            delivery_results={},
            campaign_context=initial_state.get("campaign_context", {}) if initial_state else {},
            timestamp=datetime.now()
        )
        
        try:
            # Run workflow
            result = await self.compiled_workflow.ainvoke(state)
            return result
        except Exception as e:
            logger.error(f"Workflow error: {e}")
            raise
    
    async def monitor_sources(self, state: WorkflowState) -> WorkflowState:
        """Monitor external sources for mentions"""
        logger.info("Starting source monitoring...")
        
        try:
            # Use monitoring agent to fetch mentions
            async with self.monitoring_agent as agent:
                mentions = await agent.scan()
            
            # Filter mentions if keywords provided in campaign context
            if state.campaign_context.get("monitor_keywords"):
                keywords = state.campaign_context["monitor_keywords"]
                mentions = [
                    m for m in mentions
                    if any(kw.lower() in m.content.lower() for kw in keywords)
                ]
            
            logger.info(f"Found {len(mentions)} relevant mentions")
            
            state.mentions = mentions
            state.source_count = len(mentions)
            
        except Exception as e:
            logger.error(f"Monitoring error: {e}")
            state.error = str(e)
        
        return state
    
    async def enrich_context(self, state: WorkflowState) -> WorkflowState:
        """Enrich mentions with additional context"""
        logger.info("Enriching mention context...")
        
        enriched_mentions = []
        
        for mention in state.mentions:
            # Add campaign-specific context
            enriched = {
                "mention": mention.dict(),
                "campaign_relevance": self._calculate_relevance(
                    mention,
                    state.campaign_context
                ),
                "historical_similar": await self._find_similar_past_mentions(mention),
                "author_influence_score": self._calculate_influence_score(mention)
            }
            enriched_mentions.append(enriched)
        
        state.enriched_mentions = enriched_mentions
        return state
    
    async def analyze_crisis(self, state: WorkflowState) -> WorkflowState:
        """Analyze mentions for crisis potential"""
        logger.info("Analyzing crisis potential...")
        
        if not state.mentions:
            logger.info("No mentions to analyze")
            return state
        
        try:
            # Use crisis detection agent
            analysis = await self.crisis_agent.analyze_mentions(
                mentions=state.mentions,
                campaign_context=state.campaign_context
            )
            
            state.analysis = analysis
            state.severity = analysis.severity
            state.threat_detected = analysis.severity >= 4
            
            logger.info(
                f"Crisis analysis complete - Severity: {analysis.severity}/10, "
                f"Confidence: {analysis.confidence:.2f}"
            )
            
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            state.error = str(e)
            state.threat_detected = False
        
        return state
    
    def should_alert(self, state: WorkflowState) -> str:
        """Determine if alert should be sent"""
        if state.analysis and state.analysis.severity >= 4:
            return "alert"
        return "monitor"
    
    async def route_alerts(self, state: WorkflowState) -> WorkflowState:
        """Route alerts to appropriate recipients"""
        logger.info("Routing alerts...")
        
        if not state.analysis:
            return state
        
        try:
            # Create mention summary for routing
            mention_summary = self._create_mention_summary(state.mentions)
            
            # Get routing plan
            routing_plan = await self.routing_agent.route_alert(
                crisis_analysis=state.analysis,
                mention_summary=mention_summary,
                current_time=datetime.now()
            )
            
            state.routing_plan = routing_plan
            state.alert_count = len(routing_plan)
            
            logger.info(f"Created routing plan for {len(routing_plan)} recipients")
            
        except Exception as e:
            logger.error(f"Routing error: {e}")
            state.error = str(e)
        
        return state
    
    async def deliver_alerts(self, state: WorkflowState) -> WorkflowState:
        """Deliver alerts through multiple channels"""
        logger.info("Delivering alerts...")
        
        delivery_results = {}
        
        for route in state.routing_plan:
            try:
                # Deliver through each channel
                results = await self.delivery_manager.deliver_multi_channel(
                    route=route,
                    crisis_analysis=state.analysis
                )
                
                delivery_results[route.recipient.id] = results
                
            except Exception as e:
                logger.error(f"Delivery error for {route.recipient.id}: {e}")
                delivery_results[route.recipient.id] = {
                    "error": str(e),
                    "success": False
                }
        
        state.delivery_results = delivery_results
        state.alerts_sent = sum(
            1 for r in delivery_results.values() 
            if r.get("success", False)
        )
        
        logger.info(f"Delivered {state.alerts_sent} alerts successfully")
        
        return state
    
    async def learn_from_outcome(self, state: WorkflowState) -> WorkflowState:
        """Learn from the crisis detection outcome"""
        logger.info("Learning from outcome...")
        
        # Store workflow run for analysis
        learning_data = {
            "timestamp": state.timestamp,
            "mentions_count": len(state.mentions),
            "severity": state.analysis.severity if state.analysis else 0,
            "threat_detected": state.threat_detected,
            "alerts_sent": state.alerts_sent,
            "delivery_success_rate": self._calculate_delivery_success_rate(
                state.delivery_results
            )
        }
        
        # Update agent patterns if crisis was significant
        if state.analysis and state.analysis.severity >= 7:
            await self.crisis_agent._update_crisis_patterns(
                state.mentions,
                state.analysis
            )
        
        # Log learning data
        logger.info(f"Workflow learning data: {learning_data}")
        
        state.learning_data = learning_data
        return state
    
    def _calculate_relevance(
        self,
        mention: CrisisMention,
        campaign_context: Dict
    ) -> float:
        """Calculate how relevant a mention is to the campaign"""
        relevance_score = 0.5  # Base score
        
        # Check for candidate name
        if campaign_context.get("candidate_name"):
            if campaign_context["candidate_name"].lower() in mention.content.lower():
                relevance_score += 0.3
        
        # Check for key issues
        if campaign_context.get("key_issues"):
            for issue in campaign_context["key_issues"]:
                if issue.lower() in mention.content.lower():
                    relevance_score += 0.1
        
        # Check for opponent names
        if campaign_context.get("opponents"):
            for opponent in campaign_context["opponents"]:
                if opponent.lower() in mention.content.lower():
                    relevance_score += 0.2
        
        return min(relevance_score, 1.0)
    
    def _calculate_influence_score(self, mention: CrisisMention) -> float:
        """Calculate influence score of mention author"""
        # Simple influence calculation based on reach
        if mention.reach_count > 100000:
            return 1.0
        elif mention.reach_count > 10000:
            return 0.8
        elif mention.reach_count > 1000:
            return 0.6
        elif mention.reach_count > 100:
            return 0.4
        else:
            return 0.2
    
    async def _find_similar_past_mentions(
        self,
        mention: CrisisMention
    ) -> List[Dict]:
        """Find similar mentions from history"""
        # In production, query vector database for similar mentions
        # For now, return empty list
        return []
    
    def _create_mention_summary(self, mentions: List[CrisisMention]) -> str:
        """Create summary of mentions for alert"""
        if not mentions:
            return "No mentions"
        
        # Sort by reach
        top_mentions = sorted(
            mentions,
            key=lambda m: m.reach_count,
            reverse=True
        )[:5]
        
        summary_parts = []
        for m in top_mentions:
            summary_parts.append(
                f"• [{m.source}] @{m.author or 'unknown'} "
                f"(reach: {m.reach_count:,}): {m.content[:100]}..."
            )
        
        total_reach = sum(m.reach_count for m in mentions)
        
        return (
            f"Total mentions: {len(mentions)}\n"
            f"Combined reach: {total_reach:,}\n"
            f"Top mentions:\n" + "\n".join(summary_parts)
        )
    
    def _calculate_delivery_success_rate(
        self,
        delivery_results: Dict[str, Dict]
    ) -> float:
        """Calculate overall delivery success rate"""
        if not delivery_results:
            return 0.0
        
        successful = sum(
            1 for r in delivery_results.values()
            if r.get("success", False)
        )
        
        return successful / len(delivery_results)


async def run_crisis_detection(
    openai_api_key: str,
    mentionlytics_api_key: str,
    mentionlytics_api_secret: str,
    campaign_context: Optional[Dict] = None
) -> Dict:
    """Convenience function to run crisis detection workflow"""
    
    # Configure Mentionlytics
    mentionlytics_config = MentionlyticsConfig(
        api_key=mentionlytics_api_key,
        api_secret=mentionlytics_api_secret
    )
    
    # Create and run workflow
    workflow = CrisisDetectionWorkflow(
        openai_api_key=openai_api_key,
        mentionlytics_config=mentionlytics_config
    )
    
    result = await workflow.run({"campaign_context": campaign_context or {}})
    
    return result