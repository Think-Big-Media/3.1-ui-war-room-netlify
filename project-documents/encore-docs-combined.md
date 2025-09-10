# Encore TypeScript Documentation - Complete Reference

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Concepts](#concepts)
4. [Application Structure](#application-structure)
5. [Primitives](#primitives)
6. [Development](#development)
7. [Deployment](#deployment)
8. [Observability](#observability)
9. [Tutorials](#tutorials)
10. [CLI Reference](#cli-reference)

---


---
## File: ./cli/cli-reference.md
---

# Encore TypeScript CLI Reference

## Running Commands

### `encore run`
Runs the Encore application with optional flags:
```bash
encore run [--debug] [--watch=true] [--port NUMBER] [flags]
```

**Flags:**
- `--debug`: Enable debug mode
- `--watch`: Enable hot reloading (default: true)
- `--port`: Specify port number (default: 4000)

### `encore test`
Runs application tests, supporting standard test flags:
```bash
encore test ./... [test flags]
```

**Examples:**
```bash
# Run all tests
encore test

# Run tests with coverage
encore test --coverage

# Run specific test file
encore test ./user/user.test.ts
```

### `encore check`
Checks the application for compile-time errors:
```bash
encore check
```

### `encore exec`
Runs executable scripts with the Encore app environment:
```bash
encore exec -- <command>
```

**Example - Database seeding:**
```bash
encore exec -- npx tsx ./seed.ts
```

## App Management Commands

### `encore app clone`
Clone an existing Encore app:
```bash
encore app clone [app-id] [directory]
```

### `encore app create`
Create a new Encore application:
```bash
encore app create [name]
```

**Interactive prompts:**
- App name
- Template selection
- Git repository setup

### `encore app init`
Initialize a new Encore app from an existing repository:
```bash
encore app init [name]
```

### `encore app link`
Link an Encore app with the server:
```bash
encore app link [app-id]
```

## Authentication Commands

### `encore auth login`
Log in to Encore:
```bash
encore auth login
```

### `encore auth logout`
Log out of the current session:
```bash
encore auth logout
```

### `encore auth signup`
Create a new Encore account:
```bash
encore auth signup
```

### `encore auth whoami`
Display the current logged-in user:
```bash
encore auth whoami
```

## Database Management

### `encore db shell`
Connect to a database shell:
```bash
encore db shell <database-name> [--env=<name>]
```

**Examples:**
```bash
# Connect to local development database
encore db shell mydb

# Connect to production database
encore db shell mydb --env=prod
```

### `encore db conn-uri`
Get database connection URI:
```bash
encore db conn-uri <database-name> [--env=<name>] [flags]
```

### `encore db proxy`
Set up a local database proxy:
```bash
encore db proxy [--env=<name>] [flags]
```

### `encore db reset`
Reset database to clean state:
```bash
encore db reset [--env=<name>]
```

## Environment Management

### `encore env list`
List all environments:
```bash
encore env list
```

### `encore env clone`
Clone an environment:
```bash
encore env clone <source-env> <target-env>
```

## Secret Management

### `encore secret set`
Set a secret value:
```bash
encore secret set --type=<type> <key>
```

### `encore secret list`
List all secrets:
```bash
encore secret list [--env=<name>]
```

## Deployment Commands

### `encore deploy`
Deploy to Encore Cloud:
```bash
encore deploy [--env=<name>]
```

### `encore build`
Build application for deployment:
```bash
encore build [docker|executable] [name]
```

**Examples:**
```bash
# Build Docker image
encore build docker my-app

# Build executable
encore build executable my-app
```

## Monitoring Commands

### `encore logs`
Stream application logs:
```bash
encore logs [--env=<name>] [--service=<name>] [flags]
```

**Flags:**
- `--follow`: Follow logs in real-time
- `--level`: Filter by log level
- `--service`: Filter by service name

### `encore daemon`
Manage the Encore daemon:
```bash
encore daemon [start|stop|env]
```

## Development Tools

### `encore gen`
Generate code and documentation:
```bash
encore gen [client|openapi] [flags]
```

**Examples:**
```bash
# Generate TypeScript client
encore gen client --output=./client --lang=typescript

# Generate OpenAPI specification
encore gen openapi --output=./api-spec.json
```

### `encore version`
Display Encore CLI version:
```bash
encore version
```

## Global Flags

Most commands support these global flags:
- `--help`: Show command help
- `--verbose`: Enable verbose output
- `--json`: Output in JSON format (where applicable)

## Configuration

The CLI reads configuration from:
- `~/.encore/auth.json` - Authentication tokens
- `encore.app` - App configuration
- Environment variables

## Getting Help

For detailed help on any command:
```bash
encore <command> --help
```

For general help:
```bash
encore help
```

---
## File: ./concepts/application-model.md
---

# Encore Application Model

## Overview

Encore uses static analysis to understand your application by creating a comprehensive graph that represents how your systems and services communicate. This application model is the foundation of Encore's powerful developer experience.

## How It Works

### Static Analysis Pipeline

```
Your Code → Parser → AST → Application Model → Infrastructure
```

1. **Code Parsing**: Encore parses your TypeScript code
2. **AST Analysis**: Builds an Abstract Syntax Tree
3. **Model Generation**: Creates a complete application model
4. **Infrastructure Provisioning**: Uses model to set up infrastructure

### What Gets Analyzed

```typescript
// This simple code...
export const api = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }) => { ... }
);

// ...becomes a rich model with:
// - API endpoint definition
// - Request/response types
// - Authentication requirements
// - Service dependencies
// - Database connections
```

## The Application Graph

Your application is represented as a directed graph:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  API Gateway │────▶│   Services   │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     Auth     │     │   Database   │
                    └─────────────┘     └─────────────┘
```

### Graph Components

- **Services**: Logical groupings of functionality
- **APIs**: Endpoints and their contracts
- **Resources**: Databases, caches, queues
- **Dependencies**: Service-to-service calls
- **Configuration**: Secrets, environment variables

## Benefits of the Application Model

### 1. 100% Accuracy
Traditional documentation drifts from reality. Encore's model is always accurate because it's derived directly from your code.

### 2. Automatic Documentation
```typescript
// Your code automatically generates:
// - OpenAPI specifications
// - Architecture diagrams
// - Service dependency maps
// - API documentation
```

### 3. Infrastructure as Code (Without Writing Infrastructure Code)
```typescript
// This code...
const db = new SQLDatabase("users");

// ...automatically provisions:
// - Database instance
// - Connection pooling
// - Backup configuration
// - Monitoring setup
```

### 4. Compile-Time Validation
```typescript
// Service A
export const userAPI = api(
  { method: "GET", path: "/user/:id" },
  async ({ id }: { id: string }) => {
    return { id, name: "John" };
  }
);

// Service B
import { userAPI } from "~encore/clients";

// This would fail at compile time if types don't match
const user = await userAPI({ id: 123 }); // Error: id must be string
```

## Standardization Philosophy

### The Problem
Developers make dozens of decisions when creating backend applications:
- Which framework?
- How to structure code?
- How to handle authentication?
- How to manage configuration?
- How to set up testing?

These decisions often stem from personal preference, leading to:
- Inconsistent codebases
- Difficult onboarding
- Technical debt
- Integration challenges

### Encore's Solution
Encore provides opinions on these decisions while maintaining flexibility:

```typescript
// Standard service structure
service/
├── encore.service.ts  // Service definition (standard)
├── api.ts            // API endpoints (standard)
├── db.ts            // Database queries (standard)
└── custom-logic.ts   // Your business logic (flexible)
```

## Modern Best Practices Built-In

### Automatic Implementation of:
- **12-Factor App** principles
- **Microservices** patterns
- **Event-driven** architecture
- **CQRS** when appropriate
- **Circuit breakers** for resilience
- **Distributed tracing** for observability

### Example: Circuit Breaker
```typescript
// Encore automatically adds circuit breakers
const response = await externalService.call();
// If service fails repeatedly, circuit opens automatically
```

## Developer Experience Benefits

### 1. Visual Service Topology
The application model generates real-time service maps:
```
┌──────────┐      ┌──────────┐
│  Users   │─────▶│  Orders  │
└──────────┘      └──────────┘
     │                 │
     ▼                 ▼
┌──────────┐      ┌──────────┐
│    DB    │      │    DB    │
└──────────┘      └──────────┘
```

### 2. API Explorer
- Interactive API testing
- Auto-generated from your code
- Always up-to-date
- Includes authentication

### 3. Dependency Tracking
```typescript
// Encore knows that OrderService depends on UserService
// Updates to UserService API will show impact on OrderService
```

## Infrastructure Generation

The application model drives infrastructure provisioning:

### Development
```bash
encore run
# Automatically provisions:
# - Local PostgreSQL
# - Redis cache
# - Message queues
# - Service discovery
```

### Production
```bash
encore deploy
# Automatically configures:
# - Load balancers
# - Auto-scaling
# - Database clusters
# - CDN distribution
# - Monitoring
```

## Open Source Foundation

The entire system is [Open Source](https://github.com/encoredev/encore):
- Transparent implementation
- Community contributions
- No vendor lock-in
- Extensible architecture

### Contributing
```bash
git clone https://github.com/encoredev/encore
cd encore
# Add new features to the application model
```

## Extending the Model

### Custom Resources
```typescript
// Define custom infrastructure
export class CustomResource {
  constructor(name: string, config: Config) {
    // Encore will include in application model
  }
}
```

### Metadata Annotations
```typescript
// Add metadata to influence model
export const api = api(
  { 
    method: "GET", 
    path: "/users",
    metadata: {
      rateLimit: 100,
      cache: true
    }
  },
  async () => { ... }
);
```

## Real-World Example

```typescript
// This complete service definition...
import { Service } from "encore.dev/service";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { api } from "encore.dev/api";

export default new Service("users");

const db = new SQLDatabase("users", {
  migrations: "./migrations"
});

export const createUser = api(
  { method: "POST", path: "/users", expose: true },
  async (params: CreateUserParams): Promise<User> => {
    const user = await db.queryRow<User>`
      INSERT INTO users (name, email)
      VALUES (${params.name}, ${params.email})
      RETURNING *
    `;
    return user!;
  }
);

// ...generates a complete application model including:
// - Service topology
// - API documentation
// - Database schema
// - Deployment configuration
// - Monitoring setup
// - Security policies
```

## Summary

The Encore Application Model:
1. **Understands** your code through static analysis
2. **Generates** accurate documentation and diagrams
3. **Provisions** infrastructure automatically
4. **Validates** at compile time
5. **Standardizes** best practices
6. **Maintains** accuracy as code evolves

This model is the foundation that enables Encore to provide a revolutionary developer experience while maintaining the flexibility to build any type of application.

---
## File: ./concepts/benefits.md
---

# Benefits of using Encore.ts

## Integrated Developer Experience for Enhanced Productivity

Encore.ts offers a complete development platform that dramatically improves productivity:

### Local Development with Instant Infrastructure
- Infrastructure automatically provisions during development
- No manual Docker compose or service configuration
- Databases, pub/sub, and caching work out of the box
- Hot reload across all services

### Rapid Feedback Loop
- Catch issues at compile time with type-safe infrastructure
- Instant API documentation generation
- Real-time distributed tracing in development
- Automatic request/response validation

### No Manual Configuration Required
- Code serves as the single source of truth
- Infrastructure inferred from your application code
- No YAML files or configuration drift
- Convention over configuration approach

### Unified Codebase
- One codebase works across all environments
- Same code runs locally, in preview, and production
- No environment-specific configuration files
- Seamless deployment pipeline

## High-Performance Rust Runtime

Encore's secret weapon is its Rust-powered runtime that handles all infrastructure concerns:

### Performance Benefits
- **9x increased throughput** compared to standard Node.js
- **85% reduced latency** for API responses
- Multi-threaded request processing
- Zero-overhead infrastructure abstractions

### Architecture
```
┌─────────────────┐     ┌──────────────────┐
│   Your Code     │────▶│  Rust Runtime    │
│   (Node.js)     │     │  (Infrastructure) │
└─────────────────┘     └──────────────────┘
        ↓                        ↓
   Business Logic          - Request routing
                          - Connection pooling
                          - Auth validation
                          - Distributed tracing
```

### Security Benefits
- **Zero NPM dependencies** for core infrastructure
- Reduced attack surface
- Memory-safe Rust implementation
- Built-in security best practices

## Enhanced Type Safety

Static analysis provides unprecedented safety and developer experience:

### Compile-Time Validation
```typescript
// This would fail at compile time if types don't match
export const createUser = api(
  { method: "POST", path: "/users" },
  async (params: CreateUserParams): Promise<User> => {
    // TypeScript ensures params and return match declared types
    return await userService.create(params);
  }
);
```

### Benefits
- API contracts enforced at compile time
- Automatic request/response validation
- Type-safe service-to-service calls
- Eliminates entire classes of runtime errors

## DevOps Automation

Encore handles the complex parts of deployment and operations:

### Infrastructure as Code (Without the Code)
```typescript
// This simple code...
const db = new SQLDatabase("myapp", {
  migrations: "./migrations",
});

// ...automatically provisions:
// - PostgreSQL database
// - Connection pooling
// - Migration management
// - Backup configuration
// - Monitoring and metrics
```

### Deployment Options
1. **Encore Cloud** - Fully managed platform
2. **Self-Hosting** - Docker images for any platform
3. **Major Clouds** - AWS, GCP, Azure support

### What You Don't Need to Learn
- ❌ Kubernetes
- ❌ Terraform
- ❌ Docker Compose
- ❌ Service Mesh
- ❌ API Gateway configuration
- ❌ Load balancer setup

## Cloud Flexibility

Avoid vendor lock-in while using cloud services:

### Multi-Cloud Support
```typescript
// Same code works on any cloud
const bucket = new Bucket("uploads");

// Encore handles provider-specific implementation:
// - AWS S3
// - Google Cloud Storage  
// - Azure Blob Storage
```

### Gradual Migration Path
- Start with Encore's abstractions
- Reference cloud services directly when needed
- Mix Encore and native cloud resources
- Full access to cloud provider consoles

## Developer Experience Benefits

### Local Development Dashboard
- Visual service topology
- Live request tracing
- API documentation
- Database explorer
- Real-time logs

### Automatic Documentation
```typescript
// Your API definition...
export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    return await fetchUser(id);
  }
);

// ...automatically generates OpenAPI docs
```

### Testing Made Simple
```typescript
describe("User Service", () => {
  test("creates user", async () => {
    // Each test gets isolated infrastructure
    const user = await createUser({ 
      name: "Test" 
    });
    
    expect(user.id).toBeDefined();
    // Database automatically cleaned up
  });
});
```

## Real-World Impact

### Before Encore
- 2-3 days to set up new service
- Complex Docker/Kubernetes configs
- Manual API documentation
- Slow local development
- DevOps bottlenecks

### After Encore
- 5 minutes to new service
- Zero configuration
- Automatic documentation
- Instant local development
- Developers own deployment

## Cost Benefits

### Reduced Operational Overhead
- Fewer DevOps engineers needed
- Less time on infrastructure
- Reduced cloud costs through optimization
- No additional tooling licenses

### Faster Time to Market
- Ship features in hours, not weeks
- Rapid prototyping and iteration
- Quick pivot capability
- Reduced technical debt

## Summary

Encore.ts provides:

1. **Productivity** - 5-10x faster development
2. **Performance** - 9x throughput improvement  
3. **Safety** - Type-safe infrastructure
4. **Simplicity** - No DevOps complexity
5. **Flexibility** - Use any cloud, avoid lock-in
6. **Cost-Effective** - Reduce operational overhead

Perfect for:
- Startups needing to move fast
- Teams without DevOps expertise
- Projects requiring high performance
- Applications needing to scale
- Companies wanting cloud flexibility

---
## File: ./concepts/hello-world.md
---

# Hello World in Encore.ts

Encore enables developers to create type-safe, idiomatic TypeScript API endpoints with minimal boilerplate. Here's a simple Hello World example:

## Defining an API Endpoint

```typescript
import { api } from "encore.dev/api";

export const get = api(
 { expose: true, method: "GET", path: "/hello/:name" },
 async ({ name }: { name: string }): Promise<Response> => {
   const msg = `Hello ${name}!`;
   return { message: msg };
 }
);

interface Response {
 message: string;
}
```

## Key Features

Encore provides several key capabilities:
- Automatically parses and validates incoming requests
- Generates necessary boilerplate at compile-time
- Enables creating production-ready services in under 10 lines of code

## Getting Started

The framework supports adding various primitives easily, including:
- Services
- APIs
- Databases
- Cron Jobs
- Pub/Sub
- Secrets

## Example Project

You can create a Hello World example using the Encore CLI:

```bash
$ encore app create --example=ts/hello-world
```

A getting started video is also available to help developers understand the basics of Encore.ts.

---
## File: ./deploy/environments.md
---

# Encore Deployment Environments

## Overview

Encore provides comprehensive environment management for deploying applications across different stages of the development lifecycle. Each environment is isolated with its own resources, configurations, and data.

## Environment Types

### Development Environment
- **Local development**: Runs on your machine with `encore run`
- **Hot reloading**: Automatic code reloading during development
- **Local dashboard**: Built-in development tools and API explorer
- **Ephemeral databases**: Automatically created and managed

### Staging/Preview Environments
- **Pull request previews**: Automatic environment creation for PRs
- **Integration testing**: Safe environment for testing changes
- **Shared staging**: Stable environment for team collaboration
- **Production-like**: Mirrors production configuration

### Production Environment
- **High availability**: Redundant infrastructure and failover
- **Monitoring**: Comprehensive observability and alerting
- **Scaling**: Automatic scaling based on traffic
- **Security**: Enhanced security controls and access management

## Environment Configuration

### Environment Variables

Configure environment-specific settings:

```typescript
// Access environment variables
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.EXTERNAL_API_KEY;
```

### Secrets Management

Store sensitive configuration securely:

```bash
# Set secrets for specific environment
encore secret set --env=prod DATABASE_PASSWORD
encore secret set --env=staging STRIPE_SECRET_KEY

# List secrets
encore secret list --env=prod
```

### Service Configuration

Environment-specific service configuration:

```typescript
// encore.service.ts
import { Service } from "encore.dev/service";

export default new Service("myservice", {
  // Environment-specific middleware
  middlewares: process.env.NODE_ENV === 'production' ? [authMiddleware] : []
});
```

## Deployment Strategies

### Automatic Deployment

```bash
# Deploy to default environment
git push encore

# Deploy to specific environment
encore deploy --env=staging
```

### Manual Deployment

```bash
# Deploy specific branch to environment
encore deploy --env=prod --branch=release-v1.2.0

# Deploy with custom message
encore deploy --env=prod --message="Hotfix for payment processing"
```

### Preview Environments

Automatic preview environments for pull requests:
- Created automatically on PR creation
- Updated on each commit
- Destroyed when PR is closed
- Full isolation from other environments

## Environment Management

### Creating Environments

```bash
# Create new environment
encore env create staging

# Clone existing environment configuration
encore env clone prod staging
```

### Environment Configuration

```bash
# List all environments
encore env list

# View environment details
encore env show prod

# Update environment settings
encore env configure prod
```

### Database Management

Each environment has isolated databases:

```bash
# Connect to environment database
encore db shell mydb --env=prod

# Get connection string
encore db conn-uri mydb --env=staging

# Reset development database
encore db reset --env=dev
```

## Environment Isolation

### Resource Separation
- **Databases**: Completely isolated per environment
- **Object storage**: Separate buckets/containers
- **Secrets**: Environment-specific secret stores
- **Logs**: Isolated logging and monitoring

### Network Isolation
- **VPC separation**: Production networks isolated
- **Security groups**: Environment-specific access controls
- **Load balancers**: Dedicated load balancing per environment

## Monitoring and Observability

### Environment-Specific Monitoring

```bash
# View logs for specific environment
encore logs --env=prod --service=payment

# Stream logs in real-time
encore logs --env=staging --follow
```

### Performance Monitoring
- **Metrics**: Environment-specific performance metrics
- **Alerts**: Custom alerting per environment
- **Tracing**: Distributed tracing with environment context

## Best Practices

### Environment Promotion
1. **Development**: Local development and testing
2. **Staging**: Integration testing and QA
3. **Production**: Live user traffic

### Configuration Management
- Use environment variables for configuration
- Store secrets securely with `encore secret`
- Avoid hardcoding environment-specific values
- Test configuration changes in staging first

### Deployment Safety
- **Gradual rollouts**: Deploy to staging before production
- **Health checks**: Verify deployment success
- **Rollback capability**: Quick rollback for issues
- **Database migrations**: Test migrations in staging

### Security Considerations
- **Access controls**: Restrict production access
- **Audit logging**: Track all production changes
- **Secret rotation**: Regular secret updates
- **Compliance**: Meet regulatory requirements per environment

## Advanced Features

### Custom Domains
```bash
# Configure custom domain for environment
encore env domain set --env=prod api.mycompany.com
```

### Auto-scaling Configuration
Environment-specific scaling rules:
- **Development**: Minimal resources
- **Staging**: Moderate scaling for testing
- **Production**: Aggressive scaling for performance

### Backup and Recovery
- **Automated backups**: Scheduled database backups
- **Point-in-time recovery**: Restore to specific timestamps
- **Cross-environment restore**: Restore production data to staging

## Troubleshooting

### Common Issues
- **Environment access**: Check permissions and authentication
- **Configuration drift**: Verify environment-specific settings
- **Resource limits**: Monitor resource usage and limits

### Debugging Tools
```bash
# Check environment status
encore env status --env=prod

# Validate configuration
encore check --env=staging

# Debug deployment issues
encore deploy --env=prod --verbose
```

---
## File: ./develop/auth.md
---

# Authentication

Encore provides a flexible authentication system that integrates seamlessly with your API endpoints.

## Overview

Authentication in Encore involves:
1. Defining an authentication handler
2. Validating credentials
3. Protecting API endpoints
4. Accessing auth data in your code

## Setting Up Authentication

### Create an Auth Handler

Create an auth handler in your application:

```typescript
// auth/auth.ts
import { Header, Gateway, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

// Define what parameters to extract from the request
interface AuthParams {
  authorization: Header<"Authorization">;
}

// Define the authentication data structure
interface AuthData {
  userID: string;
  email: string;
  role: "admin" | "user";
}

// Create the authentication handler
export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const token = params.authorization;
    
    // Validate the token (example)
    if (!token || !token.startsWith("Bearer ")) {
      throw APIError.unauthenticated("Invalid authorization header");
    }
    
    const jwt = token.substring(7); // Remove "Bearer " prefix
    
    // Verify JWT and extract user data (implement your logic)
    const userData = await verifyJWT(jwt);
    
    if (!userData) {
      throw APIError.unauthenticated("Invalid token");
    }
    
    // Return the authenticated user data
    return {
      userID: userData.id,
      email: userData.email,
      role: userData.role,
    };
  }
);
```

### Configure the API Gateway

Register your auth handler with the gateway:

```typescript
// auth/gateway.ts
import { Gateway } from "encore.dev/api";
import { auth } from "./auth";

export const gateway = new Gateway({
  authHandler: auth,
});
```

## Protecting Endpoints

### Require Authentication

Set `auth: true` on endpoints that require authentication:

```typescript
import { api } from "encore.dev/api";

// This endpoint requires authentication
export const getProfile = api(
  { method: "GET", path: "/profile", auth: true },
  async () => {
    // Only authenticated users can access this
    return { profile: "data" };
  }
);

// This endpoint is public
export const getPublicInfo = api(
  { method: "GET", path: "/public" },
  async () => {
    return { info: "public data" };
  }
);
```

## Accessing Auth Data

### In API Endpoints

Use `getAuthData()` to access authentication data:

```typescript
import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export const getCurrentUser = api(
  { method: "GET", path: "/me", auth: true },
  async () => {
    const authData = getAuthData()!; // Non-null because auth: true
    
    return {
      userID: authData.userID,
      email: authData.email,
      role: authData.role,
    };
  }
);
```

### In Service Functions

Auth data is available in any function called from an authenticated endpoint:

```typescript
// services/user.ts
import { getAuthData } from "~encore/auth";

export async function getUserPreferences() {
  const authData = getAuthData();
  
  if (!authData) {
    throw new Error("Not authenticated");
  }
  
  // Fetch preferences for the authenticated user
  const prefs = await db.queryRow`
    SELECT * FROM preferences 
    WHERE user_id = ${authData.userID}
  `;
  
  return prefs;
}
```

## JWT Authentication Example

Complete JWT implementation:

```typescript
// auth/jwt.ts
import jwt from "jsonwebtoken";
import { APIError } from "encore.dev/api";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  id: string;
  email: string;
  role: "admin" | "user";
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export function createJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}
```

### Login Endpoint

```typescript
import { api } from "encore.dev/api";
import { createJWT } from "./jwt";

interface LoginParams {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const login = api(
  { method: "POST", path: "/auth/login", expose: true },
  async (params: LoginParams): Promise<LoginResponse> => {
    // Verify credentials (implement your logic)
    const user = await verifyCredentials(params.email, params.password);
    
    if (!user) {
      throw APIError.unauthenticated("Invalid credentials");
    }
    
    // Create JWT token
    const token = createJWT({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
);
```

## API Key Authentication

Alternative authentication using API keys:

```typescript
import { Header, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

interface ApiKeyAuth {
  apiKey: Header<"X-API-Key">;
}

interface ApiKeyData {
  clientID: string;
  permissions: string[];
}

export const apiKeyAuth = authHandler<ApiKeyAuth, ApiKeyData>(
  async (params) => {
    const key = params.apiKey;
    
    if (!key) {
      throw APIError.unauthenticated("Missing API key");
    }
    
    // Look up API key in database
    const client = await db.queryRow`
      SELECT id, permissions 
      FROM api_clients 
      WHERE api_key = ${key} AND active = true
    `;
    
    if (!client) {
      throw APIError.unauthenticated("Invalid API key");
    }
    
    return {
      clientID: client.id,
      permissions: client.permissions,
    };
  }
);
```

## Role-Based Access Control

Implement RBAC in your endpoints:

```typescript
import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

// Helper function to check roles
function requireRole(role: string) {
  const authData = getAuthData();
  
  if (!authData || authData.role !== role) {
    throw APIError.permissionDenied("Insufficient permissions");
  }
}

// Admin-only endpoint
export const adminEndpoint = api(
  { method: "POST", path: "/admin/users", auth: true },
  async (params: CreateUserParams) => {
    requireRole("admin");
    
    // Only admins can create users
    return createUser(params);
  }
);
```

## Testing Authentication

### Mocking Auth in Tests

```typescript
import { describe, test, expect, vi } from "vitest";
import * as auth from "~encore/auth";
import { getCurrentUser } from "./api";

describe("Auth Tests", () => {
  test("getCurrentUser returns auth data", async () => {
    // Mock the auth data
    vi.spyOn(auth, "getAuthData").mockReturnValue({
      userID: "test-user",
      email: "test@example.com",
      role: "user",
    });
    
    const result = await getCurrentUser();
    
    expect(result.userID).toBe("test-user");
    expect(result.email).toBe("test@example.com");
  });
});
```

### Testing Protected Endpoints

```typescript
import { describe, test, expect } from "vitest";
import { api } from "./api";

describe("Protected Endpoints", () => {
  test("requires authentication", async () => {
    // Test without auth
    await expect(api.protectedEndpoint({}))
      .rejects
      .toThrow("unauthenticated");
    
    // Test with auth
    const result = await api.protectedEndpoint({}, {
      authData: {
        userID: "test",
        email: "test@example.com",
        role: "user",
      },
    });
    
    expect(result).toBeDefined();
  });
});
```

## Cross-Service Authentication

Auth data automatically propagates across service calls:

```typescript
// users service
import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { posts } from "~encore/clients";

export const getUserPosts = api(
  { method: "GET", path: "/my-posts", auth: true },
  async () => {
    const authData = getAuthData()!;
    
    // Auth data automatically propagates to posts service
    const userPosts = await posts.listByUser({
      userID: authData.userID,
    });
    
    return userPosts;
  }
);
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store secrets securely** using Encore's secrets management
3. **Implement rate limiting** for auth endpoints
4. **Use strong JWT secrets** and rotate them regularly
5. **Validate and sanitize** all inputs
6. **Log authentication attempts** for security monitoring
7. **Implement token refresh** for long-lived sessions
8. **Use secure cookies** for web applications

## Common Patterns

### Refresh Tokens

```typescript
export const refresh = api(
  { method: "POST", path: "/auth/refresh", expose: true },
  async ({ refreshToken }: { refreshToken: string }) => {
    // Verify refresh token
    const userData = await verifyRefreshToken(refreshToken);
    
    if (!userData) {
      throw APIError.unauthenticated("Invalid refresh token");
    }
    
    // Issue new access token
    const accessToken = createJWT(userData);
    
    return { accessToken };
  }
);
```

### Session Management

```typescript
// Store sessions in database
export const createSession = async (userID: string) => {
  const sessionID = generateSessionID();
  
  await db.exec`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionID}, ${userID}, NOW() + INTERVAL '7 days')
  `;
  
  return sessionID;
};
```

## Related Topics

- [API Endpoints](../primitives/defining-apis.md)
- [Secrets Management](../primitives/secrets.md)
- [Testing](./testing.md)
- [Middleware](./middleware.md)

---
## File: ./develop/middleware.md
---

# Encore TypeScript Middleware Guide

## Overview

Middleware in Encore.ts is a powerful mechanism for "writing reusable code that runs before, after, or both before and after the handling of API requests".

## Key Concepts

### Middleware Functions

```typescript
import { middleware } from "encore.dev/api";

export default new Service("myService", {
  middlewares: [
    middleware({ target: { auth: true } }, async (req, next) => {
      // Pre-processing logic
      const resp = await next(req);
      // Post-processing logic
      return resp;
    })
  ]
});
```

### Core Characteristics

- Runs in a chain of middleware functions
- Can process requests before and after API handler execution
- Supports targeting specific endpoint types

### Request Handling

Middleware can access different request types:
- Typed API endpoints via `req.requestMeta`
- Streaming endpoints via `req.stream`
- Raw endpoints via `req.rawRequest` and `req.rawResponse`

### Data Passing

You can pass data between middleware and API handlers using `req.data`:

```typescript
const mw = middleware(async (req, next) => {
  req.data.myMiddlewareData = { some: "data" };
  return await next(req);
});

export const endpoint = api(
  { expose: true, method: "GET", path: "/example" },
  async () => {
    const callMeta = currentRequest() as APICallMeta;
    const middlewareData = callMeta.middlewareData?.myMiddlewareData;
  }
);
```

### Middleware Ordering

Middlewares execute in the order they are defined in the service configuration.

### Targeting APIs

Middleware can be precisely targeted using options like:
- `tags`: Apply to endpoints with specific tags
- `expose`: Target exposed/non-exposed endpoints
- `auth`: Apply to authenticated/non-authenticated endpoints
- `isRaw`: Target raw endpoints
- `isStream`: Target streaming endpoints

## Common Middleware Patterns

### Authentication Middleware

```typescript
const authMiddleware = middleware(
  { target: { auth: true } },
  async (req, next) => {
    const token = req.headers?.authorization;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }
    
    const user = await validateToken(token);
    req.data.user = user;
    
    return await next(req);
  }
);
```

### Logging Middleware

```typescript
const loggingMiddleware = middleware(async (req, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.path} started`);
  
  const resp = await next(req);
  
  const duration = Date.now() - start;
  console.log(`${req.method} ${req.path} completed in ${duration}ms`);
  
  return resp;
});
```

### Rate Limiting Middleware

```typescript
const rateLimitMiddleware = middleware(async (req, next) => {
  const clientIP = req.headers?.['x-forwarded-for'] || req.remoteAddr;
  
  if (await isRateLimited(clientIP)) {
    throw APIError.resourceExhausted("rate limit exceeded");
  }
  
  return await next(req);
});
```

## Best Practices

- Use `target` option for performance optimization
- Leverage middleware for cross-cutting concerns like logging, authentication, and tracing
- Keep middleware focused and composable
- Order middleware thoughtfully based on dependencies
- Use `req.data` for passing context between middleware and handlers

---
## File: ./develop/testing.md
---

# Automated Testing in Encore TypeScript

## Overview

Encore provides built-in testing tools designed to simplify application testing across various test runners. The core testing workflow involves:

1. Configuring the test command in `package.json`
2. Setting up your preferred test runner
3. Running tests via `encore test`

## Recommended Test Runner: Vitest

### Why Vitest?

Vitest offers key advantages:
- Fast test execution
- Native ESM and TypeScript support
- Jest API compatibility

### Setup Steps

#### Configuration Files

1. Create `vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
 resolve: {
   alias: {
     "~encore": path.resolve(__dirname, "./encore.gen"),
   },
 },
});
```

2. Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

#### Optional VS Code Integration

1. Install Vitest VS Code extension
2. Add to `.vscode/settings.json`:

```json
{
  "vitest.commandLine": "encore test"
}
```

## Testing Best Practices

### Integration Testing Focus

Encore recommends integration testing because:
- Minimal boilerplate code
- Business logic often involves databases and inter-service API calls
- Integration tests provide more comprehensive verification

### Test Environment Optimizations

Encore automatically:
- Creates separate test databases
- Optimizes database performance by:
  - Skipping `fsync`
  - Using in-memory filesystems
  - Removing durability overhead

These optimizations make integration tests nearly as performant as unit tests.

## Example Test Structure

```typescript
import { describe, expect, test } from "vitest";
import { createUser, getUser } from "./user";

describe("User Service", () => {
  test("create and retrieve user", async () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com"
    };
    
    const created = await createUser(userData);
    expect(created.name).toBe(userData.name);
    
    const retrieved = await getUser(created.id);
    expect(retrieved.email).toBe(userData.email);
  });
});
```

## Key Testing Principles

- Prioritize integration over unit tests
- Leverage Encore's built-in infrastructure setup
- Use Vitest for efficient, TypeScript-friendly testing
- Focus on testing actual business logic and service interactions
- Take advantage of automatic database provisioning and cleanup

---
## File: ./index.md
---

# Encore TypeScript Documentation

## Get Started
- [Installation](Environment%20Setup/encore-docs/install.md)
- [Quick Start](quick-start.md)
- [FAQ](./faq.md)

## Concepts
- [Benefits](benefits.md)
- [Application Model](application-model.md)
- [Hello World](hello-world.md)

## Tutorials
- [Building a REST API](rest-api.md)
- [Building an Uptime Monitor](uptime.md)
- [Building a GraphQL API](graphql.md)
- [Building a Slack bot](slack-bot.md)

## Primitives

### App Structure
- [App Structure](app-structure.md)
- [Services](services.md)

### APIs
- [Defining APIs](defining-apis.md)
- [Validation](validation.md)
- [API Calls](api-calls.md)
- [Raw Endpoints](./primitives/raw-endpoints.md)
- [GraphQL](./primitives/graphql.md)
- [Streaming APIs](streaming-apis.md)
- [API Errors](errors.md)
- [Static Assets](./primitives/static-assets.md)
- [Cookies](./primitives/cookies.md)

### Data Storage
- [Databases](databases.md)
- [PostgreSQL Extensions](./primitives/databases-extensions.md)
- [Object Storage](object-storage.md)

### Background Tasks
- [Cron Jobs](cron-jobs.md)
- [Pub/Sub](pubsub.md)

### Configuration
- [Secrets](Environment%20Setup/encore-docs/primitives/secrets.md)

## Development
- [Authentication](auth.md)
- [Testing](testing.md)
- [Middleware](middleware.md)
- [Migration Guide](./develop/migration.md)

## Deployment
- [Environments](environments.md)
- [Infrastructure](./deploy/infrastructure.md)
- [CI/CD](./deploy/ci-cd.md)

## Observability
- [Development Dashboard](./observability/dev-dash.md)
- [Logging](logging.md)
- [Tracing](tracing.md)
- [Metrics](./observability/metrics.md)

## CLI Reference
- [CLI Commands](cli-reference.md)

## Self-Hosting
- [Docker](./self-host/docker.md)
- [Kubernetes](./self-host/kubernetes.md)

---

*Documentation downloaded from https://encore.dev/docs/ts*
*Last updated: 2025-08-22*

---
## File: ./install.md
---

# Installation

If you are new to Encore, we recommend following the [quick start guide](quick-start.md).

## Install the Encore CLI

To develop locally with Encore, you first need to install the Encore CLI. This provisions your local development environment and runs the Local Development Dashboard.

### Installation Methods

#### macOS (Brew)
```bash
$ brew install encoredev/tap/encore
```

#### Linux
```bash
$ curl -L https://encore.dev/install.sh | bash
```

#### Windows (WSL)
```bash
$ iwr https://encore.dev/install.ps1 | iex
```

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) version 18+ is required to run Encore.ts apps
- [Docker](https://www.docker.com) is required for setting up local databases

### Optional: LLM Instructions

To help LLM tools understand Encore, you can add pre-made instructions:

1. Download [ts_llm_instructions.txt](https://github.com/encoredev/encore/blob/main/ts_llm_instructions.txt)

2. Usage options:
   - Cursor: Rename to `.cursorrules`
   - GitHub Copilot: Paste in `.github/copilot-instructions.md`
   - Other tools: Place in app root

### Build from Source

If you prefer building from source, [follow these instructions](https://github.com/encoredev/encore/blob/main/CONTRIBUTING.md).

## Update to Latest Version

Check your current version:
```bash
encore version
```

Expected output will look like:
```
encore version v1.28.0
```

To update, run:
```bash
encore version update
```

## Verify Installation

After installation, verify everything is working:
```bash
encore daemon
```

This starts the Encore daemon which manages your local development environment.

---
## File: ./observability/logging.md
---

# Encore Structured Logging for TypeScript

## Overview

Encore provides a robust structured logging system that combines free-form messages with type-safe key-value pairs, enabling comprehensive application observability.

## Key Features

### Logging Levels

Encore supports multiple log levels:
- `error`
- `warn`
- `info`
- `debug`
- `trace`

### Basic Usage

```typescript
import log from "encore.dev/log";

