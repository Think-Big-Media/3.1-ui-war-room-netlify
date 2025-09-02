/**
 * React Query hooks for Meta Campaign Management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  MetaCampaignService,
  type CampaignCreateParams,
  type CampaignUpdateParams,
  type CampaignListParams,
} from '@/api/meta/campaigns';
import { type Campaign, type MetaAPIResponse } from '@/api/meta/types';
import { useMetaClient } from './useMetaClient';
import { toast } from 'sonner';

// Query Keys
export const campaignKeys = {
  all: ['meta', 'campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (accountId: string, params?: CampaignListParams) =>
    [...campaignKeys.lists(), accountId, params] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (campaignId: string) => [...campaignKeys.details(), campaignId] as const,
  insights: (campaignId: string) => [...campaignKeys.detail(campaignId), 'insights'] as const,
  budget: (campaignId: string) => [...campaignKeys.detail(campaignId), 'budget'] as const,
};

/**
 * Hook to fetch campaigns list
 */
export function useMetaCampaigns(
  accountId: string,
  params?: CampaignListParams,
  options?: UseQueryOptions<MetaAPIResponse<Campaign[]>>
) {
  const { campaignService } = useMetaClient();

  return useQuery({
    queryKey: campaignKeys.list(accountId, params),
    queryFn: () => campaignService.listCampaigns(accountId, params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single campaign
 */
export function useMetaCampaign(campaignId: string, options?: UseQueryOptions<Campaign>) {
  const { campaignService } = useMetaClient();

  return useQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () => campaignService.getCampaign(campaignId),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to create a campaign
 */
export function useCreateMetaCampaign(
  options?: UseMutationOptions<Campaign, Error, { accountId: string; params: CampaignCreateParams }>
) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, params }) => campaignService.createCampaign(accountId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.setQueryData(campaignKeys.detail(data.id), data);
      toast.success('Campaign created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to update a campaign
 */
export function useUpdateMetaCampaign(
  options?: UseMutationOptions<
    Campaign,
    Error,
    { campaignId: string; params: CampaignUpdateParams }
  >
) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: ({ campaignId, params }) => campaignService.updateCampaign(campaignId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.setQueryData(campaignKeys.detail(variables.campaignId), data);
      toast.success('Campaign updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update campaign: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to delete a campaign
 */
export function useDeleteMetaCampaign(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: (campaignId) => campaignService.deleteCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.removeQueries({ queryKey: campaignKeys.detail(campaignId) });
      toast.success('Campaign deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to pause a campaign
 */
export function usePauseMetaCampaign(options?: UseMutationOptions<Campaign, Error, string>) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: (campaignId) => campaignService.pauseCampaign(campaignId),
    onSuccess: (data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.setQueryData(campaignKeys.detail(campaignId), data);
      toast.success('Campaign paused');
    },
    onError: (error) => {
      toast.error(`Failed to pause campaign: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to resume a campaign
 */
export function useResumeMetaCampaign(options?: UseMutationOptions<Campaign, Error, string>) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: (campaignId) => campaignService.resumeCampaign(campaignId),
    onSuccess: (data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.setQueryData(campaignKeys.detail(campaignId), data);
      toast.success('Campaign resumed');
    },
    onError: (error) => {
      toast.error(`Failed to resume campaign: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to duplicate a campaign
 */
export function useDuplicateMetaCampaign(
  options?: UseMutationOptions<
    Campaign,
    Error,
    {
      campaignId: string;
      newName: string;
      modifications?: Partial<CampaignCreateParams>;
    }
  >
) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: ({ campaignId, newName, modifications }) =>
      campaignService.duplicateCampaign(campaignId, newName, modifications),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.setQueryData(campaignKeys.detail(data.id), data);
      toast.success('Campaign duplicated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate campaign: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to get campaign budget utilization
 */
export function useMetaCampaignBudget(
  campaignId: string,
  options?: UseQueryOptions<{
    daily_budget: string;
    lifetime_budget: string;
    budget_remaining: string;
    budget_spent_percentage: number;
  }>
) {
  const { campaignService } = useMetaClient();

  return useQuery({
    queryKey: campaignKeys.budget(campaignId),
    queryFn: () => campaignService.getCampaignBudgetUtilization(campaignId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook for batch campaign updates
 */
export function useBatchUpdateMetaCampaigns(
  options?: UseMutationOptions<
    Array<{ campaignId: string; success: boolean; error?: string }>,
    Error,
    Array<{ campaignId: string; params: CampaignUpdateParams }>
  >
) {
  const queryClient = useQueryClient();
  const { campaignService } = useMetaClient();

  return useMutation({
    mutationFn: (updates) => campaignService.batchUpdateCampaigns(updates),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0 && failureCount === 0) {
        toast.success(`All ${successCount} campaigns updated successfully`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.warning(`Updated ${successCount} campaigns, ${failureCount} failed`);
      } else {
        toast.error('Failed to update campaigns');
      }
    },
    onError: (error) => {
      toast.error(`Batch update failed: ${error.message}`);
    },
    ...options,
  });
}
