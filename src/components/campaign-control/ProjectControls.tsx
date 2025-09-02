// Project Controls Component

import type React from 'react';
import { Search, Plus, BarChart3, Clock, CheckCircle, PlayCircle, FileText } from 'lucide-react';
import Card from '../shared/Card';
import CustomDropdown from '../shared/CustomDropdown';
import { type ProjectFilters } from '../../types/campaign';

interface ProjectControlsProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onNewProject: () => void;
}

const ProjectControls: React.FC<ProjectControlsProps> = ({
  filters,
  onFiltersChange,
  onNewProject,
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status });
  };

  // Dropdown options
  const statusOptions = [
    { value: 'all', label: 'All Status', icon: <BarChart3 className="w-4 h-4" /> },
    { value: 'planning', label: 'Planning', icon: <FileText className="w-4 h-4" /> },
    { value: 'in-progress', label: 'In Progress', icon: <PlayCircle className="w-4 h-4" /> },
    { value: 'review', label: 'Review', icon: <Clock className="w-4 h-4" /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <Card padding="sm" variant="glass">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-black/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50"
            />
          </div>
          <CustomDropdown
            value={filters.status}
            onChange={handleStatusChange}
            options={statusOptions}
            className="min-w-[140px]"
          />
        </div>
        <button
          onClick={onNewProject}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>
    </Card>
  );
};

export default ProjectControls;