// Simple logging
log.info("log message", { is_subscriber: true });
log.error(err, "something went terribly wrong!");
```

### Advanced Logging Patterns

#### Persistent Logger

Create a logger with consistent metadata:

```typescript
const logger = log.with({ is_subscriber: true });
logger.info("user logged in", { login_method: "oauth" });
```

#### Contextual Logging

```typescript
// Log with multiple context fields
log.info("payment processed", {
  user_id: "12345",
  amount: 99.99,
  currency: "USD",
  payment_method: "stripe"
});
```

#### Error Logging

```typescript
try {
  await processPayment();
} catch (error) {
  log.error(error, "payment processing failed", {
    user_id: userId,
    amount: paymentAmount
  });
  throw error;
}
```

## Integration Features

- Automatically integrated with distributed tracing
- Logs are included in active traces
- Simplifies application debugging

## Live Log Streaming

Stream logs directly to your terminal across environments:

```bash
$ encore logs --env=prod
```

### Filtering Logs

```bash
# Filter by service
$ encore logs --service=payment

# Filter by level
$ encore logs --level=error

# Follow logs in real-time
$ encore logs --follow
```

## Structured Data Examples

### User Activity Logging

```typescript
const userLogger = log.with({ 
  service: "user-management",
  component: "authentication" 
});

