# SUB-AGENT 4: Pieces Knowledge Manager

## Overview

The Pieces Knowledge Manager is an advanced AI-powered knowledge management system specifically designed for the War Room development environment. It serves as the central intelligence hub for capturing, organizing, analyzing, and distributing knowledge patterns from all War Room sub-agents.

## Mission Statement

**Centralize and organize knowledge capture from all War Room sub-agents to create a comprehensive, searchable, and intelligent knowledge base that accelerates development and improves code quality.**

## Core Responsibilities

### 1. Knowledge Capture and Storage
- Monitor successful fixes and patterns from other sub-agents
- Automatically capture and categorize knowledge patterns
- Store patterns with rich metadata and context
- Integrate with Pieces CLI and Desktop API for persistent storage

### 2. Pattern Organization and Analysis
- Advanced categorization system with semantic understanding
- Automated tagging based on content analysis
- Pattern clustering and relationship mapping
- Success rate tracking and confidence scoring

### 3. Intelligent Search and Retrieval
- Semantic search capabilities using TF-IDF and machine learning
- Context-aware pattern matching
- Multi-dimensional filtering (category, language, agent, success rate)
- Embedding-based similarity search

### 4. Recommendation Engine
- AI-powered pattern recommendations
- Context-aware suggestions based on current problems
- Success probability estimation
- Multiple recommendation strategies (similarity, collaborative filtering, hybrid)

### 5. Automated Reporting and Insights
- Weekly pattern analysis reports
- Trend identification and forecasting
- Knowledge gap analysis
- Agent collaboration metrics
- Automated email delivery of reports

### 6. Inter-Agent Communication
- WebSocket-based communication hub
- Real-time pattern sharing between agents
- Coordination protocols for knowledge exchange
- Message routing and filtering

### 7. Reusable Snippet Generation
- Automated code snippet creation from patterns
- Multi-language support (Python, JavaScript, TypeScript, Java, Go)
- Template-based generation system
- Documentation and test generation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PIECES KNOWLEDGE MANAGER                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Core Manager  │  │  Communication  │  │   Reporting  │ │
│  │                 │  │      Hub        │  │    System    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Recommendation  │  │    Snippet      │  │   Pattern    │ │
│  │    Engine       │  │   Generator     │  │   Storage    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Semantic       │  │   ML Models     │  │   Pieces     │ │
│  │   Search        │  │   & Analytics   │  │     API      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### Advanced Pattern Categorization
- **10 Knowledge Categories**: 
  - Health Check Fixes
  - AMP Optimizations
  - CodeRabbit Fixes
  - War Room Solutions
  - Performance Patterns
  - Security Patterns
  - Refactoring Patterns
  - Deployment Patterns
  - Monitoring Patterns
  - Integration Patterns

### Intelligent Tagging System
- Automated tag generation based on content analysis
- Source agent tagging
- Language-specific tags
- Priority-based classification
- Success rate indicators

### Multi-Strategy Recommendations
1. **Similarity-Based**: Semantic similarity using TF-IDF and cosine similarity
2. **Success-Rate Based**: Historical success patterns and weighted scoring
3. **Collaborative Filtering**: Pattern recommendations based on agent collaboration
4. **Content-Based**: Keyword matching and content analysis
5. **Contextual**: Language, urgency, and project type matching
6. **Hybrid**: Combines all strategies with configurable weights

### Comprehensive Reporting
- **Weekly Knowledge Summary**: Pattern growth, usage trends, quality metrics
- **Daily Activity Reports**: Real-time pattern additions and updates
- **Monthly Trend Analysis**: Long-term insights and predictions
- **Custom Reports**: Configurable metrics and time periods
- **Visual Charts**: Pattern distribution, success rates, category trends

### Multi-Language Snippet Generation
- **Supported Languages**: Python, JavaScript, TypeScript, Java, Go, Rust, C++, C#, PHP, Ruby
- **Template System**: Jinja2-based templates for consistent generation
- **Code Formatting**: Language-specific formatters (Black, Prettier, etc.)
- **Documentation Generation**: Automatic README and usage examples
- **Test Generation**: Basic test templates for generated snippets

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 14+ (for JavaScript/TypeScript support)
- Required Python packages (see requirements.txt)

### Dependencies
```bash
pip install -r requirements.txt
```

**Key Dependencies:**
- `scikit-learn` - Machine learning capabilities
- `nltk` - Natural language processing
- `jinja2` - Template rendering
- `aiohttp` - Async HTTP client
- `websockets` - Real-time communication
- `matplotlib` - Chart generation
- `seaborn` - Statistical visualization
- `pandas` - Data analysis
- `numpy` - Numerical computing
- `textblob` - Text analysis
- `black` - Python code formatting
- `isort` - Import sorting

### Configuration

Create a configuration file `config.json`:

```json
{
  "pieces_api_key": "your_pieces_api_key",
  "pieces_base_url": "https://api.pieces.app",
  "hub_port": 8765,
  "mode": "standalone",
  "output_dir": "outputs",
  "enable_communication": true,
  "enable_reporting": true,
  "enable_scheduled_reports": false,
  "log_level": "INFO",
  "email_config": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "username": "your_email@gmail.com",
    "password": "your_app_password",
    "use_tls": true,
    "sender": "warroom-knowledge@yourcompany.com"
  }
}
```

## Usage

### Basic Usage

```bash
# Run in standalone mode
python run_pieces_knowledge_manager.py

# Run with configuration file
python run_pieces_knowledge_manager.py --config-file config.json

# Run in demo mode
python run_pieces_knowledge_manager.py --demo

# Run with communication enabled
python run_pieces_knowledge_manager.py --enable-communication --enable-reporting
```

### Advanced Usage

```bash
# Run as communication hub
python run_pieces_knowledge_manager.py --mode hub --hub-port 8765

# Run as client connecting to existing hub
python run_pieces_knowledge_manager.py --mode client --hub-port 8765

# Debug mode with verbose logging
python run_pieces_knowledge_manager.py --log-level DEBUG
```

### Programmatic Usage

```python
import asyncio
from pieces_knowledge_manager import PiecesKnowledgeManager, KnowledgeCategory
from pattern_recommendation_engine import RecommendationContext

async def main():
    # Initialize knowledge manager
    km = PiecesKnowledgeManager(pieces_api_key="your_key")
    
    # Capture a pattern
    pattern_data = {
        "id": "example_pattern",
        "name": "Example Security Pattern",
        "description": "Demonstrates input validation",
        "content": "def validate_input(data): ...",
        "category": "security-patterns",
        "language": "python"
    }
    
    result = await km._capture_pattern_from_agent({
        "source_agent": "TestAgent",
        "pattern_data": pattern_data
    })
    
    # Search patterns
    search_result = await km._search_knowledge_base({
        "query": "input validation security",
        "categories": ["security-patterns"],
        "limit": 5
    })
    
    print(f"Found {len(search_result['results'])} patterns")

if __name__ == "__main__":
    asyncio.run(main())
```

## Integration with War Room Agents

### Health Check Monitor Integration
```python
# In health check monitor
async def share_fix_pattern(self, fix_data):
    """Share successful fix with knowledge manager"""
    pattern_data = {
        "name": f"Health Check Fix: {fix_data['issue']}",
        "description": fix_data['description'],
        "content": fix_data['solution'],
        "category": "health-check-fixes",
        "tags": ["health-check", "monitoring", fix_data['severity']]
    }
    
    await self.communication_client.share_pattern(pattern_data)
```

### AMP Refactoring Specialist Integration
```python
# In AMP refactoring specialist
async def share_optimization_pattern(self, optimization):
    """Share AMP optimization with knowledge manager"""
    pattern_data = {
        "name": f"AMP Optimization: {optimization['type']}",
        "description": optimization['description'],
        "content": optimization['code'],
        "category": "amp-optimizations",
        "tags": ["amp", "performance", optimization['impact']]
    }
    
    await self.communication_client.share_pattern(pattern_data)
```

### CodeRabbit Integration
```python
# In CodeRabbit integration
async def share_coderabbit_fix(self, fix_data):
    """Share CodeRabbit fix with knowledge manager"""
    pattern_data = {
        "name": f"CodeRabbit Fix: {fix_data['type']}",
        "description": fix_data['description'],
        "content": fix_data['fixed_code'],
        "category": "coderabbit-fixes",
        "language": fix_data['language'],
        "tags": ["coderabbit", "automated-fix", fix_data['category']]
    }
    
    await self.communication_client.share_pattern(pattern_data)
```

## API Reference

### Core Methods

#### `capture_pattern_from_agent(params)`
Captures a pattern from another agent.

**Parameters:**
- `source_agent` (str): ID of the source agent
- `pattern_data` (dict): Pattern information including name, description, content, category, etc.

**Returns:**
- `dict`: Status and pattern ID if successful

#### `search_knowledge_base(params)`
Searches the knowledge base with semantic understanding.

**Parameters:**
- `query` (str): Search query
- `categories` (list): Filter by categories
- `limit` (int): Maximum results to return
- `include_embeddings` (bool): Include semantic embeddings

**Returns:**
- `dict`: Search results with relevance scores

#### `generate_recommendations(context, strategy, max_results)`
Generates intelligent pattern recommendations.

**Parameters:**
- `context` (RecommendationContext): Problem context
- `strategy` (RecommendationStrategy): Recommendation strategy
- `max_results` (int): Maximum recommendations

**Returns:**
- `list`: List of EnhancedRecommendation objects

### Communication Protocol

#### Message Types
- `PATTERN_SHARE`: Share patterns between agents
- `PATTERN_REQUEST`: Request specific patterns
- `PATTERN_FEEDBACK`: Provide pattern effectiveness feedback
- `KNOWLEDGE_QUERY`: Query knowledge base
- `RECOMMENDATION_REQUEST`: Request pattern recommendations
- `STATUS_UPDATE`: Agent status updates
- `HEALTH_CHECK`: System health monitoring

