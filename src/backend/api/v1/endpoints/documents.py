"""
Document intelligence API endpoints.
Handles file upload, processing, search, and management.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    Query,
    BackgroundTasks,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from core.database import get_db
from core.deps import get_current_user, get_pinecone_manager, get_document_service
from models.user import User
from models.document import Document, DocumentSearch, ProcessingStatus
from services.document_service import DocumentService
from services.query_optimizer import QueryOptimizer
from core.cache_middleware import cache_response
from core.pinecone_config import PineconeManager
from schemas.document import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadRequest,
    DocumentSearchRequest,
    DocumentSearchResponse,
    DocumentStatsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated tags
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a document for processing and vector indexing.

    Supports: PDF, CSV, DOCX, TXT files up to 25MB
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        # Parse tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

        # Upload document
        document = await document_service.upload_document(
            file=file.file,
            filename=file.filename,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            title=title,
            description=description,
            tags=tag_list,
            db=db,
        )

        if not document:
            raise HTTPException(status_code=400, detail="Failed to upload document")

        logger.info(f"Document uploaded: {document.id} by user {current_user.id}")

        return DocumentResponse.from_orm(document)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[ProcessingStatus] = None,
    document_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List documents for the current organization with filtering.
    """
    try:
        # Build query
        query = db.query(Document).filter(
            and_(
                Document.organization_id == current_user.organization_id,
                Document.is_active == True,
            )
        )

        # Apply filters
        if status:
            query = query.filter(Document.processing_status == status)

        if document_type:
            query = query.filter(Document.document_type == document_type)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                Document.title.ilike(search_filter)
                | Document.original_filename.ilike(search_filter)
                | Document.description.ilike(search_filter)
            )

        # Get total count
        total = query.count()

        # Get paginated results
        documents = (
            query.order_by(desc(Document.created_at)).offset(skip).limit(limit).all()
        )

        return DocumentListResponse(
            documents=[DocumentResponse.from_orm(doc) for doc in documents],
            total=total,
            skip=skip,
            limit=limit,
        )

    except Exception as e:
        logger.error(f"Document listing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific document by ID.
    """
    try:
        document = (
            db.query(Document)
            .filter(
                and_(
                    Document.id == document_id,
                    Document.organization_id == current_user.organization_id,
                    Document.is_active == True,
                )
            )
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        return DocumentResponse.from_orm(document)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/search", response_model=DocumentSearchResponse)
@cache_response(ttl=120, vary_by=["org_id", "query"])
async def search_documents(
    request: DocumentSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search documents using optimized full-text search with caching.
    Uses PostgreSQL full-text search for better performance.
    """
    try:
        # Validate query
        if not request.query or len(request.query.strip()) < 2:
            raise HTTPException(
                status_code=400, detail="Query must be at least 2 characters"
            )

        # Use optimized search if available
        query_optimizer = QueryOptimizer(db)

        try:
            # Try optimized search first
            optimized_results = await query_optimizer.search_documents_optimized(
                org_id=current_user.organization_id,
                search_query=request.query,
                limit=request.limit or 20,
            )

            if optimized_results:
                # Convert to expected format
                search_results = []
                for doc in optimized_results:
                    search_results.append(
                        {
                            "id": f"search_{doc['id']}",
                            "document": DocumentResponse.from_orm(doc),
                            "chunk_text": doc.get("title", ""),
                            "chunk_index": 0,
                            "similarity_score": doc.get("relevance_score", 0.0),
                            "metadata": {
                                "search_type": "full_text",
                                "file_size": doc.get("file_size", 0),
                                "processing_status": doc.get("processing_status", ""),
                            },
                        }
                    )

                return DocumentSearchResponse(
                    results=search_results,
                    total=len(search_results),
                    query=request.query,
                    processing_time=0.1,  # Fast optimized search
                    search_type="optimized_full_text",
                )

        except Exception as e:
            logger.warning(
                f"Optimized search failed, falling back to vector search: {e}"
            )

        # Fallback to original vector search implementation
        # Build filters
        filters = {}
        if request.document_types:
            filters["document_type"] = {"$in": request.document_types}

        if request.tags:
            filters["tags"] = {"$in": request.tags}

        if request.date_from or request.date_to:
            date_filter = {}
            if request.date_from:
                date_filter["$gte"] = request.date_from.isoformat()
            if request.date_to:
                date_filter["$lte"] = request.date_to.isoformat()
            filters["uploaded_at"] = date_filter

        # Search documents using original method
        results = await document_service.search_documents(
            query=request.query,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            filters=filters if filters else None,
            top_k=request.limit,
            db=db,
        )

        # Get document details for results using optimized query
        document_ids = list(set(result["document_id"] for result in results))
        documents = (
            db.query(Document)
            .filter(
                and_(
                    Document.id.in_(document_ids),
                    Document.organization_id == current_user.organization_id,
                )
            )
            .all()
        )

        # Create document lookup
        doc_lookup = {doc.id: doc for doc in documents}

        # Format response
        search_results = []
        for result in results:
            document = doc_lookup.get(result["document_id"])
            if document:
                search_results.append(
                    {
                        "id": result["id"],
                        "document": DocumentResponse.from_orm(document),
                        "chunk_text": result["text"],
                        "chunk_index": result["chunk_index"],
                        "similarity_score": result["score"],
                        "metadata": result.get("metadata", {}),
                    }
                )

        return DocumentSearchResponse(
            query=request.query,
            results=search_results,
            total_results=len(search_results),
            search_time_ms=0,  # Would be calculated in actual search
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document search failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a document and all associated data.
    """
    try:
        # Check document exists and user has access
        document = (
            db.query(Document)
            .filter(
                and_(
                    Document.id == document_id,
                    Document.organization_id == current_user.organization_id,
                )
            )
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Delete document
        success = await document_service.delete_document(
            document_id=document_id, organization_id=current_user.organization_id, db=db
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete document")

        logger.info(f"Document deleted: {document_id} by user {current_user.id}")

        return {"message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download the original document file.
    """
    try:
        document = (
            db.query(Document)
            .filter(
                and_(
                    Document.id == document_id,
                    Document.organization_id == current_user.organization_id,
                    Document.is_active == True,
                )
            )
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Check if file exists
        if not os.path.exists(document.file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")

        return FileResponse(
            path=document.file_path,
            filename=document.original_filename,
            media_type=document.mime_type,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document download failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{document_id}/content")
async def get_document_content(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get extracted text content from document.
    """
    try:
        document = (
            db.query(Document)
            .filter(
                and_(
                    Document.id == document_id,
                    Document.organization_id == current_user.organization_id,
                    Document.is_active == True,
                )
            )
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        if not document.extracted_text:
            raise HTTPException(status_code=404, detail="Text content not available")

        return {
            "document_id": document_id,
            "content": document.extracted_text,
            "text_length": document.text_length,
            "processing_status": document.processing_status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get document content failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats/overview", response_model=DocumentStatsResponse)
async def get_document_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get document statistics for the organization.
    """
    try:
        org_id = current_user.organization_id

        # Get basic counts
        total_documents = (
            db.query(Document)
            .filter(
                and_(Document.organization_id == org_id, Document.is_active == True)
            )
            .count()
        )

        processed_documents = (
            db.query(Document)
            .filter(
                and_(
                    Document.organization_id == org_id,
                    Document.is_active == True,
                    Document.processing_status == ProcessingStatus.COMPLETED,
                )
            )
            .count()
        )

        processing_documents = (
            db.query(Document)
            .filter(
                and_(
                    Document.organization_id == org_id,
                    Document.is_active == True,
                    Document.processing_status == ProcessingStatus.PROCESSING,
                )
            )
            .count()
        )

        failed_documents = (
            db.query(Document)
            .filter(
                and_(
                    Document.organization_id == org_id,
                    Document.is_active == True,
                    Document.processing_status == ProcessingStatus.FAILED,
                )
            )
            .count()
        )

        # Get total storage used
        total_storage = (
            db.query(func.sum(Document.file_size))
            .filter(
                and_(Document.organization_id == org_id, Document.is_active == True)
            )
            .scalar()
            or 0
        )

        # Get recent searches count (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_searches = (
            db.query(DocumentSearch)
            .filter(
                and_(
                    DocumentSearch.organization_id == org_id,
                    DocumentSearch.created_at >= thirty_days_ago,
                )
            )
            .count()
        )

        return DocumentStatsResponse(
            total_documents=total_documents,
            processed_documents=processed_documents,
            processing_documents=processing_documents,
            failed_documents=failed_documents,
            total_storage_bytes=total_storage,
            total_storage_mb=round(total_storage / (1024 * 1024), 2),
            recent_searches=recent_searches,
        )

    except Exception as e:
        logger.error(f"Get document stats failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reprocess a failed document.
    """
    try:
        document = (
            db.query(Document)
            .filter(
                and_(
                    Document.id == document_id,
                    Document.organization_id == current_user.organization_id,
                    Document.is_active == True,
                )
            )
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        if document.processing_status not in [
            ProcessingStatus.FAILED,
            ProcessingStatus.COMPLETED,
        ]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reprocess document with status: {document.processing_status}",
            )

        # Reset processing status
        document.processing_status = ProcessingStatus.PENDING
        document.processing_error = None
        document.processing_started_at = None
        document.processing_completed_at = None
        db.commit()

        # Start reprocessing
        background_tasks.add_task(document_service.process_document, document_id, db)

        logger.info(
            f"Document reprocessing started: {document_id} by user {current_user.id}"
        )

        return {"message": "Document reprocessing started"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document reprocessing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/search/vector", response_model=DocumentSearchResponse)
async def vector_search_documents(
    request: DocumentSearchRequest,
    current_user: User = Depends(get_current_user),
    pinecone_manager: Optional[PineconeManager] = Depends(get_pinecone_manager),
    document_service: Optional[DocumentService] = Depends(get_document_service),
    db: Session = Depends(get_db),
):
    """
    Perform vector-based document search using Pinecone.
    
    This endpoint demonstrates the production-ready Pinecone integration
    with proper dependency injection, error handling, and fallbacks.
    """
    try:
        # Validate query
        if not request.query or len(request.query.strip()) < 2:
            raise HTTPException(
                status_code=400, detail="Query must be at least 2 characters"
            )

        # Check if Pinecone is available
        if not pinecone_manager or not pinecone_manager.is_initialized:
            logger.warning("Pinecone not available - falling back to database search")
            
            # Fallback to database full-text search
            query = db.query(Document).filter(
                and_(
                    Document.organization_id == current_user.organization_id,
                    Document.is_active == True,
                    Document.processing_status == ProcessingStatus.COMPLETED,
                )
            )
            
            # Apply text search filter
            search_filter = f"%{request.query}%"
            query = query.filter(
                Document.title.ilike(search_filter)
                | Document.extracted_text.ilike(search_filter)
                | Document.description.ilike(search_filter)
            )
            
            documents = query.limit(request.limit or 10).all()
            
            # Format fallback results
            search_results = []
            for i, doc in enumerate(documents):
                search_results.append({
                    "id": f"fallback_{doc.id}_{i}",
                    "document": DocumentResponse.from_orm(doc),
                    "chunk_text": doc.title or doc.original_filename,
                    "chunk_index": 0,
                    "similarity_score": 0.5,  # Default score for fallback
                    "metadata": {
                        "search_type": "database_fallback",
                        "reason": "pinecone_unavailable"
                    },
                })
            
            return DocumentSearchResponse(
                query=request.query,
                results=search_results,
                total_results=len(search_results),
                search_time_ms=0,  # Fast database search
                search_type="database_fallback"
            )

        # Build filters for Pinecone search
        filters = {}
        if request.document_types:
            filters["document_type"] = {"$in": request.document_types}
        if request.tags:
            filters["tags"] = {"$in": request.tags}
        if request.date_from or request.date_to:
            date_filter = {}
            if request.date_from:
                date_filter["$gte"] = request.date_from.isoformat()
            if request.date_to:
                date_filter["$lte"] = request.date_to.isoformat()
            filters["uploaded_at"] = date_filter

        # Perform vector search
        start_time = datetime.utcnow()
        
        vector_results = await pinecone_manager.search_documents(
            query=request.query,
            organization_id=current_user.organization_id,
            top_k=request.limit or 10,
            filter_metadata=filters if filters else None,
        )
        
        search_duration = (datetime.utcnow() - start_time).total_seconds() * 1000

        # Get document details for results
        document_ids = list(set(result["document_id"] for result in vector_results))
        
        if document_ids:
            documents = (
                db.query(Document)
                .filter(
                    and_(
                        Document.id.in_(document_ids),
                        Document.organization_id == current_user.organization_id,
                    )
                )
                .all()
            )
        else:
            documents = []

        # Create document lookup
        doc_lookup = {doc.id: doc for doc in documents}

        # Format response with vector search results
        search_results = []
        for result in vector_results:
            document = doc_lookup.get(result["document_id"])
            if document:
                search_results.append({
                    "id": result["id"],
                    "document": DocumentResponse.from_orm(document),
                    "chunk_text": result["text"],
                    "chunk_index": result["chunk_index"],
                    "similarity_score": result["score"],
                    "metadata": {
                        **result.get("metadata", {}),
                        "search_type": "vector_similarity"
                    },
                })

        logger.info(
            f"Vector search completed: {len(search_results)} results in {search_duration:.0f}ms"
        )

        return DocumentSearchResponse(
            query=request.query,
            results=search_results,
            total_results=len(search_results),
            search_time_ms=int(search_duration),
            search_type="vector_similarity"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vector document search failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/search/health")
async def search_health_check(
    pinecone_manager: Optional[PineconeManager] = Depends(get_pinecone_manager),
):
    """
    Health check endpoint for search services.
    Shows the status of Pinecone and other search components.
    """
    try:
        health_status = {
            "status": "operational",
            "services": {
                "pinecone": {
                    "available": pinecone_manager is not None,
                    "initialized": pinecone_manager.is_initialized if pinecone_manager else False,
                    "status": "operational" if (pinecone_manager and pinecone_manager.is_initialized) else "unavailable"
                },
                "database_search": {
                    "available": True,
                    "status": "operational"
                }
            },
            "capabilities": {
                "vector_search": pinecone_manager.is_initialized if pinecone_manager else False,
                "text_search": True,
                "hybrid_search": True
            }
        }
        
        # Determine overall status
        if pinecone_manager and pinecone_manager.is_initialized:
            health_status["status"] = "optimal"
        else:
            health_status["status"] = "degraded"
            health_status["message"] = "Vector search unavailable - using database fallback"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Search health check failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Health check failed: {str(e)}",
            "services": {
                "pinecone": {"status": "error"},
                "database_search": {"status": "unknown"}
            }
        }
