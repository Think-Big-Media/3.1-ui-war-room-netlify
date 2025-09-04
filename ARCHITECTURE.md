# War Room Architecture v1.0

## System Overview

War Room is a comprehensive campaign management platform built with modern web technologies, designed for scalability, real-time performance, and security. The architecture supports multi-tenant campaign operations with AI-powered intelligence, real-time monitoring, and automated sub-agent systems.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOB[Mobile App]
        API_CLIENT[API Clients]
    end
    
    subgraph "Load Balancer/CDN"
        LB[Render Load Balancer]
    end
    
    subgraph "Application Layer - Render.com"
        WS[WebSocket Server]
        API[FastAPI Backend]
        STATIC[Static File Server]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL - Supabase)]
        REDIS[(Redis Cache)]
        PINECONE[(Pinecone Vector DB)]
    end
    
    subgraph "External Services"
        SUPABASE[Supabase Auth]
        OPENAI[OpenAI API]
        META[Meta Business API]
        GOOGLE[Google Ads API]
        SENTRY[Sentry Monitoring]
    end
    
    subgraph "Sub-Agent System"
        AGENT1[AMP Refactoring]
        AGENT2[CodeRabbit Integration]
        AGENT3[Pieces Knowledge]
        AGENT4[Health Monitor]
        AGENT5[Documentation]
    end
    
    WEB --> LB
    MOB --> LB
    API_CLIENT --> LB
    
    LB --> WS
    LB --> API
    LB --> STATIC
    
    API --> PG
    API --> REDIS
    API --> PINECONE
    API --> SUPABASE
    API --> OPENAI
    API --> META
    API --> GOOGLE
    
    API --> SENTRY
    
    API <--> AGENT1
    API <--> AGENT2
    API <--> AGENT3
    API <--> AGENT4
    API <--> AGENT5
```

## Technology Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React features
- **Build Tool**: Vite for fast development builds and optimized production bundles
- **State Management**: Redux Toolkit with RTK Query for API state management
- **UI Framework**: Shadcn/ui components with Tailwind CSS for consistent design
- **Animation**: Framer Motion for smooth UI transitions and animations
- **Charts & Visualization**: Recharts for analytics dashboards and data visualization
- **Real-time Communication**: Native WebSocket API with reconnection handling
- **Testing**: Jest with React Testing Library for component testing
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode

### Backend Architecture
- **Framework**: FastAPI (Python 3.11+) for high-performance async API development
- **Database**: PostgreSQL 15 with async SQLAlchemy ORM
- **Vector Database**: Pinecone for AI-powered document intelligence and semantic search
- **Cache Layer**: Redis with intelligent TTL policies and cache invalidation
- **Real-time Features**: WebSocket support with connection pooling and message broadcasting
- **Authentication**: JWT tokens with httpOnly cookies and Supabase integration
- **AI/ML Integration**: OpenAI GPT models, embeddings, and LangChain workflows
- **Background Tasks**: Celery with Redis broker for async job processing
- **API Documentation**: OpenAPI/Swagger with automatic schema generation

### Infrastructure & DevOps
- **Current Deployment**: Render.com unified service deployment
- **Database Hosting**: Supabase managed PostgreSQL with connection pooling
- **Cache Hosting**: Render Redis with persistent storage
- **Monitoring & Observability**: Sentry for error tracking, PostHog for analytics
- **Security**: Rate limiting, CSRF protection, input validation, security headers
- **CI/CD**: Automated deployment via Git push with health checks
- **Performance**: Edge caching, response compression, database query optimization

### Sub-Agent System Architecture
- **Agent 1**: AMP Refactoring Specialist for code optimization and performance
- **Agent 2**: CodeRabbit Integration for automated code review and quality assurance
- **Agent 3**: Pieces Knowledge Manager for code snippet and knowledge management
- **Agent 4**: Enhanced Health Monitor for system monitoring and alerting
- **Agent 5**: Documentation Agent for comprehensive documentation management

## Architecture Patterns

### Frontend Architecture Pattern

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # Shadcn/ui base components
│   ├── shared/             # Common business components
│   ├── layout/             # Layout components
│   └── feature-specific/   # Feature-specific components
├── pages/                  # Route-level components and pages
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Dashboard-related pages
│   ├── analytics/          # Analytics pages
│   └── admin/              # Admin-specific pages
├── services/               # API integration layer
│   ├── api/                # API client functions
│   ├── auth/               # Authentication services
│   └── websocket/          # WebSocket management
├── store/                  # Redux Toolkit store
│   ├── slices/             # Feature-specific slices
│   ├── api/                # RTK Query API definitions
│   └── middleware/         # Custom middleware
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication hook
│   ├── useWebSocket.ts     # WebSocket hook
│   └── useApi.ts           # API interaction hooks
├── types/                  # TypeScript type definitions
│   ├── api.ts              # API response types
│   ├── user.ts             # User-related types
│   └── campaign.ts         # Campaign-related types
├── utils/                  # Utility functions
│   ├── validation.ts       # Form validation
│   ├── formatting.ts       # Data formatting
│   └── constants.ts        # Application constants
└── styles/                 # Global styles and Tailwind config
```

