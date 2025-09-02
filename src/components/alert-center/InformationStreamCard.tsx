import type React from 'react';
import { motion } from 'framer-motion';
import Card from '../shared/Card';
import { type InformationItem } from '../../types/information';
import {
  iconMap,
  getCategoryIcon,
  getCategoryColor,
  getPriorityColor,
  formatTimestamp,
} from './utils';

interface InformationStreamCardProps {
  item: InformationItem;
  onClick: (item: InformationItem) => void;
}

const InformationStreamCard: React.FC<InformationStreamCardProps> = ({ item, onClick }) => {
  const getIcon = (item: InformationItem) => {
    if (item.icon && iconMap[item.icon]) {
      return iconMap[item.icon];
    }
    return getCategoryIcon(item.category);
  };

  const IconComponent = getIcon(item);

  return (
    <Card
      key={item.id}
      className={`hoverable cursor-pointer border-l-4 hover:scale-[1.02] transition-all duration-200 ${getPriorityColor(item.priority)}`}
      padding="sm"
      variant="glass"
      onClick={() => onClick(item)}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-white/95">{item.title}</h4>
            <span
              className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)} border`}
            >
              {item.priority}
            </span>
            {item.status === 'unread' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
          </div>
          <p className="text-white/80 mb-3">{item.text}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-white/60 font-mono uppercase">
              <span>{formatTimestamp(item.timestamp)}</span>
              <span>{item.category.replace('-', ' ')}</span>
              {item.actionable && <span className="text-green-400">• ACTIONABLE</span>}
              {item.metadata?.assignee && <span>• {item.metadata.assignee.toUpperCase()}</span>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InformationStreamCard;
