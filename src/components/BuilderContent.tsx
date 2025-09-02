/**
 * Builder.io Content Component
 * Renders Builder.io content and enables visual editing
 */

import { BuilderComponent, builder } from '@builder.io/react';
import { useEffect, useState } from 'react';

// Import the component registry to ensure components are registered
import '../builder-registry';

interface BuilderContentProps {
  modelName?: string;
  content?: any;
  apiKey?: string;
}

export const BuilderContent: React.FC<BuilderContentProps> = ({
  modelName = 'page',
  content: initialContent,
  apiKey,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);

  // Initialize Builder with API key
  useEffect(() => {
    if (apiKey) {
      builder.init(apiKey);
    }
  }, [apiKey]);

  // Fetch content if not provided
  useEffect(() => {
    if (!initialContent && typeof window !== 'undefined') {
      const fetchContent = async () => {
        try {
          setIsLoading(true);
          const urlPath = window.location.pathname || '/';

          const content = await builder
            .get(modelName, {
              url: urlPath,
              userAttributes: {
                // Add any user attributes for targeting
                device: 'desktop',
              },
            })
            .promise();

          setContent(content);
        } catch (err) {
          console.error('Error fetching Builder content:', err);
          setError('Failed to load content');
        } finally {
          setIsLoading(false);
        }
      };

      fetchContent();
    }
  }, [initialContent, modelName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">No content found for this page</p>
          <p className="text-sm text-gray-500 mt-2">
            Create content in Builder.io for: {window.location.pathname}
          </p>
        </div>
      </div>
    );
  }

  return <BuilderComponent model={modelName} content={content} />;
};

export default BuilderContent;
