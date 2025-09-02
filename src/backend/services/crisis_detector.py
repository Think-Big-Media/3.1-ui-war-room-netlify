"""
Crisis Detection Service
Integrates with Mentionlytics API for real-time crisis monitoring.
"""

import asyncio
import logging
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum

from sqlalchemy.orm import Session
from core.database import get_db
from models.automation import CrisisAlert, TriggerType
from .automation_engine import AutomationEngine

logger = logging.getLogger(__name__)


class CrisisSeverity(str, Enum):
    """Crisis severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CrisisDetector:
    """
    Crisis detection service that monitors social media and news
    for potential PR crises using Mentionlytics API.
    """

    def __init__(self, api_key: str, db: Session):
        self.api_key = api_key
        self.db = db
        self.base_url = "https://api.mentionlytics.com/v2"
        self.session: Optional[aiohttp.ClientSession] = None

        # Crisis detection thresholds
        self.severity_thresholds = {
            "sentiment_score": {
                CrisisSeverity.CRITICAL: -0.8,
                CrisisSeverity.HIGH: -0.6,
                CrisisSeverity.MEDIUM: -0.4,
                CrisisSeverity.LOW: -0.2,
            },
            "reach_multiplier": {
                CrisisSeverity.CRITICAL: 10.0,
                CrisisSeverity.HIGH: 5.0,
                CrisisSeverity.MEDIUM: 3.0,
                CrisisSeverity.LOW: 2.0,
            },
            "engagement_rate": {
                CrisisSeverity.CRITICAL: 0.15,
                CrisisSeverity.HIGH: 0.10,
                CrisisSeverity.MEDIUM: 0.07,
                CrisisSeverity.LOW: 0.05,
            },
        }

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    async def start_monitoring(self, organization_id: str, keywords: List[str]) -> None:
        """Start real-time monitoring for crisis detection."""
        logger.info(f"Starting crisis monitoring for org {organization_id}")

        while True:
            try:
                await self._check_for_crises(organization_id, keywords)
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Error in crisis monitoring: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying

    async def _check_for_crises(
        self, organization_id: str, keywords: List[str]
    ) -> None:
        """Check Mentionlytics for potential crises."""
        if not self.session:
            self.session = aiohttp.ClientSession()

        # Get recent mentions
        mentions = await self._get_recent_mentions(keywords)

        for mention in mentions:
            crisis_score = self._calculate_crisis_score(mention)
            severity = self._determine_severity(crisis_score, mention)

            if severity:  # Only process if crisis detected
                alert = await self._create_crisis_alert(
                    organization_id, mention, severity, crisis_score
                )

                if alert:
                    await self._trigger_crisis_workflows(
                        organization_id, alert, mention
                    )

    async def _get_recent_mentions(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """Fetch recent mentions from Mentionlytics API."""
        if not self.session:
            return []

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Get mentions from last 5 minutes
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        params = {
            "keywords": ",".join(keywords),
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "sentiment": "negative",  # Focus on negative mentions
            "limit": 100,
        }

        try:
            async with self.session.get(
                f"{self.base_url}/mentions", headers=headers, params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("mentions", [])
                else:
                    logger.error(f"Mentionlytics API error: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Failed to fetch mentions: {e}")
            return []

    def _calculate_crisis_score(self, mention: Dict[str, Any]) -> float:
        """Calculate crisis score based on multiple factors."""
        score = 0.0

        # Sentiment impact (0-40 points)
        sentiment = mention.get("sentiment_score", 0)
        if sentiment < 0:
            score += abs(sentiment) * 40

        # Reach impact (0-30 points)
        reach = mention.get("reach", 0)
        avg_reach = mention.get("source_avg_reach", 1000)  # Default baseline
        if reach > avg_reach:
            reach_multiplier = reach / avg_reach
            score += min(reach_multiplier * 10, 30)

        # Engagement impact (0-20 points)
        engagement = mention.get("engagement", {})
        total_engagement = (
            engagement.get("likes", 0)
            + engagement.get("shares", 0)
            + engagement.get("comments", 0)
        )
        if reach > 0:
            engagement_rate = total_engagement / reach
            score += min(engagement_rate * 100, 20)

        # Keyword matching severity (0-10 points)
        content = mention.get("content", "").lower()
        crisis_keywords = [
            "scandal",
            "controversy",
            "outrage",
            "boycott",
            "protest",
            "corruption",
            "illegal",
            "fraud",
            "resign",
            "fire",
            "terminate",
            "lawsuit",
        ]

        keyword_matches = sum(1 for keyword in crisis_keywords if keyword in content)
        score += min(keyword_matches * 2, 10)

        return min(score, 100)  # Cap at 100

    def _determine_severity(
        self, crisis_score: float, mention: Dict[str, Any]
    ) -> Optional[CrisisSeverity]:
        """Determine crisis severity based on score and additional factors."""
        sentiment = mention.get("sentiment_score", 0)
        reach = mention.get("reach", 0)
        avg_reach = mention.get("source_avg_reach", 1000)

        # Calculate reach multiplier
        reach_multiplier = reach / avg_reach if avg_reach > 0 else 1

        # Calculate engagement rate
        engagement = mention.get("engagement", {})
        total_engagement = (
            engagement.get("likes", 0)
            + engagement.get("shares", 0)
            + engagement.get("comments", 0)
        )
        engagement_rate = total_engagement / reach if reach > 0 else 0

        # Determine severity based on thresholds
        if (
            crisis_score >= 80
            or sentiment
            <= self.severity_thresholds["sentiment_score"][CrisisSeverity.CRITICAL]
            or reach_multiplier
            >= self.severity_thresholds["reach_multiplier"][CrisisSeverity.CRITICAL]
            or engagement_rate
            >= self.severity_thresholds["engagement_rate"][CrisisSeverity.CRITICAL]
        ):
            return CrisisSeverity.CRITICAL

        elif (
            crisis_score >= 60
            or sentiment
            <= self.severity_thresholds["sentiment_score"][CrisisSeverity.HIGH]
            or reach_multiplier
            >= self.severity_thresholds["reach_multiplier"][CrisisSeverity.HIGH]
            or engagement_rate
            >= self.severity_thresholds["engagement_rate"][CrisisSeverity.HIGH]
        ):
            return CrisisSeverity.HIGH

        elif (
            crisis_score >= 40
            or sentiment
            <= self.severity_thresholds["sentiment_score"][CrisisSeverity.MEDIUM]
            or reach_multiplier
            >= self.severity_thresholds["reach_multiplier"][CrisisSeverity.MEDIUM]
            or engagement_rate
            >= self.severity_thresholds["engagement_rate"][CrisisSeverity.MEDIUM]
        ):
            return CrisisSeverity.MEDIUM

        elif (
            crisis_score >= 20
            or sentiment
            <= self.severity_thresholds["sentiment_score"][CrisisSeverity.LOW]
            or reach_multiplier
            >= self.severity_thresholds["reach_multiplier"][CrisisSeverity.LOW]
            or engagement_rate
            >= self.severity_thresholds["engagement_rate"][CrisisSeverity.LOW]
        ):
            return CrisisSeverity.LOW

        return None  # No crisis detected

    async def _create_crisis_alert(
        self,
        organization_id: str,
        mention: Dict[str, Any],
        severity: CrisisSeverity,
        crisis_score: float,
    ) -> Optional[CrisisAlert]:
        """Create a crisis alert in the database."""
        try:
            # Check if we already have an alert for this mention
            existing_alert = (
                self.db.query(CrisisAlert)
                .filter(
                    CrisisAlert.source_id == mention.get("id"),
                    CrisisAlert.organization_id == organization_id,
                )
                .first()
            )

            if existing_alert:
                return existing_alert

            # Create new alert
            alert = CrisisAlert(
                organization_id=organization_id,
                alert_type="negative_sentiment",
                severity=severity.value,
                title=self._generate_alert_title(mention, severity),
                description=self._generate_alert_description(mention, crisis_score),
                source="mentionlytics",
                source_id=mention.get("id"),
                source_url=mention.get("url"),
                content=mention.get("content", ""),
                keywords_matched=mention.get("matched_keywords", []),
                sentiment_score=mention.get("sentiment_score"),
                reach_estimate=mention.get("reach"),
                engagement_metrics=mention.get("engagement", {}),
            )

            self.db.add(alert)
            self.db.commit()
            self.db.refresh(alert)

            logger.info(f"Created {severity.value} crisis alert {alert.id}")
            return alert

        except Exception as e:
            logger.error(f"Failed to create crisis alert: {e}")
            self.db.rollback()
            return None

    def _generate_alert_title(
        self, mention: Dict[str, Any], severity: CrisisSeverity
    ) -> str:
        """Generate a descriptive alert title."""
        source = mention.get("source", "Social Media")
        keywords = mention.get("matched_keywords", [])

        if keywords:
            keyword_text = f" about {', '.join(keywords[:2])}"
        else:
            keyword_text = ""

        return f"{severity.value.title()} Crisis Alert: Negative {source} mention{keyword_text}"

    def _generate_alert_description(
        self, mention: Dict[str, Any], crisis_score: float
    ) -> str:
        """Generate a detailed alert description."""
        reach = mention.get("reach", 0)
        sentiment = mention.get("sentiment_score", 0)
        source = mention.get("source", "unknown")

        description = f"""Crisis Score: {crisis_score:.1f}/100
