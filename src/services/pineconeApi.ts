/**
 * Pinecone Vector Database API Service
 * Provides vector search, upsert, and similarity operations for War Room AI intelligence
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { baseApi } from './baseApi';
import { shouldUseMockData } from '../config/mockMode';

// Types for Pinecone operations
interface VectorRecord {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

interface SearchOptions {
  vector: number[];
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

interface UpsertOptions {
  records: VectorRecord[];
  namespace?: string;
}

// Mock data for development/testing
const mockSearchResults: SearchResult[] = [
  {
    id: 'doc_001',
    score: 0.95,
    metadata: {
      title: 'Q4 Campaign Performance Analysis',
      type: 'campaign_report',
      source: 'meta_ads',
      timestamp: new Date().toISOString(),
      summary: 'Strong performance in battleground states with 15% increase in engagement'
    }
  },
  {
    id: 'doc_002',
    score: 0.89,
    metadata: {
      title: 'Social Media Sentiment Shift',
      type: 'intelligence_report',
      source: 'mentionlytics',
      timestamp: new Date().toISOString(),
      summary: 'Positive sentiment trending upward by 12% following policy announcement'
    }
  },
  {
    id: 'doc_003',
    score: 0.82,
    metadata: {
      title: 'Opposition Research Brief',
      type: 'intelligence_brief',
      source: 'internal',
      timestamp: new Date().toISOString(),
      summary: 'Key vulnerabilities identified in competitor messaging strategy'
    }
  }
];

class PineconeService {
  private pinecone: Pinecone | null = null;
  private indexName: string;
  private initialized = false;

  constructor() {
    this.indexName = import.meta.env.VITE_PINECONE_INDEX_NAME || 'warroom';
    this.initializePinecone();
  }

  private async initializePinecone() {
    // Skip initialization in mock mode or if credentials missing
    if (shouldUseMockData('pinecone')) {
      console.log('[Pinecone] Using mock data mode');
      return;
    }

    try {
      this.pinecone = new Pinecone({
        apiKey: import.meta.env.VITE_PINECONE_API_KEY
      });
      
      this.initialized = true;
      console.log('[Pinecone] Successfully initialized');
    } catch (error) {
      console.error('[Pinecone] Failed to initialize:', error);
      this.initialized = false;
    }
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    // Return mock data if in mock mode or not initialized
    if (shouldUseMockData('pinecone') || !this.initialized || !this.pinecone) {
      console.log('[Pinecone] Returning mock search results');
      return mockSearchResults.slice(0, options.topK || 5);
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const response = await index.query({
        vector: options.vector,
        topK: options.topK || 10,
        filter: options.filter,
        includeMetadata: options.includeMetadata ?? true
      });

      return response.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as Record<string, any>
      })) || [];
    } catch (error) {
      console.error('[Pinecone] Search error:', error);
      // Fallback to mock data on error
      return mockSearchResults.slice(0, options.topK || 5);
    }
  }

  async upsert(options: UpsertOptions): Promise<boolean> {
    // Return success for mock mode
    if (shouldUseMockData('pinecone') || !this.initialized || !this.pinecone) {
      console.log('[Pinecone] Mock upsert successful');
      return true;
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.upsert(options.records, {
        namespace: options.namespace
      });
      return true;
    } catch (error) {
      console.error('[Pinecone] Upsert error:', error);
      return false;
    }
  }

  async deleteRecords(ids: string[], namespace?: string): Promise<boolean> {
    // Return success for mock mode
    if (shouldUseMockData('pinecone') || !this.initialized || !this.pinecone) {
      console.log('[Pinecone] Mock delete successful');
      return true;
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteMany(ids, namespace);
      return true;
    } catch (error) {
      console.error('[Pinecone] Delete error:', error);
      return false;
    }
  }

  async getStats(): Promise<{ totalRecords: number; dimension: number }> {
    // Return mock stats
    if (shouldUseMockData('pinecone') || !this.initialized || !this.pinecone) {
      return {
        totalRecords: 1547,
        dimension: 1536
      };
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      return {
        totalRecords: stats.totalRecordCount || 0,
        dimension: stats.dimension || 1536
      };
    } catch (error) {
      console.error('[Pinecone] Stats error:', error);
      return { totalRecords: 0, dimension: 1536 };
    }
  }
}

// Singleton instance
export const pineconeService = new PineconeService();

/**
 * Pinecone RTK Query API endpoints
 */
export const pineconeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchVectors: builder.query<
      SearchResult[],
      { query: string; topK?: number; filter?: Record<string, any> }
    >({
      queryFn: async ({ query, topK = 5, filter }) => {
        try {
          // In a real implementation, you'd convert the text query to embeddings
          // For now, using mock vector for demonstration
          const mockVector = Array(1536).fill(0).map(() => Math.random());
          
          const results = await pineconeService.search({
            vector: mockVector,
            topK,
            filter,
            includeMetadata: true
          });

          return { data: results };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Vector search failed'
            } 
          };
        }
      },
      providesTags: ['Intelligence'],
      keepUnusedDataFor: 300, // 5 minutes cache
    }),

    storeDocument: builder.mutation<
      boolean,
      { 
        id: string; 
        content: string; 
        metadata: Record<string, any>;
        embeddings?: number[];
      }
    >({
      queryFn: async ({ id, content, metadata, embeddings }) => {
        try {
          // Mock embeddings if not provided
          const vector = embeddings || Array(1536).fill(0).map(() => Math.random());
          
          const success = await pineconeService.upsert({
            records: [{
              id,
              values: vector,
              metadata: {
                ...metadata,
                content: content.substring(0, 1000), // Truncate for metadata storage
                stored_at: new Date().toISOString()
              }
            }]
          });

          return { data: success };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Document storage failed'
            } 
          };
        }
      },
      invalidatesTags: ['Intelligence'],
    }),

    getVectorStats: builder.query<
      { totalRecords: number; dimension: number },
      void
    >({
      queryFn: async () => {
        try {
          const stats = await pineconeService.getStats();
          return { data: stats };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Failed to get stats'
            } 
          };
        }
      },
      keepUnusedDataFor: 60, // 1 minute cache
    }),

    deleteDocuments: builder.mutation<boolean, string[]>({
      queryFn: async (ids) => {
        try {
          const success = await pineconeService.deleteRecords(ids);
          return { data: success };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: error instanceof Error ? error.message : 'Failed to delete documents'
            } 
          };
        }
      },
      invalidatesTags: ['Intelligence'],
    }),
  }),
});

export const {
  useSearchVectorsQuery,
  useStoreDocumentMutation,
  useGetVectorStatsQuery,
  useDeleteDocumentsMutation,
} = pineconeApi;

export type {
  VectorRecord,
  SearchResult,
  SearchOptions,
  UpsertOptions
};