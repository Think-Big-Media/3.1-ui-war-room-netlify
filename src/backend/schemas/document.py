"""
Pydantic schemas for document intelligence API.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

from models.document import DocumentType, ProcessingStatus


class DocumentBase(BaseModel):
    """Base document schema."""

    title: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class DocumentUploadRequest(DocumentBase):
    """Schema for document upload request."""

    pass


class DocumentResponse(DocumentBase):
    """Schema for document response."""

    id: str
    organization_id: str
    filename: str
    original_filename: str
    file_size: int
    file_size_mb: float
    mime_type: str
    document_type: DocumentType
    processing_status: ProcessingStatus
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    processing_error: Optional[str] = None
    is_vectorized: bool
    vector_count: int
    text_length: int
    page_count: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}

    @classmethod
    def from_orm(cls, obj):
        """Convert from ORM object."""
        return cls(
            id=obj.id,
            organization_id=obj.organization_id,
            title=obj.title,
            description=obj.description,
            tags=obj.tags or [],
            filename=obj.filename,
            original_filename=obj.original_filename,
            file_size=obj.file_size,
            file_size_mb=obj.file_size_mb,
            mime_type=obj.mime_type,
            document_type=obj.document_type,
            processing_status=obj.processing_status,
            processing_started_at=obj.processing_started_at,
            processing_completed_at=obj.processing_completed_at,
            processing_error=obj.processing_error,
            is_vectorized=obj.is_vectorized,
            vector_count=obj.vector_count,
            text_length=obj.text_length,
            page_count=obj.page_count,
            metadata=obj.metadata or {},
            created_at=obj.created_at,
            updated_at=obj.updated_at,
            is_active=obj.is_active,
        )


class DocumentListResponse(BaseModel):
    """Schema for paginated document list."""

    documents: List[DocumentResponse]
    total: int
    skip: int
    limit: int


class DocumentSearchRequest(BaseModel):
    """Schema for document search request."""

    query: str = Field(..., min_length=2, max_length=500, description="Search query")
    document_types: Optional[List[DocumentType]] = Field(
        default=None, description="Filter by document types"
    )
    tags: Optional[List[str]] = Field(default=None, description="Filter by tags")
    date_from: Optional[datetime] = Field(
        default=None, description="Filter documents uploaded after this date"
    )
    date_to: Optional[datetime] = Field(
        default=None, description="Filter documents uploaded before this date"
    )
    limit: int = Field(default=10, ge=1, le=50, description="Maximum number of results")

    @validator("date_to")
    def validate_date_range(cls, v, values):
        """Validate date range."""
        if v and "date_from" in values and values["date_from"]:
            if v < values["date_from"]:
                raise ValueError("date_to must be after date_from")
        return v


class DocumentSearchResult(BaseModel):
    """Schema for individual search result."""

    id: str
    document: DocumentResponse
    chunk_text: str
    chunk_index: int
    similarity_score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentSearchResponse(BaseModel):
    """Schema for document search response."""

    query: str
    results: List[DocumentSearchResult]
    total_results: int
    search_time_ms: int


class DocumentStatsResponse(BaseModel):
    """Schema for document statistics."""

    total_documents: int
    processed_documents: int
    processing_documents: int
    failed_documents: int
    total_storage_bytes: int
    total_storage_mb: float
    recent_searches: int


class DocumentContentResponse(BaseModel):
    """Schema for document content response."""

    document_id: str
    content: str
    text_length: int
    processing_status: ProcessingStatus


class DocumentChunkResponse(BaseModel):
    """Schema for document chunk response."""

    id: str
    document_id: str
    chunk_index: int
    chunk_text: str
    chunk_length: int
    vector_id: str
    page_number: Optional[int] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    keywords: List[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentAnalyticsResponse(BaseModel):
    """Schema for document analytics."""

    document_id: str
    view_count: int
    search_count: int
    last_accessed: Optional[datetime] = None
    popular_searches: List[str] = Field(default_factory=list)
    avg_search_score: Optional[float] = None


class DocumentBatchUploadRequest(BaseModel):
    """Schema for batch document upload."""

    files: List[str] = Field(
        ..., description="List of file identifiers for batch processing"
    )
    common_tags: List[str] = Field(
        default_factory=list, description="Tags to apply to all files"
    )
    auto_process: bool = Field(
        default=True, description="Whether to start processing immediately"
    )


class DocumentBatchResponse(BaseModel):
    """Schema for batch upload response."""

    uploaded_documents: List[DocumentResponse]
    failed_uploads: List[Dict[str, str]]
    total_files: int
    successful_uploads: int
    failed_uploads_count: int


class DocumentProcessingUpdate(BaseModel):
    """Schema for real-time processing updates."""

    document_id: str
    processing_status: ProcessingStatus
    progress_percentage: Optional[int] = None
    current_step: Optional[str] = None
    error_message: Optional[str] = None
    estimated_completion: Optional[datetime] = None


class DocumentSimilarityRequest(BaseModel):
    """Schema for finding similar documents."""

    document_id: str
    limit: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class DocumentSimilarityResponse(BaseModel):
    """Schema for similar documents response."""

    source_document: DocumentResponse
    similar_documents: List[DocumentSearchResult]
    total_found: int


class DocumentExportRequest(BaseModel):
    """Schema for document export request."""

    document_ids: List[str] = Field(..., description="List of document IDs to export")
    format: str = Field(default="pdf", pattern="^(pdf|csv|json)$")
    include_content: bool = Field(
        default=True, description="Include extracted text content"
    )
    include_metadata: bool = Field(
        default=True, description="Include document metadata"
    )


class DocumentExportResponse(BaseModel):
    """Schema for document export response."""

    export_id: str
    status: str
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    file_size: Optional[int] = None


class DocumentTagsResponse(BaseModel):
    """Schema for available document tags."""

    tags: List[str]
    tag_counts: Dict[str, int]
    most_used_tags: List[str]


class DocumentTypeStatsResponse(BaseModel):
    """Schema for document type statistics."""

    document_type: DocumentType
    count: int
    total_size_bytes: int
    avg_processing_time_seconds: Optional[float] = None
    success_rate: float


class DocumentProcessingQueueResponse(BaseModel):
    """Schema for processing queue status."""

    total_in_queue: int
    processing_now: int
    estimated_wait_time_minutes: Optional[int] = None
    queue_position: Optional[int] = None


# Simplified schemas for imports compatibility
class DocumentCreate(DocumentBase):
    """Schema for creating a document."""
    pass


class DocumentUpdate(DocumentBase):
    """Schema for updating a document."""
    pass


class SearchQuery(BaseModel):
    """Simple search query schema."""
    query: str
    limit: int = 10


class SearchResponse(BaseModel):
    """Simple search response schema."""
    results: List[DocumentResponse]
    total: int