userLogger.info("user login attempt", {
  user_id: user.id,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  success: true
});
```

### API Performance Logging

```typescript
const apiLogger = log.with({ service: "api-gateway" });

apiLogger.info("api request completed", {
  method: req.method,
  path: req.path,
  duration_ms: duration,
  status_code: response.status,
  user_id: req.user?.id
});
```

## Best Practices

- Use structured logging for better log analysis
- Include relevant context in log metadata
- Leverage different log levels appropriately
- Use persistent loggers for repeated context
- Avoid logging sensitive information (passwords, tokens)
- Include correlation IDs for request tracing

## Benefits

- Computer-parsable log format
- Easy filtering and searching
- Simplified debugging
- Comprehensive application insights
- Automatic trace correlation

---
## File: ./observability/tracing.md
---

# Distributed Tracing in Encore

## Overview

Distributed tracing is a powerful observability technique that helps developers understand complex application behaviors across multiple services. Encore provides an automated tracing solution with unique capabilities:

## Key Concepts

### What is Distributed Tracing?

"Tracing is a revolutionary way to gain insight into what your applications are doing. It works by capturing the series of events as they occur during the execution of your code."

### Trace Propagation

Traces work by:
- Generating a unique trace ID
- Propagating this ID across different system components
- Correlating events to create an end-to-end view of request processing

## Encore's Tracing Features

### Comprehensive Insights

Encore captures detailed trace information including:
- Stack traces
- Structured logging
- HTTP requests
- Network connection details
- API calls
- Database queries

### Automatic Instrumentation

"Encore automatically captures traces for your entire application – in all environments."

Benefits of automatic tracing:
- No manual instrumentation required
- Consistent trace collection
- Zero-configuration setup
- Complete request lifecycle visibility

### Development and Production Support

Traces can be viewed in:
- Local Development Dashboard
- Encore Cloud dashboard for production environments

## Trace Data Collection

### Request/Response Capture

Encore automatically captures:
- Request payloads
- Response data
- Headers and metadata
- Timing information

### Database Operations

Automatic tracking of:
- SQL queries
- Query parameters
- Execution times
- Connection details

### Service Communications

Monitor:
- Inter-service API calls
- Message passing
- External API requests
- Network latency

## Sensitive Data Handling

"Encore's tracing automatically captures request and response payloads to simplify debugging."

### Data Redaction

For sensitive information like passwords or PII, Encore supports:
- Marking sensitive fields in API schemas
- Automatically redacting confidential data
- Maintaining trace utility while protecting privacy

Example of sensitive field marking:
```typescript
interface LoginRequest {
  username: string;
  password: string & Sensitive; // Automatically redacted in traces
}
```

## Viewing Traces

### Local Development
1. Start your application with `encore run`
2. Access the Development Dashboard
3. Navigate to the Traces section
4. View real-time trace data

### Production Environment
1. Deploy to Encore Cloud
2. Access the Cloud dashboard
3. Use trace filtering and search
4. Analyze performance patterns

## Trace Analysis

### Performance Monitoring
- Identify slow operations
- Analyze request patterns
- Monitor service dependencies
- Track error rates

### Debugging Capabilities
- Complete request flow visualization
- Error stack traces with context
- Database query analysis
- Service interaction mapping

## Best Practices

- Leverage automatic tracing for comprehensive system insights
- Use trace data for debugging and performance optimization
- Carefully mark sensitive fields to protect confidential information
- Regularly review traces for performance bottlenecks
- Use traces to understand service dependencies

## Additional Resources

- [API Schemas Documentation](/docs/ts/primitives/defining-apis#sensitive-data)
- Local Development Dashboard
- Encore Cloud Dashboard
- Performance monitoring guides

---
## File: ./primitives/api-calls.md
---

# API Calls Between Services

In Encore.ts, making API calls between services is as simple as calling a function. This provides a monolith-like developer experience even when using multiple services.

## Basic Service-to-Service Calls

### Import and Call

```typescript
// Import the service client
import { users } from "~encore/clients";

// Call the service API like a function
export const getOrderWithUser = api(
  { method: "GET", path: "/orders/:id" },
  async ({ id }: { id: string }) => {
    // Get order from database
    const order = await getOrder(id);
    
    // Call users service to get user details
    const user = await users.getUser({ id: order.userId });
    
    return {
      order,
      user
    };
  }
);
```

## How It Works

During compilation, Encore:
1. Parses all API definitions across services
2. Generates type-safe clients
3. Makes them available via `~encore/clients`
4. Handles service discovery automatically

## Type Safety

All service calls are fully type-safe:

```typescript
// users service
export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    return fetchUser(id);
  }
);

// orders service
import { users } from "~encore/clients";

// TypeScript knows the exact parameter and return types
const user = await users.getUser({ id: "123" }); // Returns User
const user2 = await users.getUser({ id: 123 }); // Error: id must be string
```

## Authentication Propagation

Authentication automatically propagates across service calls:

```typescript
// Service A (authenticated endpoint)
export const protectedEndpoint = api(
  { method: "GET", path: "/protected", auth: true },
  async () => {
    // Auth data automatically passed to Service B
    const result = await serviceB.someAPI();
    return result;
  }
);

// Service B
import { getAuthData } from "~encore/auth";

export const someAPI = api(
  { method: "GET", path: "/some-api" },
  async () => {
    // Can access the same auth data
    const auth = getAuthData();
    return { userId: auth?.userID };
  }
);
```

## Error Handling

Service calls can throw errors that propagate correctly:

```typescript
import { APIError } from "encore.dev/api";
import { users } from "~encore/clients";

export const createOrder = api(
  { method: "POST", path: "/orders" },
  async (params: CreateOrderParams) => {
    try {
      // Check if user exists
      const user = await users.getUser({ id: params.userId });
      
      // Create order
      return createOrderForUser(user);
      
    } catch (error) {
      if (error instanceof APIError && error.code === "not_found") {
        throw APIError.notFound("User not found");
      }
      throw error;
    }
  }
);
```

## Parallel Calls

Make multiple service calls in parallel:

```typescript
import { users, products, inventory } from "~encore/clients";

export const getOrderDetails = api(
  { method: "GET", path: "/orders/:id/details" },
  async ({ id }: { id: string }) => {
    const order = await getOrder(id);
    
    // Parallel service calls
    const [user, productDetails, stock] = await Promise.all([
      users.getUser({ id: order.userId }),
      products.getProducts({ ids: order.productIds }),
      inventory.checkStock({ productIds: order.productIds })
    ]);
    
    return {
      order,
      user,
      products: productDetails,
      availability: stock
    };
  }
);
```

## Circuit Breaking

Encore automatically implements circuit breaking for service calls:

```typescript
import { users } from "~encore/clients";

export const resilientEndpoint = api(
  { method: "GET", path: "/resilient" },
  async () => {
    try {
      // If users service fails repeatedly, 
      // circuit breaker will open automatically
      const user = await users.getUser({ id: "123" });
      return { user };
      
    } catch (error) {
      // Handle circuit breaker open state
      return { 
        user: null, 
        fallback: true 
      };
    }
  }
);
```

## Timeout Configuration

Configure timeouts for service calls:

```typescript
import { users } from "~encore/clients";
import { withTimeout } from "encore.dev/api";

export const timeoutExample = api(
  { method: "GET", path: "/timeout-test" },
  async () => {
    // Set custom timeout for this call
    const user = await withTimeout(
      users.getUser({ id: "123" }), 
      { timeout: 5000 } // 5 seconds
    );
    
    return user;
  }
);
```

## Service Discovery

Service discovery is automatic:

```typescript
// No need to configure URLs or ports
import { users, orders, products } from "~encore/clients";

// Encore handles:
// - Local development (different ports)
// - Preview environments
// - Production (load balancing, failover)
```

## Testing Service Calls

### Unit Testing with Mocks

```typescript
import { vi, describe, test, expect } from "vitest";
import { users } from "~encore/clients";
import { myAPI } from "./api";

// Mock the service client
vi.mock("~encore/clients", () => ({
  users: {
    getUser: vi.fn()
  }
}));

describe("Service Calls", () => {
  test("handles user service response", async () => {
    // Setup mock response
    users.getUser.mockResolvedValue({
      id: "123",
      name: "Test User"
    });
    
    const result = await myAPI();
    
    expect(users.getUser).toHaveBeenCalledWith({ id: "123" });
    expect(result.userName).toBe("Test User");
  });
});
```

### Integration Testing

```typescript
describe("Integration", () => {
  test("real service calls", async () => {
    // In tests, all services run together
    const result = await orders.createOrder({
      userId: "test-user",
      productId: "test-product"
    });
    
    // Services have isolated test databases
    expect(result.orderId).toBeDefined();
  });
});
```

## Monitoring Service Calls

The Encore dashboard automatically provides:
- Service dependency maps
- Request traces across services
- Latency metrics per service call
- Error rates and circuit breaker status

## Advanced Patterns

### Service Aggregation

```typescript
// API Gateway pattern
export const aggregateData = api(
  { method: "GET", path: "/dashboard", expose: true },
  async () => {
    // Aggregate data from multiple services
    const [metrics, alerts, status] = await Promise.all([
      analytics.getMetrics(),
      monitoring.getAlerts(),
      health.getStatus()
    ]);
    
    return {
      metrics,
      alerts, 
      status,
      timestamp: new Date()
    };
  }
);
```

### Saga Pattern

```typescript
// Distributed transaction with compensations
export const processOrder = api(
  { method: "POST", path: "/process-order" },
  async (params: OrderParams) => {
    const steps = [];
    
    try {
      // Step 1: Reserve inventory
      const reservation = await inventory.reserve(params.items);
      steps.push({ service: "inventory", action: "reserve", id: reservation.id });
      
      // Step 2: Charge payment
      const payment = await payments.charge(params.payment);
      steps.push({ service: "payments", action: "charge", id: payment.id });
      
      // Step 3: Create shipment
      const shipment = await shipping.create(params.shipping);
      steps.push({ service: "shipping", action: "create", id: shipment.id });
      
      return { success: true, orderId: shipment.orderId };
      
    } catch (error) {
      // Compensate in reverse order
      for (const step of steps.reverse()) {
        await compensate(step);
      }
      throw error;
    }
  }
);
```

### Event-Driven Communication

```typescript
// Combine synchronous and asynchronous communication
import { pubsub } from "encore.dev/pubsub";

