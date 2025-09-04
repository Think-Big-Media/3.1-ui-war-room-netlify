// Asset Controls Component

import type React from 'react';
import { Search, Plus, Folder, FileText, Image, Palette, BarChart3 } from 'lucide-react';
import Card from '../shared/Card';
import CustomDropdown from '../shared/CustomDropdown';
import { type AssetFilters } from '../../types/campaign';

interface AssetControlsProps {
  filters: AssetFilters;
  onFiltersChange: (filters: AssetFilters) => void;
  onUploadAsset: () => void;
}

const AssetControls: React.FC<AssetControlsProps> = ({
  filters,
  onFiltersChange,
  onUploadAsset,
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category });
  };

  // Dropdown options
  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: <Folder className="w-4 h-4" /> },
    {
      value: 'Campaign Content',
      label: 'Campaign Content',
      icon: <FileText className="w-4 h-4" />,
    },
    { value: 'Research', label: 'Research', icon: <BarChart3 className="w-4 h-4" /> },
    { value: 'Brand Assets', label: 'Brand Assets', icon: <Palette className="w-4 h-4" /> },
    { value: 'Templates', label: 'Templates', icon: <Image className="w-4 h-4" /> },
  ];

  return (
    <Card padding="sm" variant="glass">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Search assets..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-black/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50"
            />
          </div>
          <CustomDropdown
            value={filters.category}
            onChange={handleCategoryChange}
            options={categoryOptions}
            className="min-w-[160px]"
          />
        </div>
        <button
          onClick={onUploadAsset}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>
    </Card>
  );
};

export default AssetControls;
