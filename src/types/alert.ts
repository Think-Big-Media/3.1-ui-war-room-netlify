// Alert types for Alert Center
export interface Alert {
  id: string;
  type: 'crisis' | 'opportunity' | 'polling-shift' | 'ad-violation' | 'media-coverage';
  title: string;
  summary: string;
  timestamp: string;
  location: string;
  audience: string;
  issue: string;
  suggestedAction: string;
  assignedTo?: string;
  status: 'new' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
}

export interface CollaborationModal {
  isOpen: boolean;
  alert: Alert | null;
}

export interface AlertFilters {
  status: string;
  type: string;
  priority: string;
}
