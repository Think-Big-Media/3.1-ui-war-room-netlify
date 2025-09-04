#!/usr/bin/env python3
"""
Pattern Storage and Retrieval System for AMP Refactoring Specialist

This module handles storing successful refactoring patterns to Pieces with 'amp-optimizations' tag
and provides retrieval mechanisms for pattern-based refactoring suggestions.
"""

import json
import logging
import hashlib
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import subprocess
import tempfile
import os

logger = logging.getLogger(__name__)

@dataclass
class OptimizationPattern:
    """Represents a successful optimization pattern"""
    pattern_id: str
    pattern_type: str
    file_type: str
    language: str
    description: str
    before_code: str
    after_code: str
    performance_impact: Dict[str, Any]
    success_metrics: Dict[str, Any]
    tags: List[str]
    created_at: str
    file_context: str
    refactoring_rules: List[str]
    dependencies: List[str]
    warning_conditions: List[str]
    success_rate: float
    usage_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert pattern to dictionary for storage"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'OptimizationPattern':
        """Create pattern from dictionary"""
        return cls(**data)

@dataclass
class PatternMetrics:
    """Metrics for pattern usage and success"""
    total_applications: int
    successful_applications: int
    failed_applications: int
    average_performance_gain: float
    files_improved: List[str]
    common_failure_reasons: List[str]
    last_used: str

