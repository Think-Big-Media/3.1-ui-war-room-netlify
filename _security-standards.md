# Security Standards - OWASP Top 10 Integration
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🛡️ Security-First Development

### **Core Security Principles**
```javascript
const securityPrinciples = {
  zeroTrust: "Never trust, always verify",
  defenseInDepth: "Multiple security layers",
  leastPrivilege: "Minimum required permissions",
  failSecure: "Secure defaults when errors occur"
};
```

### **OWASP Top 10 Integration**
Every application must address these critical vulnerabilities:

1. **A01:2021 – Broken Access Control**
2. **A02:2021 – Cryptographic Failures** 
3. **A03:2021 – Injection**
4. **A04:2021 – Insecure Design**
5. **A05:2021 – Security Misconfiguration**
6. **A06:2021 – Vulnerable Components**
7. **A07:2021 – Identity & Authentication Failures**
8. **A08:2021 – Software & Data Integrity Failures**
9. **A09:2021 – Security Logging & Monitoring Failures**
10. **A10:2021 – Server-Side Request Forgery (SSRF)**

## 🔐 Authentication & Authorization

### **JWT Security Implementation**
```javascript
const jwtSecurity = {
  secretGeneration: {
    method: "crypto.randomBytes(64)",
    storage: "Environment variables only",
    rotation: "90-day policy minimum"
  },
  
  tokenStructure: {
    header: "Algorithm specification (RS256 preferred)",
    payload: "Minimal claims, no sensitive data",
    signature: "HMAC SHA256 or RSA signatures"
  },
  
  validation: {
    expiration: "Short-lived tokens (15 minutes)",
    refresh: "Secure refresh token rotation",
    revocation: "Token blacklist capability"
  }
};
```

### **Password Security**
```javascript
const passwordSecurity = {
  hashing: {
    algorithm: "bcrypt",
    saltRounds: 12, // Minimum
    example: "bcrypt.hash(password, 12)"
  },
  
  policies: {
    minLength: 8,
    complexity: "Mixed case, numbers, symbols",
    history: "Prevent reuse of last 12 passwords",
    expiration: "90 days for privileged accounts"
  },
  
  storage: {
    never: "Plain text passwords",
    always: "Hashed with unique salts",
    location: "Secure database only"
  }
};
```

## 🔒 Data Protection

### **Encryption Standards**
```javascript
const encryptionStandards = {
  atRest: {
    algorithm: "AES-256-GCM",
    keyManagement: "Hardware Security Modules (HSM)",
    scope: "All sensitive data fields"
  },
  
  inTransit: {
    protocol: "TLS 1.3 minimum",
    certificates: "Valid SSL/TLS certificates",
    hsts: "HTTP Strict Transport Security enabled"
  },
  
  keyManagement: {
    rotation: "Annual key rotation minimum",
    storage: "Separate from encrypted data",
    access: "Role-based key access control"
  }
};
```

### **Sensitive Data Handling**
```javascript
const sensitiveDataProtection = {
  identification: [
    "Personal Identifiable Information (PII)",
    "Payment card data (PCI DSS)",
    "Health information (HIPAA)",
    "Authentication credentials",
    "Business secrets"
  ],
  
  protection: [
    "Encrypt at rest and in transit",
    "Tokenization for payment data",
    "Data masking in logs",
    "Access logging and monitoring",
    "Regular access reviews"
  ]
};
```

## 🚫 Input Validation & Sanitization

### **Injection Prevention**
```javascript
const injectionPrevention = {
  sqlInjection: {
    solution: "Parameterized queries only",
    avoid: "String concatenation for SQL",
    example: "SELECT * FROM users WHERE id = $1"
  },
  
  xss: {
    solution: "Context-aware output encoding",
    avoid: "Unescaped user input in HTML",
    tools: "DOMPurify, validator.js"
  },
  
  commandInjection: {
    solution: "Input validation, avoid shell execution",
    avoid: "exec(), system() with user input",
    alternative: "Specific APIs instead of shell commands"
  }
};
```

### **Input Validation Rules**
```javascript
const inputValidation = {
  whitelistApproach: "Allow known good, reject everything else",
  
  validationLayers: [
    "Client-side: User experience",
    "Server-side: Security enforcement", 
    "Database: Constraint validation"
  ],
  
  commonValidations: {
    email: "RFC 5322 compliant format",
    phone: "International format validation",
    urls: "Protocol and domain validation",
    fileUploads: "Type, size, content validation"
  }
};
```

## 🔍 Security Scanning & Testing

### **Automated Security Testing**
```javascript
const securityTesting = {
  staticAnalysis: {
    tools: ["Semgrep", "CodeQL", "SonarQube"],
    frequency: "Every commit",
    coverage: "All code paths"
  },
  
  dependencyScanning: {
    tools: ["npm audit", "Snyk", "OWASP Dependency Check"],
    frequency: "Daily",
    action: "Auto-update critical vulnerabilities"
  },
  
  dynamicTesting: {
    tools: ["OWASP ZAP", "Burp Suite"],
    scope: "All user-facing endpoints",
    frequency: "Pre-production deployment"
  }
};
```

