#!/usr/bin/env python3
"""
PR Generation with Impact Analysis for AMP Refactoring Specialist

This module creates PR-ready commits with detailed explanations of optimization changes,
performance impact analysis, and comprehensive before/after comparisons.
"""

import json
import logging
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import hashlib
import re

logger = logging.getLogger(__name__)

@dataclass
class CommitInfo:
    """Information about a commit for PR generation"""
    commit_hash: Optional[str]
    files_modified: List[str]
    optimizations_applied: List[Dict[str, Any]]
    performance_improvements: Dict[str, Any]
    before_metrics: Dict[str, Any]
    after_metrics: Dict[str, Any]
    commit_message: str
    commit_body: str
    timestamp: str

@dataclass
class PRInfo:
    """Information for creating a pull request"""
    title: str
    description: str
    branch_name: str
    base_branch: str
    commits: List[CommitInfo]
    total_files_changed: int
    performance_summary: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    test_plan: List[str]
    review_checklist: List[str]

class PerformanceImpactAnalyzer:
    """Analyzes performance impact of refactoring changes"""
    
    def __init__(self):
        self.impact_calculators = {
            "react_memo": self._analyze_memo_impact,
            "use_memo": self._analyze_use_memo_impact,
            "use_callback": self._analyze_use_callback_impact,
            "lazy_loading": self._analyze_lazy_loading_impact,
            "service_caching": self._analyze_caching_impact,
            "async_optimization": self._analyze_async_impact,
            "error_handling": self._analyze_error_handling_impact,
            "throttling": self._analyze_throttling_impact,
            "bundle_optimization": self._analyze_bundle_impact
        }
    
    def analyze_optimization_impact(self, optimization_type: str, 
                                  before_code: str, after_code: str,
                                  file_context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the performance impact of a specific optimization"""
        
        if optimization_type in self.impact_calculators:
            return self.impact_calculators[optimization_type](before_code, after_code, file_context)
        
        return self._default_impact_analysis(before_code, after_code, file_context)
    
    def _analyze_memo_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze React.memo impact"""
        
        # Count props usage to estimate re-render frequency
        props_usage = before.count('props.') + before.count('{...props}')
        component_complexity = len(before.splitlines())
        
        # Estimate impact based on complexity and props usage
        if props_usage > 5 and component_complexity > 50:
            estimated_reduction = "40-70%"
            impact_level = "High"
        elif props_usage > 2 or component_complexity > 30:
            estimated_reduction = "20-40%"
            impact_level = "Medium"
        else:
            estimated_reduction = "10-20%"
            impact_level = "Low"
        
        return {
            "type": "render_performance",
            "estimated_reduction": estimated_reduction,
            "impact_level": impact_level,
            "metrics": {
                "props_usage_count": props_usage,
                "component_complexity": component_complexity,
                "estimated_render_savings_per_update": f"{min(props_usage * 2, 20)}ms"
            },
            "benefits": [
                "Prevents unnecessary re-renders when props haven't changed",
                "Reduces CPU usage during parent component updates",
                "Improves overall application responsiveness"
            ],
            "considerations": [
                "Only beneficial if component receives the same props frequently",
                "Adds slight overhead for props comparison",
                "Most effective with pure functional components"
            ]
        }
    
    def _analyze_use_memo_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze useMemo impact"""
        
        # Count expensive operations
        expensive_ops = sum([
            before.count('.filter('),
            before.count('.map('),
            before.count('.reduce('),
            before.count('.sort('),
            before.count('JSON.parse'),
            before.count('JSON.stringify')
        ])
        
        # Estimate data processing complexity
        array_operations = before.count('[') + before.count('Array(')
        
        if expensive_ops >= 3 or array_operations > 5:
            estimated_improvement = "50-80%"
            impact_level = "Very High"
        elif expensive_ops >= 2:
            estimated_improvement = "30-50%"
            impact_level = "High"
        else:
            estimated_improvement = "15-30%"
            impact_level = "Medium"
        
        return {
            "type": "computation_performance",
            "estimated_improvement": estimated_improvement,
            "impact_level": impact_level,
            "metrics": {
                "expensive_operations_count": expensive_ops,
                "array_operations_count": array_operations,
                "estimated_computation_savings": f"{expensive_ops * 10}ms per render"
            },
            "benefits": [
                "Caches expensive calculations between re-renders",
                "Reduces CPU usage for complex data transformations",
                "Prevents redundant calculations when dependencies unchanged"
            ],
            "considerations": [
                "Most effective with computationally expensive operations",
                "Dependency array must be correctly specified",
                "Memory overhead for cached values"
            ]
        }
    
    def _analyze_use_callback_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze useCallback impact"""
        
        # Count function definitions and JSX event handlers
        inline_functions = before.count('=>') + before.count('function(')
        jsx_handlers = len(re.findall(r'on\w+\s*=\s*\{', before))
        
        estimated_reduction = "10-30%"
        impact_level = "Medium" if jsx_handlers > 3 else "Low"
        
        return {
            "type": "callback_performance",
            "estimated_reduction": estimated_reduction,
            "impact_level": impact_level,
            "metrics": {
                "inline_functions_count": inline_functions,
                "jsx_handlers_count": jsx_handlers,
                "estimated_rerender_prevention": f"{jsx_handlers * 2} child components per update"
            },
            "benefits": [
                "Prevents child component re-renders caused by function recreation",
                "Reduces memory allocation for callback functions",
                "Improves React DevTools performance profiling"
            ],
            "considerations": [
                "Only beneficial when callbacks are passed to optimized child components",
                "Dependency array must include all referenced variables",
                "Slight overhead for function comparison"
            ]
        }
    
    def _analyze_lazy_loading_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze lazy loading impact"""
        
        component_size = len(before.splitlines())
        import_count = len(re.findall(r'^import\s+', before, re.MULTILINE))
        
        # Estimate bundle size reduction
        if component_size > 200:
            bundle_reduction = "25-40%"
            impact_level = "Very High"
        elif component_size > 100:
            bundle_reduction = "15-25%"
            impact_level = "High"
        else:
            bundle_reduction = "5-15%"
            impact_level = "Medium"
        
        return {
            "type": "bundle_performance",
            "estimated_improvement": bundle_reduction,
            "impact_level": impact_level,
            "metrics": {
                "component_size_lines": component_size,
                "import_count": import_count,
                "estimated_chunk_size_kb": component_size * 0.1,  # Rough estimate
                "estimated_load_time_improvement": f"{max(component_size // 50, 1)}ms"
            },
            "benefits": [
                "Reduces initial bundle size",
                "Improves first-page load time",
                "Enables better caching strategies",
                "Reduces memory usage for unused components"
            ],
            "considerations": [
                "Requires Suspense wrapper for loading states",
                "May cause layout shift during lazy loading",
                "Network request delay for component loading"
            ]
        }
    
    def _analyze_caching_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze service caching impact"""
        
        api_calls = sum([
            before.count('fetch('),
            before.count('axios.'),
            before.count('http.')
        ])
        
        if api_calls >= 3:
            improvement = "60-90%"
            impact_level = "Very High"
        elif api_calls >= 2:
            improvement = "40-60%"
            impact_level = "High"
        else:
            improvement = "20-40%"
            impact_level = "Medium"
        
        return {
            "type": "network_performance",
            "estimated_improvement": improvement,
            "impact_level": impact_level,
            "metrics": {
                "api_calls_count": api_calls,
                "estimated_request_savings": f"{api_calls * 200}ms per cached response",
                "bandwidth_savings": f"{api_calls * 50}KB per cache hit"
            },
            "benefits": [
                "Reduces network requests for repeated data",
                "Improves perceived performance",
                "Reduces server load",
                "Better offline experience"
            ],
            "considerations": [
                "Cache invalidation strategy needed",
                "Memory usage for cached data",
                "Stale data risk if not properly managed"
            ]
        }
    
    def _analyze_async_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze async optimization impact"""
        
        sync_operations = sum([
            before.count('JSON.parse'),
            before.count('localStorage.getItem'),
            before.count('sessionStorage.getItem')
        ])
        
        sequential_awaits = len(re.findall(r'await\s+.*\n\s*await', before))
        
        if sequential_awaits > 2:
            improvement = "40-70%"
            impact_level = "High"
        elif sync_operations > 3:
            improvement = "20-40%"
            impact_level = "Medium"
        else:
            improvement = "10-20%"
            impact_level = "Low"
        
        return {
            "type": "async_performance",
            "estimated_improvement": improvement,
            "impact_level": impact_level,
            "metrics": {
                "sync_operations_count": sync_operations,
                "sequential_awaits_count": sequential_awaits,
                "estimated_time_savings": f"{sequential_awaits * 100}ms through parallelization"
            },
            "benefits": [
                "Non-blocking operations improve UI responsiveness",
                "Parallel execution reduces total wait time",
                "Better user experience during data loading"
            ],
            "considerations": [
                "Error handling complexity increases",
                "Race conditions possible with parallel operations",
                "Memory usage during concurrent operations"
            ]
        }
    
    def _analyze_error_handling_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze error handling impact"""
        
        risky_operations = sum([
            before.count('fetch('),
            before.count('JSON.parse'),
            before.count('localStorage.'),
            before.count('sessionStorage.')
        ])
        
        existing_error_handling = before.count('try') + before.count('.catch(')
        
        return {
            "type": "reliability_improvement",
            "estimated_improvement": "Reliability: +40-80%",
            "impact_level": "High",
            "metrics": {
                "risky_operations_count": risky_operations,
                "existing_error_handling": existing_error_handling,
                "error_coverage_improvement": f"{max(0, risky_operations - existing_error_handling)} operations"
            },
            "benefits": [
                "Prevents application crashes from unhandled errors",
                "Improves user experience with graceful error states",
                "Better debugging and error reporting",
                "Increased application stability"
            ],
            "considerations": [
                "Increased code complexity",
                "Need for user-friendly error messages",
                "Error reporting and logging strategy"
            ]
        }
    
    def _analyze_throttling_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze throttling/debouncing impact"""
        
        event_handlers = len(re.findall(r'on\w+\s*=', before))
        high_frequency_events = sum([
            before.count('onScroll'),
            before.count('onMouseMove'),
            before.count('onInput'),
            before.count('onChange')
        ])
        
        if high_frequency_events > 2:
            improvement = "50-80%"
            impact_level = "Very High"
        elif event_handlers > 5:
            improvement = "30-50%"
            impact_level = "High"
        else:
            improvement = "20-30%"
            impact_level = "Medium"
        
        return {
            "type": "event_performance",
            "estimated_improvement": improvement,
            "impact_level": impact_level,
            "metrics": {
                "event_handlers_count": event_handlers,
                "high_frequency_events": high_frequency_events,
                "estimated_event_reduction": f"{high_frequency_events * 80}% fewer executions"
            },
            "benefits": [
                "Reduces excessive function calls during rapid events",
                "Improves UI responsiveness during scrolling/typing",
                "Reduces CPU usage and battery drain",
                "Prevents API spam from rapid user input"
            ],
            "considerations": [
                "Slight delay in event processing",
                "Need to tune throttle/debounce timing",
                "May affect immediate UI feedback"
            ]
        }
    
    def _analyze_bundle_impact(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze bundle optimization impact"""
        
        import_statements = len(re.findall(r'^import\s+', before, re.MULTILINE))
        large_imports = sum([
            'lodash' in before,
            'moment' in before,
            'antd' in before,
            '*' in before  # Wildcard imports
        ])
        
        if large_imports > 2:
            reduction = "30-50%"
            impact_level = "Very High"
        elif import_statements > 10:
            reduction = "15-30%"
            impact_level = "High"
        else:
            reduction = "5-15%"
            impact_level = "Medium"
        
        return {
            "type": "bundle_optimization",
            "estimated_improvement": reduction,
            "impact_level": impact_level,
            "metrics": {
                "import_statements_count": import_statements,
                "large_imports_count": large_imports,
                "estimated_size_reduction_kb": large_imports * 100
            },
            "benefits": [
                "Smaller bundle size for faster downloads",
                "Improved initial page load time",
                "Better caching efficiency",
                "Reduced memory usage"
            ],
            "considerations": [
                "Tree shaking must be properly configured",
                "Some optimizations may require code changes",
                "Build process may need updates"
            ]
        }
    
    def _default_impact_analysis(self, before: str, after: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Default impact analysis for unknown optimization types"""
        
        lines_before = len(before.splitlines())
        lines_after = len(after.splitlines())
        lines_added = max(0, lines_after - lines_before)
        
        return {
            "type": "general_optimization",
            "estimated_improvement": "10-25%",
            "impact_level": "Medium",
            "metrics": {
                "lines_before": lines_before,
                "lines_after": lines_after,
                "lines_added": lines_added
            },
            "benefits": [
                "Code quality improvement",
                "Better maintainability",
                "Potential performance gains"
            ],
            "considerations": [
                "Impact may vary based on usage patterns",
                "Thorough testing recommended"
            ]
        }
    
    def calculate_cumulative_impact(self, impacts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate cumulative impact across multiple optimizations"""
        
        total_impacts = {}
        impact_levels = {"Low": 1, "Medium": 2, "High": 3, "Very High": 4}
        
        for impact in impacts:
            impact_type = impact["type"]
            if impact_type not in total_impacts:
                total_impacts[impact_type] = {
                    "count": 0,
                    "total_level": 0,
                    "benefits": set(),
                    "considerations": set()
                }
            
            total_impacts[impact_type]["count"] += 1
            total_impacts[impact_type]["total_level"] += impact_levels.get(impact["impact_level"], 2)
            total_impacts[impact_type]["benefits"].update(impact.get("benefits", []))
            total_impacts[impact_type]["considerations"].update(impact.get("considerations", []))
        
        # Calculate overall impact
        cumulative_impact = {
            "total_optimizations": len(impacts),
            "impact_breakdown": {},
            "overall_level": "Medium",
            "estimated_performance_gain": "20-40%",
            "key_benefits": [],
            "important_considerations": []
        }
        
        # Process each impact type
        for impact_type, data in total_impacts.items():
            avg_level = data["total_level"] / data["count"]
            level_name = {v: k for k, v in impact_levels.items()}[round(avg_level)]
            
            cumulative_impact["impact_breakdown"][impact_type] = {
                "optimization_count": data["count"],
                "average_impact_level": level_name,
                "benefits": list(data["benefits"])[:3],  # Top 3 benefits
                "considerations": list(data["considerations"])[:3]  # Top 3 considerations
            }
        
        # Determine overall impact level
        avg_overall_level = sum(data["total_level"] for data in total_impacts.values()) / len(total_impacts)
        cumulative_impact["overall_level"] = {v: k for k, v in impact_levels.items()}[round(avg_overall_level)]
        
        # Calculate estimated performance gain
        if cumulative_impact["overall_level"] == "Very High":
            cumulative_impact["estimated_performance_gain"] = "50-80%"
        elif cumulative_impact["overall_level"] == "High":
            cumulative_impact["estimated_performance_gain"] = "30-50%"
        elif cumulative_impact["overall_level"] == "Medium":
            cumulative_impact["estimated_performance_gain"] = "15-30%"
        else:
            cumulative_impact["estimated_performance_gain"] = "5-15%"
        
        # Collect top benefits and considerations
        all_benefits = set()
        all_considerations = set()
        for data in total_impacts.values():
            all_benefits.update(data["benefits"])
            all_considerations.update(data["considerations"])
        
        cumulative_impact["key_benefits"] = list(all_benefits)[:5]
        cumulative_impact["important_considerations"] = list(all_considerations)[:5]
        
        return cumulative_impact

class CommitMessageGenerator:
    """Generates detailed commit messages for optimizations"""
    
    def __init__(self):
        self.conventional_types = {
            "react_memo": "perf",
            "use_memo": "perf", 
            "use_callback": "perf",
            "lazy_loading": "perf",
            "service_caching": "perf",
            "async_optimization": "perf",
            "error_handling": "fix",
            "throttling": "perf",
            "bundle_optimization": "perf",
            "component_splitting": "refactor"
        }
    
    def generate_commit_message(self, optimizations: List[Dict[str, Any]], 
                              performance_impact: Dict[str, Any]) -> Tuple[str, str]:
        """Generate commit message and detailed body"""
        
        # Group optimizations by type
        opt_groups = {}
        for opt in optimizations:
            opt_type = opt["opportunity"]["type"]
            if opt_type not in opt_groups:
                opt_groups[opt_type] = []
            opt_groups[opt_type].append(opt)
        
        # Determine primary type for commit prefix
        primary_type = max(opt_groups.keys(), key=lambda k: len(opt_groups[k]))
        commit_type = self.conventional_types.get(primary_type, "refactor")
        
        # Generate title
        if len(opt_groups) == 1:
            opt_count = len(list(opt_groups.values())[0])
            title = f"{commit_type}: apply {primary_type} optimization to {opt_count} file{'s' if opt_count > 1 else ''}"
        else:
            total_count = sum(len(opts) for opts in opt_groups.values())
            title = f"{commit_type}: apply {len(opt_groups)} optimization types to {total_count} files"
        
        # Add performance impact to title if significant
        overall_impact = performance_impact.get("overall_level", "Medium")
        if overall_impact in ["High", "Very High"]:
            estimated_gain = performance_impact.get("estimated_performance_gain", "")
            if estimated_gain:
                title += f" ({estimated_gain} improvement)"
        
        # Generate detailed body
        body_parts = []
        
        # Add optimization summary
        body_parts.append("## Optimizations Applied\n")
        for opt_type, opts in opt_groups.items():
            body_parts.append(f"### {opt_type.replace('_', ' ').title()}")
            body_parts.append(f"- **Files modified**: {len(opts)}")
            
            # List file paths
            for opt in opts[:5]:  # Limit to 5 files per type
                file_path = opt["opportunity"]["file_path"]
                description = opt["opportunity"].get("description", "")
                body_parts.append(f"  - `{file_path}`: {description}")
            
            if len(opts) > 5:
                body_parts.append(f"  - ... and {len(opts) - 5} more files")
            
            body_parts.append("")
        
        # Add performance impact
        body_parts.append("## Performance Impact\n")
        body_parts.append(f"**Overall Impact Level**: {performance_impact.get('overall_level', 'Medium')}")
        body_parts.append(f"**Estimated Performance Gain**: {performance_impact.get('estimated_performance_gain', 'N/A')}")
        body_parts.append("")
        
        # Add impact breakdown
        impact_breakdown = performance_impact.get("impact_breakdown", {})
        if impact_breakdown:
            body_parts.append("### Impact Breakdown")
            for impact_type, details in impact_breakdown.items():
                body_parts.append(f"- **{impact_type.replace('_', ' ').title()}**: {details['optimization_count']} optimizations, {details['average_impact_level']} impact")
            body_parts.append("")
        
        # Add key benefits
        benefits = performance_impact.get("key_benefits", [])
        if benefits:
            body_parts.append("### Key Benefits")
            for benefit in benefits[:5]:
                body_parts.append(f"- {benefit}")
            body_parts.append("")
        
        # Add considerations
        considerations = performance_impact.get("important_considerations", [])
        if considerations:
            body_parts.append("### Important Considerations")
            for consideration in considerations[:5]:
                body_parts.append(f"- {consideration}")
            body_parts.append("")
        
        # Add testing notes
        body_parts.append("## Testing Notes")
        body_parts.append("- [ ] Verify no functional regressions")
        body_parts.append("- [ ] Check performance improvements in dev tools")
        body_parts.append("- [ ] Validate error handling improvements")
        body_parts.append("- [ ] Test bundle size reduction (if applicable)")
        body_parts.append("")
        
        # Add footer
        body_parts.append("🤖 Generated with AMP Refactoring Specialist")
        body_parts.append("")
        body_parts.append("Co-Authored-By: Claude <noreply@anthropic.com>")
        
        return title, '\n'.join(body_parts)

class PRDescriptionGenerator:
    """Generates comprehensive PR descriptions"""
    
    def generate_pr_description(self, commit_info: CommitInfo, 
                               cumulative_impact: Dict[str, Any],
                               risk_assessment: Dict[str, Any]) -> str:
        """Generate comprehensive PR description"""
        
        description_parts = []
        
        # Header
        description_parts.append("# AMP Refactoring Specialist - Automated Performance Optimizations")
        description_parts.append("")
        description_parts.append("This PR contains automated performance optimizations identified and applied by the AMP Refactoring Specialist.")
        description_parts.append("")
        
        # Summary
        description_parts.append("## Summary")
        description_parts.append(f"- **Total files modified**: {len(commit_info.files_modified)}")
        description_parts.append(f"- **Optimizations applied**: {len(commit_info.optimizations_applied)}")
        description_parts.append(f"- **Overall performance impact**: {cumulative_impact.get('overall_level', 'Medium')}")
        description_parts.append(f"- **Estimated performance gain**: {cumulative_impact.get('estimated_performance_gain', 'N/A')}")
        description_parts.append("")
        
        # Optimization breakdown
        description_parts.append("## Optimization Breakdown")
        description_parts.append("")
        
        opt_types = {}
        for opt in commit_info.optimizations_applied:
            opt_type = opt["opportunity"]["type"]
            if opt_type not in opt_types:
                opt_types[opt_type] = []
            opt_types[opt_type].append(opt)
        
        for opt_type, opts in opt_types.items():
            description_parts.append(f"### {opt_type.replace('_', ' ').title()}")
            description_parts.append(f"Applied to {len(opts)} files:")
            description_parts.append("")
            
            for opt in opts:
                file_path = opt["opportunity"]["file_path"]
                impact_level = opt.get("performance_impact", {}).get("impact_level", "Unknown")
                description_parts.append(f"- **`{file_path}`** - {impact_level} impact")
                
                # Add specific improvements
                changes = opt.get("changes_made", [])
                if changes:
                    for change in changes[:2]:  # Limit to 2 changes per file
                        description_parts.append(f"  - {change}")
            
            description_parts.append("")
        
        # Performance metrics comparison
        if commit_info.before_metrics and commit_info.after_metrics:
            description_parts.append("## Performance Metrics Comparison")
            description_parts.append("")
            description_parts.append("### Before Optimization")
            self._add_metrics_to_description(description_parts, commit_info.before_metrics)
            description_parts.append("")
            description_parts.append("### After Optimization")
            self._add_metrics_to_description(description_parts, commit_info.after_metrics)
            description_parts.append("")
        
        # Risk assessment
        description_parts.append("## Risk Assessment")
        description_parts.append("")
        risk_level = risk_assessment.get("overall_risk", "Medium")
        description_parts.append(f"**Overall Risk Level**: {risk_level}")
        description_parts.append("")
        
        # Risk factors
        risk_factors = risk_assessment.get("risk_factors", [])
        if risk_factors:
            description_parts.append("### Risk Factors")
            for factor in risk_factors:
                description_parts.append(f"- {factor}")
            description_parts.append("")
        
        # Mitigation strategies
        mitigations = risk_assessment.get("mitigation_strategies", [])
        if mitigations:
            description_parts.append("### Mitigation Strategies")
            for mitigation in mitigations:
                description_parts.append(f"- {mitigation}")
            description_parts.append("")
        
        # Test plan
        description_parts.append("## Test Plan")
        description_parts.append("")
        
        test_plan = [
            "### Automated Testing",
            "- [ ] All existing tests pass",
            "- [ ] No new ESLint warnings or errors",
            "- [ ] TypeScript compilation successful",
            "- [ ] Bundle size analysis completed",
            "",
            "### Performance Testing",
            "- [ ] React DevTools Profiler comparison",
            "- [ ] Lighthouse performance audit",
            "- [ ] Bundle analyzer comparison",
            "- [ ] Memory usage profiling",
            "",
            "### Functional Testing",
            "- [ ] Core user flows verified",
            "- [ ] Error handling tested",
            "- [ ] UI responsiveness validated",
            "- [ ] Cross-browser compatibility checked",
            "",
            "### Manual Testing Focus Areas"
        ]
        
        # Add specific test areas based on optimizations
        for opt_type in opt_types.keys():
            if opt_type == "react_memo":
                test_plan.append("- [ ] Component re-render behavior verified")
            elif opt_type == "use_memo":
                test_plan.append("- [ ] Expensive calculations performance tested")
            elif opt_type == "lazy_loading":
                test_plan.append("- [ ] Component loading states verified")
            elif opt_type == "service_caching":
                test_plan.append("- [ ] API caching behavior validated")
        
        description_parts.extend(test_plan)
        description_parts.append("")
        
        # Review checklist
        description_parts.append("## Review Checklist")
        description_parts.append("")
        description_parts.append("### Code Review")
        description_parts.append("- [ ] Optimization patterns are correctly applied")
        description_parts.append("- [ ] No unintended side effects introduced")
        description_parts.append("- [ ] Dependencies are properly specified (useMemo, useCallback)")
        description_parts.append("- [ ] Error handling is appropriate")
        description_parts.append("- [ ] Code readability maintained")
        description_parts.append("")
        description_parts.append("### Performance Review")
        description_parts.append("- [ ] Performance gains are measurable")
        description_parts.append("- [ ] No performance regressions introduced")
        description_parts.append("- [ ] Bundle size impact is acceptable")
        description_parts.append("- [ ] Memory usage is not negatively impacted")
        description_parts.append("")
        
        # Deployment considerations
        description_parts.append("## Deployment Considerations")
        description_parts.append("")
        description_parts.append("- **Risk Level**: " + risk_level)
        description_parts.append("- **Rollback Plan**: Standard deployment rollback procedures")
        description_parts.append("- **Monitoring**: Watch for performance metrics and error rates")
        description_parts.append("- **Feature Flags**: Consider using feature flags for gradual rollout")
        description_parts.append("")
        
        # Footer
        description_parts.append("---")
        description_parts.append("")
        description_parts.append("🤖 **Generated with [Claude Code](https://claude.ai/code)**")
        description_parts.append("")
        description_parts.append("*This PR was automatically generated by the AMP Refactoring Specialist. All optimizations have been analyzed for performance impact and risk assessment.*")
        
        return '\n'.join(description_parts)
    
    def _add_metrics_to_description(self, description_parts: List[str], metrics: Dict[str, Any]):
        """Add metrics information to PR description"""
        
        components = metrics.get("components", {})
        services = metrics.get("services", {})
        
        if components:
            avg_component_score = sum(
                comp.get("scores", {}).get("overall", 0) 
                for comp in components.values()
            ) / len(components)
            description_parts.append(f"- **Average Component Score**: {avg_component_score:.1f}/100")
        
        if services:
            avg_service_score = sum(
                svc.get("scores", {}).get("overall", 0) 
                for svc in services.values()
            ) / len(services)
            description_parts.append(f"- **Average Service Score**: {avg_service_score:.1f}/100")
        
        bundle_analysis = metrics.get("bundle_analysis", {})
        if bundle_analysis.get("build_success"):
            description_parts.append("- **Bundle Build**: Successful")

class RiskAssessment:
    """Assesses risks of applied optimizations"""
    
    def assess_optimization_risks(self, optimizations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess overall risk of the optimizations"""
        
        risk_factors = []
        mitigation_strategies = []
        risk_scores = []
        
        for opt in optimizations:
            opt_type = opt["opportunity"]["type"]
            risk_info = self._get_optimization_risk_info(opt_type, opt)
            
            risk_factors.extend(risk_info["risk_factors"])
            mitigation_strategies.extend(risk_info["mitigation_strategies"])
            risk_scores.append(risk_info["risk_score"])
        
        # Calculate overall risk
        if not risk_scores:
            overall_risk = "Low"
        else:
            avg_risk_score = sum(risk_scores) / len(risk_scores)
            if avg_risk_score >= 7:
                overall_risk = "High"
            elif avg_risk_score >= 5:
                overall_risk = "Medium"
            else:
                overall_risk = "Low"
        
        # Deduplicate and prioritize
        unique_risk_factors = list(dict.fromkeys(risk_factors))[:5]
        unique_mitigations = list(dict.fromkeys(mitigation_strategies))[:5]
        
        return {
            "overall_risk": overall_risk,
            "risk_score": sum(risk_scores) / len(risk_scores) if risk_scores else 0,
            "risk_factors": unique_risk_factors,
            "mitigation_strategies": unique_mitigations,
            "high_risk_optimizations": [
                opt for opt in optimizations 
                if self._get_optimization_risk_info(opt["opportunity"]["type"], opt)["risk_score"] >= 7
            ]
        }
    
    def _get_optimization_risk_info(self, opt_type: str, optimization: Dict[str, Any]) -> Dict[str, Any]:
        """Get risk information for a specific optimization type"""
        
        risk_profiles = {
            "react_memo": {
                "risk_score": 3,
                "risk_factors": ["Props comparison overhead", "May not provide benefits if props change frequently"],
                "mitigation_strategies": ["Profile component re-render frequency", "Consider shallow comparison for complex props"]
            },
            "use_memo": {
                "risk_score": 4,
                "risk_factors": ["Incorrect dependency array", "Memory overhead for cached values"],
                "mitigation_strategies": ["Carefully review dependency arrays", "Monitor memory usage", "Use React DevTools for verification"]
            },
            "use_callback": {
                "risk_score": 4,
                "risk_factors": ["Incorrect dependency array", "May not provide benefits without optimized child components"],
                "mitigation_strategies": ["Ensure child components are memoized", "Verify dependency arrays are complete"]
            },
            "lazy_loading": {
                "risk_score": 6,
                "risk_factors": ["Loading state handling required", "Potential layout shifts", "Network request delays"],
                "mitigation_strategies": ["Implement proper loading states", "Preload critical components", "Test loading behavior"]
            },
            "service_caching": {
                "risk_score": 7,
                "risk_factors": ["Stale data risks", "Memory leaks from cache", "Cache invalidation complexity"],
                "mitigation_strategies": ["Implement proper cache invalidation", "Monitor memory usage", "Add cache size limits"]
            },
            "async_optimization": {
                "risk_score": 5,
                "risk_factors": ["Race conditions", "Increased error handling complexity", "Debugging difficulty"],
                "mitigation_strategies": ["Thorough testing of async flows", "Implement proper error boundaries", "Add logging for async operations"]
            },
            "error_handling": {
                "risk_score": 2,
                "risk_factors": ["User experience changes", "Hidden errors if not logged properly"],
                "mitigation_strategies": ["Test error scenarios thoroughly", "Implement proper error logging", "Provide user-friendly error messages"]
            },
            "throttling": {
                "risk_score": 3,
                "risk_factors": ["Delayed user feedback", "Timing configuration issues"],
                "mitigation_strategies": ["Test different timing configurations", "Provide immediate visual feedback", "Document timing decisions"]
            },
            "bundle_optimization": {
                "risk_score": 4,
                "risk_factors": ["Build process changes", "Tree shaking issues", "Runtime errors from missing imports"],
                "mitigation_strategies": ["Thorough testing of build process", "Verify all imports work correctly", "Test production builds"]
            }
        }
        
        return risk_profiles.get(opt_type, {
            "risk_score": 3,
            "risk_factors": ["Unknown optimization type risks"],
            "mitigation_strategies": ["Thorough testing recommended"]
        })

class PRGenerator:
    """Main PR generation orchestrator"""
    
    def __init__(self, war_room_path: Path):
        self.war_room_path = war_room_path
        self.performance_analyzer = PerformanceImpactAnalyzer()
        self.commit_generator = CommitMessageGenerator()
        self.pr_generator = PRDescriptionGenerator()
        self.risk_assessor = RiskAssessment()
        
        logger.info("PR Generator initialized")
    
    async def create_pr_ready_commit(self, optimizations: List[Dict[str, Any]], 
                                   before_metrics: Dict[str, Any],
                                   after_metrics: Dict[str, Any]) -> CommitInfo:
        """Create PR-ready commit with all optimization information"""
        
        # Analyze performance impact for each optimization
        performance_impacts = []
        for opt in optimizations:
            if opt.get("success"):
                impact = self.performance_analyzer.analyze_optimization_impact(
                    opt["opportunity"]["type"],
                    opt.get("before_code", ""),
                    opt.get("after_code", ""),
                    {"file_path": opt["opportunity"]["file_path"]}
                )
                performance_impacts.append(impact)
        
        # Calculate cumulative impact
        cumulative_impact = self.performance_analyzer.calculate_cumulative_impact(performance_impacts)
        
        # Generate commit message
        commit_title, commit_body = self.commit_generator.generate_commit_message(
            optimizations, cumulative_impact
        )
        
        # Collect modified files
        files_modified = []
        for opt in optimizations:
            if opt.get("success"):
                file_path = opt["opportunity"]["file_path"]
                if file_path not in files_modified:
                    files_modified.append(file_path)
        
        # Create commit info
        commit_info = CommitInfo(
            commit_hash=None,  # Will be set after actual commit
            files_modified=files_modified,
            optimizations_applied=optimizations,
            performance_improvements=cumulative_impact,
            before_metrics=before_metrics,
            after_metrics=after_metrics,
            commit_message=commit_title,
            commit_body=commit_body,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        logger.info(f"Created PR-ready commit info for {len(files_modified)} files with {len(optimizations)} optimizations")
        
        return commit_info
    
    async def generate_pull_request_info(self, commit_info: CommitInfo, 
                                       branch_name: str = None,
                                       base_branch: str = "main") -> PRInfo:
        """Generate comprehensive PR information"""
        
        if not branch_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            branch_name = f"amp-optimizations-{timestamp}"
        
        # Assess risks
        risk_assessment = self.risk_assessor.assess_optimization_risks(commit_info.optimizations_applied)
        
        # Generate PR title
        opt_count = len(commit_info.optimizations_applied)
        files_count = len(commit_info.files_modified)
        impact_level = commit_info.performance_improvements.get("overall_level", "Medium")
        
        pr_title = f"perf: AMP optimizations - {opt_count} improvements across {files_count} files ({impact_level} impact)"
        
        # Generate PR description
        pr_description = self.pr_generator.generate_pr_description(
            commit_info, commit_info.performance_improvements, risk_assessment
        )
        
        # Generate test plan
        test_plan = self._generate_test_plan(commit_info.optimizations_applied)
        
        # Generate review checklist
        review_checklist = self._generate_review_checklist(commit_info.optimizations_applied, risk_assessment)
        
        pr_info = PRInfo(
            title=pr_title,
            description=pr_description,
            branch_name=branch_name,
            base_branch=base_branch,
            commits=[commit_info],
            total_files_changed=files_count,
            performance_summary=commit_info.performance_improvements,
            risk_assessment=risk_assessment,
            test_plan=test_plan,
            review_checklist=review_checklist
        )
        
        logger.info(f"Generated PR info: {pr_title}")
        
        return pr_info
    
    async def execute_git_commit(self, commit_info: CommitInfo) -> bool:
        """Execute the actual git commit"""
        try:
            # Stage modified files
            for file_path in commit_info.files_modified:
                result = await asyncio.create_subprocess_exec(
                    'git', 'add', file_path,
                    cwd=self.war_room_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await result.communicate()
                
                if result.returncode != 0:
                    logger.error(f"Failed to stage file {file_path}")
                    return False
            
            # Create commit with full message
            full_commit_message = f"{commit_info.commit_message}\n\n{commit_info.commit_body}"
            
            result = await asyncio.create_subprocess_exec(
                'git', 'commit', '-m', full_commit_message,
                cwd=self.war_room_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                # Get commit hash
                hash_result = await asyncio.create_subprocess_exec(
                    'git', 'rev-parse', 'HEAD',
                    cwd=self.war_room_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                hash_stdout, _ = await hash_result.communicate()
                if hash_result.returncode == 0:
                    commit_info.commit_hash = hash_stdout.decode().strip()
                
                logger.info(f"Successfully created commit {commit_info.commit_hash}")
                return True
            else:
                logger.error(f"Failed to create commit: {stderr.decode()}")
                return False
                
        except Exception as e:
            logger.error(f"Error executing git commit: {e}")
            return False
    
    def _generate_test_plan(self, optimizations: List[Dict[str, Any]]) -> List[str]:
        """Generate specific test plan based on optimizations"""
        test_plan = [
            "Run existing test suite",
            "Verify no functional regressions",
            "Check bundle size impact",
            "Validate performance improvements with React DevTools"
        ]
        
        # Add specific tests based on optimization types
        opt_types = set(opt["opportunity"]["type"] for opt in optimizations)
        
        if "react_memo" in opt_types:
            test_plan.append("Verify component memoization with React DevTools Profiler")
        if "use_memo" in opt_types:
            test_plan.append("Test expensive calculation performance improvements")
        if "lazy_loading" in opt_types:
            test_plan.append("Verify lazy loading behavior and loading states")
        if "service_caching" in opt_types:
            test_plan.append("Test API caching functionality and cache invalidation")
        if "error_handling" in opt_types:
            test_plan.append("Test error scenarios and error handling improvements")
        
        return test_plan
    
    def _generate_review_checklist(self, optimizations: List[Dict[str, Any]], 
                                 risk_assessment: Dict[str, Any]) -> List[str]:
        """Generate review checklist based on optimizations and risks"""
        checklist = [
            "All optimization patterns are correctly implemented",
            "No unintended side effects introduced",
            "Code readability is maintained",
            "Performance improvements are measurable"
        ]
        
        # Add risk-specific checks
        risk_factors = risk_assessment.get("risk_factors", [])
        for risk in risk_factors[:3]:  # Top 3 risks
            checklist.append(f"Verify mitigation for: {risk}")
        
        # Add optimization-specific checks
        opt_types = set(opt["opportunity"]["type"] for opt in optimizations)
        
        if "use_memo" in opt_types or "use_callback" in opt_types:
            checklist.append("Dependency arrays are correctly specified")
        if "service_caching" in opt_types:
            checklist.append("Cache invalidation strategy is appropriate")
        if "lazy_loading" in opt_types:
            checklist.append("Loading states are properly implemented")
        
        return checklist

# Export main classes for use
__all__ = [
    'PRGenerator',
    'PerformanceImpactAnalyzer', 
    'CommitMessageGenerator',
    'PRDescriptionGenerator',
    'RiskAssessment',
    'CommitInfo',
    'PRInfo'
]