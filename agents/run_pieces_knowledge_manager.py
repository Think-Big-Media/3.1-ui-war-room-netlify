#!/usr/bin/env python3
"""
Main Runner Script for SUB-AGENT 4: Pieces Knowledge Manager

This script orchestrates the complete Pieces Knowledge Manager system,
integrating all components for comprehensive knowledge management.

Usage:
    python run_pieces_knowledge_manager.py [options]

Options:
    --config-file PATH          Path to configuration file
    --pieces-api-key KEY        Pieces API key
    --hub-port PORT             Communication hub port (default: 8765)
    --mode MODE                 Run mode: standalone, hub, client (default: standalone)
    --log-level LEVEL          Logging level (default: INFO)
    --output-dir PATH          Output directory for reports and snippets
    --enable-reporting         Enable automated reporting (default: False)
    --enable-communication     Enable inter-agent communication (default: False)
    --demo                     Run in demonstration mode
"""

import asyncio
import argparse
import json
import logging
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

# Import all knowledge manager components
from pieces_knowledge_manager import (
    PiecesKnowledgeManager, KnowledgeCategory, PatternPriority
)
from agent_communication_protocol import (
    AgentCommunicationHub, AgentCommunicationClient, MessageType, AgentRole
)
from automated_reporting_system import (
    AutomatedReportingSystem, ReportConfiguration
)
from pattern_recommendation_engine import (
    AdvancedPatternRecommendationEngine, RecommendationContext, RecommendationStrategy
)
from reusable_snippet_generator import (
    ReusableSnippetGenerator, SnippetType, LanguageSupport
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('pieces_knowledge_manager.log')
    ]
)
logger = logging.getLogger(__name__)

