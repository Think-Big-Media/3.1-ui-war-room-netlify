"""SUB-AGENT 4: Pieces Knowledge Manager

MISSION: Centralize and organize knowledge capture from all War Room sub-agents
TARGET: All successful patterns and fixes from other sub-agents

CORE RESPONSIBILITIES:
1. Monitor all successful fixes and patterns from other sub-agents
2. Organize and tag patterns by category (security, performance, refactoring)
3. Create reusable snippets for common War Room-specific solutions
4. Build searchable knowledge base of War Room-specific solutions
5. Generate weekly pattern reports with insights and trends
6. Coordinate with Health Check, AMP Refactoring, and CodeRabbit agents
7. Provide pattern recommendations to other sub-agents
"""

import asyncio
import json
import logging
import hashlib
import time
import re
from typing import Dict, List, Optional, Any, Set, Tuple, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timedelta
import aiohttp
import base64
from pathlib import Path
from collections import defaultdict, Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import PorterStemmer

# Import base agent and existing pieces integration
from base_agent import BaseAgent, WarRoomAgentError
from pieces_integration import PiecesIntegration, PiecesPattern, PatternCategory, PiecesAssetType

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
except Exception as e:
    logger.warning(f"Failed to download NLTK data: {e}")

class KnowledgeCategory(Enum):
    """Extended categories for knowledge management"""
    HEALTH_CHECK_FIXES = "health-check-fixes"
    AMP_OPTIMIZATIONS = "amp-optimizations"  
    CODERABBIT_FIXES = "coderabbit-fixes"
    WAR_ROOM_SOLUTIONS = "war-room-solutions"
    PERFORMANCE_PATTERNS = "performance-patterns"
    SECURITY_PATTERNS = "security-patterns"
    REFACTORING_PATTERNS = "refactoring-patterns"
    DEPLOYMENT_PATTERNS = "deployment-patterns"
    MONITORING_PATTERNS = "monitoring-patterns"
    INTEGRATION_PATTERNS = "integration-patterns"

