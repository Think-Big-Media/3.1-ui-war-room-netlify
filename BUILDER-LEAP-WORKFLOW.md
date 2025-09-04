# Builder.io + War Room 3.0 Integration Status

## ✅ INTEGRATION COMPLETE - DEPLOYED TO PRODUCTION

**Production URL**: https://war-room-3-ui.onrender.com  
**Builder.io API Key**: 8686f311497044c0932b7d2247296478  
**Deployment Status**: LIVE as of August 23, 2025 11:09 UTC

## Quick Status Check

### ✅ What's Working:
- **@builder.io/react** package installed
- **API Key** configured: `8686f311497044c0932b7d2247296478`
- **Routes** configured for `/builder/*` paths
- **Components** registered (Dashboard, Analytics, etc.)
- **Production** deployed to Render

### 📝 Next Steps:
1. **Update Builder.io Preview URL**:
   - Go to [Builder.io Settings](https://builder.io/account/space)
   - Change Preview URL to: `https://war-room-3-ui.onrender.com`
   
2. **Create Test Content**:
   - In Builder.io, create page for `/builder/test`
   - Add components and publish
   - Test at: https://war-room-3-ui.onrender.com/builder/test

3. **Verify Integration**:
   - Check https://war-room-3-ui.onrender.com/builder/test
   - Should show either your content or "No content found"

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Builder.io Setup & Configuration](#builderio-setup--configuration)
4. [Leap.new Backend Development](#leapnew-backend-development)
5. [Integration Implementation](#integration-implementation)
6. [Deployment Strategy](#deployment-strategy)
7. [Real-World Examples](#real-world-examples)
8. [Advanced Patterns](#advanced-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Executive Summary

This document provides a production-ready workflow combining **Builder.io** for visual frontend development and **Leap.new** for AI-powered backend development. This combination enables:

- **80% faster development** through AI assistance
- **Visual editing** for non-technical team members
- **Production-grade backends** deployed to AWS/GCP
- **Type-safe APIs** with automatic documentation
- **Full control** over code and infrastructure

### Key Technologies
- **Frontend**: Builder.io with React/Vue/Angular
- **Backend**: Leap.new with Encore.ts framework
- **AI Models**: Visual Copilot 2.0 (Builder) + Claude 4 Sonnet (Leap)
- **Deployment**: AWS/GCP (backend) + Vercel/Netlify (frontend)

---

## Architecture Overview

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Builder.io Visual Components                  │  │
│  │         (React/Vue/Angular + Builder SDK)               │  │
│  └────────────────────┬────────────────────────────────────┘  │
└───────────────────────┼────────────────────────────────────────┘
                        │ HTTPS/REST/GraphQL
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                      CDN LAYER (CloudFront)                     │
│                   Static Assets + API Gateway                   │
└────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES (Leap.new)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Auth API    │  │  Data API    │  │  Admin API   │        │
│  │  /auth/*     │  │  /api/data/* │  │  /admin/*    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │           Encore.ts Microservices                   │        │
│  │  - User Service    - Product Service               │        │
│  │  - Order Service   - Analytics Service             │        │
│  └────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (AWS/GCP)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │    Redis     │  │  S3/GCS      │        │
│  │   Database   │  │    Cache     │  │   Storage    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Builder.io frontend component
2. **Component Logic** → Fetches data via API
3. **API Gateway** → Routes to appropriate backend service
4. **Encore.ts Service** → Processes request with type safety
5. **Database/Cache** → Data retrieval/storage
6. **Response** → Type-safe JSON back to frontend
7. **Builder Component** → Renders with live data

---

## Builder.io Setup & Configuration

### 1. Initial Setup

```bash
# Install Builder CLI and SDK
npm install -g @builder.io/cli
npm install @builder.io/react @builder.io/sdk-react
```

### 2. Configure Builder.io Project

```javascript
// builder.config.js
import { Builder } from '@builder.io/react';

// Initialize Builder with your API key
Builder.apiKey = process.env.BUILDER_PUBLIC_API_KEY;

// Configure default settings
Builder.set({
  customInsertMenu: true,
  hideAnimateTab: false,
  hideDataTab: false,
  hideStyleTab: false,
  hideOptionsTab: false,
});
```

### 3. Register Custom Components

```javascript
// components/ProductCard.jsx
import { Builder } from '@builder.io/react';
import { useEffect, useState } from 'react';

// Your custom component that fetches from Leap backend
const ProductCard = ({ productId, apiEndpoint }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/api/products/${productId}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, apiEndpoint]);

  if (loading) return <div className="skeleton-loader">Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span className="price">${product.price}</span>
      <button className="add-to-cart">Add to Cart</button>
    </div>
  );
};

// Register with Builder
Builder.registerComponent(ProductCard, {
  name: 'Product Card',
  inputs: [
    {
      name: 'productId',
      type: 'string',
      required: true,
      helperText: 'The ID of the product to display'
    },
    {
      name: 'apiEndpoint',
      type: 'string',
      defaultValue: process.env.NEXT_PUBLIC_API_URL,
      helperText: 'API endpoint for fetching product data'
    }
  ],
  image: 'https://cdn.builder.io/api/v1/image/product-card-icon.svg',
  models: ['page', 'product-page', 'landing-page']
});

export default ProductCard;
```

### 4. Implement Data Fetching

```javascript
// pages/[...page].jsx - Next.js example
import { builder, BuilderComponent } from '@builder.io/react';
import { getAsyncProps } from '@builder.io/utils';

// Fetch Builder content with external API data
export async function getStaticProps({ params }) {
  const page = await builder
    .get('page', {
      userAttributes: {
        urlPath: '/' + (params?.page?.join('/') || ''),
      },
    })
    .promise();

  // Fetch additional data from Leap backend
  await getAsyncProps(page, {
    async ProductList(props) {
      const products = await fetch(
        `${process.env.LEAP_API_URL}/api/products?category=${props.category}`
      ).then(res => res.json());
      
      return { products };
    },
    async UserProfile(props) {
      const user = await fetch(
        `${process.env.LEAP_API_URL}/api/users/current`,
        {
          headers: {
            'Authorization': `Bearer ${props.token}`
          }
        }
      ).then(res => res.json());
      
      return { user };
    }
  });

  return {
    props: {
      page: page || null,
    },
    revalidate: 5,
  };
}

export default function Page({ page }) {
  return (
    <BuilderComponent
      model="page"
      content={page}
      options={{
        includeRefs: true,
        noTraverse: false,
      }}
    />
  );
}
```

---

## Leap.new Backend Development

### 1. Create Encore.ts Project Structure

```bash
# Leap.new will generate this structure
my-backend/
├── encore.app           # Encore application config
├── package.json
├── tsconfig.json
├── auth/                # Authentication service
│   ├── encore.service.ts
│   ├── auth.ts
│   └── auth.test.ts
├── products/            # Product service
│   ├── encore.service.ts
│   ├── products.ts
│   └── db/
│       └── migrations/
├── users/               # User service
│   ├── encore.service.ts
│   ├── users.ts
│   └── types.ts
└── shared/              # Shared utilities
    └── types.ts
```

### 2. Define API Endpoints

```typescript
// products/products.ts
import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Define database
const db = new SQLDatabase("products", {
  migrations: "./db/migrations",
});

// Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

// List products endpoint
export const listProducts = api(
  { 
    expose: true, 
    method: "GET", 
    path: "/api/products",
    auth: false  // Public endpoint
  },
  async ({ category, limit = 20 }: { 
    category?: string; 
    limit?: number 
  }): Promise<{ products: Product[] }> => {
    let query = `SELECT * FROM products WHERE 1=1`;
    const params: any[] = [];
    
    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }
    
    query += ` LIMIT ${limit}`;
    
    const products = await db.query<Product>(query, params);
    return { products };
  }
);

// Get single product
export const getProduct = api(
  { 
    expose: true, 
    method: "GET", 
    path: "/api/products/:id",
    auth: false
  },
  async ({ id }: { id: string }): Promise<Product> => {
    const product = await db.queryOne<Product>(
      `SELECT * FROM products WHERE id = $1`,
      [id]
    );
    
    if (!product) {
      throw new Error(`Product ${id} not found`);
    }
    
    return product;
  }
);

// Create product (authenticated)
export const createProduct = api(
  { 
    expose: true, 
    method: "POST", 
    path: "/api/products",
    auth: true  // Requires authentication
  },
  async (product: Omit<Product, 'id'>): Promise<Product> => {
    const id = crypto.randomUUID();
    const newProduct = { id, ...product };
    
    await db.exec(
      `INSERT INTO products (id, name, description, price, category, image, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, product.name, product.description, product.price, 
       product.category, product.image, product.stock]
    );
    
    return newProduct;
  }
);
```

### 3. Authentication Service

```typescript
// auth/auth.ts
import { api } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { Secret } from "encore.dev/storage/secrets";
import * as jwt from "jsonwebtoken";

// JWT secret stored securely
const jwtSecret = new Secret("jwt-secret");

// Auth data interface
interface AuthData {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

// Authentication handler
export const authenticate = authHandler<AuthData>(
  async (token: string): Promise<AuthData> => {
    try {
      const secret = await jwtSecret.get();
      const decoded = jwt.verify(token, secret) as AuthData;
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
);

// Login endpoint
export const login = api(
  { expose: true, method: "POST", path: "/auth/login" },
  async ({ email, password }: { 
    email: string; 
    password: string 
  }): Promise<{ token: string; user: AuthData }> => {
    // Validate credentials (simplified)
    const user = await validateUser(email, password);
    
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    const authData: AuthData = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const secret = await jwtSecret.get();
    const token = jwt.sign(authData, secret, { expiresIn: '24h' });
    
    return { token, user: authData };
  }
);
```

### 4. Microservices Communication

```typescript
// orders/orders.ts
import { api } from "encore.dev/api";
import { getProduct } from "~encore/clients/products";  // Import from products service

export const createOrder = api(
  { expose: true, method: "POST", path: "/api/orders", auth: true },
  async (authData: AuthData, orderData: CreateOrderRequest): Promise<Order> => {
    // Call products service to validate products
    const productPromises = orderData.items.map(item => 
      getProduct({ id: item.productId })
    );
    
    const products = await Promise.all(productPromises);
    
    // Calculate total
    const total = products.reduce((sum, product, index) => {
      return sum + (product.price * orderData.items[index].quantity);
    }, 0);
    
    // Create order
    const order = await createOrderInDB({
      userId: authData.userId,
      items: orderData.items,
      total,
      status: 'pending'
    });
    
    return order;
  }
);
```

---

## Integration Implementation

### 1. Environment Configuration

```bash
# .env.local (Frontend - Builder.io)
BUILDER_PUBLIC_API_KEY=your_builder_api_key
NEXT_PUBLIC_LEAP_API_URL=https://api.your-backend.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# encore.app (Backend - Leap.new)
{
  "id": "your-app-id",
  "name": "your-app-name"
}
```

### 2. API Client Configuration

```javascript
// lib/api-client.js
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_LEAP_API_URL;
    this.token = null;
  }

  setAuthToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Product methods
  async getProducts(category) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/api/products${params}`);
  }

  async getProduct(id) {
    return this.request(`/api/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setAuthToken(response.token);
    return response;
  }

  async logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
}

export default new APIClient();
```

### 3. Builder.io Component with API Integration

```javascript
// components/DynamicProductGrid.jsx
import { Builder } from '@builder.io/react';
import { useEffect, useState } from 'react';
import apiClient from '../lib/api-client';

const DynamicProductGrid = ({ 
  category, 
  columns = 3, 
  showPrice = true,
  showAddToCart = true 
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProducts(category);
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const handleAddToCart = async (productId) => {
    try {
      // Add to cart logic
      await apiClient.request('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 })
      });
      
      // Show success notification
      if (window.Builder) {
        window.Builder.notifySuccess('Product added to cart!');
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="grid-skeleton">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div 
      className="product-grid"
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '20px' 
      }}
    >
      {products.map(product => (
        <div key={product.id} className="product-item">
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          {showPrice && <span className="price">${product.price}</span>}
          {showAddToCart && (
            <button 
              onClick={() => handleAddToCart(product.id)}
              className="add-to-cart-btn"
            >
              Add to Cart
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// Register with Builder
Builder.registerComponent(DynamicProductGrid, {
  name: 'Dynamic Product Grid',
  inputs: [
    {
      name: 'category',
      type: 'string',
      enum: ['electronics', 'clothing', 'books', 'home'],
      defaultValue: 'electronics',
    },
    {
      name: 'columns',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
    },
    {
      name: 'showPrice',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'showAddToCart',
      type: 'boolean',
      defaultValue: true,
    }
  ],
  image: 'https://cdn.builder.io/api/v1/image/grid-icon.svg',
});

export default DynamicProductGrid;
```

### 4. Real-time Updates with WebSockets

```javascript
// hooks/useRealtimeData.js
import { useEffect, useState } from 'react';

export const useRealtimeData = (endpoint, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}${endpoint}`);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [endpoint]);

  return { data, connected };
};

// Usage in Builder component
const LiveInventory = ({ productId }) => {
  const { data: inventory, connected } = useRealtimeData(
    `/ws/inventory/${productId}`
  );

  return (
    <div className="live-inventory">
      {connected && <span className="live-indicator">● LIVE</span>}
      <p>Stock: {inventory?.stock || 'Loading...'}</p>
      {inventory?.stock < 5 && (
        <span className="low-stock">Only {inventory.stock} left!</span>
      )}
    </div>
  );
};
```

---

## Deployment Strategy

### 1. Backend Deployment (Leap.new → AWS/GCP)

```yaml
# encore.deploy.yml (generated by Leap)
name: production
clouds:
  - aws:
      region: us-east-1
      account_id: "123456789012"
  
services:
  auth:
    instances: 2
    cpu: 0.5
    memory: 1024
  
  products:
    instances: 3
    cpu: 1
    memory: 2048
    autoscaling:
      min_instances: 2
      max_instances: 10
      target_cpu: 70
  
  database:
    type: postgres
    version: "14"
    instance_class: db.t3.medium
    storage: 100
    backup_retention: 7
  
  redis:
    type: redis
    version: "7.0"
    instance_class: cache.t3.micro
```

### 2. Frontend Deployment (Builder.io → Vercel)

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "BUILDER_PUBLIC_API_KEY": "@builder_api_key",
    "NEXT_PUBLIC_LEAP_API_URL": "@leap_api_url"
  },
  "functions": {
    "pages/api/revalidate.js": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.your-backend.com/api/:path*"
    }
  ]
}
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Full Stack

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Encore CLI
        run: curl -L https://encore.dev/install.sh | bash
      
      - name: Deploy to Encore
        run: |
          cd backend
          encore deploy prod
        env:
          ENCORE_AUTH_TOKEN: ${{ secrets.ENCORE_AUTH_TOKEN }}
  
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Real-World Examples

### E-commerce Platform

```javascript
// Complete e-commerce integration example
const EcommercePlatform = {
  // Builder.io Components
  components: [
    'ProductGrid',
    'ShoppingCart',
    'CheckoutForm',
    'OrderHistory',
    'UserProfile'
  ],
  
  // Leap.new Services
  services: [
    'products-service',
    'inventory-service',
    'orders-service',
    'payments-service',
    'shipping-service',
    'notifications-service'
  ],
  
  // Integration Points
  apis: {
    products: '/api/products',
    cart: '/api/cart',
    checkout: '/api/checkout',
    orders: '/api/orders',
    user: '/api/user'
  },
  
  // Real-time Features
  websockets: {
    inventory: '/ws/inventory',
    orderStatus: '/ws/orders',
    notifications: '/ws/notifications'
  }
};
```

### SaaS Dashboard

```typescript
// Dashboard with real-time analytics
interface DashboardConfig {
  builder: {
    pages: ['dashboard', 'analytics', 'reports', 'settings'];
    components: ['Chart', 'DataTable', 'MetricCard', 'ActivityFeed'];
  };
  
  leap: {
    services: ['analytics', 'metrics', 'reporting', 'alerts'];
    databases: ['timeseries', 'postgresql', 'redis'];
    jobs: ['aggregation', 'cleanup', 'export'];
  };
  
  integration: {
    polling: 5000;  // 5 second refresh
    caching: true;
    authentication: 'jwt';
  };
}
```

---

## Advanced Patterns

### 1. Optimistic UI Updates

```javascript
// Optimistic updates in Builder components
const OptimisticCart = () => {
  const [cart, setCart] = useState([]);
  const [pending, setPending] = useState([]);

  const addToCart = async (product) => {
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...product, id: tempId, pending: true };
    
    setCart([...cart, optimisticItem]);
    setPending([...pending, tempId]);

    try {
      // Actual API call
      const result = await apiClient.addToCart(product.id);
      
      // Replace optimistic item with real one
      setCart(prev => 
        prev.map(item => 
          item.id === tempId ? result : item
        )
      );
      setPending(prev => prev.filter(id => id !== tempId));
    } catch (error) {
      // Rollback on error
      setCart(prev => prev.filter(item => item.id !== tempId));
      setPending(prev => prev.filter(id => id !== tempId));
      
      // Show error
      Builder.notifyError('Failed to add to cart');
    }
  };

  return (
    <div className="cart">
      {cart.map(item => (
        <div 
          key={item.id} 
          className={pending.includes(item.id) ? 'pending' : ''}
        >
          {/* Cart item UI */}
        </div>
      ))}
    </div>
  );
};
```

### 2. Server-Side Rendering with Caching

```javascript
// Next.js with ISR and Builder.io
export async function getStaticProps({ params }) {
  // Fetch from Builder
  const page = await builder
    .get('page', {
      userAttributes: { urlPath: `/${params.slug}` },
      cachebust: process.env.NODE_ENV === 'production',
      cache: new NodeCache({ stdTTL: 600 })  // 10 minute cache
    })
    .promise();

  // Fetch from Leap backend with caching
  const products = await fetch(
    `${process.env.LEAP_API_URL}/api/products`,
    {
      next: { revalidate: 60 },  // Next.js 13+ caching
      headers: {
        'Cache-Control': 'max-age=60, stale-while-revalidate=300'
      }
    }
  ).then(res => res.json());

  return {
    props: { page, products },
    revalidate: 60,  // ISR: regenerate every 60 seconds
  };
}
```

### 3. Feature Flags & A/B Testing

```javascript
// Feature flags with Builder.io
Builder.registerComponent(FeatureComponent, {
  name: 'Feature Component',
  inputs: [
    {
      name: 'feature',
      type: 'string',
      enum: ['feature-a', 'feature-b', 'feature-c']
    }
  ],
  // A/B test variants
  variants: [
    { name: 'Control', code: ControlComponent },
    { name: 'Variant A', code: VariantAComponent },
    { name: 'Variant B', code: VariantBComponent }
  ]
});

