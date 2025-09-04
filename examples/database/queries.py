"""
Example database queries and query patterns for the War Room platform.
Shows patterns for:
- Complex queries with joins
- Aggregations
- Window functions
- CTEs (Common Table Expressions)
- Query optimization
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_, or_, case, desc, asc, text
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy.sql import Select

from .models import (
    User, Volunteer, Event, EventVolunteer, Skill, Tag,
    EventStatus, VolunteerStatus, UserRole
)


class VolunteerQueries:
    """Complex queries for volunteer management"""
    
    @staticmethod
    def get_volunteers_with_skills(
        db: Session,
        skill_names: Optional[List[str]] = None,
        min_events: int = 0,
        status: Optional[VolunteerStatus] = None
    ) -> List[Volunteer]:
        """
        Get volunteers with specific skills and minimum event participation.
        
        Shows:
        - Joining multiple tables
        - Filtering with optional parameters
        - Aggregation with HAVING clause
        """
        query = (
            select(Volunteer)
            .join(Volunteer.event_assignments)
            .options(selectinload(Volunteer.skills))
            .group_by(Volunteer.id)
            .having(func.count(EventVolunteer.id) >= min_events)
        )
        
        if skill_names:
            query = query.join(Volunteer.skills).filter(
                Skill.name.in_(skill_names)
            )
        
        if status:
            query = query.filter(Volunteer.status == status)
        
        return db.execute(query).scalars().unique().all()
    
    @staticmethod
    def get_volunteer_availability_stats(
        db: Session,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Get volunteer availability statistics for a date range.
        
        Shows:
        - Window functions
        - JSON aggregation
        - Complex date filtering
        """
        availability_query = (
            select(
                func.date_part('dow', Event.start_date).label('day_of_week'),
                func.count(distinct(EventVolunteer.volunteer_id)).label('unique_volunteers'),
                func.avg(
                    case(
                        (EventVolunteer.status == 'attended', 1),
                        else_=0
                    )
                ).label('attendance_rate')
            )
            .select_from(Event)
            .join(EventVolunteer)
            .filter(
                and_(
                    Event.start_date >= start_date,
                    Event.start_date <= end_date,
                    Event.status != EventStatus.CANCELLED
                )
            )
            .group_by(func.date_part('dow', Event.start_date))
            .order_by('day_of_week')
        )
        
        results = db.execute(availability_query).all()
        
        return {
            'by_day_of_week': [
                {
                    'day': int(row.day_of_week),
                    'unique_volunteers': row.unique_volunteers,
                    'attendance_rate': float(row.attendance_rate) if row.attendance_rate else 0
                }
                for row in results
            ]
        }
    
    @staticmethod
    def rank_volunteers_by_reliability(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Rank volunteers by their reliability score using various metrics.
        
        Shows:
        - CTEs (Common Table Expressions)
        - Window functions for ranking
        - Complex calculations
        """
        # CTE for attendance stats
        attendance_cte = (
            select(
                EventVolunteer.volunteer_id,
                func.count(EventVolunteer.id).label('total_signups'),
                func.sum(
                    case((EventVolunteer.status == 'attended', 1), else_=0)
                ).label('attended_count'),
                func.sum(
                    case((EventVolunteer.status == 'no-show', 1), else_=0)
                ).label('no_show_count')
            )
            .group_by(EventVolunteer.volunteer_id)
        ).cte('attendance_stats')
        
        # CTE for hours contributed
        hours_cte = (
            select(
                EventVolunteer.volunteer_id,
                func.sum(EventVolunteer.hours_credited).label('total_hours')
            )
            .filter(EventVolunteer.hours_credited.isnot(None))
            .group_by(EventVolunteer.volunteer_id)
        ).cte('hours_stats')
        
        # Main query with ranking
        query = (
            select(
                Volunteer.id,
                Volunteer.user_id,
                User.first_name,
                User.last_name,
                attendance_cte.c.total_signups,
                attendance_cte.c.attended_count,
                attendance_cte.c.no_show_count,
                hours_cte.c.total_hours,
                # Calculate reliability score
                case(
                    (attendance_cte.c.total_signups > 0,
                     (attendance_cte.c.attended_count * 100.0 / attendance_cte.c.total_signups)),
                    else_=0
                ).label('attendance_rate'),
                # Rank by multiple criteria
                func.row_number().over(
                    order_by=[
                        desc(attendance_cte.c.attended_count),
                        desc(hours_cte.c.total_hours),
                        asc(attendance_cte.c.no_show_count)
                    ]
                ).label('rank')
            )
            .select_from(Volunteer)
            .join(User, Volunteer.user_id == User.id)
            .outerjoin(attendance_cte, attendance_cte.c.volunteer_id == Volunteer.id)
            .outerjoin(hours_cte, hours_cte.c.volunteer_id == Volunteer.id)
            .filter(Volunteer.status == VolunteerStatus.ACTIVE)
            .limit(limit)
        )
        
        results = db.execute(query).all()
        
        return [
            {
                'volunteer_id': row.id,
                'name': f"{row.first_name} {row.last_name}",
                'total_signups': row.total_signups or 0,
                'attended_count': row.attended_count or 0,
                'no_show_count': row.no_show_count or 0,
                'total_hours': float(row.total_hours or 0),
                'attendance_rate': float(row.attendance_rate),
                'rank': row.rank
            }
            for row in results
        ]


class EventQueries:
    """Complex queries for event management"""
    
    @staticmethod
    def get_events_with_volunteer_stats(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_volunteers: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get events with detailed volunteer statistics.
        
        Shows:
        - Subqueries
        - Conditional aggregation
        - Left joins to include events without volunteers
        """
        # Subquery for volunteer counts by status
        volunteer_stats = (
            select(
                EventVolunteer.event_id,
                func.count(EventVolunteer.id).label('total_registered'),
                func.sum(
                    case((EventVolunteer.status == 'confirmed', 1), else_=0)
                ).label('confirmed_count'),
                func.sum(
                    case((EventVolunteer.status == 'attended', 1), else_=0)
                ).label('attended_count')
            )
            .group_by(EventVolunteer.event_id)
        ).subquery()
        
        query = (
            select(
                Event,
                func.coalesce(volunteer_stats.c.total_registered, 0).label('total_registered'),
                func.coalesce(volunteer_stats.c.confirmed_count, 0).label('confirmed_count'),
                func.coalesce(volunteer_stats.c.attended_count, 0).label('attended_count'),
                # Calculate fill rate
                case(
                    (Event.max_volunteers.isnot(None),
                     volunteer_stats.c.confirmed_count * 100.0 / Event.max_volunteers),
                    else_=None
                ).label('fill_rate')
            )
            .select_from(Event)
            .outerjoin(volunteer_stats, volunteer_stats.c.event_id == Event.id)
            .options(joinedload(Event.tags))
        )
        
        # Apply filters
        filters = []
        if start_date:
            filters.append(Event.start_date >= start_date)
        if end_date:
            filters.append(Event.end_date <= end_date)
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Having clause for minimum volunteers
        if min_volunteers > 0:
            query = query.having(
                func.coalesce(volunteer_stats.c.total_registered, 0) >= min_volunteers
            )
        
        results = db.execute(query).unique().all()
        
        return [
            {
                'event': row.Event,
                'volunteer_stats': {
                    'total_registered': row.total_registered,
                    'confirmed_count': row.confirmed_count,
                    'attended_count': row.attended_count,
                    'fill_rate': float(row.fill_rate) if row.fill_rate else None
                }
            }
            for row in results
        ]
    
    @staticmethod
    def get_venue_utilization_report(
        db: Session,
        months_back: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Generate venue utilization report with advanced analytics.
        
        Shows:
        - Date truncation for grouping
        - Multiple aggregations
        - Calculated metrics
        """
        start_date = datetime.utcnow() - timedelta(days=months_back * 30)
        
        query = (
            select(
                Event.venue_name,
                Event.city,
                func.date_trunc('month', Event.start_date).label('month'),
                func.count(Event.id).label('event_count'),
                func.avg(
                    func.extract('epoch', Event.end_date - Event.start_date) / 3600
                ).label('avg_duration_hours'),
                func.sum(
                    select(func.count(EventVolunteer.id))
                    .where(EventVolunteer.event_id == Event.id)
                    .where(EventVolunteer.status == 'attended')
                    .scalar_subquery()
                ).label('total_attendance')
            )
            .filter(
                and_(
                    Event.start_date >= start_date,
                    Event.status.in_([EventStatus.COMPLETED, EventStatus.ONGOING])
                )
            )
            .group_by(Event.venue_name, Event.city, func.date_trunc('month', Event.start_date))
            .order_by(Event.venue_name, 'month')
        )
        
        results = db.execute(query).all()
        
        # Format results
        venue_data = {}
        for row in results:
            venue_key = f"{row.venue_name} - {row.city}"
            if venue_key not in venue_data:
                venue_data[venue_key] = {
                    'venue_name': row.venue_name,
                    'city': row.city,
                    'monthly_stats': []
                }
            
            venue_data[venue_key]['monthly_stats'].append({
                'month': row.month.strftime('%Y-%m'),
                'event_count': row.event_count,
                'avg_duration_hours': float(row.avg_duration_hours) if row.avg_duration_hours else 0,
                'total_attendance': row.total_attendance or 0
            })
        
        return list(venue_data.values())


class AnalyticsQueries:
    """Advanced analytics queries"""
    
    @staticmethod
    def get_volunteer_engagement_funnel(
        db: Session,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Get volunteer engagement funnel metrics.
        
        Shows:
        - Multiple CTEs
        - Funnel analysis
        - Conversion rates
        """
        # CTE for new volunteers
        new_volunteers = (
            select(
                Volunteer.id,
                Volunteer.created_at
            )
            .filter(
                and_(
                    Volunteer.created_at >= start_date,
                    Volunteer.created_at <= end_date
                )
            )
        ).cte('new_volunteers')
        
        # CTE for first event registration
        first_registration = (
            select(
                EventVolunteer.volunteer_id,
                func.min(EventVolunteer.created_at).label('first_registration_date')
            )
            .group_by(EventVolunteer.volunteer_id)
        ).cte('first_registration')
        
        # CTE for first attendance
        first_attendance = (
            select(
                EventVolunteer.volunteer_id,
                func.min(Event.start_date).label('first_attendance_date')
            )
            .join(Event)
            .filter(EventVolunteer.status == 'attended')
            .group_by(EventVolunteer.volunteer_id)
        ).cte('first_attendance')
        
        # Calculate funnel metrics
        total_new = db.execute(select(func.count(new_volunteers.c.id))).scalar()
        
        registered = db.execute(
            select(func.count(distinct(first_registration.c.volunteer_id)))
            .select_from(new_volunteers)
            .join(
                first_registration,
                first_registration.c.volunteer_id == new_volunteers.c.id
            )
        ).scalar()
        
        attended = db.execute(
            select(func.count(distinct(first_attendance.c.volunteer_id)))
            .select_from(new_volunteers)
            .join(
                first_attendance,
                first_attendance.c.volunteer_id == new_volunteers.c.id
            )
        ).scalar()
        
        # Calculate retention (attended 2+ events)
        retained = db.execute(
            select(func.count(distinct(EventVolunteer.volunteer_id)))
            .select_from(new_volunteers)
            .join(EventVolunteer, EventVolunteer.volunteer_id == new_volunteers.c.id)
            .filter(EventVolunteer.status == 'attended')
            .group_by(EventVolunteer.volunteer_id)
            .having(func.count(EventVolunteer.id) >= 2)
        ).scalar()
        
        return {
            'funnel': {
                'new_volunteers': total_new,
                'registered_for_event': registered,
                'attended_first_event': attended,
                'retained_volunteers': retained or 0
            },
            'conversion_rates': {
                'registration_rate': (registered / total_new * 100) if total_new > 0 else 0,
                'attendance_rate': (attended / registered * 100) if registered > 0 else 0,
                'retention_rate': (retained / attended * 100) if attended > 0 else 0
            }
        }
    
    @staticmethod
    def get_skill_demand_analysis(db: Session) -> List[Dict[str, Any]]:
        """
        Analyze skill demand vs availability.
        
        Shows:
        - Complex joins
        - Gap analysis
        - Ranking
        """
        # Skills required for events (from requirements JSON)
        required_skills = (
            select(
                func.jsonb_array_elements_text(Event.requirements['required_skills']).label('skill_name'),
                Event.id.label('event_id')
            )
            .filter(Event.requirements.isnot(None))
            .filter(Event.requirements['required_skills'].isnot(None))
        ).cte('required_skills')
        
        # Skill demand vs availability
        query = (
            select(
                Skill.name,
                Skill.category,
                func.count(distinct(required_skills.c.event_id)).label('events_requiring'),
                func.count(distinct(Volunteer.id)).label('volunteers_with_skill'),
                # Calculate gap
                (
                    func.count(distinct(required_skills.c.event_id)) -
                    func.count(distinct(Volunteer.id))
                ).label('skill_gap')
            )
            .select_from(Skill)
            .outerjoin(
                required_skills,
                required_skills.c.skill_name == Skill.name
            )
            .outerjoin(
                volunteer_skills,
                volunteer_skills.c.skill_id == Skill.id
            )
            .outerjoin(
                Volunteer,
                and_(
                    Volunteer.id == volunteer_skills.c.volunteer_id,
                    Volunteer.status == VolunteerStatus.ACTIVE
                )
            )
            .group_by(Skill.name, Skill.category)
            .order_by(desc('skill_gap'))
        )
        
        results = db.execute(query).all()
        
        return [
            {
                'skill_name': row.name,
                'category': row.category,
                'events_requiring': row.events_requiring,
                'volunteers_available': row.volunteers_with_skill,
                'gap': row.skill_gap,
                'gap_severity': 'high' if row.skill_gap > 5 else 'medium' if row.skill_gap > 0 else 'low'
            }
            for row in results
        ]