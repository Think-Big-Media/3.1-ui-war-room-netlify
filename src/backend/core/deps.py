"""
Dependency injection for FastAPI endpoints.
Provides database connections, authentication, authorization, and services.
"""
import logging
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import database_manager

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database dependency.
    Provides an async database session for each request.
    """
    try:
        async with database_manager.get_session() as session:
            yield session
    except Exception:
        # For now, yield None if database is not available
        # This allows the service to start even without database
        yield None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Get current authenticated user.
    Returns None if no valid authentication (allows anonymous access).
    """
    if not credentials:
        return None

    # For now, return a mock user for development
    # TODO: Implement JWT token validation
    return {
        "id": 1,
        "email": "dev@warroom.app",
        "name": "Development User",
        "role": "admin",
    }


async def require_platform_admin(
    current_user: Optional[dict] = Depends(get_current_user),
) -> dict:
    """
    Require platform administrator privileges.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )

    if current_user.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform administrator privileges required",
        )

    return current_user


def require_permissions(permissions: list[str]):
    """
    Decorator that requires specific permissions.
    For now, just requires authentication.
    """
    async def permission_checker(
        current_user: Optional[dict] = Depends(get_current_user)
    ) -> dict:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Authentication required"
            )
        
        # TODO: Implement permission checking
        # For now, allow all authenticated users
        return current_user
    
    return permission_checker


# Service Dependencies
async def get_pinecone_manager():
    """
    Get Pinecone manager dependency.
    Provides access to Pinecone vector database operations.
    """
    try:
        from core.pinecone_config import pinecone_manager
        
        # Check if Pinecone is properly initialized
        if not pinecone_manager or not pinecone_manager.pc:
            logger.warning("Pinecone manager not initialized - vector operations will be disabled")
            return None
            
        return pinecone_manager
        
    except ImportError:
        logger.warning("Pinecone dependencies not available - vector operations will be disabled")
        return None
    except Exception as e:
        logger.error(f"Failed to get Pinecone manager: {str(e)}")
        return None


async def get_document_service():
    """
    Get document service dependency.
    Provides access to document processing and search operations.
    """
    try:
        from services.document_service import document_service
        return document_service
    except ImportError:
        logger.warning("Document service not available")
        return None
    except Exception as e:
        logger.error(f"Failed to get document service: {str(e)}")
        return None
