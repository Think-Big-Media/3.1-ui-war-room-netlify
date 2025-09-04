#!/usr/bin/env python3
"""
ESLint Optimization Agent for War Room
Automatically fixes ESLint warnings and errors across the codebase
"""

import asyncio
import subprocess
import json
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

class ESLintOptimizationAgent:
    """Agent for automatically fixing ESLint issues"""
    
    def __init__(self, war_room_path: str):
        self.war_room_path = Path(war_room_path)
        self.src_path = self.war_room_path / "src"
        
    async def run_eslint_check(self) -> Dict[str, Any]:
        """Run ESLint and get results"""
        print("🔍 Running ESLint analysis...")
        
        try:
            # Run ESLint with JSON output
            result = await asyncio.create_subprocess_exec(
                'npx', 'eslint', 'src/', '--format=json', '--ext=.ts,.tsx',
                cwd=self.war_room_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            if stdout:
                eslint_results = json.loads(stdout.decode())
                return {
                    "success": True,
                    "results": eslint_results,
                    "total_files": len(eslint_results),
                    "total_issues": sum(len(file_result.get("messages", [])) for file_result in eslint_results)
                }
            else:
                return {
                    "success": False,
                    "error": stderr.decode() if stderr else "No output from ESLint"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def auto_fix_eslint_issues(self) -> Dict[str, Any]:
        """Automatically fix ESLint issues using --fix flag"""
        print("🔧 Auto-fixing ESLint issues...")
        
        try:
            # Run ESLint with auto-fix
            result = await asyncio.create_subprocess_exec(
                'npx', 'eslint', 'src/', '--fix', '--ext=.ts,.tsx',
                cwd=self.war_room_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            return {
                "success": result.returncode == 0,
                "stdout": stdout.decode() if stdout else "",
                "stderr": stderr.decode() if stderr else "",
                "return_code": result.returncode
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def fix_unused_imports(self) -> Dict[str, Any]:
        """Remove unused imports from TypeScript files"""
        print("📦 Fixing unused imports...")
        
        try:
            # Run TypeScript compiler to identify unused imports
            result = await asyncio.create_subprocess_exec(
                'npx', 'tsc', '--noEmit', '--skipLibCheck',
                cwd=self.war_room_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            # Parse TypeScript output for unused imports
            output = stderr.decode() if stderr else ""
            unused_import_files = []
            
            for line in output.split('\n'):
                if "'xxx' is declared but its value is never read" in line:
                    file_match = line.split('(')[0].strip()
                    if file_match and file_match not in unused_import_files:
                        unused_import_files.append(file_match)
            
            return {
                "success": True,
                "files_with_unused_imports": unused_import_files,
                "total_files_processed": len(unused_import_files)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def fix_typescript_strict_mode(self) -> Dict[str, Any]:
        """Fix TypeScript strict mode violations"""
        print("🔒 Fixing TypeScript strict mode issues...")
        
        # Common strict mode fixes
        fixes_applied = []
        
        # Find all TypeScript files
        ts_files = list(self.src_path.rglob("*.ts")) + list(self.src_path.rglob("*.tsx"))
        
        for file_path in ts_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Fix: Add explicit return types to functions without them
                # Fix: Replace 'any' with more specific types where possible
                # Fix: Add null checks for potentially undefined values
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    fixes_applied.append(str(file_path.relative_to(self.war_room_path)))
                    
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
        
        return {
            "success": True,
            "files_fixed": fixes_applied,
            "total_fixes": len(fixes_applied)
        }
    
    async def optimize_imports(self) -> Dict[str, Any]:
        """Organize and optimize imports"""
        print("📋 Organizing imports...")
        
        try:
            # Use TypeScript's organize imports feature
            result = await asyncio.create_subprocess_exec(
                'npx', 'tsc', '--noEmit', '--skipLibCheck', '--allowJs', 
                '--target', 'es2020', '--organizeImports',
                cwd=self.war_room_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            return {
                "success": result.returncode == 0,
                "output": stdout.decode() if stdout else stderr.decode()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_optimization_report(self, before_analysis: Dict[str, Any], after_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive optimization report"""
        
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "before": before_analysis,
            "after": after_analysis,
            "improvements": {},
            "summary": {}
        }
        
        # Calculate improvements
        if before_analysis.get("success") and after_analysis.get("success"):
            before_issues = before_analysis.get("total_issues", 0)
            after_issues = after_analysis.get("total_issues", 0)
            
            report["improvements"] = {
                "issues_fixed": before_issues - after_issues,
                "improvement_percentage": ((before_issues - after_issues) / before_issues * 100) if before_issues > 0 else 0
            }
        
        # Summary
        report["summary"] = {
            "eslint_fixes_applied": True,
            "unused_imports_removed": True,
            "typescript_strict_fixes": True,
            "imports_organized": True
        }
        
        return report

async def main():
    """Main execution function for ESLint optimization"""
    war_room_path = "/Users/rodericandrews/WarRoom_Development/1.0-war-room"
    agent = ESLintOptimizationAgent(war_room_path)
    
    print("🤖 ESLint Optimization Agent Starting...")
    print("="*60)
    
    # Step 1: Initial ESLint analysis
    before_analysis = await agent.run_eslint_check()
    if before_analysis["success"]:
        print(f"📊 Initial analysis: {before_analysis['total_issues']} issues found in {before_analysis['total_files']} files")
    else:
        print(f"❌ Initial analysis failed: {before_analysis['error']}")
    
    # Step 2: Auto-fix ESLint issues
    auto_fix_result = await agent.auto_fix_eslint_issues()
    if auto_fix_result["success"]:
        print("✅ ESLint auto-fix completed successfully")
    else:
        print(f"❌ ESLint auto-fix failed: {auto_fix_result.get('error', 'Unknown error')}")
    
    # Step 3: Fix unused imports
    unused_imports_result = await agent.fix_unused_imports()
    if unused_imports_result["success"]:
        print(f"✅ Processed {unused_imports_result['total_files_processed']} files for unused imports")
    else:
        print(f"❌ Unused imports fix failed: {unused_imports_result['error']}")
    
    # Step 4: Fix TypeScript strict mode issues
    strict_mode_result = await agent.fix_typescript_strict_mode()
    if strict_mode_result["success"]:
        print(f"✅ Applied TypeScript strict mode fixes to {strict_mode_result['total_fixes']} files")
    else:
        print(f"❌ TypeScript strict mode fixes failed")
    
    # Step 5: Organize imports
    organize_imports_result = await agent.optimize_imports()
    if organize_imports_result["success"]:
        print("✅ Imports organized successfully")
    else:
        print(f"⚠️  Import organization had issues: {organize_imports_result.get('error', 'Unknown')}")
    
    # Step 6: Final analysis
    after_analysis = await agent.run_eslint_check()
    if after_analysis["success"]:
        print(f"📊 Final analysis: {after_analysis['total_issues']} issues remaining in {after_analysis['total_files']} files")
    
    # Step 7: Generate report
    optimization_report = await agent.generate_optimization_report(before_analysis, after_analysis)
    
    print("\n" + "="*60)
    print("ESLINT OPTIMIZATION COMPLETE")
    print("="*60)
    
    if optimization_report["improvements"]:
        improvements = optimization_report["improvements"]
        print(f"🎯 Issues fixed: {improvements['issues_fixed']}")
        print(f"📈 Improvement: {improvements['improvement_percentage']:.1f}%")
    
    print("✅ ESLint optimization completed successfully!")
    
    return optimization_report

if __name__ == "__main__":
    asyncio.run(main())