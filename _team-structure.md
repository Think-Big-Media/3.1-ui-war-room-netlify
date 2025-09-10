# Team Structure & Workflow - Claude Code Studio Operations
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🎯 Studio Organization Model

### **Core Team Roles**
```javascript
const studioRoles = {
  studioProducer: {
    responsibilities: [
      "Cross-functional coordination",
      "Resource allocation optimization", 
      "Workflow bottleneck identification",
      "Sprint planning and execution"
    ],
    triggers: "Team dependencies, resource conflicts"
  },
  
  projectShipper: {
    responsibilities: [
      "Release coordination",
      "Go-to-market strategy",
      "Launch milestone management",
      "Post-launch monitoring"
    ],
    triggers: "Release dates, launch activities"
  },
  
  experimentTracker: {
    responsibilities: [
      "A/B test management",
      "Feature flag coordination",
      "Experiment result analysis", 
      "Data-driven decision support"
    ],
    triggers: "Feature flags, experiment launches"
  }
};
```

### **Specialized Agent Teams**

#### **Development Squad**
```javascript
const developmentSquad = {
  frontendDeveloper: {
    focus: "UI/UX implementation, React/Vue components",
    tools: "Magic MCP, Puppeteer testing",
    expertise: "Responsive design, accessibility, performance"
  },
  
  backendArchitect: {
    focus: "API design, scalability, data architecture",
    tools: "Context7 patterns, Sequential analysis", 
    expertise: "Microservices, databases, security"
  },
  
  mobileAppBuilder: {
    focus: "Native iOS/Android, React Native",
    tools: "Platform-specific optimizations",
    expertise: "Cross-platform development, native features"
  }
};
```

#### **Quality Assurance Squad**
```javascript
const qaSquad = {
  testWriterFixer: {
    focus: "Test automation, coverage analysis",
    triggers: "Code changes, failed tests",
    expertise: "Unit, integration, e2e testing"
  },
  
  performanceBenchmarker: {
    focus: "Speed optimization, bottleneck identification", 
    tools: "Profiling, metrics collection",
    expertise: "Load testing, optimization strategies"
  },
  
  apiTester: {
    focus: "API validation, contract testing",
    tools: "Postman, REST/GraphQL testing",
    expertise: "Performance testing, security validation"
  }
};
```

#### **Growth & Marketing Squad**
```javascript
const growthSquad = {
  tiktokStrategist: {
    focus: "Viral content strategy, trend analysis",
    tools: "Social listening, content optimization",
    expertise: "Creator partnerships, algorithm optimization"
  },
  
  appStoreOptimizer: {
    focus: "ASO, keyword research, conversion optimization",
    tools: "Analytics platforms, A/B testing",
    expertise: "Store visibility, download optimization"
  },
  
  feedbackSynthesizer: {
    focus: "User research, sentiment analysis",
    tools: "Review analysis, survey data",
    expertise: "Product insights, feature prioritization"
  }
};
```

## 🔄 6-Day Development Cycles (Enhanced Workflow)

**🚨 ENHANCED INTEGRATION:** Uses Graphite GT MCP, rotating historical codename system, and focus discipline protocols.

### **Sprint Structure**
```javascript
const sixDaySprint = {
  day1: {
    focus: "Planning & Architecture",
    activities: [
      "Sprint goal definition",
      "Technical specification",
      "Resource allocation",
      "Risk assessment"
    ],
    
    deliverables: [
      "Sprint backlog",
      "Technical design docs", 
      "Definition of done",
      "Success metrics"
    ]
  },
  
  days2_4: {
    focus: "Development & Implementation",
    activities: [
      "Feature development",
      "Continuous testing",
      "Code review",
      "Integration work"
    ],
    
    dailyCheckins: [
      "Progress updates",
      "Blocker identification", 
      "Resource reallocation",
      "Quality checkpoints"
    ]
  },
  
  day5: {
    focus: "Testing & Refinement",
    activities: [
      "Full test suite execution",
      "User acceptance testing",
      "Performance validation",
      "Security review"
    ],
    
    qualityGates: [
      "All tests passing",
      "Performance benchmarks met",
      "Security scan clean",
      "Code coverage >80%"
    ]
  },
  
  day6: {
    focus: "Deployment & Launch",
    activities: [
      "Production deployment",
      "Launch activities",
      "Monitoring setup",
      "Sprint retrospective"
    ],
    
    success_criteria: [
      "Zero downtime deployment",
      "All health checks passing",
      "User feedback collection active",
      "Next sprint planned"
    ]
  }
};
```

### **Cross-Team Coordination**

#### **Daily Sync Protocol**
```javascript
const dailySync = {
  format: "15-minute standup",
  participants: "Core team + relevant specialists",
  
  agenda: {
    yesterday: "Completed work, key decisions",
    today: "Planned work, resource needs",
    blockers: "Issues requiring team support",
    dependencies: "Cross-team coordination needs"
  },
  
  outputs: [
    "Updated sprint board",
    "Blocker resolution assignments",
    "Resource reallocation decisions",
    "Communication plan updates"
  ]
};
```

#### **Sprint Review & Planning**
```javascript
const sprintCeremony = {
  retrospective: {
    duration: "1 hour",
    focus: [
      "What worked well?",
      "What could be improved?", 
      "Action items for next sprint",
      "Process optimizations"
    ]
  },
  
  planning: {
    duration: "2 hours",
    activities: [
      "Product backlog refinement",
      "Sprint goal definition",
      "Capacity planning",
      "Risk assessment"
    ]
  }
};
```

