"""Safe Auto-Fix Engine with Rollback Capability

Advanced system for safely applying automated fixes:
- Multi-level validation before applying fixes
- Comprehensive rollback mechanisms
- Fix testing and verification
- Pattern-based fix application
- Risk assessment and safety checks
"""

import os
import re
import ast
import json
import shutil
import logging
import hashlib
import subprocess
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from pathlib import Path
import tempfile
import difflib

from feedback_parser import ParsedFeedback, ActionType, FeedbackCategory

logger = logging.getLogger(__name__)

class FixResult(Enum):
    """Results of fix application"""
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    UNSAFE = "unsafe"
    ROLLED_BACK = "rolled_back"

class ValidationResult(Enum):
    """Fix validation results"""
    VALID = "valid"
    INVALID = "invalid"
    RISKY = "risky"
    UNKNOWN = "unknown"

@dataclass
class FixAttempt:
    """Record of a fix attempt"""
    fix_id: str
    feedback_id: str
    file_path: str
    original_content: str
    fixed_content: str
    diff: str
    backup_path: Optional[str]
    git_commit_hash: Optional[str]
    result: FixResult
    validation_result: ValidationResult
    applied_at: datetime
    rollback_at: Optional[datetime] = None
    error_message: Optional[str] = None
    test_results: Dict[str, Any] = field(default_factory=dict)
    safety_score: float = 0.0

@dataclass
class FixOperation:
    """A fix operation to be applied"""
    operation_type: str
    target: str
    replacement: str
    line_range: Tuple[int, int]
    confidence: float
    safety_check_passed: bool = False

