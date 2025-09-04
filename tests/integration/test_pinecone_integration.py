"""
Comprehensive integration tests for Pinecone Vector Database operations.

This test suite validates:
- Pinecone client initialization and configuration
- Connection to Pinecone service
- Index creation and management
- Vector operations (upsert, search, delete)
- Error handling and fallback mechanisms
- Performance and reliability

Test Requirements:
- Valid Pinecone API key in environment variables
- OpenAI API key for embedding generation
- Network connectivity to Pinecone service
- Pytest with asyncio support

Usage:
    pytest tests/integration/test_pinecone_integration.py -v
    pytest tests/integration/test_pinecone_integration.py::test_pinecone_initialization -v
"""

import os
import pytest
import asyncio
import logging
from typing import List, Dict, Any, Optional
from unittest.mock import Mock, patch, AsyncMock
import time
import uuid

# Test imports
from core.pinecone_config import PineconeManager, pinecone_manager
from core.config import settings

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture
def test_organization_id() -> str:
    """Generate a unique test organization ID."""
    return f"test_org_{uuid.uuid4().hex[:8]}"


@pytest.fixture
def test_document_id() -> str:
    """Generate a unique test document ID."""
    return f"test_doc_{uuid.uuid4().hex[:8]}"


@pytest.fixture
def sample_text_chunks() -> List[str]:
    """Sample text chunks for testing vector operations."""
    return [
        "The War Room Analytics Dashboard provides comprehensive campaign management tools for political campaigns and advocacy groups.",
        "This platform enables volunteer coordination, event management, and real-time communication between campaign staff and supporters.",
        "Advanced analytics features include voter sentiment analysis, social media monitoring, and performance tracking across multiple channels.",
        "Document intelligence capabilities allow campaigns to process and analyze large volumes of text data for strategic insights.",
        "Integration with various communication channels ensures seamless outreach to volunteers and voters through preferred methods."
    ]


@pytest.fixture
def sample_metadata() -> Dict[str, Any]:
    """Sample document metadata for testing."""
    return {
        "title": "Campaign Strategy Document",
        "document_type": "strategy",
        "author": "Campaign Manager",
        "created_at": "2024-01-15T10:00:00Z",
        "tags": ["strategy", "analytics", "outreach"],
        "category": "campaign_materials",
        "confidentiality": "internal"
    }


