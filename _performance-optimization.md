# Performance Optimization - Speed & Efficiency Rules
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## ⚡ UltraCompressed Mode - 70% Token Reduction

### **Automatic Activation**
```javascript
const ultraCompressedTriggers = {
  flagBased: "--uc flag present",
  keywordBased: "'compress' keywords detected",
  automatic: "Context usage > 75%",
  
  benefits: [
    "~70% token reduction",
    "Faster response times", 
    "Cost efficiency",
    "Extended session length"
  ]
};
```

### **When to Use UltraCompressed**
- **Large codebases** (>50 files being analyzed)
- **Long sessions** (approaching context limits)
- **Token budget constraints** (cost optimization)
- **Quick iterations** (rapid feedback loops)

### **Compression Techniques**
```javascript
const compressionMethods = {
  redundancyElimination: "Remove duplicate information",
  keywordDensity: "Focus on essential terms only", 
  structuralOptimization: "Minimize formatting overhead",
  contextualPruning: "Keep only relevant details"
};
```

## 🧠 Model Selection Strategy

### **Task Complexity Matching**
```javascript
const modelSelection = {
  simple: {
    model: "Sonnet",
    useCases: [
      "Basic CRUD operations",
      "Simple bug fixes", 
      "Documentation updates",
      "Code formatting"
    ],
    responseTime: "Fast",
    costEfficiency: "High"
  },
  
  complex: {
    model: "Sonnet-4", 
    useCases: [
      "Multi-step analysis",
      "Architecture decisions",
      "Complex refactoring", 
      "Integration challenges"
    ],
    responseTime: "Medium",
    accuracy: "High"
  },
  
  critical: {
    model: "Opus-4",
    useCases: [
      "High-stakes decisions",
      "Complex system design",
      "Security architecture",
      "Performance optimization"
    ],
    responseTime: "Slower",
    quality: "Maximum"
  }
};
```

## 🔄 MCP Caching & Parallel Execution

### **Smart Caching Strategy**
```javascript
const mcpCaching = {
  context7: {
    purpose: "Library documentation",
    ttl: "1 hour",
    benefit: "Avoid redundant doc lookups"
  },
  
  sequential: {
    purpose: "Analysis results", 
    ttl: "Session duration",
    benefit: "Reuse complex reasoning"
  },
  
  magic: {
    purpose: "Component templates",
    ttl: "2 hours", 
    benefit: "Consistent UI patterns"
  }
};
```

### **Parallel Execution Pattern**
```javascript
// Independent MCP calls run simultaneously
const parallelExecution = async () => {
  const [docs, analysis, components] = await Promise.all([
    context7.lookup(query),
    sequential.analyze(problem),
    magic.generateComponent(spec)
  ]);
  
  return combineResults(docs, analysis, components);
};
```

## 📊 Performance Monitoring

### **Response Time Optimization**
```javascript
const performanceMetrics = {
  target: {
    simpleQuery: "< 2 seconds",
    complexAnalysis: "< 10 seconds", 
    codeGeneration: "< 30 seconds"
  },
  
  monitoring: {
    tokenUsage: "Track per operation",
    cacheHitRate: "Monitor effectiveness",
    parallelGains: "Measure time savings"
  }
};
```

### **Bottleneck Identification**
```javascript
const commonBottlenecks = {
  largeFileReads: {
    problem: "Reading 10+ large files sequentially",
    solution: "Batch reads with limit/offset"
  },
  
  repetitiveAnalysis: {
    problem: "Re-analyzing same code patterns",
    solution: "Cache analysis results"
  },
  
  syncProcessing: {
    problem: "Sequential MCP calls",
    solution: "Parallel execution where possible"
  }
};
```

## 🎯 Optimization Strategies

### **Code Analysis Optimization**
```javascript
const analysisOptimization = {
  filePriority: [
    "Modified files first",
    "Core modules before utilities", 
    "Entry points before dependencies"
  ],
  
  batchProcessing: [
    "Group related files",
    "Process by directory structure",
    "Use glob patterns efficiently"
  ]
};
```

