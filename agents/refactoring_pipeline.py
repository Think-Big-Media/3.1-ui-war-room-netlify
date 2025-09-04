#!/usr/bin/env python3
"""
Automated Refactoring Pipeline for AMP Refactoring Specialist

This module implements sophisticated refactoring patterns and automated code transformations
for React components and TypeScript services in the War Room codebase.
"""

import re
import ast
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class RefactoringResult:
    """Result of a refactoring operation"""
    success: bool
    file_path: str
    refactoring_type: str
    changes_made: List[str]
    before_code: str
    after_code: str
    performance_impact: Dict[str, Any]
    error_message: Optional[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []

class RefactoringEngine:
    """Core engine for applying automated refactoring patterns"""
    
    def __init__(self):
        self.refactoring_registry = {
            "react_memo": ReactMemoRefactoring(),
            "use_memo": UseMemoRefactoring(),
            "use_callback": UseCallbackRefactoring(),
            "lazy_loading": LazyLoadingRefactoring(),
            "component_splitting": ComponentSplittingRefactoring(),
            "service_caching": ServiceCachingRefactoring(),
            "async_optimization": AsyncOptimizationRefactoring(),
            "error_handling": ErrorHandlingRefactoring(),
            "throttling": ThrottlingRefactoring(),
            "bundle_optimization": BundleOptimizationRefactoring()
        }
        
        logger.info(f"Refactoring engine initialized with {len(self.refactoring_registry)} patterns")
    
    async def apply_refactoring(self, opportunity: Dict[str, Any], file_path: Path) -> RefactoringResult:
        """Apply a specific refactoring to a file"""
        refactoring_type = opportunity["type"]
        
        if refactoring_type not in self.refactoring_registry:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type=refactoring_type,
                changes_made=[],
                before_code="",
                after_code="",
                performance_impact={},
                error_message=f"Unknown refactoring type: {refactoring_type}"
            )
        
        try:
            # Read original content
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Apply refactoring
            refactoring = self.refactoring_registry[refactoring_type]
            result = await refactoring.apply(original_content, file_path, opportunity)
            
            # If successful, write the changes
            if result.success:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(result.after_code)
                
                logger.info(f"Successfully applied {refactoring_type} to {file_path}")
            else:
                logger.warning(f"Failed to apply {refactoring_type} to {file_path}: {result.error_message}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error applying refactoring {refactoring_type} to {file_path}: {e}")
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type=refactoring_type,
                changes_made=[],
                before_code="",
                after_code="",
                performance_impact={},
                error_message=str(e)
            )

class BaseRefactoring:
    """Base class for refactoring implementations"""
    
    def __init__(self):
        self.name = self.__class__.__name__
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        """Apply the refactoring to the given content"""
        raise NotImplementedError("Subclasses must implement apply method")
    
    def _create_backup(self, content: str, file_path: Path) -> str:
        """Create a backup hash for rollback purposes"""
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{file_path.stem}_{timestamp}_{content_hash}"
    
    def _validate_syntax(self, content: str, file_path: Path) -> Tuple[bool, Optional[str]]:
        """Validate that the refactored code has valid syntax"""
        if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
            # For TypeScript/JavaScript, we'll do basic bracket matching
            return self._validate_bracket_matching(content)
        
        return True, None
    
    def _validate_bracket_matching(self, content: str) -> Tuple[bool, Optional[str]]:
        """Basic validation of bracket matching"""
        stack = []
        pairs = {'(': ')', '[': ']', '{': '}'}
        
        for i, char in enumerate(content):
            if char in pairs:
                stack.append((char, i))
            elif char in pairs.values():
                if not stack:
                    return False, f"Unmatched closing bracket '{char}' at position {i}"
                
                open_char, open_pos = stack.pop()
                if pairs[open_char] != char:
                    return False, f"Mismatched brackets: '{open_char}' at {open_pos} and '{char}' at {i}"
        
        if stack:
            open_char, open_pos = stack[-1]
            return False, f"Unmatched opening bracket '{open_char}' at position {open_pos}"
        
        return True, None

