# LangChain Workflows Documentation - War Room Platform

## Overview

This document details the LangChain-powered workflows that replace our n8n automations. Each workflow is designed as an intelligent agent system capable of learning, adapting, and making context-aware decisions.

## Core Workflows

### 1. Crisis Detection Workflow

**Purpose**: Real-time monitoring and intelligent crisis detection across all media channels

**Agent Architecture**:
```
┌─────────────────────┐
│ Monitoring Agents   │
├─────────────────────┤
│ • Mentionlytics     │
│ • NewsWhip          │
│ • Social Media APIs │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────┐
│ Context Enrichment  │────►│ Crisis Analysis  │
│ Agent               │     │ Agent            │
└─────────────────────┘     └─────────┬────────┘
                                      │
                            ┌─────────▼────────┐
                            │ Decision Agent   │
                            ├──────────────────┤
                            │ • Severity: 1-10 │
                            │ • Response Plan  │
                            │ • Team Routing   │
                            └─────────┬────────┘
                                      │
                            ┌─────────▼────────┐
                            │ Action Agents    │
                            ├──────────────────┤
                            │ • Alert Team     │
                            │ • Draft Response │
                            │ • Monitor Impact │
                            └──────────────────┘
```

**Implementation**:
```python
from langchain.agents import AgentExecutor
from langchain.tools import Tool
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import MessageGraph, END
from typing import Dict, List, Optional
import asyncio

class CrisisDetectionWorkflow:
    """Intelligent crisis detection and response workflow"""
    
    def __init__(self):
        self.graph = MessageGraph()
        self._build_workflow()
        
    def _build_workflow(self):
        """Construct the crisis detection workflow graph"""
        
        # Add nodes
        self.graph.add_node("monitor", self.monitor_sources)
        self.graph.add_node("enrich", self.enrich_context)
        self.graph.add_node("analyze", self.analyze_threat)
        self.graph.add_node("decide", self.decide_response)
        self.graph.add_node("alert", self.send_alerts)
        self.graph.add_node("respond", self.coordinate_response)
        self.graph.add_node("learn", self.update_patterns)
        
        # Add edges
        self.graph.add_edge("monitor", "enrich")
        self.graph.add_edge("enrich", "analyze")
        self.graph.add_conditional_edges(
            "analyze",
            self.route_by_severity,
            {
                "critical": "alert",
                "high": "decide", 
                "medium": "decide",
                "low": "learn"
            }
        )
        self.graph.add_edge("decide", "alert")
        self.graph.add_edge("alert", "respond")
        self.graph.add_edge("respond", "learn")
        self.graph.add_edge("learn", END)
        
        self.graph.set_entry_point("monitor")
        
    async def monitor_sources(self, state: Dict) -> Dict:
        """Monitor multiple sources for potential crises"""
        
        monitoring_agents = [
            MentionlyticsAgent(),
            NewsWhipAgent(),
            SocialMediaAgent()
        ]
        
        # Parallel monitoring
        tasks = [agent.scan() for agent in monitoring_agents]
        results = await asyncio.gather(*tasks)
        
        # Aggregate and deduplicate
        mentions = self._aggregate_mentions(results)
        
        return {
            **state,
            "mentions": mentions,
            "source_count": len(mentions),
            "timestamp": datetime.now()
        }
    
    async def enrich_context(self, state: Dict) -> Dict:
        """Add historical and campaign context to mentions"""
        
        enrichment_agent = ContextEnrichmentAgent()
        
        enriched_mentions = []
        for mention in state["mentions"]:
            context = await enrichment_agent.enrich(
                mention=mention,
                campaign_data=state.get("campaign_context"),
                historical_patterns=state.get("historical_crises")
            )
            enriched_mentions.append(context)
        
        return {
            **state,
            "enriched_mentions": enriched_mentions
        }
    
    async def analyze_threat(self, state: Dict) -> Dict:
        """Deep analysis of potential crisis indicators"""
        
        analyzer = CrisisAnalysisAgent()
        
        analysis = await analyzer.analyze(
            mentions=state["enriched_mentions"],
            velocity=self._calculate_velocity(state),
            sentiment_trend=self._get_sentiment_trend(state),
            competitor_activity=state.get("competitor_context")
        )
        
        # Determine severity and confidence
        severity = analysis["severity"]  # 1-10 scale
        confidence = analysis["confidence"]  # 0-1 scale
        
        return {
            **state,
            "analysis": analysis,
            "severity": severity,
            "confidence": confidence,
            "threat_vector": analysis["primary_threat"]
        }
    
    def route_by_severity(self, state: Dict) -> str:
        """Route based on crisis severity"""
        
        severity = state["severity"]
        confidence = state["confidence"]
        
        if severity >= 8 and confidence > 0.8:
            return "critical"
        elif severity >= 6:
            return "high"
        elif severity >= 4:
            return "medium"
        else:
            return "low"
    
    async def decide_response(self, state: Dict) -> Dict:
        """Intelligent response planning"""
        
        decision_agent = ResponseDecisionAgent()
        
        response_plan = await decision_agent.plan_response(
            crisis_analysis=state["analysis"],
            available_resources=state.get("team_availability"),
            campaign_priorities=state.get("campaign_priorities"),
            historical_responses=state.get("past_responses")
        )
        
        return {
            **state,
            "response_plan": response_plan,
            "estimated_impact": response_plan["impact_mitigation"]
        }
    
    async def send_alerts(self, state: Dict) -> Dict:
        """Multi-channel alert distribution"""
        
        alert_agent = AlertDistributionAgent()
        
        alert_results = await alert_agent.distribute(
            severity=state["severity"],
            message=self._format_alert_message(state),
            recipients=self._select_recipients(state),
            channels=self._select_channels(state["severity"])
        )
        
        return {
            **state,
            "alert_results": alert_results,
            "alerted_at": datetime.now()
        }
    
    async def coordinate_response(self, state: Dict) -> Dict:
        """Coordinate crisis response actions"""
        
        coordinator = ResponseCoordinatorAgent()
        
        response_actions = await coordinator.execute_response(
            plan=state["response_plan"],
            team_assignments=state.get("team_assignments"),
            communication_strategy=state.get("comm_strategy")
        )
        
        return {
            **state,
            "response_actions": response_actions,
            "response_status": "in_progress"
        }
    
    async def update_patterns(self, state: Dict) -> Dict:
        """Learn from crisis for future detection"""
        
        learning_agent = PatternLearningAgent()
        
        patterns = await learning_agent.extract_patterns(
            crisis_data=state,
            outcome=state.get("resolution_outcome"),
            effectiveness=state.get("response_effectiveness")
        )
        
        # Update knowledge base
        await self._update_knowledge_base(patterns)
        
        return {
            **state,
            "learned_patterns": patterns,
            "knowledge_updated": True
        }
```

