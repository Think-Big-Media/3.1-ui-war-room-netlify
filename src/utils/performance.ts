/**
 * Performance monitoring utilities for War Room
 */
import { useEffect } from 'react';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a component render
   */
  startTiming(componentName: string): void {
    this.metrics.set(`${componentName}_start`, performance.now());
  }

  /**
   * End timing and log if over threshold
   */
  endTiming(componentName: string, threshold: number = 16): void {
    const startTime = this.metrics.get(`${componentName}_start`);
    if (startTime) {
      const duration = performance.now() - startTime;

      if (duration > threshold) {
        console.warn(
          `🐌 Performance Warning: ${componentName} took ${duration.toFixed(2)}ms to render (threshold: ${threshold}ms)`
        );
      }

      this.metrics.delete(`${componentName}_start`);
    }
  }

  /**
   * Monitor hover interactions for performance issues
   */
  monitorHoverPerformance(elementSelector: string): void {
    const elements = document.querySelectorAll(elementSelector);

    elements.forEach((element) => {
      let hoverStartTime = 0;

      element.addEventListener('mouseenter', () => {
        hoverStartTime = performance.now();
      });

      element.addEventListener('mouseleave', () => {
        if (hoverStartTime) {
          const duration = performance.now() - hoverStartTime;
          if (duration > 8) {
            console.warn(
              `🐌 Hover Performance: ${elementSelector} took ${duration.toFixed(2)}ms to process hover`
            );
          }
        }
      });
    });
  }

  /**
   * Check for expensive layout operations
   */
  checkLayoutShift(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
            console.warn(`📐 Layout Shift detected: ${(entry as any).value}`);
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Monitor paint performance
   */
  monitorPaintPerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): object {
    return {
      memory: (performance as any).memory
        ? {
            used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
            total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
            limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576),
          }
        : 'Not available',
      navigation: performance.getEntriesByType('navigation')[0],
      timing: performance.timing,
    };
  }
}

/**
 * React hook for component performance monitoring
 */
export function usePerformanceMonitor(componentName: string, enabled: boolean = true) {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    if (enabled) {
      monitor.startTiming(componentName);

      return () => {
        monitor.endTiming(componentName);
      };
    }
  }, [componentName, enabled]);
}

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  const monitor = PerformanceMonitor.getInstance();

  // Start monitoring
  monitor.checkLayoutShift();
  monitor.monitorPaintPerformance();

  // Monitor common interactive elements
  setTimeout(() => {
    monitor.monitorHoverPerformance('.card');
    monitor.monitorHoverPerformance('button');
    monitor.monitorHoverPerformance('.hover-lift');
  }, 1000);

  // Log metrics every 30 seconds in development
  setInterval(() => {
    console.group('🚀 Performance Metrics');
    console.log(monitor.getMetrics());
    console.groupEnd();
  }, 30000);
}
