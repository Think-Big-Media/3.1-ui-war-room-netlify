"""Add document intelligence tables

Revision ID: 005_document_intelligence_tables
Revises: 004_platform_admin_tables
Create Date: 2025-01-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "005_document_intelligence_tables"
down_revision = "004_platform_admin_tables"
branch_labels = None
depends_on = None


def upgrade():
    """Create document intelligence tables."""

    # Create documents table
    op.create_table(
        "documents",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "uploaded_by",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        # Document metadata
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("file_hash", sa.String(64), nullable=False, index=True),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("document_type", sa.String(20), nullable=False, default="pdf"),
        # Content information
        sa.Column("title", sa.String(500)),
        sa.Column("description", sa.Text),
        sa.Column("tags", sa.JSON, default=sa.text("'[]'::json")),
        # Processing status
        sa.Column(
            "processing_status", sa.String(20), nullable=False, default="pending"
        ),
        sa.Column("processing_started_at", sa.DateTime),
        sa.Column("processing_completed_at", sa.DateTime),
        sa.Column("processing_error", sa.Text),
        # Vector embeddings info
        sa.Column("is_vectorized", sa.Boolean, default=False, nullable=False),
        sa.Column("vector_count", sa.Integer, default=0),
        # Extracted content
        sa.Column("extracted_text", sa.Text),
        sa.Column("text_length", sa.Integer, default=0),
        sa.Column("page_count", sa.Integer),
        # Search and metadata
        sa.Column("metadata", sa.JSON, default=sa.text("'{}'::json")),
        sa.Column("search_keywords", sa.Text),
        # Audit fields
        sa.Column("created_at", sa.DateTime, default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()
        ),
        sa.Column("deleted_at", sa.DateTime),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
    )

    # Create indexes for documents table
    op.create_index(
        "idx_documents_org_status",
        "documents",
        ["organization_id", "processing_status"],
    )
    op.create_index(
        "idx_documents_org_type", "documents", ["organization_id", "document_type"]
    )
    op.create_index(
        "idx_documents_org_created", "documents", ["organization_id", "created_at"]
    )
    op.create_index(
        "idx_documents_vectorized", "documents", ["organization_id", "is_vectorized"]
    )
    op.create_index(
        "idx_documents_active", "documents", ["organization_id", "is_active"]
    )

    # Create document_chunks table
    op.create_table(
        "document_chunks",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "document_id",
            sa.String(36),
            sa.ForeignKey("documents.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        # Chunk information
        sa.Column("chunk_index", sa.Integer, nullable=False),
        sa.Column("chunk_text", sa.Text, nullable=False),
        sa.Column("chunk_length", sa.Integer, nullable=False),
        # Vector database references
        sa.Column("vector_id", sa.String(100), nullable=False, index=True),
        sa.Column("embedding_model", sa.String(50), default="text-embedding-ada-002"),
        # Positioning information
        sa.Column("page_number", sa.Integer),
        sa.Column("start_char", sa.Integer),
        sa.Column("end_char", sa.Integer),
        # Metadata
        sa.Column("metadata", sa.JSON, default=sa.text("'{}'::json")),
        sa.Column("keywords", sa.JSON, default=sa.text("'[]'::json")),
        # Timestamps
        sa.Column("created_at", sa.DateTime, default=sa.func.now(), nullable=False),
    )

    # Create indexes for document_chunks table
    op.create_index(
        "idx_chunks_document", "document_chunks", ["document_id", "chunk_index"]
    )
    op.create_index("idx_chunks_vector", "document_chunks", ["vector_id"])
    op.create_index(
        "idx_chunks_org", "document_chunks", ["organization_id", "created_at"]
    )

    # Create document_searches table
    op.create_table(
        "document_searches",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        # Search details
        sa.Column("query", sa.Text, nullable=False),
        sa.Column("query_embedding_id", sa.String(100)),
        # Results
        sa.Column("results_count", sa.Integer, nullable=False, default=0),
        sa.Column("top_score", sa.Float),
        sa.Column("avg_score", sa.Float),
        # Performance metrics
        sa.Column("search_duration_ms", sa.Integer),
        sa.Column("embedding_duration_ms", sa.Integer),
        # Results metadata
        sa.Column("result_document_ids", sa.JSON, default=sa.text("'[]'::json")),
        sa.Column("result_chunk_ids", sa.JSON, default=sa.text("'[]'::json")),
        # User interaction
        sa.Column("clicked_results", sa.JSON, default=sa.text("'[]'::json")),
        sa.Column("feedback_rating", sa.Integer),
        sa.Column("feedback_comment", sa.Text),
        # Filters applied
        sa.Column("applied_filters", sa.JSON, default=sa.text("'{}'::json")),
        # Timestamps
        sa.Column("created_at", sa.DateTime, default=sa.func.now(), nullable=False),
    )

    # Create indexes for document_searches table
    op.create_index("idx_searches_user", "document_searches", ["user_id", "created_at"])
    op.create_index(
        "idx_searches_org", "document_searches", ["organization_id", "created_at"]
    )
    op.create_index(
        "idx_searches_query", "document_searches", ["organization_id", "query"]
    )


def downgrade():
    """Drop document intelligence tables."""

    # Drop indexes first
    op.drop_index("idx_searches_query", "document_searches")
    op.drop_index("idx_searches_org", "document_searches")
    op.drop_index("idx_searches_user", "document_searches")

    op.drop_index("idx_chunks_org", "document_chunks")
    op.drop_index("idx_chunks_vector", "document_chunks")
    op.drop_index("idx_chunks_document", "document_chunks")

    op.drop_index("idx_documents_active", "documents")
    op.drop_index("idx_documents_vectorized", "documents")
    op.drop_index("idx_documents_org_created", "documents")
    op.drop_index("idx_documents_org_type", "documents")
    op.drop_index("idx_documents_org_status", "documents")

    # Drop tables
    op.drop_table("document_searches")
    op.drop_table("document_chunks")
    op.drop_table("documents")
