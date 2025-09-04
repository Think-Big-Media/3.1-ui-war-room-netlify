# Builder.io MCP (Model Context Protocol) Integration Guide

## Table of Contents
1. [What is MCP?](#what-is-mcp)
2. [Builder.io Projects & MCP](#builderio-projects--mcp)
3. [Available MCP Servers for Web Development](#available-mcp-servers-for-web-development)
4. [Setting Up MCP with Builder.io](#setting-up-mcp-with-builderio)
5. [Creating Custom MCP Servers](#creating-custom-mcp-servers)
6. [Integration Examples](#integration-examples)
7. [Enterprise Features](#enterprise-features)

---

## What is MCP?

**Model Context Protocol (MCP)** is an open standard released by Anthropic in November 2024 that connects AI assistants to systems where data lives. It's like an API specifically designed for AI interactions.

### Key Benefits:
- **Standardized Integration**: Consistent JSON-RPC format across all services
- **Dynamic Tool Discovery**: AI models can discover available tools automatically
- **Context Window Optimization**: Reduces system prompt size by standardizing parameters
- **Security**: Built-in authentication and permission management

### How It Works:
```
AI Assistant (Claude/Cursor) ←→ MCP Client ←→ MCP Server ←→ Your Data/Tools
```

---

## Builder.io Projects & MCP

Builder.io has integrated MCP into their **Projects** platform, enabling AI to interact with your visual development workflow.

### Builder.io's MCP Features:

1. **Built-in Enterprise Integrations**
   - Atlassian (Jira, Confluence)
   - GitHub repositories
   - Documentation platforms
   - Project management tools

2. **Custom Remote MCP Servers**
   - Enterprise customers can build and deploy their own MCP servers
   - Connect to proprietary systems
   - Maintain data sovereignty

3. **Visual Development Integration**
   - AI can understand your Builder.io components
   - Generate new components based on existing patterns
   - Modify visual content through natural language

### Configuration in Builder.io:
```javascript
// Builder.io MCP Configuration
{
  "mcp_servers": {
    "builder": {
      "type": "remote",
      "url": "https://api.builder.io/mcp",
      "auth": {
        "type": "bearer",
        "token": "YOUR_BUILDER_API_KEY"
      }
    },
    "custom": {
      "type": "remote",
      "url": "https://your-company.com/mcp",
      "auth": {
        "type": "oauth2",
        "client_id": "YOUR_CLIENT_ID"
      }
    }
  }
}
```

---

## Available MCP Servers for Web Development

### CMS & Website Builders

#### 1. **WordPress MCP Servers**
```bash
# WooCommerce MCP
npm install @mcp/woocommerce-server

# Elementor MCP
npm install @mcp/elementor-server

# General WordPress
npm install @mcp/wordpress-server
```

**Features:**
- CRUD operations on posts/pages
- Media management
- Plugin/theme interaction
- User management
- Custom post types

#### 2. **Ghost CMS MCP**
```bash
npm install @mcp/ghost-server
```

**Features:**
- Blog post creation/editing
- Tag management
- Author management
- Publishing workflow

#### 3. **Directus MCP**
```bash
npm install @mcp/directus-server
```

**Features:**
- Headless CMS operations
- API-first content management
- Custom collections
- Asset management

#### 4. **Hugo Static Site MCP**
```bash
npm install @mcp/hugo-server
```

**Features:**
- Static site generation
- Content creation
- Build management
- Deploy automation

### Development Tools

#### 5. **GitHub MCP Server**
```bash
npm install @github/mcp-server
```

**Features:**
- Repository management
- Issue/PR automation
- Code analysis
- CI/CD monitoring

#### 6. **Documentation MCP (Augments)**
```bash
npm install @augmnt/augments-mcp-server
```

**Features:**
- Access to 90+ framework docs
- React, Next.js, Vue, Angular
- Tailwind CSS, Bootstrap
- Real-time documentation updates

### Database & APIs

#### 7. **PostgreSQL MCP**
```bash
npm install @mcp/postgresql-server
```

#### 8. **MongoDB MCP**
```bash
npm install @mcp/mongodb-server
```

#### 9. **Supabase MCP**
```bash
npm install @mcp/supabase-server
```

---

## Setting Up MCP with Builder.io

### Step 1: Install MCP Client

```bash
# For Claude Desktop
brew install claude-desktop

# For VS Code
# Install the GitHub Copilot extension with MCP support

# For custom implementations
npm install @modelcontextprotocol/sdk
```

### Step 2: Configure Builder.io Connection

Create `~/.config/claude/mcp_config.json`:

```json
{
  "servers": {
    "builder": {
      "command": "npx",
      "args": ["@builder.io/mcp-server"],
      "env": {
        "BUILDER_API_KEY": "your-api-key",
        "BUILDER_SPACE_ID": "your-space-id"
      }
    },
    "github": {
      "command": "npx",
      "args": ["@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["@mcp/supabase-server"],
      "env": {
        "SUPABASE_URL": "your-project-url",
        "SUPABASE_KEY": "your-anon-key"
      }
    }
  }
}
```

### Step 3: Test Connection

```javascript
// Test MCP connection
const { MCPClient } = require('@modelcontextprotocol/sdk');

async function testMCP() {
  const client = new MCPClient();
  
  // Connect to Builder.io MCP
  await client.connect('builder');
  
  // List available tools
  const tools = await client.listTools();
  console.log('Available Builder.io tools:', tools);
  
  // Example: Create a new component
  const result = await client.callTool('create_component', {
    name: 'HeroSection',
    model: 'page',
    data: {
      title: 'Welcome to our site',
      subtitle: 'Built with AI'
    }
  });
  
  console.log('Component created:', result);
}

testMCP();
```

---

## Creating Custom MCP Servers

### Basic MCP Server Structure

```typescript
// builder-custom-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { Builder } from '@builder.io/sdk';

class BuilderMCPServer extends Server {
  private builder: Builder;

  constructor() {
    super({
      name: 'builder-custom',
      version: '1.0.0',
      description: 'Custom Builder.io MCP Server'
    });

    this.builder = new Builder('YOUR_API_KEY');
  }

  // Define available tools
  async listTools() {
    return [
      {
        name: 'get_content',
        description: 'Fetch Builder.io content',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            id: { type: 'string' }
          }
        }
      },
      {
        name: 'create_content',
        description: 'Create new Builder.io content',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            data: { type: 'object' }
          }
        }
      },
      {
        name: 'update_component',
        description: 'Update a Builder.io component',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            updates: { type: 'object' }
          }
        }
      }
    ];
  }

  // Implement tool handlers
  async callTool(name: string, args: any) {
    switch (name) {
      case 'get_content':
        return await this.getContent(args);
      case 'create_content':
        return await this.createContent(args);
      case 'update_component':
        return await this.updateComponent(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async getContent({ model, id }) {
    const content = await this.builder.get(model, { id }).promise();
    return { content };
  }

  private async createContent({ model, data }) {
    const result = await this.builder.create(model, data);
    return { id: result.id, status: 'created' };
  }

  private async updateComponent({ id, updates }) {
    const result = await this.builder.update(id, updates);
    return { status: 'updated', result };
  }

  // Define available resources (read-only data)
  async listResources() {
    return [
      {
        uri: 'builder://models',
        name: 'Builder.io Models',
        description: 'List of available content models',
        mimeType: 'application/json'
      },
      {
        uri: 'builder://components',
        name: 'Custom Components',
        description: 'Registered custom components',
        mimeType: 'application/json'
      }
    ];
  }

  async readResource(uri: string) {
    if (uri === 'builder://models') {
      const models = await this.builder.getModels();
      return { models };
    }
    if (uri === 'builder://components') {
      const components = await this.builder.getComponents();
      return { components };
    }
    throw new Error(`Unknown resource: ${uri}`);
  }
}

// Start the server
const server = new BuilderMCPServer();
server.start();
```

### Deploy as Remote MCP Server

```javascript
// server.js - Express wrapper for MCP
const express = require('express');
const { MCPServer } = require('./builder-custom-mcp-server');

const app = express();
const mcpServer = new MCPServer();

app.use(express.json());

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;
    const result = await mcpServer.handleRequest(method, params);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(3000, () => {
  console.log('MCP Server running on port 3000');
});
```

### Deploy to Cloudflare Workers

```javascript
// cloudflare-worker.js
import { MCPServer } from './builder-custom-mcp-server';

export default {
  async fetch(request, env) {
    const mcpServer = new MCPServer(env.BUILDER_API_KEY);
    
    if (request.method === 'POST') {
      const { method, params } = await request.json();
      const result = await mcpServer.handleRequest(method, params);
      
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('MCP Server Ready', { status: 200 });
  }
};
```

---

## Integration Examples

### 1. AI-Powered Component Generation

```javascript
// Using MCP to generate Builder.io components with AI
async function generateComponent(description) {
  const mcp = new MCPClient();
  await mcp.connect('builder');
  
  // AI generates component based on description
  const componentSpec = await mcp.callTool('ai_generate', {
    prompt: `Create a Builder.io component for: ${description}`,
    model: 'hero-section',
    style: 'modern'
  });
  
  // Create component in Builder.io
  const result = await mcp.callTool('create_component', {
    name: componentSpec.name,
    code: componentSpec.code,
    inputs: componentSpec.inputs
  });
  
  return result;
}

// Usage
const hero = await generateComponent(
  "A hero section with video background, centered title, and CTA button"
);
```

### 2. Content Synchronization

```javascript
// Sync content between Builder.io and other CMS
async function syncContent() {
  const builderMCP = new MCPClient('builder');
  const wordpressMCP = new MCPClient('wordpress');
  
  // Get content from WordPress
  const posts = await wordpressMCP.callTool('get_posts', {
    limit: 10,
    status: 'published'
  });
  
  // Create corresponding content in Builder.io
  for (const post of posts) {
    await builderMCP.callTool('create_content', {
      model: 'blog-post',
      data: {
        title: post.title,
        content: post.content,
        author: post.author,
        publishedAt: post.date
      }
    });
  }
  
  console.log(`Synced ${posts.length} posts`);
}
```

### 3. Visual Development Workflow

```javascript
// AI-assisted visual development workflow
class VisualDevelopmentMCP {
  async designToCode(figmaUrl) {
    // 1. Import design from Figma
    const design = await this.mcp.callTool('import_figma', {
      url: figmaUrl
    });
    
    // 2. Generate Builder.io components
    const components = await this.mcp.callTool('generate_components', {
      design: design,
      framework: 'react',
      styling: 'tailwind'
    });
    
    // 3. Register components with Builder
    for (const component of components) {
      await this.mcp.callTool('register_component', {
        name: component.name,
        code: component.code,
        props: component.props
      });
    }
    
    // 4. Create page using components
    const page = await this.mcp.callTool('create_page', {
      title: 'New Landing Page',
      components: components.map(c => c.name)
    });
    
    return page;
  }
}
```

### 4. Multi-Platform Publishing

```javascript
// Publish Builder.io content to multiple platforms
async function multiPublish(contentId) {
  const platforms = ['wordpress', 'ghost', 'contentful'];
  const results = [];
  
  // Get content from Builder.io
  const content = await builderMCP.callTool('get_content', {
    id: contentId
  });
  
  // Publish to each platform
  for (const platform of platforms) {
    const platformMCP = new MCPClient(platform);
    
    const result = await platformMCP.callTool('create_post', {
      title: content.title,
      content: content.body,
      tags: content.tags,
      metadata: content.metadata
    });
    
    results.push({
      platform,
      url: result.url,
      id: result.id
    });
  }
  
  return results;
}
```

---

## Enterprise Features

### 1. Custom Authentication

```javascript
// OAuth2 authentication for enterprise MCP
class EnterpriseMCPAuth {
  async authenticate() {
    const token = await fetch('https://auth.company.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: 'mcp:read mcp:write'
      })
    }).then(res => res.json());
    
    return token.access_token;
  }
}
```

### 2. Data Governance

```javascript
// Enterprise data governance for MCP
class GovernedMCPServer extends MCPServer {
  async callTool(name, args, context) {
    // Check permissions
    if (!this.hasPermission(context.user, name)) {
      throw new Error('Permission denied');
    }
    
    // Audit logging
    await this.auditLog({
      user: context.user,
      action: name,
      args: args,
      timestamp: new Date()
    });
    
    // Data masking for sensitive info
    const maskedArgs = this.maskSensitiveData(args);
    
    // Execute tool with governance
    const result = await super.callTool(name, maskedArgs);
    
    // Compliance checks
    await this.checkCompliance(result);
    
    return result;
  }
  
  maskSensitiveData(data) {
    // Mask PII, credentials, etc.
    return data;
  }
  
  async checkCompliance(data) {
    // GDPR, CCPA, etc. compliance checks
    return true;
  }
}
```

### 3. Multi-Tenant Architecture

```javascript
// Multi-tenant MCP server for enterprises
class MultiTenantMCPServer {
  constructor() {
    this.tenants = new Map();
  }
  
  async connectTenant(tenantId, config) {
    const tenant = {
      id: tenantId,
      builder: new Builder(config.apiKey),
      permissions: config.permissions,
      dataIsolation: config.dataIsolation
    };
    
    this.tenants.set(tenantId, tenant);
  }
  
  async callTool(name, args, context) {
    const tenant = this.tenants.get(context.tenantId);
    
    if (!tenant) {
      throw new Error('Invalid tenant');
    }
    
    // Ensure data isolation
    const isolatedArgs = {
      ...args,
      tenantId: tenant.id,
      scope: tenant.dataIsolation
    };
    
    return await this.executeWithTenant(tenant, name, isolatedArgs);
  }
}
```

---

## Best Practices

### 1. Security
- Always use authentication for MCP servers
- Implement rate limiting
- Validate all inputs
- Use HTTPS for remote servers
- Rotate API keys regularly

### 2. Performance
- Cache frequently accessed data
- Implement pagination for large datasets
- Use connection pooling
- Optimize query patterns

### 3. Error Handling
```javascript
class RobustMCPServer extends MCPServer {
  async callTool(name, args) {
    try {
      return await super.callTool(name, args);
    } catch (error) {
      // Log error
      console.error(`MCP Error in ${name}:`, error);
      
      // Return user-friendly error
      return {
        error: true,
        message: this.getUserFriendlyError(error),
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
}
```

### 4. Testing
```javascript
// Test MCP server implementation
describe('BuilderMCPServer', () => {
  let server;
  
  beforeEach(() => {
    server = new BuilderMCPServer();
  });
  
  test('should list available tools', async () => {
    const tools = await server.listTools();
    expect(tools).toContain('create_component');
    expect(tools).toContain('get_content');
  });
  
  test('should create component', async () => {
    const result = await server.callTool('create_component', {
      name: 'TestComponent',
      model: 'test'
    });
    
    expect(result.status).toBe('created');
    expect(result.id).toBeDefined();
  });
});
```

---

## Future Roadmap

### Coming Soon to Builder.io MCP:
1. **Visual Copilot Integration** - AI-powered design-to-code via MCP
2. **Real-time Collaboration** - Multi-user MCP sessions
3. **Advanced Analytics** - Performance insights through MCP
4. **Edge Deployment** - MCP servers at the edge for low latency
5. **Plugin Marketplace** - Community MCP servers for Builder.io

### Industry Trends:
- More CMS platforms adopting MCP
- Standardization of MCP across AI tools
- Enterprise-grade MCP solutions
- MCP orchestration platforms

---

## Resources

### Official Documentation
- [Model Context Protocol Spec](https://spec.modelcontextprotocol.io)
- [Builder.io MCP Docs](https://www.builder.io/c/docs/mcp-servers)
- [MCP SDK Documentation](https://modelcontextprotocol.io/docs)

### GitHub Repositories
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Builder.io SDK](https://github.com/BuilderIO/builder)

### Community
- [MCP Discord](https://discord.gg/mcp)
- [Builder.io Forum](https://forum.builder.io)
- [Stack Overflow MCP Tag](https://stackoverflow.com/questions/tagged/mcp)

---

*Last Updated: December 2024*
*Version: 1.0*