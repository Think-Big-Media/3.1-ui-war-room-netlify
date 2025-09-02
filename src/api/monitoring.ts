/**
 * War Room Monitoring Service API
 * Centralized API calls for real-time monitoring and sentiment analysis
 */

import { SentimentData, MonitoringMetrics, PlatformPerformance } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get current sentiment analysis
 */
export async function getCurrentSentiment(): Promise<SentimentData> {
  const response = await fetch(`${API_BASE}/api/v1/monitoring/sentiment`); // Backend provides /sentiment, not /sentiment/current
  if (!response.ok) {
    throw new Error('Failed to fetch sentiment data');
  }
  return response.json();
}

/**
 * Get sentiment history for date range
 */
export async function getSentimentHistory(
  startDate: string,
  endDate: string
): Promise<SentimentData[]> {
  const response = await fetch(
    `${API_BASE}/api/v1/monitoring/sentiment?start=${startDate}&end=${endDate}` // Backend uses query params on /sentiment
  );
  if (!response.ok) {
    throw new Error('Failed to fetch sentiment history');
  }
  return response.json();
}

/**
 * Get monitoring metrics dashboard data
 */
export async function getMonitoringMetrics(): Promise<MonitoringMetrics> {
  const response = await fetch(`${API_BASE}/api/v1/monitoring/mentions`); // Backend provides /mentions for metrics
  if (!response.ok) {
    throw new Error('Failed to fetch monitoring metrics');
  }
  return response.json();
}

/**
 * Get platform performance data
 */
export async function getPlatformPerformance(): Promise<PlatformPerformance[]> {
  const response = await fetch(`${API_BASE}/api/v1/monitoring/trends`); // Backend provides /trends for platform data
  if (!response.ok) {
    throw new Error('Failed to fetch platform performance');
  }
  return response.json();
}

/**
 * Get trending topics
 */
export async function getTrendingTopics(limit: number = 10): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/v1/monitoring/trending?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trending topics');
  }
  return response.json();
}

/**
 * Get mentions for a specific keyword
 */
export async function getKeywordMentions(keyword: string, hours: number = 24): Promise<any[]> {
  const response = await fetch(
    `${API_BASE}/api/v1/monitoring/mentions?keyword=${encodeURIComponent(keyword)}&hours=${hours}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch keyword mentions');
  }
  return response.json();
}
