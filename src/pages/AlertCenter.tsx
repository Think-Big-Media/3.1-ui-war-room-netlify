import type React from 'react';
import { useState } from 'react';
import { Plus, AlertCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/shared/PageLayout';
import AlertCard from '../components/alert-center/AlertCard';
import AlertFilters from '../components/alert-center/AlertFilters';
import AlertSummary from '../components/alert-center/AlertSummary';
import AssignedAlertsTracker from '../components/alert-center/AssignedAlertsTracker';
import CollaborationModal from '../components/alert-center/CollaborationModal';
import InformationStreamsTab from '../components/alert-center/InformationStreamsTab';
import { useAlertManagement } from '../hooks/useAlertManagement';
import { mockTeamMembers } from '../data/alertMockData';
import { informationService } from '../services/informationService';
import { createLogger } from '../utils/logger';
import { type Alert } from '../types/alert';
import { type InformationItem } from '../types/information';
import { useCrisisAlerts, useMentionlyticsMode } from '../hooks/useMentionlytics';

const logger = createLogger('AlertCenter');

const AlertCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('information-streams');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [collaborationModal, setCollaborationModal] = useState({
    isOpen: false,
    alert: null as Alert | null,
  });
  const navigate = useNavigate();

  // Get Mentionlytics crisis data
  const { alerts: crisisAlerts, loading: crisisLoading } = useCrisisAlerts();
  const { mode: dataMode } = useMentionlyticsMode();

  const {
    alerts,
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
  } = useAlertManagement();

  const handleAssignAlert = (alert: Alert) => {
    setCollaborationModal({ isOpen: true, alert });
  };

  const handleInformationItemClick = (item: InformationItem) => {
    informationService.markAsRead(item.id);
    navigate(item.deepLink);
  };

  return (
    <div className="page-alerts" data-route="alert-center">
      <PageLayout pageTitle="Alert Center" placeholder="Ask War Room about campaign alerts...">
        {/* Data Mode Indicator */}
        <div className="fixed top-20 right-4 z-40">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm ${
              dataMode === 'MOCK'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {dataMode} DATA
          </div>
        </div>

        {/* Crisis Alert Banner - Show if Mentionlytics detects crisis */}
        {crisisAlerts?.hasActiveCrisis && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-red-400">Active Crisis Detected</h3>
                <p className="text-xs text-white/70">
                  {crisisAlerts.alerts?.length || 0} critical threats requiring immediate attention
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-3 overflow-x-auto">
          {[
            {
              id: 'information-streams',
              label: 'Information Streams',
              icon: Activity,
            },
            {
              id: 'traditional-alerts',
              label: 'Critical Alerts',
              icon: AlertCircle,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Traditional Alerts Tab */}
        {activeTab === 'traditional-alerts' && (
          <>
            {/* Filter Bar */}
            <AlertFilters
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              priorityFilter={priorityFilter}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
              onPriorityChange={setPriorityFilter}
            />

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              {/* Main Content - Alerts */}
              <div className="lg:col-span-2 space-y-4">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isExpanded={expandedAlerts.has(alert.id)}
                    onExpand={handleExpandAlert}
                    onAssign={handleAssignAlert}
                    onStatusUpdate={handleStatusUpdate}
                    onClick={() => setSelectedAlert(alert)}
                  />
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Assigned Alerts Tracker */}
                <AssignedAlertsTracker alerts={alerts} teamMembers={mockTeamMembers} />

                {/* Quick Stats */}
                <AlertSummary alerts={alerts} />
              </div>
            </div>

            {/* Collaboration Modal */}
            <CollaborationModal
              isOpen={collaborationModal.isOpen}
              alert={collaborationModal.alert}
              teamMembers={mockTeamMembers}
              onClose={() => setCollaborationModal({ isOpen: false, alert: null })}
            />
          </>
        )}

        {/* Information Streams Tab */}
        {activeTab === 'information-streams' && (
          <InformationStreamsTab
            items={informationItems}
            filters={infoFilters}
            onFilterChange={setInfoFilters}
            onItemClick={handleInformationItemClick}
            onMarkAllRead={handleMarkAllAsRead}
          />
        )}
      </PageLayout>
    </div>
  );
};

export default AlertCenter;