// Backend feature flags
const checkFeatureFlag = api(
  { expose: true, method: "GET", path: "/api/features/:flag" },
  async ({ flag, userId }: { flag: string; userId?: string }) => {
    const isEnabled = await featureFlagService.check(flag, userId);
    return { enabled: isEnabled };
  }
);
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. CORS Errors
```javascript
// Backend: Configure CORS in Encore
export const cors = {
  allowOrigins: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app',
    'https://builder.io'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: true
};
```

#### 2. Authentication Issues
```javascript
// Ensure token refresh in frontend
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    const { token } = await response.json();
    apiClient.setAuthToken(token);
    return token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
};

// Auto-refresh before expiry
setInterval(refreshToken, 20 * 60 * 1000);  // Every 20 minutes
```

#### 3. Builder.io Preview Issues
```javascript
// Enable preview mode
export async function getServerSideProps({ query, res }) {
  const isPreview = query.preview === 'true';
  
  if (isPreview) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
  }
  
  const content = await builder
    .get('page', {
      userAttributes: { urlPath: '/' },
      preview: isPreview,
      includeUnpublished: isPreview
    })
    .promise();
    
  return { props: { content, isPreview } };
}
```

#### 4. Performance Optimization
```javascript
// Lazy load Builder components
import dynamic from 'next/dynamic';

const BuilderComponent = dynamic(
  () => import('@builder.io/react').then(mod => mod.BuilderComponent),
  {
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

// Optimize API calls
const batchAPIRequests = async (requests) => {
  const results = await Promise.allSettled(requests);
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : null
  );
};
```

