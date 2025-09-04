#!/usr/bin/env python3
"""
Performance Analyzer for AMP Refactoring Specialist

This module provides detailed performance analysis for React components and TypeScript services.
It includes advanced metrics calculation, bundle analysis, and optimization opportunity detection.
"""

import ast
import re
import json
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class ReactComponentAnalyzer:
    """Analyzer for React components performance metrics"""
    
    def __init__(self):
        self.react_hooks = [
            'useState', 'useEffect', 'useContext', 'useReducer', 
            'useMemo', 'useCallback', 'useRef', 'useImperativeHandle',
            'useLayoutEffect', 'useDebugValue', 'useDeferredValue',
            'useTransition', 'useId', 'useSyncExternalStore'
        ]
        
        self.performance_hooks = ['useMemo', 'useCallback', 'memo', 'lazy']
        self.expensive_operations = [
            r'\.filter\(', r'\.map\(', r'\.reduce\(', r'\.sort\(',
            r'\.find\(', r'\.forEach\(', r'JSON\.parse\(', r'JSON\.stringify\(',
            r'new Date\(', r'new RegExp\(', r'Math\.\w+\('
        ]
    
    def analyze_component(self, content: str, file_path: Path) -> Dict[str, Any]:
        """Comprehensive analysis of a React component"""
        
        metrics = {
            "file_info": {
                "path": str(file_path),
                "size_bytes": len(content),
                "lines": len(content.splitlines()),
                "is_typescript": file_path.suffix == '.tsx'
            },
            "component_structure": self._analyze_component_structure(content),
            "performance_metrics": self._analyze_performance_patterns(content),
            "complexity_metrics": self._analyze_complexity(content),
            "optimization_opportunities": self._identify_optimization_opportunities(content),
            "bundle_impact": self._analyze_bundle_impact(content),
            "accessibility": self._analyze_accessibility(content),
            "best_practices": self._check_best_practices(content)
        }
        
        # Calculate overall scores
        metrics["scores"] = self._calculate_scores(metrics)
        
        return metrics
    
    def _analyze_component_structure(self, content: str) -> Dict[str, Any]:
        """Analyze the structure of React components in the file"""
        structure = {
            "components_count": 0,
            "component_types": [],
            "export_type": "unknown",
            "has_default_props": False,
            "has_prop_types": False,
            "component_names": []
        }
        
        lines = content.splitlines()
        
        # Find component declarations
        component_patterns = [
            r'function\s+(\w+)\s*\(',
            r'const\s+(\w+)\s*=\s*\(',
            r'export\s+default\s+function\s+(\w+)',
            r'export\s+function\s+(\w+)'
        ]
        
        for line in lines:
            for pattern in component_patterns:
                matches = re.findall(pattern, line)
                if matches:
                    # Check if it's likely a React component (starts with capital)
                    for match in matches:
                        if match[0].isupper():
                            structure["components_count"] += 1
                            structure["component_names"].append(match)
                            
                            if 'function' in line:
                                structure["component_types"].append("functional")
                            else:
                                structure["component_types"].append("arrow")
        
        # Determine export type
        if 'export default' in content:
            structure["export_type"] = "default"
        elif 'export ' in content:
            structure["export_type"] = "named"
        
        # Check for prop types and default props
        structure["has_default_props"] = 'defaultProps' in content
        structure["has_prop_types"] = 'PropTypes' in content or 'propTypes' in content
        
        return structure
    
    def _analyze_performance_patterns(self, content: str) -> Dict[str, Any]:
        """Analyze performance-related patterns in the component"""
        patterns = {
            "optimization_hooks": {
                "has_memo": self._check_pattern(content, [r'React\.memo\(', r'\bmemo\(']),
                "has_use_memo": self._check_pattern(content, [r'useMemo\(']),
                "has_use_callback": self._check_pattern(content, [r'useCallback\(']),
                "has_lazy": self._check_pattern(content, [r'React\.lazy\(', r'\blazy\(']),
                "has_suspense": self._check_pattern(content, [r'<Suspense']),
            },
            "performance_anti_patterns": {
                "inline_objects": len(re.findall(r'=\s*\{[^}]*\}', content)),
                "inline_arrays": len(re.findall(r'=\s*\[[^\]]*\]', content)),
                "inline_functions": len(re.findall(r'=>', content)) + len(re.findall(r'function\s*\(', content)),
                "anonymous_functions_in_jsx": len(re.findall(r'\{[^}]*=>[^}]*\}', content)),
                "object_creation_in_render": len(re.findall(r'new\s+\w+\(', content))
            },
            "expensive_operations": {
                "in_render": self._count_expensive_operations_in_render(content),
                "total": sum(len(re.findall(op, content)) for op in self.expensive_operations)
            },
            "hook_usage": self._analyze_hook_usage(content),
            "conditional_rendering": {
                "ternary_operators": content.count('?'),
                "logical_and": content.count('&&'),
                "early_returns": len(re.findall(r'if\s*\([^)]+\)\s*return', content))
            }
        }
        
        return patterns
    
    def _analyze_complexity(self, content: str) -> Dict[str, Any]:
        """Analyze code complexity metrics"""
        complexity = {
            "cyclomatic_complexity": self._calculate_cyclomatic_complexity(content),
            "nesting_depth": self._calculate_max_nesting_depth(content),
            "jsx_nesting": self._calculate_jsx_nesting_depth(content),
            "function_length": self._analyze_function_lengths(content),
            "parameter_count": self._analyze_parameter_counts(content),
            "cognitive_complexity": self._calculate_cognitive_complexity(content)
        }
        
        return complexity
    
    def _identify_optimization_opportunities(self, content: str) -> List[Dict[str, Any]]:
        """Identify specific optimization opportunities"""
        opportunities = []
        
        # Check for missing React.memo
        if not self._check_pattern(content, [r'React\.memo\(', r'\bmemo\(']):
            if self._should_use_memo(content):
                opportunities.append({
                    "type": "react_memo",
                    "priority": "medium",
                    "description": "Component could benefit from React.memo",
                    "reason": "Component receives props and has sufficient complexity"
                })
        
        # Check for expensive calculations without useMemo
        expensive_ops = self._count_expensive_operations_in_render(content)
        if expensive_ops > 0 and not self._check_pattern(content, [r'useMemo\(']):
            opportunities.append({
                "type": "use_memo",
                "priority": "high",
                "description": f"Found {expensive_ops} expensive operations that could be memoized",
                "reason": "Expensive calculations in render without memoization"
            })
        
        # Check for inline functions in JSX
        inline_funcs = len(re.findall(r'\{[^}]*=>[^}]*\}', content))
        if inline_funcs > 0 and not self._check_pattern(content, [r'useCallback\(']):
            opportunities.append({
                "type": "use_callback",
                "priority": "medium",
                "description": f"Found {inline_funcs} inline functions that could use useCallback",
                "reason": "Inline functions in JSX cause unnecessary re-renders"
            })
        
        # Check for large components that could be split
        lines = len(content.splitlines())
        if lines > 200:
            opportunities.append({
                "type": "component_splitting",
                "priority": "high",
                "description": f"Large component ({lines} lines) should be split",
                "reason": "Large components are harder to maintain and optimize"
            })
        
        # Check for lazy loading opportunity
        if lines > 150 and not self._check_pattern(content, [r'React\.lazy\(', r'\blazy\(']):
            opportunities.append({
                "type": "lazy_loading",
                "priority": "high",
                "description": "Component could benefit from lazy loading",
                "reason": "Large component without lazy loading affects bundle size"
            })
        
        return opportunities
    
    def _analyze_bundle_impact(self, content: str) -> Dict[str, Any]:
        """Analyze the component's impact on bundle size"""
        impact = {
            "import_statements": len(re.findall(r'^import\s+', content, re.MULTILINE)),
            "external_imports": self._count_external_imports(content),
            "large_dependencies": self._identify_large_imports(content),
            "dynamic_imports": len(re.findall(r'import\s*\(', content)),
            "estimated_size_category": self._estimate_size_category(content)
        }
        
        return impact
    
    def _analyze_accessibility(self, content: str) -> Dict[str, Any]:
        """Analyze accessibility patterns"""
        accessibility = {
            "has_aria_labels": len(re.findall(r'aria-label', content)),
            "has_alt_text": len(re.findall(r'\balt=', content)),
            "has_role_attributes": len(re.findall(r'\brole=', content)),
            "has_semantic_elements": len(re.findall(r'<(header|nav|main|section|article|aside|footer)', content)),
            "keyboard_navigation": len(re.findall(r'onKeyDown|onKeyPress|onKeyUp|tabIndex', content))
        }
        
        return accessibility
    
    def _check_best_practices(self, content: str) -> Dict[str, Any]:
        """Check for React best practices"""
        practices = {
            "uses_strict_mode": '<StrictMode>' in content,
            "has_error_boundary": 'ErrorBoundary' in content or 'componentDidCatch' in content,
            "proper_key_usage": len(re.findall(r'key=\{[^}]+\}', content)),
            "avoids_index_as_key": 'key={index}' not in content and 'key={i}' not in content,
            "uses_fragment": '<Fragment>' in content or '<>' in content,
            "consistent_naming": self._check_consistent_naming(content),
            "proper_hook_dependencies": self._check_hook_dependencies(content)
        }
        
        return practices
    
    def _calculate_scores(self, metrics: Dict[str, Any]) -> Dict[str, int]:
        """Calculate various quality scores (0-100)"""
        scores = {}
        
        # Performance Score
        perf_score = 100
        perf_patterns = metrics["performance_metrics"]["performance_anti_patterns"]
        
        perf_score -= min(perf_patterns["inline_objects"] * 5, 30)
        perf_score -= min(perf_patterns["inline_functions"] * 2, 20)
        perf_score -= min(perf_patterns["anonymous_functions_in_jsx"] * 3, 25)
        
        # Add points for optimizations
        opt_hooks = metrics["performance_metrics"]["optimization_hooks"]
        if opt_hooks["has_memo"]: perf_score += 10
        if opt_hooks["has_use_memo"]: perf_score += 10
        if opt_hooks["has_use_callback"]: perf_score += 5
        if opt_hooks["has_lazy"]: perf_score += 15
        
        scores["performance"] = max(0, min(100, perf_score))
        
        # Complexity Score
        complexity_score = 100
        complexity = metrics["complexity_metrics"]
        
        if complexity["cyclomatic_complexity"] > 15: complexity_score -= 20
        if complexity["nesting_depth"] > 5: complexity_score -= 15
        if complexity["jsx_nesting"] > 8: complexity_score -= 10
        
        scores["complexity"] = max(0, min(100, complexity_score))
        
        # Bundle Impact Score
        bundle_score = 100
        bundle = metrics["bundle_impact"]
        
        if bundle["external_imports"] > 10: bundle_score -= 20
        if len(bundle["large_dependencies"]) > 3: bundle_score -= 15
        if bundle["estimated_size_category"] == "large": bundle_score -= 25
        elif bundle["estimated_size_category"] == "medium": bundle_score -= 10
        
        scores["bundle_impact"] = max(0, min(100, bundle_score))
        
        # Overall Score (weighted average)
        scores["overall"] = int(
            scores["performance"] * 0.4 +
            scores["complexity"] * 0.3 +
            scores["bundle_impact"] * 0.3
        )
        
        return scores
    
    # Helper methods
    def _check_pattern(self, content: str, patterns: List[str]) -> bool:
        """Check if any of the given patterns exist in content"""
        return any(re.search(pattern, content) for pattern in patterns)
    
    def _count_expensive_operations_in_render(self, content: str) -> int:
        """Count expensive operations that appear to be in render"""
        # Simple heuristic: look for expensive operations not in useEffect/useMemo
        expensive_count = 0
        lines = content.splitlines()
        
        in_hook = False
        for line in lines:
            # Skip if we're inside a hook that handles side effects
            if re.search(r'useEffect\(|useMemo\(|useCallback\(', line):
                in_hook = True
                continue
            if in_hook and '}' in line:
                in_hook = False
                continue
            
            if not in_hook:
                for op in self.expensive_operations:
                    expensive_count += len(re.findall(op, line))
        
        return expensive_count
    
    def _should_use_memo(self, content: str) -> bool:
        """Determine if component should use React.memo"""
        # Check if component receives props
        has_props = bool(re.search(r'props\.|Props\}|props:', content))
        
        # Check if component has sufficient complexity
        lines = len(content.splitlines())
        has_complexity = lines > 30
        
        # Check if component does expensive work
        has_expensive_work = any(re.search(op, content) for op in self.expensive_operations)
        
        return has_props and (has_complexity or has_expensive_work)
    
    def _analyze_hook_usage(self, content: str) -> Dict[str, int]:
        """Analyze usage of React hooks"""
        hook_usage = {}
        
        for hook in self.react_hooks:
            count = len(re.findall(rf'{hook}\s*\(', content))
            if count > 0:
                hook_usage[hook] = count
        
        return hook_usage
    
    def _calculate_cyclomatic_complexity(self, content: str) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1  # Base complexity
        
        # Count decision points
        decision_points = [
            r'\bif\s*\(', r'\belse\s+if\s*\(', r'\belse\b',
            r'\bfor\s*\(', r'\bwhile\s*\(', r'\bdo\s+',
            r'\bswitch\s*\(', r'\bcase\s+', r'\bcatch\s*\(',
            r'\?\s*', r'&&', r'\|\|'
        ]
        
        for pattern in decision_points:
            complexity += len(re.findall(pattern, content))
        
        return complexity
    
    def _calculate_max_nesting_depth(self, content: str) -> int:
        """Calculate maximum nesting depth"""
        max_depth = 0
        current_depth = 0
        
        for char in content:
            if char == '{':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == '}':
                current_depth = max(0, current_depth - 1)
        
        return max_depth
    
    def _calculate_jsx_nesting_depth(self, content: str) -> int:
        """Calculate JSX nesting depth"""
        max_depth = 0
        current_depth = 0
        in_jsx = False
        
        i = 0
        while i < len(content):
            if content[i] == '<' and i + 1 < len(content) and content[i + 1].isalpha():
                in_jsx = True
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif content[i:i+2] == '</':
                if in_jsx and current_depth > 0:
                    current_depth -= 1
                if current_depth == 0:
                    in_jsx = False
            i += 1
        
        return max_depth
    
    def _analyze_function_lengths(self, content: str) -> Dict[str, Any]:
        """Analyze function lengths"""
        functions = re.findall(r'function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}', content, re.DOTALL)
        arrow_functions = re.findall(r'const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*\}', content, re.DOTALL)
        
        all_functions = functions + arrow_functions
        lengths = [len(func.splitlines()) for func in all_functions]
        
        return {
            "count": len(all_functions),
            "average_length": sum(lengths) / len(lengths) if lengths else 0,
            "max_length": max(lengths) if lengths else 0,
            "long_functions": len([l for l in lengths if l > 50])
        }
    
    def _analyze_parameter_counts(self, content: str) -> Dict[str, Any]:
        """Analyze function parameter counts"""
        function_params = re.findall(r'function\s+\w+\s*\(([^)]*)\)', content)
        arrow_params = re.findall(r'=\s*\(([^)]*)\)\s*=>', content)
        
        all_params = function_params + arrow_params
        param_counts = []
        
        for params in all_params:
            if params.strip():
                count = len([p.strip() for p in params.split(',') if p.strip()])
                param_counts.append(count)
            else:
                param_counts.append(0)
        
        return {
            "average": sum(param_counts) / len(param_counts) if param_counts else 0,
            "max": max(param_counts) if param_counts else 0,
            "high_param_functions": len([c for c in param_counts if c > 5])
        }
    
    def _calculate_cognitive_complexity(self, content: str) -> int:
        """Calculate cognitive complexity (simplified version)"""
        complexity = 0
        nesting_level = 0
        
        patterns = {
            'if': r'\bif\s*\(',
            'else': r'\belse\s+if\s*\(|\belse\b',
            'switch': r'\bswitch\s*\(',
            'for': r'\bfor\s*\(',
            'while': r'\bwhile\s*\(',
            'catch': r'\bcatch\s*\(',
            'ternary': r'\?\s*[^:]+:',
            'logical': r'&&|\|\|'
        }
        
        lines = content.splitlines()
        for line in lines:
            # Track nesting
            if '{' in line:
                nesting_level += 1
            if '}' in line:
                nesting_level = max(0, nesting_level - 1)
            
            # Count complexity patterns
            for pattern_name, pattern in patterns.items():
                matches = len(re.findall(pattern, line))
                complexity += matches * (nesting_level + 1)
        
        return complexity
    
    def _count_external_imports(self, content: str) -> int:
        """Count imports from external packages"""
        import_lines = re.findall(r'^import\s+.*from\s+[\'"]([^\'"]+)[\'"]', content, re.MULTILINE)
        external_count = 0
        
        for import_path in import_lines:
            if not import_path.startswith('.'):  # Not a relative import
                external_count += 1
        
        return external_count
    
    def _identify_large_imports(self, content: str) -> List[str]:
        """Identify potentially large dependencies"""
        large_deps = []
        import_lines = re.findall(r'^import\s+.*from\s+[\'"]([^\'"]+)[\'"]', content, re.MULTILINE)
        
        known_large = [
            'react', 'react-dom', 'lodash', 'moment', 'rxjs', 'three',
            'd3', 'chart.js', 'framer-motion', 'antd', 'material-ui',
            '@emotion', 'styled-components'
        ]
        
        for import_path in import_lines:
            for large_lib in known_large:
                if large_lib in import_path:
                    large_deps.append(import_path)
                    break
        
        return large_deps
    
    def _estimate_size_category(self, content: str) -> str:
        """Estimate the size category of the component"""
        lines = len(content.splitlines())
        imports = len(re.findall(r'^import\s+', content, re.MULTILINE))
        
        if lines > 300 or imports > 15:
            return "large"
        elif lines > 150 or imports > 8:
            return "medium"
        else:
            return "small"
    
    def _check_consistent_naming(self, content: str) -> bool:
        """Check for consistent naming conventions"""
        # Simple check: component names should be PascalCase
        component_names = re.findall(r'function\s+(\w+)|const\s+(\w+)\s*=', content)
        
        for name_match in component_names:
            name = name_match[0] or name_match[1]
            if name and name[0].isupper() and not name[0].isupper():
                return False
        
        return True
    
    def _check_hook_dependencies(self, content: str) -> bool:
        """Check if hooks have proper dependency arrays"""
        # Look for useEffect, useMemo, useCallback without dependencies
        hook_patterns = [
            r'useEffect\s*\([^,]+\)',  # useEffect without dependencies
            r'useMemo\s*\([^,]+\)',   # useMemo without dependencies
            r'useCallback\s*\([^,]+\)'  # useCallback without dependencies
        ]
        
        for pattern in hook_patterns:
            if re.search(pattern, content):
                return False  # Found hook without dependencies
        
        return True

