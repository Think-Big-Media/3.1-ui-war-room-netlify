/**
 * War Room AI Service Initializer
 * Coordinates Pinecone integration and dashboard snapshots for AI context
 */

import { pineconeService } from './pineconeService';
import { dashboardSnapshotService } from './dashboardSnapshotService';

class WarRoomAIService {
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    console.log('🤖 War Room AI Service created');
  }

  /**
   * Initialize all AI services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('War Room AI already initialized');
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing War Room AI Services...');

      // Step 1: Check Pinecone configuration
      if (pineconeService.isConfigured()) {
        console.log('✅ Pinecone is configured');
        
        // Initialize Pinecone index
        await pineconeService.initializeIndex();
      } else {
        console.log('⚠️ Pinecone not configured - will use fallback dashboard context');
        console.log('To enable Pinecone: Add VITE_PINECONE_API_KEY to environment variables');
      }

      // Step 2: Start dashboard snapshots
      console.log('📸 Starting dashboard snapshots...');
      dashboardSnapshotService.startSnapshots();

      // Step 3: Take an initial manual snapshot
      await dashboardSnapshotService.captureManualSnapshot();

      this.initialized = true;
      console.log('🎉 War Room AI Services initialized successfully!');

    } catch (error) {
      console.error('❌ Error initializing War Room AI Services:', error);
      // Continue with fallback mode even if initialization fails
      this.initialized = true;
    }
  }

  /**
   * Get current service status
   */
  getStatus() {
    const snapshotStatus = dashboardSnapshotService.getStatus();
    
    return {
      initialized: this.initialized,
      pinecone: {
        configured: pineconeService.isConfigured(),
        ready: pineconeService.isConfigured()
      },
      snapshots: {
        active: snapshotStatus.active,
        interval: snapshotStatus.interval
      },
      mode: pineconeService.isConfigured() ? 'full_ai_context' : 'fallback_mode'
    };
  }

  /**
   * Manual snapshot trigger for testing
   */
  async captureSnapshot(): Promise<void> {
    await dashboardSnapshotService.captureManualSnapshot();
  }

  /**
   * Stop all services (cleanup)
   */
  stop(): void {
    console.log('🛑 Stopping War Room AI Services...');
    dashboardSnapshotService.stopSnapshots();
    this.initialized = false;
  }

  /**
   * Add Pinecone credentials dynamically
   */
  addPineconeCredentials(apiKey: string, environment?: string, indexName?: string): void {
    console.log('🔑 Adding Pinecone credentials...');
    
    // Set environment variables dynamically
    (import.meta.env as any).VITE_PINECONE_API_KEY = apiKey;
    if (environment) (import.meta.env as any).VITE_PINECONE_ENVIRONMENT = environment;
    if (indexName) (import.meta.env as any).VITE_PINECONE_INDEX = indexName;
    
    // Reinitialize if needed
    if (this.initialized) {
      this.initialized = false;
      this.initializationPromise = null;
      this.initialize();
    }
  }

  /**
   * Setup credentials from credentials.md
   */
  setupFromCredentials(): void {
    console.log('📋 Setting up AI services from credentials...');
    
    // Note: In production, these would come from environment variables
    // For now, we'll use fallback mode until credentials are properly configured
    
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasPinecone = !!import.meta.env.VITE_PINECONE_API_KEY;
    
    console.log(`OpenAI configured: ${hasOpenAI}`);
    console.log(`Pinecone configured: ${hasPinecone}`);
    
    if (!hasOpenAI) {
      console.log('⚠️ OpenAI API key not found. Add VITE_OPENAI_API_KEY to environment.');
    }
    
    if (!hasPinecone) {
      console.log('⚠️ Pinecone API key not found. Add VITE_PINECONE_API_KEY to environment.');
      console.log('💡 The system will work in demo mode without Pinecone.');
    }
  }
}

// Export singleton instance
export const warRoomAI = new WarRoomAIService();

// Auto-initialize when imported
warRoomAI.initialize().catch(error => {
  console.error('Failed to auto-initialize War Room AI:', error);
});