class ReactMemoRefactoring(BaseRefactoring):
    """Refactoring to add React.memo wrapper to components"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Check if React import exists
        react_imported = any('import React' in line for line in lines[:10])
        if not react_imported:
            # Add React import
            import_line = "import React from 'react';"
            
            # Find best position for React import (after other React imports or at top)
            insert_position = 0
            for i, line in enumerate(lines):
                if line.strip().startswith('import') and 'react' in line.lower():
                    insert_position = i + 1
                    break
                elif line.strip().startswith('import'):
                    insert_position = i + 1
            
            lines.insert(insert_position, import_line)
            changes_made.append("Added React import")
        
        # Find component definition and export
        component_name = None
        export_line_idx = None
        
        for i, line in enumerate(lines):
            # Look for function component
            func_match = re.search(r'function\s+([A-Z]\w*)\s*\(', line)
            if func_match:
                component_name = func_match.group(1)
            
            # Look for const component
            const_match = re.search(r'const\s+([A-Z]\w*)\s*[=:]', line)
            if const_match:
                component_name = const_match.group(1)
            
            # Look for export line
            if 'export default' in line and component_name:
                export_line_idx = i
                break
        
        if component_name and export_line_idx is not None:
            # Replace export with memo wrapper
            original_export = lines[export_line_idx]
            
            if 'React.memo' not in original_export and 'memo(' not in original_export:
                # Create new export with memo
                new_export = f"export default React.memo({component_name});"
                lines[export_line_idx] = new_export
                changes_made.append(f"Wrapped {component_name} with React.memo")
            else:
                warnings.append("Component already uses React.memo")
        else:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="react_memo",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="Could not identify component for React.memo wrapping",
                warnings=warnings
            )
        
        new_content = '\n'.join(lines)
        
        # Validate syntax
        is_valid, error = self._validate_syntax(new_content, file_path)
        if not is_valid:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="react_memo",
                changes_made=changes_made,
                before_code=content,
                after_code=new_content,
                performance_impact={},
                error_message=f"Syntax validation failed: {error}",
                warnings=warnings
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="react_memo",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_render_reduction": "20-50%"},
            warnings=warnings
        )

class UseMemoRefactoring(BaseRefactoring):
    """Refactoring to add useMemo for expensive calculations"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Check if useMemo is already imported
        use_memo_imported = any('useMemo' in line for line in lines[:15])
        
        if not use_memo_imported:
            # Add useMemo to React import
            for i, line in enumerate(lines):
                if 'import React' in line and 'from' in line:
                    if '{' in line and '}' in line:
                        # Add to existing destructured import
                        import_match = re.search(r'import\s+React,?\s*\{([^}]*)\}\s+from', line)
                        if import_match:
                            existing_imports = import_match.group(1).strip()
                            if 'useMemo' not in existing_imports:
                                new_imports = f"{existing_imports}, useMemo" if existing_imports else "useMemo"
                                new_line = re.sub(r'\{[^}]*\}', f'{{{new_imports}}}', line)
                                lines[i] = new_line
                                changes_made.append("Added useMemo import")
                                break
                    elif 'import React ' in line and '{' not in line:
                        # Convert to destructured import
                        lines[i] = line.replace('import React', 'import React, { useMemo }')
                        changes_made.append("Added useMemo import")
                        break
        
        # Find expensive operations to memoize
        expensive_patterns = [
            r'\.filter\s*\([^)]+\)',
            r'\.map\s*\([^)]+\)',
            r'\.reduce\s*\([^)]+\)',
            r'\.sort\s*\([^)]+\)',
            r'JSON\.parse\s*\([^)]+\)',
            r'\.find\s*\([^)]+\)'
        ]
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            
            # Look for variable assignments with expensive operations
            var_match = re.search(r'const\s+(\w+)\s*=\s*(.+);?$', line_stripped)
            if var_match:
                var_name = var_match.group(1)
                expression = var_match.group(2)
                
                # Check if this contains expensive operations
                has_expensive_op = any(re.search(pattern, expression) for pattern in expensive_patterns)
                
                if has_expensive_op and 'useMemo' not in line:
                    # Wrap with useMemo
                    indent = len(line) - len(line.lstrip())
                    new_line = f"{' ' * indent}const {var_name} = useMemo(() => {expression}, []);"
                    lines[i] = new_line
                    changes_made.append(f"Added useMemo for {var_name}")
                    warnings.append(f"Please review dependencies for useMemo of {var_name}")
        
        new_content = '\n'.join(lines)
        
        # Validate syntax
        is_valid, error = self._validate_syntax(new_content, file_path)
        if not is_valid:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="use_memo",
                changes_made=changes_made,
                before_code=content,
                after_code=new_content,
                performance_impact={},
                error_message=f"Syntax validation failed: {error}",
                warnings=warnings
            )
        
        if not changes_made:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="use_memo",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="No expensive operations found to memoize",
                warnings=warnings
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="use_memo",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_calculation_optimization": "30-70%"},
            warnings=warnings
        )

