import type React from 'react';
import ContentFormatCard from './ContentFormatCard';
import { type ContentFormat } from '../../types/content';

interface ContentFormatGridProps {
  formats: ContentFormat[];
  onFormatToggle: (formatId: string, enabled: boolean) => void;
  onPublishContent: (contentId: string, platform: string) => void;
}

const ContentFormatGrid: React.FC<ContentFormatGridProps> = ({
  formats,
  onFormatToggle,
  onPublishContent,
}) => {
  // Group formats by category
  const blogFormats = formats.filter((f) => f.category === 'blog');
  const socialFormats = formats.filter((f) => f.category === 'social');
  const audioVideoFormats = formats.filter((f) => f.category === 'audio-video');

  return (
    <div className="space-y-8">
      {/* Blog Content Section */}
      {blogFormats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2" />
            Blog Content
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogFormats.map((format, index) => (
              <ContentFormatCard
                key={format.id}
                format={format}
                onToggle={onFormatToggle}
                onPublish={onPublishContent}
                delay={0.2 + index * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Social Media Section */}
      {socialFormats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center">
            <div className="w-3 h-3 bg-[var(--accent-live-monitoring)] rounded-full mr-2" />
            Social Media
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialFormats.map((format, index) => (
              <ContentFormatCard
                key={format.id}
                format={format}
                onToggle={onFormatToggle}
                onPublish={onPublishContent}
                delay={0.4 + index * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audio/Video & Lead Generation Section */}
      {audioVideoFormats.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded-full mr-2" />
            Audio/Video & Lead Generation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioVideoFormats.map((format, index) => (
              <ContentFormatCard
                key={format.id}
                format={format}
                onToggle={onFormatToggle}
                onPublish={onPublishContent}
                delay={0.6 + index * 0.1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFormatGrid;