### Backend Architecture Pattern

```
src/backend/
├── api/                    # API endpoints and routing
│   ├── v1/                 # API version 1
│   │   ├── endpoints/      # Individual endpoint modules
│   │   └── api.py          # Main API router
│   └── dependencies.py     # Shared dependencies
├── core/                   # Core configuration and utilities
│   ├── config.py           # Configuration settings
│   ├── security.py         # Security utilities
│   ├── deps.py             # Dependency injection
│   └── database.py         # Database configuration
├── models/                 # SQLAlchemy database models
│   ├── user.py             # User model
│   ├── campaign.py         # Campaign model
│   ├── analytics.py        # Analytics model
│   └── base.py             # Base model class
├── schemas/                # Pydantic schemas for validation
│   ├── user.py             # User schemas
│   ├── campaign.py         # Campaign schemas
│   └── response.py         # Response schemas
├── services/               # Business logic layer
│   ├── auth_service.py     # Authentication business logic
│   ├── campaign_service.py # Campaign management
│   ├── analytics_service.py# Analytics processing
│   └── ai_service.py       # AI/ML integration
├── middleware/             # Custom middleware
│   ├── auth.py             # Authentication middleware
│   ├── rate_limit.py       # Rate limiting
│   └── cors.py             # CORS configuration
├── utils/                  # Utility functions
│   ├── email.py            # Email utilities
│   ├── validation.py       # Data validation
│   └── helpers.py          # General helpers
├── tests/                  # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── fixtures/           # Test fixtures
└── agents/                 # Sub-agent system
    ├── base_agent.py       # Base agent class
    ├── amp_refactoring_specialist.py
    ├── coderabbit_integration.py
    ├── pieces_knowledge_manager.py
    ├── health_monitor.py
    └── documentation_agent.py
```

## Key System Features

### Core Platform Capabilities
1. **Real-time Dashboard**: WebSocket-powered live metrics and monitoring
2. **Multi-tenant Architecture**: Organization-based data isolation and access control
3. **Role-based Access Control**: Granular permissions for User, Admin, Platform Admin roles
4. **AI-Powered Intelligence**: Document processing, sentiment analysis, and predictive analytics
5. **Campaign Management**: Multi-platform campaign coordination and optimization
6. **Crisis Detection**: Automated threat detection and alert system
7. **Performance Optimization**: Intelligent caching, query optimization, and CDN integration
8. **Security Hardening**: Comprehensive security measures and compliance features

### Advanced Features
1. **Vector Search**: Semantic document search using Pinecone embeddings
2. **Automated Reporting**: Scheduled report generation and distribution
3. **API Integration Hub**: Meta Business API, Google Ads API, email/SMS platforms
4. **Sub-Agent Automation**: Automated code review, refactoring, and monitoring
5. **Export & Analytics**: Comprehensive data export in multiple formats
6. **Geographic Intelligence**: Location-based analytics and mapping
7. **Sentiment Analysis**: Real-time social media monitoring and analysis
8. **Webhook System**: Event-driven integrations with external systems

## Data Flow Architecture

