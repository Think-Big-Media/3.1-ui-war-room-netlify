#!/usr/bin/env python3
"""
Enhanced AMP Refactoring Specialist Runner
Applies specific optimizations to War Room components and services
"""

import asyncio
import sys
from pathlib import Path
from amp_refactoring_specialist import AMPRefactoringSpecialist

async def apply_react_memo_optimizations():
    """Apply React.memo to specific components that would benefit"""
    war_room_path = "/Users/rodericandrews/WarRoom_Development/1.0-war-room"
    amp_specialist = AMPRefactoringSpecialist(war_room_path)
    
    # High-priority components for React.memo
    memo_candidates = [
        "src/components/dashboard/MetricCard.tsx",
        "src/components/shared/Card.tsx", 
        "src/components/analytics/MetricCard.tsx",
        "src/components/shared/StatCard.tsx",
        "src/components/monitoring/MonitoringAlert.tsx",
        "src/components/analytics/DashboardChart.tsx"
    ]
    
    results = []
    
    for component_path in memo_candidates:
        file_path = Path(war_room_path) / component_path
        if file_path.exists():
            opportunity = {
                "type": "react_memo",
                "file_path": component_path,
                "description": f"High-reuse component {component_path} should use React.memo",
                "priority_score": 8,
                "estimated_impact": "High",
                "refactoring_suggestion": "Add React.memo wrapper to prevent unnecessary re-renders"
            }
            
            print(f"Applying React.memo to {component_path}...")
            result = await amp_specialist.apply_optimization(opportunity)
            results.append(result)
            
            if result["success"]:
                print(f"✅ Successfully applied React.memo to {component_path}")
            else:
                print(f"❌ Failed to apply React.memo to {component_path}")
    
    return results

async def apply_lazy_loading_to_pages():
    """Apply lazy loading to large page components"""
    war_room_path = "/Users/rodericandrews/WarRoom_Development/1.0-war-room"
    amp_specialist = AMPRefactoringSpecialist(war_room_path)
    
    # Page components that should be lazy loaded
    lazy_candidates = [
        "src/pages/AnalyticsDashboard.tsx",
        "src/pages/IntelligenceHub.tsx", 
        "src/pages/CampaignControl.tsx",
        "src/pages/RealTimeMonitoring.tsx",
        "src/pages/SettingsPage.tsx"
    ]
    
    results = []
    
    for page_path in lazy_candidates:
        file_path = Path(war_room_path) / page_path
        if file_path.exists():
            opportunity = {
                "type": "lazy_loading",
                "file_path": page_path,
                "description": f"Large page component {page_path} should be lazy loaded",
                "priority_score": 9,
                "estimated_impact": "High",
                "refactoring_suggestion": "Implement React.lazy for code splitting"
            }
            
            print(f"Creating lazy wrapper for {page_path}...")
            result = await amp_specialist.apply_optimization(opportunity)
            results.append(result)
            
            if result["success"]:
                print(f"✅ Successfully created lazy wrapper for {page_path}")
            else:
                print(f"❌ Failed to create lazy wrapper for {page_path}")
    
    return results

async def optimize_service_files():
    """Add caching to service files that make API calls"""
    war_room_path = "/Users/rodericandrews/WarRoom_Development/1.0-war-room"
    amp_specialist = AMPRefactoringSpecialist(war_room_path)
    
    # Service files that should have caching
    service_candidates = [
        "src/services/analyticsApi.ts",
        "src/services/googleAdsService.ts",
        "src/services/ghlService.ts",
        "src/services/informationService.ts"
    ]
    
    results = []
    
    for service_path in service_candidates:
        file_path = Path(war_room_path) / service_path
        if file_path.exists():
            opportunity = {
                "type": "add_caching",
                "file_path": service_path,
                "description": f"Service {service_path} makes API calls without caching",
                "priority_score": 7,
                "estimated_impact": "Medium",
                "refactoring_suggestion": "Add response caching for API calls"
            }
            
            print(f"Adding caching to {service_path}...")
            result = await amp_specialist.apply_optimization(opportunity)
            results.append(result)
            
            if result["success"]:
                print(f"✅ Successfully added caching to {service_path}")
            else:
                print(f"❌ Failed to add caching to {service_path}")
    
    return results

async def generate_optimization_report(all_results):
    """Generate comprehensive optimization report"""
    war_room_path = "/Users/rodericandrews/WarRoom_Development/1.0-war-room"
    amp_specialist = AMPRefactoringSpecialist(war_room_path)
    
    # Generate performance report
    performance_report = await amp_specialist.generate_performance_report()
    
    # Create PR-ready commit info
    commit_info = await amp_specialist.create_pr_ready_commit(all_results)
    
    print("\n" + "="*80)
    print("ENHANCED AMP REFACTORING SPECIALIST - OPTIMIZATION COMPLETE")
    print("="*80)
    
    successful_optimizations = [r for r in all_results if r.get("success")]
    failed_optimizations = [r for r in all_results if not r.get("success")]
    
    print(f"✅ Successful optimizations: {len(successful_optimizations)}")
    print(f"❌ Failed optimizations: {len(failed_optimizations)}")
    print(f"📊 Total files processed: {len(all_results)}")
    
    if successful_optimizations:
        print("\n🚀 Successfully Applied Optimizations:")
        for result in successful_optimizations:
            opp = result["opportunity"]
            print(f"  - {opp['type']}: {opp['file_path']} ({opp['estimated_impact']} impact)")
    
    if failed_optimizations:
        print("\n⚠️  Failed Optimizations (may need manual review):")
        for result in failed_optimizations:
            opp = result["opportunity"]
            print(f"  - {opp['type']}: {opp['file_path']}")
    
    print(f"\n📈 Performance report generated")
    print(f"🔧 PR commit info prepared")
    print("\n" + "="*80)
    
    return {
        "performance_report": performance_report,
        "commit_info": commit_info,
        "optimization_results": all_results
    }

async def main():
    """Main execution function for enhanced refactoring"""
    print("🤖 Enhanced AMP Refactoring Specialist Starting...")
    
    all_results = []
    
    # Step 1: Apply React.memo optimizations
    print("\n📦 Step 1: Applying React.memo optimizations...")
    memo_results = await apply_react_memo_optimizations()
    all_results.extend(memo_results)
    
    # Step 2: Apply lazy loading to pages
    print("\n⚡ Step 2: Applying lazy loading to page components...")
    lazy_results = await apply_lazy_loading_to_pages()
    all_results.extend(lazy_results)
    
    # Step 3: Optimize service files
    print("\n🔄 Step 3: Optimizing service files with caching...")
    service_results = await optimize_service_files()
    all_results.extend(service_results)
    
    # Step 4: Generate comprehensive report
    print("\n📊 Step 4: Generating optimization report...")
    final_report = await generate_optimization_report(all_results)
    
    print(f"\n🎯 Enhanced refactoring complete!")
    print(f"View detailed reports in: agents/data/amp_specialist/reports/")
    
    return final_report

if __name__ == "__main__":
    asyncio.run(main())