### 2. Campaign Monitoring Workflow

**Purpose**: Continuous monitoring and optimization of ad campaigns across Meta and Google platforms

**Agent Architecture**:
```
┌──────────────────┐     ┌──────────────────┐
│ Meta Ads Agent   │     │ Google Ads Agent │
└────────┬─────────┘     └─────────┬────────┘
         │                         │
         └───────────┬─────────────┘
                     │
           ┌─────────▼──────────┐
           │ Performance        │
           │ Analysis Agent     │
           └─────────┬──────────┘
                     │
           ┌─────────▼──────────┐
           │ Optimization Agent │
           ├────────────────────┤
           │ • Budget Shifts    │
           │ • Bid Adjustments  │
           │ • Audience Changes │
           └─────────┬──────────┘
                     │
           ┌─────────▼──────────┐
           │ Execution Agent    │
           └────────────────────┘
```

**Implementation**:
```python
class CampaignMonitoringWorkflow:
    """Multi-platform campaign monitoring and optimization"""
    
    def __init__(self):
        self.meta_agent = MetaAdsMonitorAgent()
        self.google_agent = GoogleAdsMonitorAgent()
        self.analyzer = PerformanceAnalysisAgent()
        self.optimizer = CampaignOptimizationAgent()
        self.executor = OptimizationExecutionAgent()
        
    async def monitor_campaigns(self) -> Dict:
        """Continuous campaign monitoring loop"""
        
        while True:
            try:
                # Collect data from all platforms
                meta_data = await self.meta_agent.get_campaign_data()
                google_data = await self.google_agent.get_campaign_data()
                
                # Unified performance analysis
                analysis = await self.analyzer.analyze_performance(
                    meta_data=meta_data,
                    google_data=google_data,
                    historical_data=await self._get_historical_data(),
                    competitor_benchmarks=await self._get_benchmarks()
                )
                
                # Check if optimization needed
                if self._needs_optimization(analysis):
                    # Generate optimization plan
                    optimization_plan = await self.optimizer.create_plan(
                        current_performance=analysis,
                        budget_constraints=self._get_budget_constraints(),
                        campaign_goals=self._get_campaign_goals()
                    )
                    
                    # Execute optimizations
                    results = await self.executor.execute_plan(
                        plan=optimization_plan,
                        platforms=["meta", "google"],
                        safety_checks=True
                    )
                    
                    # Log results
                    await self._log_optimization_results(results)
                
                # Wait for next monitoring cycle
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                await self._handle_monitoring_error(e)

class PerformanceAnalysisAgent:
    """Intelligent campaign performance analysis"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.2)
        self.memory = CampaignMemory()
        
    async def analyze_performance(
        self, 
        meta_data: Dict,
        google_data: Dict,
        historical_data: List[Dict],
        competitor_benchmarks: Dict
    ) -> Dict:
        """Comprehensive performance analysis"""
        
        # Calculate key metrics
        metrics = {
            "meta": self._calculate_platform_metrics(meta_data),
            "google": self._calculate_platform_metrics(google_data),
            "combined": self._calculate_combined_metrics(meta_data, google_data)
        }
        
        # Identify trends
        trends = self._identify_trends(metrics, historical_data)
        
        # Compare to benchmarks
        benchmark_analysis = self._benchmark_comparison(
            metrics, 
            competitor_benchmarks
        )
        
        # LLM-powered insight generation
        prompt = f"""Analyze this campaign performance data:
        
        Current Metrics: {metrics}
        Trends: {trends}
        Benchmark Comparison: {benchmark_analysis}
        
        Provide:
        1. Key performance insights
        2. Concerning patterns
        3. Optimization opportunities
        4. Risk factors
        5. Recommended actions
        """
        
        insights = await self.llm.ainvoke(prompt)
        
        # Compile comprehensive analysis
        return {
            "metrics": metrics,
            "trends": trends,
            "benchmarks": benchmark_analysis,
            "insights": insights,
            "health_score": self._calculate_health_score(metrics, trends),
            "optimization_potential": self._estimate_optimization_potential(
                metrics, 
                benchmarks
            )
        }
```

