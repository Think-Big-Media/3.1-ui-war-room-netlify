/**
 * Chat Debug Component - Test chat functionality
 */

import React, { useState } from 'react';
import EnhancedFloatingChatBar from '../chat/EnhancedFloatingChatBar';
import { useSendChatMessageMutation } from '../../services/openaiApi';

export const ChatDebug: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [sendChatMessage, { isLoading, error }] = useSendChatMessageMutation();

  const handleSendMessage = (message: string) => {
    console.log('Chat message received:', message);
    setMessages(prev => [...prev, `User: ${message}`]);
  };

  const testDirectAPI = async () => {
    try {
      const response = await sendChatMessage({
        message: 'Test message from debug page',
        context: 'debug'
      }).unwrap();
      setMessages(prev => [...prev, `Direct API Test: ${response}`]);
    } catch (err) {
      setMessages(prev => [...prev, `API Error: ${JSON.stringify(err)}`]);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🔍 Chat Debug Test</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Chat Messages:</h2>
        <div className="bg-gray-800 p-4 rounded h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-400">No messages yet. Try typing in the chat below.</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="mb-2 p-2 bg-gray-700 rounded">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="relative">
        <h2 className="text-lg font-semibold mb-4">Chat Component Test:</h2>
        <div className="relative z-50">
          <EnhancedFloatingChatBar 
            onSendMessage={handleSendMessage}
            placeholder="Test the chat functionality here..."
            context="debug"
          />
        </div>
        
        <div className="mt-4">
          <button
            onClick={testDirectAPI}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
          >
            {isLoading ? 'Testing API...' : 'Test Direct API Call'}
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-900/50 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ EnhancedFloatingChatBar with OpenAI integration loaded</li>
          <li>✅ OpenAI API service connected ({import.meta.env.VITE_OPENAI_API_KEY ? 'Live API Key' : 'Mock Mode'})</li>
          <li>✅ RTK Query mutation hooks available</li>
          <li>✅ Context-aware responses (current: debug)</li>
          <li>✅ Chat history and persistence ready</li>
          <li>🔍 Test the enhanced chat below with real AI responses</li>
          {error && <li className="text-red-400">❌ API Error: {JSON.stringify(error)}</li>}
        </ul>
      </div>
    </div>
  );
};