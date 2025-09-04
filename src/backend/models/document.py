"""
Document models for War Room platform.
Handles document storage, processing status, and metadata for vector search.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    JSON,
    Integer,
    Boolean,
    ForeignKey,
    Index,
    Float,
)
from sqlalchemy.orm import relationship
from models.base import BaseModel as Base


class DocumentType(str, Enum):
    """Document type enumeration."""

    PDF = "pdf"
    CSV = "csv"
    DOCX = "docx"
    TXT = "txt"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class ProcessingStatus(str, Enum):
    """Document processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class Document(Base):
    """
    Document model for storing uploaded files and their metadata.

    Features:
    - File metadata and storage information
    - Processing status tracking
    - Vector embedding status
    - Organization isolation
    - Audit trail
    """

    __tablename__ = "documents"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # Organization association
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Document metadata
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # Storage path
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash
    mime_type = Column(String(100), nullable=False)
    document_type = Column(String(20), nullable=False, default=DocumentType.PDF)

    # Content information
    title = Column(String(500))
    description = Column(Text)
    tags = Column(JSON, default=list)  # List of tags for categorization

    # Processing status
    processing_status = Column(
        String(20), nullable=False, default=ProcessingStatus.PENDING
    )
    processing_started_at = Column(DateTime)
    processing_completed_at = Column(DateTime)
    processing_error = Column(Text)

    # Vector embeddings info
    is_vectorized = Column(Boolean, default=False, nullable=False)
    vector_count = Column(Integer, default=0)  # Number of chunks/vectors created

    # Extracted content
    extracted_text = Column(Text)  # Full extracted text
    text_length = Column(Integer, default=0)
    page_count = Column(Integer)  # For PDFs

    # Search and metadata
    meta_data = Column(JSON, default=dict)  # Additional metadata
    search_keywords = Column(Text)  # Searchable keywords

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime)  # Soft delete
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    chunks = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_documents_org_status", "organization_id", "processing_status"),
        Index("idx_documents_org_type", "organization_id", "document_type"),
        Index("idx_documents_org_created", "organization_id", "created_at"),
        Index("idx_documents_vectorized", "organization_id", "is_vectorized"),
        Index("idx_documents_active", "organization_id", "is_active"),
    )

    @property
    def file_size_mb(self) -> float:
        """Get file size in megabytes."""
        return round(self.file_size / (1024 * 1024), 2)

    @property
    def is_processed(self) -> bool:
        """Check if document processing is complete."""
        return self.processing_status == ProcessingStatus.COMPLETED

    @property
    def processing_duration(self) -> Optional[float]:
        """Get processing duration in seconds."""
        if self.processing_started_at and self.processing_completed_at:
            return (
                self.processing_completed_at - self.processing_started_at
            ).total_seconds()
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert document to dictionary representation."""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "file_size_mb": self.file_size_mb,
            "mime_type": self.mime_type,
            "document_type": self.document_type,
            "title": self.title,
            "description": self.description,
            "tags": self.tags,
            "processing_status": self.processing_status,
            "processing_started_at": self.processing_started_at.isoformat()
            if self.processing_started_at
            else None,
            "processing_completed_at": self.processing_completed_at.isoformat()
            if self.processing_completed_at
            else None,
            "processing_error": self.processing_error,
            "is_vectorized": self.is_vectorized,
            "vector_count": self.vector_count,
            "text_length": self.text_length,
            "page_count": self.page_count,
            "metadata": self.meta_data,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active,
        }


class DocumentChunk(Base):
    """
    Document chunks for vector storage.
    Stores text chunks with their vector database references.
    """

    __tablename__ = "document_chunks"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # Document association
    document_id = Column(
        String(36), ForeignKey("documents.id"), nullable=False, index=True
    )
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )

    # Chunk information
    chunk_index = Column(Integer, nullable=False)  # Order within document
    chunk_text = Column(Text, nullable=False)
    chunk_length = Column(Integer, nullable=False)

    # Vector database references
    vector_id = Column(String(100), nullable=False, index=True)  # Pinecone vector ID
    embedding_model = Column(String(50), default="text-embedding-ada-002")

    # Positioning information
    page_number = Column(Integer)  # For PDFs
    start_char = Column(Integer)  # Character position in original text
    end_char = Column(Integer)

    # Metadata
    meta_data = Column(JSON, default=dict)
    keywords = Column(JSON, default=list)  # Extracted keywords

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
    organization = relationship("Organization")

    # Indexes
    __table_args__ = (
        Index("idx_chunks_document", "document_id", "chunk_index"),
        Index("idx_chunks_vector", "vector_id"),
        Index("idx_chunks_org", "organization_id", "created_at"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert chunk to dictionary representation."""
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "chunk_text": self.chunk_text[:200] + "..."
            if len(self.chunk_text) > 200
            else self.chunk_text,
            "chunk_length": self.chunk_length,
            "vector_id": self.vector_id,
            "page_number": self.page_number,
            "start_char": self.start_char,
            "end_char": self.end_char,
            "keywords": self.keywords,
            "created_at": self.created_at.isoformat(),
        }


class DocumentSearch(Base):
    """
    Document search history and analytics.
    Tracks search queries and results for optimization.
    """

    __tablename__ = "document_searches"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # User and organization
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )

    # Search details
    query = Column(Text, nullable=False)
    query_embedding_id = Column(String(100))  # Reference to vector used for search

    # Results
    results_count = Column(Integer, nullable=False, default=0)
    top_score = Column(Float)  # Highest similarity score
    avg_score = Column(Float)  # Average similarity score

    # Performance metrics
    search_duration_ms = Column(Integer)  # Search time in milliseconds
    embedding_duration_ms = Column(Integer)  # Embedding generation time

    # Results metadata
    result_document_ids = Column(JSON, default=list)  # Document IDs in results
    result_chunk_ids = Column(JSON, default=list)  # Chunk IDs in results

    # User interaction
    clicked_results = Column(JSON, default=list)  # Which results user clicked
    feedback_rating = Column(Integer)  # 1-5 star rating
    feedback_comment = Column(Text)

    # Filters applied
    applied_filters = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
    organization = relationship("Organization")

    # Indexes
    __table_args__ = (
        Index("idx_searches_user", "user_id", "created_at"),
        Index("idx_searches_org", "organization_id", "created_at"),
        Index("idx_searches_query", "organization_id", "query"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert search to dictionary representation."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "query": self.query,
            "results_count": self.results_count,
            "top_score": self.top_score,
            "avg_score": self.avg_score,
            "search_duration_ms": self.search_duration_ms,
            "feedback_rating": self.feedback_rating,
            "applied_filters": self.applied_filters,
            "created_at": self.created_at.isoformat(),
        }