### 3. Report Generation Workflow

**Purpose**: Automated generation of intelligent, contextual reports with actionable insights

**Agent Architecture**:
```
┌────────────────────┐
│ Data Collection    │
│ Agents             │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Analysis Agent     │
├────────────────────┤
│ • Trend Detection  │
│ • Anomaly Finding  │
│ • Insight Mining   │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Report Composition │
│ Agent              │
├────────────────────┤
│ • Structure        │
│ • Narrative        │
│ • Visualizations   │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Distribution Agent │
└────────────────────┘
```

**Implementation**:
```python
class ReportGenerationWorkflow:
    """Intelligent report generation and distribution"""
    
    def __init__(self):
        self.data_collector = DataCollectionAgent()
        self.analyzer = ReportAnalysisAgent()
        self.composer = ReportCompositionAgent()
        self.distributor = ReportDistributionAgent()
        
    async def generate_daily_report(self) -> str:
        """Generate comprehensive daily report"""
        
        # Collect data from all sources
        data = await self.data_collector.collect_all_data(
            sources=[
                "campaign_performance",
                "crisis_alerts",
                "competitor_activity",
                "budget_status",
                "team_activity",
                "voter_sentiment"
            ]
        )
        
        # Deep analysis with historical context
        analysis = await self.analyzer.analyze_for_report(
            current_data=data,
            historical_context=await self._get_historical_context(),
            report_type="daily_executive"
        )
        
        # Compose report with AI
        report = await self.composer.compose_report(
            data=data,
            analysis=analysis,
            template="executive_daily",
            tone="professional_urgent"
        )
        
        # Generate visualizations
        visualizations = await self._generate_visualizations(
            data=data,
            insights=analysis["key_insights"]
        )
        
        # Compile final report
        final_report = self._compile_report(report, visualizations)
        
        # Distribute to stakeholders
        distribution_results = await self.distributor.distribute(
            report=final_report,
            recipients=self._get_recipients("daily"),
            channels=["email", "slack", "dashboard"]
        )
        
        return final_report

class ReportCompositionAgent:
    """AI-powered report writing"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.7)
        self.templates = ReportTemplates()
        
    async def compose_report(
        self,
        data: Dict,
        analysis: Dict,
        template: str,
        tone: str
    ) -> str:
        """Compose narrative report with insights"""
        
        # Get template structure
        structure = self.templates.get(template)
        
        # Build section prompts
        sections = {}
        for section_name, section_config in structure.items():
            prompt = self._build_section_prompt(
                section_name=section_name,
                config=section_config,
                data=data,
                analysis=analysis,
                tone=tone
            )
            
            section_content = await self.llm.ainvoke(prompt)
            sections[section_name] = section_content
        
        # Compile full report
        report = self._compile_sections(sections, structure)
        
        # Add executive summary
        summary_prompt = f"""Based on this report content, write a compelling 
        executive summary (3-5 bullet points) highlighting the most critical 
        information for campaign leadership:
        
        {report}
        """
        
        executive_summary = await self.llm.ainvoke(summary_prompt)
        
        return f"{executive_summary}\n\n{report}"
    
    def _build_section_prompt(
        self,
        section_name: str,
        config: Dict,
        data: Dict,
        analysis: Dict,
        tone: str
    ) -> str:
        """Build prompt for specific report section"""
        
        return f"""Write the {section_name} section of a campaign report.
        
        Tone: {tone}
        Focus: {config.get('focus', 'general update')}
        Length: {config.get('length', '2-3 paragraphs')}
        
        Data:
        {json.dumps(data.get(config['data_source']), indent=2)}
        
        Analysis & Insights:
        {json.dumps(analysis.get(config['analysis_key']), indent=2)}
        
        Requirements:
        - Be specific with numbers and trends
        - Highlight what's different from yesterday
        - Include actionable recommendations
        - Use clear, non-technical language
        """
```

