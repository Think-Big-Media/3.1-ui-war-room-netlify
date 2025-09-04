"""
Example FastAPI endpoints for event management.
Shows patterns for complex queries, relationships, and business logic.
"""

from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from app.database import get_db
from app.auth import get_current_user, require_permissions
from app.models import Event, User, Volunteer, EventVolunteer
from app.schemas import EventCreate, EventUpdate, EventResponse, EventDetailResponse
from app.services.notification import NotificationService
from app.utils.cache import cache_key_wrapper

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("/", response_model=List[EventResponse])
@cache_key_wrapper(expire=300)  # Cache for 5 minutes
async def get_events(
    start_date: Optional[date] = Query(None, description="Filter events starting after this date"),
    end_date: Optional[date] = Query(None, description="Filter events ending before this date"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    status: Optional[str] = Query(None, description="Filter by status (upcoming, ongoing, completed)"),
    location: Optional[str] = Query(None, description="Search by location"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve events with advanced filtering options.
    
    Includes:
    - Date range filtering
    - Type and status filtering
    - Location search
    - Pagination
    - Caching for performance
    """
    query = db.query(Event).options(
        joinedload(Event.organizer),
        joinedload(Event.volunteers)
    )
    
    # Date filtering
    if start_date:
        query = query.filter(Event.start_date >= start_date)
    if end_date:
        query = query.filter(Event.end_date <= end_date)
    
    # Status filtering with business logic
    if status:
        now = datetime.utcnow()
        if status == "upcoming":
            query = query.filter(Event.start_date > now)
        elif status == "ongoing":
            query = query.filter(
                and_(Event.start_date <= now, Event.end_date >= now)
            )
        elif status == "completed":
            query = query.filter(Event.end_date < now)
    
    # Type and location filtering
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if location:
        query = query.filter(
            or_(
                Event.location.ilike(f"%{location}%"),
                Event.address.ilike(f"%{location}%"),
                Event.city.ilike(f"%{location}%")
            )
        )
    
    # Order by start date
    query = query.order_by(Event.start_date.asc())
    
    # Pagination
    total = query.count()
    events = query.offset(skip).limit(limit).all()
    
    # Add metadata to response
    response = {
        "items": events,
        "total": total,
        "skip": skip,
        "limit": limit
    }
    
    return events


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@require_permissions(["events.create"])
async def create_event(
    event: EventCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    notification_service: NotificationService = Depends()
):
    """
    Create a new event with automatic notifications.
    
    Features:
    - Permission checking
    - Validation of event dates
    - Background task for notifications
    - Audit logging
    """
    # Validate dates
    if event.start_date >= event.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    # Check for venue conflicts
    venue_conflict = db.query(Event).filter(
        and_(
            Event.venue_id == event.venue_id,
            or_(
                and_(
                    Event.start_date <= event.start_date,
                    Event.end_date >= event.start_date
                ),
                and_(
                    Event.start_date <= event.end_date,
                    Event.end_date >= event.end_date
                )
            )
        )
    ).first()
    
    if venue_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Venue is already booked for this time period"
        )
    
    # Create event
    db_event = Event(
        **event.dict(),
        organizer_id=current_user.id,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Schedule notifications in background
    background_tasks.add_task(
        notification_service.notify_volunteers_new_event,
        event_id=db_event.id
    )
    
    return db_event


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event_details(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific event.
    
    Includes:
    - Event details
    - Volunteer assignments
    - Related statistics
    - Attendance information
    """
    event = db.query(Event).options(
        joinedload(Event.organizer),
        joinedload(Event.volunteers).joinedload(EventVolunteer.volunteer),
        joinedload(Event.tasks),
        joinedload(Event.resources)
    ).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Calculate statistics
    stats = {
        "total_volunteers": len(event.volunteers),
        "confirmed_volunteers": len([v for v in event.volunteers if v.status == "confirmed"]),
        "tasks_completed": len([t for t in event.tasks if t.is_completed]),
        "total_tasks": len(event.tasks)
    }
    
    return {
        **event.__dict__,
        "statistics": stats
    }


@router.post("/{event_id}/register")
async def register_for_event(
    event_id: int,
    volunteer_id: Optional[int] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a volunteer for an event.
    
    Features:
    - Self-registration or registration by coordinator
    - Capacity checking
    - Duplicate registration prevention
    - Confirmation email sending
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Determine volunteer ID
    if volunteer_id is None:
        # Self-registration
        volunteer = db.query(Volunteer).filter(
            Volunteer.user_id == current_user.id
        ).first()
        if not volunteer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not registered as a volunteer"
            )
        volunteer_id = volunteer.id
    
    # Check capacity
    current_registrations = db.query(EventVolunteer).filter(
        EventVolunteer.event_id == event_id,
        EventVolunteer.status != "cancelled"
    ).count()
    
    if event.max_volunteers and current_registrations >= event.max_volunteers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is at full capacity"
        )
    
    # Check for existing registration
    existing = db.query(EventVolunteer).filter(
        EventVolunteer.event_id == event_id,
        EventVolunteer.volunteer_id == volunteer_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Volunteer is already registered for this event"
        )
    
    # Create registration
    registration = EventVolunteer(
        event_id=event_id,
        volunteer_id=volunteer_id,
        status="pending",
        notes=notes,
        registered_at=datetime.utcnow(),
        registered_by=current_user.id
    )
    
    db.add(registration)
    db.commit()
    
    return {"message": "Successfully registered for event", "registration_id": registration.id}