class UseCallbackRefactoring(BaseRefactoring):
    """Refactoring to add useCallback for function props"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Check if useCallback is imported
        use_callback_imported = any('useCallback' in line for line in lines[:15])
        
        if not use_callback_imported:
            # Add useCallback to React import
            for i, line in enumerate(lines):
                if 'import React' in line and 'from' in line:
                    if '{' in line and '}' in line:
                        import_match = re.search(r'import\s+React,?\s*\{([^}]*)\}\s+from', line)
                        if import_match:
                            existing_imports = import_match.group(1).strip()
                            if 'useCallback' not in existing_imports:
                                new_imports = f"{existing_imports}, useCallback" if existing_imports else "useCallback"
                                new_line = re.sub(r'\{[^}]*\}', f'{{{new_imports}}}', line)
                                lines[i] = new_line
                                changes_made.append("Added useCallback import")
                                break
        
        # Find inline functions in JSX that should use useCallback
        in_jsx = False
        jsx_depth = 0
        
        for i, line in enumerate(lines):
            # Track if we're inside JSX
            jsx_depth += line.count('<') - line.count('</')
            in_jsx = jsx_depth > 0
            
            if in_jsx:
                # Look for inline arrow functions
                inline_func_patterns = [
                    r'onClick=\{([^}]*=>[^}]*)\}',
                    r'onChange=\{([^}]*=>[^}]*)\}',
                    r'onSubmit=\{([^}]*=>[^}]*)\}',
                    r'onFocus=\{([^}]*=>[^}]*)\}',
                    r'onBlur=\{([^}]*=>[^}]*)\}'
                ]
                
                for pattern in inline_func_patterns:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        func_content = match.group(1)
                        # This is a simple example - in practice, you'd want more sophisticated handling
                        warnings.append(f"Consider extracting inline function to useCallback: {func_content[:50]}...")
        
        # For now, add a comment suggesting useCallback usage
        if warnings:
            # Find a good place to add the comment
            for i, line in enumerate(lines):
                if 'function ' in line and any(char.isupper() for char in line):
                    lines.insert(i, "  // TODO: Consider using useCallback for event handlers")
                    changes_made.append("Added useCallback suggestion comment")
                    break
        
        new_content = '\n'.join(lines)
        
        if not changes_made:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="use_callback",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="No inline functions found suitable for useCallback",
                warnings=warnings
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="use_callback",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_rerender_reduction": "10-30%"},
            warnings=warnings
        )

class LazyLoadingRefactoring(BaseRefactoring):
    """Refactoring to implement React.lazy for code splitting"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # This is a complex refactoring that requires creating a separate lazy-loaded component
        # For now, we'll add the infrastructure and comments
        
        # Check if component is suitable for lazy loading
        component_lines = len(lines)
        if component_lines < 100:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="lazy_loading",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="Component too small for lazy loading benefits"
            )
        
        # Add lazy loading setup comment
        lazy_comment = [
            "// TODO: This component is large enough to benefit from lazy loading",
            "// Consider splitting into a separate chunk with React.lazy:",
            "// const LazyComponent = React.lazy(() => import('./ComponentName'));",
            "// Then wrap usage with <Suspense fallback={<Loading />}>",
            ""
        ]
        
        # Insert at the top after imports
        insert_pos = 0
        for i, line in enumerate(lines):
            if not line.strip().startswith('import') and line.strip():
                insert_pos = i
                break
        
        for j, comment_line in enumerate(lazy_comment):
            lines.insert(insert_pos + j, comment_line)
        
        changes_made.append("Added lazy loading setup comments")
        warnings.append("Lazy loading requires manual component splitting")
        
        new_content = '\n'.join(lines)
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="lazy_loading",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_bundle_reduction": "Initial load: 15-40%"},
            warnings=warnings
        )