const orderCreated = new pubsub.Topic<OrderCreatedEvent>("order-created");

export const createOrder = api(
  { method: "POST", path: "/orders" },
  async (params: CreateOrderParams) => {
    // Synchronous call for validation
    const user = await users.getUser({ id: params.userId });
    
    // Create order
    const order = await saveOrder(params);
    
    // Asynchronous event for other services
    await orderCreated.publish({
      orderId: order.id,
      userId: user.id,
      timestamp: new Date()
    });
    
    return order;
  }
);
```

## Best Practices

1. **Keep service interfaces small** - Minimize coupling between services
2. **Handle failures gracefully** - Always have fallback strategies
3. **Use async where possible** - Don't block on non-critical service calls
4. **Monitor dependencies** - Track which services depend on each other
5. **Version your APIs** - Support backward compatibility
6. **Cache when appropriate** - Reduce inter-service traffic
7. **Document service contracts** - Make expectations clear

## Performance Optimization

### Caching Service Responses

```typescript
import { Cache } from "encore.dev/cache";

const userCache = new Cache<User>("users", {
  ttl: 300 // 5 minutes
});

export const getCachedUser = async (id: string) => {
  // Check cache first
  const cached = await userCache.get(id);
  if (cached) return cached;
  
  // Call service if not cached
  const user = await users.getUser({ id });
  
  // Cache the result
  await userCache.set(id, user);
  
  return user;
};
```

## Summary

Service-to-service communication in Encore:
- Feels like calling local functions
- Provides complete type safety
- Handles service discovery automatically
- Includes built-in resilience patterns
- Offers comprehensive monitoring
- Scales from monolith to microservices seamlessly

---
## File: ./primitives/app-structure.md
---

# Encore App Structure

## Overview

Encore uses a monorepo design, recommending "one Encore app for your entire backend application" to build a comprehensive application model.

### Key Principles
- Supports both monolithic and microservices architectures
- Provides a monolith-style developer experience for microservices
- Enables cross-service type-safety and IDE auto-complete

## Service Definition

To create a service:
1. Add an `encore.service.ts` file in a directory
2. Export a service instance using `new Service()`

```typescript
import { Service } from "encore.dev/service";
export default new Service("my-service");
```

## Project Structure Patterns

### 1. Single-Service Application
Ideal for beginners or simple applications:

```
/my-app
├── package.json
├── encore.app
├── encore.service.ts
├── api.ts
└── db.ts
```

**Example `encore.service.ts`:**
```typescript
import { Service } from "encore.dev/service";
export default new Service("my-app");
```

### 2. Multi-Service Application
Separate services in different directories:

```
/my-app
├── package.json
├── encore.app
├── hello/
│   ├── encore.service.ts
│   └── hello.ts
└── world/
    ├── encore.service.ts
    └── world.ts
```

**Example service definition:**
```typescript
// hello/encore.service.ts
import { Service } from "encore.dev/service";
export default new Service("hello");
```

### 3. Large Applications with Multiple Systems
Organize services into logical system directories:

```
/my-trello-clone
├── package.json
├── encore.app
├── trello/
│   ├── board/
│   │   ├── encore.service.ts
│   │   └── board.ts
│   └── card/
│       ├── encore.service.ts
│       └── card.ts
├── premium/
│   ├── payment/
│   │   ├── encore.service.ts
│   │   └── payment.ts
│   └── subscription/
│       ├── encore.service.ts
│       └── subscription.ts
└── usr/
    ├── org/
    │   ├── encore.service.ts
    │   └── org.ts
    └── user/
        ├── encore.service.ts
        └── user.ts
```

## Package Management

### Recommended: Single Root Package.json
Benefits include:
- Consistent dependency versions across services
- Simplified TypeScript configuration
- Easy sharing of types and utilities
- Reduced npm install overhead

```json
{
  "name": "my-encore-app",
  "version": "0.1.0",
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "vitest": "^0.29.0"
  }
}
```

### Service-Level Dependencies (When Needed)
For specific service requirements:

```
/my-app
├── package.json
├── service1/
│   ├── package.json
│   ├── encore.service.ts
│   └── service1.ts
└── service2/
    ├── encore.service.ts
    └── service2.ts
```

## File Naming Conventions

### Service Files
- `encore.service.ts` - Service definition (required)
- `*.ts` - Business logic files
- `migrations/` - Database migrations
- `*.test.ts` - Test files

### Common Patterns
```
/user-service
├── encore.service.ts
├── user.ts              # Main business logic
├── auth.ts              # Authentication logic
├── types.ts             # Shared types
├── migrations/
│   └── 001_create_users.up.sql
└── user.test.ts         # Tests
```

## Cross-Service Communication

### Type-Safe Service Calls
```typescript
// In service A
import * as userService from "../user/user";

export const getProfile = api(
  { expose: true, method: "GET", path: "/profile/:id" },
  async ({ id }: { id: string }) => {
    const user = await userService.getUser({ id });
    return { profile: user };
  }
);
```

### Shared Types
Create a `types/` directory for shared interfaces:

```typescript
// types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

// user/user.ts
import { User } from "../types/user";

export const getUser = api(
  { expose: true, method: "GET", path: "/user/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    // Implementation
  }
);
```

## Configuration Files

### `encore.app`
Application configuration file (JSON):
```json
{
  "id": "my-app-123"
}
```

### `tsconfig.json`
TypeScript configuration:
```json
{
  "extends": "@encore/tsconfig/base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## Best Practices

### 1. Service Organization
- Group related functionality in services
- Keep services focused and cohesive
- Use clear, descriptive service names

### 2. File Structure
- Keep related files together
- Use consistent naming conventions
- Separate concerns (API, business logic, tests)

### 3. Dependencies
- Prefer root-level package.json
- Minimize external dependencies
- Use TypeScript for type safety

### 4. Service Boundaries
- Design services around business capabilities
- Minimize tight coupling between services
- Use well-defined interfaces for communication

This structure enables Encore to automatically understand your application architecture and generate infrastructure, documentation, and tooling accordingly.

---
## File: ./primitives/cron-jobs.md
---

# Encore Cron Jobs (TypeScript)

## Overview

Cron Jobs in Encore provide a declarative way to run periodic and recurring tasks in backend applications. Encore automatically manages scheduling, monitoring, and execution of these jobs.

## Defining a Cron Job

### Basic Syntax

```typescript
import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";

const _ = new CronJob("unique-job-id", {
  title: "Job Description",
  every: "2h",  // Periodic interval
  endpoint: jobFunction
});
```

### Key Configuration Options

- `unique-job-id`: A unique identifier for the job
- `title`: Human-readable job description
- `every`: Periodic interval (must divide 24 hours evenly)
- `endpoint`: The API function to execute

## Scheduling Modes

### Periodic Scheduling

Use the `every` field for simple recurring tasks:
- Runs at midnight UTC
- Interval must evenly divide 24 hours
- Supported formats: `10m`, `6h`
- Invalid example: `7h` (not evenly divisible)

### Advanced Cron Expressions

For more complex scheduling, use the `schedule` field:

```typescript
const _ = new CronJob("monthly-sync", {
  title: "Monthly Accounting Sync",
  schedule: "0 4 15 * *",  // 4am on 15th of each month
  endpoint: monthlyAccountingSync
});
```

## Important Considerations

- Not executed during local development or preview environments
- Free tier limited to once per hour
- Both public and private APIs supported
- Endpoints must be:
  - Idempotent
  - Without request parameters

## Execution Environment

- Runs in Encore Cloud
- Managed scheduling and monitoring
- Dashboard available for tracking job executions

---
## File: ./primitives/databases.md
---

# SQL Databases

Encore provides native PostgreSQL database support with automatic provisioning, migrations, and connection management.

## Creating a Database

Define a database as a resource in your service:

```typescript
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create a database named "myapp"
const db = new SQLDatabase("myapp", {
  migrations: "./migrations",
});
```

## Migrations

Encore uses SQL migrations to manage your database schema.

### Migration Files

Create migration files in the `migrations` directory:

```
service/
├── encore.service.ts
├── api.ts
└── migrations/
    ├── 1_create_users.up.sql
    ├── 2_add_posts.up.sql
    └── 3_add_indexes.up.sql
```

### Migration Naming

Migration files must:
- Start with a number (sequential)
- Followed by underscore
- Descriptive name
- End with `.up.sql`

### Example Migration

```sql
-- migrations/1_create_users.up.sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

## Querying Data

### Query Methods

```typescript
// db.query - Returns async iterator
const users = db.query`SELECT * FROM users WHERE active = true`;
for await (const user of users) {
  console.log(user.name);
}

// db.queryRow - Returns single row or null
const user = await db.queryRow`
  SELECT * FROM users WHERE id = ${userId}
`;

// db.queryAll - Returns array of all rows
const allUsers = await db.queryAll`
  SELECT * FROM users ORDER BY created_at DESC
`;
```

### Type-Safe Queries

Define types for your query results:

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
}

// Type-safe query
const user = await db.queryRow<User>`
  SELECT * FROM users WHERE id = ${userId}
`;

// user is typed as User | null
if (user) {
  console.log(user.email); // Type-safe access
}
```

## Inserting Data

### Simple Insert

```typescript
await db.exec`
  INSERT INTO users (email, name)
  VALUES (${email}, ${name})
`;
```

### Insert with Returning

```typescript
const newUser = await db.queryRow<{ id: number }>`
  INSERT INTO users (email, name)
  VALUES (${email}, ${name})
  RETURNING id
`;

console.log(`Created user with ID: ${newUser?.id}`);
```

### Bulk Insert

```typescript
const users = [
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" },
];

for (const user of users) {
  await db.exec`
    INSERT INTO users (email, name)
    VALUES (${user.email}, ${user.name})
  `;
}
```

## Updating Data

```typescript
await db.exec`
  UPDATE users 
  SET name = ${newName}, updated_at = NOW()
  WHERE id = ${userId}
`;

// Update with returning
const updated = await db.queryRow<User>`
  UPDATE users 
  SET name = ${newName}, updated_at = NOW()
  WHERE id = ${userId}
  RETURNING *
`;
```

## Deleting Data

```typescript
// Simple delete
await db.exec`
  DELETE FROM users WHERE id = ${userId}
`;

// Delete with check
const deleted = await db.queryRow<{ id: number }>`
  DELETE FROM users 
  WHERE id = ${userId}
  RETURNING id
`;

if (!deleted) {
  throw new Error("User not found");
}
```

## Transactions

Use transactions for atomic operations:

```typescript
import { getCurrentRequest } from "encore.dev";

export const transferFunds = api(
  { method: "POST", path: "/transfer" },
  async (params: TransferParams) => {
    // Start transaction
    const tx = await db.begin();
    
    try {
      // Debit from account
      await tx.exec`
        UPDATE accounts 
        SET balance = balance - ${params.amount}
        WHERE id = ${params.fromAccount}
      `;
      
      // Credit to account
      await tx.exec`
        UPDATE accounts 
        SET balance = balance + ${params.amount}
        WHERE id = ${params.toAccount}
      `;
      
      // Commit transaction
      await tx.commit();
      return { success: true };
      
    } catch (error) {
      // Rollback on error
      await tx.rollback();
      throw error;
    }
  }
);
```

## Raw SQL Queries

For complex queries, use raw SQL:

```typescript
// Raw query with parameters
const results = await db.rawQuery(
  `SELECT u.*, COUNT(p.id) as post_count
   FROM users u
   LEFT JOIN posts p ON p.user_id = u.id
   WHERE u.created_at > $1
   GROUP BY u.id
   ORDER BY post_count DESC
   LIMIT $2`,
  startDate,
  limit
);

// Raw exec for complex operations
await db.rawExec(
  `CREATE TEMPORARY TABLE temp_stats AS
   SELECT user_id, COUNT(*) as count
   FROM events
   WHERE created_at > $1
   GROUP BY user_id`,
  cutoffDate
);
```

## Connection Pooling

Encore automatically manages connection pooling. You don't need to:
- Open/close connections
- Manage connection pools
- Handle connection errors

## Testing with Databases

In tests, each test gets an isolated database:

```typescript
import { describe, test, expect } from "vitest";
import { db } from "./db";

describe("User Service", () => {
  test("create user", async () => {
    // This runs in an isolated database
    await db.exec`
      INSERT INTO users (email, name)
      VALUES ('test@example.com', 'Test User')
    `;
    
    const user = await db.queryRow`
      SELECT * FROM users WHERE email = 'test@example.com'
    `;
    
    expect(user).toBeDefined();
    expect(user?.name).toBe('Test User');
  });
  
  // Each test gets a fresh database
  test("another test", async () => {
    // Previous test's data is not here
    const count = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users
    `;
    
    expect(count?.count).toBe(0);
  });
});
```

## Local Development

When running `encore run`:
- Databases are created automatically
- Migrations run on startup
- Use `encore db shell <database-name>` to connect via psql
- Data persists between runs

## Database Commands

```bash
# Connect to database shell
encore db shell myapp

# Reset database (drop and recreate)
encore db reset myapp

# Run migrations manually
encore db migrate myapp

# Create a new migration
encore db migration create myapp "add_user_roles"
```

## Best Practices

1. **Always use migrations** - Never modify schema manually
2. **Use transactions** - For operations that must be atomic
3. **Type your queries** - Define interfaces for query results
4. **Index foreign keys** - Improve join performance
5. **Use connection pooling** - Let Encore handle it
6. **Avoid N+1 queries** - Use joins or batch queries
7. **Parameterize queries** - Never concatenate SQL strings

## Performance Tips

### Indexes

```sql
-- Index for lookups
CREATE INDEX idx_users_email ON users(email);

-- Composite index for queries
CREATE INDEX idx_posts_user_created 
ON posts(user_id, created_at DESC);

-- Partial index
CREATE INDEX idx_active_users 
ON users(email) 
WHERE active = true;
```

### Query Optimization

```typescript
// Bad: N+1 query
const users = await db.queryAll`SELECT * FROM users`;
for (const user of users) {
  const posts = await db.queryAll`
    SELECT * FROM posts WHERE user_id = ${user.id}
  `;
}

// Good: Single query with join
const usersWithPosts = await db.queryAll`
  SELECT u.*, 
    COALESCE(
      json_agg(
        json_build_object('id', p.id, 'title', p.title)
      ) FILTER (WHERE p.id IS NOT NULL), 
      '[]'
    ) as posts
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  GROUP BY u.id
`;
```

## Related Topics

- [PostgreSQL Extensions](./databases-extensions.md)
- [Caching](./caching.md)
- [Testing](../develop/testing.md)
- [Migrations Guide](../develop/migrations.md)

---
## File: ./primitives/defining-apis.md
---

# Defining APIs

Encore.ts makes it simple to create type-safe, idiomatic TypeScript API endpoints with automatic validation.

## Basic API Definition

Use the `api` function from `encore.dev/api` to define endpoints:

```typescript
import { api } from "encore.dev/api";

// Simple GET endpoint
export const hello = api(
  { method: "GET", path: "/hello" },
  async (): Promise<{ message: string }> => {
    return { message: "Hello World!" };
  }
);
```

## Request and Response Types

Define interfaces for type-safe requests and responses:

```typescript
import { api } from "encore.dev/api";

interface CreateUserParams {
  name: string;
  email: string;
  age?: number; // Optional field
}

interface CreateUserResponse {
  id: string;
  created: Date;
}

