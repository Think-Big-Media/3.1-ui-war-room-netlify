# War Room Integration Documentation

This document provides comprehensive information about all third-party integrations and services used in the War Room platform.

## Table of Contents

- [Pinecone Vector Database](#pinecone-vector-database)
- [OpenAI Integration](#openai-integration)
- [Supabase](#supabase)
- [PostHog Analytics](#posthog-analytics)
- [Meta Business API](#meta-business-api)
- [Google Ads API](#google-ads-api)

---

## Pinecone Vector Database

### Overview

Pinecone is used as the primary vector database for War Room's Document Intelligence system. It enables semantic search and similarity matching across uploaded documents, providing AI-powered insights and content discovery capabilities.

**Primary Use Cases:**
- Document embedding storage and retrieval
- Semantic search across campaign documents
- Policy analysis and content recommendations
- AI-powered document intelligence features

### Architecture Integration

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   War Room      │    │   Pinecone       │    │   OpenAI        │
│   Backend       │◄──►│   Vector DB      │    │   Embeddings    │
│                 │    │                  │    │   API           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Metadata)    │ 
└─────────────────┘
```

**Data Flow:**
1. Documents uploaded to War Room
2. Text extracted and chunked
3. OpenAI generates embeddings
4. Vectors stored in Pinecone with metadata
5. PostgreSQL maintains document metadata
6. Search queries use vector similarity matching

### Environment Variables

```bash
# Required Environment Variables
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1  # Your Pinecone region
PINECONE_INDEX_NAME=warroom-documents  # Default index name
PINECONE_INDEX_HOST=  # Optional: specific index host URL

# OpenAI Integration (required for embeddings)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL_EMBEDDING=text-embedding-ada-002  # Default embedding model
OPENAI_MODEL_CHAT=gpt-4  # For chat completions
```

### Configuration Details

**Index Configuration:**
- **Dimension**: 1536 (OpenAI text-embedding-ada-002)
- **Metric**: cosine similarity
- **Cloud**: AWS (configurable)
- **Region**: us-east-1 (default)
- **Spec**: Serverless (auto-scaling)

**Namespace Strategy:**
- Organization isolation: `org_{organization_id}`
- Prevents cross-organization data access
- Enables multi-tenant architecture

### Code Examples

#### Basic Usage

```python
from core.pinecone_config import pinecone_manager

# Initialize (happens automatically at startup)
await pinecone_manager.initialize()

# Store document
success = await pinecone_manager.upsert_document(
    document_id="doc_123",
    text_chunks=["Chapter 1 content...", "Chapter 2 content..."],
    metadata={
        "title": "Policy Document",
        "document_type": "policy",
        "uploaded_at": "2024-01-01T00:00:00Z"
    },
    organization_id="org_456"
)

# Search documents  
results = await pinecone_manager.search_documents(
    query="healthcare policy recommendations",
    organization_id="org_456",
    top_k=5,
    filter_metadata={"document_type": "policy"}
)
```

#### Advanced Search with Filters

```python
# Complex search with metadata filtering
results = await pinecone_manager.search_documents(
    query="campaign strategy",
    organization_id="org_123",
    top_k=10,
    filter_metadata={
        "document_type": {"$in": ["strategy", "analysis"]},
        "uploaded_at": {"$gte": "2024-01-01T00:00:00Z"},
        "tags": {"$in": ["priority", "active"]}
    }
)

# Process results
for result in results:
    print(f"Document: {result['document_id']}")
    print(f"Similarity: {result['score']:.3f}")
    print(f"Text: {result['text'][:100]}...")
    print(f"Metadata: {result['metadata']}")
```

#### Helper Functions

```python
from core.pinecone_config import (
    store_document,
    search_similar_documents,
    remove_document
)

# Simplified API
await store_document(
    document_id="doc_789",
    text_chunks=chunks,
    metadata=metadata,
    organization_id="org_123"
)

# Search with automatic fallback
results = await search_similar_documents(
    query="voter outreach strategies",
    organization_id="org_123",
    top_k=5
)
```

### Common Operations

#### Document Lifecycle

```python
# 1. Upload and Index
document_chunks = await extract_text_chunks(uploaded_file)
await pinecone_manager.upsert_document(
    document_id=document.id,
    text_chunks=document_chunks,
    metadata={
        "title": document.title,
        "document_type": document.document_type,
        "file_size": document.file_size,
        "uploaded_at": document.created_at.isoformat(),
        "tags": document.tags
    },
    organization_id=document.organization_id
)

# 2. Search and Retrieve
search_results = await pinecone_manager.search_documents(
    query=user_query,
    organization_id=current_user.organization_id,
    top_k=20
)

# 3. Update Document
# Delete old vectors first
await pinecone_manager.delete_document(document_id, organization_id)
# Re-upload with new content
await pinecone_manager.upsert_document(...)

# 4. Delete Document
await pinecone_manager.delete_document(document_id, organization_id)
```

#### Health Monitoring

```python
# Check Pinecone status
if pinecone_manager.is_initialized:
    stats = pinecone_manager.get_index_stats(organization_id)
    print(f"Vectors stored: {stats['total_vectors']}")
    print(f"Index fullness: {stats['index_fullness']}")
else:
    print("Pinecone not available - using fallback search")
```

### API Endpoints

#### Vector Search Endpoint

```python
# POST /api/v1/documents/search/vector
{
    "query": "healthcare policy analysis",
    "limit": 10,
    "document_types": ["policy", "research"],
    "tags": ["healthcare", "priority"],
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
    "query": "healthcare policy analysis",
    "results": [
        {
            "id": "doc_123_chunk_0",
            "document": {
                "id": "doc_123",
                "title": "Healthcare Policy Framework",
                "document_type": "policy"
            },
            "chunk_text": "The healthcare policy framework...",
            "chunk_index": 0,
            "similarity_score": 0.89,
            "metadata": {
                "search_type": "vector_similarity"
            }
        }
    ],
    "total_results": 5,
    "search_time_ms": 245,
    "search_type": "vector_similarity"
}
```

#### Health Check Endpoint

```python
# GET /api/v1/documents/search/health
{
    "status": "optimal",
    "services": {
        "pinecone": {
            "available": true,
            "initialized": true,
            "status": "operational"
        },
        "database_search": {
            "available": true,
            "status": "operational"
        }
    },
    "capabilities": {
        "vector_search": true,
        "text_search": true,
        "hybrid_search": true
    }
}
```

### Error Handling and Fallbacks

#### Graceful Degradation

```python
async def search_with_fallback(query, organization_id):
    try:
        # Primary: Vector search
        if pinecone_manager.is_initialized:
            return await pinecone_manager.search_documents(
                query, organization_id
            )
    except Exception as e:
        logger.warning(f"Vector search failed: {e}")
    
    # Fallback: Database full-text search
    return await database_text_search(query, organization_id)
```

#### Error Types and Handling

```python
from pinecone.exceptions import PineconeException

try:
    results = await pinecone_manager.search_documents(...)
except PineconeException as e:
    logger.error(f"Pinecone API error: {e}")
    # Use fallback search
except openai.RateLimitError:
    logger.warning("OpenAI rate limit hit - queuing for retry")
    # Implement exponential backoff
except Exception as e:
    logger.error(f"Unexpected error in vector search: {e}")
    # Return empty results or fallback
```

### Performance Optimization

#### Chunking Strategy

```python
def chunk_document(text: str, chunk_size: int = 1000, overlap: int = 200):
    """
    Split document into overlapping chunks for better search coverage.
    
    Args:
        text: Document text
        chunk_size: Maximum chunk size in characters
        overlap: Overlap between chunks
    """
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Find sentence boundary
        if end < len(text):
            last_period = chunk.rfind('.')
            if last_period > chunk_size * 0.7:  # At least 70% of chunk
                end = start + last_period + 1
                chunk = text[start:end]
        
        chunks.append(chunk.strip())
        start = end - overlap
    
    return chunks
```

#### Batch Operations

```python
async def bulk_upsert_documents(documents, organization_id):
    """Efficiently upload multiple documents."""
    batch_size = 100  # Pinecone batch limit
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        vectors = []
        
        for doc in batch:
            embedding = await pinecone_manager.generate_embedding(doc.text)
            vectors.append({
                "id": f"{doc.id}_chunk_0",
                "values": embedding,
                "metadata": doc.metadata
            })
        
        # Batch upsert
        pinecone_manager.index.upsert(
            vectors=vectors,
            namespace=f"org_{organization_id}"
        )
```

### Security Considerations

#### Data Isolation

- **Namespace separation**: Each organization has isolated namespace
- **API key security**: Keys stored as environment variables only
- **Metadata filtering**: Prevents cross-organization access
- **Audit logging**: All operations logged for compliance

#### Access Control

```python
def verify_organization_access(user_org_id, document_org_id):
    """Ensure user can only access their organization's data."""
    if user_org_id != document_org_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: Document not in user's organization"
        )
```

#### Data Privacy

- **No sensitive data in metadata**: Personal information excluded
- **Text preview limits**: Only first 1000 chars stored in metadata
- **Deletion compliance**: Complete vector removal on document deletion

### Migration from v2 to v7 SDK

#### Key Changes

1. **Import Structure**:
   ```python
   # Old (v2)
   import pinecone
   pinecone.init(api_key="...", environment="...")
   
   # New (v7)
   from pinecone import Pinecone
   pc = Pinecone(api_key="...")
   ```

2. **Index Creation**:
   ```python
   # Old (v2)
   pinecone.create_index("index-name", dimension=1536)
   
   # New (v7)
   from pinecone import ServerlessSpec
   pc.create_index(
       name="index-name",
       dimension=1536,
       spec=ServerlessSpec(cloud="aws", region="us-east-1")
   )
   ```

3. **Index Operations**:
   ```python
   # Old (v2)
   index = pinecone.Index("index-name")
   
   # New (v7)
   index = pc.Index("index-name")
   ```

### Troubleshooting Guide

#### Common Issues

1. **"Index not found" error**:
   ```bash
   # Check if index exists
   python -c "from core.pinecone_config import pinecone_manager; print(pinecone_manager.pc.list_indexes())"
   ```

2. **Authentication failures**:
   ```bash
   # Verify API key
   echo $PINECONE_API_KEY | cut -c1-8
   ```

3. **Embedding generation failures**:
   ```bash
   # Test OpenAI connection
   python src/backend/test_pinecone_installation.py
   ```

4. **Slow search performance**:
   - Check index statistics for fullness
   - Consider increasing `top_k` limit
   - Optimize metadata filters

#### Debug Commands

```bash
# Test full installation
cd src/backend
python test_pinecone_installation.py

# Check index health
curl "https://war-room-oa9t.onrender.com/api/v1/documents/search/health"

# Manual embedding test
python -c "
from core.pinecone_config import PineconeManager
import asyncio
async def test():
    manager = PineconeManager()
    await manager.initialize()
    embedding = await manager.generate_embedding('test text')
    print(f'Embedding dimension: {len(embedding)}')
asyncio.run(test())
"
```

### Monitoring and Alerts

#### Key Metrics

- **Vector count per organization**
- **Search response times**
- **Embedding generation latency**
- **Error rates and types**
- **API quota usage**

#### Health Check Integration

The system includes automatic health monitoring:

```python
# Automated health checks every 5 minutes
async def check_pinecone_health():
    try:
        # Test connection
        await pinecone_manager.initialize()
        
        # Test search
        test_results = await pinecone_manager.search_documents(
            query="health check",
            organization_id="system",
            top_k=1
        )
        
        return {"status": "healthy", "response_time": "< 500ms"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### Cost Optimization

#### Best Practices

1. **Efficient chunking**: Balance between search quality and storage cost
2. **Metadata optimization**: Store only essential metadata
3. **Cleanup policies**: Regular deletion of outdated documents
4. **Batch operations**: Reduce API call overhead

#### Usage Monitoring

```python
def log_usage_metrics(operation, vector_count, metadata_size):
    """Track Pinecone usage for cost analysis."""
    logger.info(f"Pinecone {operation}: {vector_count} vectors, {metadata_size} bytes metadata")
```

---

## OpenAI Integration

*[Additional integration documentation sections would follow...]*

## Supabase

*[Documentation for Supabase integration...]*

## PostHog Analytics

*[Documentation for PostHog integration...]*

## Meta Business API

*[Documentation for Meta API integration...]*

## Google Ads API

*[Documentation for Google Ads integration...]*

---

## Support and Documentation

For additional support:

- **Pinecone Documentation**: https://docs.pinecone.io/
- **OpenAI API Documentation**: https://platform.openai.com/docs
- **War Room API Documentation**: https://war-room-oa9t.onrender.com/docs
- **Internal Support**: Contact the development team via Linear

---

*Last updated: August 2025*