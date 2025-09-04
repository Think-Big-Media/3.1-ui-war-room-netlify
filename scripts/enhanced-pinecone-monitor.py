#!/usr/bin/env python3
"""
Enhanced Pinecone Health Monitoring Script
==========================================

Comprehensive monitoring script for Pinecone vector database with:
- Automated health checks every 30 minutes
- Performance metrics tracking
- Error logging and alerting
- Service degradation detection
- Real-time status monitoring

Usage:
    python3 scripts/enhanced-pinecone-monitor.py [--continuous] [--interval MINUTES]
    python3 scripts/enhanced-pinecone-monitor.py --test-all
    python3 scripts/enhanced-pinecone-monitor.py --status-report

Features:
- Tests Pinecone connectivity and operations
- Monitors response times and performance
- Tracks vector operations and index statistics
- Generates detailed reports
- Sends alerts on service degradation
- Logs all activities for audit trail

Exit Codes:
    0: All checks passed - service healthy
    1: Minor issues detected - service degraded
    2: Major issues detected - service critical
    3: Configuration or setup error
"""

import os
import sys
import asyncio
import argparse
import logging
import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

# Configure logging first
LOG_DIR = Path(__file__).parent.parent / "logs" / "pinecone_monitoring"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Setup logging with both file and console handlers
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(
            LOG_DIR / f"pinecone_monitor_{datetime.now().strftime('%Y%m%d')}.log"
        ),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("pinecone-monitor")

# Import dependencies with error handling
try:
    from pinecone import Pinecone, ServerlessSpec
    from openai import AsyncOpenAI
    PINECONE_AVAILABLE = True
    logger.info("Pinecone SDK imported successfully")
except ImportError as e:
    logger.error(f"Failed to import Pinecone SDK: {e}")
    PINECONE_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    logger.warning("Requests library not available - some features disabled")
    REQUESTS_AVAILABLE = False


@dataclass
class ServiceMetrics:
    """Container for service metrics."""
    timestamp: str
    response_time_ms: float
    operation: str
    success: bool
    error_message: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None


@dataclass
class HealthStatus:
    """Overall health status container."""
    timestamp: str
    overall_status: str  # healthy, degraded, critical
    pinecone_status: str
    openai_status: str
    last_successful_operation: Optional[str]
    error_count_24h: int
    performance_score: float  # 0.0 to 1.0
    recommendations: List[str]
    alerts: List[str]


