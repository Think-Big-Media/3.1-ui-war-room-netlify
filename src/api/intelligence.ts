/**
 * War Room Intelligence Service API
 * Centralized API calls for intelligence gathering and document analysis
 */

import { DocumentAnalysis, IntelligenceReport, ThreatAssessment } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Upload and analyze document
 */
export async function analyzeDocument(file: File): Promise<DocumentAnalysis> {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch(`${API_BASE}/api/v1/intelligence/documents/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Document analysis failed');
  }

  return response.json();
}

/**
 * Get intelligence reports
 */
export async function getIntelligenceReports(): Promise<IntelligenceReport[]> {
  const response = await fetch(`${API_BASE}/api/v1/intelligence/reports`);
  if (!response.ok) {
    throw new Error('Failed to fetch intelligence reports');
  }
  return response.json();
}

/**
 * Generate threat assessment
 */
export async function generateThreatAssessment(target: string): Promise<ThreatAssessment> {
  const response = await fetch(`${API_BASE}/api/v1/intelligence/threat-assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target }),
  });

  if (!response.ok) {
    throw new Error('Threat assessment generation failed');
  }

  return response.json();
}

/**
 * Search knowledge base
 */
export async function searchKnowledgeBase(query: string): Promise<any[]> {
  const response = await fetch(
    `${API_BASE}/api/v1/intelligence/knowledge-base/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) {
    throw new Error('Knowledge base search failed');
  }
  return response.json();
}

/**
 * Get competitor intelligence
 */
export async function getCompetitorIntelligence(competitor: string): Promise<any> {
  const response = await fetch(
    `${API_BASE}/api/v1/intelligence/competitors/${encodeURIComponent(competitor)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch competitor intelligence');
  }
  return response.json();
}
