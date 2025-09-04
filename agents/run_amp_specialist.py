#!/usr/bin/env python3
"""
AMP Refactoring Specialist - Main Orchestrator

This is the main entry point for running the complete AMP Refactoring Specialist system.
It orchestrates all components: performance analysis, refactoring, pattern storage, 
PR generation, and monitoring.

Usage:
    python run_amp_specialist.py [--mode=full|scan|optimize|report] [--dry-run] [--max-optimizations=N]
"""

import asyncio
import argparse
import logging
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any
import json

# Import all AMP Specialist components
from amp_refactoring_specialist import AMPRefactoringSpecialist
from performance_analyzer import ReactComponentAnalyzer, ServiceAnalyzer, PerformanceMeasurement
from refactoring_pipeline import RefactoringOrchestrator
from pattern_storage import PatternStorageManager
from pr_generator import PRGenerator
from monitoring_dashboard import MonitoringDashboard

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('amp_specialist.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class AMPSpecialistOrchestrator:
    """Main orchestrator for the AMP Refactoring Specialist system"""
    
    def __init__(self, war_room_path: str, dry_run: bool = False):
        self.war_room_path = Path(war_room_path)
        self.dry_run = dry_run
        
        # Initialize all components
        self.amp_specialist = AMPRefactoringSpecialist(war_room_path)
        self.refactoring_orchestrator = RefactoringOrchestrator(self.war_room_path)
        self.pattern_manager = PatternStorageManager(self.war_room_path)
        self.pr_generator = PRGenerator(self.war_room_path)
        self.monitoring_dashboard = MonitoringDashboard(self.war_room_path)
        
        # Performance analyzers
        self.component_analyzer = ReactComponentAnalyzer()
        self.service_analyzer = ServiceAnalyzer()
        
        logger.info(f"AMP Specialist Orchestrator initialized for: {war_room_path}")
        logger.info(f"Dry run mode: {'ENABLED' if dry_run else 'DISABLED'}")
    
    async def run_full_optimization_cycle(self, max_optimizations: int = 10) -> Dict[str, Any]:
        """Run the complete optimization cycle"""
        
        logger.info("="*80)
        logger.info("🚀 STARTING FULL AMP REFACTORING SPECIALIST CYCLE")
        logger.info("="*80)
        
        cycle_results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": "full_cycle",
            "dry_run": self.dry_run,
            "max_optimizations": max_optimizations,
            "phases": {}
        }
        
        try:
            # Phase 1: Initialize Performance Baseline
            logger.info("📊 Phase 1: Establishing Performance Baseline")
            baseline_results = await self._run_baseline_phase()
            cycle_results["phases"]["baseline"] = baseline_results
            
            # Phase 2: Scan for Optimization Opportunities
            logger.info("🔍 Phase 2: Scanning for Optimization Opportunities")
            scan_results = await self._run_scan_phase()
            cycle_results["phases"]["scan"] = scan_results
            
            # Phase 3: Apply Optimizations
            logger.info("⚡ Phase 3: Applying Optimizations")
            optimization_results = await self._run_optimization_phase(
                scan_results.get("opportunities", [])[:max_optimizations]
            )
            cycle_results["phases"]["optimization"] = optimization_results
            
            # Phase 4: Generate Performance Report
            logger.info("📈 Phase 4: Generating Performance Report")
            report_results = await self._run_report_phase()
            cycle_results["phases"]["report"] = report_results
            
            # Phase 5: Create PR (if not dry run and optimizations were successful)
            if not self.dry_run and optimization_results.get("successful_optimizations", 0) > 0:
                logger.info("🚀 Phase 5: Creating PR-Ready Commit")
                pr_results = await self._run_pr_phase(optimization_results, baseline_results, report_results)
                cycle_results["phases"]["pr"] = pr_results
            else:
                logger.info("⏭️  Phase 5: Skipped (dry run or no successful optimizations)")
                cycle_results["phases"]["pr"] = {"skipped": True, "reason": "dry_run or no_successful_optimizations"}
            
            # Phase 6: Update Monitoring Dashboard
            logger.info("📊 Phase 6: Updating Monitoring Dashboard")
            monitoring_results = await self._run_monitoring_phase(cycle_results)
            cycle_results["phases"]["monitoring"] = monitoring_results
            
            # Calculate overall success metrics
            cycle_results["summary"] = self._calculate_cycle_summary(cycle_results)
            
            logger.info("="*80)
            logger.info("✅ FULL AMP REFACTORING SPECIALIST CYCLE COMPLETED")
            self._log_cycle_summary(cycle_results["summary"])
            logger.info("="*80)
            
        except Exception as e:
            logger.error(f"❌ Error in optimization cycle: {e}")
            cycle_results["error"] = str(e)
            cycle_results["success"] = False
        
        return cycle_results
    
    async def run_scan_only(self) -> Dict[str, Any]:
        """Run only the scanning phase to identify opportunities"""
        logger.info("🔍 Running Scan-Only Mode")
        
        results = {
            "mode": "scan_only",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            # Establish baseline
            baseline = await self.amp_specialist.initialize_performance_baseline()
            results["baseline"] = {
                "components_analyzed": len(baseline.get("components", {})),
                "services_analyzed": len(baseline.get("services", {}))
            }
            
            # Scan for opportunities
            opportunities = await self.amp_specialist.scan_for_optimization_opportunities()
            results["opportunities"] = {
                "total_found": len(opportunities),
                "by_priority": self._group_by_priority(opportunities),
                "by_type": self._group_by_type(opportunities),
                "opportunities": opportunities[:20]  # Limit output
            }
            
            logger.info(f"✅ Scan completed: {len(opportunities)} opportunities found")
            
        except Exception as e:
            logger.error(f"❌ Error in scan: {e}")
            results["error"] = str(e)
        
        return results
    
    async def run_optimize_only(self, max_optimizations: int = 5) -> Dict[str, Any]:
        """Run optimization on existing opportunities"""
        logger.info(f"⚡ Running Optimize-Only Mode (max: {max_optimizations})")
        
        results = {
            "mode": "optimize_only",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "max_optimizations": max_optimizations
        }
        
        try:
            # Get opportunities
            opportunities = await self.amp_specialist.scan_for_optimization_opportunities()
            selected_opportunities = opportunities[:max_optimizations]
            
            # Apply optimizations
            optimization_results = await self.refactoring_orchestrator.run_refactoring_pipeline(selected_opportunities)
            
            # Store successful patterns
            pattern_results = await self._store_optimization_patterns(optimization_results)
            
            results["optimization_results"] = {
                "total_attempted": len(optimization_results),
                "successful": len([r for r in optimization_results if r.success]),
                "failed": len([r for r in optimization_results if not r.success]),
                "patterns_stored": pattern_results["patterns_stored"],
                "results": [self._serialize_refactoring_result(r) for r in optimization_results]
            }
            
            logger.info(f"✅ Optimization completed: {results['optimization_results']['successful']} successful")
            
        except Exception as e:
            logger.error(f"❌ Error in optimization: {e}")
            results["error"] = str(e)
        
        return results
    
    async def run_report_only(self) -> Dict[str, Any]:
        """Generate reports and dashboard only"""
        logger.info("📈 Running Report-Only Mode")
        
        results = {
            "mode": "report_only",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            # Generate performance report
            performance_report = await self.amp_specialist.generate_performance_report()
            
            # Generate pattern report
            pattern_report = await self.pattern_manager.generate_comprehensive_report()
            
            # Generate monitoring dashboard
            dashboard_path = await self.monitoring_dashboard.generate_dashboard()
            
            # Generate all monitoring reports
            report_paths = await self.monitoring_dashboard.generate_reports()
            
            results["reports"] = {
                "performance_report_generated": performance_report is not None,
                "pattern_report": {
                    "total_patterns": pattern_report.get("total_patterns", 0),
                    "by_type": pattern_report.get("by_type", {}),
                    "top_performing": pattern_report.get("top_performing_patterns", [])[:5]
                },
                "dashboard_path": dashboard_path,
                "monitoring_reports": report_paths
            }
            
            logger.info(f"✅ Reports generated: dashboard + {len(report_paths)} monitoring reports")
            
        except Exception as e:
            logger.error(f"❌ Error generating reports: {e}")
            results["error"] = str(e)
        
        return results
    
    # Phase implementation methods
    
    async def _run_baseline_phase(self) -> Dict[str, Any]:
        """Run the baseline performance measurement phase"""
        try:
            baseline = await self.amp_specialist.initialize_performance_baseline()
            
            return {
                "success": True,
                "components_analyzed": len(baseline.get("components", {})),
                "services_analyzed": len(baseline.get("services", {})),
                "bundle_analysis_success": baseline.get("bundle_analysis", {}).get("build_success", False),
                "timestamp": baseline.get("timestamp")
            }
        except Exception as e:
            logger.error(f"Baseline phase error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _run_scan_phase(self) -> Dict[str, Any]:
        """Run the opportunity scanning phase"""
        try:
            opportunities = await self.amp_specialist.scan_for_optimization_opportunities()
            
            return {
                "success": True,
                "total_opportunities": len(opportunities),
                "by_priority": self._group_by_priority(opportunities),
                "by_type": self._group_by_type(opportunities),
                "high_priority_count": len([o for o in opportunities if o.get("priority_score", 0) >= 8]),
                "opportunities": opportunities
            }
        except Exception as e:
            logger.error(f"Scan phase error: {e}")
            return {"success": False, "error": str(e), "opportunities": []}
    
    async def _run_optimization_phase(self, opportunities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run the optimization application phase"""
        try:
            if self.dry_run:
                logger.info(f"DRY RUN: Would apply {len(opportunities)} optimizations")
                return {
                    "success": True,
                    "dry_run": True,
                    "would_optimize": len(opportunities),
                    "optimizations": []
                }
            
            # Apply optimizations
            optimization_results = await self.refactoring_orchestrator.run_refactoring_pipeline(opportunities)
            
            # Store successful patterns
            pattern_results = await self._store_optimization_patterns(optimization_results)
            
            successful = [r for r in optimization_results if r.success]
            failed = [r for r in optimization_results if not r.success]
            
            return {
                "success": True,
                "total_optimizations": len(optimization_results),
                "successful_optimizations": len(successful),
                "failed_optimizations": len(failed),
                "success_rate": len(successful) / len(optimization_results) if optimization_results else 0,
                "patterns_stored": pattern_results.get("patterns_stored", 0),
                "optimizations": optimization_results,
                "files_modified": list(set(r.file_path for r in successful))
            }
        except Exception as e:
            logger.error(f"Optimization phase error: {e}")
            return {"success": False, "error": str(e), "optimizations": []}
    
    async def _run_report_phase(self) -> Dict[str, Any]:
        """Run the report generation phase"""
        try:
            # Generate performance report
            performance_report = await self.amp_specialist.generate_performance_report()
            
            # Get current metrics for comparison
            current_metrics = await self.amp_specialist._get_current_metrics()
            
            return {
                "success": True,
                "performance_report_generated": performance_report is not None,
                "current_metrics": {
                    "components_count": len(current_metrics.get("components", {})),
                    "services_count": len(current_metrics.get("services", {})),
                    "timestamp": current_metrics.get("timestamp")
                },
                "performance_report": performance_report
            }
        except Exception as e:
            logger.error(f"Report phase error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _run_pr_phase(self, optimization_results: Dict[str, Any], 
                           baseline_results: Dict[str, Any], 
                           report_results: Dict[str, Any]) -> Dict[str, Any]:
        """Run the PR generation phase"""
        try:
            optimizations = optimization_results.get("optimizations", [])
            successful_optimizations = [
                {"opportunity": {"type": r.refactoring_type, "file_path": r.file_path}, 
                 "success": r.success, "changes_made": r.changes_made, 
                 "performance_impact": r.performance_impact}
                for r in optimizations if r.success
            ]
            
            if not successful_optimizations:
                return {"success": False, "reason": "no_successful_optimizations"}
            
            # Create commit info
            commit_info = await self.pr_generator.create_pr_ready_commit(
                successful_optimizations,
                baseline_results,
                report_results.get("current_metrics", {})
            )
            
            # Generate PR info
            pr_info = await self.pr_generator.generate_pull_request_info(commit_info)
            
            # Execute git commit (if not dry run)
            commit_success = False
            if not self.dry_run:
                commit_success = await self.pr_generator.execute_git_commit(commit_info)
            
            return {
                "success": True,
                "commit_created": commit_success,
                "commit_hash": commit_info.commit_hash,
                "files_modified": len(commit_info.files_modified),
                "pr_title": pr_info.title,
                "branch_name": pr_info.branch_name,
                "risk_level": pr_info.risk_assessment.get("overall_risk", "Unknown")
            }
        except Exception as e:
            logger.error(f"PR phase error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _run_monitoring_phase(self, cycle_results: Dict[str, Any]) -> Dict[str, Any]:
        """Run the monitoring update phase"""
        try:
            # Record optimization results in monitoring
            if "optimization" in cycle_results["phases"]:
                optimization_phase = cycle_results["phases"]["optimization"]
                optimizations = optimization_phase.get("optimizations", [])
                
                for optimization in optimizations:
                    await self.monitoring_dashboard.record_optimization_result({
                        "opportunity": {"type": optimization.refactoring_type, "file_path": optimization.file_path},
                        "success": optimization.success,
                        "performance_impact": optimization.performance_impact,
                        "execution_time": 0.0  # Would be measured in real implementation
                    })
            
            # Generate reports
            report_paths = await self.monitoring_dashboard.generate_reports()
            
            # Get system status
            system_status = await self.monitoring_dashboard.get_system_status()
            
            return {
                "success": True,
                "reports_generated": len(report_paths),
                "system_status": system_status,
                "report_paths": report_paths
            }
        except Exception as e:
            logger.error(f"Monitoring phase error: {e}")
            return {"success": False, "error": str(e)}
    
    # Helper methods
    
    async def _store_optimization_patterns(self, optimization_results: List[Any]) -> Dict[str, Any]:
        """Store successful optimization patterns"""
        patterns_stored = 0
        
        for result in optimization_results:
            if result.success:
                try:
                    # Create mock performance delta for pattern storage
                    performance_delta = {
                        "components_improved": 1 if "component" in result.file_path else 0,
                        "services_improved": 1 if "service" in result.file_path else 0,
                        "overall_improvement": 10.0  # Mock improvement
                    }
                    
                    pattern_id = await self.pattern_manager.store_successful_optimization(
                        {
                            "before_code": result.before_code,
                            "after_code": result.after_code,
                            "changes_made": result.changes_made,
                            "performance_impact": result.performance_impact,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        },
                        {
                            "type": result.refactoring_type,
                            "file_path": result.file_path,
                            "description": f"Applied {result.refactoring_type} optimization"
                        },
                        performance_delta
                    )
                    
                    if pattern_id:
                        patterns_stored += 1
                        
                except Exception as e:
                    logger.warning(f"Failed to store pattern for {result.file_path}: {e}")
        
        return {"patterns_stored": patterns_stored}
    
    def _group_by_priority(self, opportunities: List[Dict[str, Any]]) -> Dict[str, int]:
        """Group opportunities by priority level"""
        priority_groups = {"high": 0, "medium": 0, "low": 0}
        
        for opp in opportunities:
            score = opp.get("priority_score", 0)
            if score >= 8:
                priority_groups["high"] += 1
            elif score >= 5:
                priority_groups["medium"] += 1
            else:
                priority_groups["low"] += 1
        
        return priority_groups
    
    def _group_by_type(self, opportunities: List[Dict[str, Any]]) -> Dict[str, int]:
        """Group opportunities by optimization type"""
        type_groups = {}
        
        for opp in opportunities:
            opt_type = opp.get("type", "unknown")
            type_groups[opt_type] = type_groups.get(opt_type, 0) + 1
        
        return type_groups
    
    def _serialize_refactoring_result(self, result) -> Dict[str, Any]:
        """Serialize refactoring result for JSON output"""
        return {
            "success": result.success,
            "file_path": result.file_path,
            "refactoring_type": result.refactoring_type,
            "changes_made": result.changes_made,
            "performance_impact": result.performance_impact,
            "warnings": result.warnings or [],
            "error_message": result.error_message
        }
    
    def _calculate_cycle_summary(self, cycle_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall cycle summary statistics"""
        summary = {
            "overall_success": True,
            "phases_completed": 0,
            "phases_failed": 0,
            "total_optimizations_attempted": 0,
            "total_optimizations_successful": 0,
            "files_modified": 0,
            "patterns_stored": 0,
            "reports_generated": 0
        }
        
        for phase_name, phase_result in cycle_results.get("phases", {}).items():
            if phase_result.get("success", False):
                summary["phases_completed"] += 1
            else:
                summary["phases_failed"] += 1
                summary["overall_success"] = False
        
        # Extract specific metrics
        if "optimization" in cycle_results.get("phases", {}):
            opt_phase = cycle_results["phases"]["optimization"]
            summary["total_optimizations_attempted"] = opt_phase.get("total_optimizations", 0)
            summary["total_optimizations_successful"] = opt_phase.get("successful_optimizations", 0)
            summary["files_modified"] = len(opt_phase.get("files_modified", []))
            summary["patterns_stored"] = opt_phase.get("patterns_stored", 0)
        
        if "monitoring" in cycle_results.get("phases", {}):
            monitor_phase = cycle_results["phases"]["monitoring"]
            summary["reports_generated"] = monitor_phase.get("reports_generated", 0)
        
        return summary
    
    def _log_cycle_summary(self, summary: Dict[str, Any]):
        """Log cycle summary in a formatted way"""
        logger.info("📋 CYCLE SUMMARY:")
        logger.info(f"   Overall Success: {'✅' if summary['overall_success'] else '❌'}")
        logger.info(f"   Phases Completed: {summary['phases_completed']}")
        logger.info(f"   Phases Failed: {summary['phases_failed']}")
        logger.info(f"   Optimizations Attempted: {summary['total_optimizations_attempted']}")
        logger.info(f"   Optimizations Successful: {summary['total_optimizations_successful']}")
        logger.info(f"   Files Modified: {summary['files_modified']}")
        logger.info(f"   Patterns Stored: {summary['patterns_stored']}")
        logger.info(f"   Reports Generated: {summary['reports_generated']}")

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="AMP Refactoring Specialist")
    parser.add_argument("--mode", choices=["full", "scan", "optimize", "report"], 
                       default="full", help="Operation mode")
    parser.add_argument("--dry-run", action="store_true", 
                       help="Run in dry mode (no actual changes)")
    parser.add_argument("--max-optimizations", type=int, default=10,
                       help="Maximum number of optimizations to apply")
    parser.add_argument("--war-room-path", default="/Users/rodericandrews/WarRoom_Development/1.0-war-room",
                       help="Path to War Room project")
    parser.add_argument("--output", help="Output file for results")
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    orchestrator = AMPSpecialistOrchestrator(args.war_room_path, args.dry_run)
    
    # Run selected mode
    if args.mode == "full":
        results = await orchestrator.run_full_optimization_cycle(args.max_optimizations)
    elif args.mode == "scan":
        results = await orchestrator.run_scan_only()
    elif args.mode == "optimize":
        results = await orchestrator.run_optimize_only(args.max_optimizations)
    elif args.mode == "report":
        results = await orchestrator.run_report_only()
    
    # Output results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        logger.info(f"Results saved to: {args.output}")
    else:
        print(json.dumps(results, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())