export const createUser = api(
  { method: "POST", path: "/users" },
  async (params: CreateUserParams): Promise<CreateUserResponse> => {
    // Params are automatically validated
    return {
      id: "user_123",
      created: new Date(),
    };
  }
);
```

## API Visibility

### Private APIs (Default)
Only accessible from other services within your application:

```typescript
export const internalAPI = api(
  { method: "GET", path: "/internal", expose: false }, // or omit expose
  async () => ({ data: "internal" })
);
```

### Public APIs
Accessible from the internet:

```typescript
export const publicAPI = api(
  { method: "GET", path: "/public", expose: true },
  async () => ({ data: "public" })
);
```

## Path Parameters

Use `:paramName` in the path:

```typescript
export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }) => {
    return { userId: id };
  }
);

// Multiple path parameters
export const getPost = api(
  { method: "GET", path: "/users/:userId/posts/:postId" },
  async ({ userId, postId }: { userId: string; postId: string }) => {
    return { userId, postId };
  }
);
```

## Query Parameters

Use the `Query` type for query string parameters:

```typescript
import { api, Query } from "encore.dev/api";

interface ListUsersParams {
  limit?: Query<number>;  // ?limit=10
  offset?: Query<number>; // ?offset=20
  filter?: Query<string>; // ?filter=active
}

export const listUsers = api(
  { method: "GET", path: "/users" },
  async (params: ListUsersParams) => {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    
    return { 
      users: [],
      limit,
      offset 
    };
  }
);
```

## Headers

Access HTTP headers using the `Header` type:

```typescript
import { api, Header } from "encore.dev/api";

interface AuthorizedRequest {
  authorization: Header<"Authorization">;
  userAgent?: Header<"User-Agent">;
}

export const secureEndpoint = api(
  { method: "POST", path: "/secure" },
  async (params: AuthorizedRequest) => {
    const token = params.authorization; // "Bearer xxx"
    const ua = params.userAgent;
    
    return { authenticated: true };
  }
);
```

## Authentication

Require authentication with `auth: true`:

```typescript
export const protectedAPI = api(
  { method: "GET", path: "/protected", auth: true },
  async (params, ctx) => {
    // ctx contains auth information
    return { message: "Authenticated!" };
  }
);
```

## Custom Status Codes

Return custom HTTP status codes:

```typescript
import { api, HttpStatus } from "encore.dev/api";

interface CreateResponse {
  id: string;
  status: HttpStatus;
}

export const create = api(
  { method: "POST", path: "/items" },
  async (): Promise<CreateResponse> => {
    return {
      id: "item_123",
      status: HttpStatus.Created, // 201
    };
  }
);
```

## Request Body

For POST/PUT/PATCH requests, the entire params object is the body:

```typescript
interface UpdateUserBody {
  name?: string;
  email?: string;
  bio?: string;
}

export const updateUser = api(
  { method: "PATCH", path: "/users/:id" },
  async ({ id, ...body }: { id: string } & UpdateUserBody) => {
    // id comes from path
    // body contains name, email, bio
    return { updated: true };
  }
);
```

## Cookies

Work with cookies using the `Cookie` type:

```typescript
import { api, Cookie, CookieWithOptions } from "encore.dev/api";

interface LoginResponse {
  success: boolean;
  sessionToken: CookieWithOptions<string>;
}

export const login = api(
  { method: "POST", path: "/login" },
  async (): Promise<LoginResponse> => {
    return {
      success: true,
      sessionToken: {
        value: "session_abc123",
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 86400, // 1 day
      },
    };
  }
);

// Reading cookies
interface AuthRequest {
  sessionToken?: Cookie<"session-token">;
}

export const checkAuth = api(
  { method: "GET", path: "/auth/check" },
  async (params: AuthRequest) => {
    const token = params.sessionToken;
    return { authenticated: !!token };
  }
);
```

## Validation

Encore automatically validates requests based on your TypeScript types:

```typescript
interface StrictParams {
  email: string;        // Required, must be string
  age: number;         // Required, must be number
  active?: boolean;    // Optional boolean
  tags: string[];      // Required array
  metadata?: {         // Optional nested object
    source: string;
  };
}

export const strictAPI = api(
  { method: "POST", path: "/strict" },
  async (params: StrictParams) => {
    // Params are guaranteed to match the interface
    return { valid: true };
  }
);
```

Invalid requests automatically return 400 Bad Request with details.

## API Documentation

Encore automatically generates OpenAPI documentation for all your APIs:
- Available at `http://localhost:9400` in development
- Includes all endpoints, parameters, and responses
- Interactive API explorer for testing

## Best Practices

1. **Use descriptive names**: `createUser` instead of `create`
2. **Group related APIs**: Put them in the same service
3. **Version your APIs**: Use path prefixes like `/v1/users`
4. **Handle errors gracefully**: Return appropriate status codes
5. **Document complex logic**: Add comments for business rules
6. **Keep payloads small**: Don't return unnecessary data
7. **Use consistent naming**: camelCase for fields

## Related Topics

- [API Calls](./api-calls.md) - Calling APIs between services
- [Validation](./validation.md) - Advanced validation rules
- [Raw Endpoints](./raw-endpoints.md) - Low-level HTTP handling
- [API Errors](./errors.md) - Error handling
- [Authentication](../develop/auth.md) - Setting up auth

---
## File: ./primitives/errors.md
---

# Encore TypeScript API Errors

## Overview

Encore provides a standardized approach to handling and returning API errors with structured information. The error format includes three key components:

```json
{
  "code": "error_type",
  "message": "descriptive error message",
  "details": null
}
```

## Error Handling

### Throwing Errors

To return an error, use the `APIError` from `encore.dev/api`:

```typescript
import { APIError, ErrCode } from "encore.dev/api";

// Verbose method
throw new APIError(ErrCode.NotFound, "sprocket not found");

// Shorthand method
throw APIError.notFound("sprocket not found");
```

## Error Codes

Encore uses error codes compatible with gRPC, mapping to specific HTTP status codes:

| Error Code | String Value | HTTP Status |
|-----------|--------------|-------------|
| `OK` | `"ok"` | 200 OK |
| `NotFound` | `"not_found"` | 404 Not Found |
| `InvalidArgument` | `"invalid_argument"` | 400 Bad Request |
| `PermissionDenied` | `"permission_denied"` | 403 Forbidden |
| `Unauthenticated` | `"unauthenticated"` | 401 Unauthorized |

## Additional Error Details

You can attach structured details to errors using the `withDetails` method:

```typescript
throw APIError.notFound("resource not found").withDetails(additionalContext);
```

This allows for more comprehensive error reporting while maintaining a consistent error response structure.

---
## File: ./primitives/object-storage.md
---

# Encore Object Storage Documentation

## Overview

Object Storage provides a simple and scalable solution for storing files and unstructured data in backend applications. Encore offers a cloud-agnostic API supporting multiple storage providers like Amazon S3, Google Cloud Storage, and S3-compatible services.

## Key Features

- Cloud-agnostic storage API
- Automatic tracing of storage operations
- Local development support
- Integration testing capabilities
- Support for multiple cloud providers

## Creating a Bucket

```typescript
import { Bucket } from "encore.dev/storage/objects";

export const profilePictures = new Bucket("profile-pictures", {
  versioned: false
});
```

## File Operations

### Uploading Files

```typescript
const data = Buffer.from(...); // image data
const attributes = await profilePictures.upload("my-image.jpeg", data, {
  contentType: "image/jpeg"
});
```

### Downloading Files

```typescript
const data = await profilePictures.download("my-image.jpeg");
```

### Listing Objects

```typescript
for await (const entry of profilePictures.list({})) {
  // Process each entry
}
```

### Deleting Objects

```typescript
await profilePictures.remove("my-image.jpeg");
```

## Advanced Features

### Public Buckets

```typescript
export const publicProfilePictures = new Bucket("public-profile-pictures", {
  public: true,
  versioned: false
});

// Get public URL
const url = publicProfilePictures.publicUrl("my-image.jpeg");
```

### Signed Upload/Download URLs

```typescript
// Generate signed upload URL
const uploadUrl = await profilePictures.signedUploadUrl("user-id", {ttl: 7200});

// Generate signed download URL
const downloadUrl = await documents.signedDownloadUrl("document-id", {ttl: 7200});
```

## Bucket References and Permissions

```typescript
import { Uploader } from "encore.dev/storage/objects";

// Create a reference with specific permissions
const ref = profilePictures.ref<Uploader>();
```

## Error Handling

Object Storage operations can throw errors for various reasons such as network issues, permission problems, or missing objects. Always implement proper error handling in your applications.

## Best Practices

- Use appropriate content types for uploads
- Implement proper error handling
- Consider using signed URLs for secure access
- Leverage bucket versioning for important data
- Monitor storage costs and usage

---
## File: ./primitives/pubsub.md
---

# Pub/Sub Messaging

Pub/Sub (Publishers & Subscribers) enables asynchronous, event-driven communication between services.

## Core Concepts

### What is Pub/Sub?

Pub/Sub is a messaging pattern where:
- **Publishers** emit events without knowing who will receive them
- **Subscribers** listen for events without knowing who sent them
- **Topics** act as channels for specific event types

```
Publisher → Topic → Subscriber(s)
```

## Creating Topics

Define topics as package-level variables:

```typescript
import { Topic } from "encore.dev/pubsub";

// Define the event interface
export interface UserSignupEvent {
  userID: string;
  email: string;
  timestamp: Date;
}

// Create a topic
export const userSignups = new Topic<UserSignupEvent>("user-signups", {
  deliveryGuarantee: "at-least-once",
});
```

### Topic Configuration Options

```typescript
const myTopic = new Topic<EventType>("topic-name", {
  // Delivery guarantee
  deliveryGuarantee: "at-least-once", // or "exactly-once"
  
  // Message ordering
  orderingAttribute: "userID", // Messages with same userID delivered in order
  
  // Retention
  messageRetention: 7 * 24 * 60 * 60, // 7 days in seconds
});
```

## Publishing Events

### Basic Publishing

```typescript
import { userSignups } from "./topics";

export const createUser = api(
  { method: "POST", path: "/users" },
  async (params: CreateUserParams) => {
    // Create user in database
    const user = await saveUser(params);
    
    // Publish event
    const messageID = await userSignups.publish({
      userID: user.id,
      email: user.email,
      timestamp: new Date(),
    });
    
    console.log(`Published message: ${messageID}`);
    
    return user;
  }
);
```

### Publishing Multiple Events

```typescript
// Publish multiple events at once
const messageIDs = await Promise.all([
  userSignups.publish({ userID: "1", email: "user1@example.com", timestamp: new Date() }),
  userSignups.publish({ userID: "2", email: "user2@example.com", timestamp: new Date() }),
  userSignups.publish({ userID: "3", email: "user3@example.com", timestamp: new Date() }),
]);
```

### Publishing with Attributes

```typescript
import { Attribute } from "encore.dev/pubsub";

interface OrderEvent {
  orderID: string;
  amount: number;
  priority: Attribute<"high" | "normal" | "low">;
  region: Attribute<string>;
}

const orderEvents = new Topic<OrderEvent>("orders", {
  deliveryGuarantee: "at-least-once",
});

// Publish with attributes
await orderEvents.publish({
  orderID: "123",
  amount: 99.99,
  priority: "high",
  region: "us-east",
});
```

## Creating Subscriptions

### Basic Subscription

```typescript
import { Subscription } from "encore.dev/pubsub";
import { userSignups } from "./topics";

// Create a subscription
const _ = new Subscription(userSignups, "send-welcome-email", {
  handler: async (event: UserSignupEvent) => {
    console.log(`New user signup: ${event.email}`);
    
    // Send welcome email
    await sendWelcomeEmail(event.email);
  },
});
```

### Subscription Configuration

```typescript
const subscription = new Subscription(myTopic, "subscription-name", {
  handler: async (event) => {
    // Process event
  },
  
  // Retry configuration
  retry: {
    maxRetries: 10,
    minBackoff: 10, // seconds
    maxBackoff: 300, // seconds
  },
  
  // Concurrency control
  maxConcurrency: 5, // Process max 5 messages in parallel
  
  // Message filtering (if topic has attributes)
  filter: {
    priority: "high",
    region: ["us-east", "us-west"],
  },
});
```

## Delivery Guarantees

### At-Least-Once Delivery

Default guarantee - messages may be delivered multiple times:

```typescript
const topic = new Topic<Event>("events", {
  deliveryGuarantee: "at-least-once",
});

// Handler must be idempotent
const subscription = new Subscription(topic, "process", {
  handler: async (event) => {
    // Check if already processed
    const processed = await checkProcessed(event.id);
    if (processed) return;
    
    // Process event
    await processEvent(event);
    
    // Mark as processed
    await markProcessed(event.id);
  },
});
```

### Exactly-Once Delivery

Stronger guarantee but with performance limitations:

```typescript
const criticalTopic = new Topic<CriticalEvent>("critical", {
  deliveryGuarantee: "exactly-once",
});

// Handler can assume single delivery
const subscription = new Subscription(criticalTopic, "process-once", {
  handler: async (event) => {
    // Process without idempotency checks
    await processCriticalEvent(event);
  },
});
```

## Error Handling

### Retry Policy

```typescript
const subscription = new Subscription(topic, "retry-example", {
  handler: async (event) => {
    try {
      await processEvent(event);
    } catch (error) {
      // Throw to trigger retry
      throw error;
    }
  },
  
  retry: {
    maxRetries: 5,
    minBackoff: 10, // Start with 10 second delay
    maxBackoff: 600, // Max 10 minute delay
  },
});
```

### Dead Letter Queue

After max retries, messages go to DLQ:

```typescript
// Subscribe to dead letter queue
const dlqSubscription = new Subscription(topic, "handle-dlq", {
  handler: async (event) => {
    // Log failed event
    console.error("Failed to process:", event);
    
    // Alert operations team
    await sendAlert({
      type: "DLQ_MESSAGE",
      event,
    });
  },
  
  // This subscription handles DLQ messages
  dlq: true,
});
```

## Ordered Topics

Ensure message order for related events:

```typescript
const userEvents = new Topic<UserEvent>("user-events", {
  deliveryGuarantee: "at-least-once",
  orderingAttribute: "userID", // Order by user
});

// Messages for same userID delivered in order
await userEvents.publish({ userID: "123", type: "login" });
await userEvents.publish({ userID: "123", type: "update" });
await userEvents.publish({ userID: "123", type: "logout" });
```

## Common Patterns

### Event Sourcing

```typescript
interface DomainEvent {
  aggregateID: string;
  eventType: string;
  eventData: any;
  timestamp: Date;
  version: number;
}

const eventStore = new Topic<DomainEvent>("event-store", {
  deliveryGuarantee: "exactly-once",
  orderingAttribute: "aggregateID",
});

// Publish domain events
export async function updateUser(userID: string, changes: any) {
  await eventStore.publish({
    aggregateID: userID,
    eventType: "UserUpdated",
    eventData: changes,
    timestamp: new Date(),
    version: await getNextVersion(userID),
  });
}
```

### Saga Pattern

```typescript
// Order saga orchestration
const orderSaga = new Subscription(orderEvents, "order-saga", {
  handler: async (event) => {
    switch (event.step) {
      case "order_created":
        await inventoryService.reserve(event.items);
        await orderEvents.publish({ ...event, step: "inventory_reserved" });
        break;
        
      case "inventory_reserved":
        await paymentService.charge(event.payment);
        await orderEvents.publish({ ...event, step: "payment_processed" });
        break;
        
      case "payment_processed":
        await shippingService.ship(event.shipping);
        await orderEvents.publish({ ...event, step: "order_completed" });
        break;
    }
  },
});
```

### Fan-Out Pattern

```typescript
const userSignupTopic = new Topic<UserSignupEvent>("user-signup");

// Multiple subscribers for single event
new Subscription(userSignupTopic, "send-email", {
  handler: async (event) => await sendWelcomeEmail(event),
});

new Subscription(userSignupTopic, "create-profile", {
  handler: async (event) => await createUserProfile(event),
});

new Subscription(userSignupTopic, "analytics", {
  handler: async (event) => await trackSignup(event),
});

new Subscription(userSignupTopic, "crm-sync", {
  handler: async (event) => await syncToCRM(event),
});
```

## Testing Pub/Sub

### Unit Testing Publishers

```typescript
import { vi, describe, test, expect } from "vitest";
import { userSignups } from "./topics";

describe("User Creation", () => {
  test("publishes signup event", async () => {
    // Mock the publish method
    const publishSpy = vi.spyOn(userSignups, "publish");
    
    // Create user
    await createUser({ email: "test@example.com" });
    
    // Verify event published
    expect(publishSpy).toHaveBeenCalledWith({
      userID: expect.any(String),
      email: "test@example.com",
      timestamp: expect.any(Date),
    });
  });
});
```

