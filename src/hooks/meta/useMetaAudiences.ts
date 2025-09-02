/**
 * React Query hooks for Meta Audience Management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  MetaAudienceService,
  type CustomAudienceCreateParams,
  type CustomAudienceUpdateParams,
  type LookalikeAudienceCreateParams,
  type SavedAudienceCreateParams,
  type AudienceListParams,
  type AudienceInsightsParams,
} from '@/api/meta/audiences';
import {
  type CustomAudience,
  type LookalikeAudience,
  type SavedAudience,
  type MetaAPIResponse,
} from '@/api/meta/types';
import { useMetaClient } from './useMetaClient';
import { toast } from 'sonner';

// Query Keys
export const audienceKeys = {
  all: ['meta', 'audiences'] as const,
  custom: () => [...audienceKeys.all, 'custom'] as const,
  customLists: () => [...audienceKeys.custom(), 'list'] as const,
  customList: (accountId: string, params?: AudienceListParams) =>
    [...audienceKeys.customLists(), accountId, params] as const,
  customDetail: (audienceId: string) => [...audienceKeys.custom(), audienceId] as const,

  lookalike: () => [...audienceKeys.all, 'lookalike'] as const,
  lookalikeDetail: (audienceId: string) => [...audienceKeys.lookalike(), audienceId] as const,

  saved: () => [...audienceKeys.all, 'saved'] as const,
  savedDetail: (audienceId: string) => [...audienceKeys.saved(), audienceId] as const,

  insights: (accountId: string, params?: AudienceInsightsParams) =>
    [...audienceKeys.all, 'insights', accountId, params] as const,
  overlap: (audienceId1: string, audienceId2: string) =>
    [...audienceKeys.all, 'overlap', audienceId1, audienceId2] as const,
};

/**
 * Hook to fetch custom audiences list
 */
export function useMetaCustomAudiences(
  accountId: string,
  params?: AudienceListParams,
  options?: UseQueryOptions<MetaAPIResponse<CustomAudience[]>>
) {
  const { audienceService } = useMetaClient();

  return useQuery({
    queryKey: audienceKeys.customList(accountId, params),
    queryFn: () => audienceService.listCustomAudiences(accountId, params),
    staleTime: 1000 * 60 * 10, // 10 minutes - audiences don't change often
    ...options,
  });
}

/**
 * Hook to fetch a single custom audience
 */
