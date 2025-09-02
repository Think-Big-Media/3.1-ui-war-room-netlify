"""
Mentionlytics API endpoints for social media monitoring.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models.user import User
from schemas.mentionlytics import (
    MentionResponse,
    SentimentAnalysisResponse,
    InfluencerResponse,
    TrendingTopicResponse,
    MentionStatisticsResponse
)
from services.mentionlytics_service import mentionlytics_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/mentions", response_model=List[MentionResponse])
async def get_mentions(
    project_id: str = Query(..., description="Mentionlytics project ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum mentions to retrieve"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve social media mentions for a project.
    
    Requires authentication and appropriate permissions.
    """
    try:
        # Parse dates if provided
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        # Fetch mentions from Mentionlytics
        mentions = await mentionlytics_service.get_mentions(
            project_id=project_id,
            start_date=start_dt,
            end_date=end_dt,
            limit=limit,
            offset=offset
        )
        
        # Log activity
        logger.info(
            f"User {current_user.id} retrieved {len(mentions)} mentions for project {project_id}"
        )
        
        return mentions
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to get mentions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve mentions")


@router.get("/sentiment/{project_id}", response_model=SentimentAnalysisResponse)
async def get_sentiment_analysis(
    project_id: str,
    period: str = Query("7days", description="Analysis period (e.g., 7days, 30days, 3months)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get sentiment analysis for a project.
    
    Analyzes the sentiment (positive, negative, neutral) of mentions over time.
    """
    try:
        sentiment_data = await mentionlytics_service.get_sentiment_analysis(
            project_id=project_id,
            period=period
        )
        
        logger.info(
            f"User {current_user.id} retrieved sentiment analysis for project {project_id}"
        )
        
        return sentiment_data
        
    except Exception as e:
        logger.error(f"Failed to get sentiment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sentiment analysis")


@router.get("/influencers/{project_id}", response_model=List[InfluencerResponse])
async def get_top_influencers(
    project_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of top influencers"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top influencers mentioning your brand or keywords.
    
    Returns influencers ranked by reach and engagement.
    """
    try:
        influencers = await mentionlytics_service.get_top_influencers(
            project_id=project_id,
            limit=limit
        )
        
        logger.info(
            f"User {current_user.id} retrieved {len(influencers)} influencers for project {project_id}"
        )
        
        return influencers
        
    except Exception as e:
        logger.error(f"Failed to get influencers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve influencers")


@router.get("/trending/{project_id}", response_model=List[TrendingTopicResponse])
async def get_trending_topics(
    project_id: str,
    period: str = Query("24hours", description="Analysis period"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get trending topics and hashtags related to your project.
    
    Identifies emerging trends and popular topics.
    """
    try:
        topics = await mentionlytics_service.get_trending_topics(
            project_id=project_id,
            period=period
        )
        
        logger.info(
            f"User {current_user.id} retrieved trending topics for project {project_id}"
        )
        
        return topics
        
    except Exception as e:
        logger.error(f"Failed to get trending topics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve trending topics")


@router.get("/statistics/{project_id}", response_model=MentionStatisticsResponse)
async def get_mention_statistics(
    project_id: str,
    group_by: str = Query("day", description="Grouping period (hour, day, week, month)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get mention statistics over time.
    
    Returns mention counts grouped by the specified time period.
    """
    try:
        statistics = await mentionlytics_service.get_mention_statistics(
            project_id=project_id,
            group_by=group_by
        )
        
        logger.info(
            f"User {current_user.id} retrieved statistics for project {project_id}"
        )
        
        return statistics
        
    except Exception as e:
        logger.error(f"Failed to get mention statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")