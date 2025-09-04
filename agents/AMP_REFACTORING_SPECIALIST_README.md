# AMP Refactoring Specialist - SUB-AGENT 2

**Mission**: Continuously refactor and optimize War Room codebase using AMP suggestions  
**Target**: `src/components/` and `src/services/` directories

## Overview

The AMP Refactoring Specialist is a comprehensive automated system designed to continuously analyze, optimize, and improve the performance of React components and TypeScript services in the War Room codebase. It integrates sophisticated performance analysis, automated refactoring, pattern recognition, and comprehensive monitoring.

## 🚀 Key Features

### 1. **Performance Analysis & Baseline Measurement**
- Comprehensive React component performance metrics
- TypeScript service analysis and optimization scoring
- Bundle size impact assessment
- Baseline performance establishment for tracking improvements

### 2. **Automated Refactoring Pipeline**
- **React.memo** optimization for preventing unnecessary re-renders
- **useMemo** implementation for expensive calculations
- **useCallback** optimization for event handlers
- **Lazy loading** setup for large components
- **Service caching** implementation for API calls
- **Error handling** improvements
- **Throttling/debouncing** for event handlers
- **Bundle optimization** suggestions

### 3. **Pattern Storage & Retrieval**
- Integration with Pieces for storing successful optimization patterns
- Tagged with `amp-optimizations` for easy retrieval
- Pattern-based suggestions for similar code structures
- Success rate tracking and pattern effectiveness analysis

### 4. **PR Generation with Impact Analysis**
- Automated commit creation with detailed explanations
- Comprehensive before/after performance analysis
- Risk assessment and mitigation strategies
- Detailed test plans and review checklists
- Conventional commit messages with performance impact

### 5. **Monitoring & Reporting Dashboard**
- Real-time performance monitoring
- HTML dashboard with visualizations
- Daily and weekly optimization reports
- Success rate tracking and trend analysis
- System health monitoring

## 📁 System Architecture

```
agents/
├── amp_refactoring_specialist.py    # Main specialist orchestrator
├── performance_analyzer.py          # React & service performance analysis
├── refactoring_pipeline.py         # Automated refactoring implementations
├── pattern_storage.py              # Pieces integration & pattern management
├── pr_generator.py                 # PR creation with impact analysis
├── monitoring_dashboard.py         # Monitoring & reporting system
├── run_amp_specialist.py          # Main entry point & orchestrator
├── data/                           # Data storage directory
│   └── amp_specialist/
│       ├── patterns/               # Local pattern storage
│       ├── reports/               # Generated reports
│       ├── metrics/               # Performance metrics
│       └── monitoring.db          # SQLite monitoring database
└── README.md                      # This file
```

## 🔧 Installation & Setup

### Prerequisites

1. **Python 3.8+** with required packages:
```bash
pip install matplotlib pandas seaborn asyncio pathlib dataclasses sqlite3
```

2. **Node.js & npm** (for bundle analysis)

3. **Git** (for commit creation)

4. **Pieces** (optional, for pattern storage):
   - Install Pieces CLI or Desktop
   - Available at: https://pieces.app

### Setup Steps

1. **Verify War Room Structure**:
```bash
# Ensure these directories exist:
# - src/components/
# - src/services/
# - package.json
```

2. **Initialize Monitoring Database**:
```bash
python -c "from agents.monitoring_dashboard import MetricsDatabase; MetricsDatabase('agents/data/amp_specialist/monitoring.db')"
```

3. **Test Installation**:
```bash
cd /path/to/war-room
python agents/run_amp_specialist.py --mode=scan --dry-run
```

## 🎯 Usage Guide

### Command Line Interface

```bash
# Full optimization cycle
python agents/run_amp_specialist.py --mode=full --max-optimizations=10

# Scan only (identify opportunities)
python agents/run_amp_specialist.py --mode=scan

# Apply optimizations only
python agents/run_amp_specialist.py --mode=optimize --max-optimizations=5

# Generate reports only
python agents/run_amp_specialist.py --mode=report

# Dry run (no actual changes)
python agents/run_amp_specialist.py --mode=full --dry-run

# Save results to file
python agents/run_amp_specialist.py --mode=full --output=results.json
```

### Programmatic Usage

```python
from agents.amp_refactoring_specialist import AMPRefactoringSpecialist

# Initialize
specialist = AMPRefactoringSpecialist("/path/to/war-room")

# Establish baseline
baseline = await specialist.initialize_performance_baseline()

# Scan for opportunities
opportunities = await specialist.scan_for_optimization_opportunities()

# Apply optimizations
results = await specialist.apply_optimization(opportunities[0])
```

## 📊 Output Examples

### Scan Results
```json
{
  "opportunities": [
    {
      "type": "react_memo",
      "file_path": "src/components/Dashboard.tsx",
      "description": "Component could benefit from React.memo",
      "priority_score": 8,
      "estimated_impact": "High"
    },
    {
      "type": "use_memo",
      "file_path": "src/components/AnalyticsChart.tsx",
      "description": "Expensive calculations could be memoized",
      "priority_score": 9,
      "estimated_impact": "Very High"
    }
  ]
}
```

### Optimization Results
```json
{
  "successful_optimizations": 7,
  "failed_optimizations": 1,
  "success_rate": 0.875,
  "files_modified": [
    "src/components/Dashboard.tsx",
    "src/components/MetricCard.tsx",
    "src/services/analyticsApi.ts"
  ],
  "performance_improvements": {
    "overall_level": "High",
    "estimated_performance_gain": "30-50%"
  }
}
```

