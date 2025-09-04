import type React from 'react';
import { useState } from 'react';
import { Instagram, Twitter, Linkedin, Facebook, Youtube, Send, Loader2 } from 'lucide-react';
import Card from '../shared/Card';
import { useGHLPost } from '../../services/ghlService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GHLPublisher');

interface GHLPublisherProps {
  onPublishSuccess?: () => void;
}

const platformOptions = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'twitter', name: 'Twitter', icon: Twitter },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
];

const GHLPublisher: React.FC<GHLPublisherProps> = ({ onPublishSuccess }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [contentText, setContentText] = useState('');
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const ghlPost = useGHLPost();

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0 || !contentText) {
      alert('Please select at least one platform and enter content');
      return;
    }

    try {
      for (const platform of selectedPlatforms) {
        await ghlPost.mutateAsync({
          platform,
          content: {
            text: contentText,
            scheduleDate: new Date(scheduleDate),
          },
        });
      }

      // Reset form
      setSelectedPlatforms([]);
      setContentText('');
      setScheduleDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));

      onPublishSuccess?.();
    } catch (error) {
      logger.error('Failed to publish content:', error);
    }
  };

  return (
    <div className="fade-in">
      <Card padding="md" variant="glass">
        <h3 className="text-lg font-semibold text-white/95 mb-4">Quick Publish to GoHighLevel</h3>

        {/* Platform Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-2">Select Platforms</label>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                } border`}
              >
                <platform.icon className="w-4 h-4" />
                <span className="text-sm">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-2">Content</label>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Enter your content here..."
            className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 h-32 resize-none"
          />
        </div>

        {/* Schedule Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Schedule Date & Time
          </label>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={ghlPost.isPending}
          className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${
            ghlPost.isPending
              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {ghlPost.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Publish to Selected Platforms</span>
            </>
          )}
        </button>

        {ghlPost.isSuccess && (
          <p className="text-green-400 text-sm mt-2 text-center">Content published successfully!</p>
        )}
        {ghlPost.isError && (
          <p className="text-red-400 text-sm mt-2 text-center">
            Failed to publish content. Please try again.
          </p>
        )}
      </Card>
    </div>
  );
};

export default GHLPublisher;
