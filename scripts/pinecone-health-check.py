#!/usr/bin/env python3
"""
Pinecone Health Check Script

A simple, standalone health check script to verify Pinecone connectivity and operations.
This script can be run manually or integrated into monitoring systems.

Usage:
    python3 scripts/pinecone-health-check.py
    python3 scripts/pinecone-health-check.py --verbose
    python3 scripts/pinecone-health-check.py --test-vectors

Features:
- Tests Pinecone client initialization
- Verifies connection to warroom-documents index
- Optionally tests vector operations (upsert/search/delete)
- Provides detailed health report
- Returns appropriate exit codes for monitoring systems

Exit Codes:
    0: All checks passed
    1: Pinecone connection failed
    2: OpenAI connection failed
    3: Vector operations failed
    4: Configuration error
"""

import sys
import os
import asyncio
import argparse
import logging
import time
from typing import Dict, Any, List
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

from core.config import settings
from core.pinecone_config import PineconeManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class PineconeHealthChecker:
    """Comprehensive health checker for Pinecone vector database."""
    
    def __init__(self, verbose: bool = False, test_vectors: bool = False):
        self.verbose = verbose
        self.test_vectors = test_vectors
        self.results = {
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'unknown',
            'checks': {},
            'errors': [],
            'recommendations': []
        }
        
        if verbose:
            logging.getLogger().setLevel(logging.DEBUG)
    
    async def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check and return results."""
        logger.info("Starting Pinecone health check...")
        
        try:
            # 1. Configuration check
            await self._check_configuration()
            
            # 2. Pinecone client initialization
            manager = await self._check_pinecone_initialization()
            
            if manager:
                # 3. Index connection and stats
                await self._check_index_connection(manager)
                
                # 4. OpenAI embedding generation
                await self._check_openai_embeddings(manager)
                
                # 5. Optional vector operations test
                if self.test_vectors:
                    await self._check_vector_operations(manager)
                
                # Cleanup
                await manager.cleanup()
            
            # Determine overall status
            self._determine_overall_status()
            
        except Exception as e:
            logger.error(f"Health check failed with exception: {e}")
            self.results['errors'].append(f"Unexpected error: {str(e)}")
            self.results['overall_status'] = 'critical'
        
        return self.results
    
    async def _check_configuration(self):
        """Check configuration and API keys."""
        logger.info("Checking configuration...")
        
        config_issues = []
        
        if not settings.PINECONE_API_KEY:
            config_issues.append("PINECONE_API_KEY not configured")
        
        if not settings.OPENAI_API_KEY:
            config_issues.append("OPENAI_API_KEY not configured")
        
        if not settings.PINECONE_INDEX_NAME:
            config_issues.append("PINECONE_INDEX_NAME not configured")
        
        if not settings.PINECONE_ENVIRONMENT:
            config_issues.append("PINECONE_ENVIRONMENT not configured")
        
        if config_issues:
            self.results['checks']['configuration'] = {
                'status': 'failed',
                'issues': config_issues,
                'message': 'Configuration incomplete'
            }
            self.results['errors'].extend(config_issues)
            self.results['recommendations'].append(
                "Set missing environment variables in .env file"
            )
        else:
            self.results['checks']['configuration'] = {
                'status': 'passed',
                'message': 'All required configuration present',
                'details': {
                    'index_name': settings.PINECONE_INDEX_NAME,
                    'environment': settings.PINECONE_ENVIRONMENT,
                    'embedding_model': settings.OPENAI_MODEL_EMBEDDING
                }
            }
        
        if self.verbose:
            logger.info(f"Configuration check: {self.results['checks']['configuration']['status']}")
    
    async def _check_pinecone_initialization(self) -> PineconeManager:
        """Check Pinecone client initialization."""
        logger.info("Testing Pinecone client initialization...")
        
        try:
            manager = PineconeManager()
            success = await manager.initialize()
            
            if success and manager.is_initialized:
                self.results['checks']['pinecone_init'] = {
                    'status': 'passed',
                    'message': 'Pinecone client initialized successfully',
                    'details': {
                        'client_connected': True,
                        'index_connected': manager.index is not None
                    }
                }
                logger.info("Pinecone initialization: PASSED")
                return manager
            else:
                self.results['checks']['pinecone_init'] = {
                    'status': 'failed',
                    'message': 'Pinecone client initialization failed'
                }
                self.results['errors'].append("Failed to initialize Pinecone client")
                logger.error("Pinecone initialization: FAILED")
                return None
                
        except Exception as e:
            self.results['checks']['pinecone_init'] = {
                'status': 'failed',
                'message': f'Pinecone initialization error: {str(e)}'
            }
            self.results['errors'].append(f"Pinecone initialization error: {str(e)}")
            logger.error(f"Pinecone initialization: FAILED - {e}")
            return None
    
    async def _check_index_connection(self, manager: PineconeManager):
        """Check index connection and retrieve stats."""
        logger.info("Testing index connection...")
        
        try:
            if not manager.index:
                self.results['checks']['index_connection'] = {
                    'status': 'failed',
                    'message': 'Index not connected'
                }
                self.results['errors'].append("Pinecone index not connected")
                return
            
            # Try to get index stats
            stats = manager.index.describe_index_stats()
            
            self.results['checks']['index_connection'] = {
                'status': 'passed',
                'message': 'Index connection successful',
                'details': {
                    'total_vectors': getattr(stats, 'total_vector_count', 0),
                    'dimension': getattr(stats, 'dimension', 'unknown'),
                    'index_fullness': getattr(stats, 'index_fullness', 0.0),
                    'namespaces': len(getattr(stats, 'namespaces', {}))
                }
            }
            
            # Check if index is getting full
            fullness = getattr(stats, 'index_fullness', 0.0)
            if fullness > 0.8:
                self.results['recommendations'].append(
                    f"Index is {fullness*100:.1f}% full - consider monitoring capacity"
                )
            
            logger.info("Index connection: PASSED")
            
        except Exception as e:
            self.results['checks']['index_connection'] = {
                'status': 'failed',
                'message': f'Index connection error: {str(e)}'
            }
            self.results['errors'].append(f"Index connection error: {str(e)}")
            logger.error(f"Index connection: FAILED - {e}")
    
    async def _check_openai_embeddings(self, manager: PineconeManager):
        """Check OpenAI embedding generation."""
        logger.info("Testing OpenAI embedding generation...")
        
        try:
            test_text = "Health check test document for embedding generation."
            embedding = await manager.generate_embedding(test_text)
            
            if isinstance(embedding, list) and len(embedding) == 1536:
                self.results['checks']['openai_embeddings'] = {
                    'status': 'passed',
                    'message': 'OpenAI embedding generation successful',
                    'details': {
                        'embedding_dimension': len(embedding),
                        'model': settings.OPENAI_MODEL_EMBEDDING,
                        'test_text_length': len(test_text)
                    }
                }
                logger.info("OpenAI embeddings: PASSED")
            else:
                self.results['checks']['openai_embeddings'] = {
                    'status': 'failed',
                    'message': f'Invalid embedding format: {type(embedding)}, length: {len(embedding) if isinstance(embedding, list) else "N/A"}'
                }
                self.results['errors'].append("Invalid embedding format returned")
                logger.error("OpenAI embeddings: FAILED - Invalid format")
                
        except Exception as e:
            self.results['checks']['openai_embeddings'] = {
                'status': 'failed',
                'message': f'OpenAI embedding error: {str(e)}'
            }
            self.results['errors'].append(f"OpenAI embedding error: {str(e)}")
            logger.error(f"OpenAI embeddings: FAILED - {e}")
    
    async def _check_vector_operations(self, manager: PineconeManager):
        """Test vector operations (upsert, search, delete)."""
        logger.info("Testing vector operations...")
        
        test_org_id = "health_check_test"
        test_doc_id = f"health_check_{int(time.time())}"
        test_chunks = ["Health check test document for vector operations."]
        test_metadata = {
            "title": "Health Check Test",
            "type": "health_check",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        operations_status = {
            'upsert': False,
            'search': False,
            'delete': False
        }
        
        try:
            # Test upsert
            logger.info("Testing vector upsert...")
            upsert_success = await manager.upsert_document(
                test_doc_id, test_chunks, test_metadata, test_org_id
            )
            operations_status['upsert'] = upsert_success
            
            if upsert_success:
                # Wait for indexing
                await asyncio.sleep(5)
                
                # Test search
                logger.info("Testing vector search...")
                search_results = await manager.search_documents(
                    "health check test", test_org_id, top_k=5
                )
                operations_status['search'] = len(search_results) > 0
                
                # Test delete
                logger.info("Testing vector delete...")
                delete_success = await manager.delete_document(test_doc_id, test_org_id)
                operations_status['delete'] = delete_success
            
            # Check overall vector operations status
            all_passed = all(operations_status.values())
            
            self.results['checks']['vector_operations'] = {
                'status': 'passed' if all_passed else 'failed',
                'message': 'Vector operations test completed',
                'details': operations_status
            }
            
            if not all_passed:
                failed_ops = [op for op, status in operations_status.items() if not status]
                self.results['errors'].append(f"Vector operations failed: {', '.join(failed_ops)}")
                logger.error(f"Vector operations: FAILED - {failed_ops}")
            else:
                logger.info("Vector operations: PASSED")
                
        except Exception as e:
            self.results['checks']['vector_operations'] = {
                'status': 'failed',
                'message': f'Vector operations error: {str(e)}',
                'details': operations_status
            }
            self.results['errors'].append(f"Vector operations error: {str(e)}")
            logger.error(f"Vector operations: FAILED - {e}")
            
            # Cleanup attempt
            try:
                await manager.delete_document(test_doc_id, test_org_id)
            except:
                pass
    
    def _determine_overall_status(self):
        """Determine overall health status based on check results."""
        check_statuses = [check['status'] for check in self.results['checks'].values()]
        
        if not check_statuses:
            self.results['overall_status'] = 'unknown'
        elif all(status == 'passed' for status in check_statuses):
            self.results['overall_status'] = 'healthy'
        elif 'failed' in check_statuses:
            # Check for critical failures
            critical_checks = ['configuration', 'pinecone_init']
            critical_failed = any(
                self.results['checks'].get(check, {}).get('status') == 'failed'
                for check in critical_checks
            )
            
            if critical_failed:
                self.results['overall_status'] = 'critical'
            else:
                self.results['overall_status'] = 'degraded'
        else:
            self.results['overall_status'] = 'unknown'
    
    def print_report(self):
        """Print a human-readable health check report."""
        print("\n" + "="*60)
        print("PINECONE HEALTH CHECK REPORT")
        print("="*60)
        print(f"Timestamp: {self.results['timestamp']}")
        print(f"Overall Status: {self.results['overall_status'].upper()}")
        print()
        
        # Check results
        for check_name, check_result in self.results['checks'].items():
            status_icon = "✅" if check_result['status'] == 'passed' else "❌"
            print(f"{status_icon} {check_name.replace('_', ' ').title()}: {check_result['status'].upper()}")
            print(f"   {check_result['message']}")
            
            if self.verbose and 'details' in check_result:
                for key, value in check_result['details'].items():
                    print(f"   - {key}: {value}")
            print()
        
        # Errors
        if self.results['errors']:
            print("ERRORS:")
            for error in self.results['errors']:
                print(f"  ❌ {error}")
            print()
        
        # Recommendations
        if self.results['recommendations']:
            print("RECOMMENDATIONS:")
            for recommendation in self.results['recommendations']:
                print(f"  💡 {recommendation}")
            print()
        
        print("="*60)
    
    def get_exit_code(self) -> int:
        """Get appropriate exit code for monitoring systems."""
        status = self.results['overall_status']
        
        if status == 'healthy':
            return 0
        elif status == 'degraded':
            return 1
        elif status == 'critical':
            return 2
        else:
            return 3


async def main():
    """Main health check function."""
    parser = argparse.ArgumentParser(description="Pinecone Health Check")
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    parser.add_argument(
        '--test-vectors',
        action='store_true',
        help='Include vector operations testing (slower)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results in JSON format'
    )
    
    args = parser.parse_args()
    
    # Run health check
    checker = PineconeHealthChecker(
        verbose=args.verbose,
        test_vectors=args.test_vectors
    )
    
    results = await checker.run_health_check()
    
    # Output results
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        checker.print_report()
    
    # Exit with appropriate code
    return checker.get_exit_code()


if __name__ == '__main__':
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\nHealth check interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"Health check failed: {e}")
        sys.exit(4)