### **Context Efficiency**
```javascript
const contextEfficiency = {
  smartSummarization: [
    "Key insights only",
    "Action items prioritized",
    "Reference links for details"
  ],
  
  workingMemory: [
    "Keep active task context",
    "Archive completed work", 
    "Restore on demand only"
  ]
};
```

## 🔧 Development Performance

### **Build Time Optimization**
```javascript
const buildOptimization = {
  incrementalBuilds: "Only rebuild changed modules",
  parallelTasks: "Run tests while building",
  caching: "Leverage build tool caches",
  
  watchMode: {
    enabled: true,
    hotReload: true,
    incrementalTypeCheck: true
  }
};
```

### **Test Execution Speed**
```javascript
const testOptimization = {
  parallelTests: "Run test suites concurrently",
  smartSelection: "Run affected tests first",
  caching: "Cache test results when possible",
  
  ciOptimization: {
    splitTests: "Distribute across CI workers",
    cacheNodeModules: "Speed up CI builds",
    failFast: "Stop on first critical failure"
  }
};
```

## 📈 Memory Management

### **Large Codebase Handling**
```javascript
const memoryManagement = {
  streamProcessing: "Process files in chunks",
  lazyLoading: "Load content only when needed", 
  garbageCollection: "Clean up processed data",
  
  patterns: {
    avoidFullLoad: "Use Read tool with offset/limit",
    batchOperations: "Process multiple files in single call",
    releaseMemory: "Clear unused context regularly"
  }
};
```

### **Session Longevity**
```javascript
const sessionOptimization = {
  contextManagement: "Patrick Hack at 95% usage",
  memoryCleanup: "Archive completed tasks",
  smartCaching: "Preserve essential working memory",
  
  restoration: {
    quickStart: "Restore from comprehensive summary", 
    contextPreservation: "Maintain relationship awareness",
    workflowContinuity: "Pick up exactly where left off"
  }
};
```

## 🚀 Deployment Performance

### **CI/CD Optimization**
```javascript
const cicdOptimization = {
  caching: [
    "Node modules cache",
    "Build artifact cache",
    "Docker layer cache"
  ],
  
  parallelization: [
    "Test suites run concurrently", 
    "Build and test in parallel",
    "Multi-stage deployments"
  ],
  
  smartTriggers: [
    "Only build affected packages",
    "Skip unchanged environments",
    "Incremental deployments"
  ]
};
```

## 🔍 Profiling & Debugging

### **Performance Profiling**
```javascript
const profilingStrategy = {
  clientSide: {
    tools: "React DevTools, Chrome DevTools",
    metrics: "Render times, memory usage, network",
    optimization: "Component memoization, lazy loading"
  },
  
  serverSide: {
    tools: "Node.js profiler, APM tools",
    metrics: "Response times, database queries, memory",
    optimization: "Query optimization, caching, scaling"
  }
};
```

### **Real-time Monitoring**
```javascript
const realTimeMonitoring = {
  webVitals: [
    "Largest Contentful Paint (LCP)",
    "First Input Delay (FID)", 
    "Cumulative Layout Shift (CLS)"
  ],
  
  backend: [
    "API response times",
    "Database query performance",
    "Error rates and patterns"
  ]
};
```

## ⚙️ Configuration Examples

### **Performance-First Setup**
```json
{
  "performance": {
    "ultraCompressed": {
      "autoActivate": true,
      "threshold": 75
    },
    "caching": {
      "enabled": true,
      "ttl": {
        "docs": 3600,
        "analysis": 1800,
        "components": 7200
      }
    },
    "parallelExecution": {
      "enabled": true,
      "maxConcurrent": 3
    }
  }
}
```

### **Development Workflow**
```json
{
  "dev": {
    "watchMode": true,
    "hotReload": true,
    "incrementalBuild": true,
    "parallelTests": true,
    "cacheOptimizations": true
  }
}
```

---

**Performance optimization is about intelligent resource usage - compress when needed, cache what's reused, parallelize what's independent, and always measure the impact of optimizations.**