### Testing Subscriptions

```typescript
describe("Welcome Email Subscription", () => {
  test("sends email on signup", async () => {
    const mockSendEmail = vi.fn();
    
    // Create subscription with mock handler
    const subscription = new Subscription(userSignups, "test", {
      handler: async (event) => {
        await mockSendEmail(event.email);
      },
    });
    
    // Simulate event
    await subscription.handler({
      userID: "123",
      email: "test@example.com",
      timestamp: new Date(),
    });
    
    expect(mockSendEmail).toHaveBeenCalledWith("test@example.com");
  });
});
```

## Monitoring

The Encore dashboard provides:
- Topic throughput metrics
- Subscription lag monitoring
- Error rates and retry counts
- Dead letter queue size
- Message flow visualization

## Best Practices

1. **Make handlers idempotent** - Handle duplicate deliveries gracefully
2. **Keep events small** - Store references, not large payloads
3. **Version your events** - Support backward compatibility
4. **Use dead letter queues** - Handle permanent failures
5. **Monitor subscription lag** - Ensure timely processing
6. **Document event schemas** - Make contracts clear
7. **Test error scenarios** - Verify retry and DLQ behavior

## Performance Considerations

### Batching

```typescript
// Batch process events for efficiency
const batchSubscription = new Subscription(topic, "batch-process", {
  handler: async (events: Event[]) => {
    // Process multiple events at once
    await batchProcess(events);
  },
  
  batchSize: 100, // Process 100 at a time
  batchTimeout: 5000, // Or after 5 seconds
});
```

### Parallel Processing

```typescript
const parallelSubscription = new Subscription(topic, "parallel", {
  handler: async (event) => {
    await processEvent(event);
  },
  
  maxConcurrency: 10, // Process 10 messages in parallel
});
```

## Summary

Encore's Pub/Sub provides:
- **Type-safe** event definitions
- **Automatic** infrastructure provisioning
- **Built-in** retry and error handling
- **Flexible** delivery guarantees
- **Comprehensive** monitoring
- **Simple** testing patterns

Perfect for:
- Decoupling services
- Event-driven architectures
- Asynchronous workflows
- Fan-out processing
- Event sourcing
- Saga orchestration

---
## File: ./primitives/secrets.md
---

# Secrets Management

Encore provides built-in secrets management to securely handle sensitive information like API keys, tokens, and credentials.

## Defining Secrets

Use the `secret()` function to define secrets in your code:

```typescript
import { secret } from "encore.dev/config";

// Define secrets as top-level variables
const databasePassword = secret("DatabasePassword");
const apiKey = secret("ExternalAPIKey");
const jwtSecret = secret("JWTSecret");
```

## Using Secrets

Call the secret as a function to retrieve its value:

```typescript
import { secret } from "encore.dev/config";

const githubToken = secret("GitHubAPIToken");

export async function fetchGitHubData() {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${githubToken()}`,
    },
  });
  
  return response.json();
}
```

## Setting Secret Values

### Via Encore Cloud Dashboard

1. Open [Encore Cloud Dashboard](https://app.encore.dev)
2. Navigate to **Settings** → **Secrets**
3. Add secrets for each environment:
   - Production
   - Development
   - Preview
   - Local

### Via CLI

```bash
# Set a secret for production
encore secret set --type production DatabasePassword

# Set for development environment
encore secret set --type development DatabasePassword

# Set for preview environments
encore secret set --type preview DatabasePassword

# Set for local development
encore secret set --type local DatabasePassword
```

Environment type shortcuts:
- `prod` → production
- `dev` → development
- `pr` → preview

### Local Override File

Create `.secrets.local` file in your project root:

```json
{
  "DatabasePassword": "local-dev-password",
  "GitHubAPIToken": "ghp_localDevToken123",
  "JWTSecret": "local-jwt-secret-key"
}
```

**Important**: Add `.secrets.local` to `.gitignore`:
```gitignore
.secrets.local
*.secrets.local
```

## Secret Validation

Encore validates secrets at compile time:

```typescript
const apiKey = secret("APIKey");

// Compile-time check ensures secret exists
export const useAPI = api(
  { method: "GET", path: "/data" },
  async () => {
    const key = apiKey(); // Will fail compilation if not set
    return fetchWithKey(key);
  }
);
```

## Environment-Specific Secrets

Different values per environment:

```typescript
const dbUrl = secret("DatabaseURL");

// Local: postgresql://localhost/myapp
// Dev: postgresql://dev.db.example.com/myapp
// Prod: postgresql://prod.db.example.com/myapp
```

## Common Secret Patterns

### Database Credentials

```typescript
import { secret } from "encore.dev/config";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const dbPassword = secret("DBPassword");
const dbHost = secret("DBHost");
const dbUser = secret("DBUser");

// Use secrets in connection string
const connectionString = () => 
  `postgresql://${dbUser()}:${dbPassword()}@${dbHost()}/myapp`;
```

### API Keys

```typescript
const stripeKey = secret("StripeAPIKey");
const sendgridKey = secret("SendGridAPIKey");
const twilioKey = secret("TwilioAPIKey");

export class PaymentService {
  private stripe = new Stripe(stripeKey());
  
  async processPayment(amount: number) {
    return this.stripe.charges.create({
      amount,
      currency: "usd",
    });
  }
}
```

### JWT Secrets

```typescript
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

export function createToken(payload: any): string {
  return jwt.sign(payload, jwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, jwtSecret());
}
```

### OAuth Credentials

```typescript
const googleClientId = secret("GoogleOAuthClientId");
const googleClientSecret = secret("GoogleOAuthClientSecret");

export const oauthConfig = {
  clientId: googleClientId(),
  clientSecret: googleClientSecret(),
  redirectUri: "https://myapp.com/auth/callback",
};
```

## Secret Rotation

Best practices for rotating secrets:

1. **Add new secret version**:
```bash
encore secret set --type production APIKey_v2
```

2. **Update code to support both**:
```typescript
const apiKeyV1 = secret("APIKey");
const apiKeyV2 = secret("APIKey_v2");

function getAPIKey() {
  // Try new key first, fallback to old
  try {
    return apiKeyV2();
  } catch {
    return apiKeyV1();
  }
}
```

3. **Deploy and verify**
4. **Remove old secret**

## Security Best Practices

### 1. Never Commit Secrets
```typescript
// ❌ NEVER DO THIS
const apiKey = "sk_live_abcd1234";

// ✅ DO THIS
const apiKey = secret("APIKey");
```

### 2. Use Descriptive Names
```typescript
// ❌ Too generic
const key = secret("Key");

// ✅ Descriptive
const stripeWebhookSecret = secret("StripeWebhookSecret");
```

### 3. Limit Secret Scope
```typescript
// Keep secrets in specific services
// users/secrets.ts
const userDbPassword = secret("UserDBPassword");

// orders/secrets.ts  
const orderDbPassword = secret("OrderDBPassword");
```

### 4. Audit Secret Usage
```typescript
// Log secret access for auditing
const sensitiveKey = secret("SensitiveAPIKey");

export function useSensitiveAPI() {
  console.log("Accessing sensitive API");
  const key = sensitiveKey();
  // Use key
}
```

## Testing with Secrets

### Mock Secrets in Tests

```typescript
import { vi } from "vitest";
import * as config from "encore.dev/config";

describe("Secret Tests", () => {
  beforeEach(() => {
    vi.spyOn(config, "secret").mockImplementation(
      (name: string) => () => `mock-${name}`
    );
  });
  
  test("uses mocked secret", () => {
    const apiKey = secret("APIKey");
    expect(apiKey()).toBe("mock-APIKey");
  });
});
```

### Test Environment Secrets

Set test-specific secrets:

```bash
# Set secrets for test environment
encore secret set --type local TestAPIKey
encore secret set --type local TestDBPassword
```

## Secret Storage Security

Encore encrypts secrets using:
- **Google Cloud KMS** for Encore Cloud
- **AES-256** for local development
- **Environment-specific encryption keys**

### How Secrets Are Stored

1. **Encore Cloud**: Encrypted in Google Secret Manager
2. **Local Development**: Encrypted in `.encore` directory
3. **Self-Hosted**: Your choice of secret manager

## Debugging Secrets

### Check if Secret is Set

```typescript
const apiKey = secret("APIKey");

export function checkSecrets() {
  try {
    const key = apiKey();
    console.log("APIKey is set");
  } catch (error) {
    console.error("APIKey is not set");
  }
}
```

### List All Secrets

```bash
# List secrets for an environment
encore secret list --env production
```

### View Secret Metadata

```bash
# Get info about a secret (not the value)
encore secret info APIKey
```

## Migration from Environment Variables

Migrating from traditional env vars:

```typescript
// Before (using process.env)
const apiKey = process.env.API_KEY;

// After (using Encore secrets)
import { secret } from "encore.dev/config";
const apiKey = secret("APIKey");

// Use the secret
const key = apiKey();
```

## Common Issues and Solutions

### Secret Not Found

```
Error: secret "APIKey" not found
```

**Solution**: Set the secret using CLI or dashboard

### Secret Access in Non-API Code

```typescript
// Secrets can be used anywhere in your service
class BackgroundJob {
  private apiKey = secret("APIKey");
  
  async run() {
    const key = this.apiKey();
    // Use key
  }
}
```

### Different Secrets Per Service

```typescript
// Service A
const serviceAKey = secret("ServiceA_APIKey");

// Service B  
const serviceBKey = secret("ServiceB_APIKey");
```

## Summary

Encore's secrets management:
- **Secure**: Encrypted storage and transmission
- **Simple**: Define and use with one function
- **Validated**: Compile-time checking
- **Flexible**: Different values per environment
- **Auditable**: Track secret usage
- **Testable**: Easy mocking for tests

---
## File: ./primitives/services.md
---

# Defining Services

Encore.ts simplifies building applications with multiple services, eliminating the typical complexity of microservice development.

## What is a Service?

In Encore, a service is a logical grouping of related functionality. Each service:
- Has its own package/directory
- Can expose APIs
- Can have its own database
- Runs as part of your application

## Creating a Service

To create an Encore service:

1. Create a directory for your service
2. Add a file named `encore.service.ts` in that directory
3. Export a service instance

### Basic Example

```typescript
// hello/encore.service.ts
import { Service } from "encore.dev/service";

export default new Service("hello");
```

### Service Structure

```
your-app/
├── users/                    # Users service
│   ├── encore.service.ts     # Service definition
│   ├── api.ts                # API endpoints
│   └── db.ts                 # Database queries
├── products/                 # Products service
│   ├── encore.service.ts
│   ├── api.ts
│   └── models.ts
└── package.json
```

## Service Configuration

### Basic Configuration

```typescript
import { Service } from "encore.dev/service";

export default new Service("my-service");
```

### Advanced Configuration

```typescript
import { Service } from "encore.dev/service";

// Service with configuration options
export default new Service("my-service", {
  // Optional configuration
});
```

## Service Communication

Services can call each other's APIs:

```typescript
// users/api.ts
import { api } from "encore.dev/api";

export const get = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }) => {
    // Return user data
    return { id, name: "John Doe" };
  }
);
```

```typescript
// orders/api.ts
import { api } from "encore.dev/api";
import { get as getUser } from "~encore/clients/users";

export const createOrder = api(
  { method: "POST", path: "/orders" },
  async (params: CreateOrderParams) => {
    // Call the users service
    const user = await getUser({ id: params.userId });
    
    // Create order for user
    return { 
      orderId: "123",
      userName: user.name 
    };
  }
);
```

## Service Best Practices

### 1. Single Responsibility
Each service should have a clear, single purpose:
- ✅ `users` - User management
- ✅ `payments` - Payment processing
- ❌ `utils` - Too generic

### 2. Service Boundaries
Keep services loosely coupled:
- Communicate via APIs
- Don't share databases between services
- Keep shared types minimal

### 3. Service Naming
Use clear, descriptive names:
- Use lowercase
- Use hyphens for multi-word names
- Be consistent across your application

### 4. Directory Structure
Organize service code logically:
```
service-name/
├── encore.service.ts  # Service definition
├── api.ts            # Public API endpoints
├── internal.ts       # Internal functions
├── db.ts            # Database queries
├── types.ts         # Type definitions
└── tests/           # Service tests
```

## Service Discovery

Encore automatically handles service discovery. You don't need to:
- Configure service URLs
- Set up load balancers
- Manage service registries

Just import and call:
```typescript
import { apiClient } from "~encore/clients/other-service";
```

## Local Development

When running locally with `encore run`:
- All services start automatically
- Services can communicate locally
- Hot reload works across services
- Shared development database

## Production Deployment

In production:
- Services can be deployed independently
- Automatic load balancing
- Built-in service mesh
- Zero-downtime deployments

## Monitoring Services

The Encore dashboard provides:
- Service topology view
- Request traces across services
- Service-specific metrics
- Error tracking per service

## Related Topics

- [API Endpoints](./defining-apis.md)
- [Databases](./databases.md)
- [Authentication](../develop/auth.md)
- [Testing](../develop/testing.md)

---
## File: ./primitives/streaming-apis.md
---

# Encore TypeScript Streaming APIs

## Overview

Encore provides a robust streaming API system that supports three primary streaming patterns:

1. **StreamIn**: Client-to-server data streaming
2. **StreamOut**: Server-to-client data streaming
3. **StreamInOut**: Bidirectional data streaming

## Key Streaming Concepts

### WebSocket Handshake
When establishing a stream, Encore performs an initial HTTP handshake that can include:
- Path parameters
- Query parameters
- Headers

### Stream Types

#### StreamIn Example
```typescript
export const uploadStream = api.streamIn<Handshake, Message, Response>({
  path: "/upload", 
  expose: true
}, async (handshake, stream) => {
  const chunks: string[] = [];
  for await (const data of stream) {
    chunks.push(data.data);
    if (data.done) break;
  }
  return { success: true };
});
```

#### StreamOut Example
```typescript
export const logStream = api.streamOut<Handshake, Message>({
  path: "/logs", 
  expose: true
}, async (handshake, stream) => {
  for await (const row of mockedLogs(handshake.rows, stream)) {
    await stream.send({ row });
  }
});
```

#### StreamInOut Example
```typescript
export const ChatStream = api.streamInOut<InMessage, OutMessage>({
  path: "/chat", 
  expose: true
}, async (stream) => {
  for await (const chatMessage of stream) {
    await stream.send({ /* response */ });
  }
});
```

## Advanced Streaming Patterns

### Authentication
- Use `auth: true` in endpoint options
- Authentication data passed via query parameters or headers
- Access authentication data with `getAuthData()`

### Broadcasting Messages
```typescript
const connectedStreams: Map<string, StreamInOut<ChatMessage, ChatMessage>> = new Map();

export const chat = api.streamInOut<HandshakeRequest, ChatMessage, ChatMessage>({
  expose: true, 
  path: "/chat"
}, async (handshake, stream) => {
  const userId = handshake.userId;
  connectedStreams.set(userId, stream);
  
  try {
    for await (const message of stream) {
      // Broadcast to all connected clients
      for (const [id, clientStream] of connectedStreams) {
        if (id !== userId) {
          await clientStream.send(message);
        }
      }
    }
  } finally {
    connectedStreams.delete(userId);
  }
});
```

## Error Handling

Streaming APIs support error handling through standard Encore error mechanisms:

```typescript
import { APIError } from "encore.dev/api";

export const protectedStream = api.streamOut<{}, Message>({
  path: "/protected",
  auth: true
}, async (handshake, stream) => {
  if (!isAuthorized(handshake.auth)) {
    throw APIError.unauthenticated("access denied");
  }
  // Stream logic here
});
```

## Best Practices

- Always clean up resources in finally blocks
- Implement proper error handling for stream interruptions
- Use authentication for sensitive streaming endpoints
- Consider rate limiting for high-volume streams
- Monitor stream connections for resource management

---
## File: ./primitives/validation.md
---

# Request Validation in Encore.ts

## Overview

Encore.ts provides built-in runtime validation using TypeScript types, ensuring both compile-time and runtime type safety. The validation system automatically validates request data from multiple sources including request body, query parameters, headers, and path parameters.

## Basic Type Validation

### Primitive Types
```typescript
import { api } from "encore.dev/api";