class PatternPriority(Enum):
    """Priority levels for patterns"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RecommendationType(Enum):
    """Types of recommendations"""
    SIMILAR_PATTERN = "similar_pattern"
    COMPLEMENTARY_SOLUTION = "complementary_solution"
    ALTERNATIVE_APPROACH = "alternative_approach"
    PREVENTIVE_MEASURE = "preventive_measure"

@dataclass
class KnowledgePattern:
    """Enhanced pattern for knowledge management"""
    id: str
    name: str
    description: str
    content: str
    category: KnowledgeCategory
    priority: PatternPriority
    source_agent: str
    language: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    success_count: int = 0
    failure_count: int = 0
    confidence_score: float = 0.0
    usage_frequency: int = 0
    last_used: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    related_patterns: List[str] = field(default_factory=list)
    embedding_vector: Optional[List[float]] = None

@dataclass
class PatternRecommendation:
    """Recommendation for pattern usage"""
    pattern_id: str
    recommendation_type: RecommendationType
    relevance_score: float
    context: str
    reasoning: str
    suggested_modifications: Optional[str] = None

@dataclass
class KnowledgeInsight:
    """Generated insights from knowledge base"""
    insight_type: str
    title: str
    description: str
    patterns_analyzed: int
    confidence: float
    actionable_items: List[str]
    trend_data: Dict[str, Any]
    generated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class WeeklyReport:
    """Weekly pattern analysis report"""
    report_id: str
    week_start: datetime
    week_end: datetime
    total_patterns: int
    new_patterns: int
    most_used_patterns: List[Dict[str, Any]]
    trending_categories: List[Dict[str, Any]]
    success_rates: Dict[str, float]
    insights: List[KnowledgeInsight]
    recommendations: List[str]
    generated_at: datetime = field(default_factory=datetime.utcnow)

class PiecesKnowledgeManager(BaseAgent):
    """Advanced Knowledge Manager for War Room patterns and solutions"""
    
    def __init__(self, 
                 pieces_api_key: Optional[str] = None,
                 pieces_base_url: str = "https://api.pieces.app"):
        super().__init__(
            name="PiecesKnowledgeManager",
            specialization="Knowledge capture, organization, and pattern analysis"
        )
        
        # Core components
        self.pieces_integration = PiecesIntegration(pieces_api_key, pieces_base_url)
        
        # Knowledge storage
        self.knowledge_patterns: Dict[str, KnowledgePattern] = {}
        self.pattern_embeddings: Dict[str, np.ndarray] = {}
        self.category_clusters: Dict[KnowledgeCategory, List[str]] = defaultdict(list)
        
        # Analysis components
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        
        # Inter-agent communication
        self.agent_listeners: Dict[str, callable] = {}
        self.pattern_subscriptions: Dict[str, Set[KnowledgeCategory]] = defaultdict(set)
        
        # Reporting and insights
        self.weekly_reports: List[WeeklyReport] = []
        self.insights_cache: Dict[str, KnowledgeInsight] = {}
        
        # Configuration
        self.semantic_similarity_threshold = 0.75
        self.recommendation_limit = 10
        self.auto_clustering_enabled = True
        self.real_time_analysis_enabled = True
        
        # Statistics
        self.stats = {
            "total_patterns": 0,
            "patterns_by_category": Counter(),
            "patterns_by_agent": Counter(),
            "successful_recommendations": 0,
            "failed_recommendations": 0,
            "insights_generated": 0,
            "reports_created": 0
        }
        
        # Initialize components
        self._initialize_knowledge_components()
    
    def _initialize_knowledge_components(self):
        """Initialize knowledge management components"""
        logger.info("Initializing Pieces Knowledge Manager components...")
        
        # Set up pattern matchers
        self.pattern_matchers = {
            'security': self._match_security_pattern,
            'performance': self._match_performance_pattern,
            'refactoring': self._match_refactoring_pattern,
            'bug_fix': self._match_bug_fix_pattern,
            'optimization': self._match_optimization_pattern
        }
        
        # Initialize clustering
        self.kmeans_clusterer = KMeans(n_clusters=8, random_state=42)
        
        # Set up recommendation engine
        self.recommendation_weights = {
            RecommendationType.SIMILAR_PATTERN: 0.4,
            RecommendationType.COMPLEMENTARY_SOLUTION: 0.3,
            RecommendationType.ALTERNATIVE_APPROACH: 0.2,
            RecommendationType.PREVENTIVE_MEASURE: 0.1
        }
        
        logger.info("Knowledge Manager components initialized successfully")
    
    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute knowledge management tasks"""
        self.log_task_start(task)
        
        try:
            task_type = task.get("type")
            task_params = task.get("parameters", {})
            
            if task_type == "capture_pattern":
                result = await self._capture_pattern_from_agent(task_params)
            elif task_type == "search_knowledge":
                result = await self._search_knowledge_base(task_params)
            elif task_type == "generate_recommendations":
                result = await self._generate_pattern_recommendations(task_params)
            elif task_type == "create_snippet":
                result = await self._create_reusable_snippet(task_params)
            elif task_type == "analyze_patterns":
                result = await self._analyze_pattern_trends(task_params)
            elif task_type == "generate_report":
                result = await self._generate_weekly_report(task_params)
            elif task_type == "monitor_agents":
                result = await self._monitor_agent_patterns(task_params)
            elif task_type == "update_knowledge":
                result = await self._update_knowledge_from_feedback(task_params)
            else:
                result = {
                    "status": "error",
                    "error": f"Unknown task type: {task_type}"
                }
            
            self.log_task_completion(result)
            return result
            
        except Exception as e:
            error_result = {
                "status": "error",
                "error": str(e),
                "task_type": task.get("type")
            }
            self.log_task_completion(error_result)
            logger.error(f"Task execution failed: {e}")
            return error_result
    
    def validate_capability(self, task: Dict[str, Any]) -> bool:
        """Validate if this agent can handle the task"""
        valid_tasks = [
            "capture_pattern", "search_knowledge", "generate_recommendations",
            "create_snippet", "analyze_patterns", "generate_report",
            "monitor_agents", "update_knowledge"
        ]
        return task.get("type") in valid_tasks
    
    def get_capabilities(self) -> List[str]:
        """Return list of supported task types"""
        return [
            "capture_pattern", "search_knowledge", "generate_recommendations",
            "create_snippet", "analyze_patterns", "generate_report",
            "monitor_agents", "update_knowledge"
        ]
    
    async def _capture_pattern_from_agent(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Capture and store a pattern from another agent"""
        try:
            source_agent = params.get("source_agent")
            pattern_data = params.get("pattern_data", {})
            
            # Create knowledge pattern
            pattern = KnowledgePattern(
                id=f"{source_agent}_{pattern_data.get('id', int(time.time()))}",
                name=pattern_data.get("name", "Unnamed Pattern"),
                description=pattern_data.get("description", ""),
                content=pattern_data.get("content", ""),
                category=KnowledgeCategory(pattern_data.get("category", "war-room-solutions")),
                priority=PatternPriority(pattern_data.get("priority", "medium")),
                source_agent=source_agent,
                language=pattern_data.get("language"),
                tags=pattern_data.get("tags", []),
                metadata=pattern_data.get("metadata", {})
            )
            
            # Add automated tags
            pattern.tags.extend(self._generate_automated_tags(pattern))
            
            # Generate semantic embedding
            pattern.embedding_vector = await self._generate_pattern_embedding(pattern)
            
            # Store in knowledge base
            self.knowledge_patterns[pattern.id] = pattern
            self.category_clusters[pattern.category].append(pattern.id)
            
            # Store in Pieces
            pieces_result = await self._store_pattern_in_pieces(pattern)
            
            # Update statistics
            self.stats["total_patterns"] += 1
            self.stats["patterns_by_category"][pattern.category.value] += 1
            self.stats["patterns_by_agent"][source_agent] += 1
            
            # Trigger real-time analysis if enabled
            if self.real_time_analysis_enabled:
                await self._trigger_real_time_analysis(pattern)
            
            logger.info(f"Successfully captured pattern {pattern.id} from {source_agent}")
            
            return {
                "status": "success",
                "pattern_id": pattern.id,
                "pieces_result": pieces_result,
                "automated_tags": len(pattern.tags),
                "category": pattern.category.value
            }
            
        except Exception as e:
            logger.error(f"Failed to capture pattern: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _search_knowledge_base(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search knowledge base with semantic understanding"""
        try:
            query = params.get("query", "")
            categories = params.get("categories", [])
            limit = params.get("limit", 10)
            include_embeddings = params.get("include_embeddings", False)
            
            # Convert category strings to enums
            category_filters = []
            for cat in categories:
                try:
                    category_filters.append(KnowledgeCategory(cat))
                except ValueError:
                    logger.warning(f"Invalid category: {cat}")
            
            # Generate query embedding
            query_embedding = await self._generate_text_embedding(query)
            
            # Search results
            results = []
            
            for pattern_id, pattern in self.knowledge_patterns.items():
                # Filter by categories if specified
                if category_filters and pattern.category not in category_filters:
                    continue
                
                # Calculate semantic similarity
                similarity_score = 0.0
                if pattern.embedding_vector and query_embedding is not None:
                    similarity_score = self._calculate_cosine_similarity(
                        query_embedding, np.array(pattern.embedding_vector)
                    )
                
                # Calculate text-based relevance
                text_relevance = self._calculate_text_relevance(query, pattern)
                
                # Combine scores
                combined_score = (similarity_score * 0.7) + (text_relevance * 0.3)
                
                if combined_score > 0.1:  # Minimum threshold
                    result = {
                        "pattern_id": pattern.id,
                        "name": pattern.name,
                        "description": pattern.description,
                        "category": pattern.category.value,
                        "source_agent": pattern.source_agent,
                        "tags": pattern.tags,
                        "similarity_score": similarity_score,
                        "text_relevance": text_relevance,
                        "combined_score": combined_score,
                        "usage_frequency": pattern.usage_frequency,
                        "confidence_score": pattern.confidence_score,
                        "created_at": pattern.created_at.isoformat()
                    }
                    
                    if include_embeddings:
                        result["embedding_vector"] = pattern.embedding_vector
                    
                    results.append(result)
            
            # Sort by combined score
            results.sort(key=lambda x: x["combined_score"], reverse=True)
            results = results[:limit]
            
            logger.info(f"Search returned {len(results)} results for query: {query}")
            
            return {
                "status": "success",
                "query": query,
                "results": results,
                "total_patterns_searched": len(self.knowledge_patterns),
                "categories_filtered": [cat.value for cat in category_filters]
            }
            
        except Exception as e:
            logger.error(f"Knowledge search failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _generate_pattern_recommendations(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate intelligent pattern recommendations"""
        try:
            context = params.get("context", "")
            current_problem = params.get("problem", "")
            agent_requesting = params.get("agent", "")
            max_recommendations = params.get("limit", self.recommendation_limit)
            
            # Generate context embedding
            context_embedding = await self._generate_text_embedding(f"{context} {current_problem}")
            
            recommendations = []
            
            # Find similar patterns
            similar_patterns = await self._find_similar_patterns(
                context_embedding, current_problem, limit=max_recommendations * 2
            )
            
            for pattern_info in similar_patterns:
                pattern = self.knowledge_patterns[pattern_info["pattern_id"]]
                
                # Generate different types of recommendations
                for rec_type in RecommendationType:
                    recommendation = await self._generate_specific_recommendation(
                        pattern, rec_type, context, current_problem
                    )
                    
                    if recommendation and recommendation.relevance_score > 0.3:
                        recommendations.append(recommendation)
            
            # Sort by relevance and limit
            recommendations.sort(key=lambda x: x.relevance_score, reverse=True)
            recommendations = recommendations[:max_recommendations]
            
            # Update usage statistics
            for rec in recommendations:
                if rec.pattern_id in self.knowledge_patterns:
                    self.knowledge_patterns[rec.pattern_id].usage_frequency += 1
                    self.knowledge_patterns[rec.pattern_id].last_used = datetime.utcnow()
            
            logger.info(f"Generated {len(recommendations)} recommendations for {agent_requesting}")
            
            return {
                "status": "success",
                "recommendations": [asdict(rec) for rec in recommendations],
                "context_analyzed": bool(context),
                "requesting_agent": agent_requesting
            }
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _create_reusable_snippet(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create reusable code snippets from patterns"""
        try:
            pattern_ids = params.get("pattern_ids", [])
            snippet_name = params.get("name", "Generated Snippet")
            target_language = params.get("language", "python")
            include_metadata = params.get("include_metadata", True)
            
            if not pattern_ids:
                return {"status": "error", "error": "No pattern IDs provided"}
            
            # Collect patterns
            patterns = []
            for pattern_id in pattern_ids:
                if pattern_id in self.knowledge_patterns:
                    patterns.append(self.knowledge_patterns[pattern_id])
            
            if not patterns:
                return {"status": "error", "error": "No valid patterns found"}
            
            # Generate snippet content
            snippet_content = await self._generate_snippet_content(
                patterns, target_language, include_metadata
            )
            
            # Create snippet pattern
            snippet_pattern = KnowledgePattern(
                id=f"snippet_{int(time.time())}",
                name=snippet_name,
                description=f"Reusable snippet generated from {len(patterns)} patterns",
                content=snippet_content,
                category=KnowledgeCategory.WAR_ROOM_SOLUTIONS,
                priority=PatternPriority.HIGH,
                source_agent="PiecesKnowledgeManager",
                language=target_language,
                tags=["reusable-snippet", "generated", target_language],
                metadata={
                    "source_patterns": pattern_ids,
                    "generation_method": "pattern_combination",
                    "target_language": target_language,
                    "patterns_combined": len(patterns)
                }
            )
            
            # Store snippet
            self.knowledge_patterns[snippet_pattern.id] = snippet_pattern
            
            # Store in Pieces
            pieces_result = await self._store_pattern_in_pieces(snippet_pattern)
            
            logger.info(f"Created reusable snippet {snippet_pattern.id} from {len(patterns)} patterns")
            
            return {
                "status": "success",
                "snippet_id": snippet_pattern.id,
                "snippet_name": snippet_name,
                "content_preview": snippet_content[:200] + "..." if len(snippet_content) > 200 else snippet_content,
                "source_patterns": pattern_ids,
                "pieces_result": pieces_result
            }
            
        except Exception as e:
            logger.error(f"Snippet creation failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _analyze_pattern_trends(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns for trends and insights"""
        try:
            time_period = params.get("time_period", "week")  # week, month, quarter
            categories = params.get("categories", [])
            include_predictions = params.get("include_predictions", True)
            
            # Calculate time range
            end_time = datetime.utcnow()
            if time_period == "week":
                start_time = end_time - timedelta(weeks=1)
            elif time_period == "month":
                start_time = end_time - timedelta(days=30)
            elif time_period == "quarter":
                start_time = end_time - timedelta(days=90)
            else:
                start_time = end_time - timedelta(weeks=1)
            
            # Filter patterns by time and category
            filtered_patterns = []
            for pattern in self.knowledge_patterns.values():
                if start_time <= pattern.created_at <= end_time:
                    if not categories or pattern.category.value in categories:
                        filtered_patterns.append(pattern)
            
            # Generate insights
            insights = []
            
            # Usage trend analysis
            usage_insight = await self._analyze_usage_trends(filtered_patterns, time_period)
            insights.append(usage_insight)
            
            # Success rate analysis
            success_insight = await self._analyze_success_rates(filtered_patterns)
            insights.append(success_insight)
            
            # Category distribution analysis
            category_insight = await self._analyze_category_distribution(filtered_patterns)
            insights.append(category_insight)
            
            # Language popularity analysis
            language_insight = await self._analyze_language_trends(filtered_patterns)
            insights.append(language_insight)
            
            # Generate predictions if requested
            predictions = []
            if include_predictions:
                predictions = await self._generate_trend_predictions(filtered_patterns, time_period)
            
            # Update insights cache
            for insight in insights:
                self.insights_cache[f"{insight.insight_type}_{int(time.time())}"] = insight
            
            self.stats["insights_generated"] += len(insights)
            
            logger.info(f"Analyzed {len(filtered_patterns)} patterns for trends over {time_period}")
            
            return {
                "status": "success",
                "time_period": time_period,
                "patterns_analyzed": len(filtered_patterns),
                "insights": [asdict(insight) for insight in insights],
                "predictions": predictions,
                "analysis_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Pattern trend analysis failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _generate_weekly_report(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive weekly knowledge report"""
        try:
            week_offset = params.get("week_offset", 0)  # 0 = current week, 1 = last week, etc.
            include_detailed_insights = params.get("detailed_insights", True)
            
            # Calculate week boundaries
            end_date = datetime.utcnow() - timedelta(weeks=week_offset)
            start_date = end_date - timedelta(weeks=1)
            
            # Filter patterns for the week
            week_patterns = [
                pattern for pattern in self.knowledge_patterns.values()
                if start_date <= pattern.created_at <= end_date
            ]
            
            # Calculate most used patterns
            all_patterns = list(self.knowledge_patterns.values())
            most_used = sorted(
                all_patterns, 
                key=lambda p: p.usage_frequency, 
                reverse=True
            )[:10]
            
            most_used_data = [
                {
                    "pattern_id": p.id,
                    "name": p.name,
                    "category": p.category.value,
                    "usage_count": p.usage_frequency,
                    "success_rate": p.success_count / (p.success_count + p.failure_count) if (p.success_count + p.failure_count) > 0 else 0
                }
                for p in most_used
            ]
            
            # Calculate trending categories
            category_usage = Counter()
            for pattern in week_patterns:
                category_usage[pattern.category.value] += pattern.usage_frequency
            
            trending_categories = [
                {"category": cat, "usage_count": count}
                for cat, count in category_usage.most_common(5)
            ]
            
            # Calculate success rates by category
            success_rates = {}
            for category in KnowledgeCategory:
                cat_patterns = [p for p in all_patterns if p.category == category]
                if cat_patterns:
                    total_success = sum(p.success_count for p in cat_patterns)
                    total_attempts = sum(p.success_count + p.failure_count for p in cat_patterns)
                    success_rates[category.value] = total_success / total_attempts if total_attempts > 0 else 0
            
            # Generate detailed insights
            insights = []
            if include_detailed_insights:
                # Growth insight
                growth_insight = KnowledgeInsight(
                    insight_type="growth",
                    title="Knowledge Base Growth",
                    description=f"Added {len(week_patterns)} new patterns this week",
                    patterns_analyzed=len(week_patterns),
                    confidence=0.9,
                    actionable_items=[
                        f"Consider focusing on categories with low pattern count",
                        f"Encourage agents to document more solutions"
                    ],
                    trend_data={"new_patterns": len(week_patterns)}
                )
                insights.append(growth_insight)
                
                # Quality insight
                avg_confidence = sum(p.confidence_score for p in week_patterns) / len(week_patterns) if week_patterns else 0
                quality_insight = KnowledgeInsight(
                    insight_type="quality",
                    title="Pattern Quality Assessment",
                    description=f"Average confidence score: {avg_confidence:.2f}",
                    patterns_analyzed=len(week_patterns),
                    confidence=avg_confidence,
                    actionable_items=[
                        "Review low-confidence patterns for improvement",
                        "Gather more feedback on pattern effectiveness"
                    ],
                    trend_data={"average_confidence": avg_confidence}
                )
                insights.append(quality_insight)
            
            # Generate recommendations for next week
            recommendations = [
                "Continue monitoring pattern usage to identify improvement opportunities",
                "Focus on expanding knowledge in underrepresented categories",
                "Review and update low-performing patterns",
                "Encourage cross-agent pattern sharing",
                "Consider automated pattern validation improvements"
            ]
            
            # Create report
            report = WeeklyReport(
                report_id=f"weekly_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}",
                week_start=start_date,
                week_end=end_date,
                total_patterns=len(all_patterns),
                new_patterns=len(week_patterns),
                most_used_patterns=most_used_data,
                trending_categories=trending_categories,
                success_rates=success_rates,
                insights=insights,
                recommendations=recommendations
            )
            
            # Store report
            self.weekly_reports.append(report)
            self.stats["reports_created"] += 1
            
            logger.info(f"Generated weekly report for {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
            
            return {
                "status": "success",
                "report": asdict(report),
                "summary": {
                    "total_patterns": len(all_patterns),
                    "new_this_week": len(week_patterns),
                    "most_active_category": trending_categories[0]["category"] if trending_categories else "none",
                    "overall_success_rate": sum(success_rates.values()) / len(success_rates) if success_rates else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Weekly report generation failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _monitor_agent_patterns(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor and capture patterns from other agents"""
        try:
            target_agents = params.get("agents", ["all"])
            monitoring_duration = params.get("duration_minutes", 60)
            auto_capture = params.get("auto_capture", True)
            
            monitoring_results = {
                "monitored_agents": [],
                "patterns_detected": 0,
                "patterns_captured": 0,
                "monitoring_duration": monitoring_duration
            }
            
            # Set up monitoring for each agent
            for agent_name in target_agents:
                if agent_name == "all":
                    # Monitor all known agents
                    agents_to_monitor = ["HealthCheckMonitor", "AMPRefactoringSpecialist", "CodeRabbitIntegration"]
                else:
                    agents_to_monitor = [agent_name]
                
                for agent in agents_to_monitor:
                    # Set up pattern listener
                    listener_id = f"monitor_{agent}_{int(time.time())}"
                    self.agent_listeners[listener_id] = self._create_agent_listener(agent, auto_capture)
                    monitoring_results["monitored_agents"].append(agent)
            
            # Simulate monitoring (in real implementation, this would be event-driven)
            await asyncio.sleep(1)  # Brief simulation
            
            # Check for any patterns that might have been captured during monitoring
            recent_patterns = [
                p for p in self.knowledge_patterns.values()
                if (datetime.utcnow() - p.created_at).total_seconds() < monitoring_duration * 60
            ]
            
            monitoring_results["patterns_detected"] = len(recent_patterns)
            monitoring_results["patterns_captured"] = len([p for p in recent_patterns if auto_capture])
            
            logger.info(f"Monitored {len(monitoring_results['monitored_agents'])} agents for {monitoring_duration} minutes")
            
            return {
                "status": "success",
                **monitoring_results
            }
            
        except Exception as e:
            logger.error(f"Agent monitoring failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _update_knowledge_from_feedback(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Update knowledge base based on feedback"""
        try:
            pattern_id = params.get("pattern_id")
            feedback_type = params.get("feedback_type")  # "success", "failure", "improvement"
            feedback_details = params.get("details", "")
            source_agent = params.get("source_agent", "unknown")
            
            if not pattern_id or pattern_id not in self.knowledge_patterns:
                return {"status": "error", "error": "Pattern not found"}
            
            pattern = self.knowledge_patterns[pattern_id]
            
            # Update pattern based on feedback
            if feedback_type == "success":
                pattern.success_count += 1
                self.stats["successful_recommendations"] += 1
            elif feedback_type == "failure":
                pattern.failure_count += 1
                self.stats["failed_recommendations"] += 1
            elif feedback_type == "improvement":
                # Handle improvement suggestions
                if "metadata" not in pattern.metadata:
                    pattern.metadata["feedback"] = []
                pattern.metadata["feedback"].append({
                    "type": "improvement",
                    "details": feedback_details,
                    "source": source_agent,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Recalculate confidence score
            total_usage = pattern.success_count + pattern.failure_count
            if total_usage > 0:
                pattern.confidence_score = pattern.success_count / total_usage
            
            # Update timestamp
            pattern.updated_at = datetime.utcnow()
            
            # Update in Pieces if needed
            pieces_update = await self._update_pattern_in_pieces(pattern)
            
            logger.info(f"Updated pattern {pattern_id} with {feedback_type} feedback from {source_agent}")
            
            return {
                "status": "success",
                "pattern_id": pattern_id,
                "new_confidence_score": pattern.confidence_score,
                "total_usage": total_usage,
                "pieces_updated": pieces_update.get("status") == "success"
            }
            
        except Exception as e:
            logger.error(f"Knowledge update from feedback failed: {e}")
            return {"status": "error", "error": str(e)}
    
    # Helper methods for pattern processing and analysis
    
    def _generate_automated_tags(self, pattern: KnowledgePattern) -> List[str]:
        """Generate automated tags for a pattern"""
        tags = []
        
        # Add category-based tags
        tags.append(pattern.category.value)
        
        # Add source agent tag
        tags.append(f"source-{pattern.source_agent.lower()}")
        
        # Add language tag if available
        if pattern.language:
            tags.append(f"lang-{pattern.language}")
        
        # Add priority tag
        tags.append(f"priority-{pattern.priority.value}")
        
        # Content-based tags
        content_lower = pattern.content.lower()
        
        # Technical tags
        if any(word in content_lower for word in ['security', 'vulnerability', 'cve']):
            tags.append("security-related")
        if any(word in content_lower for word in ['performance', 'optimization', 'speed']):
            tags.append("performance-related")
        if any(word in content_lower for word in ['bug', 'fix', 'error', 'issue']):
            tags.append("bug-fix")
        if any(word in content_lower for word in ['refactor', 'refactoring', 'restructure']):
            tags.append("refactoring")
        if any(word in content_lower for word in ['test', 'testing', 'unit', 'integration']):
            tags.append("testing-related")
        
        # Complexity tags
        if len(pattern.content) > 1000:
            tags.append("complex-solution")
        elif len(pattern.content) < 200:
            tags.append("simple-solution")
        
        return list(set(tags))  # Remove duplicates
    
    async def _generate_pattern_embedding(self, pattern: KnowledgePattern) -> Optional[List[float]]:
        """Generate semantic embedding for a pattern"""
        try:
            # Combine pattern text for embedding
            text_for_embedding = f"{pattern.name} {pattern.description} {pattern.content}"
            
            # Remove code blocks and normalize text
            text_cleaned = re.sub(r'```.*?```', '', text_for_embedding, flags=re.DOTALL)
            text_cleaned = re.sub(r'`.*?`', '', text_cleaned)
            text_cleaned = ' '.join(text_cleaned.split())
            
            return await self._generate_text_embedding(text_cleaned)
            
        except Exception as e:
            logger.error(f"Failed to generate pattern embedding: {e}")
            return None
    
    async def _generate_text_embedding(self, text: str) -> Optional[np.ndarray]:
        """Generate text embedding using TF-IDF (can be replaced with more advanced methods)"""
        try:
            if not hasattr(self, '_fitted_vectorizer'):
                # If we don't have enough data, return None
                if len(self.knowledge_patterns) < 5:
                    return None
                
                # Fit vectorizer on existing patterns
                all_texts = []
                for pattern in self.knowledge_patterns.values():
                    pattern_text = f"{pattern.name} {pattern.description} {pattern.content}"
                    all_texts.append(pattern_text)
                
                self.tfidf_vectorizer.fit(all_texts)
                self._fitted_vectorizer = True
            
            # Transform the text
            embedding = self.tfidf_vectorizer.transform([text])
            return embedding.toarray()[0]
            
        except Exception as e:
            logger.warning(f"Failed to generate text embedding: {e}")
            return None
    
    def _calculate_cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            # Ensure vectors are the same length
            if len(vec1) != len(vec2):
                return 0.0
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm_vec1 = np.linalg.norm(vec1)
            norm_vec2 = np.linalg.norm(vec2)
            
            if norm_vec1 == 0 or norm_vec2 == 0:
                return 0.0
            
            return dot_product / (norm_vec1 * norm_vec2)
            
        except Exception as e:
            logger.warning(f"Cosine similarity calculation failed: {e}")
            return 0.0
    
    def _calculate_text_relevance(self, query: str, pattern: KnowledgePattern) -> float:
        """Calculate text-based relevance score"""
        try:
            query_words = set(query.lower().split())
            if not query_words:
                return 0.0
            
            # Get pattern text
            pattern_text = f"{pattern.name} {pattern.description} {pattern.content}".lower()
            pattern_words = set(pattern_text.split())
            
            # Calculate word overlap
            common_words = query_words.intersection(pattern_words)
            
            # Base relevance score
            relevance = len(common_words) / len(query_words) if query_words else 0
            
            # Boost for exact phrase matches
            if query.lower() in pattern_text:
                relevance += 0.3
            
            # Boost for tag matches
            query_lower = query.lower()
            for tag in pattern.tags:
                if tag.lower() in query_lower:
                    relevance += 0.2
            
            return min(1.0, relevance)
            
        except Exception as e:
            logger.warning(f"Text relevance calculation failed: {e}")
            return 0.0
    
    async def _find_similar_patterns(self, query_embedding: Optional[np.ndarray], 
                                   problem_description: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Find patterns similar to the given query"""
        similar_patterns = []
        
        try:
            for pattern_id, pattern in self.knowledge_patterns.items():
                similarity_score = 0.0
                
                # Semantic similarity if embeddings available
                if query_embedding is not None and pattern.embedding_vector:
                    semantic_sim = self._calculate_cosine_similarity(
                        query_embedding, np.array(pattern.embedding_vector)
                    )
                    similarity_score += semantic_sim * 0.6
                
                # Text-based similarity
                text_sim = self._calculate_text_relevance(problem_description, pattern)
                similarity_score += text_sim * 0.4
                
                if similarity_score > 0.1:  # Minimum threshold
                    similar_patterns.append({
                        "pattern_id": pattern_id,
                        "similarity_score": similarity_score
                    })
            
            # Sort by similarity and limit results
            similar_patterns.sort(key=lambda x: x["similarity_score"], reverse=True)
            return similar_patterns[:limit]
            
        except Exception as e:
            logger.error(f"Failed to find similar patterns: {e}")
            return []
    
    async def _generate_specific_recommendation(self, pattern: KnowledgePattern, 
                                             rec_type: RecommendationType,
                                             context: str, problem: str) -> Optional[PatternRecommendation]:
        """Generate a specific type of recommendation"""
        try:
            relevance_score = 0.0
            reasoning = ""
            suggested_modifications = None
            
            if rec_type == RecommendationType.SIMILAR_PATTERN:
                # Check if pattern addresses similar problems
                similarity = self._calculate_text_relevance(problem, pattern)
                if similarity > 0.3:
                    relevance_score = similarity * pattern.confidence_score
                    reasoning = f"This pattern has been successfully applied to similar problems with {pattern.confidence_score:.2f} confidence."
            
            elif rec_type == RecommendationType.COMPLEMENTARY_SOLUTION:
                # Check if pattern complements the current approach
                if pattern.category in [KnowledgeCategory.PERFORMANCE_PATTERNS, KnowledgeCategory.SECURITY_PATTERNS]:
                    relevance_score = 0.5 * pattern.confidence_score
                    reasoning = f"This {pattern.category.value} pattern could enhance your current solution."
            
            elif rec_type == RecommendationType.ALTERNATIVE_APPROACH:
                # Check for alternative approaches
                if any(word in problem.lower() for word in ['alternative', 'different', 'other']):
                    relevance_score = 0.4 * pattern.confidence_score
                    reasoning = f"Consider this alternative approach used by {pattern.source_agent}."
            
            elif rec_type == RecommendationType.PREVENTIVE_MEASURE:
                # Check for preventive patterns
                if 'security' in pattern.tags or 'monitoring' in pattern.tags:
                    relevance_score = 0.3 * pattern.confidence_score
                    reasoning = "This pattern could help prevent similar issues in the future."
            
            if relevance_score > 0.2:  # Minimum threshold
                return PatternRecommendation(
                    pattern_id=pattern.id,
                    recommendation_type=rec_type,
                    relevance_score=relevance_score,
                    context=context,
                    reasoning=reasoning,
                    suggested_modifications=suggested_modifications
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to generate {rec_type.value} recommendation: {e}")
            return None
    
    async def _generate_snippet_content(self, patterns: List[KnowledgePattern], 
                                      target_language: str, include_metadata: bool) -> str:
        """Generate reusable snippet content from patterns"""
        try:
            snippet_parts = []
            
            # Add header
            snippet_parts.append(f"# Reusable War Room Snippet - {target_language.title()}")
            snippet_parts.append(f"# Generated from {len(patterns)} patterns")
            snippet_parts.append(f"# Generated at: {datetime.utcnow().isoformat()}")
            snippet_parts.append("")
            
            # Add pattern descriptions
            if include_metadata:
                snippet_parts.append("# Source Patterns:")
                for i, pattern in enumerate(patterns, 1):
                    snippet_parts.append(f"# {i}. {pattern.name} (from {pattern.source_agent})")
                    snippet_parts.append(f"#    Category: {pattern.category.value}")
                    snippet_parts.append(f"#    Confidence: {pattern.confidence_score:.2f}")
                snippet_parts.append("")
            
            # Extract and combine code from patterns
            combined_code = []
            for pattern in patterns:
                # Extract code blocks from pattern content
                code_blocks = re.findall(r'```(?:\w+)?\n(.*?)```', pattern.content, re.DOTALL)
                for code_block in code_blocks:
                    if code_block.strip():
                        combined_code.append(code_block.strip())
            
            # Add combined code
            if combined_code:
                snippet_parts.append("# Combined Implementation:")
                snippet_parts.append("")
                for i, code in enumerate(combined_code):
                    if i > 0:
                        snippet_parts.append("")
                        snippet_parts.append(f"# --- From Pattern {i+1} ---")
                        snippet_parts.append("")
                    snippet_parts.append(code)
            
            # Add usage notes
            snippet_parts.append("")
            snippet_parts.append("# Usage Notes:")
            snippet_parts.append("# - Review and adapt the code for your specific use case")
            snippet_parts.append("# - Test thoroughly before production use")
            snippet_parts.append("# - Consider the source pattern contexts and limitations")
            
            return "\n".join(snippet_parts)
            
        except Exception as e:
            logger.error(f"Snippet content generation failed: {e}")
            return f"# Error generating snippet: {str(e)}"
    
    # Pattern matching methods
    
    def _match_security_pattern(self, content: str) -> bool:
        """Match security-related patterns"""
        security_keywords = [
            'security', 'vulnerability', 'cve', 'authentication', 'authorization',
            'encryption', 'sanitize', 'validate', 'csrf', 'xss', 'injection'
        ]
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in security_keywords)
    
    def _match_performance_pattern(self, content: str) -> bool:
        """Match performance-related patterns"""
        performance_keywords = [
            'performance', 'optimization', 'cache', 'memory', 'cpu', 'latency',
            'throughput', 'scalability', 'benchmark', 'profiling'
        ]
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in performance_keywords)
    
    def _match_refactoring_pattern(self, content: str) -> bool:
        """Match refactoring-related patterns"""
        refactoring_keywords = [
            'refactor', 'restructure', 'cleanup', 'maintainability',
            'readability', 'code quality', 'technical debt'
        ]
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in refactoring_keywords)
    
    def _match_bug_fix_pattern(self, content: str) -> bool:
        """Match bug fix patterns"""
        bug_keywords = [
            'bug', 'fix', 'error', 'issue', 'problem', 'defect',
            'crash', 'exception', 'failure'
        ]
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in bug_keywords)
    
    def _match_optimization_pattern(self, content: str) -> bool:
        """Match optimization patterns"""
        optimization_keywords = [
            'optimize', 'improvement', 'enhance', 'speed up',
            'reduce', 'minimize', 'efficient'
        ]
        content_lower = content.lower()
        return any(keyword in content_lower for keyword in optimization_keywords)
    
    # Analysis methods
    
    async def _analyze_usage_trends(self, patterns: List[KnowledgePattern], time_period: str) -> KnowledgeInsight:
        """Analyze usage trends in patterns"""
        try:
            total_usage = sum(p.usage_frequency for p in patterns)
            avg_usage = total_usage / len(patterns) if patterns else 0
            
            # Calculate trend direction
            recent_patterns = [p for p in patterns if (datetime.utcnow() - p.created_at).days <= 7]
            recent_usage = sum(p.usage_frequency for p in recent_patterns)
            
            trend_direction = "increasing" if recent_usage > avg_usage else "decreasing"
            
            return KnowledgeInsight(
                insight_type="usage_trends",
                title=f"Pattern Usage Trends - {time_period}",
                description=f"Usage trends show {trend_direction} pattern adoption with {total_usage} total uses",
                patterns_analyzed=len(patterns),
                confidence=0.8,
                actionable_items=[
                    f"Monitor {trend_direction} usage trend",
                    "Identify most/least used pattern types",
                    "Investigate usage patterns for optimization"
                ],
                trend_data={
                    "total_usage": total_usage,
                    "average_usage": avg_usage,
                    "trend_direction": trend_direction,
                    "recent_activity": recent_usage
                }
            )
            
        except Exception as e:
            logger.error(f"Usage trend analysis failed: {e}")
            return KnowledgeInsight(
                insight_type="usage_trends",
                title="Usage Trend Analysis Failed",
                description=f"Failed to analyze usage trends: {str(e)}",
                patterns_analyzed=0,
                confidence=0.0,
                actionable_items=["Review analysis methodology"],
                trend_data={}
            )
    
    async def _analyze_success_rates(self, patterns: List[KnowledgePattern]) -> KnowledgeInsight:
        """Analyze success rates across patterns"""
        try:
            patterns_with_usage = [p for p in patterns if (p.success_count + p.failure_count) > 0]
            
            if not patterns_with_usage:
                return KnowledgeInsight(
                    insight_type="success_rates",
                    title="Success Rate Analysis",
                    description="No patterns with usage data found",
                    patterns_analyzed=0,
                    confidence=0.0,
                    actionable_items=["Gather more usage feedback"],
                    trend_data={}
                )
            
            success_rates = []
            for pattern in patterns_with_usage:
                total_usage = pattern.success_count + pattern.failure_count
                success_rate = pattern.success_count / total_usage if total_usage > 0 else 0
                success_rates.append(success_rate)
            
            avg_success_rate = sum(success_rates) / len(success_rates)
            high_performers = len([r for r in success_rates if r > 0.8])
            
            return KnowledgeInsight(
                insight_type="success_rates",
                title="Pattern Success Rate Analysis",
                description=f"Average success rate: {avg_success_rate:.2f}, {high_performers} high-performing patterns",
                patterns_analyzed=len(patterns_with_usage),
                confidence=avg_success_rate,
                actionable_items=[
                    "Review low-performing patterns",
                    "Identify success factors in high-performing patterns",
                    "Improve feedback collection"
                ],
                trend_data={
                    "average_success_rate": avg_success_rate,
                    "high_performers": high_performers,
                    "patterns_with_data": len(patterns_with_usage)
                }
            )
            
        except Exception as e:
            logger.error(f"Success rate analysis failed: {e}")
            return KnowledgeInsight(
                insight_type="success_rates",
                title="Success Rate Analysis Failed",
                description=f"Failed to analyze success rates: {str(e)}",
                patterns_analyzed=0,
                confidence=0.0,
                actionable_items=["Review analysis methodology"],
                trend_data={}
            )
    
    async def _analyze_category_distribution(self, patterns: List[KnowledgePattern]) -> KnowledgeInsight:
        """Analyze category distribution"""
        try:
            category_counts = Counter(p.category.value for p in patterns)
            total_patterns = len(patterns)
            
            if total_patterns == 0:
                return KnowledgeInsight(
                    insight_type="category_distribution",
                    title="Category Distribution Analysis",
                    description="No patterns to analyze",
                    patterns_analyzed=0,
                    confidence=0.0,
                    actionable_items=["Add more patterns"],
                    trend_data={}
                )
            
            most_common = category_counts.most_common(3)
            distribution_data = {cat: count/total_patterns for cat, count in category_counts.items()}
            
            return KnowledgeInsight(
                insight_type="category_distribution",
                title="Pattern Category Distribution",
                description=f"Most common categories: {', '.join([f'{cat} ({count})' for cat, count in most_common])}",
                patterns_analyzed=total_patterns,
                confidence=0.9,
                actionable_items=[
                    "Focus on underrepresented categories",
                    "Balance category distribution",
                    "Identify category-specific improvement opportunities"
                ],
                trend_data={
                    "distribution": distribution_data,
                    "most_common": dict(most_common),
                    "total_categories": len(category_counts)
                }
            )
            
        except Exception as e:
            logger.error(f"Category distribution analysis failed: {e}")
            return KnowledgeInsight(
                insight_type="category_distribution",
                title="Category Distribution Analysis Failed",
                description=f"Failed to analyze category distribution: {str(e)}",
                patterns_analyzed=0,
                confidence=0.0,
                actionable_items=["Review analysis methodology"],
                trend_data={}
            )
    
    async def _analyze_language_trends(self, patterns: List[KnowledgePattern]) -> KnowledgeInsight:
        """Analyze programming language trends"""
        try:
            language_counts = Counter(p.language for p in patterns if p.language)
            total_with_language = sum(language_counts.values())
            
            if total_with_language == 0:
                return KnowledgeInsight(
                    insight_type="language_trends",
                    title="Programming Language Trends",
                    description="No language data available",
                    patterns_analyzed=0,
                    confidence=0.0,
                    actionable_items=["Improve language detection"],
                    trend_data={}
                )
            
            most_common = language_counts.most_common(5)
            language_distribution = {lang: count/total_with_language for lang, count in language_counts.items()}
            
            return KnowledgeInsight(
                insight_type="language_trends",
                title="Programming Language Trends",
                description=f"Top languages: {', '.join([f'{lang} ({count})' for lang, count in most_common])}",
                patterns_analyzed=total_with_language,
                confidence=0.8,
                actionable_items=[
                    "Ensure coverage across all project languages",
                    "Focus on language-specific patterns",
                    "Consider polyglot solutions"
                ],
                trend_data={
                    "distribution": language_distribution,
                    "most_common": dict(most_common),
                    "total_languages": len(language_counts)
                }
            )
            
        except Exception as e:
            logger.error(f"Language trend analysis failed: {e}")
            return KnowledgeInsight(
                insight_type="language_trends",
                title="Language Trend Analysis Failed",
                description=f"Failed to analyze language trends: {str(e)}",
                patterns_analyzed=0,
                confidence=0.0,
                actionable_items=["Review analysis methodology"],
                trend_data={}
            )
    
    async def _generate_trend_predictions(self, patterns: List[KnowledgePattern], time_period: str) -> List[Dict[str, Any]]:
        """Generate trend predictions based on current data"""
        try:
            predictions = []
            
            # Usage prediction
            total_usage = sum(p.usage_frequency for p in patterns)
            if total_usage > 0:
                predictions.append({
                    "type": "usage_growth",
                    "description": f"Expected {int(total_usage * 1.2)} pattern uses in next {time_period}",
                    "confidence": 0.6,
                    "basis": "Current usage trends"
                })
            
            # Category growth prediction
            category_counts = Counter(p.category.value for p in patterns)
            if category_counts:
                fastest_growing = category_counts.most_common(1)[0][0]
                predictions.append({
                    "type": "category_growth",
                    "description": f"{fastest_growing} category likely to see continued growth",
                    "confidence": 0.7,
                    "basis": "Current category distribution"
                })
            
            # Quality prediction
            avg_confidence = sum(p.confidence_score for p in patterns) / len(patterns) if patterns else 0
            if avg_confidence > 0:
                predictions.append({
                    "type": "quality_improvement",
                    "description": f"Pattern quality expected to {'improve' if avg_confidence > 0.6 else 'require attention'}",
                    "confidence": avg_confidence,
                    "basis": "Current success rates"
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Trend prediction failed: {e}")
            return []
    
    # Pieces integration methods
    
    async def _store_pattern_in_pieces(self, pattern: KnowledgePattern) -> Dict[str, Any]:
        """Store pattern in Pieces platform"""
        try:
            async with self.pieces_integration:
                # Convert to Pieces pattern format
                pieces_pattern = PiecesPattern(
                    id=pattern.id,
                    name=pattern.name,
                    description=pattern.description,
                    content=pattern.content,
                    category=PatternCategory.CODERABBIT_FIXES,  # Map to closest category
                    asset_type=PiecesAssetType.FIX_PATTERN,
                    language=pattern.language,
                    tags=pattern.tags,
                    metadata=pattern.metadata,
                    success_count=pattern.success_count,
                    failure_count=pattern.failure_count,
                    confidence_score=pattern.confidence_score
                )
                
                return await self.pieces_integration._store_pattern_to_pieces(pieces_pattern)
                
        except Exception as e:
            logger.error(f"Failed to store pattern in Pieces: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _update_pattern_in_pieces(self, pattern: KnowledgePattern) -> Dict[str, Any]:
        """Update pattern in Pieces platform"""
        try:
            # Update would be handled by pieces integration
            logger.info(f"Pattern {pattern.id} would be updated in Pieces")
            return {"status": "success", "message": "Update queued"}
            
        except Exception as e:
            logger.error(f"Failed to update pattern in Pieces: {e}")
            return {"status": "error", "error": str(e)}
    
    # Inter-agent communication methods
    
    def _create_agent_listener(self, agent_name: str, auto_capture: bool) -> callable:
        """Create a listener for patterns from a specific agent"""
        def listener(pattern_data: Dict[str, Any]):
            try:
                if auto_capture:
                    # Auto-capture the pattern
                    asyncio.create_task(self._capture_pattern_from_agent({
                        "source_agent": agent_name,
                        "pattern_data": pattern_data
                    }))
                else:
                    # Just log the detection
                    logger.info(f"Pattern detected from {agent_name}: {pattern_data.get('name', 'Unnamed')}")
            except Exception as e:
                logger.error(f"Agent listener error for {agent_name}: {e}")
        
        return listener
    
    async def _trigger_real_time_analysis(self, pattern: KnowledgePattern):
        """Trigger real-time analysis when a new pattern is added"""
        try:
            # Perform clustering update if enabled
            if self.auto_clustering_enabled and len(self.knowledge_patterns) > 10:
                await self._update_pattern_clusters()
            
            # Check for immediate recommendations
            similar_patterns = await self._find_similar_patterns(
                np.array(pattern.embedding_vector) if pattern.embedding_vector else None,
                pattern.description,
                limit=5
            )
            
            if similar_patterns:
                logger.info(f"Found {len(similar_patterns)} similar patterns to {pattern.id}")
                # Update related patterns
                pattern.related_patterns = [p["pattern_id"] for p in similar_patterns]
            
        except Exception as e:
            logger.error(f"Real-time analysis failed for pattern {pattern.id}: {e}")
    
    async def _update_pattern_clusters(self):
        """Update pattern clustering"""
        try:
            # Get all pattern embeddings
            embeddings = []
            pattern_ids = []
            
            for pattern_id, pattern in self.knowledge_patterns.items():
                if pattern.embedding_vector:
                    embeddings.append(pattern.embedding_vector)
                    pattern_ids.append(pattern_id)
            
            if len(embeddings) < 8:  # Not enough data for clustering
                return
            
            # Perform clustering
            embeddings_array = np.array(embeddings)
            cluster_labels = self.kmeans_clusterer.fit_predict(embeddings_array)
            
            # Update cluster assignments
            clusters = defaultdict(list)
            for pattern_id, cluster_label in zip(pattern_ids, cluster_labels):
                clusters[cluster_label].append(pattern_id)
            
            logger.info(f"Updated pattern clusters: {len(clusters)} clusters created")
            
        except Exception as e:
            logger.error(f"Pattern clustering update failed: {e}")
    
    def get_knowledge_statistics(self) -> Dict[str, Any]:
        """Get comprehensive knowledge base statistics"""
        try:
            return {
                **self.stats,
                "patterns_by_priority": {
                    priority.value: len([p for p in self.knowledge_patterns.values() if p.priority == priority])
                    for priority in PatternPriority
                },
                "patterns_by_source_agent": dict(self.stats["patterns_by_agent"]),
                "average_confidence": sum(p.confidence_score for p in self.knowledge_patterns.values()) / max(len(self.knowledge_patterns), 1),
                "patterns_with_embeddings": len([p for p in self.knowledge_patterns.values() if p.embedding_vector]),
                "active_listeners": len(self.agent_listeners),
                "cached_insights": len(self.insights_cache),
                "total_reports": len(self.weekly_reports),
                "last_analysis": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to generate knowledge statistics: {e}")
            return {"error": str(e)}

# Export the main class
__all__ = ['PiecesKnowledgeManager']