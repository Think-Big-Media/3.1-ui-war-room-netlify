"""
Pinecone Vector Database Configuration
Handles vector database initialization and management for document intelligence.
Production-ready implementation with async support and comprehensive error handling.
"""

import os
import logging
import asyncio
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pinecone import Pinecone, ServerlessSpec
from openai import AsyncOpenAI
from core.config import settings

logger = logging.getLogger(__name__)


class PineconeManager:
    """
    Manages Pinecone vector database operations for document intelligence.

    Features:
    - Document embedding generation with OpenAI
    - Vector storage and retrieval
    - Namespace isolation per organization
    - Similarity search with metadata filtering
    - Production-ready error handling and fallbacks
    """

    def __init__(self):
        self.pc = None
        self.index = None
        self.openai_client = None
        self._initialized = False
        self._initialization_lock = asyncio.Lock()

    async def initialize(self) -> bool:
        """
        Initialize Pinecone and OpenAI clients asynchronously.
        Safe to call multiple times.
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        if self._initialized:
            return True
            
        async with self._initialization_lock:
            if self._initialized:  # Double-check after acquiring lock
                return True
                
            try:
                await self._initialize_pinecone()
                self._initialized = True
                logger.info("Pinecone manager initialized successfully")
                return True
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone manager: {str(e)}")
                return False

    async def _initialize_pinecone(self) -> None:
        """Initialize Pinecone client and index asynchronously."""
        # Check if required API keys are available
        if not settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY not configured")
        
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
            
        try:
            # Initialize Pinecone client with API key
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            
            # Initialize async OpenAI client
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            # Connect to existing index or create if needed
            index_name = settings.PINECONE_INDEX_NAME

            # Check if index exists
            existing_indexes = [idx["name"] for idx in self.pc.list_indexes()]

            if index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {index_name}")
                await self._create_index(index_name)

            # Connect to index
            self.index = self.pc.Index(index_name)
            logger.info(f"Connected to Pinecone index: {index_name}")

        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")
            raise

    async def _create_index(self, index_name: str) -> None:
        """Create a new Pinecone index for document embeddings."""
        try:
            self.pc.create_index(
                name=index_name,
                dimension=1536,  # OpenAI text-embedding-ada-002 dimension
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=settings.PINECONE_ENVIRONMENT
                )
            )
            
            # Wait for index to be ready
            import time
            max_wait = 60  # seconds
            wait_time = 0
            while wait_time < max_wait:
                try:
                    index_stats = self.pc.describe_index(index_name)
                    if index_stats.status.ready:
                        break
                except Exception:
                    pass
                await asyncio.sleep(5)
                wait_time += 5
            
            logger.info(f"Successfully created Pinecone index: {index_name}")

        except Exception as e:
            logger.error(f"Failed to create Pinecone index: {str(e)}")
            raise

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI.

        Args:
            text: Input text to embed

        Returns:
            Vector embedding as list of floats
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            # Clean and truncate text for embedding
            clean_text = text.strip().replace("\n", " ")[:8000]  # OpenAI limit

            # Generate embedding using the async OpenAI client
            response = await self.openai_client.embeddings.create(
                model=settings.OPENAI_MODEL_EMBEDDING,
                input=clean_text
            )

            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding for text of length {len(text)}")

            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise

    async def upsert_document(
        self,
        document_id: str,
        text_chunks: List[str],
        metadata: Dict[str, Any],
        organization_id: str,
    ) -> bool:
        """
        Store document chunks in Pinecone with embeddings.

        Args:
            document_id: Unique document identifier
            text_chunks: List of text chunks to embed
            metadata: Document metadata
            organization_id: Organization namespace

        Returns:
            Success status
        """
        if not self._initialized:
            initialized = await self.initialize()
            if not initialized:
                logger.error("Pinecone not initialized - cannot upsert document")
                return False
                
        try:
            vectors_to_upsert = []

            for i, chunk in enumerate(text_chunks):
                # Generate embedding for chunk
                embedding = await self.generate_embedding(chunk)

                # Create vector record
                vector_id = f"{document_id}_chunk_{i}"
                vector_metadata = {
                    **metadata,
                    "document_id": document_id,
                    "chunk_index": i,
                    "chunk_text": chunk[:1000],  # Store preview of text
                    "organization_id": organization_id,
                    "chunk_length": len(chunk),
                }

                vectors_to_upsert.append(
                    {"id": vector_id, "values": embedding, "metadata": vector_metadata}
                )

            # Upsert vectors to Pinecone
            namespace = f"org_{organization_id}"
            self.index.upsert(vectors=vectors_to_upsert, namespace=namespace)

            logger.info(
                f"Upserted {len(vectors_to_upsert)} vectors for document {document_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to upsert document: {str(e)}")
            return False

    async def search_documents(
        self,
        query: str,
        organization_id: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using vector similarity.

        Args:
            query: Search query text
            organization_id: Organization namespace
            top_k: Number of results to return
            filter_metadata: Additional metadata filters

        Returns:
            List of matching document chunks with metadata
        """
        if not self._initialized:
            initialized = await self.initialize()
            if not initialized:
                logger.error("Pinecone not initialized - cannot search documents")
                return []
                
        try:
            # Generate query embedding
            query_embedding = await self.generate_embedding(query)

            # Build filter for organization isolation
            base_filter = {"organization_id": {"$eq": organization_id}}
            if filter_metadata:
                base_filter.update(filter_metadata)

            # Search in Pinecone
            namespace = f"org_{organization_id}"
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                namespace=namespace,
                filter=base_filter,
            )

            # Format results
            formatted_results = []
            for match in results.matches:
                formatted_results.append(
                    {
                        "id": match.id,
                        "score": float(match.score),
                        "text": match.metadata.get("chunk_text", ""),
                        "document_id": match.metadata.get("document_id"),
                        "chunk_index": match.metadata.get("chunk_index", 0),
                        "metadata": match.metadata,
                    }
                )

            logger.info(
                f"Found {len(formatted_results)} matches for query in org {organization_id}"
            )
            return formatted_results

        except Exception as e:
            logger.error(f"Failed to search documents: {str(e)}")
            return []

    async def delete_document(self, document_id: str, organization_id: str) -> bool:
        """
        Delete all vectors for a document.

        Args:
            document_id: Document identifier
            organization_id: Organization namespace

        Returns:
            Success status
        """
        if not self._initialized:
            initialized = await self.initialize()
            if not initialized:
                logger.error("Pinecone not initialized - cannot delete document")
                return False
                
        try:
            namespace = f"org_{organization_id}"

            # Query for all chunks of this document
            filter_condition = {"document_id": {"$eq": document_id}}

            # Get all vector IDs for this document
            query_response = self.index.query(
                vector=[0.0] * 1536,  # Dummy vector for ID retrieval
                top_k=1000,  # Max chunks per document
                include_metadata=False,
                namespace=namespace,
                filter=filter_condition,
            )

            # Extract vector IDs
            vector_ids = [match.id for match in query_response.matches]

            if vector_ids:
                # Delete vectors
                self.index.delete(ids=vector_ids, namespace=namespace)
                logger.info(
                    f"Deleted {len(vector_ids)} vectors for document {document_id}"
                )

            return True

        except Exception as e:
            logger.error(f"Failed to delete document: {str(e)}")
            return False

    def get_index_stats(self, organization_id: str) -> Dict[str, Any]:
        """
        Get statistics for organization's namespace.

        Args:
            organization_id: Organization identifier

        Returns:
            Index statistics
        """
        if not self._initialized:
            logger.error("Pinecone not initialized - cannot get stats")
            return {}
            
        try:
            namespace = f"org_{organization_id}"
            stats = self.index.describe_index_stats()

            namespace_stats = stats.get("namespaces", {}).get(namespace, {})

            return {
                "total_vectors": namespace_stats.get("vector_count", 0),
                "dimension": stats.get("dimension", 1536),
                "index_fullness": stats.get("index_fullness", 0.0),
                "namespace": namespace,
            }

        except Exception as e:
            logger.error(f"Failed to get index stats: {str(e)}")
            return {}

    async def cleanup(self) -> None:
        """
        Cleanup resources and close connections.
        """
        try:
            if self.openai_client:
                await self.openai_client.close()
                
            self.pc = None
            self.index = None
            self.openai_client = None
            self._initialized = False
            
            logger.info("Pinecone manager cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Failed to cleanup Pinecone manager: {str(e)}")

    @property
    def is_initialized(self) -> bool:
        """Check if manager is properly initialized."""
        return self._initialized and self.pc is not None and self.index is not None


# Global Pinecone manager instance - will be initialized during app startup
pinecone_manager = PineconeManager()


# Helper functions for easy access
async def store_document(
    document_id: str,
    text_chunks: List[str],
    metadata: Dict[str, Any],
    organization_id: str,
) -> bool:
    """Store document in vector database."""
    if not pinecone_manager.is_initialized:
        logger.warning("Pinecone not initialized - skipping document storage")
        return False
    return await pinecone_manager.upsert_document(
        document_id, text_chunks, metadata, organization_id
    )


async def search_similar_documents(
    query: str,
    organization_id: str,
    top_k: int = 5,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Search for similar documents."""
    if not pinecone_manager.is_initialized:
        logger.warning("Pinecone not initialized - returning empty results")
        return []
    return await pinecone_manager.search_documents(
        query, organization_id, top_k, filters
    )


async def remove_document(document_id: str, organization_id: str) -> bool:
    """Remove document from vector database."""
    if not pinecone_manager.is_initialized:
        logger.warning("Pinecone not initialized - skipping document removal")
        return False
    return await pinecone_manager.delete_document(document_id, organization_id)