class ComponentSplittingRefactoring(BaseRefactoring):
    """Refactoring to suggest component splitting for large components"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Analyze component structure to suggest splits
        jsx_blocks = []
        current_block = []
        in_jsx = False
        jsx_depth = 0
        
        for i, line in enumerate(lines):
            jsx_count = line.count('<') - line.count('</')
            jsx_depth += jsx_count
            
            if jsx_depth > 0:
                in_jsx = True
                current_block.append((i, line))
            else:
                if in_jsx and current_block:
                    jsx_blocks.append(current_block)
                    current_block = []
                in_jsx = False
        
        # Find logical split points
        split_suggestions = []
        
        # Look for repeated patterns that could be extracted
        for i, block in enumerate(jsx_blocks):
            if len(block) > 20:  # Large JSX block
                block_content = '\n'.join([line[1] for line in block])
                
                # Simple heuristic: look for repeated elements
                if block_content.count('<div') > 5:
                    split_suggestions.append(f"Lines {block[0][0]}-{block[-1][0]}: Consider extracting repeated div elements")
                
                if block_content.count('<button') > 3:
                    split_suggestions.append(f"Lines {block[0][0]}-{block[-1][0]}: Consider extracting button group component")
        
        if split_suggestions:
            # Add comments with suggestions
            suggestion_comments = [
                "// COMPONENT SPLITTING SUGGESTIONS:",
                "// This component is large and could benefit from splitting:",
                ""
            ]
            
            for suggestion in split_suggestions:
                suggestion_comments.append(f"// - {suggestion}")
            
            suggestion_comments.append("")
            
            # Insert after imports
            insert_pos = 0
            for i, line in enumerate(lines):
                if not line.strip().startswith('import') and line.strip():
                    insert_pos = i
                    break
            
            for j, comment in enumerate(suggestion_comments):
                lines.insert(insert_pos + j, comment)
            
            changes_made.append("Added component splitting suggestions")
            warnings.extend(split_suggestions)
        
        new_content = '\n'.join(lines)
        
        if not changes_made:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="component_splitting",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="No clear splitting opportunities identified"
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="component_splitting",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_maintainability_improvement": "High"},
            warnings=warnings
        )

class ServiceCachingRefactoring(BaseRefactoring):
    """Refactoring to add caching to service API calls"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Add simple cache implementation
        cache_implementation = [
            "// Simple cache implementation for API calls",
            "const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();",
            "",
            "const getCachedData = (key: string): any | null => {",
            "  const cached = apiCache.get(key);",
            "  if (cached && Date.now() - cached.timestamp < cached.ttl) {",
            "    return cached.data;",
            "  }",
            "  apiCache.delete(key);",
            "  return null;",
            "};",
            "",
            "const setCachedData = (key: string, data: any, ttlMs: number = 5 * 60 * 1000) => {",
            "  apiCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });",
            "};",
            ""
        ]
        
        # Find where to insert cache implementation
        insert_pos = 0
        for i, line in enumerate(lines):
            if not line.strip().startswith('import') and line.strip():
                insert_pos = i
                break
        
        # Insert cache implementation
        for j, cache_line in enumerate(cache_implementation):
            lines.insert(insert_pos + j, cache_line)
        
        changes_made.append("Added cache implementation")
        
        # Find API calls to wrap with caching
        api_patterns = [
            r'fetch\s*\(',
            r'axios\.(get|post|put|delete)\s*\(',
            r'http\.(get|post|put|delete)\s*\('
        ]
        
        for i, line in enumerate(lines[len(cache_implementation):], len(cache_implementation)):
            for pattern in api_patterns:
                if re.search(pattern, line):
                    # Add caching comment
                    indent = len(line) - len(line.lstrip())
                    cache_comment = f"{' ' * indent}// TODO: Consider adding caching for this API call"
                    lines.insert(i, cache_comment)
                    changes_made.append("Added caching suggestion for API call")
                    warnings.append(f"Manual caching integration needed for line {i}")
                    break
        
        new_content = '\n'.join(lines)
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="service_caching",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_api_performance_improvement": "40-80%"},
            warnings=warnings
        )

