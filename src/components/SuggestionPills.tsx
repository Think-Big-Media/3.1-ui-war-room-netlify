import React from 'react';
import { motion } from 'framer-motion';

interface Suggestion {
  id: string;
  text: string;
  category: 'trends' | 'patterns' | 'insights' | 'metrics';
}

interface SuggestionPillsProps {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

const SuggestionPills: React.FC<SuggestionPillsProps> = ({ onSuggestionClick, className = '' }) => {
  const suggestions: Suggestion[] = [
    { id: '1', text: 'the fundraising trends', category: 'trends' },
    { id: '2', text: 'suburban voter patterns', category: 'patterns' },
    { id: '3', text: 'recent polling shifts', category: 'insights' },
    { id: '4', text: 'engagement metrics', category: 'metrics' },
    { id: '5', text: 'content strategy', category: 'insights' },
    { id: '6', text: 'social media reach', category: 'metrics' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trends': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'patterns': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'insights': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'metrics': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSuggestionClick(suggestion.text)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border border-transparent hover:border-current/20 ${getCategoryColor(suggestion.category)}`}
        >
          {suggestion.text}
        </motion.button>
      ))}
    </div>
  );
};

export default SuggestionPills;