interface BasicRequest {
  name: string;
  age: number;
  isActive: boolean;
  tags: string[];
}

export const create = api(
  { expose: true, method: "POST", path: "/users" },
  async (req: BasicRequest): Promise<{ success: boolean }> => {
    // req is automatically validated
    return { success: true };
  }
);
```

### Optional and Nullable Fields
```typescript
interface UserRequest {
  email: string;                    // Required
  name?: string;                    // Optional
  avatar: string | null;            // Nullable
  preferences?: string[] | null;    // Optional and nullable
}
```

### Array Validation
```typescript
interface ArrayRequest {
  tags: string[];                   // Array of strings
  scores: number[];                 // Array of numbers
  mixed: (string | number)[];       // Mixed array
  nested: { id: string; name: string }[];  // Array of objects
}
```

## Advanced Validation Rules

### Numeric Constraints
```typescript
import { Min, Max } from "encore.dev/api";

interface NumericRequest {
  age: number & Min<18> & Max<120>;           // Between 18 and 120
  percentage: number & Min<0> & Max<100>;     // 0 to 100
  port: number & Min<1024> & Max<65535>;      // Valid port range
}
```

### String Length Validation
```typescript
import { MinLen, MaxLen } from "encore.dev/api";

interface StringRequest {
  username: string & MinLen<3> & MaxLen<20>;      // 3-20 characters
  password: string & MinLen<8>;                   // At least 8 characters
  description: string & MaxLen<500>;              // Max 500 characters
}
```

### Format Validation
```typescript
import { IsEmail, IsURL } from "encore.dev/api";

interface FormatRequest {
  email: string & IsEmail;                        // Valid email format
  website: string & IsURL;                        // Valid URL format
  contact: string & (IsEmail | IsURL);            // Either email or URL
}
```

### Pattern Matching
```typescript
import { StartsWith, EndsWith, MatchesRegexp } from "encore.dev/api";

interface PatternRequest {
  slug: string & StartsWith<"api-">;              // Must start with "api-"
  filename: string & EndsWith<".json">;           // Must end with ".json"
  phoneNumber: string & MatchesRegexp<"^\\+[1-9]\\d{1,14}$">;  // E.164 format
}
```

### Enum Validation
```typescript
enum UserRole {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator"
}

interface RoleRequest {
  role: UserRole;                                 // Must be valid enum value
  permissions: UserRole[];                        // Array of enum values
}
```

## Complex Validation Examples

### User Registration
```typescript
import { api } from "encore.dev/api";
import { MinLen, MaxLen, IsEmail, Min, Max } from "encore.dev/api";

interface RegisterRequest {
  email: string & IsEmail;
  username: string & MinLen<3> & MaxLen<20>;
  password: string & MinLen<8> & MaxLen<128>;
  age: number & Min<13> & Max<120>;
  terms: boolean;  // Must be true
  newsletter?: boolean;
}

export const register = api(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req: RegisterRequest): Promise<{ userId: string }> => {
    if (!req.terms) {
      throw new Error("Terms must be accepted");
    }
    
    // Process registration
    return { userId: "user-123" };
  }
);
```

### Product Creation
```typescript
interface CreateProductRequest {
  name: string & MinLen<1> & MaxLen<100>;
  description: string & MaxLen<1000>;
  price: number & Min<0.01> & Max<999999.99>;
  category: "electronics" | "clothing" | "books" | "home";
  tags: string[] & MaxLen<10>;  // Max 10 tags
  images: string[] & MinLen<1>; // At least 1 image
  specifications: Record<string, string | number>;
}
```

### Query Parameter Validation
```typescript
interface SearchQuery {
  q: string & MinLen<1> & MaxLen<100>;           // Search query
  page: number & Min<1> & Max<1000>;             // Page number
  limit: number & Min<1> & Max<100>;             // Results per page
  sort?: "name" | "date" | "price";              // Sort order
  category?: string[];                           // Filter categories
}

export const search = api(
  { expose: true, method: "GET", path: "/search" },
  async (query: SearchQuery): Promise<{ results: any[] }> => {
    // Query parameters are automatically validated
    return { results: [] };
  }
);
```

## Validation Sources

### Request Body
```typescript
// POST /api/users
// Content-Type: application/json
// { "name": "John", "age": 30 }

export const createUser = api(
  { expose: true, method: "POST", path: "/users" },
  async ({ name, age }: { name: string; age: number }) => {
    // Body is validated automatically
    return { id: "123", name, age };
  }
);
```

### Path Parameters
```typescript
// GET /api/users/123
export const getUser = api(
  { expose: true, method: "GET", path: "/users/:id" },
  async ({ id }: { id: string & MinLen<1> }) => {
    // Path parameter is validated
    return { id, name: "John" };
  }
);
```

### Query Parameters
```typescript
// GET /api/users?page=1&limit=20
export const listUsers = api(
  { expose: true, method: "GET", path: "/users" },
  async ({ page, limit }: { 
    page: number & Min<1>; 
    limit: number & Min<1> & Max<100>;
  }) => {
    // Query parameters are validated
    return { users: [], page, limit };
  }
);
```

### Headers
```typescript
import { Header } from "encore.dev/api";

export const authenticated = api(
  { expose: true, method: "GET", path: "/profile" },
  async (req: {}, headers: { 
    authorization: Header<"Authorization"> & StartsWith<"Bearer ">
  }) => {
    // Header validation
    return { profile: {} };
  }
);
```

## Error Handling

### Validation Errors
When validation fails, Encore automatically returns a `400 Bad Request` response with detailed error information:

```json
{
  "code": "invalid_argument",
  "message": "validation failed",
  "details": {
    "validationErrors": [
      {
        "field": "age",
        "message": "must be at least 18"
      },
      {
        "field": "email",
        "message": "must be a valid email address"
      }
    ]
  }
}
```

### Custom Validation
For complex business logic validation:

```typescript
import { APIError } from "encore.dev/api";

export const createUser = api(
  { expose: true, method: "POST", path: "/users" },
  async (req: RegisterRequest): Promise<{ userId: string }> => {
    // Built-in validation happens first
    
    // Custom business logic validation
    if (await emailExists(req.email)) {
      throw APIError.invalidArgument("Email already exists");
    }
    
    if (req.username.includes("admin") && req.role !== "admin") {
      throw APIError.invalidArgument("Username reserved for administrators");
    }
    
    return { userId: "user-123" };
  }
);
```

## Best Practices

### 1. Use Type-Safe Validation
```typescript
// Good: Type-safe and validated
interface Request {
  age: number & Min<18>;
}

// Avoid: Manual validation
interface Request {
  age: number;
}
// Then manually checking: if (req.age < 18) throw error
```

### 2. Combine Multiple Constraints
```typescript
interface Username {
  username: string & MinLen<3> & MaxLen<20> & MatchesRegexp<"^[a-zA-Z0-9_]+$">;
}
```

### 3. Use Union Types for Options
```typescript
interface SortRequest {
  sort: "name" | "date" | "price" | "popularity";
  order: "asc" | "desc";
}
```

### 4. Validate All Input Sources
```typescript
export const updateUser = api(
  { expose: true, method: "PUT", path: "/users/:id" },
  async (
    { id }: { id: string & MinLen<1> },                    // Path
    body: { name?: string & MaxLen<100> },                 // Body  
    query: { force?: boolean },                            // Query
    headers: { authorization: Header<"Authorization"> }    // Headers
  ) => {
    // All inputs validated
  }
);
```

## Performance Considerations

- Validation runs in Encore's Rust runtime for optimal performance
- Failed validation short-circuits request processing
- Type information is compiled into efficient validation rules
- No runtime overhead for TypeScript type checking

The validation system provides robust request handling while maintaining excellent performance and developer experience.

---
## File: ./quick-start.md
---

# Quick Start Guide

This guide helps you build your first Encore.ts application in approximately 5 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) version 18+
- [Docker](https://docker.com) for local databases
- [Encore CLI](Environment%20Setup/encore-docs/install.md) installed

## Steps

### 1. Install Encore CLI

If you haven't already, install the Encore CLI:

```bash
# macOS
brew install encoredev/tap/encore

# Linux
curl -L https://encore.dev/install.sh | bash

# Windows (WSL)
iwr https://encore.dev/install.ps1 | iex
```

### 2. Create Your App

Create a new Encore application:

```bash
encore app create
```

When prompted:
- Enter a name for your app
- Choose the **Hello World** template
- Optionally create a free Encore account for deployment

### 3. Explore the Code

Your app structure:
```
your-app/
├── hello/
│   ├── hello.ts         # API endpoint definitions
│   └── encore.service.ts # Service configuration
├── package.json
└── tsconfig.json
```

Example API endpoint in `hello/hello.ts`:
```typescript
import { api } from "encore.dev/api";

interface Response {
  message: string;
}

// Public API endpoint
export const world = api(
  { method: "GET", path: "/hello/:name", expose: true },
  async ({ name }: { name: string }): Promise<Response> => {
    return { message: `Hello ${name}!` };
  },
);
```

### 4. Run the Application

Start your local development server:

```bash
cd your-app-name
encore run
```

This will:
- Start the Encore daemon
- Launch the Local Development Dashboard at http://localhost:9400
- Run your API at http://localhost:4000

Test your API:
```bash
curl http://localhost:4000/hello/world
# Response: {"message":"Hello world!"}
```

### 5. Make Changes

Try modifying the response in `hello/hello.ts`:

```typescript
export const world = api(
  { method: "GET", path: "/hello/:name", expose: true },
  async ({ name }: { name: string }): Promise<Response> => {
    const greeting = `Hello ${name}! Welcome to Encore.`;
    return { message: greeting };
  },
);
```

Encore automatically reloads when you save changes.

### 6. Deploy Your Application

#### Option A: Deploy to Encore Cloud

```bash
# Initialize git repository
git init
git add -A .
git commit -m 'Initial commit'

# Deploy to Encore Cloud
git push encore
```

Your app will be deployed to a preview environment with a URL like:
`https://staging-your-app-name-abcd.encr.app`

#### Option B: Generate Docker Image

```bash
encore build docker my-app:latest
```

Then deploy the Docker image to any container platform.

## What's Next?

- **[REST API Tutorial](rest-api.md)** - Build a complete REST API
- **[Database Guide](databases.md)** - Add PostgreSQL to your app
- **[Authentication](auth.md)** - Secure your APIs
- **[Testing](testing.md)** - Write tests for your application

## Useful Commands

```bash
encore run          # Start local development
encore test         # Run tests
encore db shell     # Connect to local database
encore logs         # View application logs
encore gen client   # Generate API client
```

## Getting Help

