/**
 * Automation Dashboard
 *
 * Features:
 * - Drag & drop workflow builder
 * - Crisis alert monitoring
 * - Workflow execution tracking
 * - Notification management
 * - Real-time updates
 */

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
// Temporarily disable drag & drop until we replace react-beautiful-dnd
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Zap,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  Activity,
  Eye,
  Edit3,
  Trash2,
  Filter,
  Search,
  Download,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  status: 'active' | 'inactive' | 'paused' | 'draft';
  execution_count: number;
  success_rate: number;
  last_executed_at: string;
  created_at: string;
  actions: WorkflowAction[];
}

interface WorkflowAction {
  id: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

interface CrisisAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  content: string;
  acknowledged: boolean;
  is_resolved: boolean;
  detected_at: string;
  response_time?: number;
}

interface Execution {
  id: string;
  workflow_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  success: boolean;
  steps_completed: number;
  steps_total: number;
  trigger_source: string;
}

const AutomationDashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'alerts' | 'executions'>(
    'overview'
  );
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop for workflow builder
  const [availableActions] = useState([
    { id: 'send_email', type: 'send_email', name: 'Send Email', icon: Mail },
    { id: 'send_sms', type: 'send_sms', name: 'Send SMS', icon: Smartphone },
    {
      id: 'send_whatsapp',
      type: 'send_whatsapp',
      name: 'Send WhatsApp',
      icon: MessageSquare,
    },
    {
      id: 'browser_notification',
      type: 'browser_notification',
      name: 'Browser Alert',
      icon: Monitor,
    },
    {
      id: 'create_task',
      type: 'create_task',
      name: 'Create Task',
      icon: CheckCircle,
    },
    { id: 'webhook', type: 'webhook', name: 'Webhook', icon: Zap },
    {
      id: 'crisis_alert',
      type: 'crisis_alert',
      name: 'Crisis Alert',
      icon: AlertTriangle,
    },
  ]);

  // Mock data loading
  useEffect(() => {
    loadWorkflows();
    loadCrisisAlerts();
    loadExecutions();
  }, []);

  const loadWorkflows = async () => {
    // Mock API call
    const mockWorkflows: Workflow[] = [
      {
        id: '1',
        name: 'Crisis Response Protocol',
        description: 'Automated response to high-severity crisis alerts',
        trigger_type: 'crisis',
        status: 'active',
        execution_count: 15,
        success_rate: 93.3,
        last_executed_at: '2025-01-08T10:30:00Z',
        created_at: '2025-01-01T00:00:00Z',
        actions: [
          {
            id: 'a1',
            type: 'send_email',
            config: { recipient: 'team@campaign.com' },
            order: 1,
          },
          {
            id: 'a2',
            type: 'send_sms',
            config: { recipient: '+1234567890' },
            order: 2,
          },
          {
            id: 'a3',
            type: 'crisis_alert',
            config: { severity: 'high' },
            order: 3,
          },
        ],
      },
      {
        id: '2',
        name: 'Daily Donor Update',
        description: 'Send daily updates to major donors',
        trigger_type: 'schedule',
        status: 'active',
        execution_count: 45,
        success_rate: 100,
        last_executed_at: '2025-01-08T09:00:00Z',
        created_at: '2025-01-02T00:00:00Z',
        actions: [
          {
            id: 'b1',
            type: 'send_email',
            config: { template: 'donor_update' },
            order: 1,
          },
        ],
      },
    ];
    setWorkflows(mockWorkflows);
  };

  const loadCrisisAlerts = async () => {
    // Mock API call
    const mockAlerts: CrisisAlert[] = [
      {
        id: 'c1',
        alert_type: 'negative_sentiment',
        severity: 'high',
        title: 'High Crisis Alert: Negative Twitter mention about campaign financing',
        description: 'Crisis Score: 75.5/100\nSource: twitter\nSentiment Score: -0.72',
        source: 'mentionlytics',
        content: 'This campaign is using dirty money from special interests...',
        acknowledged: false,
        is_resolved: false,
        detected_at: '2025-01-08T11:15:00Z',
      },
      {
        id: 'c2',
        alert_type: 'viral_mention',
        severity: 'medium',
        title: 'Medium Crisis Alert: Viral mention on Facebook',
        description: 'Crisis Score: 45.2/100\nSource: facebook\nReach: 25,000',
        source: 'mentionlytics',
        content: 'Did you see what the candidate said yesterday?',
        acknowledged: true,
        is_resolved: false,
        detected_at: '2025-01-08T08:30:00Z',
        response_time: 25,
      },
    ];
    setCrisisAlerts(mockAlerts);
  };

  const loadExecutions = async () => {
    // Mock API call
    const mockExecutions: Execution[] = [
      {
        id: 'e1',
        workflow_id: '1',
        execution_status: 'completed',
        started_at: '2025-01-08T10:30:00Z',
        completed_at: '2025-01-08T10:30:45Z',
        duration_ms: 45000,
        success: true,
        steps_completed: 3,
        steps_total: 3,
        trigger_source: 'crisis_detector',
      },
      {
        id: 'e2',
        workflow_id: '2',
        execution_status: 'running',
        started_at: '2025-01-08T11:20:00Z',
        success: false,
        steps_completed: 1,
        steps_total: 1,
        trigger_source: 'schedule',
      },
    ];
    setExecutions(mockExecutions);
  };

  // Drag and drop handler
  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination || !selectedWorkflow) {
        return;
      }

      const { source, destination } = result;

      if (
        source.droppableId === 'available-actions' &&
        destination.droppableId === 'workflow-actions'
      ) {
        // Add action to workflow
        const actionType = availableActions.find((a) => a.id === result.draggableId);
        if (actionType) {
          const newAction: WorkflowAction = {
            id: `action_${Date.now()}`,
            type: actionType.type,
            config: {},
            order: selectedWorkflow.actions.length + 1,
          };

          const updatedWorkflow = {
            ...selectedWorkflow,
            actions: [...selectedWorkflow.actions, newAction],
          };

          setSelectedWorkflow(updatedWorkflow);
        }
      } else if (
        source.droppableId === 'workflow-actions' &&
        destination.droppableId === 'workflow-actions'
      ) {
        // Reorder actions
        const actions = Array.from(selectedWorkflow.actions);
        const [reorderedAction] = actions.splice(source.index, 1);
        actions.splice(destination.index, 0, reorderedAction);

        // Update order
        const updatedActions = actions.map((action, index) => ({
          ...action,
          order: index + 1,
        }));

        setSelectedWorkflow({
          ...selectedWorkflow,
          actions: updatedActions,
        });
      }
    },
    [selectedWorkflow, availableActions]
  );

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'inactive':
        return <Square className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  // Get action icon
  const getActionIcon = (type: string) => {
    const action = availableActions.find((a) => a.type === type);
    return action ? action.icon : Zap;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Automation Dashboard</h1>
        <p className="text-gray-600">
          Manage workflows, monitor crises, and track automated responses
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {(['overview', 'workflows', 'alerts', 'executions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Zap className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflows.filter((w) => w.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Open Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {crisisAlerts.filter((a) => !a.is_resolved).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Executions Today</p>
                  <p className="text-2xl font-bold text-gray-900">{executions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Bell className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      workflows.reduce((acc, w) => acc + w.success_rate, 0) / workflows.length
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Crisis Alerts */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Crisis Alerts</h3>
            </div>
            <div className="p-6">
              {crisisAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start space-x-4 py-4 border-b border-gray-100 last:border-0"
                >
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alert.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alert.detected_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </button>
          </div>

          {/* Workflows List */}
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(workflow.status)}
                      <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {workflow.trigger_type}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">{workflow.description}</p>

                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                      <span>Executed {workflow.execution_count} times</span>
                      <span>{workflow.success_rate}% success rate</span>
                      <span>
                        Last run: {new Date(workflow.last_executed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsBuilderOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-green-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crisis Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {crisisAlerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{alert.source}</span>
                      {alert.acknowledged && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{alert.title}</h3>
                    <p className="text-gray-600 mb-3">{alert.description}</p>
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-sm text-gray-700 line-clamp-3">{alert.content}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Detected: {new Date(alert.detected_at).toLocaleString()}
                      {alert.response_time && (
                        <span> • Response time: {alert.response_time} minutes</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {!alert.acknowledged && (
                      <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        Acknowledge
                      </button>
                    )}
                    {!alert.is_resolved && (
                      <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </h2>
              <button
                onClick={() => {
                  setIsBuilderOpen(false);
                  setSelectedWorkflow(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Available Actions */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Available Actions</h3>
                    <Droppable droppableId="available-actions" isDropDisabled={true}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {availableActions.map((action, index) => (
                            <Draggable key={action.id} draggableId={action.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 rounded-lg border cursor-grab flex items-center space-x-3 ${
                                    snapshot.isDragging
                                      ? 'border-blue-300 bg-blue-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <action.icon className="w-5 h-5 text-gray-600" />
                                  <span className="text-sm font-medium">{action.name}</span>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>

                  {/* Workflow Builder */}
                  <div className="lg:col-span-2">
                    <h3 className="font-medium text-gray-900 mb-4">Workflow Actions</h3>
                    <Droppable droppableId="workflow-actions">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`min-h-64 p-4 rounded-lg border-2 border-dashed ${
                            snapshot.isDraggingOver
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedWorkflow?.actions.length === 0 && (
                            <div className="text-center text-gray-500 py-12">
                              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <p>Drag actions here to build your workflow</p>
                            </div>
                          )}

                          {selectedWorkflow?.actions.map((action, index) => (
                            <Draggable key={action.id} draggableId={action.id} index={index}>
                              {(provided) => {
                                const ActionIcon = getActionIcon(action.type);
                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="p-4 mb-3 bg-white rounded-lg border border-gray-200 flex items-center space-x-3"
                                  >
                                    <ActionIcon className="w-5 h-5 text-gray-600" />
                                    <div className="flex-1">
                                      <span className="font-medium">
                                        {action.type.replace('_', ' ')}
                                      </span>
                                      <p className="text-sm text-gray-500">Step {action.order}</p>
                                    </div>
                                    <button className="p-1 text-gray-400 hover:text-red-600">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              }}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              </DragDropContext>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsBuilderOpen(false);
                  setSelectedWorkflow(null);
                }}
                className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationDashboard;
