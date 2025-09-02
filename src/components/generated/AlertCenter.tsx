import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import AlertCard from '../alert-center/AlertCard';
import AlertFilters from '../alert-center/AlertFilters';
import AlertSummary from '../alert-center/AlertSummary';
import AssignedAlertsTracker from '../alert-center/AssignedAlertsTracker';
import CollaborationModal from '../alert-center/CollaborationModal';
import InformationStreamsTab from '../alert-center/InformationStreamsTab';
import { useAlertManagement } from '../../hooks/useAlertManagement';
import { mockTeamMembers } from '../../data/alertMockData';
import { informationService } from '../../services/informationService';
import { createLogger } from '../../utils/logger';
import { type Alert } from '../../types/alert';
import { type InformationItem } from '../../types/information';

const logger = createLogger('AlertCenter');

const AlertCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('traditional-alerts');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [collaborationModal, setCollaborationModal] = useState({
    isOpen: false,
    alert: null as Alert | null,
  });
  const navigate = useNavigate();

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
    <PageLayout pageTitle="Alert Center" placeholder="Ask War Room about campaign alerts...">
      {/* Purple gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 -z-10" />

      <PageHeader
        title="Alert Center"
        subtitle="Track critical developments and collaborate fast across your campaign team"
      />

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        {[
          {
            id: 'traditional-alerts',
            label: 'Critical Alerts',
            icon: AlertCircle,
          },
          {
            id: 'information-streams',
            label: 'Information Streams',
            icon: Activity,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
  );
};

export default AlertCenter;