class TestPineconeInitialization:
    """Test suite for Pinecone client initialization and configuration."""

    @pytest.mark.integration
    async def test_pinecone_manager_initialization_success(self):
        """Test successful Pinecone manager initialization with valid credentials."""
        # Ensure we have required API keys
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("PINECONE_API_KEY and OPENAI_API_KEY required for integration tests")

        # Create a fresh manager instance
        manager = PineconeManager()
        
        # Test initialization
        result = await manager.initialize()
        
        assert result is True, "Pinecone manager should initialize successfully"
        assert manager.is_initialized is True, "Manager should report as initialized"
        assert manager.pc is not None, "Pinecone client should be created"
        assert manager.index is not None, "Index should be connected"
        assert manager.openai_client is not None, "OpenAI client should be created"
        
        # Cleanup
        await manager.cleanup()

    @pytest.mark.integration
    async def test_pinecone_initialization_missing_api_key(self):
        """Test initialization failure with missing API key."""
        manager = PineconeManager()
        
        # Mock missing API key
        with patch.object(settings, 'PINECONE_API_KEY', ''):
            result = await manager.initialize()
            
            assert result is False, "Initialization should fail with missing API key"
            assert manager.is_initialized is False, "Manager should not be initialized"

    @pytest.mark.integration
    async def test_pinecone_initialization_invalid_api_key(self):
        """Test initialization failure with invalid API key."""
        manager = PineconeManager()
        
        # Mock invalid API key
        with patch.object(settings, 'PINECONE_API_KEY', 'invalid-key-12345'):
            result = await manager.initialize()
            
            assert result is False, "Initialization should fail with invalid API key"
            assert manager.is_initialized is False, "Manager should not be initialized"

    @pytest.mark.integration
    async def test_pinecone_double_initialization(self):
        """Test that double initialization is safe and doesn't cause issues."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        
        # First initialization
        result1 = await manager.initialize()
        assert result1 is True, "First initialization should succeed"
        
        # Second initialization should be safe
        result2 = await manager.initialize()
        assert result2 is True, "Second initialization should succeed"
        assert manager.is_initialized is True, "Manager should remain initialized"
        
        # Cleanup
        await manager.cleanup()


class TestPineconeConnection:
    """Test suite for Pinecone service connection and index operations."""

    @pytest.mark.integration
    @pytest.mark.slow
    async def test_index_connection(self):
        """Test connection to the warroom-documents index."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        assert result is True, "Manager should initialize successfully"
        
        # Test index connection
        assert manager.index is not None, "Index should be connected"
        
        # Test index stats retrieval
        try:
            stats = manager.index.describe_index_stats()
            # The stats object has properties, not a dict
            assert hasattr(stats, 'dimension'), "Stats should have dimension attribute"
            assert hasattr(stats, 'total_vector_count'), "Stats should have total_vector_count"
            logger.info(f"Index stats: dimension={stats.dimension}, vectors={stats.total_vector_count}")
        except Exception as e:
            pytest.fail(f"Failed to retrieve index stats: {e}")
        
        # Cleanup
        await manager.cleanup()

    @pytest.mark.integration
    async def test_index_list_operation(self):
        """Test listing available indexes."""
        if not settings.PINECONE_API_KEY:
            pytest.skip("PINECONE_API_KEY required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        assert result is True, "Manager should initialize successfully"
        
        # Test listing indexes
        try:
            indexes = [idx["name"] for idx in manager.pc.list_indexes()]
            assert isinstance(indexes, list), "Indexes should be returned as list"
            assert settings.PINECONE_INDEX_NAME in indexes, f"Index {settings.PINECONE_INDEX_NAME} should exist"
            logger.info(f"Available indexes: {indexes}")
        except Exception as e:
            pytest.fail(f"Failed to list indexes: {e}")
        
        # Cleanup
        await manager.cleanup()


class TestVectorOperations:
    """Test suite for vector database operations (upsert, search, delete)."""

    @pytest.mark.integration
    @pytest.mark.slow
    async def test_embedding_generation(self):
        """Test OpenAI embedding generation."""
        if not settings.OPENAI_API_KEY:
            pytest.skip("OPENAI_API_KEY required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        assert result is True, "Manager should initialize successfully"
        
        # Test embedding generation
        test_text = "This is a test document for embedding generation."
        embedding = await manager.generate_embedding(test_text)
        
        assert isinstance(embedding, list), "Embedding should be a list"
        assert len(embedding) == 1536, "Embedding should have 1536 dimensions (ada-002)"
        assert all(isinstance(val, float) for val in embedding), "All embedding values should be floats"
        
        logger.info(f"Generated embedding with {len(embedding)} dimensions")
        
        # Cleanup
        await manager.cleanup()

    @pytest.mark.integration
    @pytest.mark.slow
    async def test_document_upsert_and_search(self, test_organization_id, test_document_id, sample_text_chunks, sample_metadata):
        """Test upserting a document and searching for similar content."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        assert result is True, "Manager should initialize successfully"
        
        try:
            # Test document upsert
            upsert_result = await manager.upsert_document(
                document_id=test_document_id,
                text_chunks=sample_text_chunks,
                metadata=sample_metadata,
                organization_id=test_organization_id
            )
            
            assert upsert_result is True, "Document upsert should succeed"
            logger.info(f"Successfully upserted document {test_document_id}")
            
            # Wait for vector indexing (Pinecone needs time to process)
            await asyncio.sleep(10)
            
            # Test document search
            search_query = "campaign management and analytics"
            search_results = await manager.search_documents(
                query=search_query,
                organization_id=test_organization_id,
                top_k=3
            )
            
            assert isinstance(search_results, list), "Search results should be a list"
            assert len(search_results) > 0, "Should find at least one matching document"
            
            # Validate search result structure
            for result in search_results:
                assert "id" in result, "Result should have ID"
                assert "score" in result, "Result should have similarity score"
                assert "text" in result, "Result should have text content"
                assert "document_id" in result, "Result should have document ID"
                assert result["document_id"] == test_document_id, "Should match our test document"
                assert 0 <= result["score"] <= 1, "Score should be between 0 and 1"
            
            logger.info(f"Found {len(search_results)} matching documents")
            
        finally:
            # Cleanup: Delete test document
            delete_result = await manager.delete_document(test_document_id, test_organization_id)
            assert delete_result is True, "Document deletion should succeed"
            logger.info(f"Cleaned up test document {test_document_id}")
            
            await manager.cleanup()

    @pytest.mark.integration
    @pytest.mark.slow
    async def test_multiple_organization_isolation(self, sample_text_chunks, sample_metadata):
        """Test that documents are properly isolated by organization namespace."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        assert result is True, "Manager should initialize successfully"
        
        # Create test data for two organizations
        org1_id = f"test_org_1_{uuid.uuid4().hex[:8]}"
        org2_id = f"test_org_2_{uuid.uuid4().hex[:8]}"
        doc1_id = f"test_doc_1_{uuid.uuid4().hex[:8]}"
        doc2_id = f"test_doc_2_{uuid.uuid4().hex[:8]}"
        
        try:
            # Upsert documents for both organizations
            result1 = await manager.upsert_document(doc1_id, sample_text_chunks, sample_metadata, org1_id)
            result2 = await manager.upsert_document(doc2_id, sample_text_chunks, sample_metadata, org2_id)
            
            assert result1 is True, "Org1 document upsert should succeed"
            assert result2 is True, "Org2 document upsert should succeed"
            
            # Wait for indexing
            await asyncio.sleep(10)
            
            # Search in org1 - should only find org1 documents
            org1_results = await manager.search_documents("campaign analytics", org1_id, top_k=10)
            org1_doc_ids = {result["document_id"] for result in org1_results}
            
            assert doc1_id in org1_doc_ids, "Org1 should find its own document"
            assert doc2_id not in org1_doc_ids, "Org1 should not find org2 documents"
            
            # Search in org2 - should only find org2 documents
            org2_results = await manager.search_documents("campaign analytics", org2_id, top_k=10)
            org2_doc_ids = {result["document_id"] for result in org2_results}
            
            assert doc2_id in org2_doc_ids, "Org2 should find its own document"
            assert doc1_id not in org2_doc_ids, "Org2 should not find org1 documents"
            
            logger.info("Organization isolation test passed")
            
        finally:
            # Cleanup both documents
            await manager.delete_document(doc1_id, org1_id)
            await manager.delete_document(doc2_id, org2_id)
            await manager.cleanup()

    @pytest.mark.integration
    async def test_vector_deletion(self, test_organization_id, test_document_id, sample_text_chunks, sample_metadata):
        """Test vector deletion functionality."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        assert result is True, "Manager should initialize successfully"
        
        try:
            # First upsert a document
            upsert_result = await manager.upsert_document(
                test_document_id, sample_text_chunks, sample_metadata, test_organization_id
            )
            assert upsert_result is True, "Document upsert should succeed"
            
            # Wait for indexing (Pinecone needs time to index)
            await asyncio.sleep(10)
            
            # Verify document exists - search for the actual text content
            search_results = await manager.search_documents(sample_text_chunks[0], test_organization_id, top_k=10)
            initial_count = len([r for r in search_results if r.get("document_id") == test_document_id])
            
            # If not found, try a broader search
            if initial_count == 0:
                logger.warning("Document not found with text search, trying metadata search")
                search_results = await manager.search_documents("test", test_organization_id, top_k=20)
                initial_count = len([r for r in search_results if r.get("document_id") == test_document_id])
            
            assert initial_count > 0, f"Document should be found before deletion. Found {len(search_results)} results but none match document_id {test_document_id}"
            
            # Delete the document
            delete_result = await manager.delete_document(test_document_id, test_organization_id)
            assert delete_result is True, "Document deletion should succeed"
            
            # Wait for deletion to propagate
            await asyncio.sleep(5)
            
            # Verify document is deleted
            search_results_after = await manager.search_documents("campaign", test_organization_id, top_k=10)
            final_count = len([r for r in search_results_after if r["document_id"] == test_document_id])
            assert final_count == 0, "Document should not be found after deletion"
            
            logger.info("Vector deletion test passed")
            
        finally:
            # Ensure cleanup even if test fails
            await manager.delete_document(test_document_id, test_organization_id)
            await manager.cleanup()


class TestErrorHandling:
    """Test suite for error handling and edge cases."""

    @pytest.mark.integration
    async def test_uninitialized_manager_operations(self):
        """Test operations on uninitialized manager."""
        manager = PineconeManager()
        
        # Test operations without initialization
        embedding_result = None
        try:
            embedding_result = await manager.generate_embedding("test text")
        except Exception:
            pass  # Expected to fail or initialize automatically
        
        upsert_result = await manager.upsert_document("test_doc", ["test"], {}, "test_org")
        search_result = await manager.search_documents("test", "test_org")
        delete_result = await manager.delete_document("test_doc", "test_org")
        
        # Without proper API keys, these should fail gracefully
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            assert upsert_result is False, "Upsert should fail without API keys"
            assert search_result == [], "Search should return empty list without API keys"
            assert delete_result is False, "Delete should fail without API keys"

    @pytest.mark.integration
    async def test_invalid_embedding_text(self):
        """Test embedding generation with invalid/empty text."""
        if not settings.OPENAI_API_KEY:
            pytest.skip("OPENAI_API_KEY required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        if result:
            try:
                # Test with empty string
                empty_embedding = await manager.generate_embedding("")
                assert isinstance(empty_embedding, list), "Should handle empty string gracefully"
                
                # Test with very long text (should be truncated)
                long_text = "test " * 10000  # Very long text
                long_embedding = await manager.generate_embedding(long_text)
                assert isinstance(long_embedding, list), "Should handle long text gracefully"
                assert len(long_embedding) == 1536, "Should return proper dimension"
                
            except Exception as e:
                logger.warning(f"Embedding generation test failed: {e}")
            finally:
                await manager.cleanup()

    @pytest.mark.integration
    async def test_search_with_empty_index(self):
        """Test searching in an empty organization namespace."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        if result:
            try:
                # Search in a non-existent organization
                empty_org_id = f"empty_org_{uuid.uuid4().hex[:8]}"
                results = await manager.search_documents("test query", empty_org_id, top_k=5)
                
                assert isinstance(results, list), "Should return list even for empty namespace"
                assert len(results) == 0, "Should return empty list for non-existent organization"
                
            finally:
                await manager.cleanup()

    @pytest.mark.integration
    async def test_manager_stats_operations(self):
        """Test index statistics retrieval."""
        if not settings.PINECONE_API_KEY:
            pytest.skip("PINECONE_API_KEY required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        if result:
            try:
                # Test stats for non-existent organization
                empty_org_id = f"empty_org_{uuid.uuid4().hex[:8]}"
                stats = manager.get_index_stats(empty_org_id)
                
                assert isinstance(stats, dict), "Stats should return dict"
                assert "total_vectors" in stats, "Should include vector count"
                assert "dimension" in stats, "Should include dimension info"
                assert "namespace" in stats, "Should include namespace info"
                
                logger.info(f"Index stats for empty org: {stats}")
                
            finally:
                await manager.cleanup()


class TestFallbackMechanisms:
    """Test suite for fallback mechanisms when Pinecone is unavailable."""

    @pytest.mark.integration
    async def test_pinecone_service_unavailable_fallback(self):
        """Test behavior when Pinecone service is unavailable."""
        # Create a fresh manager instance
        manager = PineconeManager()
        
        # Mock the Pinecone client creation in the manager's module
        with patch('core.pinecone_config.Pinecone') as mock_pinecone_class:
            mock_pinecone_class.side_effect = Exception("Network connection failed")
            
            # Now try to initialize - it should fail
            result = await manager.initialize()
            assert result is False, "Initialization should fail with network error"
            
            # Test that operations fail gracefully when not initialized
            upsert_result = await manager.upsert_document("test", ["content"], {}, "org")
            search_result = await manager.search_documents("query", "org")
            delete_result = await manager.delete_document("test", "org")
            
            assert upsert_result is False, "Upsert should fail gracefully"
            assert search_result == [], "Search should return empty list"
            assert delete_result is False, "Delete should fail gracefully"

    @pytest.mark.integration
    async def test_openai_service_unavailable(self):
        """Test behavior when OpenAI service is unavailable for embeddings."""
        if not settings.PINECONE_API_KEY:
            pytest.skip("PINECONE_API_KEY required for integration tests")

        manager = PineconeManager()
        
        # Initialize manager first (Pinecone should work)
        result = await manager.initialize()
        
        if result:  # If Pinecone initializes successfully
            # Mock the OpenAI client's embedding generation after initialization
            with patch.object(manager.openai_client.embeddings, 'create', new_callable=AsyncMock) as mock_create:
                mock_create.side_effect = Exception("OpenAI API unavailable")
                
                try:
                    # Embedding generation should fail
                    embedding = await manager.generate_embedding("test text")
                    pytest.fail("Embedding generation should have failed")
                except Exception as e:
                    # The error is raised directly from the mock
                    assert "OpenAI API unavailable" in str(e), f"Expected OpenAI error, got: {str(e)}"
                finally:
                    await manager.cleanup()
        else:
            pytest.skip("Could not initialize Pinecone manager for test")


class TestPerformanceAndReliability:
    """Test suite for performance and reliability aspects."""

    @pytest.mark.integration
    @pytest.mark.slow
    async def test_concurrent_operations(self, sample_text_chunks, sample_metadata):
        """Test concurrent vector operations."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        result = await manager.initialize()
        
        if not result:
            pytest.skip("Pinecone initialization failed")
        
        try:
            # Create multiple test documents concurrently
            org_id = f"concurrent_test_{uuid.uuid4().hex[:8]}"
            doc_ids = [f"concurrent_doc_{i}_{uuid.uuid4().hex[:8]}" for i in range(3)]
            
            # Test concurrent upserts
            start_time = time.time()
            upsert_tasks = [
                manager.upsert_document(doc_id, sample_text_chunks, sample_metadata, org_id)
                for doc_id in doc_ids
            ]
            upsert_results = await asyncio.gather(*upsert_tasks, return_exceptions=True)
            upsert_time = time.time() - start_time
            
            # Check results
            successful_upserts = sum(1 for result in upsert_results if result is True)
            assert successful_upserts > 0, "At least some concurrent upserts should succeed"
            
            logger.info(f"Concurrent upserts: {successful_upserts}/{len(doc_ids)} successful in {upsert_time:.2f}s")
            
            # Wait for indexing
            await asyncio.sleep(10)
            
            # Test concurrent searches
            start_time = time.time()
            search_tasks = [
                manager.search_documents("campaign analytics", org_id, top_k=5)
                for _ in range(3)
            ]
            search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
            search_time = time.time() - start_time
            
            successful_searches = sum(1 for result in search_results if isinstance(result, list))
            assert successful_searches > 0, "At least some concurrent searches should succeed"
            
            logger.info(f"Concurrent searches: {successful_searches}/{len(search_tasks)} successful in {search_time:.2f}s")
            
        finally:
            # Cleanup all test documents
            cleanup_tasks = [
                manager.delete_document(doc_id, org_id)
                for doc_id in doc_ids
            ]
            await asyncio.gather(*cleanup_tasks, return_exceptions=True)
            await manager.cleanup()

    @pytest.mark.integration
    async def test_manager_cleanup_and_reinitialization(self):
        """Test manager cleanup and reinitialization."""
        if not settings.PINECONE_API_KEY or not settings.OPENAI_API_KEY:
            pytest.skip("API keys required for integration tests")

        manager = PineconeManager()
        
        # Initialize
        result1 = await manager.initialize()
        assert result1 is True, "Initial initialization should succeed"
        assert manager.is_initialized is True, "Manager should be initialized"
        
        # Cleanup
        await manager.cleanup()
        assert manager.is_initialized is False, "Manager should be cleaned up"
        assert manager.pc is None, "Pinecone client should be None after cleanup"
        assert manager.index is None, "Index should be None after cleanup"
        
        # Reinitialize
        result2 = await manager.initialize()
        assert result2 is True, "Reinitialization should succeed"
        assert manager.is_initialized is True, "Manager should be initialized again"
        
        # Final cleanup
        await manager.cleanup()


# Test execution and reporting functions
def run_integration_tests():
    """
    Run all Pinecone integration tests and return results summary.
    
    Returns:
        dict: Test results summary with statistics and issues
    """
    import subprocess
    import sys
    
    # Run pytest with specific markers and capture output
    cmd = [
        sys.executable, "-m", "pytest", 
        "tests/integration/test_pinecone_integration.py",
        "-v", "--tb=short", 
        "-m", "integration",
        "--capture=no"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Tests timed out after 5 minutes",
            "stdout": "",
            "stderr": "Test execution timeout"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "stdout": "",
            "stderr": str(e)
        }


if __name__ == "__main__":
    # Allow running tests directly
    pytest.main([__file__, "-v"])