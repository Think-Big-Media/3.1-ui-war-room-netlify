import type React from 'react';
import { Filter } from 'lucide-react';
import Card from '../shared/Card';
import CustomDropdown from '../shared/CustomDropdown';

interface AlertFiltersProps {
  statusFilter: string;
  typeFilter: string;
  priorityFilter: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

const AlertFilters: React.FC<AlertFiltersProps> = ({
  statusFilter,
  typeFilter,
  priorityFilter,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'crisis', label: 'Crisis' },
    { value: 'opportunity', label: 'Opportunity' },
    { value: 'polling-shift', label: 'Polling Shift' },
    { value: 'ad-violation', label: 'Ad Violation' },
    { value: 'media-coverage', label: 'Media Coverage' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <Card padding="sm" variant="glass">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-white/70">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">FILTERS</span>
        </div>

        <CustomDropdown
          value={statusFilter}
          onChange={onStatusChange}
          options={statusOptions}
          placeholder="Status"
        />

        <CustomDropdown
          value={typeFilter}
          onChange={onTypeChange}
          options={typeOptions}
          placeholder="Type"
        />

        <CustomDropdown
          value={priorityFilter}
          onChange={onPriorityChange}
          options={priorityOptions}
          placeholder="Priority"
        />
      </div>
    </Card>
  );
};

export default AlertFilters;