class EnhancedPineconeMonitor:
    """Enhanced monitoring system for Pinecone vector database."""

    def __init__(self):
        self.pc = None
        self.index = None
        self.openai_client = None
        self.metrics_history: List[ServiceMetrics] = []
        self.alert_history: List[Dict[str, Any]] = []
        
        # Configuration from environment variables
        self.config = {
            'pinecone_api_key': os.getenv('PINECONE_API_KEY', ''),
            'pinecone_environment': os.getenv('PINECONE_ENVIRONMENT', 'us-east-1'),
            'pinecone_index_name': os.getenv('PINECONE_INDEX_NAME', 'warroom-documents'),
            'openai_api_key': os.getenv('OPENAI_API_KEY', ''),
            'openai_embedding_model': os.getenv('OPENAI_MODEL_EMBEDDING', 'text-embedding-ada-002'),
            'api_base_url': os.getenv('API_BASE_URL', 'https://war-room-oa9t.onrender.com/api/v1'),
        }
        
        # Performance thresholds
        self.thresholds = {
            'embedding_generation_ms': 2000,  # 2 seconds
            'vector_search_ms': 1000,         # 1 second
            'vector_upsert_ms': 3000,         # 3 seconds
            'max_error_rate_24h': 0.05,       # 5% error rate
        }

    async def initialize_services(self) -> bool:
        """Initialize Pinecone and OpenAI services."""
        try:
            if not PINECONE_AVAILABLE:
                logger.error("Pinecone SDK not available - cannot initialize")
                return False
                
            if not self.config['pinecone_api_key']:
                logger.error("PINECONE_API_KEY not configured")
                return False
                
            if not self.config['openai_api_key']:
                logger.error("OPENAI_API_KEY not configured")
                return False

            # Initialize Pinecone client
            self.pc = Pinecone(api_key=self.config['pinecone_api_key'])
            
            # Connect to index
            index_name = self.config['pinecone_index_name']
            existing_indexes = [idx["name"] for idx in self.pc.list_indexes()]
            
            if index_name not in existing_indexes:
                logger.warning(f"Index '{index_name}' not found in: {existing_indexes}")
                return False
                
            self.index = self.pc.Index(index_name)
            
            # Initialize OpenAI client
            self.openai_client = AsyncOpenAI(api_key=self.config['openai_api_key'])
            
            logger.info("Services initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Service initialization failed: {e}")
            return False

    async def test_pinecone_connectivity(self) -> ServiceMetrics:
        """Test basic Pinecone connectivity."""
        start_time = time.time()
        
        try:
            # Test index stats retrieval
            stats = self.index.describe_index_stats()
            response_time = (time.time() - start_time) * 1000
            
            return ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=response_time,
                operation="pinecone_connectivity",
                success=True,
                additional_data={
                    "total_vectors": getattr(stats, 'total_vector_count', 0),
                    "dimension": getattr(stats, 'dimension', 'unknown'),
                    "index_fullness": getattr(stats, 'index_fullness', 0.0),
                    "namespaces": len(getattr(stats, 'namespaces', {}))
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=response_time,
                operation="pinecone_connectivity",
                success=False,
                error_message=str(e)
            )

    async def test_embedding_generation(self) -> ServiceMetrics:
        """Test OpenAI embedding generation."""
        start_time = time.time()
        
        try:
            test_text = f"Health check test document at {datetime.utcnow().isoformat()}"
            
            response = await self.openai_client.embeddings.create(
                model=self.config['openai_embedding_model'],
                input=test_text
            )
            
            response_time = (time.time() - start_time) * 1000
            embedding = response.data[0].embedding
            
            return ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=response_time,
                operation="embedding_generation",
                success=True,
                additional_data={
                    "embedding_dimension": len(embedding),
                    "model": self.config['openai_embedding_model'],
                    "text_length": len(test_text)
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=response_time,
                operation="embedding_generation",
                success=False,
                error_message=str(e)
            )

    async def test_vector_operations(self) -> List[ServiceMetrics]:
        """Test vector upsert, search, and delete operations."""
        test_org_id = "health_check_monitor"
        test_doc_id = f"monitor_test_{int(time.time())}"
        metrics = []
        
        # Generate test embedding
        try:
            embedding_result = await self.test_embedding_generation()
            if not embedding_result.success:
                metrics.append(embedding_result)
                return metrics
            
            # Create test vector
            test_embedding = [0.1] * 1536  # Mock embedding for testing
            test_metadata = {
                "document_id": test_doc_id,
                "organization_id": test_org_id,
                "title": "Health Check Test Document",
                "type": "health_check",
                "timestamp": datetime.utcnow().isoformat(),
                "chunk_index": 0,
                "chunk_text": "This is a health check test document for monitoring"
            }
            
            # Test vector upsert
            start_time = time.time()
            try:
                self.index.upsert(
                    vectors=[{
                        "id": f"{test_doc_id}_chunk_0",
                        "values": test_embedding,
                        "metadata": test_metadata
                    }],
                    namespace=f"org_{test_org_id}"
                )
                
                upsert_time = (time.time() - start_time) * 1000
                metrics.append(ServiceMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    response_time_ms=upsert_time,
                    operation="vector_upsert",
                    success=True,
                    additional_data={"vectors_upserted": 1, "namespace": f"org_{test_org_id}"}
                ))
                
                # Wait for indexing
                await asyncio.sleep(3)
                
                # Test vector search  
                start_time = time.time()
                search_results = self.index.query(
                    vector=test_embedding,
                    top_k=5,
                    include_metadata=True,
                    namespace=f"org_{test_org_id}",
                    filter={"document_id": {"$eq": test_doc_id}}
                )
                
                search_time = (time.time() - start_time) * 1000
                metrics.append(ServiceMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    response_time_ms=search_time,
                    operation="vector_search",
                    success=True,
                    additional_data={
                        "results_found": len(search_results.matches),
                        "namespace": f"org_{test_org_id}"
                    }
                ))
                
                # Test vector delete
                start_time = time.time()
                self.index.delete(
                    ids=[f"{test_doc_id}_chunk_0"],
                    namespace=f"org_{test_org_id}"
                )
                
                delete_time = (time.time() - start_time) * 1000
                metrics.append(ServiceMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    response_time_ms=delete_time,
                    operation="vector_delete",
                    success=True,
                    additional_data={"vectors_deleted": 1, "namespace": f"org_{test_org_id}"}
                ))
                
            except Exception as e:
                operation_time = (time.time() - start_time) * 1000
                metrics.append(ServiceMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    response_time_ms=operation_time,
                    operation="vector_operations",
                    success=False,
                    error_message=str(e)
                ))
                
        except Exception as e:
            metrics.append(ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=0,
                operation="vector_operations_setup",
                success=False,
                error_message=str(e)
            ))
        
        return metrics

    async def test_api_health_endpoint(self) -> ServiceMetrics:
        """Test the API health endpoint for search services."""
        if not REQUESTS_AVAILABLE:
            return ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=0,
                operation="api_health_endpoint",
                success=False,
                error_message="Requests library not available"
            )
        
        start_time = time.time()
        
        try:
            health_url = f"{self.config['api_base_url']}/documents/search/health"
            response = requests.get(health_url, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                health_data = response.json()
                return ServiceMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    response_time_ms=response_time,
                    operation="api_health_endpoint",
                    success=True,
                    additional_data={
                        "status_code": response.status_code,
                        "health_status": health_data.get("status", "unknown"),
                        "services": health_data.get("services", {}),
                        "capabilities": health_data.get("capabilities", {})
                    }
                )
            else:
                return ServiceMetrics(
                    timestamp=datetime.utcnow().isoformat(),
                    response_time_ms=response_time,
                    operation="api_health_endpoint",
                    success=False,
                    error_message=f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return ServiceMetrics(
                timestamp=datetime.utcnow().isoformat(),
                response_time_ms=response_time,
                operation="api_health_endpoint",
                success=False,
                error_message=str(e)
            )

    async def run_comprehensive_health_check(self) -> HealthStatus:
        """Run all health checks and generate status report."""
        logger.info("Starting comprehensive health check...")
        
        all_metrics = []
        alerts = []
        recommendations = []
        
        # Initialize services
        services_initialized = await self.initialize_services()
        if not services_initialized:
            return HealthStatus(
                timestamp=datetime.utcnow().isoformat(),
                overall_status="critical",
                pinecone_status="unavailable",
                openai_status="unavailable", 
                last_successful_operation=None,
                error_count_24h=0,
                performance_score=0.0,
                recommendations=["Check API keys and service configuration"],
                alerts=["Service initialization failed - system unavailable"]
            )
        
        # Test Pinecone connectivity
        connectivity_result = await self.test_pinecone_connectivity()
        all_metrics.append(connectivity_result)
        
        # Test embedding generation
        embedding_result = await self.test_embedding_generation()
        all_metrics.append(embedding_result) 
        
        # Test vector operations
        vector_metrics = await self.test_vector_operations()
        all_metrics.extend(vector_metrics)
        
        # Test API endpoint
        api_result = await self.test_api_health_endpoint()
        all_metrics.append(api_result)
        
        # Store metrics
        self.metrics_history.extend(all_metrics)
        
        # Analyze results
        successful_operations = [m for m in all_metrics if m.success]
        failed_operations = [m for m in all_metrics if not m.success]
        
        # Calculate performance scores
        performance_scores = []
        
        for metric in successful_operations:
            if metric.operation == "embedding_generation":
                score = max(0, 1 - (metric.response_time_ms / self.thresholds['embedding_generation_ms']))
            elif metric.operation == "vector_search":
                score = max(0, 1 - (metric.response_time_ms / self.thresholds['vector_search_ms']))
            elif metric.operation == "vector_upsert":
                score = max(0, 1 - (metric.response_time_ms / self.thresholds['vector_upsert_ms']))
            else:
                score = 1.0 if metric.success else 0.0
            performance_scores.append(score)
        
        avg_performance = sum(performance_scores) / len(performance_scores) if performance_scores else 0.0
        
        # Determine status
        if not failed_operations:
            overall_status = "healthy"
            pinecone_status = "operational"
            openai_status = "operational"
        elif len(failed_operations) <= len(all_metrics) * 0.3:  # Less than 30% failures
            overall_status = "degraded"
            pinecone_status = "degraded" if any(m.operation.startswith("vector") for m in failed_operations) else "operational"
            openai_status = "degraded" if any(m.operation == "embedding_generation" for m in failed_operations) else "operational"
            recommendations.append("Some services experiencing issues - monitor closely")
        else:
            overall_status = "critical"
            pinecone_status = "critical" if any(m.operation == "pinecone_connectivity" for m in failed_operations) else "degraded"
            openai_status = "critical" if any(m.operation == "embedding_generation" for m in failed_operations) else "degraded"
            alerts.append("Multiple service failures detected - immediate attention required")
        
        # Check performance thresholds
        for metric in successful_operations:
            if metric.operation == "embedding_generation" and metric.response_time_ms > self.thresholds['embedding_generation_ms']:
                recommendations.append(f"Embedding generation slow: {metric.response_time_ms:.0f}ms (threshold: {self.thresholds['embedding_generation_ms']}ms)")
            elif metric.operation == "vector_search" and metric.response_time_ms > self.thresholds['vector_search_ms']:
                recommendations.append(f"Vector search slow: {metric.response_time_ms:.0f}ms (threshold: {self.thresholds['vector_search_ms']}ms)")
        
        # Find last successful operation
        last_successful = None 
        if successful_operations:
            last_successful = max(successful_operations, key=lambda m: m.timestamp).operation
        
        return HealthStatus(
            timestamp=datetime.utcnow().isoformat(),
            overall_status=overall_status,
            pinecone_status=pinecone_status,
            openai_status=openai_status,
            last_successful_operation=last_successful,
            error_count_24h=len(failed_operations),
            performance_score=avg_performance,
            recommendations=recommendations,
            alerts=alerts
        )

    def save_metrics_report(self, health_status: HealthStatus, detailed_metrics: List[ServiceMetrics]) -> str:
        """Save detailed metrics report to file."""
        report_file = LOG_DIR / f"health_report_{int(time.time())}.json"
        
        report_data = {
            "health_status": asdict(health_status),
            "detailed_metrics": [asdict(m) for m in detailed_metrics],
            "configuration": {
                "thresholds": self.thresholds,
                "pinecone_index": self.config['pinecone_index_name'],
                "pinecone_environment": self.config['pinecone_environment'],
                "openai_model": self.config['openai_embedding_model']
            },
            "system_info": {
                "python_version": sys.version,
                "pinecone_available": PINECONE_AVAILABLE,
                "requests_available": REQUESTS_AVAILABLE
            }
        }
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        logger.info(f"Detailed report saved to: {report_file}")
        return str(report_file)

    def print_health_report(self, health_status: HealthStatus):
        """Print human-readable health report."""
        print("\n" + "="*80)
        print("ENHANCED PINECONE HEALTH MONITORING REPORT")
        print("="*80)
        
        # Status indicators
        status_emoji = {
            "healthy": "✅",
            "degraded": "⚠️", 
            "critical": "❌",
            "operational": "✅",
            "unavailable": "❌"
        }
        
        print(f"Timestamp: {health_status.timestamp}")
        print(f"Overall Status: {status_emoji.get(health_status.overall_status, '❓')} {health_status.overall_status.upper()}")
        print(f"Performance Score: {health_status.performance_score:.2%}")
        print()
        
        # Service status
        print("SERVICE STATUS:")
        print(f"  Pinecone Vector DB: {status_emoji.get(health_status.pinecone_status, '❓')} {health_status.pinecone_status.upper()}")
        print(f"  OpenAI Embeddings: {status_emoji.get(health_status.openai_status, '❓')} {health_status.openai_status.upper()}")
        print()
        
        # Performance metrics
        if self.metrics_history:
            recent_metrics = self.metrics_history[-10:]  # Last 10 operations
            successful_metrics = [m for m in recent_metrics if m.success]
            
            if successful_metrics:
                print("RECENT PERFORMANCE METRICS:")
                avg_response_time = sum(m.response_time_ms for m in successful_metrics) / len(successful_metrics)
                print(f"  Average Response Time: {avg_response_time:.1f}ms")
                
                operation_times = {}
                for metric in successful_metrics:
                    if metric.operation not in operation_times:
                        operation_times[metric.operation] = []
                    operation_times[metric.operation].append(metric.response_time_ms)
                
                for operation, times in operation_times.items():
                    avg_time = sum(times) / len(times)
                    print(f"  {operation.replace('_', ' ').title()}: {avg_time:.1f}ms")
                print()
        
        # Last successful operation
        if health_status.last_successful_operation:
            print(f"Last Successful Operation: {health_status.last_successful_operation.replace('_', ' ').title()}")
        
        print(f"Errors (24h): {health_status.error_count_24h}")
        print()
        
        # Alerts
        if health_status.alerts:
            print("🚨 ALERTS:")
            for alert in health_status.alerts:
                print(f"  • {alert}")
            print()
        
        # Recommendations
        if health_status.recommendations:
            print("💡 RECOMMENDATIONS:")
            for rec in health_status.recommendations:
                print(f"  • {rec}")
            print()
        
        print("="*80)

    async def continuous_monitoring(self, interval_minutes: int = 30):
        """Run continuous monitoring with specified interval."""
        logger.info(f"Starting continuous monitoring (interval: {interval_minutes} minutes)")
        
        while True:
            try:
                health_status = await self.run_comprehensive_health_check()
                
                # Save report
                report_file = self.save_metrics_report(health_status, self.metrics_history[-20:])
                
                # Print status
                self.print_health_report(health_status)
                
                # Send alerts if needed
                if health_status.alerts:
                    for alert in health_status.alerts:
                        logger.error(f"ALERT: {alert}")
                
                # Wait for next check
                logger.info(f"Next check in {interval_minutes} minutes...")
                await asyncio.sleep(interval_minutes * 60)
                
            except KeyboardInterrupt:
                logger.info("Monitoring stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in continuous monitoring: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying


async def main():
    """Main function with argument parsing."""
    parser = argparse.ArgumentParser(description="Enhanced Pinecone Health Monitor")
    parser.add_argument(
        '--continuous', 
        action='store_true',
        help='Run continuous monitoring'
    )
    parser.add_argument(
        '--interval',
        type=int,
        default=30,
        help='Monitoring interval in minutes (default: 30)'
    )
    parser.add_argument(
        '--test-all',
        action='store_true',
        help='Run comprehensive test suite once'
    )
    parser.add_argument(
        '--status-report',
        action='store_true', 
        help='Generate status report and exit'
    )
    
    args = parser.parse_args()
    
    monitor = EnhancedPineconeMonitor()
    
    if args.continuous:
        await monitor.continuous_monitoring(args.interval)
    else:
        # Run single health check
        health_status = await monitor.run_comprehensive_health_check()
        
        # Save detailed report
        report_file = monitor.save_metrics_report(health_status, monitor.metrics_history)
        
        # Print report
        monitor.print_health_report(health_status)
        
        # Return appropriate exit code
        if health_status.overall_status == "healthy":
            return 0
        elif health_status.overall_status == "degraded":
            return 1
        else:
            return 2


if __name__ == '__main__':
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\nMonitoring interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Monitor failed: {e}")
        sys.exit(3)