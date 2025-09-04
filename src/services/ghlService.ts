import axios from 'axios';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createLogger } from '../utils/logger';

const logger = createLogger('ghlService');

// GHL API configuration
const ghlApi = axios.create({
  baseURL: import.meta.env.VITE_GHL_API_URL || 'https://api.gohighlevel.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor for GHL
ghlApi.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('ghlApiKey');
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

// Zod schemas for validation
const GHLAuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

const ContentPostSchema = z.object({
  text: z.string(),
  imageUrl: z.string().optional(),
  scheduleDate: z.date(),
});

const PostResponseSchema = z.object({
  success: z.boolean(),
  postId: z.string(),
  platform: z.string(),
  scheduledAt: z.string(),
});

const ScheduleItemSchema = z.object({
  id: z.string(),
  platform: z.string(),
  content: z.string(),
  scheduledDate: z.string(),
  status: z.enum(['scheduled', 'published', 'failed']),
});

const SchedulesResponseSchema = z.object({
  schedules: z.array(ScheduleItemSchema),
  total: z.number(),
});

// Service functions
export const ghlService = {
  /**
   * Authenticate with GHL API
   */
  authenticateGHL: async (apiKey: string) => {
    try {
      // Store API key
      localStorage.setItem('ghlApiKey', apiKey);

      // Verify the API key with a test request
      const response = await ghlApi.get('/v1/users/me', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (response.status === 200) {
        return GHLAuthResponseSchema.parse({ success: true });
      }
    } catch (error) {
      localStorage.removeItem('ghlApiKey');
      throw new Error('Invalid API key');
    }
  },

  /**
   * Post content to social platforms via GHL
   */
  postContent: async (platform: string, content: z.infer<typeof ContentPostSchema>) => {
    // Mock implementation - replace with actual GHL endpoint
    const mockResponse = {
      success: true,
      postId: `post_${Date.now()}`,
      platform,
      scheduledAt: content.scheduleDate.toISOString(),
    };

    // In production, use actual GHL endpoint:
    // const response = await ghlApi.post('/v1/social/posts', {
    //   platform,
    //   ...content,
    //   scheduleDate: content.scheduleDate.toISOString(),
    // });
    // return PostResponseSchema.parse(response.data);

    return PostResponseSchema.parse(mockResponse);
  },

  /**
   * Get scheduled posts
   */
  getSchedules: async () => {
    // Mock implementation
    const mockSchedules = {
      schedules: [
        {
          id: '1',
          platform: 'instagram',
          content: 'AI Productivity Tips #1',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled' as const,
        },
        {
          id: '2',
          platform: 'twitter',
          content: 'Thread: 5 AI Tools for Content',
          scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled' as const,
        },
      ],
      total: 2,
    };

    // In production:
    // const response = await ghlApi.get('/v1/social/schedules');
    // return SchedulesResponseSchema.parse(response.data);

    return SchedulesResponseSchema.parse(mockSchedules);
  },
};

// React Query hooks
export const useGHLAuth = () => {
  return useMutation({
    mutationFn: ghlService.authenticateGHL,
    onSuccess: () => {
      logger.info('GHL authentication successful');
    },
  });
};

export const useGHLPost = () => {
  return useMutation({
    mutationFn: ({
      platform,
      content,
    }: {
      platform: string;
      content: z.infer<typeof ContentPostSchema>;
    }) => ghlService.postContent(platform, content),
    onSuccess: (data) => {
      logger.info('Content posted successfully', { data });
    },
  });
};

export const useGHLSchedules = () => {
  return useQuery({
    queryKey: ['ghl', 'schedules'],
    queryFn: ghlService.getSchedules,
    enabled: Boolean(localStorage.getItem('ghlApiKey')),
  });
};