- 📚 [Documentation](https://encore.dev/docs)
- 💬 [Discord Community](https://encore.dev/discord)
- 🐛 [GitHub Issues](https://github.com/encoredev/encore)

---
## File: ./tutorials/graphql.md
---

# Building a GraphQL API with Encore.ts

## Overview

This tutorial guides you through building a GraphQL API using Encore.ts and Apollo Server. You'll learn how to:

- Set up GraphQL with Encore
- Define GraphQL schemas
- Create resolvers
- Implement CRUD operations
- Deploy GraphQL APIs

## Prerequisites

- Node.js
- Encore CLI
- Basic GraphQL knowledge

## Step 1: Create Encore Application

```bash
encore app create graphql-app
cd graphql-app
```

## Step 2: Install Dependencies

```bash
npm install apollo-server-express graphql
npm install -D @types/graphql
```

## Step 3: Define GraphQL Schema

Create `schema.graphql`:
```graphql
type Book {
  id: ID!
  title: String!
  author: String!
  publishedYear: Int
}

type Query {
  books: [Book!]!
  book(id: ID!): Book
}

type Mutation {
  addBook(title: String!, author: String!, publishedYear: Int): Book!
  updateBook(id: ID!, title: String, author: String, publishedYear: Int): Book
  deleteBook(id: ID!): Boolean!
}
```

## Step 4: Create Book Service

Create `book/encore.service.ts`:
```typescript
import { Service } from "encore.dev/service";
export default new Service("book");
```

Create `book/book.ts`:
```typescript
import { api } from "encore.dev/api";

export interface Book {
  id: string;
  title: string;
  author: string;
  publishedYear?: number;
}

// In-memory storage for demo purposes
let books: Book[] = [
  { id: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald", publishedYear: 1925 },
  { id: "2", title: "To Kill a Mockingbird", author: "Harper Lee", publishedYear: 1960 },
];

let nextId = 3;

export const getBooks = api(
  { expose: true, method: "GET", path: "/books" },
  async (): Promise<{ books: Book[] }> => {
    return { books };
  }
);

export const getBook = api(
  { expose: true, method: "GET", path: "/books/:id" },
  async ({ id }: { id: string }): Promise<Book | null> => {
    return books.find(book => book.id === id) || null;
  }
);

export const addBook = api(
  { expose: true, method: "POST", path: "/books" },
  async ({ title, author, publishedYear }: Omit<Book, "id">): Promise<Book> => {
    const book: Book = {
      id: nextId.toString(),
      title,
      author,
      publishedYear,
    };
    books.push(book);
    nextId++;
    return book;
  }
);

export const updateBook = api(
  { expose: true, method: "PUT", path: "/books/:id" },
  async ({ id, ...updates }: Partial<Book> & { id: string }): Promise<Book | null> => {
    const bookIndex = books.findIndex(book => book.id === id);
    if (bookIndex === -1) return null;
    
    books[bookIndex] = { ...books[bookIndex], ...updates };
    return books[bookIndex];
  }
);

export const deleteBook = api(
  { expose: true, method: "DELETE", path: "/books/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const bookIndex = books.findIndex(book => book.id === id);
    if (bookIndex === -1) return { success: false };
    
    books.splice(bookIndex, 1);
    return { success: true };
  }
);
```

## Step 5: Create GraphQL Resolvers

Create `graphql/resolvers.ts`:
```typescript
import * as bookService from "../book/book";

export const resolvers = {
  Query: {
    books: async () => {
      const result = await bookService.getBooks();
      return result.books;
    },
    book: async (_: any, { id }: { id: string }) => {
      return await bookService.getBook({ id });
    },
  },
  
  Mutation: {
    addBook: async (_: any, { title, author, publishedYear }: {
      title: string;
      author: string;
      publishedYear?: number;
    }) => {
      return await bookService.addBook({ title, author, publishedYear });
    },
    
    updateBook: async (_: any, { id, title, author, publishedYear }: {
      id: string;
      title?: string;
      author?: string;
      publishedYear?: number;
    }) => {
      return await bookService.updateBook({ id, title, author, publishedYear });
    },
    
    deleteBook: async (_: any, { id }: { id: string }) => {
      const result = await bookService.deleteBook({ id });
      return result.success;
    },
  },
};
```

## Step 6: Configure Apollo Server

Create `graphql/encore.service.ts`:
```typescript
import { Service } from "encore.dev/service";
export default new Service("graphql");
```

Create `graphql/server.ts`:
```typescript
import { api, Gateway } from "encore.dev/api";
import { ApolloServer } from "apollo-server-express";
import { readFileSync } from "fs";
import { resolvers } from "./resolvers";

const typeDefs = readFileSync("schema.graphql", "utf8");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

export const graphql = api.raw(
  { expose: true, path: "/graphql", method: ["GET", "POST"] },
  server.createHandler({ path: "/graphql" })
);
```

## Step 7: Run and Test

```bash
# Start development server
encore run

# Open GraphQL Playground
# Navigate to http://localhost:4000/graphql
```

### Example Queries

Query all books:
```graphql
query {
  books {
    id
    title
    author
    publishedYear
  }
}
```

Add a new book:
```graphql
mutation {
  addBook(
    title: "1984"
    author: "George Orwell"
    publishedYear: 1949
  ) {
    id
    title
    author
    publishedYear
  }
}
```

Update a book:
```graphql
mutation {
  updateBook(
    id: "1"
    title: "The Great Gatsby (Updated)"
  ) {
    id
    title
    author
    publishedYear
  }
}
```

## Step 8: Deploy

### Encore Cloud
```bash
git add . && git commit -m "GraphQL API implementation"
git push encore
```

### Self-hosting
```bash
encore build docker my-graphql-app
docker run -p 8080:8080 my-graphql-app
```

## Key Features

- **Type-safe resolvers** with TypeScript integration
- **Automatic tracing** for performance monitoring
- **Built-in authentication** support (when configured)
- **Minimal boilerplate** compared to traditional setups
- **GraphQL Playground** for development testing

## Best Practices

1. Use Encore's built-in service communication for resolvers
2. Implement proper error handling in resolvers
3. Consider database integration for production applications
4. Use Encore's authentication for secure GraphQL endpoints
5. Leverage Encore's automatic API documentation generation

This tutorial demonstrates how to create a fully functional GraphQL API with Encore.ts, combining the power of GraphQL with Encore's development experience.

---
## File: ./tutorials/rest-api.md
---

# Building a REST API with Encore and TypeScript: URL Shortener Tutorial

## Overview

This tutorial guides you through creating a URL shortener REST API using Encore and TypeScript. You'll learn how to:

- Create REST APIs
- Use PostgreSQL databases
- Utilize the local development dashboard
- Write and run tests

## Prerequisites

- Node.js installed
- Docker installed
- Encore CLI

## Step 1: Create a New Encore Application

1. Create a new application:
```bash
encore app create
```
Select the "Empty app" template.

2. Create a URL service directory:
```bash
mkdir url
touch url/encore.service.ts
```

3. Define the service in `url/encore.service.ts`:
```typescript
import { Service } from "encore.dev/service";

export default new Service("url");
```

## Step 2: Implement URL Shortening Endpoint

Create `url/url.ts`:

```typescript
import { api } from "encore.dev/api";
import { randomBytes } from "node:crypto";

interface URL {
  id: string;     // short-form URL id
  url: string;    // complete URL
}

interface ShortenParams {
  url: string;    // URL to shorten
}

export const shorten = api(
  { method: "POST", path: "/url", expose: true },
  async ({ url }: ShortenParams): Promise<URL> => {
    const id = randomBytes(6).toString("base64url");
    return { id, url };
  }
);
```

## Step 3: Add Database Storage

1. Create database migration file:
```bash
mkdir url/migrations
touch url/migrations/001_create_tables.up.sql
```

2. Define database schema in `001_create_tables.up.sql`:
```sql
CREATE TABLE url (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL
);
```

3. Update `url/url.ts` to use database:
```typescript
import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { randomBytes } from "node:crypto";

const db = new SQLDatabase("url", { migrations: "./migrations" });

interface URL {
  id: string;
  url: string;
}

interface ShortenParams {
  url: string;
}

export const shorten = api(
  { method: "POST", path: "/url", expose: true },
  async ({ url }: ShortenParams): Promise<URL> => {
    const id = randomBytes(6).toString("base64url");
    await db.exec`
      INSERT INTO url (id, original_url)
      VALUES (${id}, ${url})
    `;
    return { id, url };
  }
);
```

## Step 4: Add URL Retrieval Endpoint

```typescript
import { APIError } from "encore.dev/api";

export const get = api(
  { expose: true, method: "GET", path: "/url/:id" },
  async ({ id }: { id: string }): Promise<URL> => {
    const row = await db.queryRow`
      SELECT original_url FROM url WHERE id = ${id}
    `;
    if (!row) throw APIError.notFound("url not found");
    return { id, url: row.original_url };
  }
);
```

## Step 5: Testing Your API

1. Run your application:
```bash
encore run
```

2. Test using the local development dashboard or curl:
```bash
# Shorten a URL
curl -X POST http://localhost:4000/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://encore.dev"}'

# Retrieve a URL
curl http://localhost:4000/url/{id}
```

## Step 6: Writing Tests

Create `url/url.test.ts`:
```typescript
import { describe, expect, test } from "vitest";
import { shorten, get } from "./url";

describe("url shortener", () => {
  test("shorten and get URL", async () => {
    const url = "https://encore.dev";
    const shortened = await shorten({ url });
    expect(shortened.url).toBe(url);
    
    const retrieved = await get({ id: shortened.id });
    expect(retrieved.url).toBe(url);
  });
});
```

Run tests with:
```bash
encore test
```

## Step 7: Deployment Options

### Self-hosting with Docker
```bash
git add . && git commit -m "Initial commit"
encore build docker my-app
docker run -p 8080:8080 my-app
```

### Encore Cloud
```bash
git push encore
```

## Key Features Demonstrated

- **Type-safe APIs**: Full TypeScript support with compile-time checking
- **Database Integration**: Built-in PostgreSQL support with migrations
- **Testing Framework**: Integrated testing with Vitest
- **Local Development**: Hot reloading and development dashboard
- **Error Handling**: Structured error responses

This tutorial showcases Encore's streamlined approach to building production-ready REST APIs with minimal boilerplate code.

---
## File: ./tutorials/slack-bot.md
---

# Building a Slack Bot with Encore.ts

## Overview

This tutorial guides you through creating a Slack bot using Encore.ts that implements a "/cowsay" command. You'll learn how to:

- Create a serverless backend with webhook integration
- Handle Slack slash commands
- Implement security verification for Slack requests
- Deploy and configure a production Slack bot

## Prerequisites

- Encore CLI
- Slack workspace with admin permissions
- Node.js

## Step 1: Create Encore Application

```bash
encore app create slack-bot
cd slack-bot
```

Note your app ID from the output - you'll need it for Slack configuration.

## Step 2: Create Slack App

1. Go to [Slack API website](https://api.slack.com/apps)
2. Click "Create New App" → "From an app manifest"
3. Use this manifest (replace YOUR_APP_ID):

```json
{
  "display_information": {
    "name": "Cowsay Bot"
  },
  "features": {
    "bot_user": {
      "display_name": "Cowsay Bot",
      "always_online": false
    },
    "slash_commands": [
      {
        "command": "/cowsay",
        "url": "https://staging-YOUR_APP_ID.encr.app/slack/cowsay",
        "description": "Make a cow say something",
        "usage_hint": "your message here"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "commands"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": []
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": false,
    "token_rotation_enabled": false
  }
}
```

## Step 3: Implement Slack Service

Create `slack/encore.service.ts`:
```typescript
import { Service } from "encore.dev/service";
export default new Service("slack");
```

Create `slack/slack.ts`:
```typescript
import { api } from "encore.dev/api";
import { Header } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createHmac, timingSafeEqual } from "node:crypto";

const slackSigningSecret = secret("SlackSigningSecret");

interface SlackRequest {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export const cowsay = api.raw(
  { expose: true, path: "/slack/cowsay", method: "POST" },
  async (req, resp) => {
    // Verify the request came from Slack
    const timestamp = req.header("x-slack-request-timestamp");
    const signature = req.header("x-slack-signature");
    
    if (!verifySlackSignature(req.body, timestamp, signature)) {
      resp.writeHead(401, { "Content-Type": "text/plain" });
      resp.end("Unauthorized");
      return;
    }

    // Parse the form data
    const body = new URLSearchParams(req.body.toString());
    const text = body.get("text") || "Hello, World!";
    
    // Generate cowsay response
    const cowsayText = generateCowsay(text);
    
    // Send response
    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify({
      response_type: "in_channel",
      text: "```" + cowsayText + "```"
    }));
  }
);

function verifySlackSignature(body: Buffer, timestamp: string, signature: string): boolean {
  const signingSecret = slackSigningSecret();
  
  // Reject old requests (older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }
  
  // Compute the expected signature
  const sigBasestring = `v0:${timestamp}:${body.toString()}`;
  const expectedSignature = `v0=${createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')}`;
  
  // Compare signatures securely
  return signature && timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

function generateCowsay(text: string): string {
  const message = text.length > 40 ? text.substring(0, 37) + "..." : text;
  const border = "-".repeat(message.length + 2);
  
  return `
 ${border}
< ${message} >
 ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
}
```

## Step 4: Configure Secrets

Set up the Slack signing secret:

```bash
encore secret set --type dev,staging,prod SlackSigningSecret
```

Find the signing secret in your Slack app settings under "Basic Information" → "App Credentials".

## Step 5: Enhanced Cowsay Implementation

For a more feature-rich implementation, create `slack/cowsay.ts`:

```typescript
interface CowsayOptions {
  eyes?: string;
  tongue?: string;
  mode?: 'default' | 'borg' | 'dead' | 'greedy' | 'paranoid' | 'stoned' | 'tired' | 'wired' | 'young';
}

export function generateAdvancedCowsay(text: string, options: CowsayOptions = {}): string {
  const { eyes = "oo", tongue = "  ", mode = "default" } = options;
  
  // Apply mode-specific settings
  const modeSettings = getModeSettings(mode);
  const actualEyes = modeSettings.eyes || eyes;
  const actualTongue = modeSettings.tongue || tongue;
  
  // Word wrap the text
  const lines = wrapText(text, 38);
  const maxLength = Math.max(...lines.map(line => line.length));
  
  // Create speech bubble
  const border = "-".repeat(maxLength + 2);
  const bubble = [
    ` ${border}`,
    ...lines.map((line, index) => {
      const padding = " ".repeat(maxLength - line.length);
      if (lines.length === 1) return `< ${line}${padding} >`;
      if (index === 0) return `/ ${line}${padding} \\`;
      if (index === lines.length - 1) return `\\ ${line}${padding} /`;
      return `| ${line}${padding} |`;
    }),
    ` ${border}`
  ].join('\n');
  
  // Create cow
  const cow = `
        \\   ^__^
         \\  (${actualEyes})\\_______
            (__)\\       )\\/\\
             ${actualTongue} ||----w |
                ||     ||`;
  
  return bubble + cow;
}

function getModeSettings(mode: string) {
  const modes: Record<string, { eyes?: string; tongue?: string }> = {
    borg: { eyes: "==" },
    dead: { eyes: "xx", tongue: "U " },
    greedy: { eyes: "$$" },
    paranoid: { eyes: "@@" },
    stoned: { eyes: "**", tongue: "U " },
    tired: { eyes: "--" },
    wired: { eyes: "OO" },
    young: { eyes: ".." }
  };
  return modes[mode] || {};
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
}
```

## Step 6: Add Command Parsing

Update `slack/slack.ts` to support different modes:

```typescript
export const cowsay = api.raw(
  { expose: true, path: "/slack/cowsay", method: "POST" },
  async (req, resp) => {
    // ... verification code ...
    
    const body = new URLSearchParams(req.body.toString());
    const text = body.get("text") || "Hello, World!";
    
    // Parse command options
    const parts = text.split(' ');
    const options: CowsayOptions = {};
    let message = text;
    
    // Check for mode flags
    if (parts[0] && parts[0].startsWith('-')) {
      const mode = parts[0].substring(1);
      options.mode = mode as any;
      message = parts.slice(1).join(' ');
    }
    
    const cowsayText = generateAdvancedCowsay(message, options);
    
    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify({
      response_type: "in_channel",
      text: "```" + cowsayText + "```"
    }));
  }
);
```

## Step 7: Deploy and Test

```bash
# Deploy to staging
git add . && git commit -m "Slack bot implementation"
git push encore

# Install the Slack app to your workspace
# Test with: /cowsay Hello from Encore!
# Test modes: /cowsay -dead Something spooky
```

## Usage Examples

Basic usage:
```
/cowsay Hello, World!
```

With modes:
```
/cowsay -dead I'm not feeling well
/cowsay -borg Resistance is futile
/cowsay -stoned Whoa, dude...
```

## Key Features

- **Secure webhook verification** using HMAC signatures
- **Multiple cow modes** for different personalities
- **Word wrapping** for long messages
- **Production-ready deployment** with Encore Cloud
- **Secret management** for API credentials

## Security Considerations

1. Always verify Slack signatures to prevent unauthorized requests
2. Use timing-safe comparison for signature verification
3. Reject old requests to prevent replay attacks
4. Store sensitive credentials in Encore's secret management
5. Use HTTPS endpoints for all Slack integrations

This tutorial demonstrates how to build a robust, secure Slack bot using Encore.ts with minimal infrastructure setup and built-in security best practices.

---
## File: ./tutorials/uptime.md
---

# Building an Event-Driven Uptime Monitoring System with Encore.ts

## Overview

This tutorial guides you through creating an uptime monitoring system using TypeScript and Encore. The application will:
- Check website availability
- Track site status
- Send Slack notifications when sites go down

## Prerequisites

- Docker
- Node.js
- Encore CLI

## Project Structure

The application will consist of three main services:
1. `site` - Manage monitored websites
2. `monitor` - Check website status
3. `slack` - Send notifications

## Step 1: Create Encore Application

```bash
encore app create uptime --example=github.com/encoredev/example-app-uptime/tree/starting-point-ts
```

## Step 2: Create Monitor Service

### Create Service Definition

`monitor/encore.service.ts`:
```typescript
import { Service } from "encore.dev/service";
export default new Service("monitor");
```

### Implement Ping Endpoint

`monitor/ping.ts`:
```typescript
import { api } from "encore.dev/api";

export interface PingParams {
  url: string;
}

export interface PingResponse {
  up: boolean;
}

export const ping = api<PingParams, PingResponse>(
  { expose: true, path: "/ping/:url", method: "GET" },
  async ({ url }) => {
    if (!url.startsWith("http:") && !url.startsWith("https:")) {
      url = "https://" + url;
    }

    try {
      const resp = await fetch(url, { method: "GET" });
      const up = resp.status >= 200 && resp.status < 300;
      return { up };
    } catch (err) {
      return { up: false };
    }
  }
);
```

## Step 3: Create Site Service

### Database Migration

`site/migrations/1_create_tables.up.sql`:
```sql
CREATE TABLE site (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE
);
```

### Site Management

`site/site.ts`:
```typescript
import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("site", { migrations: "./migrations" });

export interface Site {
  id: number;
  url: string;
}

export const add = api(
  { expose: true, method: "POST", path: "/site" },
  async ({ url }: { url: string }): Promise<Site> => {
    const site = await db.queryRow`
      INSERT INTO site (url) VALUES (${url})
      RETURNING id, url
    `;
    return site!;
  }
);

export const list = api(
  { expose: true, method: "GET", path: "/site" },
  async (): Promise<{ sites: Site[] }> => {
    const sites = await db.query`SELECT id, url FROM site`;
    return { sites };
  }
);
```

## Step 4: Event-Driven Architecture

### Pub/Sub Topics

`monitor/check.ts`:
```typescript
import { Topic } from "encore.dev/pubsub";
import { Subscription } from "encore.dev/pubsub";
import { api } from "encore.dev/api";

export interface CheckEvent {
  siteId: number;
  url: string;
}

export const checkTopic = new Topic<CheckEvent>("check", {
  deliveryGuarantee: "at-least-once",
});

export const checkSite = api(
  { expose: true, method: "POST", path: "/check/:siteId" },
  async ({ siteId }: { siteId: number }): Promise<void> => {
    const site = await getSite(siteId);
    await checkTopic.publish({ siteId, url: site.url });
  }
);

export const _ = new Subscription(checkTopic, "check-handler", {
  handler: async (event: CheckEvent) => {
    const result = await ping({ url: event.url });
    console.log(`Site ${event.url} is ${result.up ? "up" : "down"}`);
  },
});
```

## Step 5: Slack Integration

### Slack Service

`slack/slack.ts`:
```typescript
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const slackWebhook = secret("SlackWebhookURL");

export interface NotifyParams {
  text: string;
}

export const notify = api(
  { expose: true, method: "POST", path: "/slack/notify" },
  async ({ text }: NotifyParams): Promise<void> => {
    const webhookURL = slackWebhook();
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }
);
```

## Step 6: Cron Jobs

### Periodic Monitoring

`monitor/check.ts` (additional code):
```typescript
import { CronJob } from "encore.dev/cron";

const _ = new CronJob("check-all-sites", {
  title: "Check all monitored sites",
  schedule: "*/5 * * * *", // Every 5 minutes
  endpoint: checkAllSites,
});

const checkAllSites = api(
  { expose: false },
  async (): Promise<void> => {
    const { sites } = await list();
    for (const site of sites) {
      await checkTopic.publish({ siteId: site.id, url: site.url });
    }
  }
);
```

## Step 7: Run and Test

```bash
# Start development server
encore run

# Add a site to monitor
curl -X POST http://localhost:4000/site -d '{"url":"https://example.com"}'

# Manually check a site
curl -X POST http://localhost:4000/check/1

# View logs and metrics in development dashboard
encore daemon
```

## Key Concepts Demonstrated

- **Event-driven architecture** with Pub/Sub
- **Cron jobs** for scheduled tasks
- **Database integration** with migrations
- **External API integration** (Slack)
- **Secret management** for API keys
- **Service communication** patterns

This tutorial showcases Encore's capabilities for building production-ready, event-driven applications with minimal boilerplate code.