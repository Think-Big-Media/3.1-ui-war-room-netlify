# Documentation Rules - Never Create Random .md Files
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🚨 CRITICAL DOCUMENTATION RULES

### **NEVER CREATE .MD FILES UNLESS:**
1. User explicitly says "document this" or "create documentation"
2. User specifically requests a markdown file
3. It's a required project file (README.md only)

### **WHEN USER SAYS "DOCUMENT":**
1. **ASK FIRST**: "Where should I save this documentation?"
2. **Suggest options**:
   - `/docs/` - Technical documentation
   - `/docs/features/` - Feature documentation
   - `/docs/api/` - API documentation
   - `/docs/testing/` - Test documentation
   - `/docs/architecture/` - System design docs
   - `/docs/planning/` - Project planning
   - `/docs/decisions/` - ADRs (Architecture Decision Records)

## 📁 Proper Documentation Structure

### **Standard Project Structure**
```
/project-root/
├── README.md              # ONLY .md file in root
├── /docs/
│   ├── /architecture/     # System design, diagrams
│   ├── /api/              # API specs, endpoints
│   ├── /features/         # Feature documentation
│   ├── /testing/          # Test plans, coverage
│   ├── /decisions/        # ADRs, tech choices
│   ├── /planning/         # Roadmaps, sprints
│   └── /guides/           # How-to, tutorials
├── /src/
└── /.claude/              # Claude-specific config
```

### **Documentation Location Decision Matrix**
```javascript
const documentationMatrix = {
  "/docs/architecture/": [
    "System design documents",
    "Database schemas", 
    "Infrastructure diagrams",
    "Technical specifications"
  ],
  
  "/docs/api/": [
    "API endpoint documentation",
    "Request/response examples",
    "Authentication guides",
    "Rate limiting policies"
  ],
  
  "/docs/features/": [
    "Feature specifications",
    "User story documentation",
    "Acceptance criteria",
    "Feature flag documentation"
  ],
  
  "/docs/testing/": [
    "Test plans and strategies",
    "Test coverage reports", 
    "Manual testing procedures",
    "Performance test results"
  ],
  
  "/docs/decisions/": [
    "Architecture Decision Records (ADRs)",
    "Technology choice justifications",
    "Design pattern decisions",
    "Process change rationales"
  ],
  
  "/docs/planning/": [
    "Project roadmaps",
    "Sprint planning documents",
    "Milestone definitions",
    "Resource allocation plans"
  ],
  
  "/docs/guides/": [
    "Developer setup guides",
    "Deployment procedures",
    "Troubleshooting guides",
    "Best practices documentation"
  ]
};
```

## ✅ Documentation Best Practices

### **Content Quality Standards**
```javascript
const documentationStandards = {
  structure: {
    title: "Clear, descriptive heading",
    overview: "Brief summary of purpose",
    tableOfContents: "For documents >500 words",
    sections: "Logical organization with subheadings",
    examples: "Code samples and use cases",
    references: "Links to related documentation"
  },
  
  writing: {
    audience: "Write for the intended reader",
    clarity: "Use simple, clear language",
    conciseness: "Eliminate unnecessary words",
    accuracy: "Keep information up-to-date",
    completeness: "Cover all necessary topics"
  },
  
  maintenance: {
    versioning: "Track document versions",
    ownership: "Assign document maintainers",
    reviews: "Regular accuracy reviews",
    updates: "Update with code changes"
  }
};
```

### **Documentation Templates**

#### **Feature Documentation Template**
```markdown
# Feature Name

## Overview
Brief description of the feature and its purpose.

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Acceptance Criteria
- [ ] Specific testable requirements
- [ ] Performance requirements
- [ ] Security requirements

## Technical Implementation
### Architecture
- System components involved
- Data flow diagrams

### API Endpoints
```http
GET /api/feature
POST /api/feature
```

### Database Changes
- Schema modifications
- Migration scripts

## Testing Strategy
- Unit test coverage
- Integration test scenarios
- Manual testing procedures

## Rollout Plan
- Feature flag strategy
- Gradual rollout approach
- Success metrics

## Dependencies
- Required services
- External integrations
- Team dependencies
```