### 4. Alert Routing Workflow

**Purpose**: Intelligent routing of alerts based on severity, context, and recipient availability

**Agent Architecture**:
```
┌────────────────────┐
│ Alert Intake Agent │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Priority Analysis  │
│ Agent              │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Recipient Selection│
│ Agent              │
├────────────────────┤
│ • Expertise Match  │
│ • Availability     │
│ • Past Performance │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Channel Selection  │
│ Agent              │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│ Delivery & Tracking│
│ Agent              │
└────────────────────┘
```

**Implementation**:
```python
class AlertRoutingWorkflow:
    """Intelligent alert routing and escalation"""
    
    def __init__(self):
        self.intake_agent = AlertIntakeAgent()
        self.priority_agent = PriorityAnalysisAgent()
        self.recipient_agent = RecipientSelectionAgent()
        self.channel_agent = ChannelSelectionAgent()
        self.delivery_agent = DeliveryTrackingAgent()
        
    async def route_alert(self, alert: Dict) -> Dict:
        """Route alert through intelligent workflow"""
        
        # Process and validate alert
        processed_alert = await self.intake_agent.process(alert)
        
        # Analyze priority with context
        priority_analysis = await self.priority_agent.analyze(
            alert=processed_alert,
            current_campaign_state=await self._get_campaign_state(),
            historical_patterns=await self._get_alert_patterns()
        )
        
        # Select optimal recipients
        recipients = await self.recipient_agent.select_recipients(
            alert_type=processed_alert["type"],
            priority=priority_analysis["priority"],
            required_expertise=priority_analysis["required_skills"],
            team_availability=await self._get_team_availability()
        )
        
        # Choose delivery channels
        routing_plan = []
        for recipient in recipients:
            channels = await self.channel_agent.select_channels(
                recipient=recipient,
                priority=priority_analysis["priority"],
                alert_type=processed_alert["type"],
                time_of_day=datetime.now().hour
            )
            
            routing_plan.append({
                "recipient": recipient,
                "channels": channels,
                "message": await self._personalize_message(
                    alert=processed_alert,
                    recipient=recipient,
                    priority=priority_analysis
                )
            })
        
        # Execute delivery with tracking
        delivery_results = await self.delivery_agent.deliver_tracked(
            routing_plan=routing_plan,
            escalation_rules=self._get_escalation_rules(),
            follow_up_required=priority_analysis["follow_up_needed"]
        )
        
        return {
            "alert_id": processed_alert["id"],
            "routing_plan": routing_plan,
            "delivery_results": delivery_results,
            "escalation_triggered": delivery_results.get("escalated", False)
        }

class RecipientSelectionAgent:
    """Intelligent recipient selection based on multiple factors"""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.3)
        self.team_profiles = TeamProfileManager()
        
    async def select_recipients(
        self,
        alert_type: str,
        priority: str,
        required_expertise: List[str],
        team_availability: Dict
    ) -> List[Dict]:
        """Select optimal recipients for alert"""
        
        # Get all team members
        team_members = await self.team_profiles.get_all_members()
        
        # Score each member
        scored_members = []
        for member in team_members:
            score = await self._score_recipient(
                member=member,
                alert_type=alert_type,
                priority=priority,
                required_expertise=required_expertise,
                availability=team_availability.get(member["id"])
            )
            scored_members.append((score, member))
        
        # Sort by score
        scored_members.sort(key=lambda x: x[0], reverse=True)
        
        # Determine how many recipients needed
        recipient_count = self._determine_recipient_count(priority)
        
        # Select top recipients
        selected = [member for score, member in scored_members[:recipient_count]]
        
        # Add escalation path
        for recipient in selected:
            recipient["escalation_to"] = self._get_escalation_contact(
                recipient, 
                priority
            )
        
        return selected
    
    async def _score_recipient(
        self,
        member: Dict,
        alert_type: str,
        priority: str,
        required_expertise: List[str],
        availability: Dict
    ) -> float:
        """Score recipient suitability"""
        
        # Base scores
        expertise_score = self._calculate_expertise_match(
            member["skills"], 
            required_expertise
        )
        availability_score = self._calculate_availability_score(
            availability,
            priority
        )
        past_performance = member.get("alert_response_score", 0.5)
        
        # LLM judgment for complex matching
        prompt = f"""Score this team member's suitability for handling this alert:
        
        Alert Type: {alert_type}
        Priority: {priority}
        Required Skills: {required_expertise}
        
        Team Member:
        - Skills: {member['skills']}
        - Experience: {member['experience']}
        - Current Workload: {availability.get('current_tasks', 0)}
        - Past Performance: {past_performance}
        
        Provide a suitability score from 0-1 and brief reasoning.
        """
        
        llm_assessment = await self.llm.ainvoke(prompt)
        llm_score = self._parse_llm_score(llm_assessment)
        
        # Weighted final score
        final_score = (
            expertise_score * 0.3 +
            availability_score * 0.2 +
            past_performance * 0.2 +
            llm_score * 0.3
        )
        
        return final_score
```