class PiecesIntegration:
    """Integration with Pieces for storing and retrieving patterns"""
    
    def __init__(self):
        self.pieces_cli_available = self._check_pieces_cli()
        self.pieces_desktop_available = self._check_pieces_desktop()
        
        if not (self.pieces_cli_available or self.pieces_desktop_available):
            logger.warning("Neither Pieces CLI nor Desktop detected. Using local storage fallback.")
    
    def _check_pieces_cli(self) -> bool:
        """Check if Pieces CLI is available"""
        try:
            result = subprocess.run(['pieces', '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=5)
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    def _check_pieces_desktop(self) -> bool:
        """Check if Pieces Desktop is available"""
        try:
            # Try to ping Pieces local API
            import urllib.request
            import urllib.error
            
            req = urllib.request.Request('http://localhost:1000/health')
            with urllib.request.urlopen(req, timeout=2) as response:
                return response.status == 200
        except (urllib.error.URLError, ConnectionError, TimeoutError):
            return False
    
    async def save_pattern_to_pieces(self, pattern: OptimizationPattern) -> bool:
        """Save a pattern to Pieces with proper tagging"""
        try:
            if self.pieces_cli_available:
                return await self._save_via_cli(pattern)
            elif self.pieces_desktop_available:
                return await self._save_via_api(pattern)
            else:
                logger.warning("Pieces not available, saving to local fallback")
                return await self._save_to_local_fallback(pattern)
        except Exception as e:
            logger.error(f"Failed to save pattern to Pieces: {e}")
            return False
    
    async def _save_via_cli(self, pattern: OptimizationPattern) -> bool:
        """Save pattern using Pieces CLI"""
        try:
            # Create a temporary file with the pattern
            pattern_content = self._format_pattern_for_pieces(pattern)
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tmp_file:
                tmp_file.write(pattern_content)
                tmp_file.flush()
                
                # Save to Pieces with tags
                tags_arg = ','.join(pattern.tags)
                cmd = [
                    'pieces', 'create',
                    '--file', tmp_file.name,
                    '--tags', tags_arg,
                    '--description', pattern.description
                ]
                
                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await result.communicate()
                
                # Clean up temporary file
                os.unlink(tmp_file.name)
                
                if result.returncode == 0:
                    logger.info(f"Successfully saved pattern {pattern.pattern_id} to Pieces via CLI")
                    return True
                else:
                    logger.error(f"Failed to save to Pieces CLI: {stderr.decode()}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error saving via Pieces CLI: {e}")
            return False
    
    async def _save_via_api(self, pattern: OptimizationPattern) -> bool:
        """Save pattern using Pieces Desktop API"""
        try:
            import urllib.request
            import urllib.parse
            
            # Format pattern for API
            pattern_data = {
                "name": f"AMP Optimization: {pattern.pattern_type}",
                "description": pattern.description,
                "code": pattern.after_code,
                "language": pattern.language,
                "tags": pattern.tags,
                "metadata": {
                    "pattern_type": pattern.pattern_type,
                    "performance_impact": pattern.performance_impact,
                    "before_code": pattern.before_code,
                    "refactoring_rules": pattern.refactoring_rules,
                    "created_at": pattern.created_at
                }
            }
            
            # Convert to JSON
            json_data = json.dumps(pattern_data).encode('utf-8')
            
            # Create request
            req = urllib.request.Request(
                'http://localhost:1000/assets',
                data=json_data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200 or response.status == 201:
                    logger.info(f"Successfully saved pattern {pattern.pattern_id} to Pieces via API")
                    return True
                else:
                    logger.error(f"Failed to save to Pieces API: HTTP {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error saving via Pieces API: {e}")
            return False
    
    async def _save_to_local_fallback(self, pattern: OptimizationPattern) -> bool:
        """Save pattern to local storage as fallback"""
        try:
            fallback_dir = Path.home() / '.amp_patterns'
            fallback_dir.mkdir(exist_ok=True)
            
            pattern_file = fallback_dir / f"{pattern.pattern_id}.json"
            
            with open(pattern_file, 'w') as f:
                json.dump(pattern.to_dict(), f, indent=2)
            
            logger.info(f"Saved pattern {pattern.pattern_id} to local fallback")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to local fallback: {e}")
            return False
    
    def _format_pattern_for_pieces(self, pattern: OptimizationPattern) -> str:
        """Format pattern content for Pieces storage"""
        content = f"""# AMP Optimization Pattern: {pattern.pattern_type}

## Description
{pattern.description}

## Performance Impact
{json.dumps(pattern.performance_impact, indent=2)}

## Before Code
```{pattern.language}
{pattern.before_code}
```

## After Code
```{pattern.language}
{pattern.after_code}
```

## Refactoring Rules
{chr(10).join(f"- {rule}" for rule in pattern.refactoring_rules)}

## Dependencies
{chr(10).join(f"- {dep}" for dep in pattern.dependencies)}

## Warning Conditions
{chr(10).join(f"- {warning}" for warning in pattern.warning_conditions)}

## Metrics
- Success Rate: {pattern.success_rate:.1%}
- Usage Count: {pattern.usage_count}
- File Type: {pattern.file_type}
- Language: {pattern.language}

## Tags
{', '.join(pattern.tags)}

## Created
{pattern.created_at}
"""
        return content
    
    async def retrieve_patterns_by_tag(self, tag: str) -> List[OptimizationPattern]:
        """Retrieve patterns from Pieces by tag"""
        try:
            if self.pieces_cli_available:
                return await self._retrieve_via_cli(tag)
            elif self.pieces_desktop_available:
                return await self._retrieve_via_api(tag)
            else:
                return await self._retrieve_from_local_fallback(tag)
        except Exception as e:
            logger.error(f"Failed to retrieve patterns from Pieces: {e}")
            return []
    
    async def _retrieve_via_cli(self, tag: str) -> List[OptimizationPattern]:
        """Retrieve patterns using Pieces CLI"""
        try:
            cmd = ['pieces', 'list', '--tags', tag, '--format', 'json']
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                data = json.loads(stdout.decode())
                patterns = []
                
                # Convert Pieces data to OptimizationPattern objects
                for item in data.get('assets', []):
                    pattern = self._convert_pieces_item_to_pattern(item)
                    if pattern:
                        patterns.append(pattern)
                
                logger.info(f"Retrieved {len(patterns)} patterns from Pieces CLI")
                return patterns
            else:
                logger.error(f"Failed to retrieve from Pieces CLI: {stderr.decode()}")
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving via Pieces CLI: {e}")
            return []
    
    async def _retrieve_via_api(self, tag: str) -> List[OptimizationPattern]:
        """Retrieve patterns using Pieces Desktop API"""
        try:
            import urllib.request
            import urllib.parse
            
            # Query API for assets with tag
            params = urllib.parse.urlencode({'tags': tag})
            req = urllib.request.Request(f'http://localhost:1000/assets?{params}')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    patterns = []
                    
                    for item in data.get('assets', []):
                        pattern = self._convert_pieces_item_to_pattern(item)
                        if pattern:
                            patterns.append(pattern)
                    
                    logger.info(f"Retrieved {len(patterns)} patterns from Pieces API")
                    return patterns
                else:
                    logger.error(f"Failed to retrieve from Pieces API: HTTP {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error retrieving via Pieces API: {e}")
            return []
    
    async def _retrieve_from_local_fallback(self, tag: str) -> List[OptimizationPattern]:
        """Retrieve patterns from local fallback storage"""
        try:
            fallback_dir = Path.home() / '.amp_patterns'
            if not fallback_dir.exists():
                return []
            
            patterns = []
            for pattern_file in fallback_dir.glob('*.json'):
                try:
                    with open(pattern_file, 'r') as f:
                        data = json.load(f)
                    
                    pattern = OptimizationPattern.from_dict(data)
                    if tag in pattern.tags:
                        patterns.append(pattern)
                        
                except Exception as e:
                    logger.warning(f"Error loading pattern file {pattern_file}: {e}")
                    continue
            
            logger.info(f"Retrieved {len(patterns)} patterns from local fallback")
            return patterns
            
        except Exception as e:
            logger.error(f"Error retrieving from local fallback: {e}")
            return []
    
    def _convert_pieces_item_to_pattern(self, item: Dict[str, Any]) -> Optional[OptimizationPattern]:
        """Convert Pieces item to OptimizationPattern"""
        try:
            # Extract metadata
            metadata = item.get('metadata', {})
            
            # Create pattern from Pieces data
            pattern = OptimizationPattern(
                pattern_id=item.get('id', hashlib.md5(str(item).encode()).hexdigest()[:8]),
                pattern_type=metadata.get('pattern_type', 'unknown'),
                file_type=metadata.get('file_type', 'unknown'),
                language=item.get('language', 'typescript'),
                description=item.get('description', ''),
                before_code=metadata.get('before_code', ''),
                after_code=item.get('code', ''),
                performance_impact=metadata.get('performance_impact', {}),
                success_metrics=metadata.get('success_metrics', {}),
                tags=item.get('tags', []),
                created_at=metadata.get('created_at', datetime.now(timezone.utc).isoformat()),
                file_context=metadata.get('file_context', ''),
                refactoring_rules=metadata.get('refactoring_rules', []),
                dependencies=metadata.get('dependencies', []),
                warning_conditions=metadata.get('warning_conditions', []),
                success_rate=metadata.get('success_rate', 1.0),
                usage_count=metadata.get('usage_count', 0)
            )
            
            return pattern
            
        except Exception as e:
            logger.warning(f"Error converting Pieces item to pattern: {e}")
            return None

class PatternStorage:
    """Main pattern storage and retrieval system"""
    
    def __init__(self, war_room_path: Path):
        self.war_room_path = war_room_path
        self.pieces_integration = PiecesIntegration()
        self.local_storage_path = war_room_path / "agents" / "data" / "amp_specialist" / "patterns"
        self.metrics_path = war_room_path / "agents" / "data" / "amp_specialist" / "metrics"
        
        # Ensure directories exist
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        self.metrics_path.mkdir(parents=True, exist_ok=True)
        
        # Pattern cache
        self.pattern_cache = {}
        self.metrics_cache = {}
        
        logger.info("Pattern storage system initialized")
    
    async def save_successful_pattern(self, 
                                    refactoring_result: Dict[str, Any], 
                                    opportunity: Dict[str, Any],
                                    performance_delta: Dict[str, Any]) -> str:
        """Save a successful refactoring pattern"""
        
        # Generate pattern ID
        pattern_id = self._generate_pattern_id(refactoring_result, opportunity)
        
        # Create optimization pattern
        pattern = OptimizationPattern(
            pattern_id=pattern_id,
            pattern_type=opportunity["type"],
            file_type=Path(opportunity["file_path"]).suffix,
            language=self._detect_language(opportunity["file_path"]),
            description=opportunity.get("description", f"Optimization pattern: {opportunity['type']}"),
            before_code=refactoring_result.get("before_code", ""),
            after_code=refactoring_result.get("after_code", ""),
            performance_impact=refactoring_result.get("performance_impact", {}),
            success_metrics=self._calculate_success_metrics(performance_delta),
            tags=self._generate_tags(opportunity, refactoring_result),
            created_at=datetime.now(timezone.utc).isoformat(),
            file_context=opportunity.get("file_path", ""),
            refactoring_rules=self._extract_refactoring_rules(refactoring_result),
            dependencies=self._extract_dependencies(refactoring_result.get("after_code", "")),
            warning_conditions=refactoring_result.get("warnings", []),
            success_rate=1.0,  # Initial success rate
            usage_count=1
        )
        
        # Save to Pieces
        pieces_success = await self.pieces_integration.save_pattern_to_pieces(pattern)
        
        # Save to local storage
        local_success = await self._save_to_local_storage(pattern)
        
        # Update pattern cache
        self.pattern_cache[pattern_id] = pattern
        
        # Update metrics
        await self._update_pattern_metrics(pattern_id, True)
        
        logger.info(f"Saved pattern {pattern_id} - Pieces: {pieces_success}, Local: {local_success}")
        
        return pattern_id
    
    async def find_similar_patterns(self, opportunity: Dict[str, Any]) -> List[OptimizationPattern]:
        """Find patterns similar to the given optimization opportunity"""
        
        # Search by pattern type first
        patterns = await self.retrieve_patterns_by_type(opportunity["type"])
        
        # Filter by file type
        file_type = Path(opportunity["file_path"]).suffix
        patterns = [p for p in patterns if p.file_type == file_type]
        
        # Score by similarity
        scored_patterns = []
        for pattern in patterns:
            similarity_score = self._calculate_similarity_score(opportunity, pattern)
            scored_patterns.append((similarity_score, pattern))
        
        # Sort by similarity and success rate
        scored_patterns.sort(key=lambda x: (x[0], x[1].success_rate), reverse=True)
        
        return [pattern for _, pattern in scored_patterns[:5]]  # Top 5
    
    async def retrieve_patterns_by_type(self, pattern_type: str) -> List[OptimizationPattern]:
        """Retrieve all patterns of a specific type"""
        
        # Check cache first
        if pattern_type in self.pattern_cache:
            return [p for p in self.pattern_cache.values() if p.pattern_type == pattern_type]
        
        # Retrieve from Pieces
        pieces_patterns = await self.pieces_integration.retrieve_patterns_by_tag(f"amp-{pattern_type}")
        
        # Retrieve from local storage
        local_patterns = await self._retrieve_from_local_storage(pattern_type)
        
        # Combine and deduplicate
        all_patterns = pieces_patterns + local_patterns
        unique_patterns = {p.pattern_id: p for p in all_patterns}.values()
        
        # Update cache
        for pattern in unique_patterns:
            self.pattern_cache[pattern.pattern_id] = pattern
        
        return list(unique_patterns)
    
    async def get_pattern_success_rate(self, pattern_id: str) -> float:
        """Get the success rate of a specific pattern"""
        metrics = await self._load_pattern_metrics(pattern_id)
        return metrics.successful_applications / max(metrics.total_applications, 1)
    
    async def update_pattern_usage(self, pattern_id: str, success: bool, performance_gain: float = 0.0):
        """Update pattern usage statistics"""
        await self._update_pattern_metrics(pattern_id, success, performance_gain)
    
    async def generate_pattern_report(self) -> Dict[str, Any]:
        """Generate a comprehensive report on stored patterns"""
        
        all_patterns = []
        for pattern_type in ["react_memo", "use_memo", "use_callback", "lazy_loading", 
                           "service_caching", "async_optimization", "error_handling"]:
            patterns = await self.retrieve_patterns_by_type(pattern_type)
            all_patterns.extend(patterns)
        
        report = {
            "total_patterns": len(all_patterns),
            "by_type": {},
            "by_file_type": {},
            "success_rates": {},
            "top_performing_patterns": [],
            "most_used_patterns": [],
            "recent_patterns": [],
            "recommendations": []
        }
        
        # Analyze by type
        for pattern in all_patterns:
            pattern_type = pattern.pattern_type
            if pattern_type not in report["by_type"]:
                report["by_type"][pattern_type] = 0
            report["by_type"][pattern_type] += 1
            
            # Analyze by file type
            if pattern.file_type not in report["by_file_type"]:
                report["by_file_type"][pattern.file_type] = 0
            report["by_file_type"][pattern.file_type] += 1
            
            # Success rates
            report["success_rates"][pattern.pattern_id] = pattern.success_rate
        
        # Top performing patterns
        sorted_by_success = sorted(all_patterns, key=lambda p: p.success_rate, reverse=True)
        report["top_performing_patterns"] = [
            {
                "pattern_id": p.pattern_id,
                "pattern_type": p.pattern_type,
                "success_rate": p.success_rate,
                "usage_count": p.usage_count
            }
            for p in sorted_by_success[:10]
        ]
        
        # Most used patterns
        sorted_by_usage = sorted(all_patterns, key=lambda p: p.usage_count, reverse=True)
        report["most_used_patterns"] = [
            {
                "pattern_id": p.pattern_id,
                "pattern_type": p.pattern_type,
                "usage_count": p.usage_count,
                "success_rate": p.success_rate
            }
            for p in sorted_by_usage[:10]
        ]
        
        # Recent patterns (last 30 days)
        recent_patterns = [p for p in all_patterns 
                         if self._is_recent_pattern(p.created_at, days=30)]
        report["recent_patterns"] = len(recent_patterns)
        
        # Generate recommendations
        report["recommendations"] = self._generate_pattern_recommendations(all_patterns)
        
        return report
    
    # Helper methods
    
    def _generate_pattern_id(self, refactoring_result: Dict[str, Any], opportunity: Dict[str, Any]) -> str:
        """Generate unique pattern ID"""
        content = f"{opportunity['type']}_{opportunity['file_path']}_{refactoring_result.get('timestamp', '')}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension"""
        ext = Path(file_path).suffix.lower()
        language_map = {
            '.tsx': 'typescript',
            '.ts': 'typescript', 
            '.jsx': 'javascript',
            '.js': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c'
        }
        return language_map.get(ext, 'unknown')
    
    def _generate_tags(self, opportunity: Dict[str, Any], refactoring_result: Dict[str, Any]) -> List[str]:
        """Generate tags for the pattern"""
        tags = [
            "amp-optimizations",
            f"amp-{opportunity['type']}",
            "war-room",
            "performance"
        ]
        
        # Add file type tag
        file_ext = Path(opportunity["file_path"]).suffix
        if file_ext:
            tags.append(f"filetype-{file_ext[1:]}")  # Remove the dot
        
        # Add language tag
        language = self._detect_language(opportunity["file_path"])
        tags.append(f"lang-{language}")
        
        # Add priority tag
        priority = opportunity.get("priority", "medium")
        tags.append(f"priority-{priority}")
        
        return tags
    
    def _extract_refactoring_rules(self, refactoring_result: Dict[str, Any]) -> List[str]:
        """Extract refactoring rules from the result"""
        rules = []
        
        # Extract from changes made
        changes = refactoring_result.get("changes_made", [])
        for change in changes:
            if "Added" in change:
                rules.append(f"Add: {change}")
            elif "Wrapped" in change:
                rules.append(f"Wrap: {change}")
            elif "Replaced" in change:
                rules.append(f"Replace: {change}")
        
        # Add general rules based on pattern type
        pattern_type = refactoring_result.get("refactoring_type", "")
        if pattern_type == "react_memo":
            rules.append("Wrap functional components with React.memo when props don't change frequently")
        elif pattern_type == "use_memo":
            rules.append("Use useMemo for expensive calculations that depend on specific values")
        elif pattern_type == "use_callback":
            rules.append("Use useCallback for functions passed as props to prevent unnecessary re-renders")
        
        return rules
    
    def _extract_dependencies(self, code: str) -> List[str]:
        """Extract dependencies from code"""
        dependencies = []
        
        # Look for React imports
        if 'import React' in code:
            dependencies.append('react')
        
        # Look for specific hooks
        hooks = ['useMemo', 'useCallback', 'useState', 'useEffect']
        for hook in hooks:
            if hook in code:
                dependencies.append(hook)
        
        return dependencies
    
    def _calculate_success_metrics(self, performance_delta: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate success metrics from performance delta"""
        return {
            "components_improved": performance_delta.get("components_improved", 0),
            "services_improved": performance_delta.get("services_improved", 0),
            "overall_improvement": performance_delta.get("overall_improvement", 0),
            "performance_gain": performance_delta.get("performance_gain", 0)
        }
    
    def _calculate_similarity_score(self, opportunity: Dict[str, Any], pattern: OptimizationPattern) -> float:
        """Calculate similarity score between opportunity and pattern"""
        score = 0.0
        
        # Type match (highest weight)
        if opportunity["type"] == pattern.pattern_type:
            score += 40
        
        # File type match
        if Path(opportunity["file_path"]).suffix == pattern.file_type:
            score += 20
        
        # Description similarity (simple keyword matching)
        opp_words = set(opportunity.get("description", "").lower().split())
        pattern_words = set(pattern.description.lower().split())
        common_words = opp_words.intersection(pattern_words)
        if opp_words:
            score += (len(common_words) / len(opp_words)) * 20
        
        # Priority match
        if opportunity.get("priority") and opportunity["priority"] in pattern.tags:
            score += 10
        
        # Success rate bonus
        score += pattern.success_rate * 10
        
        return min(score, 100)
    
    async def _save_to_local_storage(self, pattern: OptimizationPattern) -> bool:
        """Save pattern to local storage"""
        try:
            pattern_file = self.local_storage_path / f"{pattern.pattern_id}.json"
            with open(pattern_file, 'w') as f:
                json.dump(pattern.to_dict(), f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving pattern to local storage: {e}")
            return False
    
    async def _retrieve_from_local_storage(self, pattern_type: str) -> List[OptimizationPattern]:
        """Retrieve patterns from local storage"""
        patterns = []
        
        try:
            for pattern_file in self.local_storage_path.glob("*.json"):
                try:
                    with open(pattern_file, 'r') as f:
                        data = json.load(f)
                    
                    pattern = OptimizationPattern.from_dict(data)
                    if pattern.pattern_type == pattern_type:
                        patterns.append(pattern)
                        
                except Exception as e:
                    logger.warning(f"Error loading pattern file {pattern_file}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error retrieving from local storage: {e}")
        
        return patterns
    
    async def _update_pattern_metrics(self, pattern_id: str, success: bool, performance_gain: float = 0.0):
        """Update pattern usage metrics"""
        
        metrics = await self._load_pattern_metrics(pattern_id)
        
        metrics.total_applications += 1
        if success:
            metrics.successful_applications += 1
        else:
            metrics.failed_applications += 1
        
        # Update average performance gain
        current_total_gain = metrics.average_performance_gain * (metrics.total_applications - 1)
        metrics.average_performance_gain = (current_total_gain + performance_gain) / metrics.total_applications
        
        metrics.last_used = datetime.now(timezone.utc).isoformat()
        
        # Update pattern success rate
        if pattern_id in self.pattern_cache:
            self.pattern_cache[pattern_id].success_rate = (
                metrics.successful_applications / metrics.total_applications
            )
            self.pattern_cache[pattern_id].usage_count = metrics.total_applications
        
        # Save metrics
        await self._save_pattern_metrics(pattern_id, metrics)
    
    async def _load_pattern_metrics(self, pattern_id: str) -> PatternMetrics:
        """Load pattern metrics from storage"""
        
        if pattern_id in self.metrics_cache:
            return self.metrics_cache[pattern_id]
        
        metrics_file = self.metrics_path / f"{pattern_id}_metrics.json"
        
        if metrics_file.exists():
            try:
                with open(metrics_file, 'r') as f:
                    data = json.load(f)
                
                metrics = PatternMetrics(**data)
                self.metrics_cache[pattern_id] = metrics
                return metrics
                
            except Exception as e:
                logger.warning(f"Error loading metrics for {pattern_id}: {e}")
        
        # Return default metrics
        metrics = PatternMetrics(
            total_applications=0,
            successful_applications=0,
            failed_applications=0,
            average_performance_gain=0.0,
            files_improved=[],
            common_failure_reasons=[],
            last_used=datetime.now(timezone.utc).isoformat()
        )
        
        self.metrics_cache[pattern_id] = metrics
        return metrics
    
    async def _save_pattern_metrics(self, pattern_id: str, metrics: PatternMetrics):
        """Save pattern metrics to storage"""
        try:
            metrics_file = self.metrics_path / f"{pattern_id}_metrics.json"
            with open(metrics_file, 'w') as f:
                json.dump(asdict(metrics), f, indent=2)
            
            # Update cache
            self.metrics_cache[pattern_id] = metrics
            
        except Exception as e:
            logger.error(f"Error saving metrics for {pattern_id}: {e}")
    
    def _is_recent_pattern(self, created_at: str, days: int = 30) -> bool:
        """Check if pattern was created within the specified days"""
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            return (now - created_date).days <= days
        except Exception:
            return False
    
    def _generate_pattern_recommendations(self, patterns: List[OptimizationPattern]) -> List[str]:
        """Generate recommendations based on pattern analysis"""
        recommendations = []
        
        # Analyze success rates by type
        type_success = {}
        for pattern in patterns:
            if pattern.pattern_type not in type_success:
                type_success[pattern.pattern_type] = []
            type_success[pattern.pattern_type].append(pattern.success_rate)
        
        for pattern_type, success_rates in type_success.items():
            avg_success = sum(success_rates) / len(success_rates)
            if avg_success < 0.7:
                recommendations.append(f"Review {pattern_type} patterns - average success rate is {avg_success:.1%}")
            elif avg_success > 0.9:
                recommendations.append(f"{pattern_type} patterns are highly successful - consider prioritizing")
        
        # Check pattern distribution
        if len(type_success) < 5:
            recommendations.append("Consider expanding pattern coverage to more optimization types")
        
        # Usage recommendations
        total_usage = sum(p.usage_count for p in patterns)
        if total_usage > 0:
            underused_patterns = [p for p in patterns if p.usage_count < total_usage * 0.1]
            if underused_patterns:
                recommendations.append(f"{len(underused_patterns)} patterns are underused - consider reviewing their applicability")
        
        return recommendations

# Main pattern storage manager
class PatternStorageManager:
    """Main interface for pattern storage and retrieval operations"""
    
    def __init__(self, war_room_path: Path):
        self.pattern_storage = PatternStorage(war_room_path)
        logger.info("Pattern storage manager initialized")
    
    async def store_successful_optimization(self, 
                                          refactoring_result: Dict[str, Any],
                                          opportunity: Dict[str, Any],
                                          performance_delta: Dict[str, Any]) -> str:
        """Store a successful optimization pattern"""
        return await self.pattern_storage.save_successful_pattern(
            refactoring_result, opportunity, performance_delta
        )
    
    async def find_applicable_patterns(self, opportunity: Dict[str, Any]) -> List[OptimizationPattern]:
        """Find patterns that might be applicable to the given opportunity"""
        return await self.pattern_storage.find_similar_patterns(opportunity)
    
    async def get_pattern_recommendations(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        """Get pattern-based recommendations for a specific file"""
        recommendations = []
        
        # Analyze file to determine potential optimization types
        potential_optimizations = self._analyze_file_for_patterns(file_path, content)
        
        for opt_type in potential_optimizations:
            # Create a mock opportunity to find similar patterns
            mock_opportunity = {
                "type": opt_type,
                "file_path": file_path,
                "description": f"Potential {opt_type} optimization"
            }
            
            similar_patterns = await self.pattern_storage.find_similar_patterns(mock_opportunity)
            
            for pattern in similar_patterns[:3]:  # Top 3 patterns
                if pattern.success_rate >= 0.7:  # Only high-success patterns
                    recommendations.append({
                        "pattern_id": pattern.pattern_id,
                        "pattern_type": pattern.pattern_type,
                        "description": pattern.description,
                        "success_rate": pattern.success_rate,
                        "usage_count": pattern.usage_count,
                        "estimated_impact": pattern.performance_impact,
                        "refactoring_rules": pattern.refactoring_rules[:3],  # Top 3 rules
                        "warning_conditions": pattern.warning_conditions
                    })
        
        return recommendations
    
    async def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate comprehensive pattern usage report"""
        return await self.pattern_storage.generate_pattern_report()
    
    def _analyze_file_for_patterns(self, file_path: str, content: str) -> List[str]:
        """Analyze file content to determine potential optimization patterns"""
        patterns = []
        
        # Check for React component patterns
        if file_path.endswith(('.tsx', '.jsx')):
            if 'function' in content and content.count('props') > 0:
                if 'React.memo' not in content:
                    patterns.append('react_memo')
            
            if any(op in content for op in ['.filter(', '.map(', '.reduce(']):
                if 'useMemo' not in content:
                    patterns.append('use_memo')
            
            if '=>' in content and 'useCallback' not in content:
                patterns.append('use_callback')
            
            if len(content.splitlines()) > 150:
                patterns.append('lazy_loading')
        
        # Check for service patterns
        if file_path.endswith(('.ts', '.js')) and 'component' not in file_path.lower():
            if any(api in content for api in ['fetch(', 'axios.', 'http.']):
                if 'cache' not in content.lower():
                    patterns.append('service_caching')
                
                if 'try' not in content or 'catch' not in content:
                    patterns.append('error_handling')
            
            if 'addEventListener' in content or 'onChange' in content:
                if 'throttle' not in content.lower() and 'debounce' not in content.lower():
                    patterns.append('throttling')
        
        return patterns