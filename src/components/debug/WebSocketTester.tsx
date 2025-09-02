/**
 * WebSocket Connection Tester Component
 * For testing reconnection logic and connection robustness
 */

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Wifi, AlertTriangle } from 'lucide-react';
import { useAdMonitorWebSocket } from '../../hooks/useAdMonitorWebSocket';
import { ConnectionStatus } from '../common/ConnectionStatus';

export const WebSocketTester: React.FC = () => {
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const ws = useAdMonitorWebSocket();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const runConnectionTest = async () => {
    setIsRunningTest(true);
    addLog('Starting connection resilience test...');

    try {
      // Test 1: Basic connection
      addLog('Test 1: Testing basic connection');
      if (!ws.isConnected) {
        ws.connect();
        addLog('Initiating connection...');
      }

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test 2: Send test messages
      addLog('Test 2: Sending test messages');
      for (let i = 1; i <= 3; i++) {
        const success = ws.sendJsonMessage({
          type: 'test_message',
          payload: { test_id: i, timestamp: Date.now() },
        });
        addLog(`Message ${i} sent: ${success ? 'Success' : 'Failed'}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Test 3: Alert subscription
      addLog('Test 3: Testing alert subscription');
      ws.subscribeToAlerts(['meta', 'google']);
      addLog('Subscribed to alerts for Meta and Google');

      // Test 4: Spend update request
      addLog('Test 4: Requesting spend updates');
      ws.requestSpendUpdate();
      addLog('Requested spend update');

      addLog('✅ Connection test completed successfully');
    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const simulateDisconnection = () => {
    addLog('🔌 Simulating network disconnection...');
    ws.disconnect();

    // Reconnect after 3 seconds to test auto-reconnection
    setTimeout(() => {
      addLog('🔄 Attempting reconnection...');
      ws.connect();
    }, 3000);
  };

  const clearLogs = () => {
    setTestLog([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">WebSocket Connection Tester</h3>
          <p className="text-sm text-gray-500">Test connection resilience and reconnection logic</p>
        </div>
        <div className="flex items-center space-x-2">
          <Wifi className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">Debug Mode</span>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <ConnectionStatus
          isConnected={ws.isConnected}
          isConnecting={ws.isConnecting}
          error={ws.error}
          reconnectAttempts={ws.reconnectAttempts}
          maxReconnectAttempts={10}
          onReconnect={ws.connect}
          className="mb-4"
        />
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={runConnectionTest}
          disabled={isRunningTest}
          className="btn-secondary-action flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunningTest ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Test</span>
            </>
          )}
        </button>

        <button
          onClick={simulateDisconnection}
          disabled={isRunningTest}
          className="btn-secondary-alert flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Simulate Disconnect</span>
        </button>

        <button
          onClick={clearLogs}
          className="btn-secondary-neutral flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Connection Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{ws.isConnected ? '✅' : '❌'}</div>
          <div className="text-xs text-gray-500">Connected</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{ws.reconnectAttempts}</div>
          <div className="text-xs text-gray-500">Reconnect Attempts</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{ws.connectionState}</div>
          <div className="text-xs text-gray-500">State</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{ws.lastJsonMessage ? '📨' : '📭'}</div>
          <div className="text-xs text-gray-500">Last Message</div>
        </div>
      </div>

      {/* Test Log */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Test Log</h4>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {testLog.length === 0 ? (
            <div className="text-gray-500">No logs yet. Run a test to see output.</div>
          ) : (
            testLog.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Last Message Display */}
      {ws.lastJsonMessage && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Last WebSocket Message</h4>
          <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(ws.lastJsonMessage, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
};
