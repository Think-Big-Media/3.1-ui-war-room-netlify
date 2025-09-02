/**
 * @fileoverview Comprehensive test suite for Meta API endpoints
 * Tests all endpoint methods with various scenarios and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MetaEndpoints } from '../endpoints';
import { type MetaApiClient } from '../client';
import { AdAccount, Campaign, AdInsight } from '../types';

// Mock the client
jest.mock('../client');

describe('MetaEndpoints', () => {
  let endpoints: MetaEndpoints;
  let mockClient: jest.Mocked<MetaApiClient>;

  beforeEach(() => {
    mockClient = {
      request: jest.fn(),
      batchRequest: jest.fn(),
    } as any;

    endpoints = new MetaEndpoints(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Ad Accounts', () => {
    describe('getAdAccounts', () => {
      it('should fetch ad accounts successfully', async () => {
        const mockAccounts = {
          data: [
            {
              id: 'act_123',
              name: 'Test Account',
              account_status: 1,
              currency: 'USD',
              timezone_name: 'America/New_York',
            },
            {
              id: 'act_456',
              name: 'Test Account 2',
              account_status: 1,
              currency: 'EUR',
              timezone_name: 'Europe/London',
            },
          ],
          paging: {
            cursors: {
              before: 'before_cursor',
              after: 'after_cursor',
            },
          },
        };

        mockClient.request.mockResolvedValue(mockAccounts);

        const result = await endpoints.getAdAccounts();

        expect(mockClient.request).toHaveBeenCalledWith('/me/adaccounts', {
          params: {
            fields:
              'id,name,account_status,currency,timezone_name,amount_spent,balance,account_id,business',
            limit: 25,
          },
        });
        expect(result).toEqual(mockAccounts);
      });

      it('should handle custom fields and limit', async () => {
        const customFields = ['id', 'name', 'currency'];
        const customLimit = 50;

        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getAdAccounts({ fields: customFields, limit: customLimit });

        expect(mockClient.request).toHaveBeenCalledWith('/me/adaccounts', {
          params: {
            fields: customFields.join(','),
            limit: customLimit,
          },
        });
      });

      it('should handle pagination', async () => {
        const after = 'cursor_123';
        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getAdAccounts({ after });

        expect(mockClient.request).toHaveBeenCalledWith('/me/adaccounts', {
          params: expect.objectContaining({
            after,
          }),
        });
      });

      it('should handle API errors', async () => {
        const error = new Error('Insufficient permissions');
        mockClient.request.mockRejectedValue(error);

        await expect(endpoints.getAdAccounts()).rejects.toThrow('Insufficient permissions');
      });
    });

    describe('getAdAccount', () => {
      it('should fetch single ad account', async () => {
        const accountId = 'act_123';
        const mockAccount = {
          id: accountId,
          name: 'Test Account',
          account_status: 1,
        };

        mockClient.request.mockResolvedValue(mockAccount);

        const result = await endpoints.getAdAccount(accountId);

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}`, {
          params: {
            fields:
              'id,name,account_status,currency,timezone_name,amount_spent,balance,account_id,business',
          },
        });
        expect(result).toEqual(mockAccount);
      });

      it('should validate account ID format', async () => {
        await expect(endpoints.getAdAccount('invalid_id')).rejects.toThrow();
      });
    });
  });

  describe('Campaigns', () => {
    const accountId = 'act_123';

    describe('getCampaigns', () => {
      it('should fetch campaigns for account', async () => {
        const mockCampaigns = {
          data: [
            {
              id: '123',
              name: 'Test Campaign',
              status: 'ACTIVE',
              objective: 'CONVERSIONS',
              created_time: '2024-01-01T00:00:00+0000',
            },
          ],
        };

        mockClient.request.mockResolvedValue(mockCampaigns);

        const result = await endpoints.getCampaigns(accountId);

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/campaigns`, {
          params: {
            fields:
              'id,name,status,objective,created_time,updated_time,start_time,stop_time,budget_remaining,daily_budget,lifetime_budget',
            limit: 25,
          },
        });
        expect(result).toEqual(mockCampaigns);
      });

      it('should handle campaign filtering by status', async () => {
        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getCampaigns(accountId, {
          status: ['ACTIVE', 'PAUSED'],
        });

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/campaigns`, {
          params: expect.objectContaining({
            filtering: JSON.stringify([
              { field: 'campaign.delivery_info', operator: 'IN', value: ['ACTIVE', 'PAUSED'] },
            ]),
          }),
        });
      });

      it('should handle date range filtering', async () => {
        const since = new Date('2024-01-01');
        const until = new Date('2024-01-31');

        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getCampaigns(accountId, { since, until });

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/campaigns`, {
          params: expect.objectContaining({
            time_range: JSON.stringify({
              since: since.toISOString().split('T')[0],
              until: until.toISOString().split('T')[0],
            }),
          }),
        });
      });
    });

    describe('createCampaign', () => {
      it('should create campaign successfully', async () => {
        const campaignData = {
          name: 'New Campaign',
          objective: 'CONVERSIONS' as const,
          status: 'PAUSED' as const,
          special_ad_categories: [] as string[],
        };

        const mockResponse = { id: '456', success: true };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await endpoints.createCampaign(accountId, campaignData);

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/campaigns`, {
          method: 'POST',
          data: campaignData,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle budget constraints', async () => {
        const campaignData = {
          name: 'Budget Campaign',
          objective: 'TRAFFIC' as const,
          status: 'ACTIVE' as const,
          daily_budget: 1000, // $10.00 in cents
          special_ad_categories: [] as string[],
        };

        mockClient.request.mockResolvedValue({ id: '789' });

        await endpoints.createCampaign(accountId, campaignData);

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/campaigns`, {
          method: 'POST',
          data: expect.objectContaining({
            daily_budget: 1000,
          }),
        });
      });

      it('should validate required fields', async () => {
        const incompleteCampaign = {
          name: 'Incomplete Campaign',
          // Missing objective, status, special_ad_categories
        } as any;

        await expect(endpoints.createCampaign(accountId, incompleteCampaign)).rejects.toThrow();
      });
    });

    describe('updateCampaign', () => {
      it('should update campaign successfully', async () => {
        const campaignId = '123';
        const updates = {
          name: 'Updated Campaign Name',
          status: 'PAUSED' as const,
        };

        const mockResponse = { success: true };
        mockClient.request.mockResolvedValue(mockResponse);

        const result = await endpoints.updateCampaign(campaignId, updates);

        expect(mockClient.request).toHaveBeenCalledWith(`/${campaignId}`, {
          method: 'POST',
          data: updates,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle budget updates', async () => {
        const campaignId = '123';
        const updates = {
          daily_budget: 2000, // $20.00
          lifetime_budget: 50000, // $500.00
        };

        mockClient.request.mockResolvedValue({ success: true });

        await endpoints.updateCampaign(campaignId, updates);

        expect(mockClient.request).toHaveBeenCalledWith(`/${campaignId}`, {
          method: 'POST',
          data: updates,
        });
      });
    });

    describe('deleteCampaign', () => {
      it('should delete campaign successfully', async () => {
        const campaignId = '123';
        const mockResponse = { success: true };

        mockClient.request.mockResolvedValue(mockResponse);

        const result = await endpoints.deleteCampaign(campaignId);

        expect(mockClient.request).toHaveBeenCalledWith(`/${campaignId}`, {
          method: 'DELETE',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle deletion errors', async () => {
        const campaignId = '123';
        const error = new Error('Campaign has active ads');

        mockClient.request.mockRejectedValue(error);

        await expect(endpoints.deleteCampaign(campaignId)).rejects.toThrow(
          'Campaign has active ads'
        );
      });
    });
  });

  describe('Insights', () => {
    const accountId = 'act_123';

    describe('getAccountInsights', () => {
      it('should fetch account insights successfully', async () => {
        const mockInsights = {
          data: [
            {
              account_id: accountId,
              impressions: '10000',
              clicks: '500',
              spend: '100.50',
              cpm: '10.05',
              ctr: '5.0',
              date_start: '2024-01-01',
              date_stop: '2024-01-31',
            },
          ],
        };

        mockClient.request.mockResolvedValue(mockInsights);

        const result = await endpoints.getAccountInsights(accountId);

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/insights`, {
          params: {
            fields:
              'account_id,impressions,clicks,spend,reach,frequency,cpm,ctr,cpc,cpp,actions,conversions,conversion_values',
            time_range: JSON.stringify({ since: expect.any(String), until: expect.any(String) }),
            level: 'account',
          },
        });
        expect(result).toEqual(mockInsights);
      });

      it('should handle custom date ranges', async () => {
        const since = new Date('2024-01-01');
        const until = new Date('2024-01-31');

        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getAccountInsights(accountId, { since, until });

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/insights`, {
          params: expect.objectContaining({
            time_range: JSON.stringify({
              since: '2024-01-01',
              until: '2024-01-31',
            }),
          }),
        });
      });

      it('should handle custom breakdowns', async () => {
        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getAccountInsights(accountId, {
          breakdowns: ['age', 'gender'],
        });

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/insights`, {
          params: expect.objectContaining({
            breakdowns: 'age,gender',
          }),
        });
      });

      it('should handle action breakdowns', async () => {
        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getAccountInsights(accountId, {
          actionBreakdowns: ['action_type', 'action_target_id'],
        });

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/insights`, {
          params: expect.objectContaining({
            action_breakdowns: 'action_type,action_target_id',
          }),
        });
      });

      it('should handle time increment', async () => {
        mockClient.request.mockResolvedValue({ data: [] });

        await endpoints.getAccountInsights(accountId, {
          timeIncrement: 'monthly',
        });

        expect(mockClient.request).toHaveBeenCalledWith(`/${accountId}/insights`, {
          params: expect.objectContaining({
            time_increment: 'monthly',
          }),
        });
      });
    });

    describe('getCampaignInsights', () => {
      it('should fetch campaign insights', async () => {
        const campaignId = '123';
        const mockInsights = {
          data: [
            {
              campaign_id: campaignId,
              impressions: '5000',
              clicks: '250',
              spend: '50.25',
            },
          ],
        };

        mockClient.request.mockResolvedValue(mockInsights);

        const result = await endpoints.getCampaignInsights(campaignId);

        expect(mockClient.request).toHaveBeenCalledWith(`/${campaignId}/insights`, {
          params: expect.objectContaining({
            level: 'campaign',
          }),
        });
        expect(result).toEqual(mockInsights);
      });
    });

    describe('Batch Insights', () => {
      it('should fetch insights for multiple campaigns', async () => {
        const campaignIds = ['123', '456', '789'];
        const mockBatchResponse = [
          { code: 200, body: JSON.stringify({ data: [{ campaign_id: '123' }] }) },
          { code: 200, body: JSON.stringify({ data: [{ campaign_id: '456' }] }) },
          { code: 200, body: JSON.stringify({ data: [{ campaign_id: '789' }] }) },
        ];

        mockClient.batchRequest.mockResolvedValue(mockBatchResponse);

        const result = await endpoints.getBatchCampaignInsights(campaignIds);

        expect(mockClient.batchRequest).toHaveBeenCalledWith(
          campaignIds.map((id) => ({
            method: 'GET',
            relative_url: `${id}/insights?fields=campaign_id,impressions,clicks,spend,reach,frequency,cpm,ctr,cpc,cpp,actions,conversions,conversion_values&time_range=${encodeURIComponent(JSON.stringify({ since: expect.any(String), until: expect.any(String) }))}&level=campaign`,
          }))
        );
        expect(result).toEqual(mockBatchResponse);
      });

      it('should handle batch request failures', async () => {
        const campaignIds = ['123', '456'];
        const mockBatchResponse = [
          { code: 200, body: JSON.stringify({ data: [] }) },
          { code: 400, body: JSON.stringify({ error: { message: 'Invalid campaign' } }) },
        ];

        mockClient.batchRequest.mockResolvedValue(mockBatchResponse);

        const result = await endpoints.getBatchCampaignInsights(campaignIds);
        expect(result[1].code).toBe(400);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting errors', async () => {
      const error = new Error('Rate limit exceeded');
      error.name = 'RateLimitError';
      mockClient.request.mockRejectedValue(error);

      await expect(endpoints.getAdAccounts()).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Invalid access token');
      error.name = 'AuthenticationError';
      mockClient.request.mockRejectedValue(error);

      await expect(endpoints.getAdAccounts()).rejects.toThrow('Invalid access token');
    });

    it('should handle API quota errors', async () => {
      const error = new Error('API quota exceeded');
      mockClient.request.mockRejectedValue(error);

      await expect(endpoints.getAdAccounts()).rejects.toThrow('API quota exceeded');
    });
  });

  describe('Input Validation', () => {
    it('should validate account ID formats', async () => {
      await expect(endpoints.getAdAccount('invalid-format')).rejects.toThrow();
      await expect(endpoints.getCampaigns('not-an-account-id')).rejects.toThrow();
    });

    it('should validate campaign objectives', async () => {
      const invalidCampaign = {
        name: 'Test',
        objective: 'INVALID_OBJECTIVE' as any,
        status: 'ACTIVE' as const,
        special_ad_categories: [],
      };

      await expect(endpoints.createCampaign('act_123', invalidCampaign)).rejects.toThrow();
    });

    it('should validate date ranges', async () => {
      const invalidSince = new Date('invalid-date');
      const until = new Date();

      await expect(
        endpoints.getAccountInsights('act_123', { since: invalidSince, until })
      ).rejects.toThrow();
    });

    it('should validate budget values', async () => {
      const campaignWithNegativeBudget = {
        name: 'Test',
        objective: 'TRAFFIC' as const,
        status: 'ACTIVE' as const,
        daily_budget: -100,
        special_ad_categories: [],
      };

      await expect(
        endpoints.createCampaign('act_123', campaignWithNegativeBudget)
      ).rejects.toThrow();
    });
  });

  describe('Pagination Handling', () => {
    it('should handle pagination cursors correctly', async () => {
      const mockResponse = {
        data: [],
        paging: {
          cursors: {
            before: 'before_cursor',
            after: 'after_cursor',
          },
          next: 'https://graph.facebook.com/v19.0/...',
        },
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await endpoints.getAdAccounts({ after: 'some_cursor' });
      expect(result.paging).toBeDefined();
      expect(result.paging?.cursors).toBeDefined();
    });

    it('should handle empty pagination', async () => {
      const mockResponse = { data: [] };
      mockClient.request.mockResolvedValue(mockResponse);

      const result = await endpoints.getAdAccounts();
      expect(result.data).toEqual([]);
    });
  });
});
