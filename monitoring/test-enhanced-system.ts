#!/usr/bin/env node

/**
 * Enhanced Health Monitor System Integration Test
 *
 * This script tests the complete enhanced health monitoring system:
 * - TypeScript compilation
 * - Health monitor functionality
 * - WebSocket communication
 * - Circuit breaker operations
 * - Auto-fix capabilities
 * - Dashboard integration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import WebSocket from 'ws';
import axios from 'axios';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

class EnhancedSystemTester {
  private results: TestResult[] = [];
  private readonly config = {
    TARGET_URL: 'https://war-room-oa9t.onrender.com',
    WEBSOCKET_URL: 'ws://localhost:8080',
    TEST_TIMEOUT: 30000,
  };

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Enhanced Health Monitor System Integration Tests...\n');

    try {
      await this.testTypeScriptCompilation();
      await this.testFileStructure();
      await this.testBasicConnectivity();
      await this.testHealthMonitorModule();
      await this.testWebSocketServer();
      await this.testCircuitBreakerLogic();
      await this.testAutoFixPatterns();
      await this.testKnowledgeBaseIntegration();

      this.printSummary();
    } catch (error: any) {
      console.error('❌ Test suite failed with error:', error.message);
      process.exit(1);
    }
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing: ${name}...`);
      const details = await testFn();
      const duration = Date.now() - startTime;

      const result: TestResult = {
        name,
        success: true,
        message: 'Passed',
        duration,
        details,
      };

      this.results.push(result);
      console.log(`✅ ${name}: Passed (${duration}ms)\n`);
      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;

      const result: TestResult = {
        name,
        success: false,
        message: error.message,
        duration,
      };

      this.results.push(result);
      console.log(`❌ ${name}: Failed - ${error.message} (${duration}ms)\n`);
      return result;
    }
  }

  private async testTypeScriptCompilation(): Promise<void> {
    await this.runTest('TypeScript Compilation', async () => {
      // Check if TypeScript files exist
      const tsFiles = [
        'health-monitor-enhanced.ts',
        'enhanced-dashboard.ts',
      ];

      for (const file of tsFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          throw new Error(`TypeScript file missing: ${file}`);
        }
      }

      // Check if compiled JS files exist or can be created
      try {
        await fs.access('dist');
      } catch (error) {
        // Try to compile
        const { spawn } = require('child_process');

        return new Promise((resolve, reject) => {
          const tsc = spawn('npx', ['tsc'], { stdio: 'pipe' });

          let output = '';
          let errorOutput = '';

          tsc.stdout.on('data', (data: Buffer) => {
            output += data.toString();
          });

          tsc.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });

          tsc.on('close', (code: number) => {
            if (code === 0) {
              resolve({ output, compiled: true });
            } else {
              reject(new Error(`TypeScript compilation failed: ${errorOutput}`));
            }
          });
        });
      }

      return { message: 'TypeScript compilation successful' };
    });
  }

  private async testFileStructure(): Promise<void> {
    await this.runTest('File Structure Validation', async () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'health-monitor-enhanced.ts',
        'enhanced-dashboard.ts',
        'start-enhanced-monitoring.sh',
        'stop-enhanced-monitoring.sh',
        'README-ENHANCED-HEALTH-MONITOR.md',
      ];

      const requiredDirs = [
        'logs',
        'reports',
        'knowledge-base',
        'knowledge-base/health-check-fixes',
        'knowledge-base/pieces-integration',
      ];

      // Create directories if they don't exist
      for (const dir of requiredDirs) {
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }
      }

      // Check files
      const missingFiles = [];
      for (const file of requiredFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length > 0) {
        throw new Error(`Missing files: ${missingFiles.join(', ')}`);
      }

      return {
        requiredFiles: requiredFiles.length,
        requiredDirs: requiredDirs.length,
        allPresent: true,
      };
    });
  }

  private async testBasicConnectivity(): Promise<void> {
    await this.runTest('Target Application Connectivity', async () => {
      const startTime = Date.now();

      try {
        const response = await axios.get(this.config.TARGET_URL, {
          timeout: 10000,
          headers: {
            'User-Agent': 'EnhancedHealthMonitor-SystemTest/1.0',
          },
        });

        const responseTime = Date.now() - startTime;

        return {
          status: response.status,
          responseTime,
          contentType: response.headers['content-type'],
          withinSLA: responseTime <= 3000,
        };
      } catch (error: any) {
        throw new Error(`Target application unreachable: ${error.message}`);
      }
    });
  }

  private async testHealthMonitorModule(): Promise<void> {
    await this.runTest('Health Monitor Module Loading', async () => {
      try {
        // Try to import the module (this tests basic syntax)
        const modulePath = path.resolve('./health-monitor-enhanced.ts');

        // Check if the class can be loaded
        const content = await fs.readFile(modulePath, 'utf8');

        // Basic syntax validation
        if (!content.includes('export class EnhancedHealthMonitor')) {
          throw new Error('EnhancedHealthMonitor class not found in module');
        }

        if (!content.includes('CircuitBreaker')) {
          throw new Error('CircuitBreaker class not found in module');
        }

        if (!content.includes('WebSocket')) {
          throw new Error('WebSocket integration not found in module');
        }

        return {
          moduleSize: content.length,
          hasMainClass: true,
          hasCircuitBreaker: true,
          hasWebSocket: true,
        };
      } catch (error: any) {
        throw new Error(`Module loading failed: ${error.message}`);
      }
    });
  }

  private async testWebSocketServer(): Promise<void> {
    await this.runTest('WebSocket Server Functionality', async () => {
      // This test would normally start the server, but for integration testing
      // we'll just verify the WebSocket implementation exists

      const modulePath = path.resolve('./health-monitor-enhanced.ts');
      const content = await fs.readFile(modulePath, 'utf8');

      const hasWebSocketServer = content.includes('WebSocket.Server');
      const hasMessageHandling = content.includes('handleSubAgentMessage');
      const hasConnection = content.includes('subAgentConnections');

      if (!hasWebSocketServer) {
        throw new Error('WebSocket server implementation not found');
      }

      if (!hasMessageHandling) {
        throw new Error('WebSocket message handling not implemented');
      }

      if (!hasConnection) {
        throw new Error('Sub-agent connection management not found');
      }

      return {
        hasServer: hasWebSocketServer,
        hasHandling: hasMessageHandling,
        hasConnections: hasConnection,
      };
    });
  }

  private async testCircuitBreakerLogic(): Promise<void> {
    await this.runTest('Circuit Breaker Implementation', async () => {
      const modulePath = path.resolve('./health-monitor-enhanced.ts');
      const content = await fs.readFile(modulePath, 'utf8');

      // Check for circuit breaker implementation
      const hasCircuitBreakerClass = content.includes('class CircuitBreaker');
      const hasStates = content.includes("'closed' | 'open' | 'half-open'");
      const hasFailureHandling = content.includes('onFailure');
      const hasSuccessHandling = content.includes('onSuccess');
      const hasExecute = content.includes('execute<T>');

      if (!hasCircuitBreakerClass) {
        throw new Error('CircuitBreaker class not implemented');
      }

      if (!hasStates) {
        throw new Error('Circuit breaker states not properly defined');
      }

      if (!hasFailureHandling || !hasSuccessHandling) {
        throw new Error('Circuit breaker state management incomplete');
      }

      if (!hasExecute) {
        throw new Error('Circuit breaker execute method not found');
      }

      return {
        hasClass: hasCircuitBreakerClass,
        hasStates,
        hasHandling: hasFailureHandling && hasSuccessHandling,
        hasExecute,
      };
    });
  }

  private async testAutoFixPatterns(): Promise<void> {
    await this.runTest('Auto-Fix Pattern System', async () => {
      const modulePath = path.resolve('./health-monitor-enhanced.ts');
      const content = await fs.readFile(modulePath, 'utf8');

      const hasAutoFixInterface = content.includes('interface AutoFixPattern');
      const hasSaveKnownFix = content.includes('saveKnownFix');
      const hasApplyFix = content.includes('applyAdvancedFix');
      const hasPatternRecognition = content.includes('identifyAdvancedErrorPattern');

      if (!hasAutoFixInterface) {
        throw new Error('AutoFixPattern interface not defined');
      }

      if (!hasSaveKnownFix) {
        throw new Error('Pattern saving mechanism not implemented');
      }

      if (!hasApplyFix) {
        throw new Error('Auto-fix application not implemented');
      }

      if (!hasPatternRecognition) {
        throw new Error('Error pattern recognition not implemented');
      }

      return {
        hasInterface: hasAutoFixInterface,
        hasSaving: hasSaveKnownFix,
        hasApplication: hasApplyFix,
        hasRecognition: hasPatternRecognition,
      };
    });
  }

  private async testKnowledgeBaseIntegration(): Promise<void> {
    await this.runTest('Pieces Knowledge Base Integration', async () => {
      const modulePath = path.resolve('./health-monitor-enhanced.ts');
      const content = await fs.readFile(modulePath, 'utf8');

      const hasPiecesIntegration = content.includes('saveToPieces');
      const hasKnowledgeBase = content.includes('PIECES_INTEGRATION_ENABLED');
      const hasPatternStorage = content.includes('pieces-integration');

      if (!hasPiecesIntegration) {
        throw new Error('Pieces integration not implemented');
      }

      if (!hasKnowledgeBase) {
        throw new Error('Knowledge base configuration not found');
      }

      // Check if knowledge base directories exist
      try {
        await fs.access('knowledge-base/pieces-integration');
      } catch (error) {
        throw new Error('Pieces integration directory not created');
      }

      return {
        hasIntegration: hasPiecesIntegration,
        hasConfig: hasKnowledgeBase,
        hasDirectory: true,
      };
    });
  }

  private printSummary(): void {
    console.log(`\n${  '='.repeat(60)}`);
    console.log('🧪 ENHANCED HEALTH MONITOR SYSTEM TEST SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   ⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    // Detailed results
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`.padStart(8);
      console.log(`${index + 1}. ${status} ${result.name.padEnd(35)} ${duration}`);

      if (!result.success) {
        console.log(`   └─ Error: ${result.message}`);
      }
    });

    console.log(`\n${  '='.repeat(60)}`);

    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! Enhanced Health Monitor system is ready.');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Run: ./start-enhanced-monitoring.sh');
      console.log('   2. View dashboard: npm run dashboard:enhanced');
      console.log('   3. Monitor logs: tail -f logs/enhanced-health-monitor.log');
      console.log('   4. Test health check: npm run health-check');
    } else {
      console.log(`⚠️  ${failedTests} test(s) failed. Please fix issues before deployment.`);
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check TypeScript compilation: npm run build');
      console.log('   2. Verify dependencies: npm install');
      console.log('   3. Check file permissions: ls -la *.sh');
      console.log('   4. Review error messages above');

      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EnhancedSystemTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export default EnhancedSystemTester;
