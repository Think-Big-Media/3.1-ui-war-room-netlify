"""
SUB-AGENT 5 - DOCUMENTATION_AGENT
Comprehensive documentation update and migration preparation agent for War Room platform.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pathlib import Path

class DocumentationAgent:
    """
    Documentation Agent for comprehensive documentation updates and maintenance.
    Handles all aspects of project documentation for deployment readiness.
    """
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.setup_logging()
        self.documentation_tasks = []
        self.validation_results = {}
        
    def setup_logging(self):
        """Initialize logging configuration."""
        log_dir = self.project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - DOCUMENTATION_AGENT - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / "documentation_agent.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def analyze_current_documentation(self) -> Dict[str, Any]:
        """
        Analyze existing documentation files and identify gaps.
        """
        self.logger.info("Starting documentation analysis...")
        
        documentation_files = {
            'README.md': self.project_root / 'README.md',
            'API_DOCS.md': self.project_root / 'API_DOCS.md', 
            'DEPLOYMENT_GUIDE.md': self.project_root / 'DEPLOYMENT_GUIDE.md',
            'ARCHITECTURE.md': self.project_root / 'ARCHITECTURE.md',
            'RENDER_DEPLOYMENT_GUIDE.md': self.project_root / 'RENDER_DEPLOYMENT_GUIDE.md'
        }
        
        analysis = {
            'existing_files': [],
            'missing_files': [],
            'outdated_files': [],
            'file_sizes': {},
            'last_modified': {}
        }
        
        for name, path in documentation_files.items():
            if path.exists():
                analysis['existing_files'].append(name)
                analysis['file_sizes'][name] = path.stat().st_size
                analysis['last_modified'][name] = datetime.fromtimestamp(
                    path.stat().st_mtime, tz=timezone.utc
                ).isoformat()
            else:
                analysis['missing_files'].append(name)
                
        return analysis
        
    def identify_api_endpoints(self) -> List[Dict[str, str]]:
        """
        Scan backend code to identify all API endpoints.
        """
        self.logger.info("Identifying API endpoints...")
        
        endpoints = []
        backend_path = self.project_root / "src" / "backend"
        
        if backend_path.exists():
            # Scan for FastAPI route definitions
            for py_file in backend_path.rglob("*.py"):
                try:
                    with open(py_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Look for FastAPI route decorators
                    import re
                    patterns = [
                        r'@router\.(get|post|put|delete|patch)\("([^"]+)"',
                        r'@app\.(get|post|put|delete|patch)\("([^"]+)"'
                    ]
                    
                    for pattern in patterns:
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            method = match.group(1).upper()
                            path = match.group(2)
                            endpoints.append({
                                'method': method,
                                'path': path,
                                'file': str(py_file.relative_to(self.project_root)),
                                'category': self._categorize_endpoint(path)
                            })
                            
                except Exception as e:
                    self.logger.warning(f"Error scanning {py_file}: {e}")
                    
        return sorted(endpoints, key=lambda x: (x['category'], x['path']))
        
    def _categorize_endpoint(self, path: str) -> str:
        """Categorize API endpoint by path."""
        if '/auth/' in path:
            return 'Authentication'
        elif '/analytics/' in path:
            return 'Analytics'
        elif '/monitoring/' in path:
            return 'Monitoring'
        elif '/campaign/' in path:
            return 'Campaign Management'
        elif '/admin/' in path:
            return 'Administration'
        elif '/websocket' in path or '/ws/' in path:
            return 'WebSocket'
        else:
            return 'General'
            
    def discover_environment_variables(self) -> Dict[str, Dict[str, str]]:
        """
        Discover environment variables used throughout the project.
        """
        self.logger.info("Discovering environment variables...")
        
        env_vars = {}
        
        # Common env files to check
        env_files = [
            '.env.example',
            '.env.local',
            'src/frontend/.env.example',
            'src/backend/.env.example'
        ]
        
        # Scan source code for environment variable usage
        for source_dir in ['src', 'scripts']:
            source_path = self.project_root / source_dir
            if source_path.exists():
                for file_path in source_path.rglob("*"):
                    if file_path.is_file() and file_path.suffix in ['.py', '.js', '.ts', '.tsx']:
                        self._scan_file_for_env_vars(file_path, env_vars)
                        
        return env_vars
        
    def _scan_file_for_env_vars(self, file_path: Path, env_vars: Dict):
        """Scan a file for environment variable usage."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            import re
            # Python: os.environ.get(), os.getenv()
            # JavaScript: process.env.
            patterns = [
                r'os\.environ\.get\([\'"]([^"\']+)[\'"]',
                r'os\.getenv\([\'"]([^"\']+)[\'"]',
                r'process\.env\.([A-Z_][A-Z0-9_]*)',
                r'REACT_APP_([A-Z_][A-Z0-9_]*)'
            ]
            
            for pattern in patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    var_name = match.group(1)
                    if var_name not in env_vars:
                        env_vars[var_name] = {
                            'files': [],
                            'category': self._categorize_env_var(var_name),
                            'description': ''
                        }
                    env_vars[var_name]['files'].append(str(file_path.relative_to(self.project_root)))
                    
        except Exception as e:
            self.logger.warning(f"Error scanning {file_path} for env vars: {e}")
            
    def _categorize_env_var(self, var_name: str) -> str:
        """Categorize environment variable by name."""
        if 'DATABASE' in var_name or 'DB_' in var_name:
            return 'Database'
        elif 'REDIS' in var_name:
            return 'Cache'
        elif 'SECRET' in var_name or 'KEY' in var_name:
            return 'Security'
        elif 'SUPABASE' in var_name:
            return 'Authentication'
        elif 'API' in var_name:
            return 'External APIs'
        elif 'REACT_APP' in var_name:
            return 'Frontend'
        elif 'RENDER' in var_name or 'VERCEL' in var_name:
            return 'Deployment'
        else:
            return 'General'
            
    def generate_documentation_plan(self) -> Dict[str, Any]:
        """
        Generate comprehensive documentation update plan.
        """
        self.logger.info("Generating documentation plan...")
        
        analysis = self.analyze_current_documentation()
        endpoints = self.identify_api_endpoints()
        env_vars = self.discover_environment_variables()
        
        plan = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'analysis': analysis,
            'endpoints_discovered': len(endpoints),
            'env_vars_discovered': len(env_vars),
            'documentation_tasks': [
                {
                    'task': 'Update README.md',
                    'priority': 'HIGH',
                    'estimated_time': '2 hours',
                    'dependencies': ['project_analysis', 'feature_inventory']
                },
                {
                    'task': 'Create comprehensive DEPLOYMENT.md',
                    'priority': 'HIGH', 
                    'estimated_time': '3 hours',
                    'dependencies': ['environment_analysis', 'render_requirements']
                },
                {
                    'task': 'Update API_DOCS.md',
                    'priority': 'HIGH',
                    'estimated_time': '4 hours',
                    'dependencies': ['endpoint_discovery', 'authentication_flow']
                },
                {
                    'task': 'Create ENVIRONMENT_VARIABLES.md',
                    'priority': 'MEDIUM',
                    'estimated_time': '2 hours',
                    'dependencies': ['env_var_discovery']
                },
                {
                    'task': 'Update ARCHITECTURE.md',
                    'priority': 'MEDIUM',
                    'estimated_time': '3 hours',
                    'dependencies': ['system_analysis', 'sub_agent_documentation']
                },
                {
                    'task': 'Create MIGRATION_CHECKLIST.md',
                    'priority': 'HIGH',
                    'estimated_time': '2 hours',
                    'dependencies': ['deployment_requirements']
                },
                {
                    'task': 'Create TROUBLESHOOTING.md',
                    'priority': 'MEDIUM',
                    'estimated_time': '3 hours',
                    'dependencies': ['issue_analysis', 'solution_research']
                }
            ],
            'validation_checklist': [
                'All internal links work correctly',
                'Code examples are syntactically correct',
                'Environment setup instructions are accurate',
                'Deployment steps are verified',
                'API examples return expected responses',
                'Troubleshooting solutions are tested'
            ]
        }
        
        return plan
        
    def validate_documentation_links(self) -> Dict[str, List[str]]:
        """
        Validate all internal documentation links.
        """
        self.logger.info("Validating documentation links...")
        
        validation_results = {
            'valid_links': [],
            'broken_links': [],
            'external_links': []
        }
        
        # Scan all markdown files for links
        for md_file in self.project_root.rglob("*.md"):
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                import re
                # Match markdown links [text](url)
                link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
                matches = re.finditer(link_pattern, content)
                
                for match in matches:
                    link_text = match.group(1)
                    link_url = match.group(2)
                    
                    if link_url.startswith('http'):
                        validation_results['external_links'].append({
                            'file': str(md_file.relative_to(self.project_root)),
                            'text': link_text,
                            'url': link_url
                        })
                    else:
                        # Internal link - check if file exists
                        if link_url.startswith('./') or link_url.startswith('../'):
                            target_path = (md_file.parent / link_url).resolve()
                        else:
                            target_path = self.project_root / link_url
                            
                        if target_path.exists():
                            validation_results['valid_links'].append({
                                'file': str(md_file.relative_to(self.project_root)),
                                'text': link_text,
                                'url': link_url
                            })
                        else:
                            validation_results['broken_links'].append({
                                'file': str(md_file.relative_to(self.project_root)),
                                'text': link_text,
                                'url': link_url,
                                'target': str(target_path)
                            })
                            
            except Exception as e:
                self.logger.warning(f"Error validating links in {md_file}: {e}")
                
        return validation_results
        
    def generate_report(self) -> str:
        """
        Generate comprehensive documentation agent report.
        """
        plan = self.generate_documentation_plan()
        link_validation = self.validate_documentation_links()
        
        report = f"""
# DOCUMENTATION_AGENT Report
Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}

## Executive Summary
The Documentation Agent has analyzed the War Room project and identified comprehensive documentation requirements for render.com deployment readiness.

## Current State Analysis
- **Existing Documentation Files**: {len(plan['analysis']['existing_files'])}
- **Missing Documentation Files**: {len(plan['analysis']['missing_files'])}
- **API Endpoints Discovered**: {plan['endpoints_discovered']}
- **Environment Variables Discovered**: {plan['env_vars_discovered']}

## Documentation Tasks
"""
        
        for task in plan['documentation_tasks']:
            report += f"""
### {task['task']}
- **Priority**: {task['priority']}
- **Estimated Time**: {task['estimated_time']}
- **Dependencies**: {', '.join(task['dependencies'])}
"""

        report += f"""
## Link Validation Results
- **Valid Internal Links**: {len(link_validation['valid_links'])}
- **Broken Internal Links**: {len(link_validation['broken_links'])}
- **External Links Found**: {len(link_validation['external_links'])}
"""

        if link_validation['broken_links']:
            report += "\n### Broken Links to Fix:\n"
            for link in link_validation['broken_links']:
                report += f"- {link['file']}: `{link['text']}` -> `{link['url']}`\n"

        report += """
## Next Steps
1. Begin with high-priority documentation updates
2. Focus on render.com deployment specifics
3. Create comprehensive API documentation
4. Implement validation checklist
5. Test all documentation for accuracy

## Agent Status
- **Status**: Active and Ready
- **Mission**: Complete documentation overhaul for deployment readiness
- **Target Platform**: render.com
"""
        
        return report
        
    def save_report(self, report: str) -> str:
        """Save the documentation report to file."""
        report_path = self.project_root / "DOCUMENTATION_AGENT_REPORT.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        self.logger.info(f"Documentation agent report saved to {report_path}")
        return str(report_path)

if __name__ == "__main__":
    # Initialize and run Documentation Agent
    agent = DocumentationAgent()
    report = agent.generate_report()
    report_path = agent.save_report(report)
    print(f"Documentation Agent Report generated: {report_path}")
    print(report)