export function useMetaCustomAudience(
  audienceId: string,
  options?: UseQueryOptions<CustomAudience>
) {
  const { audienceService } = useMetaClient();

  return useQuery({
    queryKey: audienceKeys.customDetail(audienceId),
    queryFn: () => audienceService.getCustomAudience(audienceId),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to fetch a lookalike audience
 */
export function useMetaLookalikeAudience(
  audienceId: string,
  options?: UseQueryOptions<LookalikeAudience>
) {
  const { audienceService } = useMetaClient();

  return useQuery({
    queryKey: audienceKeys.lookalikeDetail(audienceId),
    queryFn: () => audienceService.getLookalikeAudience(audienceId),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to fetch a saved audience
 */
export function useMetaSavedAudience(audienceId: string, options?: UseQueryOptions<SavedAudience>) {
  const { audienceService } = useMetaClient();

  return useQuery({
    queryKey: audienceKeys.savedDetail(audienceId),
    queryFn: () => audienceService.getSavedAudience(audienceId),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

/**
 * Hook to create a custom audience
 */
export function useCreateMetaCustomAudience(
  options?: UseMutationOptions<
    CustomAudience,
    Error,
    {
      accountId: string;
      params: CustomAudienceCreateParams;
    }
  >
) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, params }) => audienceService.createCustomAudience(accountId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceKeys.customLists() });
      queryClient.setQueryData(audienceKeys.customDetail(data.id), data);
      toast.success('Custom audience created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create custom audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to create a lookalike audience
 */
export function useCreateMetaLookalikeAudience(
  options?: UseMutationOptions<
    LookalikeAudience,
    Error,
    {
      accountId: string;
      params: LookalikeAudienceCreateParams;
    }
  >
) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, params }) =>
      audienceService.createLookalikeAudience(accountId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceKeys.customLists() });
      queryClient.setQueryData(audienceKeys.lookalikeDetail(data.id), data);
      toast.success('Lookalike audience created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create lookalike audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to create a saved audience
 */
export function useCreateMetaSavedAudience(
  options?: UseMutationOptions<
    SavedAudience,
    Error,
    {
      accountId: string;
      params: SavedAudienceCreateParams;
    }
  >
) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, params }) => audienceService.createSavedAudience(accountId, params),
    onSuccess: (data) => {
      queryClient.setQueryData(audienceKeys.savedDetail(data.id), data);
      toast.success('Saved audience created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create saved audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to update a custom audience
 */
export function useUpdateMetaCustomAudience(
  options?: UseMutationOptions<
    CustomAudience,
    Error,
    {
      audienceId: string;
      params: CustomAudienceUpdateParams;
    }
  >
) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ audienceId, params }) =>
      audienceService.updateCustomAudience(audienceId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceKeys.customLists() });
      queryClient.setQueryData(audienceKeys.customDetail(variables.audienceId), data);
      toast.success('Custom audience updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update custom audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to delete a custom audience
 */
export function useDeleteMetaCustomAudience(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: (audienceId) => audienceService.deleteCustomAudience(audienceId),
    onSuccess: (_, audienceId) => {
      queryClient.invalidateQueries({ queryKey: audienceKeys.customLists() });
      queryClient.removeQueries({ queryKey: audienceKeys.customDetail(audienceId) });
      toast.success('Custom audience deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete custom audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to add users to a custom audience
 */
export function useAddUsersToAudience(
  options?: UseMutationOptions<
    { audience_id: string; session_id: string; num_received: number },
    Error,
    {
      audienceId: string;
      users: Array<{
        email?: string;
        phone?: string;
        madid?: string;
        fn?: string;
        ln?: string;
        ct?: string;
        st?: string;
        zip?: string;
        country?: string;
      }>;
      schema?: string[];
    }
  >
) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ audienceId, users, schema }) =>
      audienceService.addUsersToAudience(audienceId, users, schema),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: audienceKeys.customDetail(variables.audienceId),
      });
      toast.success(`Added ${data.num_received} users to audience`);
    },
    onError: (error) => {
      toast.error(`Failed to add users to audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to remove users from a custom audience
 */
export function useRemoveUsersFromAudience(
  options?: UseMutationOptions<
    { audience_id: string; session_id: string; num_received: number },
    Error,
    {
      audienceId: string;
      users: Array<{ email?: string; phone?: string }>;
      schema?: string[];
    }
  >
) {
  const queryClient = useQueryClient();
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ audienceId, users, schema }) =>
      audienceService.removeUsersFromAudience(audienceId, users, schema),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: audienceKeys.customDetail(variables.audienceId),
      });
      toast.success(`Removed ${data.num_received} users from audience`);
    },
    onError: (error) => {
      toast.error(`Failed to remove users from audience: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to get audience insights
 */
export function useMetaAudienceInsights(
  accountId: string,
  params?: AudienceInsightsParams,
  options?: UseQueryOptions<any>
) {
  const { audienceService } = useMetaClient();

  return useQuery({
    queryKey: audienceKeys.insights(accountId, params),
    queryFn: () => audienceService.getAudienceInsights(accountId, params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to get audience overlap
 */
export function useMetaAudienceOverlap(
  audienceId1: string,
  audienceId2: string,
  options?: UseQueryOptions<{ overlap_count: number; overlap_percentage: number }>
) {
  const { audienceService } = useMetaClient();

  return useQuery({
    queryKey: audienceKeys.overlap(audienceId1, audienceId2),
    queryFn: () => audienceService.getAudienceOverlap(audienceId1, audienceId2),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: Boolean(audienceId1) && Boolean(audienceId2),
    ...options,
  });
}

/**
 * Hook to share an audience
 */
export function useShareMetaAudience(
  options?: UseMutationOptions<
    void,
    Error,
    {
      audienceId: string;
      targetAccountIds: string[];
    }
  >
) {
  const { audienceService } = useMetaClient();

  return useMutation({
    mutationFn: ({ audienceId, targetAccountIds }) =>
      audienceService.shareAudience(audienceId, targetAccountIds),
    onSuccess: () => {
      toast.success('Audience shared successfully');
    },
    onError: (error) => {
      toast.error(`Failed to share audience: ${error.message}`);
    },
    ...options,
  });
}