### Request Flow Pattern
```mermaid
sequenceDiagram
    participant Client
    participant LB as Load Balancer
    participant API as FastAPI Server
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Cache as Redis
    participant External as External APIs
    
    Client->>LB: HTTP Request
    LB->>API: Forward Request
    API->>Auth: Validate Token
    Auth-->>API: Token Valid
    API->>Cache: Check Cache
    alt Cache Hit
        Cache-->>API: Return Cached Data
    else Cache Miss
        API->>DB: Query Database
        DB-->>API: Return Data
        API->>Cache: Store in Cache
    end
    API->>External: External API Calls (if needed)
    External-->>API: External Data
    API-->>Client: JSON Response
```

### WebSocket Flow Pattern
```mermaid
sequenceDiagram
    participant Client
    participant WS as WebSocket Server
    participant Redis as Redis PubSub
    participant Agent as Sub-Agents
    
    Client->>WS: WebSocket Connection
    WS->>Redis: Subscribe to Channels
    Agent->>Redis: Publish Updates
    Redis->>WS: Forward Updates
    WS->>Client: Real-time Data
```

### Background Task Flow
```mermaid
sequenceDiagram
    participant API
    participant Queue as Celery Queue
    participant Worker as Celery Worker
    participant DB as Database
    participant External as External Services
    
    API->>Queue: Queue Background Task
    Queue->>Worker: Assign Task
    Worker->>DB: Update Database
    Worker->>External: Call External APIs
    Worker->>Queue: Task Complete
    Queue->>API: Notify Completion
```

## Security Architecture

### Authentication & Authorization
```mermaid
graph TB
    subgraph "Authentication Layer"
        LOGIN[User Login]
        SUPABASE[Supabase Auth]
        JWT[JWT Generation]
        COOKIE[HTTPOnly Cookies]
    end
    
    subgraph "Authorization Layer"
        RBAC[Role-Based Access]
        PERMISSIONS[Permission Check]
        MIDDLEWARE[Auth Middleware]
    end
    
    subgraph "Security Controls"
        RATE[Rate Limiting]
        CORS[CORS Policy]
        CSRF[CSRF Protection]
        HEADERS[Security Headers]
    end
    
    LOGIN --> SUPABASE
    SUPABASE --> JWT
    JWT --> COOKIE
    
    COOKIE --> MIDDLEWARE
    MIDDLEWARE --> RBAC
    RBAC --> PERMISSIONS
    
    PERMISSIONS --> RATE
    RATE --> CORS
    CORS --> CSRF
    CSRF --> HEADERS
```

### Security Layers
1. **Transport Security**: HTTPS/TLS encryption for all communications
2. **Authentication**: JWT tokens with httpOnly cookies and refresh token rotation
3. **Authorization**: Role-based access control with granular permissions
4. **Input Validation**: Comprehensive validation using Pydantic schemas
5. **Rate Limiting**: Redis-backed rate limiting with configurable thresholds
6. **CSRF Protection**: Token-based CSRF protection for state-changing operations
7. **XSS Prevention**: Content Security Policy and input sanitization
8. **SQL Injection Prevention**: Parameterized queries via SQLAlchemy ORM

## Sub-Agent System Architecture

### Agent Communication Pattern
```mermaid
graph TB
    subgraph "Agent Orchestration"
        COORDINATOR[Agent Coordinator]
        QUEUE[Message Queue]
        MONITOR[Agent Monitor]
    end
    
    subgraph "Specialized Agents"
        AGENT1[AMP Refactoring<br/>Specialist]
        AGENT2[CodeRabbit<br/>Integration]
        AGENT3[Pieces Knowledge<br/>Manager]
        AGENT4[Health Monitor<br/>Agent]
        AGENT5[Documentation<br/>Agent]
    end
    
    subgraph "Shared Resources"
        CONTEXT[Shared Context]
        TOOLS[Common Tools]
        STORAGE[Agent Storage]
    end
    
    COORDINATOR <--> QUEUE
    COORDINATOR --> MONITOR
    
    QUEUE <--> AGENT1
    QUEUE <--> AGENT2
    QUEUE <--> AGENT3
    QUEUE <--> AGENT4
    QUEUE <--> AGENT5
    
    AGENT1 <--> CONTEXT
    AGENT2 <--> CONTEXT
    AGENT3 <--> CONTEXT
    AGENT4 <--> CONTEXT
    AGENT5 <--> CONTEXT
    
    CONTEXT <--> TOOLS
    TOOLS <--> STORAGE
```

