/**
 * React Query hooks for Meta Ad Management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  MetaAdService,
  type AdCreateParams,
  type AdUpdateParams,
  type AdListParams,
  type AdInsightsParams,
} from '@/api/meta/ads';
import { type Ad, type Creative, type MetaAPIResponse } from '@/api/meta/types';
import { useMetaClient } from './useMetaClient';
import { toast } from 'sonner';

// Query Keys
export const adKeys = {
  all: ['meta', 'ads'] as const,
  lists: () => [...adKeys.all, 'list'] as const,
  list: (parentId: string, parentType: 'account' | 'adset', params?: AdListParams) =>
    [...adKeys.lists(), parentType, parentId, params] as const,
  details: () => [...adKeys.all, 'detail'] as const,
  detail: (adId: string) => [...adKeys.details(), adId] as const,
  creative: (creativeId: string) => ['meta', 'creatives', creativeId] as const,
  insights: (adId: string, params?: AdInsightsParams) =>
    [...adKeys.detail(adId), 'insights', params] as const,
  preview: (adId: string, format?: string) => [...adKeys.detail(adId), 'preview', format] as const,
  performance: (adId: string, datePreset?: string) =>
    [...adKeys.detail(adId), 'performance', datePreset] as const,
};

/**
 * Hook to fetch ads list
 */
export function useMetaAds(
  parentId: string,
  parentType: 'account' | 'adset',
  params?: AdListParams,
  options?: UseQueryOptions<MetaAPIResponse<Ad[]>>
) {
  const { adService } = useMetaClient();

  return useQuery({
    queryKey: adKeys.list(parentId, parentType, params),
    queryFn: () => adService.listAds(parentId, parentType, params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single ad
 */
export function useMetaAd(adId: string, options?: UseQueryOptions<Ad>) {
  const { adService } = useMetaClient();

  return useQuery({
    queryKey: adKeys.detail(adId),
    queryFn: () => adService.getAd(adId),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook to fetch an ad creative
 */
export function useMetaAdCreative(creativeId: string, options?: UseQueryOptions<Creative>) {
  const { adService } = useMetaClient();

  return useQuery({
    queryKey: adKeys.creative(creativeId),
    queryFn: () => adService.getAdCreative(creativeId),
    staleTime: 1000 * 60 * 10, // 10 minutes - creatives change less often
    ...options,
  });
}

/**
 * Hook to create an ad
 */
export function useCreateMetaAd(
  options?: UseMutationOptions<Ad, Error, { accountId: string; params: AdCreateParams }>
) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, params }) => adService.createAd(accountId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.setQueryData(adKeys.detail(data.id), data);
      toast.success('Ad created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create ad: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to update an ad
 */
export function useUpdateMetaAd(
  options?: UseMutationOptions<Ad, Error, { adId: string; params: AdUpdateParams }>
) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: ({ adId, params }) => adService.updateAd(adId, params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.setQueryData(adKeys.detail(variables.adId), data);
      toast.success('Ad updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update ad: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to delete an ad
 */
export function useDeleteMetaAd(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: (adId) => adService.deleteAd(adId),
    onSuccess: (_, adId) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.removeQueries({ queryKey: adKeys.detail(adId) });
      toast.success('Ad deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete ad: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to pause an ad
 */
export function usePauseMetaAd(options?: UseMutationOptions<Ad, Error, string>) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: (adId) => adService.pauseAd(adId),
    onSuccess: (data, adId) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.setQueryData(adKeys.detail(adId), data);
      toast.success('Ad paused');
    },
    onError: (error) => {
      toast.error(`Failed to pause ad: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to resume an ad
 */
export function useResumeMetaAd(options?: UseMutationOptions<Ad, Error, string>) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: (adId) => adService.resumeAd(adId),
    onSuccess: (data, adId) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.setQueryData(adKeys.detail(adId), data);
      toast.success('Ad resumed');
    },
    onError: (error) => {
      toast.error(`Failed to resume ad: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to get ad insights
 */
export function useMetaAdInsights(
  adId: string,
  params?: AdInsightsParams,
  options?: UseQueryOptions<MetaAPIResponse<any[]>>
) {
  const { adService } = useMetaClient();

  return useQuery({
    queryKey: adKeys.insights(adId, params),
    queryFn: () => adService.getAdInsights(adId, params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook to get ad preview
 */
export function useMetaAdPreview(
  adId: string,
  format?: 'DESKTOP_FEED_STANDARD' | 'MOBILE_FEED_STANDARD' | 'INSTAGRAM_STANDARD',
  options?: UseQueryOptions<{ body: string }>
) {
  const { adService } = useMetaClient();

  return useQuery({
    queryKey: adKeys.preview(adId, format),
    queryFn: () => adService.getAdPreview(adId, format),
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

/**
 * Hook to get ad performance summary
 */
export function useMetaAdPerformance(
  adId: string,
  datePreset = 'last_7d',
  options?: UseQueryOptions<{
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
  }>
) {
  const { adService } = useMetaClient();

  return useQuery({
    queryKey: adKeys.performance(adId, datePreset),
    queryFn: () => adService.getAdPerformanceSummary(adId, datePreset),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to duplicate an ad
 */
export function useDuplicateMetaAd(
  options?: UseMutationOptions<
    Ad,
    Error,
    {
      adId: string;
      newName: string;
      targetAdSetId?: string;
      modifications?: Partial<AdCreateParams>;
    }
  >
) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: ({ adId, newName, targetAdSetId, modifications }) =>
      adService.duplicateAd(adId, newName, targetAdSetId, modifications),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.setQueryData(adKeys.detail(data.id), data);
      toast.success('Ad duplicated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate ad: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook for batch ad creation
 */
export function useBatchCreateMetaAds(
  options?: UseMutationOptions<
    Array<{ id?: string; success: boolean; error?: string }>,
    Error,
    { accountId: string; ads: AdCreateParams[] }
  >
) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, ads }) => adService.batchCreateAds(accountId, ads),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0 && failureCount === 0) {
        toast.success(`All ${successCount} ads created successfully`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.warning(`Created ${successCount} ads, ${failureCount} failed`);
      } else {
        toast.error('Failed to create ads');
      }
    },
    onError: (error) => {
      toast.error(`Batch creation failed: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Hook to create an ad creative
 */
export function useCreateMetaAdCreative(
  options?: UseMutationOptions<
    Creative,
    Error,
    {
      accountId: string;
      params: any; // AdCreativeParams from ads.ts
    }
  >
) {
  const queryClient = useQueryClient();
  const { adService } = useMetaClient();

  return useMutation({
    mutationFn: ({ accountId, params }) => adService.createAdCreative(accountId, params),
    onSuccess: (data) => {
      queryClient.setQueryData(adKeys.creative(data.id), data);
      toast.success('Ad creative created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create ad creative: ${error.message}`);
    },
    ...options,
  });
}