## Workflow Integration Points

### API Integrations
- **Mentionlytics API**: Real-time mention streaming
- **Meta Business API**: Campaign management
- **Google Ads API**: Performance data
- **Twilio API**: SMS alerts
- **Slack API**: Team notifications
- **SendGrid API**: Email delivery

### Database Schema Updates
```sql
-- New tables for LangChain workflows
CREATE TABLE workflow_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    memory_key VARCHAR(255) NOT NULL,
    memory_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id UUID NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    decision_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    decision_made JSONB NOT NULL,
    confidence_score FLOAT,
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    error_details JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    total_tokens_used INTEGER,
    total_cost DECIMAL(10, 4)
);

-- Indexes for performance
CREATE INDEX idx_workflow_memory_lookup ON workflow_memory(workflow_id, agent_id, memory_key);
CREATE INDEX idx_agent_decisions_workflow ON agent_decisions(workflow_run_id);
CREATE INDEX idx_workflow_runs_type_status ON workflow_runs(workflow_type, status);
```

### Environment Variables
```bash
# LangChain Configuration
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=war-room-production
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_TRACING_V2=true

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# Vector Store
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=war-room-vectors

# Workflow Configuration
WORKFLOW_PARALLELISM=10
WORKFLOW_TIMEOUT_SECONDS=300
WORKFLOW_RETRY_ATTEMPTS=3
WORKFLOW_MEMORY_TTL_DAYS=90
```

