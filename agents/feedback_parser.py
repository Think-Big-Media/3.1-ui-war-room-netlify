"""Intelligent Feedback Parser for CodeRabbit Integration

Advanced parsing and analysis of CodeRabbit feedback:
- Natural language processing of feedback
- Pattern recognition and classification
- Severity assessment and prioritization
- Actionable insight extraction
- Fix suggestion analysis
"""

import re
import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

class FeedbackCategory(Enum):
    """Categories of feedback"""
    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"
    STYLE = "style"
    DOCUMENTATION = "documentation"
    TESTING = "testing"
    ARCHITECTURE = "architecture"
    BUG_RISK = "bug_risk"
    DEPENDENCY = "dependency"
    ACCESSIBILITY = "accessibility"

class ActionType(Enum):
    """Types of actions that can be taken"""
    AUTO_FIX = "auto_fix"
    MANUAL_REVIEW = "manual_review"
    REFACTOR = "refactor"
    DOCUMENT = "document"
    TEST = "test"
    INVESTIGATE = "investigate"
    IGNORE = "ignore"

class ConfidenceLevel(Enum):
    """Confidence levels for analysis"""
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    VERY_LOW = "very_low"

@dataclass
class ParsedFeedback:
    """Parsed and analyzed feedback item"""
    id: str
    original_feedback: Dict[str, Any]
    category: FeedbackCategory
    severity: str
    confidence: ConfidenceLevel
    title: str
    description: str
    file_path: str
    line_number: int
    code_snippet: Optional[str]
    suggested_fix: Optional[str]
    action_type: ActionType
    keywords: List[str] = field(default_factory=list)
    patterns: List[str] = field(default_factory=list)
    related_cve: Optional[str] = None
    impact_assessment: Dict[str, Any] = field(default_factory=dict)
    fix_complexity: str = "unknown"
    auto_fixable: bool = False
    requires_testing: bool = True
    business_impact: str = "low"

@dataclass
class FeedbackSummary:
    """Summary of all parsed feedback"""
    total_items: int
    by_category: Dict[FeedbackCategory, int]
    by_severity: Dict[str, int]
    by_action_type: Dict[ActionType, int]
    critical_issues: List[ParsedFeedback]
    auto_fixable_items: List[ParsedFeedback]
    manual_review_items: List[ParsedFeedback]
    patterns_detected: Dict[str, int]
    recommendations: List[str]