class ServiceAnalyzer:
    """Analyzer for TypeScript/JavaScript service files"""
    
    def __init__(self):
        self.api_patterns = [
            r'fetch\s*\(', r'axios\.(get|post|put|delete|patch)',
            r'http\.(get|post|put|delete|patch)', r'request\s*\('
        ]
        
        self.performance_patterns = [
            r'cache', r'throttle', r'debounce', r'memoiz', 
            r'lazy', r'async', r'await'
        ]
    
    def analyze_service(self, content: str, file_path: Path) -> Dict[str, Any]:
        """Comprehensive analysis of a service file"""
        
        metrics = {
            "file_info": {
                "path": str(file_path),
                "size_bytes": len(content),
                "lines": len(content.splitlines()),
                "is_typescript": file_path.suffix == '.ts'
            },
            "api_metrics": self._analyze_api_usage(content),
            "performance_metrics": self._analyze_service_performance(content),
            "error_handling": self._analyze_error_handling(content),
            "async_patterns": self._analyze_async_patterns(content),
            "optimization_opportunities": self._identify_service_optimizations(content),
            "maintainability": self._analyze_maintainability(content)
        }
        
        # Calculate scores
        metrics["scores"] = self._calculate_service_scores(metrics)
        
        return metrics
    
    def _analyze_api_usage(self, content: str) -> Dict[str, Any]:
        """Analyze API usage patterns"""
        api_usage = {
            "total_calls": 0,
            "by_method": {},
            "has_retry_logic": 'retry' in content.lower(),
            "has_timeout": 'timeout' in content.lower(),
            "has_error_handling": 'catch' in content or '.catch(' in content,
            "uses_interceptors": 'interceptor' in content.lower()
        }
        
        for pattern in self.api_patterns:
            matches = re.findall(pattern, content)
            api_usage["total_calls"] += len(matches)
        
        # Analyze HTTP methods
        methods = ['get', 'post', 'put', 'delete', 'patch']
        for method in methods:
            count = len(re.findall(rf'\.{method}\s*\(', content, re.IGNORECASE))
            if count > 0:
                api_usage["by_method"][method] = count
        
        return api_usage
    
    def _analyze_service_performance(self, content: str) -> Dict[str, Any]:
        """Analyze performance patterns in service"""
        performance = {
            "has_caching": any(re.search(pattern, content, re.IGNORECASE) 
                              for pattern in [r'cache', r'memoiz']),
            "has_throttling": 'throttle' in content.lower(),
            "has_debouncing": 'debounce' in content.lower(),
            "async_operations": len(re.findall(r'async\s+', content)),
            "await_usage": len(re.findall(r'await\s+', content)),
            "promise_usage": len(re.findall(r'\.then\s*\(|\.catch\s*\(|new Promise', content)),
            "synchronous_operations": self._count_sync_operations(content)
        }
        
        return performance
    
    def _analyze_error_handling(self, content: str) -> Dict[str, Any]:
        """Analyze error handling patterns"""
        error_handling = {
            "try_catch_blocks": len(re.findall(r'try\s*\{', content)),
            "catch_blocks": len(re.findall(r'catch\s*\([^)]*\)', content)),
            "finally_blocks": len(re.findall(r'finally\s*\{', content)),
            "promise_catches": len(re.findall(r'\.catch\s*\(', content)),
            "error_throwing": len(re.findall(r'throw\s+', content)),
            "custom_errors": len(re.findall(r'new\s+\w*Error\s*\(', content))
        }
        
        error_handling["error_coverage"] = self._calculate_error_coverage(content)
        
        return error_handling
    
    def _analyze_async_patterns(self, content: str) -> Dict[str, Any]:
        """Analyze async/await and Promise patterns"""
        async_patterns = {
            "async_functions": len(re.findall(r'async\s+function|async\s+\(', content)),
            "await_calls": len(re.findall(r'await\s+', content)),
            "promise_chains": len(re.findall(r'\.then\s*\([^)]*\)\.then', content)),
            "promise_all": len(re.findall(r'Promise\.all\s*\(', content)),
            "promise_race": len(re.findall(r'Promise\.race\s*\(', content)),
            "concurrent_operations": len(re.findall(r'Promise\.all\s*\(', content))
        }
        
        # Analyze potential issues
        async_patterns["issues"] = {
            "missing_await": self._check_missing_await(content),
            "async_without_await": self._check_async_without_await(content),
            "blocking_operations": self._check_blocking_operations(content)
        }
        
        return async_patterns
    
    def _identify_service_optimizations(self, content: str) -> List[Dict[str, Any]]:
        """Identify optimization opportunities in service"""
        opportunities = []
        
        # Check for caching opportunities
        api_calls = sum(len(re.findall(pattern, content)) for pattern in self.api_patterns)
        if api_calls > 0 and not any(re.search(pattern, content, re.IGNORECASE) 
                                    for pattern in [r'cache', r'memoiz']):
            opportunities.append({
                "type": "add_caching",
                "priority": "high",
                "description": f"Found {api_calls} API calls without caching",
                "reason": "Caching can significantly improve performance"
            })
        
        # Check for missing error handling
        try_catch_ratio = len(re.findall(r'try\s*\{', content)) / max(api_calls, 1)
        if try_catch_ratio < 0.5:
            opportunities.append({
                "type": "improve_error_handling",
                "priority": "high",
                "description": "Insufficient error handling for API calls",
                "reason": "Better error handling improves reliability"
            })
        
        # Check for synchronous operations that could be async
        sync_ops = self._count_sync_operations(content)
        if sync_ops > 3:
            opportunities.append({
                "type": "async_optimization",
                "priority": "medium",
                "description": f"Found {sync_ops} synchronous operations",
                "reason": "Converting to async can improve performance"
            })
        
        # Check for throttling opportunities
        event_handlers = len(re.findall(r'addEventListener|onChange|onInput', content))
        if event_handlers > 0 and 'throttle' not in content.lower() and 'debounce' not in content.lower():
            opportunities.append({
                "type": "add_throttling",
                "priority": "medium",
                "description": f"Found {event_handlers} event handlers without throttling",
                "reason": "Throttling prevents excessive API calls"
            })
        
        return opportunities
    
    def _analyze_maintainability(self, content: str) -> Dict[str, Any]:
        """Analyze code maintainability metrics"""
        maintainability = {
            "function_count": len(re.findall(r'function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(', content)),
            "average_function_length": self._calculate_avg_function_length(content),
            "max_function_length": self._calculate_max_function_length(content),
            "duplicate_code": self._check_duplicate_patterns(content),
            "magic_numbers": len(re.findall(r'\b\d{2,}\b', content)),
            "todo_comments": len(re.findall(r'//\s*TODO|//\s*FIXME', content, re.IGNORECASE))
        }
        
        return maintainability
    
    # Helper methods for ServiceAnalyzer
    def _count_sync_operations(self, content: str) -> int:
        """Count potentially blocking synchronous operations"""
        sync_patterns = [
            r'JSON\.parse\s*\(', r'JSON\.stringify\s*\(',
            r'localStorage\.getItem', r'sessionStorage\.getItem',
            r'document\.getElementById', r'document\.querySelector',
            r'window\.alert', r'window\.confirm'
        ]
        
        return sum(len(re.findall(pattern, content)) for pattern in sync_patterns)
    
    def _calculate_error_coverage(self, content: str) -> float:
        """Calculate what percentage of operations have error handling"""
        risky_operations = sum(len(re.findall(pattern, content)) for pattern in self.api_patterns)
        error_handlers = len(re.findall(r'try\s*\{|\.catch\s*\(', content))
        
        if risky_operations == 0:
            return 1.0
        
        return min(1.0, error_handlers / risky_operations)
    
    def _check_missing_await(self, content: str) -> int:
        """Check for promises that might be missing await"""
        # This is a heuristic - look for function calls that return promises without await
        promise_calls = re.findall(r'(\w+\s*\([^)]*\))\s*(?!\.then|\.catch)', content)
        missing_await = 0
        
        for call in promise_calls:
            # Check if this looks like an async call without await
            if any(keyword in call.lower() for keyword in ['fetch', 'request', 'get', 'post']):
                if f'await {call}' not in content:
                    missing_await += 1
        
        return missing_await
    
    def _check_async_without_await(self, content: str) -> int:
        """Check for async functions that don't use await"""
        async_functions = re.findall(r'async\s+function[^{]*\{([^}]*)\}', content, re.DOTALL)
        async_arrows = re.findall(r'async\s*\([^)]*\)\s*=>\s*\{([^}]*)\}', content, re.DOTALL)
        
        count = 0
        for func_body in async_functions + async_arrows:
            if 'await' not in func_body:
                count += 1
        
        return count
    
    def _check_blocking_operations(self, content: str) -> int:
        """Check for potentially blocking operations"""
        blocking_patterns = [
            r'while\s*\(.*\)\s*\{[^}]*\}',  # While loops
            r'for\s*\([^)]*\)\s*\{[^}]*\}',  # For loops without async operations
            r'JSON\.parse\s*\([^)]*\)',      # JSON parsing (can be slow for large data)
            r'\.sort\s*\([^)]*\)'            # Array sorting (can be expensive)
        ]
        
        return sum(len(re.findall(pattern, content)) for pattern in blocking_patterns)
    
    def _calculate_avg_function_length(self, content: str) -> float:
        """Calculate average function length"""
        functions = re.findall(r'function[^{]*\{([^}]*)\}', content, re.DOTALL)
        arrow_functions = re.findall(r'=>\s*\{([^}]*)\}', content, re.DOTALL)
        
        all_functions = functions + arrow_functions
        if not all_functions:
            return 0
        
        lengths = [len(func.splitlines()) for func in all_functions]
        return sum(lengths) / len(lengths)
    
    def _calculate_max_function_length(self, content: str) -> int:
        """Calculate maximum function length"""
        functions = re.findall(r'function[^{]*\{([^}]*)\}', content, re.DOTALL)
        arrow_functions = re.findall(r'=>\s*\{([^}]*)\}', content, re.DOTALL)
        
        all_functions = functions + arrow_functions
        if not all_functions:
            return 0
        
        lengths = [len(func.splitlines()) for func in all_functions]
        return max(lengths)
    
    def _check_duplicate_patterns(self, content: str) -> int:
        """Check for duplicate code patterns (simplified)"""
        lines = content.splitlines()
        line_counts = {}
        duplicates = 0
        
        for line in lines:
            stripped = line.strip()
            if len(stripped) > 20:  # Only check substantial lines
                line_counts[stripped] = line_counts.get(stripped, 0) + 1
        
        for count in line_counts.values():
            if count > 1:
                duplicates += count - 1
        
        return duplicates
    
    def _calculate_service_scores(self, metrics: Dict[str, Any]) -> Dict[str, int]:
        """Calculate quality scores for service"""
        scores = {}
        
        # Performance Score
        perf_score = 100
        perf_metrics = metrics["performance_metrics"]
        
        if perf_metrics["has_caching"]: perf_score += 15
        if perf_metrics["has_throttling"]: perf_score += 10
        if perf_metrics["has_debouncing"]: perf_score += 5
        
        # Penalize excessive synchronous operations
        sync_ops = perf_metrics["synchronous_operations"]
        perf_score -= min(sync_ops * 5, 30)
        
        scores["performance"] = max(0, min(100, perf_score))
        
        # Reliability Score
        reliability_score = 100
        error_metrics = metrics["error_handling"]
        
        error_coverage = error_metrics["error_coverage"]
        reliability_score = int(reliability_score * error_coverage)
        
        if error_metrics["try_catch_blocks"] > 0: reliability_score += 10
        if error_metrics["custom_errors"] > 0: reliability_score += 5
        
        scores["reliability"] = max(0, min(100, reliability_score))
        
        # Maintainability Score
        maint_score = 100
        maint_metrics = metrics["maintainability"]
        
        if maint_metrics["average_function_length"] > 50: maint_score -= 20
        if maint_metrics["max_function_length"] > 100: maint_score -= 15
        maint_score -= min(maint_metrics["magic_numbers"] * 2, 20)
        maint_score -= min(maint_metrics["duplicate_code"] * 3, 25)
        
        scores["maintainability"] = max(0, min(100, maint_score))
        
        # Overall Score
        scores["overall"] = int(
            scores["performance"] * 0.35 +
            scores["reliability"] * 0.35 +
            scores["maintainability"] * 0.3
        )
        
        return scores

