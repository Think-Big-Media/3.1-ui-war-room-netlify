/**
 * War Room Alerting Service API
 * Centralized API calls for crisis alerts and notifications
 */

import { CrisisAlert } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get all crisis alerts
 */
export async function getCrisisAlerts(): Promise<CrisisAlert[]> {
  const response = await fetch(`${API_BASE}/api/v1/alerts/crisis`);
  if (!response.ok) {
    throw new Error('Failed to fetch crisis alerts');
  }
  return response.json();
}

/**
 * Get alerts by severity level
 */
export async function getAlertsBySeverity(
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): Promise<CrisisAlert[]> {
  const response = await fetch(`${API_BASE}/api/v1/alerts/crisis?severity=${severity}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${severity} alerts`);
  }
  return response.json();
}

/**
 * Create a new crisis alert
 */
export async function createCrisisAlert(
  alert: Omit<CrisisAlert, 'id' | 'detected_at'>
): Promise<CrisisAlert> {
  const response = await fetch(`${API_BASE}/api/v1/alerts/crisis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(alert),
  });

  if (!response.ok) {
    throw new Error('Failed to create crisis alert');
  }

  return response.json();
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  id: string,
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED'
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/alerts/crisis/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update alert status');
  }
}

/**
 * Delete crisis alert
 */
export async function deleteCrisisAlert(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/alerts/crisis/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete crisis alert');
  }
}
