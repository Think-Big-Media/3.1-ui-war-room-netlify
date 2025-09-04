/**
 * Analytics type definitions
 */

export enum DateRangeEnum {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_YEAR = '1y',
  CUSTOM = 'custom',
}

export interface AnalyticsMetric {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface GeographicDataPoint {
  state: string;
  value: number;
  label?: string;
}

export interface Activity {
  id: string;
  type: 'donation' | 'volunteer' | 'event' | 'contact';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActivityItem {
  id: string;
  type: 'volunteer_signup' | 'event_created' | 'donation' | 'message' | 'milestone' | 'alert';
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

export interface AnalyticsDashboard {
  metrics: {
    totalDonations: AnalyticsMetric;
    totalVolunteers: AnalyticsMetric;
    totalEvents: AnalyticsMetric;
    totalReach: AnalyticsMetric;
  };
  charts: {
    donations: ChartDataPoint[];
    volunteers: ChartDataPoint[];
    events: ChartDataPoint[];
    geographic: GeographicDataPoint[];
  };
  activities: ActivityItem[];
}

export interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  description?: string;
}

export interface ExportJobRequest {
  type: 'csv' | 'pdf' | 'xlsx';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  format?: 'detailed' | 'summary';
}

export interface ExportJobResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  format: 'csv' | 'pdf' | 'xlsx';
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface VolunteerChart {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  timeframe: string;
  labels: string[];
  datasets: any[];
}

export interface EventChart {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  timeframe: string;
  labels: string[];
  datasets: any[];
}

export interface DonationChart {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  timeframe: string;
  labels: string[];
  datasets: any[];
}

export interface GeographicData {
  data: GeographicDataPoint[];
  type: 'choropleth' | 'scatter' | 'heatmap';
  regions: any[];
}

export interface AnalyticsState {
  dashboard: AnalyticsDashboard | null;
  loading: boolean;
  error: string | null;
  dateRange: DateRangeEnum;
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  activeExportJob: ExportJobResponse | null;
}