#### Example Message
```json
{
  "id": "msg_12345",
  "sender_id": "HealthCheckMonitor",
  "receiver_id": "PiecesKnowledgeManager",
  "message_type": "PATTERN_SHARE",
  "priority": "MEDIUM",
  "payload": {
    "pattern_id": "health_fix_001",
    "pattern_name": "Database Connection Fix",
    "pattern_description": "Fix for database connection timeout issues",
    "pattern_content": "def fix_db_connection()...",
    "category": "health-check-fixes",
    "language": "python",
    "tags": ["database", "timeout", "fix"],
    "confidence_score": 0.85
  }
}
```

## Reporting System

### Report Types

#### Weekly Knowledge Summary
- Knowledge base growth metrics
- Pattern usage statistics
- Agent collaboration analysis
- Quality insights and recommendations

#### Daily Activity Report
- New patterns added
- Search queries performed
- Recommendations generated
- System health status

#### Monthly Trend Analysis
- Long-term growth patterns
- Category distribution changes
- Success rate trends
- Predictive insights

### Custom Reports
Create custom report configurations:

```python
from automated_reporting_system import ReportConfiguration

config = ReportConfiguration(
    report_type="custom_analysis",
    frequency="weekly",
    recipients=["team@company.com"],
    include_charts=True,
    custom_metrics=["pattern_effectiveness", "agent_contributions"]
)
```

## Performance Optimization

### Caching Strategy
- Pattern embeddings cached in memory
- TF-IDF vectorizer fitted once and reused
- Search results cached for common queries
- Recommendation history stored for learning

### Scalability Features
- Async/await throughout for concurrent processing
- Background tasks for analysis and maintenance
- Configurable batch sizes for processing
- Memory management for large knowledge bases

### Monitoring and Health Checks
- Real-time system statistics
- Component health monitoring
- Performance metrics tracking
- Automated alerting for issues

## Security Considerations

### Data Protection
- Sensitive pattern content is encrypted before storage
- API keys are securely managed
- Communication uses WebSocket secure connections
- Access control for pattern sharing

### Privacy Controls
- Configurable pattern visibility levels
- Agent-specific access permissions
- Audit logging for all pattern operations
- Compliance with data protection regulations

## Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check communication hub status
python run_pieces_knowledge_manager.py --mode hub --log-level DEBUG

# Test client connection
python run_pieces_knowledge_manager.py --mode client --log-level DEBUG
```

#### Pattern Storage Issues
- Verify Pieces API key configuration
- Check network connectivity to Pieces API
- Review pattern data format and validation
- Monitor storage statistics and quotas

#### Performance Issues
- Increase memory allocation for large knowledge bases
- Enable pattern clustering for faster search
- Adjust TF-IDF parameters for better performance
- Monitor background task performance

### Debug Commands
```bash
# Enable verbose logging
python run_pieces_knowledge_manager.py --log-level DEBUG

# Run system health check
python -c "from pieces_knowledge_manager import PiecesKnowledgeManager; print('System OK')"

# Test pattern search
python -c "
import asyncio
from pieces_knowledge_manager import PiecesKnowledgeManager
async def test():
    km = PiecesKnowledgeManager()
    stats = km.get_knowledge_statistics()
    print(f'Patterns: {stats[\"total_patterns\"]}')
asyncio.run(test())
"
```

## Development and Extension

### Adding New Pattern Categories
```python
class KnowledgeCategory(Enum):
    # Existing categories...
    YOUR_CUSTOM_CATEGORY = "your-custom-category"
```

### Creating Custom Recommendation Strategies
```python
class CustomRecommendationStrategy:
    async def generate_recommendations(self, context, patterns):
        # Your custom logic here
        return recommendations
```

### Extending Communication Protocol
```python
class CustomMessageType(Enum):
    YOUR_MESSAGE_TYPE = "your_message_type"

# Register handler
communication_client.register_message_handler(
    CustomMessageType.YOUR_MESSAGE_TYPE,
    your_custom_handler
)
```

## Contributing

### Development Setup
1. Clone the repository
2. Install development dependencies: `pip install -r requirements-dev.txt`
3. Run tests: `python -m pytest tests/`
4. Format code: `black . && isort .`
5. Run linting: `flake8 .`

### Code Style
- Follow PEP 8 guidelines
- Use type hints throughout
- Comprehensive docstrings for all public methods
- Async/await for all I/O operations

### Testing
```bash
# Run all tests
python -m pytest

# Run specific test categories
python -m pytest tests/test_knowledge_manager.py
python -m pytest tests/test_recommendation_engine.py
python -m pytest tests/test_snippet_generator.py
```

## License

MIT License - See LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review system logs in `pieces_knowledge_manager.log`
- Open an issue on the project repository
- Contact the War Room development team

---

**Generated by War Room Pieces Knowledge Manager v1.0**
**Last Updated: {{ current_date }}**