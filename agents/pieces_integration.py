"""Pieces Integration for CodeRabbit Pattern Storage

Advanced integration with Pieces for storing and managing:
- CodeRabbit fix patterns
- Security vulnerability patterns
- Code quality improvement patterns
- Automated fix solutions
- Knowledge base management
"""

import asyncio
import json
import logging
import hashlib
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timedelta
import aiohttp
import base64
from pathlib import Path

logger = logging.getLogger(__name__)

class PiecesAssetType(Enum):
    """Types of assets that can be stored in Pieces"""
    CODE_SNIPPET = "code"
    FIX_PATTERN = "fix_pattern"
    SECURITY_PATTERN = "security_pattern"
    QUALITY_PATTERN = "quality_pattern"
    DOCUMENTATION = "documentation"
    CONFIGURATION = "configuration"

class PatternCategory(Enum):
    """Categories of patterns to store"""
    CODERABBIT_FIXES = "coderabbit-fixes"
    SECURITY_VULNERABILITIES = "security-vulnerabilities"
    PERFORMANCE_OPTIMIZATIONS = "performance-optimizations"
    CODE_STYLE = "code-style"
    REFACTORING = "refactoring"
    TESTING = "testing"
    DOCUMENTATION = "documentation"

@dataclass
class PiecesPattern:
    """Pattern to be stored in Pieces"""
    id: str
    name: str
    description: str
    content: str
    category: PatternCategory
    asset_type: PiecesAssetType
    language: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    success_count: int = 0
    failure_count: int = 0
    confidence_score: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

@dataclass
class StoredAsset:
    """Information about an asset stored in Pieces"""
    pieces_id: str
    pattern_id: str
    name: str
    url: Optional[str] = None
    stored_at: datetime = field(default_factory=datetime.utcnow)
    last_accessed: Optional[datetime] = None
    access_count: int = 0

