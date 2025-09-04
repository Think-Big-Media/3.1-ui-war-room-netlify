"""
Example FastAPI endpoints for volunteer management.
Shows patterns for CRUD operations, pagination, filtering, and error handling.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.auth import get_current_user
from app.models import Volunteer, User
from app.schemas import VolunteerCreate, VolunteerUpdate, VolunteerResponse
from app.utils.pagination import paginate

router = APIRouter(prefix="/api/v1/volunteers", tags=["volunteers"])


class VolunteerFilters(BaseModel):
    """Query parameters for filtering volunteers."""
    status: Optional[str] = Query(None, description="Filter by status (active, inactive)")
    skills: Optional[List[str]] = Query(None, description="Filter by skills")
    availability: Optional[str] = Query(None, description="Filter by availability")
    search: Optional[str] = Query(None, description="Search by name or email")


@router.get("/", response_model=List[VolunteerResponse])
async def get_volunteers(
    filters: VolunteerFilters = Depends(),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve volunteers with optional filtering and pagination.
    
    Args:
        filters: Query parameters for filtering results
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of volunteers matching the criteria
    """
    query = db.query(Volunteer)
    
    # Apply filters
    if filters.status:
        query = query.filter(Volunteer.status == filters.status)
    
    if filters.skills:
        query = query.filter(Volunteer.skills.contains(filters.skills))
    
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            (Volunteer.first_name.ilike(search_term)) |
            (Volunteer.last_name.ilike(search_term)) |
            (Volunteer.email.ilike(search_term))
        )
    
    # Apply pagination
    volunteers = query.offset(skip).limit(limit).all()
    
    return volunteers


@router.post("/", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer(
    volunteer: VolunteerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new volunteer.
    
    Args:
        volunteer: Volunteer data
        current_user: Authenticated user (must have appropriate permissions)
        db: Database session
        
    Returns:
        Created volunteer
        
    Raises:
        HTTPException: If volunteer with email already exists
    """
    # Check if volunteer already exists
    existing = db.query(Volunteer).filter(Volunteer.email == volunteer.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Volunteer with this email already exists"
        )
    
    # Create new volunteer
    db_volunteer = Volunteer(
        **volunteer.dict(),
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    
    return db_volunteer


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(
    volunteer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific volunteer by ID.
    
    Args:
        volunteer_id: ID of the volunteer to retrieve
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Volunteer details
        
    Raises:
        HTTPException: If volunteer not found
    """
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )
    
    return volunteer


@router.patch("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: int,
    volunteer_update: VolunteerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a volunteer's information.
    
    Args:
        volunteer_id: ID of the volunteer to update
        volunteer_update: Fields to update
        current_user: Authenticated user (must have appropriate permissions)
        db: Database session
        
    Returns:
        Updated volunteer
        
    Raises:
        HTTPException: If volunteer not found
    """
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )
    
    # Update only provided fields
    update_data = volunteer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(volunteer, field, value)
    
    volunteer.updated_at = datetime.utcnow()
    volunteer.updated_by = current_user.id
    
    db.commit()
    db.refresh(volunteer)
    
    return volunteer


@router.delete("/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer(
    volunteer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a volunteer (soft delete).
    
    Args:
        volunteer_id: ID of the volunteer to delete
        current_user: Authenticated user (must have admin permissions)
        db: Database session
        
    Raises:
        HTTPException: If volunteer not found or insufficient permissions
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    
    if not volunteer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found"
        )
    
    # Soft delete
    volunteer.is_deleted = True
    volunteer.deleted_at = datetime.utcnow()
    volunteer.deleted_by = current_user.id
    
    db.commit()
    
    return None


@router.post("/{volunteer_id}/assign-task")
async def assign_task_to_volunteer(
    volunteer_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a task to a volunteer.
    
    Args:
        volunteer_id: ID of the volunteer
        task_id: ID of the task to assign
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Assignment confirmation
    """
    # Implementation would include task assignment logic
    pass