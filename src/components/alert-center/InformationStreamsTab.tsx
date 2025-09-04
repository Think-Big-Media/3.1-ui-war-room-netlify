import type React from 'react';
import { Search, Globe, Target, Bell } from 'lucide-react';
import Card from '../shared/Card';
import CustomDropdown from '../shared/CustomDropdown';
import InformationStreamCard from './InformationStreamCard';
import { type InformationItem, type InformationFilters } from '../../types/information';

interface InformationStreamsTabProps {
  items: InformationItem[];
  filters: InformationFilters;
  onFilterChange: (filters: InformationFilters) => void;
  onItemClick: (item: InformationItem) => void;
  onMarkAllRead: () => void;
}

const InformationStreamsTab: React.FC<InformationStreamsTabProps> = ({
  items,
  filters,
  onFilterChange,
  onItemClick,
  onMarkAllRead,
}) => {
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'political-news', label: 'Political News' },
    { value: 'smart-recommendations', label: 'Smart Recommendations' },
    { value: 'team-alerts', label: 'Team Alerts' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'archived', label: 'Archived' },
  ];

  const stats = [
    {
      title: 'Political News',
      count: items.filter((i) => i.category === 'political-news').length,
      icon: Globe,
      color: 'text-blue-400',
    },
    {
      title: 'Smart Recommendations',
      count: items.filter((i) => i.category === 'smart-recommendations').length,
      icon: Target,
      color: 'text-orange-400',
    },
    {
      title: 'Team Alerts',
      count: items.filter((i) => i.category === 'team-alerts').length,
      icon: Bell,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="hoverable text-center hover:scale-[1.02] transition-all duration-200"
            padding="sm"
            variant="glass"
          >
            <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
            <div className="text-2xl font-bold text-white/95">{stat.count}</div>
            <div className="text-sm text-white/70">{stat.title}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card
        className="hoverable hover:scale-[1.02] transition-all duration-200"
        padding="sm"
        variant="glass"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Search information..."
                value={filters.searchTerm || ''}
                onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
                className="pl-10 bg-black/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50"
              />
            </div>

            <CustomDropdown
              value={filters.category || 'all'}
              onChange={(value) =>
                onFilterChange({
                  ...filters,
                  category: value as InformationFilters['category'],
                })
              }
              options={categoryOptions}
              placeholder="Category"
            />

            <CustomDropdown
              value={filters.priority || 'all'}
              onChange={(value) =>
                onFilterChange({
                  ...filters,
                  priority: value as InformationFilters['priority'],
                })
              }
              options={priorityOptions}
              placeholder="Priority"
            />

            <CustomDropdown
              value={filters.status || 'all'}
              onChange={(value) =>
                onFilterChange({
                  ...filters,
                  status: value as InformationFilters['status'],
                })
              }
              options={statusOptions}
              placeholder="Status"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">{items.length} items</span>
            <button
              onClick={onMarkAllRead}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </Card>

      {/* Information Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <InformationStreamCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
};

export default InformationStreamsTab;