class PiecesIntegration:
    """Advanced Pieces integration for CodeRabbit patterns"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.pieces.app"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
        
        # Pattern storage
        self.patterns = {}
        self.stored_assets = {}
        self.pattern_index = {}
        
        # Configuration
        self.auto_tagging_enabled = True
        self.duplicate_detection_enabled = True
        self.pattern_validation_enabled = True
        
        # Statistics
        self.storage_stats = {
            "total_patterns": 0,
            "successful_stores": 0,
            "failed_stores": 0,
            "duplicate_detections": 0,
            "pattern_retrievals": 0
        }
        
        # Initialize pattern matching
        self._initialize_pattern_matchers()
    
    def _initialize_pattern_matchers(self):
        """Initialize pattern matching algorithms"""
        self.similarity_threshold = 0.8
        self.content_analyzers = {
            "python": self._analyze_python_pattern,
            "javascript": self._analyze_javascript_pattern,
            "typescript": self._analyze_typescript_pattern,
            "java": self._analyze_java_pattern,
            "go": self._analyze_go_pattern
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                "Authorization": f"Bearer {self.api_key}" if self.api_key else None,
                "Content-Type": "application/json",
                "User-Agent": "WarRoom-CodeRabbit-Integration/1.0"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def store_fix_pattern(
        self, 
        fix_id: str, 
        original_code: str, 
        fixed_code: str, 
        description: str,
        file_path: str,
        success: bool = True
    ) -> Dict[str, Any]:
        """Store a CodeRabbit fix pattern"""
        try:
            # Detect language from file extension
            language = self._detect_language(file_path)
            
            # Create pattern
            pattern = PiecesPattern(
                id=f"fix-{fix_id}",
                name=f"CodeRabbit Fix: {Path(file_path).name}",
                description=description,
                content=self._create_fix_pattern_content(original_code, fixed_code, description),
                category=PatternCategory.CODERABBIT_FIXES,
                asset_type=PiecesAssetType.FIX_PATTERN,
                language=language,
                tags=["coderabbit-fixes", "auto-fix", language] if language else ["coderabbit-fixes", "auto-fix"],
                metadata={
                    "fix_id": fix_id,
                    "file_path": file_path,
                    "original_lines": len(original_code.split('\n')),
                    "fixed_lines": len(fixed_code.split('\n')),
                    "fix_type": self._classify_fix_type(original_code, fixed_code),
                    "complexity": self._assess_fix_complexity(original_code, fixed_code)
                }
            )
            
            # Update success/failure count
            if success:
                pattern.success_count = 1
                pattern.confidence_score = 0.8
            else:
                pattern.failure_count = 1
                pattern.confidence_score = 0.2
            
            # Check for duplicates if enabled
            if self.duplicate_detection_enabled:
                duplicate_id = await self._check_for_duplicate(pattern)
                if duplicate_id:
                    return await self._update_existing_pattern(duplicate_id, pattern)
            
            # Store pattern
            return await self._store_pattern_to_pieces(pattern)
        
        except Exception as e:
            logger.error(f"Failed to store fix pattern: {e}")
            return {"status": "error", "error": str(e)}
    
    async def store_security_pattern(
        self, 
        vulnerability_type: str, 
        code_snippet: str, 
        description: str,
        severity: str,
        cve_references: List[str] = None,
        cwe_references: List[str] = None
    ) -> Dict[str, Any]:
        """Store a security vulnerability pattern"""
        try:
            pattern_id = f"security-{hashlib.md5(code_snippet.encode()).hexdigest()[:8]}"
            
            pattern = PiecesPattern(
                id=pattern_id,
                name=f"Security Pattern: {vulnerability_type}",
                description=description,
                content=self._create_security_pattern_content(
                    vulnerability_type, code_snippet, description, severity
                ),
                category=PatternCategory.SECURITY_VULNERABILITIES,
                asset_type=PiecesAssetType.SECURITY_PATTERN,
                language=self._detect_language_from_code(code_snippet),
                tags=[
                    "security", "vulnerability", vulnerability_type.lower(), 
                    severity, "coderabbit-security"
                ],
                metadata={
                    "vulnerability_type": vulnerability_type,
                    "severity": severity,
                    "cve_references": cve_references or [],
                    "cwe_references": cwe_references or [],
                    "detection_confidence": 0.9
                }
            )
            
            return await self._store_pattern_to_pieces(pattern)
        
        except Exception as e:
            logger.error(f"Failed to store security pattern: {e}")
            return {"status": "error", "error": str(e)}
    
    async def store_quality_pattern(
        self, 
        quality_issue: str, 
        before_code: str, 
        after_code: str, 
        improvement_description: str,
        file_path: str
    ) -> Dict[str, Any]:
        """Store a code quality improvement pattern"""
        try:
            pattern_id = f"quality-{hashlib.md5(f'{before_code}{after_code}'.encode()).hexdigest()[:8]}"
            language = self._detect_language(file_path)
            
            pattern = PiecesPattern(
                id=pattern_id,
                name=f"Quality Improvement: {quality_issue}",
                description=improvement_description,
                content=self._create_quality_pattern_content(
                    quality_issue, before_code, after_code, improvement_description
                ),
                category=PatternCategory.CODE_STYLE,
                asset_type=PiecesAssetType.QUALITY_PATTERN,
                language=language,
                tags=[
                    "code-quality", "improvement", quality_issue.lower().replace(' ', '-'),
                    language, "coderabbit-quality"
                ],
                metadata={
                    "quality_issue": quality_issue,
                    "file_path": file_path,
                    "improvement_type": self._classify_improvement_type(quality_issue),
                    "lines_changed": abs(len(before_code.split('\n')) - len(after_code.split('\n')))
                }
            )
            
            return await self._store_pattern_to_pieces(pattern)
        
        except Exception as e:
            logger.error(f"Failed to store quality pattern: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _store_pattern_to_pieces(self, pattern: PiecesPattern) -> Dict[str, Any]:
        """Store pattern to Pieces platform"""
        if not self.session:
            raise RuntimeError("Session not initialized - use async context manager")
        
        try:
            # Prepare payload for Pieces API
            payload = {
                "name": pattern.name,
                "raw": {
                    "value": pattern.content
                },
                "annotations": {
                    "description": {
                        "value": pattern.description
                    },
                    "tags": [{"value": tag} for tag in pattern.tags]
                },
                "classification": {
                    "specific": pattern.asset_type.value
                },
                "metadata": pattern.metadata
            }
            
            # Add language classification if available
            if pattern.language:
                payload["classification"]["language"] = pattern.language
            
            # Store to Pieces
            url = f"{self.base_url}/assets"
            async with self.session.post(url, json=payload) as response:
                if response.status in [200, 201]:
                    result_data = await response.json()
                    pieces_id = result_data.get("id")
                    
                    # Record successful storage
                    stored_asset = StoredAsset(
                        pieces_id=pieces_id,
                        pattern_id=pattern.id,
                        name=pattern.name,
                        url=result_data.get("sharing", {}).get("publicLink")
                    )
                    
                    self.patterns[pattern.id] = pattern
                    self.stored_assets[pattern.id] = stored_asset
                    self._update_pattern_index(pattern)
                    
                    self.storage_stats["successful_stores"] += 1
                    self.storage_stats["total_patterns"] += 1
                    
                    logger.info(f"Successfully stored pattern {pattern.id} to Pieces")
                    return {
                        "status": "success",
                        "pattern_id": pattern.id,
                        "pieces_id": pieces_id,
                        "url": stored_asset.url
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"Pieces API error {response.status}: {error_text}")
                    self.storage_stats["failed_stores"] += 1
                    return {
                        "status": "error",
                        "error": f"Pieces API error {response.status}: {error_text}"
                    }
        
        except Exception as e:
            logger.error(f"Error storing pattern to Pieces: {e}")
            self.storage_stats["failed_stores"] += 1
            return {"status": "error", "error": str(e)}
    
    async def retrieve_patterns_by_category(self, category: PatternCategory, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve patterns by category from Pieces"""
        try:
            if not self.session:
                raise RuntimeError("Session not initialized")
            
            # Get patterns from local cache first
            local_patterns = [
                self._pattern_to_dict(pattern) for pattern in self.patterns.values()
                if pattern.category == category
            ][:limit]
            
            # If we need more patterns, fetch from Pieces
            if len(local_patterns) < limit and self.api_key:
                remote_patterns = await self._fetch_remote_patterns(category, limit - len(local_patterns))
                local_patterns.extend(remote_patterns)
            
            self.storage_stats["pattern_retrievals"] += len(local_patterns)
            return local_patterns
        
        except Exception as e:
            logger.error(f"Error retrieving patterns: {e}")
            return []
    
    async def search_patterns(self, query: str, categories: List[PatternCategory] = None) -> List[Dict[str, Any]]:
        """Search patterns by query"""
        try:
            results = []
            search_terms = query.lower().split()
            
            # Search local patterns
            for pattern in self.patterns.values():
                if categories and pattern.category not in categories:
                    continue
                
                # Calculate relevance score
                score = self._calculate_relevance_score(pattern, search_terms)
                if score > 0.3:  # Threshold for relevance
                    pattern_dict = self._pattern_to_dict(pattern)
                    pattern_dict["relevance_score"] = score
                    results.append(pattern_dict)
            
            # Sort by relevance
            results.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            # Search remote patterns if needed
            if len(results) < 10 and self.api_key:
                remote_results = await self._search_remote_patterns(query, categories)
                results.extend(remote_results)
            
            return results[:20]  # Limit to top 20 results
        
        except Exception as e:
            logger.error(f"Error searching patterns: {e}")
            return []
    
    async def get_pattern_statistics(self, pattern_id: str) -> Dict[str, Any]:
        """Get detailed statistics for a pattern"""
        try:
            pattern = self.patterns.get(pattern_id)
            stored_asset = self.stored_assets.get(pattern_id)
            
            if not pattern:
                return {"status": "not_found"}
            
            # Calculate usage statistics
            total_usage = pattern.success_count + pattern.failure_count
            success_rate = (pattern.success_count / total_usage) if total_usage > 0 else 0
            
            stats = {
                "pattern_id": pattern_id,
                "name": pattern.name,
                "category": pattern.category.value,
                "language": pattern.language,
                "success_count": pattern.success_count,
                "failure_count": pattern.failure_count,
                "success_rate": success_rate,
                "confidence_score": pattern.confidence_score,
                "created_at": pattern.created_at.isoformat(),
                "last_updated": pattern.updated_at.isoformat() if pattern.updated_at else None,
                "tags": pattern.tags,
                "metadata": pattern.metadata
            }
            
            if stored_asset:
                stats.update({
                    "pieces_id": stored_asset.pieces_id,
                    "pieces_url": stored_asset.url,
                    "access_count": stored_asset.access_count,
                    "last_accessed": stored_asset.last_accessed.isoformat() if stored_asset.last_accessed else None
                })
            
            return stats
        
        except Exception as e:
            logger.error(f"Error getting pattern statistics: {e}")
            return {"status": "error", "error": str(e)}
    
    async def update_pattern_feedback(self, pattern_id: str, success: bool, feedback: str = None) -> Dict[str, Any]:
        """Update pattern with success/failure feedback"""
        try:
            pattern = self.patterns.get(pattern_id)
            if not pattern:
                return {"status": "not_found"}
            
            # Update counters
            if success:
                pattern.success_count += 1
            else:
                pattern.failure_count += 1
            
            # Recalculate confidence score
            total_usage = pattern.success_count + pattern.failure_count
            pattern.confidence_score = pattern.success_count / total_usage if total_usage > 0 else 0
            pattern.updated_at = datetime.utcnow()
            
            # Add feedback to metadata if provided
            if feedback:
                if "feedback" not in pattern.metadata:
                    pattern.metadata["feedback"] = []
                pattern.metadata["feedback"].append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "success": success,
                    "comment": feedback
                })
            
            # Update in Pieces if possible
            if self.api_key and pattern_id in self.stored_assets:
                await self._update_pattern_in_pieces(pattern)
            
            logger.info(f"Updated pattern {pattern_id} - Success: {success}")
            return {
                "status": "success",
                "new_confidence_score": pattern.confidence_score,
                "total_usage": total_usage
            }
        
        except Exception as e:
            logger.error(f"Error updating pattern feedback: {e}")
            return {"status": "error", "error": str(e)}
    
    def _create_fix_pattern_content(self, original_code: str, fixed_code: str, description: str) -> str:
        """Create formatted content for fix pattern"""
        return f"""# CodeRabbit Fix Pattern

## Description
{description}

## Original Code
```
{original_code}
```

## Fixed Code
```
{fixed_code}
```

## Pattern Type
{self._classify_fix_type(original_code, fixed_code)}

## Generated by CodeRabbit Integration
Timestamp: {datetime.utcnow().isoformat()}
"""
    
    def _create_security_pattern_content(self, vuln_type: str, code_snippet: str, description: str, severity: str) -> str:
        """Create formatted content for security pattern"""
        return f"""# Security Vulnerability Pattern: {vuln_type}

## Severity: {severity.upper()}

## Description
{description}

## Vulnerable Code Pattern
```
{code_snippet}
```

## Detection Notes
- Pattern identified by CodeRabbit security analysis
- Requires manual review for false positives
- Consider implementing automated detection in CI/CD

## Generated by CodeRabbit Security Monitor
Timestamp: {datetime.utcnow().isoformat()}
"""
    
    def _create_quality_pattern_content(self, quality_issue: str, before_code: str, after_code: str, description: str) -> str:
        """Create formatted content for quality pattern"""
        return f"""# Code Quality Improvement: {quality_issue}

## Description
{description}

## Before (Issue)
```
{before_code}
```

## After (Improved)
```
{after_code}
```

## Quality Impact
- Improves code maintainability
- Enhances readability
- Follows best practices

## Generated by CodeRabbit Quality Analysis
Timestamp: {datetime.utcnow().isoformat()}
"""
    
    def _detect_language(self, file_path: str) -> Optional[str]:
        """Detect programming language from file path"""
        file_path = Path(file_path)
        extension_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.php': 'php',
            '.rb': 'ruby',
            '.cs': 'csharp',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala'
        }
        return extension_map.get(file_path.suffix)
    
    def _detect_language_from_code(self, code: str) -> Optional[str]:
        """Detect language from code content"""
        # Simple heuristic-based detection
        if 'def ' in code and 'import ' in code:
            return 'python'
        elif 'function' in code and 'var ' in code:
            return 'javascript'
        elif 'public class' in code and 'static void main' in code:
            return 'java'
        elif 'func ' in code and 'package ' in code:
            return 'go'
        # Add more detection logic as needed
        return None
    
    def _classify_fix_type(self, original: str, fixed: str) -> str:
        """Classify the type of fix applied"""
        if len(fixed) < len(original):
            return "removal"
        elif len(fixed) > len(original):
            return "addition"
        elif original.replace(' ', '') != fixed.replace(' ', ''):
            return "modification"
        else:
            return "formatting"
    
    def _assess_fix_complexity(self, original: str, fixed: str) -> str:
        """Assess complexity of the fix"""
        original_lines = len(original.split('\n'))
        fixed_lines = len(fixed.split('\n'))
        line_diff = abs(original_lines - fixed_lines)
        
        if line_diff <= 1:
            return "simple"
        elif line_diff <= 5:
            return "moderate"
        else:
            return "complex"
    
    def _classify_improvement_type(self, quality_issue: str) -> str:
        """Classify the type of quality improvement"""
        issue_lower = quality_issue.lower()
        
        if any(keyword in issue_lower for keyword in ['performance', 'optimization', 'efficiency']):
            return "performance"
        elif any(keyword in issue_lower for keyword in ['security', 'vulnerability', 'safe']):
            return "security"
        elif any(keyword in issue_lower for keyword in ['style', 'format', 'convention']):
            return "style"
        elif any(keyword in issue_lower for keyword in ['maintainability', 'readability', 'clean']):
            return "maintainability"
        else:
            return "general"
    
    async def _check_for_duplicate(self, pattern: PiecesPattern) -> Optional[str]:
        """Check for duplicate patterns"""
        for existing_id, existing_pattern in self.patterns.items():
            if existing_pattern.category != pattern.category:
                continue
            
            # Calculate similarity
            similarity = self._calculate_content_similarity(
                existing_pattern.content, pattern.content
            )
            
            if similarity > self.similarity_threshold:
                self.storage_stats["duplicate_detections"] += 1
                logger.info(f"Duplicate pattern detected: {similarity:.2f} similarity")
                return existing_id
        
        return None
    
    def _calculate_content_similarity(self, content1: str, content2: str) -> float:
        """Calculate similarity between two content strings"""
        # Simple similarity calculation (could be enhanced with more sophisticated algorithms)
        words1 = set(content1.lower().split())
        words2 = set(content2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    async def _update_existing_pattern(self, existing_id: str, new_pattern: PiecesPattern) -> Dict[str, Any]:
        """Update existing pattern with new information"""
        existing_pattern = self.patterns[existing_id]
        
        # Merge success/failure counts
        existing_pattern.success_count += new_pattern.success_count
        existing_pattern.failure_count += new_pattern.failure_count
        
        # Recalculate confidence
        total_usage = existing_pattern.success_count + existing_pattern.failure_count
        existing_pattern.confidence_score = existing_pattern.success_count / total_usage if total_usage > 0 else 0
        existing_pattern.updated_at = datetime.utcnow()
        
        # Merge tags and metadata
        existing_pattern.tags = list(set(existing_pattern.tags + new_pattern.tags))
        existing_pattern.metadata.update(new_pattern.metadata)
        
        logger.info(f"Updated existing pattern {existing_id}")
        return {
            "status": "updated_existing",
            "pattern_id": existing_id,
            "confidence_score": existing_pattern.confidence_score
        }
    
    def _update_pattern_index(self, pattern: PiecesPattern):
        """Update search index for pattern"""
        # Create search index entries
        index_terms = []
        index_terms.extend(pattern.name.lower().split())
        index_terms.extend(pattern.description.lower().split())
        index_terms.extend(pattern.tags)
        
        if pattern.language:
            index_terms.append(pattern.language)
        
        # Store index
        for term in set(index_terms):
            if term not in self.pattern_index:
                self.pattern_index[term] = set()
            self.pattern_index[term].add(pattern.id)
    
    def _calculate_relevance_score(self, pattern: PiecesPattern, search_terms: List[str]) -> float:
        """Calculate relevance score for search query"""
        score = 0.0
        total_terms = len(search_terms)
        
        if total_terms == 0:
            return 0.0
        
        # Check name matches
        name_lower = pattern.name.lower()
        for term in search_terms:
            if term in name_lower:
                score += 0.3
        
        # Check description matches
        desc_lower = pattern.description.lower()
        for term in search_terms:
            if term in desc_lower:
                score += 0.2
        
        # Check tag matches
        for term in search_terms:
            if term in pattern.tags:
                score += 0.4
        
        # Check metadata matches
        metadata_str = json.dumps(pattern.metadata).lower()
        for term in search_terms:
            if term in metadata_str:
                score += 0.1
        
        # Normalize by number of terms
        return min(1.0, score / total_terms)
    
    async def _fetch_remote_patterns(self, category: PatternCategory, limit: int) -> List[Dict[str, Any]]:
        """Fetch patterns from Pieces API"""
        try:
            if not self.session or not self.api_key:
                return []
            
            # Build search query
            params = {
                "query": f"category:{category.value}",
                "limit": limit
            }
            
            url = f"{self.base_url}/assets/search"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_remote_patterns(data.get("assets", []))
                else:
                    logger.warning(f"Remote pattern fetch failed: {response.status}")
                    return []
        
        except Exception as e:
            logger.error(f"Error fetching remote patterns: {e}")
            return []
    
    async def _search_remote_patterns(self, query: str, categories: List[PatternCategory] = None) -> List[Dict[str, Any]]:
        """Search patterns in Pieces API"""
        try:
            if not self.session or not self.api_key:
                return []
            
            search_query = query
            if categories:
                category_filter = " OR ".join([f"category:{cat.value}" for cat in categories])
                search_query = f"{query} AND ({category_filter})"
            
            params = {"query": search_query, "limit": 10}
            
            url = f"{self.base_url}/assets/search"
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_remote_patterns(data.get("assets", []))
                else:
                    return []
        
        except Exception as e:
            logger.error(f"Error searching remote patterns: {e}")
            return []
    
    def _parse_remote_patterns(self, assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse remote patterns from Pieces API response"""
        patterns = []
        for asset in assets:
            try:
                pattern_dict = {
                    "id": asset.get("id"),
                    "name": asset.get("name", "Unnamed Pattern"),
                    "description": asset.get("annotations", {}).get("description", {}).get("value", ""),
                    "content": asset.get("raw", {}).get("value", ""),
                    "tags": [tag.get("value") for tag in asset.get("annotations", {}).get("tags", [])],
                    "language": asset.get("classification", {}).get("language"),
                    "created_at": asset.get("created", ""),
                    "source": "pieces_remote"
                }
                patterns.append(pattern_dict)
            except Exception as e:
                logger.warning(f"Error parsing remote pattern: {e}")
        
        return patterns
    
    async def _update_pattern_in_pieces(self, pattern: PiecesPattern):
        """Update pattern in Pieces (if supported by API)"""
        # This would update the pattern in Pieces if the API supports it
        # For now, we'll just log the update
        logger.info(f"Pattern {pattern.id} would be updated in Pieces")
    
    def _pattern_to_dict(self, pattern: PiecesPattern) -> Dict[str, Any]:
        """Convert pattern to dictionary"""
        return {
            "id": pattern.id,
            "name": pattern.name,
            "description": pattern.description,
            "category": pattern.category.value,
            "asset_type": pattern.asset_type.value,
            "language": pattern.language,
            "tags": pattern.tags,
            "success_count": pattern.success_count,
            "failure_count": pattern.failure_count,
            "confidence_score": pattern.confidence_score,
            "created_at": pattern.created_at.isoformat(),
            "updated_at": pattern.updated_at.isoformat() if pattern.updated_at else None,
            "metadata": pattern.metadata
        }
    
    # Language-specific pattern analyzers
    def _analyze_python_pattern(self, content: str) -> Dict[str, Any]:
        """Analyze Python-specific patterns"""
        return {
            "imports": len([line for line in content.split('\n') if line.strip().startswith('import')]),
            "functions": len([line for line in content.split('\n') if 'def ' in line]),
            "classes": len([line for line in content.split('\n') if 'class ' in line]),
            "complexity_indicators": content.count('if ') + content.count('for ') + content.count('while ')
        }
    
    def _analyze_javascript_pattern(self, content: str) -> Dict[str, Any]:
        """Analyze JavaScript-specific patterns"""
        return {
            "functions": content.count('function ') + content.count('=>'),
            "variables": content.count('var ') + content.count('let ') + content.count('const '),
            "async_usage": content.count('async ') + content.count('await '),
            "promises": content.count('Promise') + content.count('.then(')
        }
    
    def _analyze_typescript_pattern(self, content: str) -> Dict[str, Any]:
        """Analyze TypeScript-specific patterns"""
        js_analysis = self._analyze_javascript_pattern(content)
        ts_specific = {
            "interfaces": content.count('interface '),
            "types": content.count('type '),
            "generics": content.count('<') - content.count('</'),
            "decorators": content.count('@')
        }
        return {**js_analysis, **ts_specific}
    
    def _analyze_java_pattern(self, content: str) -> Dict[str, Any]:
        """Analyze Java-specific patterns"""
        return {
            "classes": content.count('class '),
            "methods": content.count('public ') + content.count('private ') + content.count('protected '),
            "interfaces": content.count('interface '),
            "annotations": content.count('@'),
            "imports": len([line for line in content.split('\n') if line.strip().startswith('import')])
        }
    
    def _analyze_go_pattern(self, content: str) -> Dict[str, Any]:
        """Analyze Go-specific patterns"""
        return {
            "functions": content.count('func '),
            "structs": content.count('type ') + content.count('struct'),
            "interfaces": content.count('interface{'),
            "goroutines": content.count('go '),
            "channels": content.count('chan ') + content.count('<-')
        }
    
    def get_storage_statistics(self) -> Dict[str, Any]:
        """Get comprehensive storage statistics"""
        return {
            **self.storage_stats,
            "patterns_by_category": {
                category.value: len([p for p in self.patterns.values() if p.category == category])
                for category in PatternCategory
            },
            "patterns_by_language": {
                lang: len([p for p in self.patterns.values() if p.language == lang])
                for lang in set(p.language for p in self.patterns.values() if p.language)
            },
            "average_confidence": sum(p.confidence_score for p in self.patterns.values()) / max(len(self.patterns), 1),
            "index_size": len(self.pattern_index),
            "stored_assets": len(self.stored_assets),
            "last_update": datetime.utcnow().isoformat()
        }