class AutoFixEngine:
    """Safe auto-fix engine with comprehensive validation"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / ".coderabbit_backups"
        self.fix_history = []
        self.rollback_registry = {}
        
        # Safety configuration
        self.max_fixes_per_file = 5
        self.max_fixes_per_session = 50
        self.min_safety_score = 0.7
        self.enable_git_integration = True
        
        # Fix patterns and templates
        self.fix_patterns = self._load_fix_patterns()
        self.safety_patterns = self._load_safety_patterns()
        self.validation_patterns = self._load_validation_patterns()
        
        # Statistics
        self.fix_stats = {
            "total_attempts": 0,
            "successful_fixes": 0,
            "failed_fixes": 0,
            "skipped_fixes": 0,
            "rolled_back_fixes": 0
        }
        
        self._ensure_backup_directory()
    
    def _ensure_backup_directory(self):
        """Ensure backup directory exists"""
        self.backup_dir.mkdir(exist_ok=True)
        
        # Create .gitignore for backup directory
        gitignore_path = self.backup_dir / ".gitignore"
        if not gitignore_path.exists():
            with open(gitignore_path, 'w') as f:
                f.write("*\n!.gitignore\n")
    
    def _load_fix_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load fix patterns and templates"""
        return {
            "unused_import": {
                "pattern": r"^import\s+(\w+).*$",
                "fix_template": "",
                "validation": "syntax_check",
                "safety_score": 0.9
            },
            "import_sorting": {
                "pattern": r"^(import\s+.*)$",
                "fix_template": "sorted_imports",
                "validation": "syntax_check",
                "safety_score": 0.95
            },
            "trailing_whitespace": {
                "pattern": r"(\s+)$",
                "fix_template": "",
                "validation": "none",
                "safety_score": 1.0
            },
            "missing_docstring": {
                "pattern": r"^(def\s+\w+.*:)$",
                "fix_template": '\\1\n    """TODO: Add docstring"""',
                "validation": "syntax_check",
                "safety_score": 0.8
            },
            "type_annotation": {
                "pattern": r"^(\s*def\s+\w+)\(([^)]*)\):",
                "fix_template": "add_type_hints",
                "validation": "syntax_check",
                "safety_score": 0.7
            }
        }
    
    def _load_safety_patterns(self) -> Dict[str, List[str]]:
        """Load patterns that indicate unsafe operations"""
        return {
            "dangerous_operations": [
                r"os\.system",
                r"subprocess\.call",
                r"eval\s*\(",
                r"exec\s*\(",
                r"__import__",
                r"rm\s+-rf",
                r"DELETE\s+FROM",
                r"DROP\s+TABLE"
            ],
            "file_operations": [
                r"open\s*\(",
                r"file\.",
                r"shutil\.",
                r"os\.remove",
                r"os\.unlink"
            ],
            "network_operations": [
                r"requests\.",
                r"urllib\.",
                r"socket\.",
                r"http\."
            ]
        }
    
    def _load_validation_patterns(self) -> Dict[str, List[str]]:
        """Load validation patterns for different file types"""
        return {
            "python": [
                r"syntax_error",
                r"indentation_error",
                r"import_error"
            ],
            "javascript": [
                r"syntax_error",
                r"reference_error"
            ],
            "typescript": [
                r"type_error",
                r"syntax_error"
            ]
        }
    
    async def apply_fixes_batch(self, parsed_feedback: List[ParsedFeedback]) -> Dict[str, Any]:
        """Apply a batch of fixes with comprehensive validation"""
        # Filter auto-fixable items
        auto_fixable = [fb for fb in parsed_feedback if fb.auto_fixable and fb.action_type == ActionType.AUTO_FIX]
        
        if not auto_fixable:
            return {
                "status": "no_fixes",
                "message": "No auto-fixable items found",
                "processed": 0
            }
        
        # Group by file to optimize operations
        fixes_by_file = self._group_fixes_by_file(auto_fixable)
        
        # Apply fixes file by file
        results = []
        total_applied = 0
        
        for file_path, file_fixes in fixes_by_file.items():
            if len(file_fixes) > self.max_fixes_per_file:
                logger.warning(f"Too many fixes for {file_path}, limiting to {self.max_fixes_per_file}")
                file_fixes = file_fixes[:self.max_fixes_per_file]
            
            file_result = await self._apply_fixes_to_file(file_path, file_fixes)
            results.append(file_result)
            
            if file_result["applied_fixes"] > 0:
                total_applied += file_result["applied_fixes"]
            
            # Check session limit
            if total_applied >= self.max_fixes_per_session:
                logger.warning(f"Reached session limit of {self.max_fixes_per_session} fixes")
                break
        
        return {
            "status": "completed",
            "total_files": len(fixes_by_file),
            "total_fixes_applied": total_applied,
            "file_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _group_fixes_by_file(self, fixes: List[ParsedFeedback]) -> Dict[str, List[ParsedFeedback]]:
        """Group fixes by file path for efficient processing"""
        grouped = {}
        for fix in fixes:
            file_path = fix.file_path
            if file_path not in grouped:
                grouped[file_path] = []
            grouped[file_path].append(fix)
        
        # Sort fixes within each file by line number
        for file_path in grouped:
            grouped[file_path].sort(key=lambda x: x.line_number, reverse=True)  # Reverse to apply from bottom up
        
        return grouped
    
    async def _apply_fixes_to_file(self, file_path: str, fixes: List[ParsedFeedback]) -> Dict[str, Any]:
        """Apply multiple fixes to a single file"""
        abs_file_path = self.project_root / file_path
        
        if not abs_file_path.exists():
            return {
                "file_path": file_path,
                "status": "file_not_found",
                "applied_fixes": 0,
                "errors": [f"File not found: {file_path}"]
            }
        
        # Create backup
        backup_path = await self._create_backup(abs_file_path)
        git_commit_hash = await self._create_git_checkpoint(abs_file_path) if self.enable_git_integration else None
        
        try:
            # Read original content
            with open(abs_file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Apply fixes sequentially
            current_content = original_content
            applied_fixes = []
            errors = []
            
            for fix in fixes:
                try:
                    # Validate fix safety
                    if not await self._validate_fix_safety(fix, current_content):
                        logger.warning(f"Fix {fix.id} deemed unsafe, skipping")
                        continue
                    
                    # Apply single fix
                    fixed_content = await self._apply_single_fix(current_content, fix)
                    
                    if fixed_content and fixed_content != current_content:
                        # Validate the result
                        validation_result = await self._validate_fixed_content(abs_file_path, fixed_content)
                        
                        if validation_result == ValidationResult.VALID:
                            current_content = fixed_content
                            applied_fixes.append(fix.id)
                            
                            # Record fix attempt
                            self._record_fix_attempt(
                                fix, abs_file_path, original_content, current_content,
                                backup_path, git_commit_hash, FixResult.SUCCESS, validation_result
                            )
                        else:
                            logger.warning(f"Fix validation failed for {fix.id}")
                            errors.append(f"Fix validation failed: {fix.id}")
                
                except Exception as e:
                    logger.error(f"Error applying fix {fix.id}: {e}")
                    errors.append(f"Fix {fix.id}: {str(e)}")
            
            # Write final content if changes were made
            if current_content != original_content:
                with open(abs_file_path, 'w', encoding='utf-8') as f:
                    f.write(current_content)
                
                # Run additional validation
                await self._post_fix_validation(abs_file_path)
            
            return {
                "file_path": file_path,
                "status": "success",
                "applied_fixes": len(applied_fixes),
                "fix_ids": applied_fixes,
                "errors": errors,
                "backup_path": str(backup_path)
            }
        
        except Exception as e:
            logger.error(f"Critical error processing file {file_path}: {e}")
            
            # Restore from backup
            if backup_path and backup_path.exists():
                shutil.copy2(backup_path, abs_file_path)
                logger.info(f"Restored {file_path} from backup")
            
            return {
                "file_path": file_path,
                "status": "error",
                "applied_fixes": 0,
                "errors": [str(e)],
                "restored_from_backup": True
            }
    
    async def _validate_fix_safety(self, fix: ParsedFeedback, current_content: str) -> bool:
        """Validate that a fix is safe to apply"""
        if not fix.suggested_fix:
            return False
        
        suggested_fix = fix.suggested_fix.lower()
        
        # Check for dangerous operations
        for category, patterns in self.safety_patterns.items():
            for pattern in patterns:
                if re.search(pattern, suggested_fix, re.IGNORECASE):
                    logger.warning(f"Unsafe pattern detected in fix {fix.id}: {pattern}")
                    return False
        
        # Check safety score
        safety_score = self._calculate_fix_safety_score(fix, current_content)
        if safety_score < self.min_safety_score:
            logger.warning(f"Fix {fix.id} safety score too low: {safety_score}")
            return False
        
        # Category-specific checks
        if fix.category == FeedbackCategory.SECURITY:
            # Never auto-apply security fixes
            return False
        
        return True
    
    def _calculate_fix_safety_score(self, fix: ParsedFeedback, current_content: str) -> float:
        """Calculate safety score for a fix"""
        base_score = 0.5
        
        # Boost score for safe categories
        if fix.category in [FeedbackCategory.STYLE, FeedbackCategory.DOCUMENTATION]:
            base_score += 0.3
        
        # Boost score for simple fixes
        if fix.fix_complexity == "low":
            base_score += 0.2
        
        # Reduce score for complex fixes
        if fix.fix_complexity == "high":
            base_score -= 0.3
        
        # Boost score based on confidence
        if fix.confidence:
            confidence_map = {
                "very_high": 0.2,
                "high": 0.1,
                "medium": 0.0,
                "low": -0.1,
                "very_low": -0.2
            }
            base_score += confidence_map.get(fix.confidence.value, 0.0)
        
        # Check for risky patterns in current content around the fix
        context_lines = self._get_context_lines(current_content, fix.line_number, 5)
        for line in context_lines:
            for patterns in self.safety_patterns.values():
                for pattern in patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        base_score -= 0.1
        
        return max(0.0, min(1.0, base_score))
    
    def _get_context_lines(self, content: str, line_number: int, context_size: int) -> List[str]:
        """Get context lines around a specific line number"""
        lines = content.split('\n')
        start = max(0, line_number - context_size - 1)
        end = min(len(lines), line_number + context_size)
        return lines[start:end]
    
    async def _apply_single_fix(self, content: str, fix: ParsedFeedback) -> Optional[str]:
        """Apply a single fix to content"""
        if not fix.suggested_fix:
            return None
        
        try:
            # Parse suggested fix format
            operations = self._parse_fix_operations(fix.suggested_fix, fix.line_number)
            
            if not operations:
                logger.warning(f"Could not parse fix operations for {fix.id}")
                return None
            
            # Apply operations
            modified_content = content
            for operation in operations:
                modified_content = self._apply_fix_operation(modified_content, operation)
            
            return modified_content
        
        except Exception as e:
            logger.error(f"Error applying fix {fix.id}: {e}")
            return None
    
    def _parse_fix_operations(self, suggested_fix: str, line_number: int) -> List[FixOperation]:
        """Parse suggested fix into discrete operations"""
        operations = []
        
        # Handle common fix formats
        if "REPLACE:" in suggested_fix and "WITH:" in suggested_fix:
            parts = suggested_fix.split("WITH:")
            if len(parts) == 2:
                target = parts[0].replace("REPLACE:", "").strip()
                replacement = parts[1].strip()
                
                operations.append(FixOperation(
                    operation_type="replace",
                    target=target,
                    replacement=replacement,
                    line_range=(line_number, line_number),
                    confidence=0.8
                ))
        
        elif "DELETE:" in suggested_fix:
            target = suggested_fix.replace("DELETE:", "").strip()
            operations.append(FixOperation(
                operation_type="delete",
                target=target,
                replacement="",
                line_range=(line_number, line_number),
                confidence=0.7
            ))
        
        elif "INSERT:" in suggested_fix:
            text = suggested_fix.replace("INSERT:", "").strip()
            operations.append(FixOperation(
                operation_type="insert",
                target="",
                replacement=text,
                line_range=(line_number, line_number),
                confidence=0.6
            ))
        
        else:
            # Try to infer operation type
            if len(suggested_fix) < 10 and suggested_fix.strip() == "":
                # Likely removing something
                operations.append(FixOperation(
                    operation_type="delete_line",
                    target="",
                    replacement="",
                    line_range=(line_number, line_number),
                    confidence=0.5
                ))
        
        return operations
    
    def _apply_fix_operation(self, content: str, operation: FixOperation) -> str:
        """Apply a single fix operation to content"""
        lines = content.split('\n')
        
        if operation.operation_type == "replace":
            # Replace specific text in line
            line_idx = operation.line_range[0] - 1
            if 0 <= line_idx < len(lines):
                lines[line_idx] = lines[line_idx].replace(operation.target, operation.replacement)
        
        elif operation.operation_type == "delete":
            # Delete specific text from line
            line_idx = operation.line_range[0] - 1
            if 0 <= line_idx < len(lines):
                lines[line_idx] = lines[line_idx].replace(operation.target, "")
        
        elif operation.operation_type == "delete_line":
            # Delete entire line
            line_idx = operation.line_range[0] - 1
            if 0 <= line_idx < len(lines):
                del lines[line_idx]
        
        elif operation.operation_type == "insert":
            # Insert new line
            line_idx = operation.line_range[0] - 1
            if 0 <= line_idx <= len(lines):
                lines.insert(line_idx, operation.replacement)
        
        return '\n'.join(lines)
    
    async def _validate_fixed_content(self, file_path: Path, content: str) -> ValidationResult:
        """Validate fixed content"""
        # Syntax validation for Python files
        if file_path.suffix == '.py':
            try:
                ast.parse(content)
                return ValidationResult.VALID
            except SyntaxError as e:
                logger.error(f"Syntax error in fixed content: {e}")
                return ValidationResult.INVALID
        
        # Basic validation for other file types
        try:
            # Ensure content is valid UTF-8
            content.encode('utf-8')
            
            # Check for basic issues
            if content.strip() == "":
                return ValidationResult.INVALID
            
            return ValidationResult.VALID
        
        except Exception as e:
            logger.error(f"Content validation error: {e}")
            return ValidationResult.INVALID
    
    async def _create_backup(self, file_path: Path) -> Path:
        """Create backup of file before modification"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{file_path.name}.backup_{timestamp}"
        backup_path = self.backup_dir / backup_name
        
        shutil.copy2(file_path, backup_path)
        logger.info(f"Created backup: {backup_path}")
        
        return backup_path
    
    async def _create_git_checkpoint(self, file_path: Path) -> Optional[str]:
        """Create git checkpoint for rollback"""
        try:
            # Stage the file
            result = subprocess.run(
                ["git", "add", str(file_path)],
                capture_output=True, text=True, cwd=self.project_root
            )
            
            if result.returncode != 0:
                logger.warning(f"Could not stage file for git checkpoint: {result.stderr}")
                return None
            
            # Create commit
            commit_message = f"CodeRabbit: Checkpoint before auto-fix - {file_path.name}"
            result = subprocess.run(
                ["git", "commit", "-m", commit_message],
                capture_output=True, text=True, cwd=self.project_root
            )
            
            if result.returncode == 0:
                # Get commit hash
                result = subprocess.run(
                    ["git", "rev-parse", "HEAD"],
                    capture_output=True, text=True, cwd=self.project_root
                )
                
                commit_hash = result.stdout.strip()
                logger.info(f"Created git checkpoint: {commit_hash}")
                return commit_hash
            
        except Exception as e:
            logger.warning(f"Could not create git checkpoint: {e}")
        
        return None
    
    def _record_fix_attempt(
        self, 
        fix: ParsedFeedback, 
        file_path: Path, 
        original_content: str,
        fixed_content: str,
        backup_path: Path,
        git_commit_hash: Optional[str],
        result: FixResult,
        validation_result: ValidationResult
    ):
        """Record fix attempt for rollback capability"""
        diff = '\n'.join(difflib.unified_diff(
            original_content.splitlines(),
            fixed_content.splitlines(),
            fromfile=f"a/{file_path.name}",
            tofile=f"b/{file_path.name}",
            lineterm=""
        ))
        
        fix_attempt = FixAttempt(
            fix_id=fix.id,
            feedback_id=fix.id,  # Using same ID for now
            file_path=str(file_path),
            original_content=original_content,
            fixed_content=fixed_content,
            diff=diff,
            backup_path=str(backup_path) if backup_path else None,
            git_commit_hash=git_commit_hash,
            result=result,
            validation_result=validation_result,
            applied_at=datetime.utcnow(),
            safety_score=self._calculate_fix_safety_score(fix, original_content)
        )
        
        self.fix_history.append(fix_attempt)
        self.rollback_registry[fix.id] = fix_attempt
        
        # Update statistics
        self.fix_stats["total_attempts"] += 1
        if result == FixResult.SUCCESS:
            self.fix_stats["successful_fixes"] += 1
        elif result == FixResult.FAILED:
            self.fix_stats["failed_fixes"] += 1
        elif result == FixResult.SKIPPED:
            self.fix_stats["skipped_fixes"] += 1
    
    async def _post_fix_validation(self, file_path: Path):
        """Run additional validation after fixes are applied"""
        # Could run linting, type checking, etc.
        try:
            if file_path.suffix == '.py':
                # Run basic Python syntax check
                with open(file_path, 'r') as f:
                    content = f.read()
                    ast.parse(content)
                    logger.info(f"Post-fix validation passed for {file_path}")
        except Exception as e:
            logger.warning(f"Post-fix validation failed for {file_path}: {e}")
    
    async def rollback_fix(self, fix_id: str) -> Dict[str, Any]:
        """Rollback a specific fix"""
        if fix_id not in self.rollback_registry:
            return {
                "status": "error",
                "message": f"Fix {fix_id} not found in rollback registry"
            }
        
        fix_attempt = self.rollback_registry[fix_id]
        file_path = Path(fix_attempt.file_path)
        
        try:
            # Restore from git if available
            if fix_attempt.git_commit_hash and self.enable_git_integration:
                result = subprocess.run(
                    ["git", "checkout", fix_attempt.git_commit_hash, "--", str(file_path)],
                    capture_output=True, text=True, cwd=self.project_root
                )
                
                if result.returncode == 0:
                    fix_attempt.rollback_at = datetime.utcnow()
                    fix_attempt.result = FixResult.ROLLED_BACK
                    self.fix_stats["rolled_back_fixes"] += 1
                    
                    logger.info(f"Rolled back fix {fix_id} using git")
                    return {"status": "success", "method": "git"}
            
            # Restore from backup
            if fix_attempt.backup_path and Path(fix_attempt.backup_path).exists():
                shutil.copy2(fix_attempt.backup_path, file_path)
                
                fix_attempt.rollback_at = datetime.utcnow()
                fix_attempt.result = FixResult.ROLLED_BACK
                self.fix_stats["rolled_back_fixes"] += 1
                
                logger.info(f"Rolled back fix {fix_id} using backup")
                return {"status": "success", "method": "backup"}
            
            # Restore from stored content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fix_attempt.original_content)
            
            fix_attempt.rollback_at = datetime.utcnow()
            fix_attempt.result = FixResult.ROLLED_BACK
            self.fix_stats["rolled_back_fixes"] += 1
            
            logger.info(f"Rolled back fix {fix_id} using stored content")
            return {"status": "success", "method": "content"}
        
        except Exception as e:
            logger.error(f"Failed to rollback fix {fix_id}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def rollback_all_fixes(self, max_age_hours: Optional[int] = None) -> Dict[str, Any]:
        """Rollback all fixes, optionally within a time window"""
        rollback_count = 0
        errors = []
        
        for fix_id, fix_attempt in self.rollback_registry.items():
            # Check age limit
            if max_age_hours:
                age = datetime.utcnow() - fix_attempt.applied_at
                if age > timedelta(hours=max_age_hours):
                    continue
            
            # Skip already rolled back fixes
            if fix_attempt.result == FixResult.ROLLED_BACK:
                continue
            
            result = await self.rollback_fix(fix_id)
            if result["status"] == "success":
                rollback_count += 1
            else:
                errors.append(f"Fix {fix_id}: {result.get('message')}")
        
        return {
            "status": "completed",
            "rolled_back_count": rollback_count,
            "errors": errors
        }
    
    def get_fix_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get fix history with optional limit"""
        history = sorted(self.fix_history, key=lambda x: x.applied_at, reverse=True)
        
        if limit:
            history = history[:limit]
        
        return [
            {
                "fix_id": attempt.fix_id,
                "file_path": attempt.file_path,
                "result": attempt.result.value,
                "validation_result": attempt.validation_result.value,
                "applied_at": attempt.applied_at.isoformat(),
                "rollback_at": attempt.rollback_at.isoformat() if attempt.rollback_at else None,
                "safety_score": attempt.safety_score,
                "has_backup": bool(attempt.backup_path),
                "has_git_checkpoint": bool(attempt.git_commit_hash)
            }
            for attempt in history
        ]
    
    def get_fix_statistics(self) -> Dict[str, Any]:
        """Get comprehensive fix statistics"""
        return {
            **self.fix_stats,
            "success_rate": (
                self.fix_stats["successful_fixes"] / 
                max(self.fix_stats["total_attempts"], 1)
            ),
            "rollback_rate": (
                self.fix_stats["rolled_back_fixes"] / 
                max(self.fix_stats["successful_fixes"], 1)
            ),
            "active_fixes": len([f for f in self.fix_history if f.result == FixResult.SUCCESS]),
            "last_fix_time": max(
                (f.applied_at for f in self.fix_history), 
                default=None
            ).isoformat() if self.fix_history else None
        }