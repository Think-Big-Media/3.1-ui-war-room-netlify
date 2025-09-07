// 🏛️ Marcus Aurelius - Tier 2: Health API Service
// Centralized health monitoring with detailed diagnostics

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'error';
  responseTime: number;
  lastCheck: string;
  details?: string;
  endpoint: string;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  services: HealthStatus[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    error: number;
  };
  uptime: string;
  version: string;
}

class MarcusAureliusService {
  private healthEndpoints = [
    { name: 'Backend', url: '/health', method: 'GET' },
    { name: 'Mentionlytics', url: '/api/v1/mentionlytics/health', method: 'GET' },
    { name: 'Authentication', url: '/api/v1/auth/health', method: 'GET' },
    { name: 'Campaign Management', url: '/api/v1/campaigns/health', method: 'GET' },
    { name: 'Intelligence Hub', url: '/api/v1/intelligence/health', method: 'GET' },
    { name: 'Alert Center', url: '/api/v1/alerts/health', method: 'GET' }
  ];

  private startTime = Date.now();

  async checkServiceHealth(endpoint: { name: string; url: string; method: string }): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const backendUrl = import.meta.env.VITE_ENCORE_API_URL || 'http://localhost:10000';
      const fullUrl = `${backendUrl}${endpoint.url}`;
      
      const response = await fetch(fullUrl, {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'error' = 'error';
      let details = '';
      
      if (response.ok) {
        if (responseTime < 1000) {
          status = 'healthy';
        } else {
          status = 'degraded';
          details = 'Slow response time';
        }
      } else {
        status = 'error';
        details = `HTTP ${response.status}`;
      }
      
      return {
        service: endpoint.name,
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
        details,
        endpoint: endpoint.url
      };
    } catch (error) {
      return {
        service: endpoint.name,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error',
        endpoint: endpoint.url
      };
    }
  }

  async getSystemHealthReport(): Promise<SystemHealthReport> {
    const healthChecks = await Promise.allSettled(
      this.healthEndpoints.map(endpoint => this.checkServiceHealth(endpoint))
    );
    
    const services: HealthStatus[] = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: this.healthEndpoints[index].name,
          status: 'error',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          details: 'Health check failed',
          endpoint: this.healthEndpoints[index].url
        };
      }
    });
    
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      error: services.filter(s => s.status === 'error').length
    };
    
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (summary.error > 0) {
      overall = summary.error > 2 ? 'critical' : 'degraded';
    } else if (summary.degraded > 0) {
      overall = 'degraded';
    }
    
    const uptimeMs = Date.now() - this.startTime;
    const uptimeMinutes = Math.floor(uptimeMs / 60000);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptime = uptimeHours > 0 
      ? `${uptimeHours}h ${uptimeMinutes % 60}m`
      : `${uptimeMinutes}m`;
    
    return {
      overall,
      timestamp: new Date().toISOString(),
      services,
      summary,
      uptime,
      version: '1.0.0-marcus-aurelius'
    };
  }

  // Quick health check for dashboard widget
  async getQuickHealth() {
    const report = await this.getSystemHealthReport();
    return {
      backend: report.services.find(s => s.service === 'Backend')?.status === 'healthy' ? '✅' : '❌',
      mentionlytics: report.services.find(s => s.service === 'Mentionlytics')?.status === 'healthy' ? '✅' : '⚠️',
      auth: report.services.find(s => s.service === 'Authentication')?.status === 'healthy' ? '✅' : '❌',
      overall: report.overall,
      lastCheck: new Date().toLocaleTimeString()
    };
  }
}

export const marcusAurelius = new MarcusAureliusService();