/**
 * Pinecone Integration Test Component
 * Proves that Pinecone is working with live API calls (never mock unless forced)
 */

import React, { useState } from 'react';
import { 
  useSearchVectorsQuery, 
  useGetVectorStatsQuery,
  useStoreDocumentMutation 
} from '../../services/pineconeApi';
import { getCredentialStatus } from '../../config/mockMode';

export const PineconeTest: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('campaign performance analysis');
  const [testResult, setTestResult] = useState<string>('');

  // Test vector search
  const { data: searchResults, error: searchError, isLoading: searchLoading } = 
    useSearchVectorsQuery({ 
      query: searchQuery, 
      topK: 3 
    });

  // Test vector stats
  const { data: stats, error: statsError, isLoading: statsLoading } = 
    useGetVectorStatsQuery();

  // Test document storage mutation
  const [storeDocument, { isLoading: storeLoading }] = useStoreDocumentMutation();

  // Get credential status for debugging
  const credStatus = getCredentialStatus();

  const testDocumentStorage = async () => {
    try {
      const result = await storeDocument({
        id: `test_${Date.now()}`,
        content: 'This is a test document for Pinecone integration verification',
        metadata: {
          title: 'Pinecone Integration Test',
          type: 'test_document',
          timestamp: new Date().toISOString(),
          source: 'frontend_test'
        }
      }).unwrap();

      setTestResult(`✅ Document stored successfully: ${result}`);
    } catch (error) {
      setTestResult(`❌ Storage failed: ${JSON.stringify(error)}`);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-green-400">🔍 Pinecone Integration Test</h2>
      
      {/* Credential Status */}
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">🔐 Credential Status</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Pinecone: {credStatus.pinecone ? '✅ CONFIGURED' : '❌ MISSING'}</div>
          <div>OpenAI: {credStatus.openai ? '✅ CONFIGURED' : '❌ MISSING'}</div>
          <div>Force Mock: {credStatus.forceMockMode ? '🔧 ENABLED' : '🚀 DISABLED'}</div>
        </div>
      </div>

      {/* Vector Stats Test */}
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">📊 Database Stats</h3>
        {statsLoading ? (
          <p>Loading stats...</p>
        ) : statsError ? (
          <p className="text-red-400">Error: {JSON.stringify(statsError)}</p>
        ) : stats ? (
          <div className="text-sm">
            <p>Total Records: <span className="text-green-400">{stats.totalRecords.toLocaleString()}</span></p>
            <p>Vector Dimension: <span className="text-green-400">{stats.dimension}</span></p>
          </div>
        ) : null}
      </div>

      {/* Vector Search Test */}
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">🔍 Vector Search Test</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter search query..."
          className="w-full p-2 bg-gray-700 text-white rounded mb-2"
        />
        
        {searchLoading ? (
          <p>Searching vectors...</p>
        ) : searchError ? (
          <p className="text-red-400">Search Error: {JSON.stringify(searchError)}</p>
        ) : searchResults ? (
          <div className="space-y-2">
            <p className="text-green-400">Found {searchResults.length} results:</p>
            {searchResults.map((result, idx) => (
              <div key={result.id} className="bg-gray-700 p-2 rounded text-sm">
                <p><strong>#{idx + 1}</strong> (Score: {result.score.toFixed(3)})</p>
                <p><strong>ID:</strong> {result.id}</p>
                {result.metadata && (
                  <>
                    <p><strong>Title:</strong> {result.metadata.title}</p>
                    <p><strong>Type:</strong> {result.metadata.type}</p>
                    <p><strong>Summary:</strong> {result.metadata.summary}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Document Storage Test */}
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">💾 Document Storage Test</h3>
        <button
          onClick={testDocumentStorage}
          disabled={storeLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {storeLoading ? 'Storing...' : 'Test Document Storage'}
        </button>
        {testResult && (
          <p className="mt-2 text-sm">{testResult}</p>
        )}
      </div>

      {/* API Configuration Display */}
      <div className="bg-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">⚙️ Configuration</h3>
        <div className="text-sm space-y-1">
          <p>Index: <span className="text-yellow-400">{import.meta.env.VITE_PINECONE_INDEX_NAME}</span></p>
          <p>Environment: <span className="text-yellow-400">{import.meta.env.VITE_PINECONE_ENVIRONMENT}</span></p>
          <p>API Key: <span className="text-yellow-400">
            {import.meta.env.VITE_PINECONE_API_KEY ? 
              `${import.meta.env.VITE_PINECONE_API_KEY.substring(0, 10)}...` : 
              'NOT SET'}
          </span></p>
        </div>
      </div>
    </div>
  );
};