## Monitoring and Observability

### LangSmith Integration
```python
from langsmith import Client
from langsmith.run_trees import RunTree

class WorkflowMonitor:
    """Monitor LangChain workflows with LangSmith"""
    
    def __init__(self):
        self.client = Client()
        
    async def trace_workflow_run(self, workflow_type: str, run_id: str):
        """Trace workflow execution"""
        
        run_tree = RunTree(
            name=f"{workflow_type}_run",
            run_type="chain",
            inputs={"workflow_type": workflow_type, "run_id": run_id},
            project_name="war-room-workflows"
        )
        
        return run_tree
    
    async def log_agent_decision(
        self,
        run_tree: RunTree,
        agent_name: str,
        decision: Dict,
        confidence: float
    ):
        """Log individual agent decisions"""
        
        child_run = run_tree.create_child(
            name=f"{agent_name}_decision",
            run_type="llm",
            inputs=decision.get("inputs", {}),
            outputs={
                "decision": decision,
                "confidence": confidence
            }
        )
        
        await child_run.end()
```

### Performance Metrics
- **Workflow latency**: Time from trigger to completion
- **Agent decision time**: Time per agent decision
- **Token usage**: Tokens consumed per workflow run
- **Cost tracking**: $ spent per workflow execution
- **Success rate**: Successful completions vs failures
- **Alert accuracy**: True positive rate for crisis detection
- **Response time**: Time to first human response

## Testing Strategy

### Unit Tests
```python
import pytest
from unittest.mock import Mock, patch
from langchain.schema import AgentAction

@pytest.mark.asyncio
async def test_crisis_detection_workflow():
    """Test crisis detection workflow"""
    
    workflow = CrisisDetectionWorkflow()
    
    # Mock input data
    test_mention = {
        "text": "Major scandal brewing about the candidate",
        "source": "twitter",
        "reach": 50000,
        "sentiment": -0.8
    }
    
    # Run workflow
    result = await workflow.run({"mentions": [test_mention]})
    
    # Assertions
    assert result["severity"] >= 7
    assert "alert_results" in result
    assert result["response_plan"] is not None
```

### Integration Tests
```python
@pytest.mark.integration
async def test_full_alert_routing():
    """Test complete alert routing workflow"""
    
    # Create test alert
    alert = {
        "type": "crisis",
        "severity": "high",
        "message": "Negative media coverage detected",
        "source": "news_monitoring"
    }
    
    # Run routing workflow
    workflow = AlertRoutingWorkflow()
    result = await workflow.route_alert(alert)
    
    # Verify routing
    assert len(result["routing_plan"]) > 0
    assert all(r["channels"] for r in result["routing_plan"])
    assert result["delivery_results"]["success"] == True
```

## Migration Steps

### Phase 1: Development (Week 1-2)
1. Set up LangChain development environment
2. Create base agent classes and utilities
3. Implement workflow memory management
4. Build Crisis Detection workflow
5. Create comprehensive test suite

### Phase 2: Staging Testing (Week 3-4)
1. Deploy to staging environment
2. Run parallel with n8n workflows
3. Compare outputs and accuracy
4. Performance optimization
5. Load testing with production-like data

### Phase 3: Production Rollout (Week 5-6)
1. Deploy to production (10% traffic)
2. Monitor performance metrics
3. Gradual traffic increase (25%, 50%, 100%)
4. Decommission n8n workflows
5. Post-migration optimization

## Troubleshooting Guide

### Common Issues

**High token usage**:
- Implement token limits per agent
- Use smaller models for simple decisions
- Cache frequently used context

**Slow response times**:
- Enable agent parallelization
- Optimize memory retrieval queries
- Use streaming for long responses

**Inconsistent decisions**:
- Reduce temperature for critical agents
- Add validation layers
- Implement decision logging

**Memory growth**:
- Set TTL on workflow memory
- Implement memory summarization
- Regular memory cleanup jobs

---

*Last Updated: August 2, 2025*
*War Room Development Team*