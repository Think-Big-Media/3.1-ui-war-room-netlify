import type React from 'react';
import Card from '../shared/Card';
import { type Alert, type TeamMember } from '../../types/alert';

interface AssignedAlertsTrackerProps {
  alerts: Alert[];
  teamMembers: TeamMember[];
}

const AssignedAlertsTracker: React.FC<AssignedAlertsTrackerProps> = ({ alerts, teamMembers }) => {
  const getAssignedAlerts = (memberName: string) => {
    return alerts.filter((alert) => alert.assignedTo === memberName && alert.status !== 'resolved');
  };

  const getStatusDot = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card padding="sm" variant="glass">
      <h3 className="text-xl font-semibold text-white/40 tracking-wide font-barlow-condensed mb-4">
        TEAM ASSIGNMENTS
      </h3>
      <div className="space-y-3">
        {teamMembers.map((member) => {
          const assignedAlerts = getAssignedAlerts(member.name);
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
                    {member.avatar}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusDot(
                      member.status
                    )} border-2 border-black/20`}
                  />
                </div>
                <div>
                  <div className="text-white/95 font-medium text-sm">{member.name}</div>
                  <div className="text-white/60 text-xs">{member.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/95 font-semibold">{assignedAlerts.length}</div>
                <div className="text-white/60 text-xs">Active</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AssignedAlertsTracker;
