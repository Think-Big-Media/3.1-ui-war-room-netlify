// Content types for Content Engine
export interface ContentFormat {
  id: string;
  title: string;
  category: 'blog' | 'social' | 'audio-video';
  status: 'ready' | 'in-progress' | 'scheduled' | 'published';
  icon: React.ComponentType<{
    className?: string;
  }>;
  enabled: boolean;
  description: string;
  authorityScore: string;
  customerPsychology: string;
  alignment: string;
}

export interface ContentEnginePageProps {
  selectedCluster?: string;
  weekOffset?: number;
  enabledFormats?: string[];
  onFormatToggle?: (formatId: string, enabled: boolean) => void;
  onPublishContent?: (contentId: string, platform: string) => void;
  onClusterChange?: (clusterId: string) => void;
}

export interface ContentCategory {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface ContentSchedule {
  id: string;
  platform: string;
  content: {
    text: string;
    scheduleDate: Date;
  };
  status: 'pending' | 'scheduled' | 'published' | 'failed';
}
