import React, { useRef, useEffect, useCallback, memo } from 'react';
import { SWOTDataPoint } from './SWOTRadarDashboard';

interface RadarCanvasProps {
  dataPoints: SWOTDataPoint[];
  onSweepHit: (point: SWOTDataPoint, x: number, y: number) => void;
}

// Global tracking for debugging
if (typeof window !== 'undefined') {
  window.RADAR_INSTANCES = window.RADAR_INSTANCES || new Set();
  window.RADAR_LOOPS = window.RADAR_LOOPS || new Set();
}

// Memoized component to prevent unnecessary re-renders
export const RadarCanvas = memo(({ dataPoints, onSweepHit }: RadarCanvasProps) => {
  // Unique instance tracking
  const instanceId = useRef(`main-radar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const renderCount = useRef(0);
  renderCount.current++;

  console.log(
    `🎨 [MAIN-DASHBOARD RadarCanvas] RENDER #${renderCount.current} - Instance: ${instanceId.current}`
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const sweepAngleRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const backgroundCacheRef = useRef<HTMLCanvasElement | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const animationLoopId = useRef(`loop-${instanceId.current}`);

  // Constants
  const SWEEP_SPEED = 0.03; // degrees per millisecond (360 degrees in 12 seconds)

  // Create offscreen canvas for background caching
  const createBackgroundCache = useCallback((width: number, height: number) => {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return null;

    const centerX = width / 2;
    const centerY = height / 2;
    const radarSize = Math.min(width, height) - 80;
    const halfSize = radarSize / 2;

    // Clear canvas with dark green background
    ctx.fillStyle = '#0d1f0d';
    ctx.fillRect(0, 0, width, height);

    // Create darker green gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, halfSize);
    gradient.addColorStop(0, '#1a3d2e');
    gradient.addColorStop(0.7, '#0f2419');
    gradient.addColorStop(1, '#0d1f0d');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - halfSize, centerY - halfSize, radarSize, radarSize);

    // Draw square border
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - halfSize, centerY - halfSize, radarSize, radarSize);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.24)';
    ctx.lineWidth = 0.8;

    // Grid lines
    for (let i = 1; i < 20; i++) {
      const x = centerX - halfSize + (radarSize / 20) * i;
      const y = centerY - halfSize + (radarSize / 20) * i;

      // Vertical
      ctx.beginPath();
      ctx.moveTo(x, centerY - halfSize);
      ctx.lineTo(x, centerY + halfSize);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(centerX - halfSize, y);
      ctx.lineTo(centerX + halfSize, y);
      ctx.stroke();
    }

    // Center crosshairs
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - halfSize);
    ctx.lineTo(centerX, centerY + halfSize);
    ctx.moveTo(centerX - halfSize, centerY);
    ctx.lineTo(centerX + halfSize, centerY);
    ctx.stroke();

    // SWOT labels
    ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.font = 'bold 16px monospace';
    ctx.shadowColor = 'rgba(34, 197, 94, 0.3)';
    ctx.shadowBlur = 8;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('STRENGTHS', centerX - halfSize + 10, centerY - halfSize + 10);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('WEAKNESSES', centerX + halfSize - 10, centerY - halfSize + 10);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('OPPORTUNITIES', centerX - halfSize + 10, centerY + halfSize - 10);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('THREATS', centerX + halfSize - 10, centerY + halfSize - 10);

    ctx.shadowBlur = 0;

    return offscreenCanvas;
  }, []);

  // Main animation loop - no dependencies to keep it stable
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTime = performance.now();
    const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 0;
    lastTimeRef.current = currentTime;

    // Update sweep angle based on time
    if (deltaTime > 0 && deltaTime < 100) {
      // Ignore large deltas (tab switching)
      sweepAngleRef.current = (sweepAngleRef.current + deltaTime * SWEEP_SPEED) % 360;
    }

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radarSize = Math.min(width, height) - 80;
    const halfSize = radarSize / 2;

    // Draw cached background
    if (backgroundCacheRef.current) {
      ctx.drawImage(backgroundCacheRef.current, 0, 0);
    }

    // Draw sweep line with trail
    const sweepAngle = sweepAngleRef.current;
    const radians = (sweepAngle - 90) * (Math.PI / 180);
    const endX = centerX + Math.cos(radians) * halfSize;
    const endY = centerY + Math.sin(radians) * halfSize;

    // Trail effect
    const trailLength = 45;
    const trailSegments = 15;

    for (let i = 0; i < trailSegments; i++) {
      const segmentAngle = trailLength / trailSegments;
      const startAngle = sweepAngle - i * segmentAngle;
      const endAngle = sweepAngle - (i + 1) * segmentAngle;

      const startRadians = (startAngle - 90) * (Math.PI / 180);
      const endRadians = (endAngle - 90) * (Math.PI / 180);

      const opacity = Math.max(0, (1 - i / trailSegments) * 0.4);
      ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, halfSize, startRadians, endRadians, true);
      ctx.closePath();
      ctx.fill();
    }

    // Main sweep line - BRIGHT AND VISIBLE
    ctx.strokeStyle = 'rgba(34, 197, 94, 1.0)'; // Full opacity
    ctx.lineWidth = 4; // Much thicker line
    ctx.shadowColor = 'rgba(34, 197, 94, 1.0)';
    ctx.shadowBlur = 20; // More glow
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Additional bright white core line on top
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Bright white core
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Draw data points
    const currentTimeMs = Date.now();
    dataPoints.forEach((point) => {
      const pulseIntensity = Math.sin(currentTimeMs * 0.003 + point.x * 0.01) * 0.4 + 0.8;
      const blobRadius = 6 + point.intensity * 8 * pulseIntensity;

      const colorMap: Record<string, string> = {
        strength: '#22c55e',
        weakness: '#ef4444',
        opportunity: '#3b82f6',
        threat: '#f59e0b',
      };
      const color = colorMap[point.type];

      // Glow effect
      const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        blobRadius * 2
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, `${color}60`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, blobRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Solid center
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(point.x, point.y, blobRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, blobRadius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (isAnimatingRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [dataPoints]);

  // Initialize canvas and start animation
  useEffect(() => {
    console.log(`🟢 [MAIN-DASHBOARD RadarCanvas] MOUNT - Instance: ${instanceId.current}`);
    window.RADAR_INSTANCES.add(instanceId.current);
    console.log(`📊 TOTAL RADAR INSTANCES: ${window.RADAR_INSTANCES.size}`);
    console.log(`🖼️ CANVAS ELEMENTS ON PAGE: ${document.querySelectorAll('canvas').length}`);

    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn(`⚠️ [MAIN-DASHBOARD] Canvas ref is null`);
      return;
    }

    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;

    // Create background cache
    backgroundCacheRef.current = createBackgroundCache(canvas.width, canvas.height);

    // Start animation
    isAnimatingRef.current = true;
    lastTimeRef.current = performance.now();
    window.RADAR_LOOPS.add(animationLoopId.current);
    console.log(`🚀 [MAIN-DASHBOARD] Starting animation loop: ${animationLoopId.current}`);
    console.log(`📊 ACTIVE ANIMATION LOOPS: ${window.RADAR_LOOPS.size}`);
    animate();

    return () => {
      console.log(`🔴 [MAIN-DASHBOARD RadarCanvas] UNMOUNT - Instance: ${instanceId.current}`);
      isAnimatingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.RADAR_INSTANCES.delete(instanceId.current);
      window.RADAR_LOOPS.delete(animationLoopId.current);
      console.log(`📊 REMAINING INSTANCES: ${window.RADAR_INSTANCES.size}`);
      console.log(`📊 REMAINING LOOPS: ${window.RADAR_LOOPS.size}`);
    };
  }, [animate, createBackgroundCache]);

  // Update background cache when data points change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvas.width && canvas.height) {
      backgroundCacheRef.current = createBackgroundCache(canvas.width, canvas.height);
    }
  }, [dataPoints.length, createBackgroundCache]);

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-xl p-6 shadow-inner">
      <canvas
        ref={canvasRef}
        className="border border-slate-700/50 rounded-xl shadow-2xl"
        style={{
          filter: 'contrast(1.05) brightness(1.05)',
          background: 'radial-gradient(circle, #0f1419 0%, #000000 100%)',
        }}
      />
    </div>
  );
});

RadarCanvas.displayName = 'RadarCanvas';
