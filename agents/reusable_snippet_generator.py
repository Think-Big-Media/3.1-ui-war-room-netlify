"""Reusable Snippet Generation System

Advanced system for generating reusable code snippets from knowledge patterns,
with support for multiple languages, customization, and intelligent composition.
"""

import asyncio
import json
import logging
import re
import hashlib
from typing import Dict, List, Optional, Any, Tuple, Set, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timedelta
from pathlib import Path
import ast
import tokenize
import io
from jinja2 import Template, Environment, BaseLoader
import black
import isort

# Import knowledge manager components
from pieces_knowledge_manager import (
    KnowledgePattern, KnowledgeCategory, PatternPriority
)

logger = logging.getLogger(__name__)

class SnippetType(Enum):
    """Types of code snippets"""
    FUNCTION = "function"
    CLASS = "class"
    MODULE = "module"
    CONFIGURATION = "configuration"
    TEMPLATE = "template"
    UTILITY = "utility"
    PATTERN = "pattern"
    WORKFLOW = "workflow"

class LanguageSupport(Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    RUST = "rust"
    CPP = "cpp"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"

class SnippetComplexity(Enum):
    """Complexity levels for snippets"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    ADVANCED = "advanced"

@dataclass
class SnippetParameter:
    """Parameter for snippet customization"""
    name: str
    type: str
    description: str
    default_value: Optional[Any] = None
    required: bool = True
    validation_regex: Optional[str] = None
    allowed_values: Optional[List[Any]] = None

@dataclass
class SnippetMetadata:
    """Metadata for generated snippets"""
    id: str
    name: str
    description: str
    language: LanguageSupport
    snippet_type: SnippetType
    complexity: SnippetComplexity
    source_patterns: List[str]
    parameters: List[SnippetParameter]
    dependencies: List[str]
    tags: List[str]
    created_at: datetime
    version: str = "1.0"
    author: str = "War Room Knowledge Manager"
    license: str = "MIT"
    usage_examples: List[str] = field(default_factory=list)
    related_snippets: List[str] = field(default_factory=list)

@dataclass
class GeneratedSnippet:
    """Complete generated snippet with all components"""
    metadata: SnippetMetadata
    code: str
    documentation: str
    tests: Optional[str] = None
    examples: List[str] = field(default_factory=list)
    installation_instructions: Optional[str] = None
    customization_options: Dict[str, Any] = field(default_factory=dict)

@dataclass
class SnippetTemplate:
    """Template for snippet generation"""
    template_id: str
    name: str
    language: LanguageSupport
    template_code: str
    parameters: List[SnippetParameter]
    description: str
    category: str

class ReusableSnippetGenerator:
    """Advanced system for generating reusable code snippets"""
    
    def __init__(self, knowledge_manager, output_dir: str = "generated_snippets"):
        self.knowledge_manager = knowledge_manager
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Snippet storage
        self.generated_snippets: Dict[str, GeneratedSnippet] = {}
        self.snippet_templates: Dict[str, SnippetTemplate] = {}
        
        # Code analyzers and formatters
        self.code_analyzers = {
            LanguageSupport.PYTHON: self._analyze_python_code,
            LanguageSupport.JAVASCRIPT: self._analyze_javascript_code,
            LanguageSupport.TYPESCRIPT: self._analyze_typescript_code,
            LanguageSupport.JAVA: self._analyze_java_code
        }
        
        self.code_formatters = {
            LanguageSupport.PYTHON: self._format_python_code,
            LanguageSupport.JAVASCRIPT: self._format_javascript_code,
            LanguageSupport.TYPESCRIPT: self._format_typescript_code
        }
        
        # Template environment
        self.jinja_env = Environment(loader=BaseLoader())
        
        # Language-specific configurations
        self.language_configs = self._load_language_configurations()
        
        # Statistics
        self.stats = {
            "snippets_generated": 0,
            "patterns_combined": 0,
            "languages_supported": len(LanguageSupport),
            "successful_generations": 0,
            "failed_generations": 0,
            "avg_complexity_score": 0.0,
            "most_popular_language": None,
            "last_generation": None
        }
        
        # Initialize system
        self._initialize_snippet_generator()
    
    def _initialize_snippet_generator(self):
        """Initialize the snippet generation system"""
        logger.info("Initializing Reusable Snippet Generator...")
        
        # Create default templates
        self._create_default_templates()
        
        # Set up language-specific tools
        self._setup_language_tools()
        
        logger.info("Snippet generator initialized successfully")
    
    def _load_language_configurations(self) -> Dict[LanguageSupport, Dict[str, Any]]:
        """Load language-specific configurations"""
        return {
            LanguageSupport.PYTHON: {
                "file_extension": ".py",
                "comment_style": "#",
                "block_comment": ('"""', '"""'),
                "indent_style": "    ",
                "imports_separator": "\n\n",
                "class_method_separator": "\n\n    ",
                "function_separator": "\n\n",
                "standard_libraries": ["os", "sys", "json", "datetime", "pathlib", "typing"],
                "formatting_tools": ["black", "isort"],
                "linting_tools": ["pylint", "flake8"]
            },
            LanguageSupport.JAVASCRIPT: {
                "file_extension": ".js",
                "comment_style": "//",
                "block_comment": ('/*', '*/'),
                "indent_style": "  ",
                "imports_separator": "\n",
                "class_method_separator": "\n\n  ",
                "function_separator": "\n\n",
                "standard_libraries": ["fs", "path", "util", "events"],
                "formatting_tools": ["prettier"],
                "linting_tools": ["eslint"]
            },
            LanguageSupport.TYPESCRIPT: {
                "file_extension": ".ts",
                "comment_style": "//",
                "block_comment": ('/*', '*/'),
                "indent_style": "  ",
                "imports_separator": "\n",
                "class_method_separator": "\n\n  ",
                "function_separator": "\n\n",
                "standard_libraries": ["fs", "path", "util", "events"],
                "formatting_tools": ["prettier"],
                "linting_tools": ["eslint", "@typescript-eslint"]
            },
            LanguageSupport.JAVA: {
                "file_extension": ".java",
                "comment_style": "//",
                "block_comment": ('/*', '*/'),
                "indent_style": "    ",
                "imports_separator": "\n",
                "class_method_separator": "\n\n    ",
                "function_separator": "\n\n    ",
                "standard_libraries": ["java.util", "java.io", "java.time"],
                "formatting_tools": ["google-java-format"],
                "linting_tools": ["checkstyle", "spotbugs"]
            }
        }
    
    def _create_default_templates(self):
        """Create default snippet templates"""
        # Python function template
        python_function_template = SnippetTemplate(
            template_id="python_function",
            name="Python Function Template",
            language=LanguageSupport.PYTHON,
            template_code='''def {{ function_name }}({{ parameters }}):
    """{{ description }}
    
    Args:
        {% for param in parameter_docs %}
        {{ param.name }} ({{ param.type }}): {{ param.description }}
        {% endfor %}
    
    Returns:
        {{ return_type }}: {{ return_description }}
    """
    {{ function_body }}
    return {{ return_statement }}''',
            parameters=[
                SnippetParameter("function_name", "str", "Name of the function", required=True),
                SnippetParameter("parameters", "str", "Function parameters", default_value=""),
                SnippetParameter("description", "str", "Function description", required=True),
                SnippetParameter("return_type", "str", "Return type", default_value="Any"),
                SnippetParameter("return_description", "str", "Return value description", default_value="Result"),
                SnippetParameter("function_body", "str", "Function implementation", required=True),
                SnippetParameter("return_statement", "str", "Return statement", default_value="None")
            ],
            description="Template for generating Python functions",
            category="function"
        )
        self.snippet_templates["python_function"] = python_function_template
        
        # Python class template
        python_class_template = SnippetTemplate(
            template_id="python_class",
            name="Python Class Template",
            language=LanguageSupport.PYTHON,
            template_code='''class {{ class_name }}:
    """{{ class_description }}"""
    
    def __init__(self{{ init_parameters }}):
        """Initialize {{ class_name }}.
        
        Args:
            {% for param in init_param_docs %}
            {{ param.name }} ({{ param.type }}): {{ param.description }}
            {% endfor %}
        """
        {{ init_body }}
    
    {% for method in methods %}
    def {{ method.name }}(self{{ method.parameters }}):
        """{{ method.description }}"""
        {{ method.body }}
    {% endfor %}''',
            parameters=[
                SnippetParameter("class_name", "str", "Name of the class", required=True),
                SnippetParameter("class_description", "str", "Class description", required=True),
                SnippetParameter("init_parameters", "str", "Constructor parameters", default_value=""),
                SnippetParameter("init_body", "str", "Constructor implementation", required=True),
                SnippetParameter("methods", "list", "Class methods", default_value=[])
            ],
            description="Template for generating Python classes",
            category="class"
        )
        self.snippet_templates["python_class"] = python_class_template
        
        # JavaScript function template
        js_function_template = SnippetTemplate(
            template_id="javascript_function",
            name="JavaScript Function Template",
            language=LanguageSupport.JAVASCRIPT,
            template_code='''/**
 * {{ description }}
 * {% for param in parameter_docs %}
 * @param {{{ param.type }}} {{ param.name }} - {{ param.description }}
 * {% endfor %}
 * @returns {{{ return_type }}} {{ return_description }}
 */
function {{ function_name }}({{ parameters }}) {
    {{ function_body }}
    return {{ return_statement }};
}''',
            parameters=[
                SnippetParameter("function_name", "str", "Name of the function", required=True),
                SnippetParameter("parameters", "str", "Function parameters", default_value=""),
                SnippetParameter("description", "str", "Function description", required=True),
                SnippetParameter("return_type", "str", "Return type", default_value="any"),
                SnippetParameter("return_description", "str", "Return value description", default_value="Result"),
                SnippetParameter("function_body", "str", "Function implementation", required=True),
                SnippetParameter("return_statement", "str", "Return statement", default_value="null")
            ],
            description="Template for generating JavaScript functions",
            category="function"
        )
        self.snippet_templates["javascript_function"] = js_function_template
        
        logger.info(f"Created {len(self.snippet_templates)} default templates")
    
    def _setup_language_tools(self):
        """Setup language-specific formatting and analysis tools"""
        try:
            # Python tools
            try:
                import black
                import isort
                logger.info("Python formatting tools available: black, isort")
            except ImportError:
                logger.warning("Python formatting tools not available")
            
            # Additional language tools can be set up here
            logger.info("Language tools setup completed")
            
        except Exception as e:
            logger.error(f"Language tools setup failed: {e}")
    
    async def generate_snippet_from_patterns(self, 
                                           pattern_ids: List[str],
                                           target_language: LanguageSupport,
                                           snippet_type: SnippetType,
                                           customization: Dict[str, Any] = None) -> Optional[GeneratedSnippet]:
        """Generate a reusable snippet from multiple patterns"""
        try:
            logger.info(f"Generating {snippet_type.value} snippet for {target_language.value} from {len(pattern_ids)} patterns")
            
            customization = customization or {}
            
            # Validate patterns
            patterns = await self._validate_and_fetch_patterns(pattern_ids)
            if not patterns:
                logger.error("No valid patterns found")
                return None
            
            # Analyze patterns for combination
            analysis_result = await self._analyze_patterns_for_combination(patterns, target_language, snippet_type)
            if not analysis_result["compatible"]:
                logger.error(f"Patterns not compatible: {analysis_result['reason']}")
                return None
            
            # Generate snippet metadata
            metadata = await self._generate_snippet_metadata(patterns, target_language, snippet_type, customization)
            
            # Extract and combine code
            combined_code = await self._extract_and_combine_code(patterns, target_language, snippet_type, customization)
            
            # Format code
            formatted_code = await self._format_code(combined_code, target_language)
            
            # Generate documentation
            documentation = await self._generate_snippet_documentation(metadata, patterns, formatted_code)
            
            # Generate tests
            tests = await self._generate_snippet_tests(metadata, formatted_code, target_language)
            
            # Generate examples
            examples = await self._generate_usage_examples(metadata, formatted_code, target_language)
            
            # Create final snippet
            snippet = GeneratedSnippet(
                metadata=metadata,
                code=formatted_code,
                documentation=documentation,
                tests=tests,
                examples=examples,
                customization_options=customization
            )
            
            # Save snippet
            await self._save_snippet(snippet)
            
            # Store in cache
            self.generated_snippets[metadata.id] = snippet
            
            # Update statistics
            self.stats["snippets_generated"] += 1
            self.stats["patterns_combined"] += len(patterns)
            self.stats["successful_generations"] += 1
            self.stats["last_generation"] = datetime.utcnow().isoformat()
            
            logger.info(f"Successfully generated snippet: {metadata.id}")
            return snippet
            
        except Exception as e:
            logger.error(f"Snippet generation failed: {e}")
            self.stats["failed_generations"] += 1
            return None
    
    async def generate_snippet_from_template(self,
                                           template_id: str,
                                           parameters: Dict[str, Any],
                                           customization: Dict[str, Any] = None) -> Optional[GeneratedSnippet]:
        """Generate a snippet from a predefined template"""
        try:
            template = self.snippet_templates.get(template_id)
            if not template:
                logger.error(f"Template not found: {template_id}")
                return None
            
            # Validate parameters
            validation_result = self._validate_template_parameters(template, parameters)
            if not validation_result["valid"]:
                logger.error(f"Parameter validation failed: {validation_result['errors']}")
                return None
            
            # Render template
            rendered_code = await self._render_template(template, parameters)
            
            # Format code
            formatted_code = await self._format_code(rendered_code, template.language)
            
            # Generate metadata
            metadata = SnippetMetadata(
                id=self._generate_snippet_id(template.name, parameters),
                name=parameters.get("snippet_name", template.name),
                description=parameters.get("description", template.description),
                language=template.language,
                snippet_type=SnippetType.TEMPLATE,
                complexity=SnippetComplexity.SIMPLE,
                source_patterns=[],
                parameters=template.parameters,
                dependencies=[],
                tags=parameters.get("tags", []),
                created_at=datetime.utcnow()
            )
            
            # Generate documentation
            documentation = await self._generate_template_documentation(template, parameters, formatted_code)
            
            # Create snippet
            snippet = GeneratedSnippet(
                metadata=metadata,
                code=formatted_code,
                documentation=documentation,
                customization_options=customization or {}
            )
            
            # Save snippet
            await self._save_snippet(snippet)
            
            # Store in cache
            self.generated_snippets[metadata.id] = snippet
            
            self.stats["snippets_generated"] += 1
            self.stats["successful_generations"] += 1
            
            logger.info(f"Successfully generated snippet from template: {template_id}")
            return snippet
            
        except Exception as e:
            logger.error(f"Template-based snippet generation failed: {e}")
            self.stats["failed_generations"] += 1
            return None
    
    async def create_snippet_collection(self,
                                      collection_name: str,
                                      pattern_groups: List[Dict[str, Any]],
                                      target_language: LanguageSupport) -> Dict[str, Any]:
        """Create a collection of related snippets"""
        try:
            logger.info(f"Creating snippet collection: {collection_name}")
            
            collection_snippets = []
            collection_metadata = {
                "collection_id": self._generate_collection_id(collection_name),
                "name": collection_name,
                "language": target_language.value,
                "created_at": datetime.utcnow().isoformat(),
                "snippets": []
            }
            
            for i, group in enumerate(pattern_groups):
                snippet_name = group.get("name", f"Snippet_{i+1}")
                pattern_ids = group.get("pattern_ids", [])
                snippet_type = SnippetType(group.get("type", "utility"))
                customization = group.get("customization", {})
                
                snippet = await self.generate_snippet_from_patterns(
                    pattern_ids, target_language, snippet_type, customization
                )
                
                if snippet:
                    collection_snippets.append(snippet)
                    collection_metadata["snippets"].append({
                        "snippet_id": snippet.metadata.id,
                        "name": snippet.metadata.name,
                        "type": snippet.metadata.snippet_type.value
                    })
            
            # Save collection metadata
            collection_path = self.output_dir / f"{collection_name}_collection.json"
            with open(collection_path, 'w') as f:
                json.dump(collection_metadata, f, indent=2, default=str)
            
            logger.info(f"Created collection with {len(collection_snippets)} snippets")
            
            return {
                "collection_id": collection_metadata["collection_id"],
                "snippets_created": len(collection_snippets),
                "collection_path": str(collection_path),
                "snippets": [snippet.metadata.id for snippet in collection_snippets]
            }
            
        except Exception as e:
            logger.error(f"Collection creation failed: {e}")
            return {"error": str(e)}
    
    # Pattern analysis and validation methods
    
    async def _validate_and_fetch_patterns(self, pattern_ids: List[str]) -> List['KnowledgePattern']:
        """Validate pattern IDs and fetch patterns"""
        valid_patterns = []
        
        for pattern_id in pattern_ids:
            pattern = self.knowledge_manager.knowledge_patterns.get(pattern_id)
            if pattern:
                valid_patterns.append(pattern)
            else:
                logger.warning(f"Pattern not found: {pattern_id}")
        
        return valid_patterns
    
    async def _analyze_patterns_for_combination(self, 
                                              patterns: List['KnowledgePattern'],
                                              target_language: LanguageSupport,
                                              snippet_type: SnippetType) -> Dict[str, Any]:
        """Analyze patterns to determine if they can be combined"""
        try:
            analysis = {
                "compatible": True,
                "reason": "",
                "conflicts": [],
                "complementary": [],
                "language_match": 0,
                "complexity_score": 0.0
            }
            
            # Check language compatibility
            language_matches = 0
            for pattern in patterns:
                if pattern.language and pattern.language.lower() == target_language.value:
                    language_matches += 1
            
            analysis["language_match"] = language_matches / len(patterns) if patterns else 0
            
            # Check for conflicts
            categories = [pattern.category for pattern in patterns]
            if len(set(categories)) > 3:
                analysis["conflicts"].append("Too many different categories")
            
            # Check complementary patterns
            security_patterns = sum(1 for p in patterns if 'security' in p.tags)
            performance_patterns = sum(1 for p in patterns if 'performance' in p.tags)
            
            if security_patterns > 0 and performance_patterns > 0:
                analysis["complementary"].append("Security and performance patterns complement each other")
            
            # Calculate complexity
            complexity_scores = []
            for pattern in patterns:
                content_length = len(pattern.content)
                if content_length < 500:
                    complexity_scores.append(1)
                elif content_length < 1500:
                    complexity_scores.append(2)
                else:
                    complexity_scores.append(3)
            
            analysis["complexity_score"] = sum(complexity_scores) / len(complexity_scores) if complexity_scores else 0
            
            # Determine compatibility
            if analysis["language_match"] < 0.5 and target_language != LanguageSupport.PYTHON:
                analysis["compatible"] = False
                analysis["reason"] = "Insufficient language compatibility"
            
            if len(analysis["conflicts"]) > 2:
                analysis["compatible"] = False
                analysis["reason"] = "Too many conflicts between patterns"
            
            return analysis
            
        except Exception as e:
            logger.error(f"Pattern combination analysis failed: {e}")
            return {"compatible": False, "reason": f"Analysis failed: {e}"}
    
    async def _generate_snippet_metadata(self,
                                       patterns: List['KnowledgePattern'],
                                       target_language: LanguageSupport,
                                       snippet_type: SnippetType,
                                       customization: Dict[str, Any]) -> SnippetMetadata:
        """Generate metadata for the snippet"""
        try:
            # Generate snippet ID
            pattern_ids_hash = hashlib.md5('_'.join([p.id for p in patterns]).encode()).hexdigest()[:8]
            snippet_id = f"{target_language.value}_{snippet_type.value}_{pattern_ids_hash}"
            
            # Generate name
            snippet_name = customization.get("name")
            if not snippet_name:
                primary_pattern = patterns[0] if patterns else None
                snippet_name = f"{target_language.value.title()} {snippet_type.value.title()}"
                if primary_pattern:
                    snippet_name += f" - {primary_pattern.name[:30]}..."
            
            # Generate description
            description = customization.get("description")
            if not description:
                categories = list(set(p.category.value for p in patterns))
                description = f"Generated snippet combining {len(patterns)} patterns from {', '.join(categories)} categories"
            
            # Determine complexity
            avg_confidence = sum(p.confidence_score for p in patterns) / len(patterns) if patterns else 0
            content_lengths = [len(p.content) for p in patterns]
            avg_content_length = sum(content_lengths) / len(content_lengths) if content_lengths else 0
            
            if avg_content_length < 300:
                complexity = SnippetComplexity.SIMPLE
            elif avg_content_length < 800:
                complexity = SnippetComplexity.MODERATE
            elif avg_content_length < 1500:
                complexity = SnippetComplexity.COMPLEX
            else:
                complexity = SnippetComplexity.ADVANCED
            
            # Extract dependencies
            dependencies = []
            for pattern in patterns:
                # Extract imports from pattern content
                pattern_deps = self._extract_dependencies(pattern.content, target_language)
                dependencies.extend(pattern_deps)
            
            dependencies = list(set(dependencies))  # Remove duplicates
            
            # Generate tags
            tags = customization.get("tags", [])
            for pattern in patterns:
                tags.extend(pattern.tags)
            
            tags.extend([
                snippet_type.value,
                target_language.value,
                "generated",
                "reusable"
            ])
            
            tags = list(set(tags))  # Remove duplicates
            
            # Generate parameters (if applicable)
            parameters = self._extract_parameters_from_patterns(patterns, customization)
            
            metadata = SnippetMetadata(
                id=snippet_id,
                name=snippet_name,
                description=description,
                language=target_language,
                snippet_type=snippet_type,
                complexity=complexity,
                source_patterns=[p.id for p in patterns],
                parameters=parameters,
                dependencies=dependencies,
                tags=tags,
                created_at=datetime.utcnow(),
                version="1.0",
                author=customization.get("author", "War Room Knowledge Manager")
            )
            
            return metadata
            
        except Exception as e:
            logger.error(f"Metadata generation failed: {e}")
            raise
    
    def _extract_dependencies(self, content: str, language: LanguageSupport) -> List[str]:
        """Extract dependencies from code content"""
        dependencies = []
        
        try:
            if language == LanguageSupport.PYTHON:
                # Extract Python imports
                import_patterns = [
                    r'import\s+(\w+(?:\.\w+)*)',
                    r'from\s+(\w+(?:\.\w+)*)\s+import',
                    r'import\s+(\w+(?:\.\w+)*)\s+as\s+\w+'
                ]
                
                for pattern in import_patterns:
                    matches = re.findall(pattern, content)
                    dependencies.extend(matches)
            
            elif language in [LanguageSupport.JAVASCRIPT, LanguageSupport.TYPESCRIPT]:
                # Extract JavaScript/TypeScript imports
                import_patterns = [
                    r'import.*from\s+[\'"]([^\'"]+)[\'"]',
                    r'require\([\'"]([^\'"]+)[\'"]\)',
                    r'import\([\'"]([^\'"]+)[\'"]\)'
                ]
                
                for pattern in import_patterns:
                    matches = re.findall(pattern, content)
                    dependencies.extend(matches)
            
            elif language == LanguageSupport.JAVA:
                # Extract Java imports
                import_pattern = r'import\s+([\w.]+);'
                matches = re.findall(import_pattern, content)
                dependencies.extend(matches)
            
            # Filter out standard library imports
            lang_config = self.language_configs.get(language, {})
            standard_libs = lang_config.get("standard_libraries", [])
            
            filtered_deps = []
            for dep in dependencies:
                if not any(dep.startswith(std_lib) for std_lib in standard_libs):
                    filtered_deps.append(dep)
            
            return list(set(filtered_deps))  # Remove duplicates
            
        except Exception as e:
            logger.warning(f"Dependency extraction failed: {e}")
            return []
    
    def _extract_parameters_from_patterns(self,
                                        patterns: List['KnowledgePattern'],
                                        customization: Dict[str, Any]) -> List[SnippetParameter]:
        """Extract customizable parameters from patterns"""
        parameters = []
        
        try:
            # Look for common customization points
            for pattern in patterns:
                content = pattern.content
                
                # Look for configuration values
                config_patterns = [
                    r'(\w+)\s*=\s*[\'"]([^\'"]+)[\'"]',  # String assignments
                    r'(\w+)\s*=\s*(\d+(?:\.\d+)?)',     # Numeric assignments
                    r'(\w+)\s*=\s*(True|False)',        # Boolean assignments
                ]
                
                for config_pattern in config_patterns:
                    matches = re.findall(config_pattern, content)
                    for var_name, default_value in matches:
                        if var_name.upper() == var_name or 'CONFIG' in var_name.upper():
                            # Looks like a configuration variable
                            param = SnippetParameter(
                                name=var_name.lower(),
                                type=self._infer_parameter_type(default_value),
                                description=f"Configuration parameter: {var_name}",
                                default_value=self._parse_parameter_value(default_value),
                                required=False
                            )
                            parameters.append(param)
            
            # Add custom parameters from customization
            custom_params = customization.get("parameters", [])
            for custom_param in custom_params:
                if isinstance(custom_param, dict):
                    param = SnippetParameter(
                        name=custom_param.get("name", ""),
                        type=custom_param.get("type", "str"),
                        description=custom_param.get("description", ""),
                        default_value=custom_param.get("default_value"),
                        required=custom_param.get("required", False)
                    )
                    parameters.append(param)
            
            # Remove duplicates based on parameter name
            unique_params = {}
            for param in parameters:
                if param.name not in unique_params:
                    unique_params[param.name] = param
            
            return list(unique_params.values())
            
        except Exception as e:
            logger.warning(f"Parameter extraction failed: {e}")
            return []
    
    def _infer_parameter_type(self, value: str) -> str:
        """Infer parameter type from value"""
        if value.lower() in ['true', 'false']:
            return 'bool'
        elif value.isdigit():
            return 'int'
        elif re.match(r'\d+\.\d+', value):
            return 'float'
        else:
            return 'str'
    
    def _parse_parameter_value(self, value: str) -> Any:
        """Parse parameter value to appropriate type"""
        if value.lower() == 'true':
            return True
        elif value.lower() == 'false':
            return False
        elif value.isdigit():
            return int(value)
        elif re.match(r'\d+\.\d+', value):
            return float(value)
        else:
            return value.strip('"\'')
    
    # Code extraction and combination methods
    
    async def _extract_and_combine_code(self,
                                      patterns: List['KnowledgePattern'],
                                      target_language: LanguageSupport,
                                      snippet_type: SnippetType,
                                      customization: Dict[str, Any]) -> str:
        """Extract and intelligently combine code from patterns"""
        try:
            code_sections = []
            
            # Extract code blocks from each pattern
            for pattern in patterns:
                extracted_code = self._extract_code_from_pattern(pattern, target_language)
                if extracted_code:
                    code_sections.append({
                        "pattern_id": pattern.id,
                        "pattern_name": pattern.name,
                        "code": extracted_code,
                        "category": pattern.category.value
                    })
            
            if not code_sections:
                logger.warning("No code sections extracted from patterns")
                return self._generate_placeholder_code(target_language, snippet_type)
            
            # Combine code sections intelligently
            combined_code = await self._intelligent_code_combination(
                code_sections, target_language, snippet_type, customization
            )
            
            return combined_code
            
        except Exception as e:
            logger.error(f"Code extraction and combination failed: {e}")
            return self._generate_placeholder_code(target_language, snippet_type)
    
    def _extract_code_from_pattern(self, pattern: 'KnowledgePattern', target_language: LanguageSupport) -> str:
        """Extract code blocks from pattern content"""
        try:
            content = pattern.content
            
            # Look for code blocks marked with language
            lang_code_pattern = rf'```{target_language.value}\n(.*?)```'
            matches = re.findall(lang_code_pattern, content, re.DOTALL)
            if matches:
                return '\n\n'.join(matches)
            
            # Look for generic code blocks
            generic_code_pattern = r'```(?:\w+)?\n(.*?)```'
            matches = re.findall(generic_code_pattern, content, re.DOTALL)
            if matches:
                return '\n\n'.join(matches)
            
            # Look for inline code
            inline_code_pattern = r'`([^`]+)`'
            inline_matches = re.findall(inline_code_pattern, content)
            if inline_matches:
                return '\n'.join(inline_matches)
            
            # If no code blocks found, try to extract code-like content
            lines = content.split('\n')
            code_lines = []
            
            for line in lines:
                stripped = line.strip()
                if (stripped and 
                    not stripped.startswith('#') and 
                    not stripped.startswith('//') and
                    any(keyword in stripped for keyword in ['def ', 'class ', 'function ', 'var ', 'let ', 'const '])):
                    code_lines.append(line)
            
            return '\n'.join(code_lines) if code_lines else ""
            
        except Exception as e:
            logger.warning(f"Code extraction failed for pattern {pattern.id}: {e}")
            return ""
    
    async def _intelligent_code_combination(self,
                                          code_sections: List[Dict[str, Any]],
                                          target_language: LanguageSupport,
                                          snippet_type: SnippetType,
                                          customization: Dict[str, Any]) -> str:
        """Intelligently combine code sections"""
        try:
            if not code_sections:
                return ""
            
            # Sort sections by category and complexity
            sorted_sections = sorted(code_sections, key=lambda x: self._get_category_priority(x["category"]))
            
            combined_parts = []
            lang_config = self.language_configs.get(target_language, {})
            
            # Add header comment
            header = self._generate_code_header(code_sections, target_language, customization)
            combined_parts.append(header)
            
            # Combine imports/dependencies first
            imports = self._combine_imports(sorted_sections, target_language)
            if imports:
                combined_parts.append(imports)
                combined_parts.append("")  # Empty line after imports
            
            # Add main code sections
            for i, section in enumerate(sorted_sections):
                code = section["code"].strip()
                if not code:
                    continue
                
                # Add section comment
                section_comment = self._generate_section_comment(section, target_language)
                combined_parts.append(section_comment)
                
                # Process and add code
                processed_code = self._process_code_section(code, target_language, snippet_type)
                combined_parts.append(processed_code)
                
                # Add separator between sections
                if i < len(sorted_sections) - 1:
                    combined_parts.append("")
                    combined_parts.append(lang_config.get("function_separator", "\n\n"))
            
            # Add footer if needed
            footer = self._generate_code_footer(target_language, snippet_type, customization)
            if footer:
                combined_parts.append("")
                combined_parts.append(footer)
            
            return '\n'.join(combined_parts)
            
        except Exception as e:
            logger.error(f"Intelligent code combination failed: {e}")
            return '\n'.join(section["code"] for section in code_sections)
    
    def _get_category_priority(self, category: str) -> int:
        """Get priority order for categories"""
        priority_map = {
            "security-patterns": 1,
            "coderabbit-fixes": 2,
            "performance-patterns": 3,
            "war-room-solutions": 4,
            "amp-optimizations": 5,
            "health-check-fixes": 6
        }
        return priority_map.get(category, 999)
    
    def _combine_imports(self, code_sections: List[Dict[str, Any]], target_language: LanguageSupport) -> str:
        """Combine and deduplicate imports from all sections"""
        try:
            all_imports = []
            
            for section in code_sections:
                code = section["code"]
                section_imports = self._extract_imports_from_code(code, target_language)
                all_imports.extend(section_imports)
            
            # Remove duplicates while preserving order
            unique_imports = []
            seen = set()
            for imp in all_imports:
                if imp not in seen:
                    unique_imports.append(imp)
                    seen.add(imp)
            
            if unique_imports:
                lang_config = self.language_configs.get(target_language, {})
                separator = lang_config.get("imports_separator", "\n")
                return separator.join(unique_imports)
            
            return ""
            
        except Exception as e:
            logger.warning(f"Import combination failed: {e}")
            return ""
    
    def _extract_imports_from_code(self, code: str, target_language: LanguageSupport) -> List[str]:
        """Extract import statements from code"""
        imports = []
        
        try:
            lines = code.split('\n')
            
            if target_language == LanguageSupport.PYTHON:
                for line in lines:
                    stripped = line.strip()
                    if stripped.startswith(('import ', 'from ')):
                        imports.append(stripped)
            
            elif target_language in [LanguageSupport.JAVASCRIPT, LanguageSupport.TYPESCRIPT]:
                for line in lines:
                    stripped = line.strip()
                    if (stripped.startswith('import ') or 
                        'require(' in stripped or 
                        stripped.startswith('const ') and 'require(' in stripped):
                        imports.append(stripped)
            
            elif target_language == LanguageSupport.JAVA:
                for line in lines:
                    stripped = line.strip()
                    if stripped.startswith('import '):
                        imports.append(stripped)
            
        except Exception as e:
            logger.warning(f"Import extraction failed: {e}")
        
        return imports
    
    def _generate_code_header(self, code_sections: List[Dict[str, Any]], 
                            target_language: LanguageSupport,
                            customization: Dict[str, Any]) -> str:
        """Generate header comment for combined code"""
        lang_config = self.language_configs.get(target_language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        header_lines = [
            f"{comment_style} Generated Reusable Snippet",
            f"{comment_style} Created by War Room Knowledge Manager",
            f"{comment_style} Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            f"{comment_style}",
            f"{comment_style} Combined from {len(code_sections)} patterns:"
        ]
        
        for section in code_sections:
            header_lines.append(f"{comment_style} - {section['pattern_name']} ({section['category']})")
        
        if customization.get("description"):
            header_lines.extend([
                f"{comment_style}",
                f"{comment_style} Description: {customization['description']}"
            ])
        
        header_lines.append(f"{comment_style}")
        
        return '\n'.join(header_lines)
    
    def _generate_section_comment(self, section: Dict[str, Any], target_language: LanguageSupport) -> str:
        """Generate comment for code section"""
        lang_config = self.language_configs.get(target_language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        return f"{comment_style} From pattern: {section['pattern_name']} ({section['category']})"
    
    def _process_code_section(self, code: str, target_language: LanguageSupport, snippet_type: SnippetType) -> str:
        """Process individual code section"""
        try:
            # Remove any existing import statements (they're handled separately)
            processed_lines = []
            lines = code.split('\n')
            
            for line in lines:
                stripped = line.strip()
                
                # Skip import lines
                if target_language == LanguageSupport.PYTHON:
                    if stripped.startswith(('import ', 'from ')):
                        continue
                elif target_language in [LanguageSupport.JAVASCRIPT, LanguageSupport.TYPESCRIPT]:
                    if (stripped.startswith('import ') or 
                        'require(' in stripped or
                        (stripped.startswith('const ') and 'require(' in stripped)):
                        continue
                elif target_language == LanguageSupport.JAVA:
                    if stripped.startswith('import '):
                        continue
                
                processed_lines.append(line)
            
            return '\n'.join(processed_lines)
            
        except Exception as e:
            logger.warning(f"Code section processing failed: {e}")
            return code
    
    def _generate_code_footer(self, target_language: LanguageSupport, 
                            snippet_type: SnippetType,
                            customization: Dict[str, Any]) -> str:
        """Generate footer for combined code"""
        # Only add footer for certain snippet types
        if snippet_type == SnippetType.MODULE:
            lang_config = self.language_configs.get(target_language, {})
            comment_style = lang_config.get("comment_style", "#")
            
            return f"{comment_style} End of generated snippet"
        
        return ""
    
    def _generate_placeholder_code(self, target_language: LanguageSupport, snippet_type: SnippetType) -> str:
        """Generate placeholder code when extraction fails"""
        lang_config = self.language_configs.get(target_language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        placeholder_templates = {
            LanguageSupport.PYTHON: {
                SnippetType.FUNCTION: '''def generated_function():
    """Generated function placeholder."""
    # TODO: Implement function logic
    pass''',
                SnippetType.CLASS: '''class GeneratedClass:
    """Generated class placeholder."""
    
    def __init__(self):
        # TODO: Initialize class
        pass''',
                SnippetType.UTILITY: '''# Utility functions placeholder
def utility_function():
    """Utility function placeholder."""
    # TODO: Implement utility logic
    pass'''
            },
            LanguageSupport.JAVASCRIPT: {
                SnippetType.FUNCTION: '''function generatedFunction() {
    // Generated function placeholder
    // TODO: Implement function logic
    return null;
}''',
                SnippetType.CLASS: '''class GeneratedClass {
    constructor() {
        // TODO: Initialize class
    }
}''',
                SnippetType.UTILITY: '''// Utility functions placeholder
function utilityFunction() {
    // TODO: Implement utility logic
    return null;
}'''
            }
        }
        
        return placeholder_templates.get(target_language, {}).get(snippet_type, 
            f"{comment_style} Generated placeholder code\n{comment_style} TODO: Implement functionality")
    
    # Code formatting methods
    
    async def _format_code(self, code: str, target_language: LanguageSupport) -> str:
        """Format code using language-specific formatters"""
        try:
            formatter = self.code_formatters.get(target_language)
            if formatter:
                return await formatter(code)
            else:
                # Basic formatting
                return self._basic_code_formatting(code, target_language)
                
        except Exception as e:
            logger.warning(f"Code formatting failed: {e}")
            return code
    
    async def _format_python_code(self, code: str) -> str:
        """Format Python code using black"""
        try:
            # Format with black
            formatted_code = black.format_str(code, mode=black.FileMode())
            
            # Sort imports with isort
            formatted_code = isort.code(formatted_code)
            
            return formatted_code
            
        except Exception as e:
            logger.warning(f"Python code formatting failed: {e}")
            return code
    
    async def _format_javascript_code(self, code: str) -> str:
        """Format JavaScript code"""
        try:
            # Basic JavaScript formatting (could be enhanced with prettier)
            return self._basic_code_formatting(code, LanguageSupport.JAVASCRIPT)
        except Exception as e:
            logger.warning(f"JavaScript code formatting failed: {e}")
            return code
    
    async def _format_typescript_code(self, code: str) -> str:
        """Format TypeScript code"""
        try:
            # Basic TypeScript formatting (could be enhanced with prettier)
            return self._basic_code_formatting(code, LanguageSupport.TYPESCRIPT)
        except Exception as e:
            logger.warning(f"TypeScript code formatting failed: {e}")
            return code
    
    def _basic_code_formatting(self, code: str, target_language: LanguageSupport) -> str:
        """Basic code formatting when advanced formatters are not available"""
        try:
            lang_config = self.language_configs.get(target_language, {})
            indent_style = lang_config.get("indent_style", "    ")
            
            # Normalize line endings
            normalized_code = code.replace('\r\n', '\n').replace('\r', '\n')
            
            # Basic indentation correction
            lines = normalized_code.split('\n')
            formatted_lines = []
            indent_level = 0
            
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    formatted_lines.append("")
                    continue
                
                # Adjust indent level for closing braces/brackets
                if target_language in [LanguageSupport.JAVASCRIPT, LanguageSupport.TYPESCRIPT, LanguageSupport.JAVA]:
                    if stripped.startswith('}'):
                        indent_level = max(0, indent_level - 1)
                
                # Apply indentation
                indented_line = (indent_style * indent_level) + stripped
                formatted_lines.append(indented_line)
                
                # Adjust indent level for opening braces/brackets
                if target_language in [LanguageSupport.JAVASCRIPT, LanguageSupport.TYPESCRIPT, LanguageSupport.JAVA]:
                    if stripped.endswith('{'):
                        indent_level += 1
                elif target_language == LanguageSupport.PYTHON:
                    if stripped.endswith(':'):
                        indent_level += 1
                    elif not stripped.startswith(' ') and indent_level > 0:
                        # Dedent when we reach a line at base level
                        if not any(stripped.startswith(keyword) for keyword in ['def ', 'class ', 'if ', 'for ', 'while ', 'try:', 'except', 'else:', 'elif']):
                            indent_level = 0
            
            return '\n'.join(formatted_lines)
            
        except Exception as e:
            logger.warning(f"Basic code formatting failed: {e}")
            return code
    
    # Code analysis methods
    
    async def _analyze_python_code(self, code: str) -> Dict[str, Any]:
        """Analyze Python code structure"""
        try:
            analysis = {
                "functions": [],
                "classes": [],
                "imports": [],
                "complexity": 1,
                "lines_of_code": len(code.split('\n'))
            }
            
            # Parse AST
            try:
                tree = ast.parse(code)
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        analysis["functions"].append(node.name)
                    elif isinstance(node, ast.ClassDef):
                        analysis["classes"].append(node.name)
                    elif isinstance(node, ast.Import):
                        for alias in node.names:
                            analysis["imports"].append(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            analysis["imports"].append(node.module)
            
            except SyntaxError:
                # Fallback to regex analysis
                analysis = self._regex_based_analysis(code, LanguageSupport.PYTHON)
            
            return analysis
            
        except Exception as e:
            logger.warning(f"Python code analysis failed: {e}")
            return {"complexity": 1, "lines_of_code": len(code.split('\n'))}
    
    async def _analyze_javascript_code(self, code: str) -> Dict[str, Any]:
        """Analyze JavaScript code structure"""
        try:
            return self._regex_based_analysis(code, LanguageSupport.JAVASCRIPT)
        except Exception as e:
            logger.warning(f"JavaScript code analysis failed: {e}")
            return {"complexity": 1, "lines_of_code": len(code.split('\n'))}
    
    async def _analyze_typescript_code(self, code: str) -> Dict[str, Any]:
        """Analyze TypeScript code structure"""
        try:
            return self._regex_based_analysis(code, LanguageSupport.TYPESCRIPT)
        except Exception as e:
            logger.warning(f"TypeScript code analysis failed: {e}")
            return {"complexity": 1, "lines_of_code": len(code.split('\n'))}
    
    async def _analyze_java_code(self, code: str) -> Dict[str, Any]:
        """Analyze Java code structure"""
        try:
            return self._regex_based_analysis(code, LanguageSupport.JAVA)
        except Exception as e:
            logger.warning(f"Java code analysis failed: {e}")
            return {"complexity": 1, "lines_of_code": len(code.split('\n'))}
    
    def _regex_based_analysis(self, code: str, language: LanguageSupport) -> Dict[str, Any]:
        """Fallback regex-based code analysis"""
        analysis = {
            "functions": [],
            "classes": [],
            "imports": [],
            "complexity": 1,
            "lines_of_code": len(code.split('\n'))
        }
        
        try:
            if language == LanguageSupport.PYTHON:
                # Python patterns
                functions = re.findall(r'def\s+(\w+)\s*\(', code)
                classes = re.findall(r'class\s+(\w+)(?:\s*\(.*\))?\s*:', code)
                imports = re.findall(r'import\s+(\w+)', code) + re.findall(r'from\s+(\w+)\s+import', code)
            
            elif language in [LanguageSupport.JAVASCRIPT, LanguageSupport.TYPESCRIPT]:
                # JavaScript/TypeScript patterns
                functions = re.findall(r'function\s+(\w+)\s*\(', code) + re.findall(r'(\w+)\s*=\s*function', code)
                classes = re.findall(r'class\s+(\w+)', code)
                imports = re.findall(r'import.*from\s+[\'"]([^\'"]+)[\'"]', code)
            
            elif language == LanguageSupport.JAVA:
                # Java patterns
                functions = re.findall(r'(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+(\w+)\s*\(', code)
                classes = re.findall(r'(?:public\s+)?class\s+(\w+)', code)
                imports = re.findall(r'import\s+([\w.]+);', code)
            
            analysis["functions"] = functions
            analysis["classes"] = classes
            analysis["imports"] = imports
            
            # Calculate basic complexity
            complexity_indicators = len(re.findall(r'\b(if|for|while|switch|try|catch)\b', code))
            analysis["complexity"] = max(1, complexity_indicators)
            
        except Exception as e:
            logger.warning(f"Regex-based analysis failed: {e}")
        
        return analysis
    
    # Documentation generation methods
    
    async def _generate_snippet_documentation(self, 
                                            metadata: SnippetMetadata,
                                            patterns: List['KnowledgePattern'],
                                            code: str) -> str:
        """Generate comprehensive documentation for the snippet"""
        try:
            doc_sections = []
            
            # Title and description
            doc_sections.append(f"# {metadata.name}")
            doc_sections.append("")
            doc_sections.append(metadata.description)
            doc_sections.append("")
            
            # Metadata information
            doc_sections.append("## Snippet Information")
            doc_sections.append("")
            doc_sections.append(f"- **Language**: {metadata.language.value}")
            doc_sections.append(f"- **Type**: {metadata.snippet_type.value}")
            doc_sections.append(f"- **Complexity**: {metadata.complexity.value}")
            doc_sections.append(f"- **Version**: {metadata.version}")
            doc_sections.append(f"- **Created**: {metadata.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            doc_sections.append("")
            
            # Source patterns
            if patterns:
                doc_sections.append("## Source Patterns")
                doc_sections.append("")
                for pattern in patterns:
                    doc_sections.append(f"- **{pattern.name}**: {pattern.description[:100]}...")
                    doc_sections.append(f"  - Category: {pattern.category.value}")
                    doc_sections.append(f"  - Confidence: {pattern.confidence_score:.2f}")
                doc_sections.append("")
            
            # Dependencies
            if metadata.dependencies:
                doc_sections.append("## Dependencies")
                doc_sections.append("")
                for dep in metadata.dependencies:
                    doc_sections.append(f"- `{dep}`")
                doc_sections.append("")
            
            # Parameters
            if metadata.parameters:
                doc_sections.append("## Parameters")
                doc_sections.append("")
                for param in metadata.parameters:
                    required_text = "**Required**" if param.required else "Optional"
                    default_text = f" (default: `{param.default_value}`)" if param.default_value is not None else ""
                    doc_sections.append(f"- **{param.name}** (`{param.type}`): {param.description} - {required_text}{default_text}")
                doc_sections.append("")
            
            # Usage example
            doc_sections.append("## Usage")
            doc_sections.append("")
            doc_sections.append("```" + metadata.language.value)
            doc_sections.append(code)
            doc_sections.append("```")
            doc_sections.append("")
            
            # Tags
            if metadata.tags:
                doc_sections.append("## Tags")
                doc_sections.append("")
                doc_sections.append(", ".join(f"`{tag}`" for tag in metadata.tags))
                doc_sections.append("")
            
            # Footer
            doc_sections.append("---")
            doc_sections.append("")
            doc_sections.append(f"Generated by War Room Knowledge Manager on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
            
            return "\n".join(doc_sections)
            
        except Exception as e:
            logger.error(f"Documentation generation failed: {e}")
            return f"# {metadata.name}\n\n{metadata.description}\n\nGenerated documentation failed to create."
    
    async def _generate_template_documentation(self,
                                             template: SnippetTemplate,
                                             parameters: Dict[str, Any],
                                             code: str) -> str:
        """Generate documentation for template-based snippet"""
        try:
            doc_sections = []
            
            doc_sections.append(f"# {template.name}")
            doc_sections.append("")
            doc_sections.append(template.description)
            doc_sections.append("")
            
            doc_sections.append("## Template Information")
            doc_sections.append("")
            doc_sections.append(f"- **Template ID**: {template.template_id}")
            doc_sections.append(f"- **Language**: {template.language.value}")
            doc_sections.append(f"- **Category**: {template.category}")
            doc_sections.append("")
            
            doc_sections.append("## Generated Code")
            doc_sections.append("")
            doc_sections.append("```" + template.language.value)
            doc_sections.append(code)
            doc_sections.append("```")
            doc_sections.append("")
            
            doc_sections.append("## Parameters Used")
            doc_sections.append("")
            for param_name, param_value in parameters.items():
                doc_sections.append(f"- **{param_name}**: `{param_value}`")
            doc_sections.append("")
            
            return "\n".join(doc_sections)
            
        except Exception as e:
            logger.error(f"Template documentation generation failed: {e}")
            return f"# {template.name}\n\n{template.description}"
    
    # Test generation methods
    
    async def _generate_snippet_tests(self,
                                     metadata: SnippetMetadata,
                                     code: str,
                                     target_language: LanguageSupport) -> Optional[str]:
        """Generate basic tests for the snippet"""
        try:
            if target_language == LanguageSupport.PYTHON:
                return self._generate_python_tests(metadata, code)
            elif target_language == LanguageSupport.JAVASCRIPT:
                return self._generate_javascript_tests(metadata, code)
            elif target_language == LanguageSupport.TYPESCRIPT:
                return self._generate_typescript_tests(metadata, code)
            else:
                return self._generate_generic_tests(metadata, code, target_language)
                
        except Exception as e:
            logger.warning(f"Test generation failed: {e}")
            return None
    
    def _generate_python_tests(self, metadata: SnippetMetadata, code: str) -> str:
        """Generate Python tests"""
        test_code = f'''import unittest
from unittest.mock import patch, MagicMock

# Import the generated snippet code
# {metadata.name}

class Test{metadata.name.replace(' ', '')}(unittest.TestCase):
    """Test cases for {metadata.name}"""
    
    def setUp(self):
        """Set up test fixtures"""
        pass
    
    def test_basic_functionality(self):
        """Test basic functionality"""
        # TODO: Implement basic functionality test
        self.assertTrue(True)  # Placeholder
    
    def test_edge_cases(self):
        """Test edge cases"""
        # TODO: Implement edge case tests
        self.assertTrue(True)  # Placeholder
    
    def tearDown(self):
        """Clean up after tests"""
        pass

if __name__ == '__main__':
    unittest.main()
'''
        return test_code
    
    def _generate_javascript_tests(self, metadata: SnippetMetadata, code: str) -> str:
        """Generate JavaScript tests"""
        test_code = f'''// Test file for {metadata.name}
// Generated by War Room Knowledge Manager

describe('{metadata.name}', () => {{
    
    beforeEach(() => {{
        // Set up test fixtures
    }});
    
    test('should perform basic functionality', () => {{
        // TODO: Implement basic functionality test
        expect(true).toBe(true); // Placeholder
    }});
    
    test('should handle edge cases', () => {{
        // TODO: Implement edge case tests
        expect(true).toBe(true); // Placeholder
    }});
    
    afterEach(() => {{
        // Clean up after tests
    }});
}});
'''
        return test_code
    
    def _generate_typescript_tests(self, metadata: SnippetMetadata, code: str) -> str:
        """Generate TypeScript tests"""
        return self._generate_javascript_tests(metadata, code)  # Similar structure
    
    def _generate_generic_tests(self, metadata: SnippetMetadata, code: str, language: LanguageSupport) -> str:
        """Generate generic test template"""
        lang_config = self.language_configs.get(language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        return f'''{comment_style} Test file for {metadata.name}
{comment_style} Generated by War Room Knowledge Manager
{comment_style} 
{comment_style} TODO: Implement tests for this {language.value} snippet
{comment_style} 
{comment_style} Test cases to consider:
{comment_style} 1. Basic functionality
{comment_style} 2. Edge cases
{comment_style} 3. Error handling
{comment_style} 4. Performance (if applicable)
'''
    
    # Example generation methods
    
    async def _generate_usage_examples(self,
                                      metadata: SnippetMetadata,
                                      code: str,
                                      target_language: LanguageSupport) -> List[str]:
        """Generate usage examples"""
        try:
            examples = []
            
            # Basic usage example
            basic_example = self._generate_basic_usage_example(metadata, code, target_language)
            if basic_example:
                examples.append(basic_example)
            
            # Advanced usage example
            if metadata.complexity in [SnippetComplexity.COMPLEX, SnippetComplexity.ADVANCED]:
                advanced_example = self._generate_advanced_usage_example(metadata, code, target_language)
                if advanced_example:
                    examples.append(advanced_example)
            
            # Parameter customization example
            if metadata.parameters:
                param_example = self._generate_parameter_usage_example(metadata, code, target_language)
                if param_example:
                    examples.append(param_example)
            
            return examples
            
        except Exception as e:
            logger.warning(f"Usage example generation failed: {e}")
            return []
    
    def _generate_basic_usage_example(self, metadata: SnippetMetadata, code: str, language: LanguageSupport) -> str:
        """Generate basic usage example"""
        lang_config = self.language_configs.get(language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        example_header = f"{comment_style} Basic usage example for {metadata.name}"
        
        if language == LanguageSupport.PYTHON:
            if metadata.snippet_type == SnippetType.FUNCTION:
                return f'''{example_header}

# Import the function
# from your_module import generated_function

# Basic usage
result = generated_function()
print(result)
'''
            elif metadata.snippet_type == SnippetType.CLASS:
                return f'''{example_header}

# Import the class
# from your_module import GeneratedClass

# Create instance
instance = GeneratedClass()

# Use the instance
# instance.method()
'''
        
        elif language == LanguageSupport.JAVASCRIPT:
            if metadata.snippet_type == SnippetType.FUNCTION:
                return f'''{example_header}

// Import the function
// const {{ generatedFunction }} = require('./your_module');

// Basic usage
const result = generatedFunction();
console.log(result);
'''
        
        return f"{example_header}\n// TODO: Add usage example"
    
    def _generate_advanced_usage_example(self, metadata: SnippetMetadata, code: str, language: LanguageSupport) -> str:
        """Generate advanced usage example"""
        lang_config = self.language_configs.get(language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        return f'''{comment_style} Advanced usage example for {metadata.name}
{comment_style} TODO: Implement advanced usage scenario
'''
    
    def _generate_parameter_usage_example(self, metadata: SnippetMetadata, code: str, language: LanguageSupport) -> str:
        """Generate parameter customization example"""
        lang_config = self.language_configs.get(language, {})
        comment_style = lang_config.get("comment_style", "#")
        
        example_lines = [f"{comment_style} Parameter customization example"]
        example_lines.append(f"{comment_style}")
        example_lines.append(f"{comment_style} Available parameters:")
        
        for param in metadata.parameters:
            default_text = f" (default: {param.default_value})" if param.default_value is not None else ""
            example_lines.append(f"{comment_style} - {param.name}: {param.description}{default_text}")
        
        return '\n'.join(example_lines)
    
    # Template rendering methods
    
    def _validate_template_parameters(self, template: SnippetTemplate, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate parameters against template requirements"""
        validation_result = {"valid": True, "errors": []}
        
        try:
            for param in template.parameters:
                if param.required and param.name not in parameters:
                    validation_result["valid"] = False
                    validation_result["errors"].append(f"Required parameter missing: {param.name}")
                
                if param.name in parameters:
                    value = parameters[param.name]
                    
                    # Type validation
                    if param.type == "int" and not isinstance(value, int):
                        try:
                            parameters[param.name] = int(value)
                        except (ValueError, TypeError):
                            validation_result["valid"] = False
                            validation_result["errors"].append(f"Parameter {param.name} must be an integer")
                    
                    elif param.type == "float" and not isinstance(value, (int, float)):
                        try:
                            parameters[param.name] = float(value)
                        except (ValueError, TypeError):
                            validation_result["valid"] = False
                            validation_result["errors"].append(f"Parameter {param.name} must be a number")
                    
                    elif param.type == "bool" and not isinstance(value, bool):
                        if isinstance(value, str):
                            parameters[param.name] = value.lower() in ['true', '1', 'yes', 'on']
                        else:
                            validation_result["valid"] = False
                            validation_result["errors"].append(f"Parameter {param.name} must be a boolean")
                    
                    # Allowed values validation
                    if param.allowed_values and value not in param.allowed_values:
                        validation_result["valid"] = False
                        validation_result["errors"].append(f"Parameter {param.name} must be one of: {param.allowed_values}")
                    
                    # Regex validation
                    if param.validation_regex and isinstance(value, str):
                        if not re.match(param.validation_regex, value):
                            validation_result["valid"] = False
                            validation_result["errors"].append(f"Parameter {param.name} does not match required pattern")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Parameter validation failed: {e}")
            return {"valid": False, "errors": [f"Validation error: {e}"]}
    
    async def _render_template(self, template: SnippetTemplate, parameters: Dict[str, Any]) -> str:
        """Render template with parameters"""
        try:
            # Add default values for missing optional parameters
            for param in template.parameters:
                if not param.required and param.name not in parameters and param.default_value is not None:
                    parameters[param.name] = param.default_value
            
            # Create Jinja template
            jinja_template = Template(template.template_code)
            
            # Render with parameters
            rendered_code = jinja_template.render(**parameters)
            
            return rendered_code
            
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            return f"// Template rendering failed: {e}"
    
    # Utility methods
    
    def _generate_snippet_id(self, base_name: str, parameters: Dict[str, Any]) -> str:
        """Generate unique snippet ID"""
        # Create a hash from parameters
        param_string = json.dumps(parameters, sort_keys=True, default=str)
        param_hash = hashlib.md5(param_string.encode()).hexdigest()[:8]
        
        # Clean base name
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', base_name.lower())
        
        return f"{clean_name}_{param_hash}"
    
    def _generate_collection_id(self, collection_name: str) -> str:
        """Generate unique collection ID"""
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', collection_name.lower())
        timestamp = int(datetime.utcnow().timestamp())
        return f"{clean_name}_{timestamp}"
    
    async def _save_snippet(self, snippet: GeneratedSnippet) -> str:
        """Save snippet to file system"""
        try:
            # Create snippet directory
            snippet_dir = self.output_dir / snippet.metadata.id
            snippet_dir.mkdir(exist_ok=True)
            
            # Save code file
            lang_config = self.language_configs.get(snippet.metadata.language, {})
            file_extension = lang_config.get("file_extension", ".txt")
            
            code_file = snippet_dir / f"snippet{file_extension}"
            with open(code_file, 'w') as f:
                f.write(snippet.code)
            
            # Save documentation
            doc_file = snippet_dir / "README.md"
            with open(doc_file, 'w') as f:
                f.write(snippet.documentation)
            
            # Save metadata
            metadata_file = snippet_dir / "metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(asdict(snippet.metadata), f, indent=2, default=str)
            
            # Save tests if available
            if snippet.tests:
                test_extension = "_test" + file_extension
                test_file = snippet_dir / f"test{test_extension}"
                with open(test_file, 'w') as f:
                    f.write(snippet.tests)
            
            # Save examples
            if snippet.examples:
                examples_file = snippet_dir / "examples.md"
                with open(examples_file, 'w') as f:
                    f.write("# Usage Examples\n\n")
                    for i, example in enumerate(snippet.examples, 1):
                        f.write(f"## Example {i}\n\n")
                        f.write(example)
                        f.write("\n\n")
            
            logger.info(f"Saved snippet to: {snippet_dir}")
            return str(snippet_dir)
            
        except Exception as e:
            logger.error(f"Snippet saving failed: {e}")
            return ""
    
    def get_generator_statistics(self) -> Dict[str, Any]:
        """Get snippet generator statistics"""
        # Calculate most popular language
        language_counts = Counter()
        for snippet in self.generated_snippets.values():
            language_counts[snippet.metadata.language.value] += 1
        
        most_popular = language_counts.most_common(1)
        most_popular_language = most_popular[0][0] if most_popular else None
        
        return {
            **self.stats,
            "most_popular_language": most_popular_language,
            "generated_snippets_cached": len(self.generated_snippets),
            "available_templates": len(self.snippet_templates),
            "supported_languages": [lang.value for lang in LanguageSupport],
            "output_directory": str(self.output_dir)
        }

# Export main classes
__all__ = [
    'ReusableSnippetGenerator',
    'SnippetType', 
    'LanguageSupport',
    'SnippetComplexity',
    'SnippetMetadata',
    'GeneratedSnippet'
]