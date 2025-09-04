# Documentation Updates - Missing Examples Added

## 🚀 Quick Start Examples

### Frontend Development
```bash
# Clone and setup
git clone https://github.com/your-org/war-room.git
cd war-room/src/frontend
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Backend Development
```bash
# Setup Python environment
cd src/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload

# API docs at http://localhost:8000/docs
```

## 📊 Pinecone Integration Examples

### Basic Vector Search
```python
from core.pinecone_config import PineconeManager

# Initialize manager
manager = PineconeManager()

# Upload document with embeddings
await manager.upsert_vectors(
    vectors=[{
        "id": "doc_123",
        "values": embeddings,  # 1536-dimensional vector
        "metadata": {
            "text": "Campaign strategy document",
            "org_id": "org_456"
        }
    }],
    namespace="org_456"
)

# Search for similar documents
results = await manager.search_vectors(
    query_embedding=query_vector,
    namespace="org_456",
    top_k=5
)
```

### API Endpoint Usage
```bash
# Search documents
curl -X POST http://localhost:8000/api/v1/documents/search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "campaign strategy",
    "limit": 10
  }'
```

## 🔒 Security Configuration Examples

### Environment Variables Setup
```bash
# .env file example
DATABASE_URL=postgresql://user:pass@localhost:5432/warroom
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PINECONE_API_KEY=your-pinecone-key
OPENAI_API_KEY=your-openai-key
```

### CORS Configuration
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🎨 Dashboard V3 Component Examples

### Using ModernMetricCard
```tsx
import { ModernMetricCard } from './components/ModernMetricCard';
import { DollarSign } from 'lucide-react';

<ModernMetricCard
  title="Total Donations"
  value={125000}
  change={15.5}
  trend="up"
  icon={DollarSign}
  color="green"
  format="currency"
  loading={false}
  sparklineData={[100, 120, 115, 130, 125]}
/>
```

### Custom Dashboard Section
```tsx
import { DashboardSection } from './components/DashboardSection';

<DashboardSection
  title="Campaign Overview"
  subtitle="Real-time campaign metrics"
  action={
    <button onClick={handleRefresh}>
      Refresh
    </button>
  }
>
  {/* Your content here */}
</DashboardSection>
```

## 🔍 Monitoring Setup Examples

### Automated Health Checks
```bash
# Setup monitoring cron job
./scripts/setup-pinecone-monitoring-cron.sh

# Check monitoring status
./scripts/pinecone-monitor-status.sh

# View monitoring dashboard
python3 scripts/generate-pinecone-dashboard.py --format html --web-server
```

### Manual Health Check
```python
# scripts/check-health.py
import asyncio
from scripts.enhanced_pinecone_monitor import EnhancedPineconeMonitor

async def main():
    monitor = EnhancedPineconeMonitor()
    health = await monitor.run_comprehensive_health_check()
    print(f"Status: {health.overall_status}")
    print(f"Performance: {health.performance_score:.1%}")

asyncio.run(main())
```

## 🧪 Testing Examples

### Frontend Component Testing
```tsx
// DashboardV3.test.tsx
import { render, screen } from '@testing-library/react';
import { DashboardV3 } from './DashboardV3';

test('renders dashboard with metrics', async () => {
  render(<DashboardV3 />);
  
  expect(screen.getByText('Command Center')).toBeInTheDocument();
  expect(screen.getByLabelText('Active Campaigns metric card')).toBeInTheDocument();
});
```

### Backend API Testing
```python
# test_documents.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_search_documents():
    response = client.post(
        "/api/v1/documents/search",
        json={"query": "test", "limit": 5},
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    assert "results" in response.json()
```

## 📈 Performance Optimization Examples

### React Performance
```tsx
// Use React.memo for expensive components
export const ExpensiveChart = React.memo(({ data }) => {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

// Use useMemo for expensive calculations
const metrics = useMemo(() => {
  return calculateMetrics(rawData);
}, [rawData]);
```

### API Performance
```python
# Use Redis caching
@cache(expire=300)  # Cache for 5 minutes
async def get_campaign_metrics(campaign_id: str):
    # Expensive calculation
    return metrics
```

## 🚢 Deployment Examples

### GitHub Actions Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST $RENDER_DEPLOY_HOOK_URL
```

### Docker Deployment (Alternative)
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .

# Build frontend
RUN cd src/frontend && npm install && npm run build

# Start server
CMD ["python", "src/backend/serve_bulletproof.py"]
```

## 🔧 Troubleshooting Examples

### Common Issues and Solutions

#### Import Errors
```bash
# If you see: ModuleNotFoundError: No module named 'app'
# Solution:
cd src/backend
export PYTHONPATH=$PWD:$PYTHONPATH
python main.py
```

#### Database Connection
```python
# Test database connection
from sqlalchemy import create_engine
from core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print("Database connected!")
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Supabase Documentation](https://supabase.com/docs)

---

Last Updated: August 5, 2025