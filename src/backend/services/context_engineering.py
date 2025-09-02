"""
Context Engineering RAG Service
Handles document chunking, embedding, and retrieval for AI agent context
"""

from typing import List, Dict, Any, Optional, Tuple
import os
import asyncio
from dataclasses import dataclass
from enum import Enum

import openai
import pinecone
from sentence_transformers import CrossEncoder
import tiktoken
from supabase import create_client, Client

from core.config import get_settings

import logging
logger = logging.getLogger(__name__)
settings = get_settings()


class ChunkingStrategy(Enum):
    """Available chunking strategies"""

    CONTEXTUAL = "contextual"
    SEMANTIC = "semantic"
    FIXED_SIZE = "fixed_size"


@dataclass
class DocumentChunk:
    """Represents a document chunk with metadata"""

    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None
    chunk_index: int = 0
    source_document: str = ""
    context_prefix: str = ""
    context_suffix: str = ""


@dataclass
class RetrievalResult:
    """Represents a retrieval result with relevance score"""

    chunk: DocumentChunk
    score: float
    rank: int
    source: str  # 'semantic', 'keyword', 'hybrid'


class ContextEngineering:
    """Main context engineering service for RAG operations"""

    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
        )
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        # Initialize Pinecone
        pinecone.init(
            api_key=settings.PINECONE_API_KEY, environment=settings.PINECONE_ENVIRONMENT
        )
        self.pinecone_index = pinecone.Index(settings.PINECONE_INDEX_NAME)

        # Initialize reranking model
        self.reranker = (
            CrossEncoder(settings.RERANKING_MODEL)
            if settings.RERANKING_ENABLED
            else None
        )

        # Initialize tokenizer for chunking
        self.tokenizer = tiktoken.encoding_for_model(settings.OPENAI_MODEL_EMBEDDING)

        # Chunking configuration
        self.max_chunk_size = settings.MAX_CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP
        self.chunking_strategy = ChunkingStrategy(settings.CHUNKING_STRATEGY)

    async def chunk_document(
        self, content: str, source_document: str, metadata: Dict[str, Any] = None
    ) -> List[DocumentChunk]:
        """
        Chunk a document using the configured strategy with contextual information
        """
        if metadata is None:
            metadata = {}

        try:
            if self.chunking_strategy == ChunkingStrategy.CONTEXTUAL:
                return await self._chunk_with_context(
                    content, source_document, metadata
                )
            elif self.chunking_strategy == ChunkingStrategy.SEMANTIC:
                return await self._chunk_semantic(content, source_document, metadata)
            else:
                return await self._chunk_fixed_size(content, source_document, metadata)
        except Exception as e:
            logger.error(f"Error chunking document {source_document}: {str(e)}")
            raise

    async def _chunk_with_context(
        self, content: str, source_document: str, metadata: Dict[str, Any]
    ) -> List[DocumentChunk]:
        """
        Chunk with contextual information (Anthropic-style)
        Prepend each chunk with preceding context for better embeddings
        """
        chunks = []

        # Split content into logical sections (paragraphs, headers, etc.)
        sections = self._split_into_sections(content)

        current_chunk = ""
        current_tokens = 0
        chunk_index = 0

        for i, section in enumerate(sections):
            section_tokens = len(self.tokenizer.encode(section))

            # If adding this section would exceed max size, finalize current chunk
            if current_tokens + section_tokens > self.max_chunk_size and current_chunk:
                # Create contextual chunk
                chunk = await self._create_contextual_chunk(
                    current_chunk, sections, i, chunk_index, source_document, metadata
                )
                chunks.append(chunk)

                # Start new chunk with overlap
                overlap_content = self._get_overlap_content(
                    current_chunk, self.chunk_overlap
                )
                current_chunk = overlap_content + section
                current_tokens = len(self.tokenizer.encode(current_chunk))
                chunk_index += 1
            else:
                current_chunk += section
                current_tokens += section_tokens

        # Add final chunk if any content remains
        if current_chunk.strip():
            chunk = await self._create_contextual_chunk(
                current_chunk,
                sections,
                len(sections),
                chunk_index,
                source_document,
                metadata,
            )
            chunks.append(chunk)

        logger.info(f"Created {len(chunks)} contextual chunks for {source_document}")
        return chunks

    async def _create_contextual_chunk(
        self,
        content: str,
        all_sections: List[str],
        current_section_index: int,
        chunk_index: int,
        source_document: str,
        metadata: Dict[str, Any],
    ) -> DocumentChunk:
        """Create a chunk with contextual prefix and suffix"""

        # Create context prefix (architectural headers, preceding content)
        context_prefix = self._get_context_prefix(all_sections, current_section_index)

        # Create context suffix (following content summary)
        context_suffix = self._get_context_suffix(all_sections, current_section_index)

        # Generate unique ID
        chunk_id = f"{source_document}_{chunk_index}_{hash(content[:50])}"

        # Enhanced metadata
        enhanced_metadata = {
            **metadata,
            "chunk_index": chunk_index,
            "total_chunks": len(all_sections),
            "source_document": source_document,
            "context_type": "contextual",
            "section_index": current_section_index,
            "content_length": len(content),
            "token_count": len(self.tokenizer.encode(content)),
        }

        return DocumentChunk(
            id=chunk_id,
            content=content,
            metadata=enhanced_metadata,
            chunk_index=chunk_index,
            source_document=source_document,
            context_prefix=context_prefix,
            context_suffix=context_suffix,
        )

    def _split_into_sections(self, content: str) -> List[str]:
        """Split content into logical sections"""
        # Split by double newlines (paragraphs)
        sections = content.split("\n\n")

        # Further split long sections
        processed_sections = []
        for section in sections:
            if len(self.tokenizer.encode(section)) > self.max_chunk_size:
                # Split long sections by sentences
                sentences = section.split(". ")
                current_section = ""

                for sentence in sentences:
                    if (
                        len(self.tokenizer.encode(current_section + sentence))
                        > self.max_chunk_size
                    ):
                        if current_section:
                            processed_sections.append(current_section.strip())
                        current_section = sentence
                    else:
                        current_section += sentence + ". "

                if current_section:
                    processed_sections.append(current_section.strip())
            else:
                processed_sections.append(section.strip())

        return [s for s in processed_sections if s]

    def _get_context_prefix(self, sections: List[str], current_index: int) -> str:
        """Get contextual prefix for better embedding"""
        if current_index == 0:
            return ""

        # Get previous section as context
        prev_section = sections[current_index - 1] if current_index > 0 else ""

        # Limit prefix to reasonable size
        prefix_tokens = len(self.tokenizer.encode(prev_section))
        if prefix_tokens > 100:  # Limit context prefix
            # Take last 100 tokens
            tokens = self.tokenizer.encode(prev_section)
            prev_section = self.tokenizer.decode(tokens[-100:])

        return f"[Previous context: {prev_section}]"

    def _get_context_suffix(self, sections: List[str], current_index: int) -> str:
        """Get contextual suffix for better embedding"""
        if current_index >= len(sections) - 1:
            return ""

        # Get next section as context
        next_section = (
            sections[current_index + 1] if current_index < len(sections) - 1 else ""
        )

        # Limit suffix to reasonable size
        suffix_tokens = len(self.tokenizer.encode(next_section))
        if suffix_tokens > 100:  # Limit context suffix
            # Take first 100 tokens
            tokens = self.tokenizer.encode(next_section)
            next_section = self.tokenizer.decode(tokens[:100])

        return f"[Following context: {next_section}]"

    def _get_overlap_content(self, content: str, overlap_size: int) -> str:
        """Get overlap content for chunk continuity"""
        tokens = self.tokenizer.encode(content)
        if len(tokens) <= overlap_size:
            return content

        overlap_tokens = tokens[-overlap_size:]
        return self.tokenizer.decode(overlap_tokens)

    async def _chunk_semantic(
        self, content: str, source_document: str, metadata: Dict[str, Any]
    ) -> List[DocumentChunk]:
        """Semantic chunking (placeholder - would need semantic similarity analysis)"""
        # For now, fall back to fixed size
        return await self._chunk_fixed_size(content, source_document, metadata)

    async def _chunk_fixed_size(
        self, content: str, source_document: str, metadata: Dict[str, Any]
    ) -> List[DocumentChunk]:
        """Fixed-size chunking"""
        chunks = []
        tokens = self.tokenizer.encode(content)

        for i in range(0, len(tokens), self.max_chunk_size - self.chunk_overlap):
            chunk_tokens = tokens[i : i + self.max_chunk_size]
            chunk_content = self.tokenizer.decode(chunk_tokens)

            chunk_id = (
                f"{source_document}_{i // (self.max_chunk_size - self.chunk_overlap)}"
            )

            chunk = DocumentChunk(
                id=chunk_id,
                content=chunk_content,
                metadata={
                    **metadata,
                    "chunk_index": i // (self.max_chunk_size - self.chunk_overlap),
                    "source_document": source_document,
                    "context_type": "fixed_size",
                },
                chunk_index=i // (self.max_chunk_size - self.chunk_overlap),
                source_document=source_document,
            )
            chunks.append(chunk)

        return chunks

    async def embed_chunks(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """Generate embeddings for chunks"""
        try:
            # Prepare content for embedding (include context)
            embed_content = []
            for chunk in chunks:
                # Combine context prefix, content, and context suffix
                full_content = f"{chunk.context_prefix} {chunk.content} {chunk.context_suffix}".strip()
                embed_content.append(full_content)

            # Generate embeddings in batches
            batch_size = 100
            for i in range(0, len(embed_content), batch_size):
                batch = embed_content[i : i + batch_size]

                response = await self.openai_client.embeddings.create(
                    model=settings.OPENAI_MODEL_EMBEDDING, input=batch
                )

                # Assign embeddings to chunks
                for j, embedding_data in enumerate(response.data):
                    chunk_index = i + j
                    if chunk_index < len(chunks):
                        chunks[chunk_index].embedding = embedding_data.embedding

            logger.info(f"Generated embeddings for {len(chunks)} chunks")
            return chunks

        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise

    async def store_chunks(
        self, chunks: List[DocumentChunk], namespace: str = "default"
    ) -> bool:
        """Store chunks in vector database"""
        try:
            # Prepare vectors for Pinecone
            vectors = []
            for chunk in chunks:
                if chunk.embedding:
                    vectors.append(
                        {
                            "id": chunk.id,
                            "values": chunk.embedding,
                            "metadata": {
                                **chunk.metadata,
                                "content": chunk.content,
                                "context_prefix": chunk.context_prefix,
                                "context_suffix": chunk.context_suffix,
                            },
                        }
                    )

            # Upsert to Pinecone
            self.pinecone_index.upsert(vectors=vectors, namespace=namespace)

            # Also store in Supabase for keyword search
            await self._store_chunks_supabase(chunks)

            logger.info(f"Stored {len(chunks)} chunks in vector database")
            return True

        except Exception as e:
            logger.error(f"Error storing chunks: {str(e)}")
            raise

    async def _store_chunks_supabase(self, chunks: List[DocumentChunk]):
        """Store chunks in Supabase for keyword search"""
        try:
            chunk_data = []
            for chunk in chunks:
                chunk_data.append(
                    {
                        "id": chunk.id,
                        "content": chunk.content,
                        "metadata": chunk.metadata,
                        "source_document": chunk.source_document,
                        "chunk_index": chunk.chunk_index,
                        "context_prefix": chunk.context_prefix,
                        "context_suffix": chunk.context_suffix,
                        "created_at": "NOW()",
                    }
                )

            # Insert chunks in batches
            batch_size = 100
            for i in range(0, len(chunk_data), batch_size):
                batch = chunk_data[i : i + batch_size]
                result = self.supabase.table("document_chunks").insert(batch).execute()

                if result.error:
                    logger.error(f"Error inserting chunks to Supabase: {result.error}")
                    raise Exception(f"Supabase error: {result.error}")

        except Exception as e:
            logger.error(f"Error storing chunks in Supabase: {str(e)}")
            raise

    async def hybrid_search(
        self,
        query: str,
        namespace: str = "default",
        top_k: int = 10,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3,
    ) -> List[RetrievalResult]:
        """
        Perform hybrid search combining semantic and keyword search
        """
        try:
            # Perform semantic search
            semantic_results = await self._semantic_search(query, namespace, top_k * 2)

            # Perform keyword search
            keyword_results = await self._keyword_search(query, top_k * 2)

            # Combine and rerank results
            combined_results = await self._combine_and_rerank(
                semantic_results,
                keyword_results,
                query,
                semantic_weight,
                keyword_weight,
                top_k,
            )

            return combined_results

        except Exception as e:
            logger.error(f"Error in hybrid search: {str(e)}")
            raise

    async def _semantic_search(
        self, query: str, namespace: str, top_k: int
    ) -> List[RetrievalResult]:
        """Perform semantic search using vector similarity"""
        try:
            # Generate query embedding
            response = await self.openai_client.embeddings.create(
                model=settings.OPENAI_MODEL_EMBEDDING, input=query
            )
            query_embedding = response.data[0].embedding

            # Search Pinecone
            results = self.pinecone_index.query(
                vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                include_metadata=True,
            )

            # Convert to RetrievalResult
            retrieval_results = []
            for i, match in enumerate(results.matches):
                chunk = DocumentChunk(
                    id=match.id,
                    content=match.metadata.get("content", ""),
                    metadata=match.metadata,
                    chunk_index=match.metadata.get("chunk_index", 0),
                    source_document=match.metadata.get("source_document", ""),
                    context_prefix=match.metadata.get("context_prefix", ""),
                    context_suffix=match.metadata.get("context_suffix", ""),
                )

                retrieval_results.append(
                    RetrievalResult(
                        chunk=chunk, score=match.score, rank=i + 1, source="semantic"
                    )
                )

            return retrieval_results

        except Exception as e:
            logger.error(f"Error in semantic search: {str(e)}")
            raise

    async def _keyword_search(self, query: str, top_k: int) -> List[RetrievalResult]:
        """Perform keyword search using full-text search"""
        try:
            # Use Supabase full-text search
            result = (
                self.supabase.table("document_chunks")
                .select("*")
                .text_search("content", query, type="websearch", config="english")
                .limit(top_k)
                .execute()
            )

            if result.error:
                logger.error(f"Keyword search error: {result.error}")
                return []

            retrieval_results = []
            for i, row in enumerate(result.data):
                chunk = DocumentChunk(
                    id=row["id"],
                    content=row["content"],
                    metadata=row["metadata"],
                    chunk_index=row["chunk_index"],
                    source_document=row["source_document"],
                    context_prefix=row.get("context_prefix", ""),
                    context_suffix=row.get("context_suffix", ""),
                )

                retrieval_results.append(
                    RetrievalResult(
                        chunk=chunk,
                        score=1.0,  # Placeholder score
                        rank=i + 1,
                        source="keyword",
                    )
                )

            return retrieval_results

        except Exception as e:
            logger.error(f"Error in keyword search: {str(e)}")
            return []

    async def _combine_and_rerank(
        self,
        semantic_results: List[RetrievalResult],
        keyword_results: List[RetrievalResult],
        query: str,
        semantic_weight: float,
        keyword_weight: float,
        top_k: int,
    ) -> List[RetrievalResult]:
        """Combine semantic and keyword results and rerank"""

        # Create combined results dictionary
        combined_results = {}

        # Add semantic results
        for result in semantic_results:
            combined_results[result.chunk.id] = result
            result.score *= semantic_weight

        # Add keyword results (merge if already exists)
        for result in keyword_results:
            if result.chunk.id in combined_results:
                # Combine scores
                combined_results[result.chunk.id].score += result.score * keyword_weight
                combined_results[result.chunk.id].source = "hybrid"
            else:
                result.score *= keyword_weight
                combined_results[result.chunk.id] = result

        # Convert to list and sort by score
        all_results = list(combined_results.values())
        all_results.sort(key=lambda x: x.score, reverse=True)

        # Apply reranking if enabled
        if self.reranker and len(all_results) > 1:
            all_results = await self._rerank_results(all_results, query)

        # Update ranks and return top_k
        for i, result in enumerate(all_results[:top_k]):
            result.rank = i + 1

        return all_results[:top_k]

    async def _rerank_results(
        self, results: List[RetrievalResult], query: str
    ) -> List[RetrievalResult]:
        """Rerank results using cross-encoder model"""
        try:
            # Prepare query-document pairs
            pairs = [(query, result.chunk.content) for result in results]

            # Get reranking scores
            scores = self.reranker.predict(pairs)

            # Update scores and sort
            for i, result in enumerate(results):
                result.score = float(scores[i])

            results.sort(key=lambda x: x.score, reverse=True)
            return results

        except Exception as e:
            logger.error(f"Error in reranking: {str(e)}")
            return results

    async def get_relevant_context(
        self, query: str, namespace: str = "default", max_context_length: int = None
    ) -> Dict[str, Any]:
        """
        Get relevant context for a query, optimized for agent consumption
        """
        if max_context_length is None:
            max_context_length = settings.AGENT_MAX_CONTEXT

        try:
            # Perform hybrid search
            results = await self.hybrid_search(query, namespace, top_k=20)

            # Select best results within context length
            selected_results = []
            current_length = 0

            for result in results:
                chunk_length = len(result.chunk.content)
                if current_length + chunk_length <= max_context_length:
                    selected_results.append(result)
                    current_length += chunk_length
                else:
                    break

            # Prepare context for agent
            context = {
                "query": query,
                "total_results": len(results),
                "selected_results": len(selected_results),
                "context_length": current_length,
                "chunks": [],
            }

            for result in selected_results:
                context["chunks"].append(
                    {
                        "id": result.chunk.id,
                        "content": result.chunk.content,
                        "score": result.score,
                        "rank": result.rank,
                        "source": result.source,
                        "metadata": result.chunk.metadata,
                        "source_document": result.chunk.source_document,
                    }
                )

            return context

        except Exception as e:
            logger.error(f"Error getting relevant context: {str(e)}")
            raise


# Initialize global instance
context_engineering = ContextEngineering()
