/**
 * Alert Management Hook for War Room
 */

import { useState, useCallback } from 'react';
import { type Alert } from '../types/alert';

export function useAlertManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [informationItems, setInformationItems] = useState<any[]>([]);
  const [infoFilters, setInfoFilters] = useState<any>({});

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  }, []);

  const updateAlert = useCallback((id: string, updates: Partial<Alert>) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, ...updates } : alert)));
  }, []);

  const handleExpandAlert = useCallback((alertId: string) => {
    setExpandedAlerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  }, []);

  const handleStatusUpdate = useCallback(
    (alertId: string, status: Alert['status']) => {
      updateAlert(alertId, { status });
    },
    [updateAlert]
  );

  const handleMarkAllAsRead = useCallback(() => {
    // Mark all information items as read
    setInformationItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') {
      return true;
    }
    return alert.status === filter;
  });

  return {
    alerts: filteredAlerts,
    addAlert,
    updateAlert,
    filter,
    setFilter,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    priorityFilter,
    setPriorityFilter,
    expandedAlerts,
    handleExpandAlert,
    handleStatusUpdate,
    informationItems,
    infoFilters,
    setInfoFilters,
    handleMarkAllAsRead,
  };
}
