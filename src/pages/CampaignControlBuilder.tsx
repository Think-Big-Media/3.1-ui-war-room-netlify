/**
 * Campaign Control Page - Builder.io Version
 * This fetches the latest content directly from Builder.io
 */

import React from 'react';
import { BuilderComponent, builder, useIsPreviewing } from '@builder.io/react';
import { useEffect, useState } from 'react';

// Initialize Builder with API key
const BUILDER_API_KEY = import.meta.env.VITE_BUILDER_IO_KEY || '8686f311497044c0932b7d2247296478';

if (!builder.apiKey) {
  builder.init(BUILDER_API_KEY);
}

const CampaignControlBuilder: React.FC = () => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isPreviewing = useIsPreviewing();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        console.log('🔄 Fetching latest Campaign Control from Builder.io...');

        // Force fetch fresh content from Builder.io
        const builderContent = await builder
          .get('page', {
            url: '/campaign-control',
            userAttributes: {
              device: 'desktop',
              urlPath: '/campaign-control',
              timestamp: Date.now(), // Cache bust
            },
            options: {
              noCache: true,
              includeRefs: true,
              cachebust: true,
            },
            cacheSeconds: 0,
          })
          .promise();

        if (builderContent) {
          console.log('✅ Got latest Campaign Control content from Builder.io');
          setContent(builderContent);
        } else {
          console.log('⚠️ No content found for Campaign Control in Builder.io');
        }
      } catch (error) {
        console.error('❌ Error fetching Builder content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-white/60">Loading latest from Builder.io...</p>
        </div>
      </div>
    );
  }

  if (!content && !isPreviewing) {
    // No content found, but still render something
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white/60">
          <p>No content found in Builder.io</p>
          <p className="text-sm mt-2">URL: /campaign-control</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BuilderComponent
        model="page"
        content={content}
        options={{
          includeRefs: true,
        }}
      />
    </div>
  );
};

export default CampaignControlBuilder;