class FeedbackParser:
    """Intelligent parser for CodeRabbit feedback"""
    
    def __init__(self):
        self.security_keywords = self._load_security_keywords()
        self.performance_keywords = self._load_performance_keywords()
        self.style_keywords = self._load_style_keywords()
        self.vulnerability_patterns = self._load_vulnerability_patterns()
        self.fix_patterns = self._load_fix_patterns()
        
        # Parsing statistics
        self.parsing_stats = {
            "total_parsed": 0,
            "successful_parses": 0,
            "failed_parses": 0,
            "auto_fixable_found": 0,
            "security_issues_found": 0
        }
    
    def _load_security_keywords(self) -> Set[str]:
        """Load security-related keywords for classification"""
        return {
            "sql injection", "xss", "csrf", "authentication", "authorization",
            "encryption", "plaintext", "password", "secret", "api key",
            "vulnerability", "exploit", "attack", "malicious", "security",
            "unsafe", "insecure", "privilege", "access control", "validation",
            "sanitization", "buffer overflow", "memory leak", "dos", "ddos",
            "injection", "deserialization", "directory traversal", "xxe",
            "ssrf", "rce", "lfi", "rfi", "cve", "cwe"
        }
    
    def _load_performance_keywords(self) -> Set[str]:
        """Load performance-related keywords"""
        return {
            "performance", "slow", "optimization", "efficiency", "memory",
            "cpu", "database", "query", "n+1", "caching", "bottleneck",
            "latency", "throughput", "scalability", "resource", "allocation",
            "garbage collection", "async", "await", "blocking", "deadlock",
            "race condition", "thread", "process", "io bound", "cpu bound"
        }
    
    def _load_style_keywords(self) -> Set[str]:
        """Load style and maintainability keywords"""
        return {
            "naming", "convention", "formatting", "indentation", "spacing",
            "complexity", "maintainability", "readability", "documentation",
            "comments", "docstring", "type hint", "annotation", "import",
            "unused", "duplicate", "redundant", "magic number", "hardcoded"
        }
    
    def _load_vulnerability_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load known vulnerability patterns"""
        return {
            "sql_injection": {
                "patterns": [r"execute\s*\(\s*['\"].*\+.*['\"]", r"query\s*\(\s*['\"].*\%.*['\"]"],
                "severity": "critical",
                "cwe": "CWE-89"
            },
            "xss": {
                "patterns": [r"innerHTML\s*=.*\+", r"document\.write\s*\(.*\+"],
                "severity": "high",
                "cwe": "CWE-79"
            },
            "hardcoded_secrets": {
                "patterns": [r"api[_-]?key\s*=\s*['\"][a-zA-Z0-9]{20,}", r"password\s*=\s*['\"][^'\"]{8,}"],
                "severity": "high",
                "cwe": "CWE-798"
            },
            "unsafe_deserialization": {
                "patterns": [r"pickle\.loads?", r"yaml\.load\s*\(", r"json\.loads.*user"],
                "severity": "critical",
                "cwe": "CWE-502"
            }
        }
    
    def _load_fix_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load patterns for automatic fixes"""
        return {
            "import_sorting": {
                "pattern": r"import\s+statements\s+should\s+be\s+sorted",
                "fix_type": "auto",
                "complexity": "low"
            },
            "unused_import": {
                "pattern": r"unused\s+import",
                "fix_type": "auto",
                "complexity": "low"
            },
            "type_annotation": {
                "pattern": r"missing\s+type\s+annotation",
                "fix_type": "semi_auto",
                "complexity": "medium"
            },
            "docstring_format": {
                "pattern": r"docstring\s+format",
                "fix_type": "auto",
                "complexity": "low"
            }
        }
    
    def parse_feedback_batch(self, feedback_items: List[Dict[str, Any]]) -> FeedbackSummary:
        """Parse a batch of feedback items"""
        parsed_items = []
        
        for item in feedback_items:
            try:
                parsed_item = self.parse_single_feedback(item)
                parsed_items.append(parsed_item)
                self.parsing_stats["successful_parses"] += 1
            except Exception as e:
                logger.error(f"Failed to parse feedback item: {e}")
                self.parsing_stats["failed_parses"] += 1
        
        self.parsing_stats["total_parsed"] += len(feedback_items)
        
        # Generate summary
        summary = self._generate_summary(parsed_items)
        return summary
    
    def parse_single_feedback(self, feedback_item: Dict[str, Any]) -> ParsedFeedback:
        """Parse a single feedback item with intelligent analysis"""
        # Extract basic information
        item_id = feedback_item.get("id", self._generate_id(feedback_item))
        description = feedback_item.get("description", "")
        file_path = feedback_item.get("file_path", "")
        line_number = feedback_item.get("line_number", 0)
        suggested_fix = feedback_item.get("suggested_fix")
        
        # Classify category and severity
        category = self._classify_category(description, feedback_item)
        severity = self._assess_severity(description, category, feedback_item)
        confidence = self._assess_confidence(feedback_item)
        
        # Extract keywords and patterns
        keywords = self._extract_keywords(description)
        patterns = self._detect_patterns(description, feedback_item.get("code_snippet", ""))
        
        # Determine action type and fix complexity
        action_type = self._determine_action_type(description, suggested_fix, category)
        fix_complexity = self._assess_fix_complexity(description, suggested_fix)
        auto_fixable = self._is_auto_fixable(description, suggested_fix, category)
        
        # Security-specific analysis
        related_cve = self._detect_cve_reference(description)
        
        # Impact assessment
        impact_assessment = self._assess_impact(category, severity, file_path)
        business_impact = self._assess_business_impact(category, severity, impact_assessment)
        
        # Update statistics
        if auto_fixable:
            self.parsing_stats["auto_fixable_found"] += 1
        if category == FeedbackCategory.SECURITY:
            self.parsing_stats["security_issues_found"] += 1
        
        parsed_feedback = ParsedFeedback(
            id=item_id,
            original_feedback=feedback_item,
            category=category,
            severity=severity,
            confidence=confidence,
            title=self._generate_title(description, category),
            description=description,
            file_path=file_path,
            line_number=line_number,
            code_snippet=feedback_item.get("code_snippet"),
            suggested_fix=suggested_fix,
            action_type=action_type,
            keywords=keywords,
            patterns=patterns,
            related_cve=related_cve,
            impact_assessment=impact_assessment,
            fix_complexity=fix_complexity,
            auto_fixable=auto_fixable,
            requires_testing=self._requires_testing(category, action_type),
            business_impact=business_impact
        )
        
        return parsed_feedback
    
    def _generate_id(self, feedback_item: Dict[str, Any]) -> str:
        """Generate unique ID for feedback item"""
        content = json.dumps(feedback_item, sort_keys=True)
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _classify_category(self, description: str, feedback_item: Dict[str, Any]) -> FeedbackCategory:
        """Classify feedback into categories"""
        desc_lower = description.lower()
        
        # Security keywords check
        security_score = sum(1 for keyword in self.security_keywords if keyword in desc_lower)
        if security_score > 0:
            return FeedbackCategory.SECURITY
        
        # Performance keywords check
        performance_score = sum(1 for keyword in self.performance_keywords if keyword in desc_lower)
        if performance_score > 0:
            return FeedbackCategory.PERFORMANCE
        
        # Style keywords check
        style_score = sum(1 for keyword in self.style_keywords if keyword in desc_lower)
        if style_score > 0:
            return FeedbackCategory.STYLE
        
        # Pattern-based classification
        if any(word in desc_lower for word in ["test", "spec", "mock", "assert"]):
            return FeedbackCategory.TESTING
        
        if any(word in desc_lower for word in ["doc", "comment", "documentation"]):
            return FeedbackCategory.DOCUMENTATION
        
        if any(word in desc_lower for word in ["architecture", "design", "structure"]):
            return FeedbackCategory.ARCHITECTURE
        
        if any(word in desc_lower for word in ["bug", "error", "exception", "crash"]):
            return FeedbackCategory.BUG_RISK
        
        if any(word in desc_lower for word in ["dependency", "package", "library", "version"]):
            return FeedbackCategory.DEPENDENCY
        
        # Default to maintainability
        return FeedbackCategory.MAINTAINABILITY
    
    def _assess_severity(self, description: str, category: FeedbackCategory, feedback_item: Dict[str, Any]) -> str:
        """Assess severity of the feedback"""
        desc_lower = description.lower()
        
        # Critical severity indicators
        critical_indicators = [
            "vulnerability", "exploit", "critical", "severe", "dangerous",
            "security", "injection", "rce", "buffer overflow", "memory corruption"
        ]
        
        if any(indicator in desc_lower for indicator in critical_indicators):
            return "critical"
        
        # High severity indicators
        high_indicators = [
            "high", "important", "urgent", "major", "significant",
            "performance", "memory leak", "deadlock", "race condition"
        ]
        
        if any(indicator in desc_lower for indicator in high_indicators):
            return "high"
        
        # Medium severity indicators
        medium_indicators = [
            "medium", "moderate", "should", "recommended", "improve"
        ]
        
        if any(indicator in desc_lower for indicator in medium_indicators):
            return "medium"
        
        # Low severity indicators
        low_indicators = [
            "low", "minor", "style", "formatting", "convention", "cosmetic"
        ]
        
        if any(indicator in desc_lower for indicator in low_indicators):
            return "low"
        
        # Category-based default severity
        if category == FeedbackCategory.SECURITY:
            return "high"
        elif category == FeedbackCategory.PERFORMANCE:
            return "medium"
        elif category == FeedbackCategory.BUG_RISK:
            return "medium"
        else:
            return "low"
    
    def _assess_confidence(self, feedback_item: Dict[str, Any]) -> ConfidenceLevel:
        """Assess confidence level of the feedback"""
        confidence_score = feedback_item.get("confidence", 0.5)
        
        if confidence_score >= 0.9:
            return ConfidenceLevel.VERY_HIGH
        elif confidence_score >= 0.75:
            return ConfidenceLevel.HIGH
        elif confidence_score >= 0.5:
            return ConfidenceLevel.MEDIUM
        elif confidence_score >= 0.25:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW
    
    def _extract_keywords(self, description: str) -> List[str]:
        """Extract relevant keywords from description"""
        # Simple keyword extraction - could be enhanced with NLP
        words = re.findall(r'\b\w+\b', description.lower())
        
        # Filter out common words and keep relevant ones
        relevant_words = []
        for word in words:
            if (word in self.security_keywords or 
                word in self.performance_keywords or 
                word in self.style_keywords):
                relevant_words.append(word)
        
        return list(set(relevant_words))
    
    def _detect_patterns(self, description: str, code_snippet: str) -> List[str]:
        """Detect known vulnerability patterns"""
        detected_patterns = []
        
        combined_text = f"{description} {code_snippet}".lower()
        
        for pattern_name, pattern_info in self.vulnerability_patterns.items():
            for pattern in pattern_info["patterns"]:
                if re.search(pattern, combined_text, re.IGNORECASE):
                    detected_patterns.append(pattern_name)
                    break
        
        return detected_patterns
    
    def _determine_action_type(self, description: str, suggested_fix: Optional[str], category: FeedbackCategory) -> ActionType:
        """Determine the appropriate action type"""
        desc_lower = description.lower()
        
        # Auto-fixable patterns
        auto_fix_patterns = [
            "import", "formatting", "spacing", "unused", "sort", "order"
        ]
        
        if suggested_fix and any(pattern in desc_lower for pattern in auto_fix_patterns):
            return ActionType.AUTO_FIX
        
        # Security issues need investigation
        if category == FeedbackCategory.SECURITY:
            return ActionType.INVESTIGATE
        
        # Performance issues might need refactoring
        if category == FeedbackCategory.PERFORMANCE:
            if "refactor" in desc_lower or "redesign" in desc_lower:
                return ActionType.REFACTOR
            return ActionType.MANUAL_REVIEW
        
        # Documentation issues
        if category == FeedbackCategory.DOCUMENTATION:
            return ActionType.DOCUMENT
        
        # Testing issues
        if category == FeedbackCategory.TESTING:
            return ActionType.TEST
        
        # Default to manual review
        return ActionType.MANUAL_REVIEW
    
    def _assess_fix_complexity(self, description: str, suggested_fix: Optional[str]) -> str:
        """Assess the complexity of the fix"""
        if not suggested_fix:
            return "high"
        
        desc_lower = description.lower()
        fix_lower = suggested_fix.lower()
        
        # Low complexity indicators
        if any(indicator in desc_lower or indicator in fix_lower 
               for indicator in ["import", "format", "space", "indent", "comment"]):
            return "low"
        
        # Medium complexity indicators
        if any(indicator in desc_lower or indicator in fix_lower 
               for indicator in ["rename", "move", "extract", "type annotation"]):
            return "medium"
        
        # High complexity indicators
        if any(indicator in desc_lower or indicator in fix_lower 
               for indicator in ["refactor", "redesign", "architecture", "algorithm"]):
            return "high"
        
        return "medium"
    
    def _is_auto_fixable(self, description: str, suggested_fix: Optional[str], category: FeedbackCategory) -> bool:
        """Determine if the issue can be automatically fixed"""
        if not suggested_fix:
            return False
        
        desc_lower = description.lower()
        
        # Safe auto-fix patterns
        safe_patterns = [
            "import sorting", "unused import", "formatting", "spacing",
            "indentation", "trailing whitespace", "line ending"
        ]
        
        if any(pattern in desc_lower for pattern in safe_patterns):
            return True
        
        # Never auto-fix security or architecture issues
        if category in [FeedbackCategory.SECURITY, FeedbackCategory.ARCHITECTURE]:
            return False
        
        # Check for safe suggested fixes
        fix_lower = suggested_fix.lower()
        unsafe_fix_patterns = [
            "delete", "remove", "drop", "truncate", "system", "exec",
            "eval", "subprocess", "os.", "file", "network"
        ]
        
        if any(pattern in fix_lower for pattern in unsafe_fix_patterns):
            return False
        
        return len(suggested_fix) < 500  # Don't auto-fix large changes
    
    def _detect_cve_reference(self, description: str) -> Optional[str]:
        """Detect CVE references in description"""
        cve_pattern = r"CVE-\d{4}-\d{4,7}"
        match = re.search(cve_pattern, description, re.IGNORECASE)
        return match.group() if match else None
    
    def _assess_impact(self, category: FeedbackCategory, severity: str, file_path: str) -> Dict[str, Any]:
        """Assess the impact of the issue"""
        impact = {
            "category_impact": self._get_category_impact(category),
            "severity_multiplier": self._get_severity_multiplier(severity),
            "file_criticality": self._assess_file_criticality(file_path)
        }
        
        # Calculate overall impact score
        impact["overall_score"] = (
            impact["category_impact"] * 
            impact["severity_multiplier"] * 
            impact["file_criticality"]
        )
        
        return impact
    
    def _get_category_impact(self, category: FeedbackCategory) -> float:
        """Get impact multiplier based on category"""
        impact_scores = {
            FeedbackCategory.SECURITY: 10.0,
            FeedbackCategory.BUG_RISK: 8.0,
            FeedbackCategory.PERFORMANCE: 6.0,
            FeedbackCategory.ARCHITECTURE: 5.0,
            FeedbackCategory.MAINTAINABILITY: 3.0,
            FeedbackCategory.TESTING: 3.0,
            FeedbackCategory.DEPENDENCY: 2.0,
            FeedbackCategory.DOCUMENTATION: 1.0,
            FeedbackCategory.STYLE: 0.5,
            FeedbackCategory.ACCESSIBILITY: 4.0
        }
        return impact_scores.get(category, 1.0)
    
    def _get_severity_multiplier(self, severity: str) -> float:
        """Get multiplier based on severity"""
        multipliers = {
            "critical": 4.0,
            "high": 3.0,
            "medium": 2.0,
            "low": 1.0
        }
        return multipliers.get(severity, 1.0)
    
    def _assess_file_criticality(self, file_path: str) -> float:
        """Assess criticality based on file path"""
        path_lower = file_path.lower()
        
        # High criticality files
        if any(pattern in path_lower for pattern in [
            "auth", "security", "login", "password", "payment", "admin"
        ]):
            return 3.0
        
        # Medium criticality files
        if any(pattern in path_lower for pattern in [
            "api", "controller", "service", "model", "database"
        ]):
            return 2.0
        
        # Low criticality files
        if any(pattern in path_lower for pattern in [
            "test", "spec", "mock", "example", "demo"
        ]):
            return 0.5
        
        return 1.0
    
    def _assess_business_impact(self, category: FeedbackCategory, severity: str, impact_assessment: Dict[str, Any]) -> str:
        """Assess business impact level"""
        overall_score = impact_assessment.get("overall_score", 1.0)
        
        if overall_score >= 50:
            return "critical"
        elif overall_score >= 20:
            return "high"
        elif overall_score >= 5:
            return "medium"
        else:
            return "low"
    
    def _requires_testing(self, category: FeedbackCategory, action_type: ActionType) -> bool:
        """Determine if changes require testing"""
        # Always test security and bug fixes
        if category in [FeedbackCategory.SECURITY, FeedbackCategory.BUG_RISK]:
            return True
        
        # Test functional changes
        if action_type in [ActionType.REFACTOR, ActionType.AUTO_FIX]:
            return True
        
        # Style changes don't need functional testing
        if category == FeedbackCategory.STYLE:
            return False
        
        return True
    
    def _generate_title(self, description: str, category: FeedbackCategory) -> str:
        """Generate a concise title for the feedback"""
        # Extract first sentence or first 50 characters
        first_sentence = re.split(r'[.!?]', description)[0].strip()
        if len(first_sentence) > 50:
            title = first_sentence[:50] + "..."
        else:
            title = first_sentence
        
        return f"[{category.value.upper()}] {title}"
    
    def _generate_summary(self, parsed_items: List[ParsedFeedback]) -> FeedbackSummary:
        """Generate comprehensive summary of parsed feedback"""
        # Count by category
        by_category = {}
        for category in FeedbackCategory:
            by_category[category] = len([item for item in parsed_items if item.category == category])
        
        # Count by severity
        by_severity = {}
        for item in parsed_items:
            by_severity[item.severity] = by_severity.get(item.severity, 0) + 1
        
        # Count by action type
        by_action_type = {}
        for action_type in ActionType:
            by_action_type[action_type] = len([item for item in parsed_items if item.action_type == action_type])
        
        # Extract critical and auto-fixable items
        critical_issues = [item for item in parsed_items if item.severity in ["critical", "high"]]
        auto_fixable_items = [item for item in parsed_items if item.auto_fixable]
        manual_review_items = [item for item in parsed_items if item.action_type == ActionType.MANUAL_REVIEW]
        
        # Count patterns
        patterns_detected = {}
        for item in parsed_items:
            for pattern in item.patterns:
                patterns_detected[pattern] = patterns_detected.get(pattern, 0) + 1
        
        # Generate recommendations
        recommendations = self._generate_recommendations(parsed_items)
        
        return FeedbackSummary(
            total_items=len(parsed_items),
            by_category=by_category,
            by_severity=by_severity,
            by_action_type=by_action_type,
            critical_issues=critical_issues,
            auto_fixable_items=auto_fixable_items,
            manual_review_items=manual_review_items,
            patterns_detected=patterns_detected,
            recommendations=recommendations
        )
    
    def _generate_recommendations(self, parsed_items: List[ParsedFeedback]) -> List[str]:
        """Generate actionable recommendations based on parsed feedback"""
        recommendations = []
        
        # Security recommendations
        security_items = [item for item in parsed_items if item.category == FeedbackCategory.SECURITY]
        if security_items:
            recommendations.append(f"Address {len(security_items)} security issues immediately")
            if any(item.severity == "critical" for item in security_items):
                recommendations.append("Critical security vulnerabilities found - prioritize immediate fixes")
        
        # Auto-fix recommendations
        auto_fixable = [item for item in parsed_items if item.auto_fixable]
        if auto_fixable:
            recommendations.append(f"Apply {len(auto_fixable)} automatic fixes to improve code quality")
        
        # Performance recommendations
        performance_items = [item for item in parsed_items if item.category == FeedbackCategory.PERFORMANCE]
        if len(performance_items) > 3:
            recommendations.append("Multiple performance issues detected - consider performance audit")
        
        # Testing recommendations
        testing_items = [item for item in parsed_items if item.category == FeedbackCategory.TESTING]
        if testing_items:
            recommendations.append(f"Improve test coverage - {len(testing_items)} testing-related issues found")
        
        return recommendations
    
    def get_parsing_stats(self) -> Dict[str, Any]:
        """Get parsing statistics"""
        return {
            **self.parsing_stats,
            "success_rate": (
                self.parsing_stats["successful_parses"] / 
                max(self.parsing_stats["total_parsed"], 1)
            ),
            "timestamp": datetime.utcnow().isoformat()
        }