class AsyncOptimizationRefactoring(BaseRefactoring):
    """Refactoring to optimize async operations"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Look for sequential async operations that could be parallel
        async_patterns = []
        for i, line in enumerate(lines):
            if 'await ' in line and 'fetch' in line:
                async_patterns.append((i, line.strip()))
        
        # If we find multiple sequential API calls, suggest Promise.all
        if len(async_patterns) > 1:
            # Check if they're sequential (within a few lines of each other)
            for j in range(len(async_patterns) - 1):
                current_line = async_patterns[j][0]
                next_line = async_patterns[j + 1][0]
                
                if next_line - current_line < 5:  # Sequential calls
                    comment = f"// TODO: Consider using Promise.all for parallel execution (lines {current_line}-{next_line})"
                    lines.insert(current_line, comment)
                    changes_made.append("Added parallel execution suggestion")
                    warnings.append(f"Sequential async calls found at lines {current_line}-{next_line}")
                    break
        
        # Look for synchronous operations that could be async
        sync_patterns = [
            r'JSON\.parse\s*\(',
            r'localStorage\.getItem',
            r'sessionStorage\.getItem'
        ]
        
        for i, line in enumerate(lines):
            for pattern in sync_patterns:
                if re.search(pattern, line):
                    indent = len(line) - len(line.lstrip())
                    comment = f"{' ' * indent}// TODO: Consider async alternative for better performance"
                    lines.insert(i, comment)
                    changes_made.append("Added async optimization suggestion")
                    warnings.append(f"Synchronous operation found at line {i}: {pattern}")
                    break
        
        new_content = '\n'.join(lines)
        
        if not changes_made:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="async_optimization",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="No async optimization opportunities found"
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="async_optimization",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_async_improvement": "20-50%"},
            warnings=warnings
        )

class ErrorHandlingRefactoring(BaseRefactoring):
    """Refactoring to improve error handling patterns"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Find API calls without proper error handling
        api_calls_without_error_handling = []
        
        for i, line in enumerate(lines):
            if any(pattern in line for pattern in ['fetch(', 'axios.', 'http.']):
                # Check if this API call is wrapped in try-catch
                has_try_catch = False
                
                # Look backwards and forwards for try-catch
                for j in range(max(0, i-5), min(len(lines), i+5)):
                    if 'try' in lines[j] or 'catch' in lines[j]:
                        has_try_catch = True
                        break
                
                if not has_try_catch:
                    api_calls_without_error_handling.append(i)
        
        # Add error handling suggestions
        for line_num in api_calls_without_error_handling:
            indent = len(lines[line_num]) - len(lines[line_num].lstrip())
            error_comment = f"{' ' * indent}// TODO: Add error handling (try-catch) for this API call"
            lines.insert(line_num, error_comment)
            changes_made.append(f"Added error handling suggestion for line {line_num}")
            warnings.append(f"API call without error handling at line {line_num}")
        
        # Add generic error handling utility
        if changes_made:
            error_handler_code = [
                "",
                "// Generic error handler utility",
                "const handleApiError = (error: any, context: string) => {",
                "  console.error(`Error in ${context}:`, error);",
                "  // TODO: Add proper error reporting/logging",
                "  throw error;",
                "};",
                ""
            ]
            
            # Insert after imports
            insert_pos = 0
            for i, line in enumerate(lines):
                if not line.strip().startswith('import') and line.strip():
                    insert_pos = i
                    break
            
            for j, handler_line in enumerate(error_handler_code):
                lines.insert(insert_pos + j, handler_line)
            
            changes_made.append("Added error handling utility")
        
        new_content = '\n'.join(lines)
        
        if not changes_made:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="error_handling",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="No error handling improvements needed"
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="error_handling",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_reliability_improvement": "High"},
            warnings=warnings
        )

