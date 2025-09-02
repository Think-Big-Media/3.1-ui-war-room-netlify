/**
 * War Room Compliance Service API
 * Centralized API calls for regulatory compliance and audit trails
 */

import { ComplianceCheck, AuditLog, RegulatoryReport } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Run compliance check on content
 */
export async function runComplianceCheck(
  content: string,
  regulations: string[]
): Promise<ComplianceCheck> {
  const response = await fetch(`${API_BASE}/api/v1/compliance/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, regulations }),
  });

  if (!response.ok) {
    throw new Error('Compliance check failed');
  }

  return response.json();
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<AuditLog[]> {
  let url = `${API_BASE}/api/v1/compliance/audit-logs?start=${startDate}&end=${endDate}`;
  if (userId) {
    url += `&userId=${userId}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }

  return response.json();
}

/**
 * Generate regulatory compliance report
 */
export async function generateComplianceReport(
  regulation: 'GDPR' | 'CCPA' | 'COPPA' | 'FTC',
  dateRange: { start: string; end: string }
): Promise<RegulatoryReport> {
  const response = await fetch(`${API_BASE}/api/v1/compliance/reports/${regulation}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dateRange),
  });

  if (!response.ok) {
    throw new Error('Failed to generate compliance report');
  }

  return response.json();
}

/**
 * Log user action for audit trail
 */
export async function logAuditAction(
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: any
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/compliance/audit-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to log audit action');
  }
}

/**
 * Check data retention policies
 */
export async function checkDataRetention(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/api/v1/compliance/data-retention`);
  if (!response.ok) {
    throw new Error('Failed to check data retention policies');
  }
  return response.json();
}

/**
 * Request data deletion (GDPR right to be forgotten)
 */
export async function requestDataDeletion(userId: string, reason: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/compliance/data-deletion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to request data deletion');
  }
}
