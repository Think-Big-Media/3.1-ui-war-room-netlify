"""
Workflow State Management for Crisis Detection
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

from ..agents.crisis_detection import CrisisMention, CrisisAnalysis
from ..agents.alert_routing import AlertRoute


class WorkflowState(BaseModel):
    """State object for the crisis detection workflow"""
    
    # Workflow timestamps
    timestamp: datetime = Field(default_factory=datetime.now)
    
    # Input data
    mentions: List[CrisisMention] = []
    campaign_context: Dict[str, Any] = {}
    
    # Processing data
    enriched_mentions: List[Dict] = []
    source_count: int = 0
    
    # Analysis results
    analysis: Optional[CrisisAnalysis] = None
    severity: int = 0
    threat_detected: bool = False
    
    # Routing data
    routing_plan: List[AlertRoute] = []
    alert_count: int = 0
    
    # Delivery tracking
    delivery_results: Dict[str, Dict] = {}
    alerts_sent: int = 0
    
    # Learning data
    learning_data: Optional[Dict] = None
    
    # Error handling
    error: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        
    def to_dict(self) -> Dict:
        """Convert state to dictionary for serialization"""
        return {
            "timestamp": self.timestamp.isoformat(),
            "mentions_count": len(self.mentions),
            "campaign_context": self.campaign_context,
            "severity": self.severity,
            "threat_detected": self.threat_detected,
            "alert_count": self.alert_count,
            "alerts_sent": self.alerts_sent,
            "error": self.error
        }
    
    def get_summary(self) -> str:
        """Get human-readable summary of workflow state"""
        status = "ERROR" if self.error else "SUCCESS"
        
        return (
            f"Crisis Detection Workflow - {status}\n"
            f"Timestamp: {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Mentions processed: {len(self.mentions)}\n"
            f"Threat detected: {'Yes' if self.threat_detected else 'No'}\n"
            f"Severity: {self.severity}/10\n"
            f"Alerts sent: {self.alerts_sent}\n"
            f"Error: {self.error or 'None'}"
        )