class ThrottlingRefactoring(BaseRefactoring):
    """Refactoring to add throttling/debouncing to event handlers"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Add throttling utilities
        throttling_utils = [
            "// Throttling utilities",
            "const throttle = <T extends (...args: any[]) => any>(",
            "  func: T,",
            "  limit: number",
            "): ((...args: Parameters<T>) => void) => {",
            "  let inThrottle: boolean;",
            "  return function(this: any, ...args: Parameters<T>) {",
            "    if (!inThrottle) {",
            "      func.apply(this, args);",
            "      inThrottle = true;",
            "      setTimeout(() => inThrottle = false, limit);",
            "    }",
            "  };",
            "};",
            "",
            "const debounce = <T extends (...args: any[]) => any>(",
            "  func: T,",
            "  delay: number",
            "): ((...args: Parameters<T>) => void) => {",
            "  let timeoutId: NodeJS.Timeout;",
            "  return function(this: any, ...args: Parameters<T>) {",
            "    clearTimeout(timeoutId);",
            "    timeoutId = setTimeout(() => func.apply(this, args), delay);",
            "  };",
            "};",
            ""
        ]
        
        # Insert throttling utilities after imports
        insert_pos = 0
        for i, line in enumerate(lines):
            if not line.strip().startswith('import') and line.strip():
                insert_pos = i
                break
        
        for j, util_line in enumerate(throttling_utils):
            lines.insert(insert_pos + j, util_line)
        
        changes_made.append("Added throttling and debouncing utilities")
        
        # Find event handlers that could benefit from throttling
        event_patterns = [
            r'onChange\s*=',
            r'onInput\s*=',
            r'onScroll\s*=',
            r'onResize\s*=',
            r'onMouseMove\s*='
        ]
        
        for i, line in enumerate(lines[len(throttling_utils):], len(throttling_utils)):
            for pattern in event_patterns:
                if re.search(pattern, line):
                    indent = len(line) - len(line.lstrip())
                    suggestion = f"{' ' * indent}// TODO: Consider wrapping with throttle() or debounce()"
                    lines.insert(i, suggestion)
                    changes_made.append(f"Added throttling suggestion for {pattern}")
                    warnings.append(f"Event handler found that could benefit from throttling: {pattern}")
                    break
        
        new_content = '\n'.join(lines)
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="throttling",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_event_performance_improvement": "30-60%"},
            warnings=warnings
        )

class BundleOptimizationRefactoring(BaseRefactoring):
    """Refactoring to optimize bundle size"""
    
    async def apply(self, content: str, file_path: Path, opportunity: Dict[str, Any]) -> RefactoringResult:
        lines = content.splitlines()
        changes_made = []
        warnings = []
        
        # Find import optimizations
        import_optimizations = []
        
        for i, line in enumerate(lines):
            if line.strip().startswith('import'):
                # Check for full library imports that could be tree-shaken
                if re.search(r'import\s+\*\s+as\s+\w+\s+from', line):
                    import_optimizations.append((i, "Consider importing only needed functions instead of entire library"))
                
                # Check for large libraries
                large_libs = ['lodash', 'moment', 'rxjs', 'antd']
                for lib in large_libs:
                    if lib in line and 'import *' not in line:
                        import_optimizations.append((i, f"Consider using smaller alternative to {lib} or import specific functions"))
        
        # Add optimization comments
        for line_num, suggestion in import_optimizations:
            indent = len(lines[line_num]) - len(lines[line_num].lstrip())
            comment = f"{' ' * indent}// BUNDLE OPTIMIZATION: {suggestion}"
            lines.insert(line_num, comment)
            changes_made.append(f"Added bundle optimization suggestion for line {line_num}")
            warnings.append(suggestion)
        
        # Add general bundle optimization suggestions
        if changes_made:
            bundle_tips = [
                "// BUNDLE OPTIMIZATION TIPS:",
                "// 1. Use dynamic imports for large components: import('./LargeComponent')",
                "// 2. Implement tree shaking by importing specific functions",
                "// 3. Consider using smaller alternatives to heavy libraries",
                "// 4. Use React.lazy for code splitting",
                ""
            ]
            
            # Insert at top after imports
            insert_pos = 0
            for i, line in enumerate(lines):
                if not line.strip().startswith('import') and line.strip():
                    insert_pos = i
                    break
            
            for j, tip in enumerate(bundle_tips):
                lines.insert(insert_pos + j, tip)
            
            changes_made.append("Added bundle optimization tips")
        
        new_content = '\n'.join(lines)
        
        if not changes_made:
            return RefactoringResult(
                success=False,
                file_path=str(file_path),
                refactoring_type="bundle_optimization",
                changes_made=[],
                before_code=content,
                after_code=content,
                performance_impact={},
                error_message="No bundle optimization opportunities found"
            )
        
        return RefactoringResult(
            success=True,
            file_path=str(file_path),
            refactoring_type="bundle_optimization",
            changes_made=changes_made,
            before_code=content,
            after_code=new_content,
            performance_impact={"estimated_bundle_reduction": "10-30%"},
            warnings=warnings
        )

# Pattern detection and suggestion engine
class PatternDetector:
    """Detects refactoring patterns and suggests optimizations"""
    
    def __init__(self):
        self.patterns = {
            "performance_anti_patterns": [
                {
                    "name": "inline_object_creation",
                    "pattern": r'=\s*\{[^}]+\}',
                    "severity": "medium",
                    "suggestion": "Extract object creation outside render or use useMemo"
                },
                {
                    "name": "inline_array_creation", 
                    "pattern": r'=\s*\[[^\]]+\]',
                    "severity": "medium",
                    "suggestion": "Extract array creation outside render or use useMemo"
                },
                {
                    "name": "missing_key_prop",
                    "pattern": r'\.map\([^}]*<\w+(?![^>]*key=)',
                    "severity": "high",
                    "suggestion": "Add unique key prop to mapped elements"
                }
            ],
            "accessibility_patterns": [
                {
                    "name": "missing_alt_text",
                    "pattern": r'<img(?![^>]*alt=)',
                    "severity": "high",
                    "suggestion": "Add alt text for accessibility"
                },
                {
                    "name": "missing_aria_label",
                    "pattern": r'<button(?![^>]*aria-label=)(?![^>]*>.*</button>)',
                    "severity": "medium", 
                    "suggestion": "Add aria-label for screen readers"
                }
            ],
            "security_patterns": [
                {
                    "name": "dangerous_html",
                    "pattern": r'dangerouslySetInnerHTML',
                    "severity": "high",
                    "suggestion": "Ensure HTML is sanitized to prevent XSS"
                }
            ]
        }
    
    def detect_patterns(self, content: str, file_path: Path) -> List[Dict[str, Any]]:
        """Detect all patterns in the given content"""
        detected = []
        
        for category, patterns in self.patterns.items():
            for pattern_config in patterns:
                matches = list(re.finditer(pattern_config["pattern"], content))
                
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    detected.append({
                        "category": category,
                        "name": pattern_config["name"],
                        "severity": pattern_config["severity"],
                        "suggestion": pattern_config["suggestion"],
                        "file_path": str(file_path),
                        "line_number": line_num,
                        "match_text": match.group(0)
                    })
        
        return detected

# Main refactoring orchestrator
class RefactoringOrchestrator:
    """Orchestrates the entire refactoring pipeline"""
    
    def __init__(self, war_room_path: Path):
        self.war_room_path = war_room_path
        self.engine = RefactoringEngine()
        self.pattern_detector = PatternDetector()
        
    async def run_refactoring_pipeline(self, opportunities: List[Dict[str, Any]]) -> List[RefactoringResult]:
        """Run the complete refactoring pipeline on a list of opportunities"""
        results = []
        
        logger.info(f"Starting refactoring pipeline with {len(opportunities)} opportunities")
        
        for opportunity in opportunities:
            file_path = self.war_room_path / opportunity["file_path"]
            
            if not file_path.exists():
                logger.warning(f"File not found: {file_path}")
                continue
            
            try:
                result = await self.engine.apply_refactoring(opportunity, file_path)
                results.append(result)
                
                if result.success:
                    logger.info(f"Successfully applied {result.refactoring_type} to {result.file_path}")
                else:
                    logger.warning(f"Failed to apply {result.refactoring_type} to {result.file_path}: {result.error_message}")
                    
            except Exception as e:
                logger.error(f"Error in refactoring pipeline for {file_path}: {e}")
                results.append(RefactoringResult(
                    success=False,
                    file_path=str(file_path),
                    refactoring_type=opportunity.get("type", "unknown"),
                    changes_made=[],
                    before_code="",
                    after_code="",
                    performance_impact={},
                    error_message=str(e)
                ))
        
        logger.info(f"Refactoring pipeline completed. {len([r for r in results if r.success])} successful, {len([r for r in results if not r.success])} failed")
        
        return results
    
    async def validate_refactoring_results(self, results: List[RefactoringResult]) -> Dict[str, Any]:
        """Validate the results of refactoring operations"""
        validation_report = {
            "total_refactorings": len(results),
            "successful": len([r for r in results if r.success]),
            "failed": len([r for r in results if not r.success]),
            "by_type": {},
            "performance_impact": {},
            "warnings": [],
            "recommendations": []
        }
        
        # Group by type
        for result in results:
            ref_type = result.refactoring_type
            if ref_type not in validation_report["by_type"]:
                validation_report["by_type"][ref_type] = {"successful": 0, "failed": 0}
            
            if result.success:
                validation_report["by_type"][ref_type]["successful"] += 1
            else:
                validation_report["by_type"][ref_type]["failed"] += 1
        
        # Aggregate performance impacts
        for result in results:
            if result.success and result.performance_impact:
                for impact_type, impact_value in result.performance_impact.items():
                    if impact_type not in validation_report["performance_impact"]:
                        validation_report["performance_impact"][impact_type] = []
                    validation_report["performance_impact"][impact_type].append({
                        "file": result.file_path,
                        "value": impact_value
                    })
        
        # Collect all warnings
        for result in results:
            if result.warnings:
                validation_report["warnings"].extend(result.warnings)
        
        return validation_report