class PiecesKnowledgeManagerRunner:
    """Main orchestrator for the Pieces Knowledge Manager system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.running = False
        
        # Core components
        self.knowledge_manager: Optional[PiecesKnowledgeManager] = None
        self.communication_hub: Optional[AgentCommunicationHub] = None
        self.communication_client: Optional[AgentCommunicationClient] = None
        self.reporting_system: Optional[AutomatedReportingSystem] = None
        self.recommendation_engine: Optional[AdvancedPatternRecommendationEngine] = None
        self.snippet_generator: Optional[ReusableSnippetGenerator] = None
        
        # Background tasks
        self.background_tasks = []
        
        # Statistics
        self.start_time = None
        self.stats = {
            "patterns_processed": 0,
            "recommendations_generated": 0,
            "snippets_created": 0,
            "reports_generated": 0,
            "messages_handled": 0,
            "uptime_seconds": 0
        }
    
    async def initialize_system(self):
        """Initialize all system components"""
        try:
            logger.info("Initializing Pieces Knowledge Manager System...")
            
            # Initialize knowledge manager
            await self._initialize_knowledge_manager()
            
            # Initialize communication system
            if self.config.get("enable_communication", False):
                await self._initialize_communication_system()
            
            # Initialize reporting system
            if self.config.get("enable_reporting", False):
                await self._initialize_reporting_system()
            
            # Initialize recommendation engine
            await self._initialize_recommendation_engine()
            
            # Initialize snippet generator
            await self._initialize_snippet_generator()
            
            # Setup message handlers
            if self.communication_client:
                await self._setup_message_handlers()
            
            logger.info("System initialization completed successfully")
            
        except Exception as e:
            logger.error(f"System initialization failed: {e}")
            raise
    
    async def _initialize_knowledge_manager(self):
        """Initialize the core knowledge manager"""
        try:
            pieces_api_key = self.config.get("pieces_api_key")
            pieces_base_url = self.config.get("pieces_base_url", "https://api.pieces.app")
            
            self.knowledge_manager = PiecesKnowledgeManager(
                pieces_api_key=pieces_api_key,
                pieces_base_url=pieces_base_url
            )
            
            logger.info("Knowledge manager initialized")
            
        except Exception as e:
            logger.error(f"Knowledge manager initialization failed: {e}")
            raise
    
    async def _initialize_communication_system(self):
        """Initialize inter-agent communication system"""
        try:
            mode = self.config.get("mode", "standalone")
            hub_port = self.config.get("hub_port", 8765)
            
            if mode in ["standalone", "hub"]:
                # Start communication hub
                self.communication_hub = AgentCommunicationHub(hub_port)
                await self.communication_hub.start_hub()
                logger.info(f"Communication hub started on port {hub_port}")
            
            if mode in ["standalone", "client"]:
                # Start communication client
                self.communication_client = AgentCommunicationClient(
                    agent_id="PiecesKnowledgeManager",
                    agent_role=AgentRole.KNOWLEDGE_MANAGER,
                    hub_url=f"ws://localhost:{hub_port}"
                )
                
                capabilities = [
                    "pattern_storage", "pattern_search", "pattern_recommendations",
                    "snippet_generation", "knowledge_analysis", "reporting"
                ]
                
                metadata = {
                    "version": "1.0",
                    "specialization": "Knowledge capture, organization, and pattern analysis",
                    "supported_languages": [lang.value for lang in LanguageSupport]
                }
                
                connected = await self.communication_client.connect(capabilities, metadata)
                if connected:
                    logger.info("Communication client connected successfully")
                else:
                    logger.warning("Failed to connect communication client")
            
        except Exception as e:
            logger.error(f"Communication system initialization failed: {e}")
            # Don't raise - communication is optional
    
    async def _initialize_reporting_system(self):
        """Initialize automated reporting system"""
        try:
            output_dir = self.config.get("output_dir", "reports")
            
            self.reporting_system = AutomatedReportingSystem(
                self.knowledge_manager,
                output_dir=output_dir
            )
            
            # Configure email if provided
            email_config = self.config.get("email_config", {})
            if email_config:
                self.reporting_system.configure_email(
                    smtp_host=email_config.get("smtp_host"),
                    smtp_port=email_config.get("smtp_port", 587),
                    username=email_config.get("username"),
                    password=email_config.get("password"),
                    use_tls=email_config.get("use_tls", True),
                    sender=email_config.get("sender")
                )
            
            # Start scheduled reporting if enabled
            if self.config.get("enable_scheduled_reports", False):
                await self.reporting_system.start_scheduled_reporting()
            
            logger.info("Reporting system initialized")
            
        except Exception as e:
            logger.error(f"Reporting system initialization failed: {e}")
            # Don't raise - reporting is optional
    
    async def _initialize_recommendation_engine(self):
        """Initialize pattern recommendation engine"""
        try:
            self.recommendation_engine = AdvancedPatternRecommendationEngine(
                self.knowledge_manager
            )
            
            logger.info("Recommendation engine initialized")
            
        except Exception as e:
            logger.error(f"Recommendation engine initialization failed: {e}")
            raise
    
    async def _initialize_snippet_generator(self):
        """Initialize reusable snippet generator"""
        try:
            output_dir = Path(self.config.get("output_dir", "generated_snippets"))
            
            self.snippet_generator = ReusableSnippetGenerator(
                self.knowledge_manager,
                output_dir=str(output_dir / "snippets")
            )
            
            logger.info("Snippet generator initialized")
            
        except Exception as e:
            logger.error(f"Snippet generator initialization failed: {e}")
            raise
    
    async def _setup_message_handlers(self):
        """Setup message handlers for inter-agent communication"""
        try:
            # Pattern sharing handler
            self.communication_client.register_message_handler(
                MessageType.PATTERN_SHARE,
                self._handle_pattern_share
            )
            
            # Recommendation request handler
            self.communication_client.register_message_handler(
                MessageType.RECOMMENDATION_REQUEST,
                self._handle_recommendation_request
            )
            
            # Knowledge query handler
            self.communication_client.register_message_handler(
                MessageType.KNOWLEDGE_QUERY,
                self._handle_knowledge_query
            )
            
            # Pattern feedback handler
            self.communication_client.register_message_handler(
                MessageType.PATTERN_FEEDBACK,
                self._handle_pattern_feedback
            )
            
            logger.info("Message handlers registered")
            
        except Exception as e:
            logger.error(f"Message handler setup failed: {e}")
    
    async def run_system(self):
        """Run the main system loop"""
        try:
            self.running = True
            self.start_time = datetime.utcnow()
            
            logger.info("Starting Pieces Knowledge Manager System")
            
            # Start background tasks
            await self._start_background_tasks()
            
            # Main loop
            while self.running:
                try:
                    # Update statistics
                    if self.start_time:
                        self.stats["uptime_seconds"] = int((datetime.utcnow() - self.start_time).total_seconds())
                    
                    # Periodic maintenance tasks
                    await self._run_maintenance_tasks()
                    
                    # Wait before next iteration
                    await asyncio.sleep(10)
                    
                except KeyboardInterrupt:
                    logger.info("Received interrupt signal")
                    break
                except Exception as e:
                    logger.error(f"Main loop error: {e}")
                    await asyncio.sleep(5)
            
        except Exception as e:
            logger.error(f"System run error: {e}")
        finally:
            await self.shutdown_system()
    
    async def _start_background_tasks(self):
        """Start background processing tasks"""
        try:
            # Start pattern analysis task
            analysis_task = asyncio.create_task(self._pattern_analysis_task())
            self.background_tasks.append(analysis_task)
            
            # Start health monitoring task
            health_task = asyncio.create_task(self._health_monitoring_task())
            self.background_tasks.append(health_task)
            
            # Start statistics collection task
            stats_task = asyncio.create_task(self._statistics_collection_task())
            self.background_tasks.append(stats_task)
            
            logger.info(f"Started {len(self.background_tasks)} background tasks")
            
        except Exception as e:
            logger.error(f"Background task startup failed: {e}")
    
    async def _run_maintenance_tasks(self):
        """Run periodic maintenance tasks"""
        try:
            # Update knowledge base statistics
            self.stats["patterns_processed"] = len(self.knowledge_manager.knowledge_patterns)
            
            # Update recommendation engine statistics
            if self.recommendation_engine:
                rec_stats = self.recommendation_engine.get_recommendation_statistics()
                self.stats["recommendations_generated"] = rec_stats.get("recommendations_generated", 0)
            
            # Update snippet generator statistics
            if self.snippet_generator:
                gen_stats = self.snippet_generator.get_generator_statistics()
                self.stats["snippets_created"] = gen_stats.get("snippets_generated", 0)
            
            # Update reporting statistics
            if self.reporting_system:
                rep_stats = self.reporting_system.get_reporting_statistics()
                self.stats["reports_generated"] = rep_stats.get("reports_generated", 0)
            
        except Exception as e:
            logger.error(f"Maintenance task error: {e}")
    
    async def _pattern_analysis_task(self):
        """Background task for pattern analysis"""
        while self.running:
            try:
                # Analyze patterns for trends and insights
                patterns = list(self.knowledge_manager.knowledge_patterns.values())
                if len(patterns) > 10:
                    # Analyze recent patterns
                    recent_patterns = patterns[-10:]  # Last 10 patterns
                    
                    # Generate insights
                    logger.debug(f"Analyzing {len(recent_patterns)} recent patterns")
                
                await asyncio.sleep(300)  # Run every 5 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Pattern analysis task error: {e}")
                await asyncio.sleep(60)
    
    async def _health_monitoring_task(self):
        """Background task for health monitoring"""
        while self.running:
            try:
                # Check system health
                health_status = {
                    "knowledge_manager": bool(self.knowledge_manager),
                    "recommendation_engine": bool(self.recommendation_engine),
                    "snippet_generator": bool(self.snippet_generator),
                    "reporting_system": bool(self.reporting_system),
                    "communication_client": bool(self.communication_client and self.communication_client.is_connected)
                }
                
                # Log health status
                healthy_components = sum(health_status.values())
                total_components = len(health_status)
                
                logger.debug(f"System health: {healthy_components}/{total_components} components healthy")
                
                # Send health check if communication is enabled
                if self.communication_client and self.communication_client.is_connected:
                    await self.communication_client.send_message(
                        None,  # Broadcast
                        MessageType.HEALTH_CHECK,
                        {"health_status": health_status, "uptime": self.stats["uptime_seconds"]},
                        priority=MessageType.HEALTH_CHECK
                    )
                
                await asyncio.sleep(60)  # Run every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health monitoring task error: {e}")
                await asyncio.sleep(60)
    
    async def _statistics_collection_task(self):
        """Background task for statistics collection"""
        while self.running:
            try:
                # Log comprehensive statistics
                all_stats = {
                    "system": self.stats,
                    "knowledge_manager": self.knowledge_manager.get_knowledge_statistics() if self.knowledge_manager else {},
                    "recommendation_engine": self.recommendation_engine.get_recommendation_statistics() if self.recommendation_engine else {},
                    "snippet_generator": self.snippet_generator.get_generator_statistics() if self.snippet_generator else {},
                    "reporting_system": self.reporting_system.get_reporting_statistics() if self.reporting_system else {}
                }
                
                logger.info(f"System Statistics - Patterns: {self.stats['patterns_processed']}, "
                          f"Recommendations: {self.stats['recommendations_generated']}, "
                          f"Snippets: {self.stats['snippets_created']}, "
                          f"Reports: {self.stats['reports_generated']}")
                
                await asyncio.sleep(600)  # Run every 10 minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Statistics collection task error: {e}")
                await asyncio.sleep(300)
    
    # Message handlers for inter-agent communication
    
    async def _handle_pattern_share(self, message):
        """Handle pattern sharing from other agents"""
        try:
            payload = message.payload
            
            # Extract pattern data
            pattern_data = {
                "id": payload.get("pattern_id"),
                "name": payload.get("pattern_name"),
                "description": payload.get("pattern_description"),
                "content": payload.get("pattern_content"),
                "category": payload.get("category", "war-room-solutions"),
                "language": payload.get("language"),
                "tags": payload.get("tags", []),
                "metadata": payload.get("metadata", {}),
                "confidence_score": payload.get("confidence_score", 0.5)
            }
            
            # Capture the pattern
            result = await self.knowledge_manager._capture_pattern_from_agent({
                "source_agent": message.sender_id,
                "pattern_data": pattern_data
            })
            
            if result.get("status") == "success":
                self.stats["patterns_processed"] += 1
                logger.info(f"Successfully captured pattern from {message.sender_id}: {pattern_data['name']}")
                
                # Send acknowledgment
                if self.communication_client:
                    await self.communication_client.send_message(
                        message.sender_id,
                        MessageType.PATTERN_FEEDBACK,
                        {"pattern_id": pattern_data["id"], "success": True, "message": "Pattern captured successfully"},
                        correlation_id=message.id
                    )
            else:
                logger.warning(f"Failed to capture pattern from {message.sender_id}: {result.get('error')}")
            
            self.stats["messages_handled"] += 1
            
        except Exception as e:
            logger.error(f"Pattern share handling error: {e}")
    
    async def _handle_recommendation_request(self, message):
        """Handle recommendation requests from other agents"""
        try:
            payload = message.payload
            
            # Create recommendation context
            context = RecommendationContext(
                problem_description=payload.get("problem_description", ""),
                current_code_context=payload.get("context", ""),
                programming_language=payload.get("language_preference"),
                urgency_level=payload.get("urgency_level", "medium"),
                preferred_categories=payload.get("preferred_categories", []),
                agent_history=[message.sender_id]
            )
            
            # Generate recommendations
            recommendations = await self.recommendation_engine.generate_recommendations(
                context=context,
                strategy=RecommendationStrategy.HYBRID,
                max_results=payload.get("limit", 10)
            )
            
            # Send recommendations back
            if self.communication_client:
                recommendation_data = []
                for rec in recommendations:
                    rec_dict = {
                        "pattern_id": rec.pattern_id,
                        "pattern_name": rec.pattern_name,
                        "relevance_score": rec.relevance_score,
                        "confidence_level": rec.confidence_level.value,
                        "reasoning": rec.reasoning,
                        "implementation_difficulty": rec.implementation_difficulty,
                        "estimated_time": rec.estimated_time
                    }
                    recommendation_data.append(rec_dict)
                
                await self.communication_client.send_message(
                    message.sender_id,
                    MessageType.RECOMMENDATION_REQUEST,
                    {
                        "recommendations": recommendation_data,
                        "total_count": len(recommendations),
                        "context_analyzed": True
                    },
                    correlation_id=message.id
                )
            
            self.stats["recommendations_generated"] += len(recommendations)
            self.stats["messages_handled"] += 1
            
            logger.info(f"Generated {len(recommendations)} recommendations for {message.sender_id}")
            
        except Exception as e:
            logger.error(f"Recommendation request handling error: {e}")
    
    async def _handle_knowledge_query(self, message):
        """Handle knowledge base queries"""
        try:
            payload = message.payload
            
            # Perform knowledge search
            search_result = await self.knowledge_manager._search_knowledge_base({
                "query": payload.get("query", ""),
                "categories": payload.get("categories", []),
                "limit": payload.get("limit", 10),
                "include_embeddings": False
            })
            
            # Send results back
            if self.communication_client:
                await self.communication_client.send_message(
                    message.sender_id,
                    MessageType.KNOWLEDGE_QUERY,
                    search_result,
                    correlation_id=message.id
                )
            
            self.stats["messages_handled"] += 1
            
            logger.info(f"Processed knowledge query from {message.sender_id}")
            
        except Exception as e:
            logger.error(f"Knowledge query handling error: {e}")
    
    async def _handle_pattern_feedback(self, message):
        """Handle pattern effectiveness feedback"""
        try:
            payload = message.payload
            
            # Update pattern feedback
            result = await self.knowledge_manager._update_knowledge_from_feedback({
                "pattern_id": payload.get("pattern_id"),
                "feedback_type": "success" if payload.get("success") else "failure",
                "details": payload.get("feedback_details", ""),
                "source_agent": message.sender_id
            })
            
            # Update recommendation engine feedback
            if self.recommendation_engine:
                await self.recommendation_engine.update_recommendation_feedback(
                    payload.get("pattern_id"),
                    payload.get("success", False),
                    payload.get("feedback_details")
                )
            
            self.stats["messages_handled"] += 1
            
            logger.info(f"Processed feedback from {message.sender_id} for pattern {payload.get('pattern_id')}")
            
        except Exception as e:
            logger.error(f"Pattern feedback handling error: {e}")
    
    async def shutdown_system(self):
        """Gracefully shutdown the system"""
        try:
            logger.info("Shutting down Pieces Knowledge Manager System...")
            self.running = False
            
            # Cancel background tasks
            for task in self.background_tasks:
                task.cancel()
            
            # Wait for tasks to complete
            if self.background_tasks:
                await asyncio.gather(*self.background_tasks, return_exceptions=True)
            
            # Shutdown components
            if self.reporting_system:
                await self.reporting_system.stop_scheduled_reporting()
            
            if self.communication_client:
                await self.communication_client.disconnect()
            
            if self.communication_hub:
                await self.communication_hub.stop_hub()
            
            # Final statistics
            final_stats = {
                "total_runtime_seconds": self.stats["uptime_seconds"],
                "patterns_processed": self.stats["patterns_processed"],
                "recommendations_generated": self.stats["recommendations_generated"],
                "snippets_created": self.stats["snippets_created"],
                "reports_generated": self.stats["reports_generated"],
                "messages_handled": self.stats["messages_handled"]
            }
            
            logger.info(f"System shutdown complete. Final statistics: {final_stats}")
            
        except Exception as e:
            logger.error(f"Shutdown error: {e}")
    
    # Demo and testing methods
    
    async def run_demo(self):
        """Run a demonstration of the system capabilities"""
        try:
            logger.info("Starting Pieces Knowledge Manager Demo...")
            
            # Demo pattern creation
            await self._demo_pattern_creation()
            
            # Demo pattern search
            await self._demo_pattern_search()
            
            # Demo recommendations
            await self._demo_recommendations()
            
            # Demo snippet generation
            await self._demo_snippet_generation()
            
            # Demo reporting
            if self.reporting_system:
                await self._demo_reporting()
            
            logger.info("Demo completed successfully!")
            
        except Exception as e:
            logger.error(f"Demo error: {e}")
    
    async def _demo_pattern_creation(self):
        """Demo pattern creation and storage"""
        logger.info("Demo: Creating sample patterns...")
        
        sample_patterns = [
            {
                "id": "demo_security_pattern_1",
                "name": "Input Validation Pattern",
                "description": "Pattern for validating user input to prevent injection attacks",
                "content": '''
def validate_input(user_input: str, max_length: int = 100) -> str:
    """Validate and sanitize user input"""
    if not isinstance(user_input, str):
        raise ValueError("Input must be a string")
    
    # Remove dangerous characters
    sanitized = re.sub(r'[<>"\']', '', user_input)
    
    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()
                ''',
                "category": "security-patterns",
                "language": "python",
                "tags": ["security", "validation", "input-sanitization"],
                "metadata": {"difficulty": "easy", "use_cases": ["web_apps", "apis"]}
            },
            {
                "id": "demo_performance_pattern_1", 
                "name": "Caching Pattern",
                "description": "Simple in-memory caching pattern for performance optimization",
                "content": '''
from functools import wraps
from typing import Dict, Any, Callable

def cache_result(max_size: int = 100):
    """Decorator for caching function results"""
    def decorator(func: Callable) -> Callable:
        cache: Dict[str, Any] = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            key = str(args) + str(sorted(kwargs.items()))
            
            # Return cached result if available
            if key in cache:
                return cache[key]
            
            # Compute and cache result
            result = func(*args, **kwargs)
            
            # Manage cache size
            if len(cache) >= max_size:
                # Remove oldest entry (simple FIFO)
                oldest_key = next(iter(cache))
                del cache[oldest_key]
            
            cache[key] = result
            return result
        
        return wrapper
    return decorator
                ''',
                "category": "performance-patterns",
                "language": "python", 
                "tags": ["performance", "caching", "optimization"],
                "metadata": {"difficulty": "medium", "use_cases": ["apis", "data_processing"]}
            }
        ]
        
        for pattern_data in sample_patterns:
            result = await self.knowledge_manager._capture_pattern_from_agent({
                "source_agent": "DemoAgent",
                "pattern_data": pattern_data
            })
            
            if result.get("status") == "success":
                logger.info(f"Created demo pattern: {pattern_data['name']}")
            else:
                logger.warning(f"Failed to create demo pattern: {result.get('error')}")
    
    async def _demo_pattern_search(self):
        """Demo pattern search capabilities"""
        logger.info("Demo: Searching patterns...")
        
        search_queries = [
            {"query": "security validation", "categories": ["security-patterns"]},
            {"query": "performance caching", "categories": ["performance-patterns"]},
            {"query": "python optimization", "categories": []}
        ]
        
        for query_params in search_queries:
            result = await self.knowledge_manager._search_knowledge_base(query_params)
            
            if result.get("status") == "success":
                results = result.get("results", [])
                logger.info(f"Search '{query_params['query']}' returned {len(results)} results")
                
                for i, res in enumerate(results[:3], 1):  # Show top 3
                    logger.info(f"  {i}. {res.get('name')} (score: {res.get('combined_score', 0):.2f})")
            else:
                logger.warning(f"Search failed: {result.get('error')}")
    
    async def _demo_recommendations(self):
        """Demo recommendation generation"""
        logger.info("Demo: Generating recommendations...")
        
        context = RecommendationContext(
            problem_description="I need to implement secure user input validation for a web API",
            programming_language="python",
            urgency_level="high",
            preferred_categories=["security-patterns"],
            agent_history=["DemoAgent"]
        )
        
        recommendations = await self.recommendation_engine.generate_recommendations(
            context=context,
            strategy=RecommendationStrategy.HYBRID,
            max_results=5
        )
        
        logger.info(f"Generated {len(recommendations)} recommendations")
        for i, rec in enumerate(recommendations, 1):
            logger.info(f"  {i}. {rec.pattern_name} (relevance: {rec.relevance_score:.2f}, "
                       f"confidence: {rec.confidence_level.value})")
    
    async def _demo_snippet_generation(self):
        """Demo snippet generation"""
        logger.info("Demo: Generating code snippets...")
        
        # Get pattern IDs for snippet generation
        pattern_ids = list(self.knowledge_manager.knowledge_patterns.keys())[:2]  # Use first 2 patterns
        
        if pattern_ids:
            snippet = await self.snippet_generator.generate_snippet_from_patterns(
                pattern_ids=pattern_ids,
                target_language=LanguageSupport.PYTHON,
                snippet_type=SnippetType.UTILITY,
                customization={
                    "name": "Demo Security Utilities",
                    "description": "Combined security utilities from demo patterns",
                    "tags": ["demo", "security", "utilities"]
                }
            )
            
            if snippet:
                logger.info(f"Generated snippet: {snippet.metadata.name}")
                logger.info(f"  - Language: {snippet.metadata.language.value}")
                logger.info(f"  - Complexity: {snippet.metadata.complexity.value}")
                logger.info(f"  - Dependencies: {len(snippet.metadata.dependencies)}")
            else:
                logger.warning("Failed to generate demo snippet")
    
    async def _demo_reporting(self):
        """Demo report generation"""
        logger.info("Demo: Generating reports...")
        
        # Generate a demo report
        report = await self.reporting_system.generate_report("weekly_knowledge")
        
        if report:
            logger.info(f"Generated demo report: {report.title}")
            logger.info(f"  - Sections: {len(report.sections)}")
            logger.info(f"  - Time period: {report.time_period['start'].date()} to {report.time_period['end'].date()}")
            
            # Show summary statistics
            for key, value in report.summary.items():
                logger.info(f"  - {key.replace('_', ' ').title()}: {value}")
        else:
            logger.warning("Failed to generate demo report")

def load_config(config_file: Optional[str] = None) -> Dict[str, Any]:
    """Load configuration from file or use defaults"""
    default_config = {
        "pieces_api_key": None,
        "pieces_base_url": "https://api.pieces.app",
        "hub_port": 8765,
        "mode": "standalone",
        "output_dir": "outputs",
        "enable_communication": False,
        "enable_reporting": False,
        "enable_scheduled_reports": False,
        "log_level": "INFO"
    }
    
    if config_file and Path(config_file).exists():
        try:
            with open(config_file, 'r') as f:
                file_config = json.load(f)
            default_config.update(file_config)
            logger.info(f"Loaded configuration from {config_file}")
        except Exception as e:
            logger.warning(f"Failed to load config file: {e}")
    
    return default_config

def setup_logging(log_level: str):
    """Setup logging configuration"""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Update root logger level
    logging.getLogger().setLevel(numeric_level)
    
    # Update specific loggers
    for logger_name in ['pieces_knowledge_manager', 'agent_communication_protocol', 
                        'automated_reporting_system', 'pattern_recommendation_engine',
                        'reusable_snippet_generator']:
        logging.getLogger(logger_name).setLevel(numeric_level)

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Pieces Knowledge Manager - Advanced Knowledge Management System"
    )
    
    parser.add_argument("--config-file", help="Path to configuration file")
    parser.add_argument("--pieces-api-key", help="Pieces API key")
    parser.add_argument("--hub-port", type=int, default=8765, help="Communication hub port")
    parser.add_argument("--mode", choices=["standalone", "hub", "client"], default="standalone", 
                       help="Run mode")
    parser.add_argument("--log-level", choices=["DEBUG", "INFO", "WARNING", "ERROR"], 
                       default="INFO", help="Logging level")
    parser.add_argument("--output-dir", default="outputs", help="Output directory")
    parser.add_argument("--enable-reporting", action="store_true", 
                       help="Enable automated reporting")
    parser.add_argument("--enable-communication", action="store_true", 
                       help="Enable inter-agent communication")
    parser.add_argument("--demo", action="store_true", help="Run in demonstration mode")
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config_file)
    
    # Override config with command line arguments
    if args.pieces_api_key:
        config["pieces_api_key"] = args.pieces_api_key
    config["hub_port"] = args.hub_port
    config["mode"] = args.mode
    config["log_level"] = args.log_level
    config["output_dir"] = args.output_dir
    config["enable_reporting"] = args.enable_reporting
    config["enable_communication"] = args.enable_communication
    
    # Setup logging
    setup_logging(config["log_level"])
    
    # Create output directory
    output_dir = Path(config["output_dir"])
    output_dir.mkdir(exist_ok=True)
    
    # Initialize and run system
    runner = PiecesKnowledgeManagerRunner(config)
    
    try:
        await runner.initialize_system()
        
        if args.demo:
            await runner.run_demo()
        else:
            await runner.run_system()
            
    except KeyboardInterrupt:
        logger.info("Received interrupt signal - shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("System terminated by user")
    except Exception as e:
        logger.error(f"System failed to start: {e}")
        sys.exit(1)