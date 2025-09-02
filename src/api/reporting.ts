/**
 * War Room Reporting Service API
 * Centralized API calls for analytics, reports, and data visualization
 */

import { AnalyticsReport, CampaignMetrics, PerformanceData } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  startDate: string,
  endDate: string,
  type: 'campaign' | 'sentiment' | 'performance'
): Promise<AnalyticsReport> {
  const response = await fetch(`${API_BASE}/api/v1/reporting/analytics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ start_date: startDate, end_date: endDate, type }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate analytics report');
  }

  return response.json();
}

/**
 * Get campaign performance metrics
 */
export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const response = await fetch(`${API_BASE}/api/v1/reporting/campaigns/${campaignId}/metrics`);
  if (!response.ok) {
    throw new Error('Failed to fetch campaign metrics');
  }
  return response.json();
}

/**
 * Export report to various formats
 */
export async function exportReport(
  reportId: string,
  format: 'pdf' | 'excel' | 'csv'
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/v1/reporting/export/${reportId}?format=${format}`);
  if (!response.ok) {
    throw new Error('Failed to export report');
  }
  return response.blob();
}

/**
 * Get dashboard performance data
 */
export async function getDashboardData(): Promise<PerformanceData> {
  const response = await fetch(`${API_BASE}/api/v1/reporting/dashboard`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

/**
 * Get scheduled reports
 */
export async function getScheduledReports(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/v1/reporting/scheduled`);
  if (!response.ok) {
    throw new Error('Failed to fetch scheduled reports');
  }
  return response.json();
}

/**
 * Create scheduled report
 */
export async function createScheduledReport(config: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/v1/reporting/scheduled`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error('Failed to create scheduled report');
  }

  return response.json();
}