## 🚀 Rapid Deployment Strategy

### **Continuous Integration Workflow**
```javascript
const ciWorkflow = {
  triggers: [
    "Every commit to historical codename branches (via Graphite GT)",
    "Historical codename PR creation/updates via Graphite web interface",
    "Scheduled nightly builds",
    "Manual deployment triggers"
  ],
  
  pipeline: {
    stage1: "Code quality checks (linting, formatting)",
    stage2: "Security scanning (dependencies, code)",
    stage3: "Test execution (unit, integration, e2e)", 
    stage4: "Build & artifact creation",
    stage5: "Deployment to staging",
    stage6: "Production deployment (on approval)"
  },
  
  qualityGates: [
    "All tests must pass",
    "Code coverage >80%",
    "Security scan clean", 
    "Performance benchmarks met"
  ]
};
```

### **Feature Flag Strategy**
```javascript
const featureFlags = {
  types: {
    release: "Enable/disable entire features",
    experiment: "A/B testing variations",
    operational: "Circuit breakers, kill switches",
    permission: "Role-based feature access"
  },
  
  lifecycle: [
    "Development: Flag created, default off",
    "Testing: Enabled for test users",
    "Rollout: Gradual percentage rollout",
    "Stability: Monitor metrics, adjust rollout",
    "Cleanup: Remove flag after successful rollout"
  ]
};
```

## 📊 Performance Metrics

### **Team Velocity Tracking**
```javascript
const velocityMetrics = {
  sprint: {
    storyPoints: "Completed vs planned",
    cycleTime: "Feature start to production",
    throughput: "Features delivered per sprint",
    quality: "Defects per feature"
  },
  
  individual: {
    codeContributions: "Historical codename commits via Graphite GT, lines changed",
    reviewParticipation: "Reviews given/received",
    knowledgeSharing: "Documentation, mentoring",
    problemSolving: "Issues resolved, innovations"
  }
};
```

### **Quality Metrics**
```javascript
const qualityMetrics = {
  codeQuality: {
    coverage: "Test coverage percentage", 
    complexity: "Cyclomatic complexity scores",
    duplication: "Code duplication percentage",
    maintainability: "Technical debt ratio"
  },
  
  operationalQuality: {
    uptime: "System availability percentage",
    errorRate: "Production error frequency",
    responseTime: "API response time percentiles",
    userSatisfaction: "User feedback scores"
  }
};
```

## 🔧 Workflow Optimization

### **Bottleneck Identification**
```javascript
const bottleneckAnalysis = {
  commonBottlenecks: [
    "Code review delays",
    "Testing environment availability",
    "Third-party dependency issues",
    "Design-development handoffs",
    "Deployment pipeline failures"
  ],
  
  solutions: {
    codeReview: "Automated checks, review assignment",
    testing: "Containerized test environments",
    dependencies: "Dependency monitoring, alternatives",
    handoffs: "Design systems, clear specifications", 
    deployment: "Pipeline monitoring, quick rollbacks"
  }
};
```

### **Process Automation**
```javascript
const processAutomation = {
  development: [
    "Code formatting on commit",
    "Automated test execution", 
    "Dependency updates",
    "Security scanning"
  ],
  
  projectManagement: [
    "Sprint board updates",
    "Progress reporting",
    "Stakeholder notifications",
    "Metric collection"
  ],
  
  operations: [
    "Health monitoring",
    "Error alerting", 
    "Performance tracking",
    "Backup verification"
  ]
};
```

## 🎯 Success Patterns

### **High-Performing Team Characteristics**
```javascript
const successPatterns = {
  communication: [
    "Clear, frequent updates",
    "Proactive problem reporting",
    "Knowledge sharing culture",
    "Constructive feedback loops"
  ],
  
  technical: [
    "Continuous integration/deployment",
    "Automated testing at all levels",
    "Monitoring and observability",
    "Rapid iteration cycles"
  ],
  
  cultural: [
    "Psychological safety",
    "Learning orientation", 
    "Collaborative problem solving",
    "Celebration of wins and learning from failures"
  ]
};
```

### **Rapid Development Enablers**
```javascript
const rapidDevelopment = {
  tooling: [
    "Automated development environments",
    "Shared component libraries",
    "API mocking and testing tools",
    "Visual regression testing"
  ],
  
  practices: [
    "Graphite GT stacked development workflow",
    "Historical codename-based feature organization (one feature per codename)",
    "Automated rollback capabilities via Graphite", 
    "Comprehensive monitoring with focus discipline"
  ]
};
```

## 📋 Team Health Monitoring

### **Regular Health Checks**
```javascript
const teamHealthChecks = {
  weekly: {
    metrics: ["Sprint progress", "Blocker resolution", "Team morale"],
    actions: ["Resource reallocation", "Process adjustments", "Support provision"]
  },
  
  monthly: {
    metrics: ["Velocity trends", "Quality metrics", "Team satisfaction"],
    actions: ["Process improvements", "Training needs", "Tool evaluation"]
  },
  
  quarterly: {
    metrics: ["Goal achievement", "Skill development", "Career growth"],
    actions: ["Strategic planning", "Team restructuring", "Long-term investments"]
  }
};
```

---

**Effective team structure combines clear role definition with flexible collaboration. Success comes from optimizing workflows, measuring what matters, and continuously improving based on data and feedback.**