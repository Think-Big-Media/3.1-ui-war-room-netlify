"""
Pydantic schemas for Mentionlytics API responses.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class MentionResponse(BaseModel):
    """Schema for social media mention."""
    
    id: str = Field(..., description="Mention ID")
    text: str = Field(..., description="Mention text content")
    author: str = Field(..., description="Author name")
    author_handle: Optional[str] = Field(None, description="Author social media handle")
    platform: str = Field(..., description="Social media platform")
    url: str = Field(..., description="URL to the mention")
    published_at: datetime = Field(..., description="Publication timestamp")
    sentiment: str = Field(..., description="Sentiment (positive, negative, neutral)")
    reach: int = Field(0, description="Estimated reach")
    engagement: int = Field(0, description="Total engagement (likes, shares, comments)")
    language: str = Field("en", description="Language code")
    location: Optional[str] = Field(None, description="Location if available")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "mention_123",
                "text": "Love using @warroom for campaign management!",
                "author": "John Doe",
                "author_handle": "@johndoe",
                "platform": "twitter",
                "url": "https://twitter.com/johndoe/status/123456",
                "published_at": "2025-01-20T10:30:00Z",
                "sentiment": "positive",
                "reach": 5000,
                "engagement": 150,
                "language": "en",
                "location": "New York, USA"
            }
        }


class SentimentAnalysisResponse(BaseModel):
    """Schema for sentiment analysis results."""
    
    project_id: str = Field(..., description="Project ID")
    period: str = Field(..., description="Analysis period")
    total_mentions: int = Field(..., description="Total number of mentions")
    positive: int = Field(..., description="Positive mentions count")
    negative: int = Field(..., description="Negative mentions count")
    neutral: int = Field(..., description="Neutral mentions count")
    positive_percentage: float = Field(..., description="Percentage of positive mentions")
    negative_percentage: float = Field(..., description="Percentage of negative mentions")
    neutral_percentage: float = Field(..., description="Percentage of neutral mentions")
    sentiment_trend: List[Dict[str, Any]] = Field(default_factory=list, description="Sentiment over time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "proj_123",
                "period": "7days",
                "total_mentions": 1500,
                "positive": 900,
                "negative": 150,
                "neutral": 450,
                "positive_percentage": 60.0,
                "negative_percentage": 10.0,
                "neutral_percentage": 30.0,
                "sentiment_trend": [
                    {"date": "2025-01-15", "positive": 120, "negative": 20, "neutral": 60},
                    {"date": "2025-01-16", "positive": 130, "negative": 25, "neutral": 65}
                ]
            }
        }


class InfluencerResponse(BaseModel):
    """Schema for influencer information."""
    
    id: str = Field(..., description="Influencer ID")
    name: str = Field(..., description="Influencer name")
    handle: str = Field(..., description="Social media handle")
    platform: str = Field(..., description="Primary platform")
    followers: int = Field(..., description="Number of followers")
    reach: int = Field(..., description="Estimated total reach")
    mentions: int = Field(..., description="Number of mentions about your brand")
    sentiment: str = Field(..., description="Overall sentiment")
    engagement_rate: float = Field(..., description="Average engagement rate")
    avatar_url: Optional[str] = Field(None, description="Profile picture URL")
    bio: Optional[str] = Field(None, description="Profile bio")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "inf_123",
                "name": "Jane Smith",
                "handle": "@janesmith",
                "platform": "instagram",
                "followers": 50000,
                "reach": 150000,
                "mentions": 5,
                "sentiment": "positive",
                "engagement_rate": 3.5,
                "avatar_url": "https://example.com/avatar.jpg",
                "bio": "Digital marketing expert | Campaign strategist"
            }
        }


class TrendingTopicResponse(BaseModel):
    """Schema for trending topic."""
    
    topic: str = Field(..., description="Topic or hashtag")
    count: int = Field(..., description="Number of mentions")
    growth_rate: float = Field(..., description="Growth rate percentage")
    sentiment: str = Field(..., description="Overall sentiment")
    related_topics: List[str] = Field(default_factory=list, description="Related topics")
    top_posts: List[str] = Field(default_factory=list, description="URLs of top posts")
    
    class Config:
        json_schema_extra = {
            "example": {
                "topic": "#CampaignSuccess",
                "count": 250,
                "growth_rate": 45.5,
                "sentiment": "positive",
                "related_topics": ["#DigitalCampaign", "#PoliticalStrategy"],
                "top_posts": [
                    "https://twitter.com/user/status/123",
                    "https://instagram.com/p/ABC123"
                ]
            }
        }


class MentionStatisticsResponse(BaseModel):
    """Schema for mention statistics."""
    
    project_id: str = Field(..., description="Project ID")
    group_by: str = Field(..., description="Grouping period")
    total_mentions: int = Field(..., description="Total mentions in period")
    average_daily_mentions: float = Field(..., description="Average mentions per day")
    peak_day: Optional[str] = Field(None, description="Day with most mentions")
    peak_mentions: Optional[int] = Field(None, description="Number of mentions on peak day")
    platforms: Dict[str, int] = Field(default_factory=dict, description="Mentions by platform")
    timeline: List[Dict[str, Any]] = Field(default_factory=list, description="Mentions over time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "proj_123",
                "group_by": "day",
                "total_mentions": 2500,
                "average_daily_mentions": 357.14,
                "peak_day": "2025-01-18",
                "peak_mentions": 650,
                "platforms": {
                    "twitter": 1200,
                    "facebook": 600,
                    "instagram": 500,
                    "linkedin": 200
                },
                "timeline": [
                    {"date": "2025-01-15", "count": 300},
                    {"date": "2025-01-16", "count": 350},
                    {"date": "2025-01-17", "count": 400}
                ]
            }
        }