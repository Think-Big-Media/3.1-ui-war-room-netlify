/**
 * War Room Platform - Shared API Types
 * Centralized TypeScript interfaces for all API requests and responses
 */

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'platform_admin';
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ============================================================================
// ALERTING TYPES
// ============================================================================

export interface CrisisAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  content: string;
  source: string;
  detected_at: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  assigned_to?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface SentimentData {
  id: string;
  timestamp: string;
  sentiment_score: number; // -1 to 1 scale
  sentiment_label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  source_platform: string;
  sample_size: number;
  topics: string[];
}

export interface MonitoringMetrics {
  total_mentions: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_platforms: Array<{
    platform: string;
    mention_count: number;
    engagement_rate: number;
  }>;
  trending_keywords: string[];
  alert_count: number;
  last_updated: string;
}

export interface PlatformPerformance {
  platform: string;
  metrics: {
    reach: number;
    engagement: number;
    mentions: number;
    sentiment_score: number;
  };
  trend: 'UP' | 'DOWN' | 'STABLE';
  last_updated: string;
}

// ============================================================================
// INTELLIGENCE TYPES
// ============================================================================

export interface DocumentAnalysis {
  id: string;
  filename: string;
  file_type: string;
  size: number;
  analysis_results: {
    key_topics: string[];
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    entities: Array<{
      text: string;
      type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'MISC';
      confidence: number;
    }>;
    summary: string;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  processed_at: string;
}

export interface IntelligenceReport {
  id: string;
  title: string;
  type: 'COMPETITOR' | 'MARKET' | 'THREAT' | 'OPPORTUNITY';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  content: string;
  key_insights: string[];
  confidence_level: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ThreatAssessment {
  id: string;
  target: string;
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threats: Array<{
    type: string;
    description: string;
    likelihood: number;
    impact: number;
    mitigation_strategies: string[];
  }>;
  recommendations: string[];
  assessed_at: string;
}

// ============================================================================
// REPORTING TYPES
// ============================================================================

export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'campaign' | 'sentiment' | 'performance';
  date_range: {
    start: string;
    end: string;
  };
  data: Record<string, any>;
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: any[];
  }>;
  key_metrics: Record<string, number | string>;
  generated_at: string;
}

export interface CampaignMetrics {
  campaign_id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
  performance_trend: 'UP' | 'DOWN' | 'STABLE';
  last_updated: string;
}

export interface PerformanceData {
  overview: {
    total_campaigns: number;
    active_alerts: number;
    sentiment_score: number;
    engagement_rate: number;
  };
  charts: Array<{
    id: string;
    type: string;
    data: any[];
  }>;
  recent_activity: Array<{
    timestamp: string;
    action: string;
    description: string;
  }>;
}

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export interface ComplianceCheck {
  id: string;
  content_hash: string;
  regulations_checked: string[];
  results: Array<{
    regulation: string;
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }>;
  overall_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
  checked_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  metadata?: Record<string, any>;
}

export interface RegulatoryReport {
  id: string;
  regulation_type: 'GDPR' | 'CCPA' | 'COPPA' | 'FTC';
  date_range: {
    start: string;
    end: string;
  };
  compliance_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  findings: Array<{
    category: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    description: string;
    remediation?: string;
  }>;
  recommendations: string[];
  generated_at: string;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}
