/**
 * Dashboard Snapshot Service
 * Captures periodic dashboard state for AI context
 */

export class DashboardSnapshotService {
  private intervalId: NodeJS.Timeout | null = null;
  private active: boolean = false;
  private readonly interval: number = 30000; // 30 seconds

  startSnapshots(): void {
    if (this.active) return;
    
    console.log('📸 Starting dashboard snapshots every 30 seconds');
    this.active = true;
    
    this.intervalId = setInterval(() => {
      this.captureSnapshot();
    }, this.interval);
  }

  stopSnapshots(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.active = false;
    console.log('📸 Dashboard snapshots stopped');
  }

  async captureManualSnapshot(): Promise<void> {
    console.log('📸 Capturing manual dashboard snapshot');
    return this.captureSnapshot();
  }

  private async captureSnapshot(): Promise<void> {
    try {
      // In a real implementation, this would capture dashboard state
      console.log('📸 Dashboard snapshot captured');
    } catch (error) {
      console.error('Error capturing dashboard snapshot:', error);
    }
  }

  getStatus() {
    return {
      active: this.active,
      interval: this.interval
    };
  }
}

// Export singleton instance
export const dashboardSnapshotService = new DashboardSnapshotService();