### Agent Capabilities

#### Agent 1: AMP Refactoring Specialist
- **Purpose**: Automated code optimization and performance enhancement
- **Capabilities**: Code analysis, refactoring recommendations, performance optimization
- **Integration**: GitHub webhooks, CI/CD pipeline integration
- **Output**: Pull requests with optimized code, performance reports

#### Agent 2: CodeRabbit Integration
- **Purpose**: Automated code review and quality assurance
- **Capabilities**: Code review automation, security scanning, compliance checking
- **Integration**: GitHub API, code quality tools
- **Output**: Code review comments, quality reports, security alerts

#### Agent 3: Pieces Knowledge Manager
- **Purpose**: Code snippet and knowledge management
- **Capabilities**: Code snippet extraction, documentation generation, knowledge base management
- **Integration**: IDE plugins, documentation systems
- **Output**: Organized code snippets, documentation updates, knowledge articles

#### Agent 4: Enhanced Health Monitor
- **Purpose**: System monitoring and alerting
- **Capabilities**: Performance monitoring, anomaly detection, automated alerting
- **Integration**: Monitoring tools, notification systems
- **Output**: Health reports, performance alerts, system recommendations

#### Agent 5: Documentation Agent
- **Purpose**: Comprehensive documentation management
- **Capabilities**: Documentation generation, API documentation, deployment guides
- **Integration**: Code repositories, documentation platforms
- **Output**: Updated documentation, API references, deployment guides

## Database Architecture

### Database Schema Overview
```mermaid
erDiagram
    User ||--o{ Organization : belongs_to
    Organization ||--o{ Campaign : has
    Campaign ||--o{ CampaignMetrics : has
    User ||--o{ UserSession : has
    Campaign ||--o{ Alert : triggers
    Organization ||--o{ Document : owns
    Document ||--o{ DocumentEmbedding : has
    User ||--o{ ApiKey : manages
    Campaign ||--o{ WebhookEvent : generates
    
    User {
        uuid id
        string email
        string name
        string role
        timestamp created_at
        timestamp last_login
    }
    
    Organization {
        uuid id
        string name
        string type
        string status
        timestamp created_at
    }
    
    Campaign {
        uuid id
        string name
        string platform
        string status
        decimal budget
        timestamp start_date
        timestamp end_date
    }
    
    CampaignMetrics {
        uuid id
        uuid campaign_id
        integer impressions
        integer clicks
        decimal spend
        timestamp recorded_at
    }
    
    Alert {
        uuid id
        string title
        string severity
        string status
        timestamp created_at
    }
    
    Document {
        uuid id
        string title
        text content
        string category
        timestamp created_at
    }
    
    DocumentEmbedding {
        uuid id
        uuid document_id
        vector embedding
        string model
        timestamp created_at
    }
```

### Caching Strategy
```mermaid
graph TB
    subgraph "Cache Layers"
        L1[Application Cache<br/>In-Memory]
        L2[Redis Cache<br/>Distributed]
        L3[Database<br/>PostgreSQL]
    end
    
    subgraph "Cache Patterns"
        READ[Read Through]
        WRITE[Write Behind]
        INVALIDATE[Cache Invalidation]
    end
    
    REQUEST[API Request] --> L1
    L1 --> L2
    L2 --> L3
    
    L1 <--> READ
    L2 <--> WRITE
    L3 <--> INVALIDATE
```

### Cache Configuration
- **L1 Cache**: In-memory application cache with 5-minute TTL
- **L2 Cache**: Redis distributed cache with intelligent TTL policies
- **Cache Keys**: Hierarchical naming with environment prefixes
- **Invalidation**: Event-driven cache invalidation with pub/sub patterns
- **Monitoring**: Cache hit ratio monitoring and alerting

## Performance & Scalability

### Performance Optimization Strategies
1. **Database Optimization**: Query optimization, indexing, connection pooling
2. **Caching Strategy**: Multi-layer caching with intelligent invalidation
3. **API Optimization**: Response compression, pagination, field selection
4. **Frontend Optimization**: Code splitting, lazy loading, asset optimization
5. **CDN Integration**: Static asset delivery via CDN
6. **Background Processing**: Async task processing for heavy operations