---

## Security Best Practices

### 1. API Security
```typescript
// Rate limiting in Encore
import { rateLimit } from "encore.dev/ratelimit";

export const secureEndpoint = api(
  { 
    expose: true, 
    method: "POST", 
    path: "/api/secure",
    auth: true,
    rateLimit: rateLimit({
      requests: 100,
      per: "1h",
      key: (req) => req.auth.userId
    })
  },
  async (data: SecureData) => {
    // Validate input
    const validated = await validateSchema(data);
    
    // Process request
    return processSecurely(validated);
  }
);
```

### 2. Environment Variables
```bash
# Never commit these
.env.local
.env.production

# Use secrets management
- Vercel Environment Variables
- AWS Secrets Manager
- GCP Secret Manager
- Encore Secrets
```

### 3. Content Security Policy
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://cdn.builder.io;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              connect-src 'self' https://api.your-backend.com;
            `.replace(/\n/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

---

## Monitoring & Analytics

### 1. Application Monitoring
```javascript
// Frontend monitoring
import { init as initSentry } from '@sentry/nextjs';
import { posthog } from 'posthog-js';

// Initialize monitoring
initSentry({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
});

// Track Builder.io events
Builder.registerComponent(TrackedButton, {
  name: 'Tracked Button',
  inputs: [
    { name: 'text', type: 'string' },
    { name: 'eventName', type: 'string' }
  ],
  onChange: (options) => {
    posthog.capture('builder_component_change', {
      component: 'TrackedButton',
      ...options
    });
  }
});
```

### 2. Backend Monitoring
```typescript
// Encore provides built-in monitoring
// Access at https://encore.dev/app/[your-app]