## 🔍 Optimization Types Supported

### React Component Optimizations

1. **React.memo**
   - Prevents unnecessary re-renders
   - Applied to components with props that don't change frequently
   - Estimated impact: 20-50% render performance improvement

2. **useMemo**
   - Memoizes expensive calculations
   - Applied to `.filter()`, `.map()`, `.reduce()`, sorting operations
   - Estimated impact: 30-70% calculation performance improvement

3. **useCallback**
   - Memoizes event handler functions
   - Applied to functions passed as props
   - Estimated impact: 10-30% re-render reduction

4. **Lazy Loading**
   - Code splitting for large components
   - Applied to components >150 lines
   - Estimated impact: 15-40% initial bundle size reduction

### Service Optimizations

1. **API Caching**
   - Implements response caching for API calls
   - Applied to `fetch()`, `axios` calls
   - Estimated impact: 60-90% response time improvement

2. **Error Handling**
   - Adds comprehensive try-catch blocks
   - Applied to risky operations
   - Estimated impact: +40-80% reliability improvement

3. **Throttling/Debouncing**
   - Limits high-frequency event handlers
   - Applied to scroll, input, resize events
   - Estimated impact: 50-80% event processing reduction

## 📈 Monitoring Dashboard

The system generates an HTML dashboard with:

- **Real-time metrics**: Success rates, optimization counts, performance trends
- **Visual charts**: Success rate over time, optimization type distribution
- **System health**: Component status, error tracking
- **Recent activity**: Latest optimizations and their results

Access via: `agents/data/amp_specialist/reports/performance_dashboard.html`

## 🎨 Pattern Storage Integration

### Pieces Integration

Successful optimization patterns are automatically stored in Pieces with:

- **Tags**: `amp-optimizations`, `amp-{type}`, `war-room`, `performance`
- **Metadata**: Performance impact, refactoring rules, success metrics
- **Code examples**: Before/after code snippets
- **Context**: File type, language, optimization rationale

### Pattern Retrieval

The system uses stored patterns to:
- Suggest optimizations for similar code structures
- Learn from successful optimization history
- Improve recommendation accuracy over time
- Share patterns across development team

## ⚙️ Configuration Options

### Environment Variables

```bash
# Pieces integration
export PIECES_CLI_PATH="/path/to/pieces"
export PIECES_API_URL="http://localhost:1000"

# Performance thresholds
export AMP_SUCCESS_THRESHOLD=0.7
export AMP_MAX_OPTIMIZATIONS=10
export AMP_PRIORITY_THRESHOLD=5

# Monitoring settings
export AMP_MONITORING_INTERVAL=300  # 5 minutes
export AMP_REPORT_RETENTION_DAYS=30
```

## 🧪 Testing & Validation

### Automated Testing

The system includes built-in validation:

- **Syntax validation**: Ensures refactored code maintains valid syntax
- **Performance impact calculation**: Measures actual improvements
- **Success rate tracking**: Monitors optimization effectiveness
- **Rollback capability**: Git integration for safe changes

### Manual Testing Checklist

Before deploying optimizations:

- [ ] Run existing test suite
- [ ] Verify no functional regressions
- [ ] Check React DevTools Profiler for improvements
- [ ] Validate bundle size changes
- [ ] Test error scenarios
- [ ] Review performance metrics

## 🚨 Risk Management

### Risk Assessment

Each optimization includes:
- **Risk level**: Low/Medium/High based on change complexity
- **Risk factors**: Specific concerns for the optimization type
- **Mitigation strategies**: Steps to reduce identified risks
- **Rollback plan**: Git-based change reversal

### Safety Features

- **Dry-run mode**: Preview changes without applying them
- **Limited scope**: Maximum optimization limits
- **Incremental deployment**: Apply changes in small batches
- **Comprehensive logging**: Detailed operation tracking
- **Git integration**: Automatic commit creation with detailed messages

## 📞 Quick Start Commands

```bash
# Test the system (safe mode)
python agents/run_amp_specialist.py --mode=scan --dry-run

# Run full optimization with limits
python agents/run_amp_specialist.py --mode=full --max-optimizations=5

# Generate performance dashboard
python agents/run_amp_specialist.py --mode=report

# Check system status
python -c "
from agents.monitoring_dashboard import MonitoringDashboard
import asyncio
dashboard = MonitoringDashboard('.')
print(asyncio.run(dashboard.get_system_status()))
"
```

---

## 🎉 Expected Results

**Performance Improvements**:
- ✅ 20-50% reduction in unnecessary React re-renders
- ✅ 30-70% improvement in expensive calculation performance  
- ✅ 60-90% faster API response times with caching
- ✅ 15-40% reduction in initial bundle size
- ✅ 50-80% reduction in high-frequency event processing

**Quality Improvements**:
- ✅ Enhanced error handling and reliability
- ✅ Better code maintainability and readability
- ✅ Consistent optimization patterns across codebase
- ✅ Comprehensive performance monitoring
- ✅ Knowledge sharing through pattern storage

---

**Generated with 🤖 [Claude Code](https://claude.ai/code)**

*AMP Refactoring Specialist - Continuously optimizing War Room for peak performance*