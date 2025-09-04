#!/usr/bin/env python3
"""
Cross-Agent SLA Monitoring Dashboard
Real-time monitoring of <3s performance SLA across all War Room sub-agents

Features:
- Real-time performance tracking
- SLA compliance monitoring
- Interactive web dashboard
- Performance analytics
- Alert generation for violations
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import aiohttp
from aiohttp import web, WSMsgType
import aiofiles
import sqlite3
from dataclasses import dataclass, asdict
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import pandas as pd

SLA_TARGET_SECONDS = 3.0
DASHBOARD_PORT = 8766
DB_PATH = "/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/sla_monitoring.db"

@dataclass
class PerformanceMetric:
    agent_id: str
    timestamp: datetime
    response_time: float
    endpoint: str
    success: bool
    error_message: Optional[str] = None
    
@dataclass
class SLAStats:
    agent_id: str
    total_requests: int
    successful_requests: int
    avg_response_time: float
    median_response_time: float
    p95_response_time: float
    p99_response_time: float
    sla_compliance_rate: float
    violations_count: int
    uptime_percentage: float

class PerformanceDatabase:
    """SQLite database for storing performance metrics"""
    
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_database()
        
    def _init_database(self):
        """Initialize database tables"""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Performance metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                response_time REAL NOT NULL,
                endpoint TEXT NOT NULL,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # SLA violations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sla_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                response_time REAL NOT NULL,
                endpoint TEXT NOT NULL,
                severity TEXT NOT NULL,
                resolved BOOLEAN DEFAULT FALSE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Agent status table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agent_status (
                agent_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                uptime_start TEXT,
                total_uptime_seconds INTEGER DEFAULT 0
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def store_metric(self, metric: PerformanceMetric):
        """Store performance metric in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO performance_metrics 
            (agent_id, timestamp, response_time, endpoint, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            metric.agent_id,
            metric.timestamp.isoformat(),
            metric.response_time,
            metric.endpoint,
            metric.success,
            metric.error_message
        ))
        
        # Check for SLA violation
        if metric.response_time > SLA_TARGET_SECONDS:
            severity = "critical" if metric.response_time > SLA_TARGET_SECONDS * 2 else "high"
            
            cursor.execute('''
                INSERT INTO sla_violations
                (agent_id, timestamp, response_time, endpoint, severity)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                metric.agent_id,
                metric.timestamp.isoformat(),
                metric.response_time,
                metric.endpoint,
                severity
            ))
            
        conn.commit()
        conn.close()
        
    def get_agent_stats(self, agent_id: str, hours: int = 24) -> Optional[SLAStats]:
        """Get SLA statistics for agent over specified time period"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        since = datetime.now() - timedelta(hours=hours)
        
        # Get metrics within time window
        cursor.execute('''
            SELECT response_time, success FROM performance_metrics
            WHERE agent_id = ? AND timestamp > ?
            ORDER BY timestamp
        ''', (agent_id, since.isoformat()))
        
        metrics = cursor.fetchall()
        
        if not metrics:
            conn.close()
            return None
            
        response_times = [m[0] for m in metrics]
        successes = [m[1] for m in metrics]
        
        # Calculate statistics
        total_requests = len(metrics)
        successful_requests = sum(successes)
        avg_response_time = sum(response_times) / len(response_times)
        
        sorted_times = sorted(response_times)
        median_response_time = sorted_times[len(sorted_times) // 2]
        p95_response_time = sorted_times[int(len(sorted_times) * 0.95)]
        p99_response_time = sorted_times[int(len(sorted_times) * 0.99)]
        
        sla_compliant = [t <= SLA_TARGET_SECONDS for t in response_times]
        sla_compliance_rate = sum(sla_compliant) / len(sla_compliant)
        
        # Get violations count
        cursor.execute('''
            SELECT COUNT(*) FROM sla_violations
            WHERE agent_id = ? AND timestamp > ?
        ''', (agent_id, since.isoformat()))
        
        violations_count = cursor.fetchone()[0]
        
        # Calculate uptime
        cursor.execute('''
            SELECT total_uptime_seconds FROM agent_status WHERE agent_id = ?
        ''', (agent_id,))
        
        uptime_result = cursor.fetchone()
        uptime_seconds = uptime_result[0] if uptime_result else 0
        uptime_percentage = min(100.0, (uptime_seconds / (hours * 3600)) * 100)
        
        conn.close()
        
        return SLAStats(
            agent_id=agent_id,
            total_requests=total_requests,
            successful_requests=successful_requests,
            avg_response_time=avg_response_time,
            median_response_time=median_response_time,
            p95_response_time=p95_response_time,
            p99_response_time=p99_response_time,
            sla_compliance_rate=sla_compliance_rate,
            violations_count=violations_count,
            uptime_percentage=uptime_percentage
        )
        
    def get_recent_violations(self, hours: int = 24) -> List[Dict]:
        """Get recent SLA violations"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        since = datetime.now() - timedelta(hours=hours)
        
        cursor.execute('''
            SELECT agent_id, timestamp, response_time, endpoint, severity
            FROM sla_violations
            WHERE timestamp > ? AND resolved = FALSE
            ORDER BY timestamp DESC
            LIMIT 50
        ''', (since.isoformat(),))
        
        violations = []
        for row in cursor.fetchall():
            violations.append({
                "agent_id": row[0],
                "timestamp": row[1],
                "response_time": row[2],
                "endpoint": row[3],
                "severity": row[4]
            })
            
        conn.close()
        return violations

class SLAMonitoringDashboard:
    """Real-time SLA monitoring dashboard with web interface"""
    
    def __init__(self, port: int = DASHBOARD_PORT):
        self.port = port
        self.app = web.Application()
        self.db = PerformanceDatabase()
        self.websocket_connections = set()
        
        # Setup routes
        self._setup_routes()
        
        # Agent configurations
        self.agents = {
            "health_monitor": {
                "name": "Health Check Monitor",
                "endpoints": ["/health", "/status"],
                "url": "https://war-room-oa9t.onrender.com"
            },
            "amp_specialist": {
                "name": "AMP Refactoring Specialist",
                "endpoints": ["/api/refactor", "/api/status"],
                "url": "http://localhost:8000"
            },
            "coderabbit": {
                "name": "CodeRabbit Integration", 
                "endpoints": ["/api/review", "/api/health"],
                "url": "http://localhost:8001"
            },
            "pieces_manager": {
                "name": "Pieces Knowledge Manager",
                "endpoints": ["/api/knowledge", "/api/search"],
                "url": "http://localhost:8002"
            }
        }
        
        # Performance monitoring state
        self.running = False
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Setup dashboard logging"""
        log_dir = Path("/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/logs")
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"sla_dashboard_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
    def _setup_routes(self):
        """Setup web application routes"""
        # Static routes
        self.app.router.add_get('/', self.dashboard_handler)
        self.app.router.add_get('/api/stats', self.stats_handler)
        self.app.router.add_get('/api/violations', self.violations_handler)
        self.app.router.add_get('/api/metrics/{agent_id}', self.metrics_handler)
        self.app.router.add_get('/ws', self.websocket_handler)
        self.app.router.add_static('/', path=str(Path(__file__).parent / 'static'), name='static')
        
    async def dashboard_handler(self, request):
        """Serve main dashboard HTML"""
        html_content = await self._generate_dashboard_html()
        return web.Response(text=html_content, content_type='text/html')
        
    async def stats_handler(self, request):
        """API endpoint for agent statistics"""
        stats = {}
        
        for agent_id in self.agents.keys():
            agent_stats = self.db.get_agent_stats(agent_id, hours=24)
            if agent_stats:
                stats[agent_id] = asdict(agent_stats)
            else:
                stats[agent_id] = {
                    "agent_id": agent_id,
                    "total_requests": 0,
                    "sla_compliance_rate": 1.0,
                    "avg_response_time": 0.0
                }
                
        return web.json_response(stats)
        
    async def violations_handler(self, request):
        """API endpoint for recent violations"""
        violations = self.db.get_recent_violations(hours=24)
        return web.json_response(violations)
        
    async def metrics_handler(self, request):
        """API endpoint for agent-specific metrics"""
        agent_id = request.match_info['agent_id']
        hours = int(request.query.get('hours', 24))
        
        agent_stats = self.db.get_agent_stats(agent_id, hours=hours)
        if agent_stats:
            return web.json_response(asdict(agent_stats))
        else:
            return web.json_response({"error": "No data found"}, status=404)
            
    async def websocket_handler(self, request):
        """WebSocket handler for real-time updates"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        self.websocket_connections.add(ws)
        
        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    # Handle incoming WebSocket messages
                    pass
                elif msg.type == WSMsgType.ERROR:
                    logging.error(f'WebSocket error: {ws.exception()}')
                    
        except Exception as e:
            logging.error(f"WebSocket error: {e}")
        finally:
            self.websocket_connections.discard(ws)
            
        return ws
        
    async def _generate_dashboard_html(self) -> str:
        """Generate main dashboard HTML"""
        return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>War Room SLA Monitoring Dashboard</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .metric-card {
            @apply bg-white rounded-lg shadow-md p-6 border-l-4;
        }
        .metric-card.compliant {
            @apply border-green-500;
        }
        .metric-card.violation {
            @apply border-red-500;
        }
        .metric-card.warning {
            @apply border-yellow-500;
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">War Room SLA Monitoring Dashboard</h1>
            <p class="text-gray-600">Real-time performance monitoring • Target: < 3.0 seconds</p>
        </div>
        
        <!-- Status Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div id="overall-status" class="metric-card compliant">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5">
                        <p class="text-sm font-medium text-gray-500 truncate">Overall Status</p>
                        <p class="text-lg font-semibold text-gray-900">All Systems Operational</p>
                    </div>
                </div>
            </div>
            
            <div class="metric-card compliant">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5">
                        <p class="text-sm font-medium text-gray-500 truncate">SLA Compliance</p>
                        <p id="overall-compliance" class="text-lg font-semibold text-gray-900">--</p>
                    </div>
                </div>
            </div>
            
            <div class="metric-card compliant">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM8 8a2 2 0 114 0v1a2 2 0 11-4 0V8zM12 12a2 2 0 100 4 2 2 0 000-4z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5">
                        <p class="text-sm font-medium text-gray-500 truncate">Avg Response Time</p>
                        <p id="avg-response-time" class="text-lg font-semibold text-gray-900">--</p>
                    </div>
                </div>
            </div>
            
            <div class="metric-card compliant">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5">
                        <p class="text-sm font-medium text-gray-500 truncate">Violations (24h)</p>
                        <p id="violations-count" class="text-lg font-semibold text-gray-900">--</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Agent Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div id="agent-cards"></div>
        </div>
        
        <!-- Performance Chart -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Response Time Trends</h2>
            <div id="performance-chart" style="height: 400px;"></div>
        </div>
        
        <!-- Recent Violations -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Recent SLA Violations</h2>
            <div id="violations-list"></div>
        </div>
    </div>
    
    <script>
        // WebSocket connection for real-time updates
        const ws = new WebSocket(`ws://${window.location.host}/ws`);
        
        ws.onopen = function(event) {
            console.log('Connected to dashboard WebSocket');
            loadInitialData();
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };
        
        // Load initial dashboard data
        async function loadInitialData() {
            try {
                const [statsResponse, violationsResponse] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/violations')
                ]);
                
                const stats = await statsResponse.json();
                const violations = await violationsResponse.json();
                
                updateAgentCards(stats);
                updateOverallMetrics(stats);
                updateViolationsList(violations);
                updatePerformanceChart(stats);
                
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }
        
        function updateOverallMetrics(stats) {
            const agents = Object.values(stats);
            const totalRequests = agents.reduce((sum, agent) => sum + agent.total_requests, 0);
            const avgCompliance = agents.reduce((sum, agent) => sum + agent.sla_compliance_rate, 0) / agents.length;
            const avgResponseTime = agents.reduce((sum, agent) => sum + agent.avg_response_time, 0) / agents.length;
            const totalViolations = agents.reduce((sum, agent) => sum + agent.violations_count, 0);
            
            document.getElementById('overall-compliance').textContent = `${(avgCompliance * 100).toFixed(1)}%`;
            document.getElementById('avg-response-time').textContent = `${avgResponseTime.toFixed(2)}s`;
            document.getElementById('violations-count').textContent = totalViolations;
        }
        
        function updateAgentCards(stats) {
            const container = document.getElementById('agent-cards');
            container.innerHTML = '';
            
            Object.entries(stats).forEach(([agentId, data]) => {
                const compliance = (data.sla_compliance_rate * 100).toFixed(1);
                const cardClass = data.sla_compliance_rate >= 0.95 ? 'compliant' : 'violation';
                
                const card = document.createElement('div');
                card.className = `metric-card ${cardClass}`;
                card.innerHTML = `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">${agentId.replace('_', ' ').toUpperCase()}</h3>
                        <p class="text-sm text-gray-600">${data.total_requests} requests (24h)</p>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Compliance:</span>
                            <span class="text-sm font-medium">${compliance}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Avg Response:</span>
                            <span class="text-sm font-medium">${data.avg_response_time.toFixed(2)}s</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">P95:</span>
                            <span class="text-sm font-medium">${data.p95_response_time.toFixed(2)}s</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-gray-600">Violations:</span>
                            <span class="text-sm font-medium text-red-600">${data.violations_count}</span>
                        </div>
                    </div>
                `;
                
                container.appendChild(card);
            });
        }
        
        function updateViolationsList(violations) {
            const container = document.getElementById('violations-list');
            
            if (violations.length === 0) {
                container.innerHTML = '<p class="text-gray-600">No recent violations</p>';
                return;
            }
            
            const list = violations.map(violation => `
                <div class="border-b border-gray-200 py-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-medium text-gray-800">${violation.agent_id}</p>
                            <p class="text-sm text-gray-600">${violation.endpoint}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium text-red-600">${violation.response_time.toFixed(2)}s</p>
                            <p class="text-xs text-gray-500">${new Date(violation.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = list;
        }
        
        function updatePerformanceChart(stats) {
            // This would implement the actual Plotly chart
            // For now, just show a placeholder
            document.getElementById('performance-chart').innerHTML = 
                '<div class="flex items-center justify-center h-full text-gray-600">Performance chart will be rendered here</div>';
        }
        
        // Refresh data every 30 seconds
        setInterval(loadInitialData, 30000);
    </script>
</body>
</html>
'''
        
    async def monitor_agent_performance(self, agent_id: str):
        """Monitor performance for specific agent"""
        agent_config = self.agents.get(agent_id, {})
        base_url = agent_config.get("url", "")
        endpoints = agent_config.get("endpoints", [])
        
        for endpoint in endpoints:
            try:
                url = f"{base_url}{endpoint}"
                start_time = time.time()
                
                timeout = aiohttp.ClientTimeout(total=10)  # 10 second timeout
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(url) as response:
                        response_time = time.time() - start_time
                        success = response.status < 400
                        
                        metric = PerformanceMetric(
                            agent_id=agent_id,
                            timestamp=datetime.now(),
                            response_time=response_time,
                            endpoint=endpoint,
                            success=success,
                            error_message=None if success else f"HTTP {response.status}"
                        )
                        
                        self.db.store_metric(metric)
                        
                        # Send real-time update to dashboard
                        await self._broadcast_update({
                            "type": "performance_metric",
                            "data": asdict(metric)
                        })
                        
                        logging.info(f"{agent_id} {endpoint}: {response_time:.2f}s")
                        
            except asyncio.TimeoutError:
                response_time = 10.0  # Timeout duration
                metric = PerformanceMetric(
                    agent_id=agent_id,
                    timestamp=datetime.now(),
                    response_time=response_time,
                    endpoint=endpoint,
                    success=False,
                    error_message="Request timeout"
                )
                
                self.db.store_metric(metric)
                logging.error(f"{agent_id} {endpoint}: timeout")
                
            except Exception as e:
                response_time = 10.0  # Max response time for errors
                metric = PerformanceMetric(
                    agent_id=agent_id,
                    timestamp=datetime.now(),
                    response_time=response_time,
                    endpoint=endpoint,
                    success=False,
                    error_message=str(e)
                )
                
                self.db.store_metric(metric)
                logging.error(f"{agent_id} {endpoint}: {e}")
                
    async def _broadcast_update(self, message: Dict):
        """Broadcast update to all connected WebSocket clients"""
        if self.websocket_connections:
            message_json = json.dumps(message)
            
            disconnected = set()
            for ws in self.websocket_connections:
                try:
                    await ws.send_str(message_json)
                except Exception:
                    disconnected.add(ws)
                    
            # Clean up disconnected clients
            self.websocket_connections -= disconnected
            
    async def start_monitoring(self):
        """Start performance monitoring for all agents"""
        self.running = True
        
        monitoring_tasks = []
        for agent_id in self.agents.keys():
            task = asyncio.create_task(self._monitor_agent_loop(agent_id))
            monitoring_tasks.append(task)
            
        # Start web server
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logging.info(f"🚀 SLA Dashboard running on http://localhost:{self.port}")
        
        try:
            await asyncio.gather(*monitoring_tasks)
        except KeyboardInterrupt:
            logging.info("SLA monitoring shutting down...")
        finally:
            await runner.cleanup()
            
    async def _monitor_agent_loop(self, agent_id: str):
        """Continuous monitoring loop for specific agent"""
        while self.running:
            try:
                await self.monitor_agent_performance(agent_id)
            except Exception as e:
                logging.error(f"Monitoring error for {agent_id}: {e}")
                
            # Monitor every 30 seconds
            await asyncio.sleep(30)

async def main():
    """Main SLA dashboard entry point"""
    dashboard = SLAMonitoringDashboard()
    await dashboard.start_monitoring()

if __name__ == "__main__":
    asyncio.run(main())