### Scalability Considerations
1. **Horizontal Scaling**: Stateless application design for easy scaling
2. **Database Scaling**: Read replicas, connection pooling, query optimization
3. **Cache Scaling**: Redis cluster for distributed caching
4. **Load Balancing**: Application-level load balancing with health checks
5. **Resource Monitoring**: Automated scaling based on performance metrics
6. **Microservice Ready**: Modular architecture for future service separation

## Monitoring & Observability

### Monitoring Stack
```mermaid
graph TB
    subgraph "Application Monitoring"
        SENTRY[Sentry Error Tracking]
        POSTHOG[PostHog Analytics]
        HEALTH[Health Checks]
    end
    
    subgraph "Infrastructure Monitoring"
        RENDER[Render Metrics]
        REDIS_MON[Redis Monitoring]
        DB_MON[Database Monitoring]
    end
    
    subgraph "Business Monitoring"
        ANALYTICS[Campaign Analytics]
        ALERTS[Crisis Alerts]
        PERFORMANCE[Performance KPIs]
    end
    
    APP[War Room Application] --> SENTRY
    APP --> POSTHOG
    APP --> HEALTH
    
    RENDER --> REDIS_MON
    RENDER --> DB_MON
    
    APP --> ANALYTICS
    APP --> ALERTS
    APP --> PERFORMANCE
```

### Key Metrics
- **Application Metrics**: Response times, error rates, throughput
- **Business Metrics**: Campaign performance, user engagement, system usage
- **Infrastructure Metrics**: CPU usage, memory consumption, database performance
- **Security Metrics**: Authentication failures, rate limit violations, security events

## Deployment Architecture

### Render.com Deployment
```mermaid
graph TB
    subgraph "Render.com Infrastructure"
        SERVICE[Web Service]
        BUILD[Build Environment]
        RUNTIME[Runtime Environment]
    end
    
    subgraph "External Services"
        SUPABASE_DB[(Supabase PostgreSQL)]
        REDIS_CACHE[(Render Redis)]
        EXTERNAL_API[External APIs]
    end
    
    GITHUB[GitHub Repository] --> BUILD
    BUILD --> SERVICE
    SERVICE --> RUNTIME
    
    RUNTIME --> SUPABASE_DB
    RUNTIME --> REDIS_CACHE
    RUNTIME --> EXTERNAL_API
```

### Build Process
1. **Frontend Build**: Vite production build with optimization
2. **Backend Setup**: Python dependencies installation and validation
3. **Asset Generation**: Static asset compilation and minification
4. **Health Validation**: Automated health check verification
5. **Service Deployment**: Blue-green deployment with rollback capability

### Environment Configuration
- **Development**: Local development with mock services
- **Staging**: Production-like environment for testing
- **Production**: Live environment with full external service integration

## Disaster Recovery & Business Continuity

### Backup Strategy
1. **Database Backups**: Automated daily backups with point-in-time recovery
2. **Code Repository**: Distributed version control with multiple replicas
3. **Configuration Backup**: Environment configuration stored in secure vaults
4. **Documentation Backup**: Documentation versioning and archival

### Recovery Procedures
1. **Service Outage**: Automated health checks and service restart
2. **Database Recovery**: Point-in-time recovery from backups
3. **Code Rollback**: Git-based rollback to previous stable version
4. **Configuration Recovery**: Environment variable restoration from secure storage

### Business Continuity
1. **Monitoring**: 24/7 automated monitoring with alerting
2. **Escalation**: Automated escalation procedures for critical issues
3. **Communication**: Status page and stakeholder notification system
4. **Documentation**: Comprehensive runbooks and recovery procedures

---

## Conclusion

The War Room architecture is designed for scalability, performance, and maintainability. The modular design with sub-agent automation provides a robust foundation for campaign management while ensuring security and reliability.

The architecture supports future growth through horizontal scaling, microservice migration, and advanced AI integration capabilities.

---

*Architecture Documentation v1.0 | Last Updated: August 2025 | For War Room Platform*