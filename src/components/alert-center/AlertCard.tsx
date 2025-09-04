import type React from 'react';
import { MessageSquare, Link, ChevronDown, ChevronUp, User } from 'lucide-react';
import Card from '../shared/Card';
import { type Alert } from '../../types/alert';
import { getAlertIcon, getPriorityColor, getStatusColor, getStatusIcon } from './utils';

interface AlertCardProps {
  alert: Alert;
  isExpanded: boolean;
  onExpand: (alertId: string) => void;
  onAssign: (alert: Alert) => void;
  onStatusUpdate: (alertId: string, newStatus: Alert['status']) => void;
  onClick: (alert: Alert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  isExpanded,
  onExpand,
  onAssign,
  onStatusUpdate,
  onClick,
}) => {
  return (
    <Card
      className={`hoverable cursor-pointer border-l-4 hover:scale-[1.02] transition-all duration-200 ${getPriorityColor(alert.priority)}`}
      padding="sm"
      variant="glass"
      onClick={() => onClick(alert)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getAlertIcon(alert.type)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="section-header">{alert.title}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                  alert.status
                )} text-white flex items-center space-x-1`}
              >
                {getStatusIcon(alert.status)}
                <span>{alert.status}</span>
              </span>
            </div>
            <p className="text-white/70 text-sm mb-2">{alert.summary}</p>
            <div className="flex items-center space-x-4 text-xs text-white/60">
              <span>{alert.timestamp}</span>
              <span>{alert.location}</span>
              <span>{alert.audience}</span>
              <span>{alert.issue}</span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-1">Suggested Action</h4>
                    <p className="text-sm text-white/70">{alert.suggestedAction}</p>
                  </div>

                  {alert.assignedTo && (
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-1">Assigned To</h4>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/70">{alert.assignedTo}</span>
                      </div>
                    </div>
                  )}

                  {alert.attachments && alert.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-1">Attachments</h4>
                      <div className="space-y-1">
                        {alert.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-sm text-white/70 hover:text-white transition-colors cursor-pointer"
                          >
                            <Link className="w-4 h-4" />
                            <span>{attachment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-2">
                    {alert.status !== 'resolved' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusUpdate(
                              alert.id,
                              alert.status === 'new' ? 'in-progress' : 'resolved'
                            );
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          {alert.status === 'new' ? 'Start Working' : 'Mark Resolved'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssign(alert);
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Collaborate</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand(alert.id);
          }}
          className="text-white/60 hover:text-white transition-colors ml-4"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
    </Card>
  );
};

export default AlertCard;
