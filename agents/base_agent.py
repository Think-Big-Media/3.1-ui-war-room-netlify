"""Base agent class for War Room AI development.

Provides common functionality for all specialized agents including:
- Context management
- Task coordination
- Progress tracking
- Error handling
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Abstract base class for all War Room development agents."""
    
    def __init__(self, name: str, specialization: str):
        self.name = name
        self.specialization = specialization
        self.context = {}
        self.task_history = []
        self.current_task = None
        self.status = "idle"
        
    @abstractmethod
    async def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific task within the agent's domain.
        
        Args:
            task: Task definition with type, parameters, and context
            
        Returns:
            Dictionary with result, status, and any artifacts
        """
        pass
    
    @abstractmethod
    def validate_capability(self, task: Dict[str, Any]) -> bool:
        """Check if this agent can handle the given task.
        
        Args:
            task: Task definition to validate
            
        Returns:
            Boolean indicating if agent can handle task
        """
        pass
    
    def update_context(self, context_update: Dict[str, Any]):
        """Update agent's shared context.
        
        Args:
            context_update: New context information to merge
        """
        self.context.update(context_update)
        logger.info(f"{self.name}: Context updated with {len(context_update)} keys")
    
    def log_task_start(self, task: Dict[str, Any]):
        """Log the start of a new task.
        
        Args:
            task: Task being started
        """
        self.current_task = task
        self.status = "working"
        
        task_log = {
            "task_id": task.get("id"),
            "type": task.get("type"),
            "started_at": datetime.utcnow().isoformat(),
            "agent": self.name
        }
        
        self.task_history.append(task_log)
        logger.info(f"{self.name}: Started task {task.get('type')}")
    
    def log_task_completion(self, result: Dict[str, Any]):
        """Log task completion with results.
        
        Args:
            result: Task execution result
        """
        if self.task_history:
            self.task_history[-1].update({
                "completed_at": datetime.utcnow().isoformat(),
                "status": result.get("status", "completed"),
                "result_summary": result.get("summary")
            })
        
        self.current_task = None
        self.status = "idle"
        logger.info(f"{self.name}: Completed task with status {result.get('status')}")
    
    def get_capabilities(self) -> List[str]:
        """Return list of task types this agent can handle.
        
        Returns:
            List of task type strings
        """
        return []
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status and context.
        
        Returns:
            Dictionary with agent status information
        """
        return {
            "name": self.name,
            "specialization": self.specialization,
            "status": self.status,
            "current_task": self.current_task,
            "tasks_completed": len(self.task_history),
            "context_keys": list(self.context.keys())
        }
    
    def load_project_context(self, planning_file: str = "PLANNING.md", task_file: str = "TASK.md"):
        """Load project context from planning and task files.
        
        Args:
            planning_file: Path to project planning file
            task_file: Path to current tasks file
        """
        try:
            # Load planning context
            with open(planning_file, 'r') as f:
                planning_content = f.read()
                self.context['project_planning'] = planning_content
            
            # Load current tasks
            with open(task_file, 'r') as f:
                task_content = f.read()
                self.context['current_tasks'] = task_content
                
            logger.info(f"{self.name}: Loaded project context from {planning_file} and {task_file}")
            
        except FileNotFoundError as e:
            logger.warning(f"{self.name}: Could not load context file: {e}")
        except Exception as e:
            logger.error(f"{self.name}: Error loading project context: {e}")
    
    def update_task_file(self, task_update: str, task_file: str = "TASK.md"):
        """Update the project task file with progress.
        
        Args:
            task_update: Progress update to append
            task_file: Path to task file
        """
        try:
            with open(task_file, 'a') as f:
                f.write(f"\n\n**{datetime.utcnow().strftime('%Y-%m-%d %H:%M')} - {self.name}**\n")
                f.write(task_update)
                
            logger.info(f"{self.name}: Updated task file with progress")
            
        except Exception as e:
            logger.error(f"{self.name}: Error updating task file: {e}")

class WarRoomAgentError(Exception):
    """Custom exception for War Room agent errors."""
    pass

class TaskValidationError(WarRoomAgentError):
    """Raised when a task cannot be validated for an agent."""
    pass

class ContextError(WarRoomAgentError):
    """Raised when there are context management issues."""
    pass