# Performance measurement utilities
class PerformanceMeasurement:
    """Utilities for measuring and comparing performance"""
    
    @staticmethod
    async def measure_bundle_size(project_path: Path) -> Dict[str, Any]:
        """Measure bundle size using build analysis"""
        try:
            # Run build with analysis
            result = await asyncio.create_subprocess_exec(
                'npm', 'run', 'build:analyze',
                cwd=project_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "output": stdout.decode(),
                    "analysis_available": True
                }
            else:
                # Try regular build
                build_result = await asyncio.create_subprocess_exec(
                    'npm', 'run', 'build',
                    cwd=project_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                build_stdout, build_stderr = await build_result.communicate()
                
                return {
                    "success": build_result.returncode == 0,
                    "output": build_stdout.decode(),
                    "error": build_stderr.decode() if build_result.returncode != 0 else None,
                    "analysis_available": False
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis_available": False
            }
    
    @staticmethod
    def calculate_performance_delta(before: Dict[str, Any], after: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate performance improvements between before and after metrics"""
        delta = {
            "components_improved": 0,
            "components_degraded": 0,
            "services_improved": 0,
            "services_degraded": 0,
            "overall_improvement": 0,
            "details": []
        }
        
        # Compare component scores
        before_components = before.get("components", {})
        after_components = after.get("components", {})
        
        for file_path in before_components:
            if file_path in after_components:
                before_score = before_components[file_path].get("scores", {}).get("overall", 0)
                after_score = after_components[file_path].get("scores", {}).get("overall", 0)
                
                improvement = after_score - before_score
                
                if improvement > 0:
                    delta["components_improved"] += 1
                    delta["details"].append({
                        "file": file_path,
                        "type": "component",
                        "improvement": improvement,
                        "before_score": before_score,
                        "after_score": after_score
                    })
                elif improvement < 0:
                    delta["components_degraded"] += 1
        
        # Compare service scores
        before_services = before.get("services", {})
        after_services = after.get("services", {})
        
        for file_path in before_services:
            if file_path in after_services:
                before_score = before_services[file_path].get("scores", {}).get("overall", 0)
                after_score = after_services[file_path].get("scores", {}).get("overall", 0)
                
                improvement = after_score - before_score
                
                if improvement > 0:
                    delta["services_improved"] += 1
                    delta["details"].append({
                        "file": file_path,
                        "type": "service",
                        "improvement": improvement,
                        "before_score": before_score,
                        "after_score": after_score
                    })
                elif improvement < 0:
                    delta["services_degraded"] += 1
        
        # Calculate overall improvement
        total_files = len(delta["details"])
        if total_files > 0:
            total_improvement = sum(detail["improvement"] for detail in delta["details"])
            delta["overall_improvement"] = total_improvement / total_files
        
        return delta