Source: {source}
Sentiment Score: {sentiment:.2f}
Estimated Reach: {reach:,}
"""

        engagement = mention.get("engagement", {})
        if engagement:
            description += f"""Engagement: {engagement.get('likes', 0)} likes, {engagement.get('shares', 0)} shares, {engagement.get('comments', 0)} comments"""

        return description

    async def _trigger_crisis_workflows(
        self, organization_id: str, alert: CrisisAlert, mention: Dict[str, Any]
    ) -> None:
        """Trigger automated workflows for crisis response."""
        automation_engine = AutomationEngine(self.db)

        trigger_data = {
            "organization_id": organization_id,
            "source": "crisis_detector",
            "alert_id": alert.id,
            "severity": alert.severity,
            "sentiment_score": alert.sentiment_score,
            "reach": alert.reach_estimate,
            "keywords": alert.keywords_matched,
            "content": alert.content,
            "source_url": alert.source_url,
            "crisis_score": mention.get("crisis_score", 0),
        }

        try:
            execution_ids = await automation_engine.process_trigger(
                TriggerType.CRISIS, trigger_data, organization_id
            )

            if execution_ids:
                alert.workflow_triggered = True
                alert.workflow_ids = execution_ids
                self.db.commit()

                logger.info(
                    f"Triggered {len(execution_ids)} crisis workflows for alert {alert.id}"
                )

        except Exception as e:
            logger.error(f"Failed to trigger crisis workflows: {e}")

    async def test_crisis_detection(
        self, organization_id: str, test_mention: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test crisis detection with a sample mention."""
        crisis_score = self._calculate_crisis_score(test_mention)
        severity = self._determine_severity(crisis_score, test_mention)

        return {
            "crisis_score": crisis_score,
            "severity": severity.value if severity else "none",
            "would_trigger_alert": severity is not None,
            "thresholds": self.severity_thresholds,
            "mention_analysis": {
                "sentiment_score": test_mention.get("sentiment_score"),
                "reach": test_mention.get("reach"),
                "engagement_rate": (
                    sum(test_mention.get("engagement", {}).values())
                    / test_mention.get("reach", 1)
                )
                if test_mention.get("reach")
                else 0,
            },
        }