#### **API Documentation Template**
```markdown
# API Endpoint: [Endpoint Name]

## Overview
Brief description of the endpoint's purpose.

## Endpoint Details
- **URL**: `/api/v1/endpoint`
- **Method**: `POST`
- **Authentication**: Required/Optional
- **Rate Limit**: X requests per minute

## Request Format
```json
{
  "parameter": "value",
  "required_field": "string"
}
```

## Response Format
### Success (200)
```json
{
  "status": "success",
  "data": {}
}
```

### Error (400)
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Examples
### cURL
```bash
curl -X POST "https://api.example.com/v1/endpoint" \
     -H "Authorization: Bearer token" \
     -H "Content-Type: application/json" \
     -d '{"parameter": "value"}'
```

## Error Handling
- Common error codes and meanings
- Retry strategies
- Rate limiting behavior
```

## 🔄 Documentation Workflow

### **Documentation Agent Process**
```javascript
const documentationAgent = {
  trigger: /\b(document|documentation|docs)\b/i,
  
  workflow: [
    "Analyze what needs to be documented",
    "Ask user for preferred location", 
    "Suggest appropriate documentation type",
    "Create structured document with proper template",
    "Add cross-references to related docs",
    "Update documentation index if needed"
  ],
  
  locationPrompt: [
    "Where should I save this documentation?",
    "Options:",
    "- /docs/features/[feature-name].md",
    "- /docs/api/[endpoint-name].md", 
    "- /docs/testing/[test-plan].md",
    "- /docs/architecture/[component].md",
    "- Custom path?"
  ]
};
```

### **Documentation Review Process**
```javascript
const documentationReview = {
  beforePublication: [
    "Technical accuracy review",
    "Grammar and clarity check",
    "Link validation",
    "Template compliance",
    "Audience appropriateness"
  ],
  
  regularMaintenance: [
    "Quarterly accuracy reviews",
    "Update with code changes", 
    "Remove outdated information",
    "Improve based on user feedback",
    "Consolidate duplicate information"
  ]
};
```

## 📊 Documentation Metrics

### **Quality Indicators**
```javascript
const documentationMetrics = {
  coverage: "Percentage of features documented",
  freshness: "Days since last update",
  usage: "Page views and user engagement",
  feedback: "User ratings and comments",
  
  targets: {
    coverage: ">90% of production features",
    freshness: "<30 days for critical docs",
    accuracy: ">95% technical accuracy",
    usability: ">4.0/5.0 user rating"
  }
};
```

### **Documentation Automation**
```javascript
const documentationAutomation = {
  generation: [
    "API docs from OpenAPI specs",
    "Code comments to documentation",
    "Test cases to acceptance criteria",
    "Database schema documentation"
  ],
  
  validation: [
    "Link checking automation",
    "Spell checking integration",
    "Template compliance validation",
    "Outdated content detection"
  ],
  
  distribution: [
    "Static site generation",
    "Search indexing",
    "Version control integration",
    "Multi-format publishing"
  ]
};
```

## ⚠️ Common Documentation Mistakes

### **Avoid These Pitfalls**
```javascript
const documentationMistakes = {
  location: [
    "❌ Creating .md files in project root",
    "❌ Inconsistent folder structures",
    "❌ Documentation scattered across tools",
    "❌ No clear ownership or maintenance"
  ],
  
  content: [
    "❌ Writing for yourself instead of users",
    "❌ Technical jargon without explanation",
    "❌ Missing examples and use cases",
    "❌ Outdated information"
  ],
  
  process: [
    "❌ No documentation review process",
    "❌ Documentation as an afterthought",
    "❌ No feedback collection mechanism",
    "❌ Lack of documentation standards"
  ]
};
```

### **Success Patterns**
```javascript
const documentationSuccess = {
  beforeCoding: "Document requirements and design",
  duringCoding: "Update docs with implementation details", 
  afterCoding: "Validate documentation accuracy",
  maintenance: "Regular reviews and updates",
  
  userFocused: [
    "Write for your audience",
    "Include practical examples",
    "Provide troubleshooting guides",
    "Make it searchable and navigable"
  ]
};
```

## 🛡️ Documentation Security

### **Sensitive Information Handling**
```javascript
const documentationSecurity = {
  neverDocument: [
    "API keys or secrets",
    "Internal server addresses", 
    "Database credentials",
    "Security vulnerabilities",
    "Business-sensitive information"
  ],
  
  publicDocumentation: [
    "Sanitize all examples",
    "Use placeholder values",
    "Review for information leakage",
    "Consider external access implications"
  ]
};
```

---

**Remember: Documentation is a product feature. Users rely on clear, accurate, and well-organized documentation to successfully use and integrate with your systems. Always ask where to save documentation - never create random .md files.**