// Custom metrics
import { metric } from "encore.dev/metrics";

const apiLatency = metric.histogram("api_latency_ms", {
  unit: "milliseconds",
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

export const trackedEndpoint = api(
  { expose: true, method: "GET", path: "/api/tracked" },
  async () => {
    const start = Date.now();
    
    try {
      const result = await performOperation();
      return result;
    } finally {
      apiLatency.record(Date.now() - start);
    }
  }
);
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Builder.io | Growth | $99-299/month |
| Leap.new | Pro | $199/month |
| AWS/GCP (Backend) | Small-Medium | $200-500/month |
| Vercel (Frontend) | Pro | $20/month |
| **Total** | | **$518-1018/month** |

### Cost Optimization Tips

1. **Use CDN aggressively** - Cache static content
2. **Implement API caching** - Redis for frequently accessed data
3. **Optimize images** - Use next/image or Cloudinary
4. **Use serverless where possible** - Pay per use
5. **Monitor and optimize database queries** - Prevent N+1 queries
6. **Implement request batching** - Reduce API calls

---

## Conclusion

The Builder.io + Leap.new workflow provides:

✅ **Visual Development** - Non-technical users can edit
✅ **AI Assistance** - 80% faster development
✅ **Production Ready** - Not a toy, real infrastructure
✅ **Type Safety** - End-to-end type checking
✅ **Scalability** - Cloud-native from day one
✅ **Developer Experience** - Modern tooling throughout
✅ **Cost Effective** - Faster time to market

This combination represents the future of web development, where AI assists at every layer while maintaining developer control and code quality.

---

## Resources & Links

### Documentation
- [Builder.io Docs](https://www.builder.io/c/docs)
- [Leap.new Docs](https://docs.leap.new)
- [Encore.ts Docs](https://encore.dev/docs)

### GitHub Examples
- [Builder.io Examples](https://github.com/BuilderIO/builder/tree/main/examples)
- [Encore Examples](https://github.com/encoredev/examples)

### Community
- [Builder.io Forum](https://forum.builder.io)
- [Encore Discord](https://encore.dev/discord)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/builder.io)

### Tutorials
- [Builder.io + Next.js](https://www.builder.io/c/docs/getting-started)
- [Encore Quickstart](https://encore.dev/docs/quick-start)
- [API Design Best Practices](https://encore.dev/docs/develop/api-design)

---

*Last Updated: August 2024*
*Version: 2.0*
*Author: War Room Development Team*