### **Penetration Testing**
```javascript
const penetrationTesting = {
  frequency: "Quarterly for production systems",
  scope: [
    "Web application security",
    "API endpoint security",
    "Infrastructure security", 
    "Social engineering resilience"
  ],
  
  methodology: "OWASP Testing Guide v4.0",
  reporting: "Detailed findings with remediation timeline"
};
```

## 📊 Security Logging & Monitoring

### **Security Event Logging**
```javascript
const securityLogging = {
  events: [
    "Authentication attempts (success/failure)",
    "Authorization failures", 
    "Input validation failures",
    "Application errors and exceptions",
    "Administrative actions"
  ],
  
  logFormat: {
    timestamp: "ISO 8601 with timezone",
    userId: "If authenticated",
    action: "Specific action attempted", 
    result: "Success/failure/error",
    metadata: "IP address, user agent, etc."
  },
  
  storage: {
    retention: "Minimum 12 months",
    integrity: "Log file integrity protection",
    access: "Restricted to security team"
  }
};
```

### **Real-time Monitoring**
```javascript
const securityMonitoring = {
  alerting: [
    "Multiple failed login attempts",
    "Unusual access patterns",
    "Privilege escalation attempts",
    "Data exfiltration patterns",
    "Application security exceptions"
  ],
  
  response: {
    immediate: "Automated blocking of obvious attacks",
    investigation: "Security team notification",
    escalation: "Management notification for critical events"
  }
};
```

## 🔧 Secure Development Lifecycle

### **Security in CI/CD**
```javascript
const secureDevOps = {
  preCommit: [
    "Secret scanning (no hardcoded credentials)",
    "Static code analysis",
    "Dependency vulnerability check"
  ],
  
  buildPipeline: [
    "Container security scanning",
    "Infrastructure as code security",
    "Compliance validation"
  ],
  
  deployment: [
    "Environment security validation",
    "Runtime security monitoring",
    "Post-deployment security testing"
  ]
};
```

### **Secure Configuration Management**
```javascript
const secureConfiguration = {
  secrets: {
    storage: "Dedicated secret management (GitHub Secrets, Vault)",
    access: "Role-based access control",
    rotation: "Regular rotation schedule"
  },
  
  infrastructure: {
    principle: "Secure by default",
    hardening: "Remove unnecessary services",
    updates: "Regular security patching"
  }
};
```

## 🌐 API Security

### **RESTful API Protection**
```javascript
const apiSecurity = {
  authentication: "Bearer token authentication",
  authorization: "Resource-based permissions",
  rateLimiting: "Prevent abuse and DoS",
  
  headers: {
    cors: "Restrict cross-origin requests",
    csp: "Content Security Policy",
    hsts: "HTTP Strict Transport Security"
  },
  
  validation: {
    input: "Strict input validation",
    output: "Prevent information leakage",
    errors: "Generic error messages"
  }
};
```

### **GraphQL Security**
```javascript
const graphqlSecurity = {
  queryComplexity: "Limit query depth and complexity",
  rateLimiting: "Query-based rate limiting",
  authorization: "Field-level authorization",
  
  introspection: {
    production: "Disabled in production",
    development: "Restricted access only"
  }
};
```

## 📋 Security Checklist Template

### **Pre-deployment Security Review**
```markdown
## Security Review Checklist

### Authentication & Authorization
- [ ] Strong password policies implemented
- [ ] Multi-factor authentication enabled
- [ ] JWT tokens properly secured
- [ ] Session management secure

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] All communications use TLS 1.3+
- [ ] PII handling complies with regulations
- [ ] Data retention policies implemented

### Input Validation
- [ ] All user inputs validated server-side
- [ ] SQL injection prevention implemented
- [ ] XSS protection in place
- [ ] File upload security validated

### Security Testing
- [ ] Static code analysis passed
- [ ] Dependency vulnerabilities resolved
- [ ] Dynamic security testing completed
- [ ] Penetration testing conducted

### Monitoring & Logging
- [ ] Security event logging implemented
- [ ] Real-time monitoring configured
- [ ] Incident response plan documented
- [ ] Log integrity protection enabled
```

## ⚠️ Common Security Pitfalls

### **Avoid These Mistakes**
```javascript
const securityPitfalls = {
  neverDo: [
    "Hardcode secrets in source code",
    "Trust user input without validation",
    "Use weak or default passwords",
    "Disable security features for convenience",
    "Store sensitive data in client-side code",
    "Use deprecated cryptographic algorithms",
    "Ignore security warnings from tools"
  ],
  
  alwaysDo: [
    "Validate all inputs server-side",
    "Use parameterized queries",
    "Implement proper error handling",
    "Keep dependencies updated",
    "Follow principle of least privilege",
    "Log security events",
    "Regular security assessments"
  ]
};
```

---

**Security is not optional - it's a fundamental requirement. Every feature must be designed with security in mind, and security testing must be automated and continuous throughout the development lifecycle.**