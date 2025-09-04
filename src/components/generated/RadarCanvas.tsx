import React, { useRef, useEffect, useCallback } from 'react';
import { SWOTDataPoint } from './SWOTRadarDashboard';

interface RadarCanvasProps {
  dataPoints: SWOTDataPoint[];
  onSweepHit: (point: SWOTDataPoint, x: number, y: number) => void;
  onBlobClick?: (point: SWOTDataPoint) => void;
}

// @component: RadarCanvas
export const RadarCanvas = ({ dataPoints, onSweepHit, onBlobClick }: RadarCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const sweepAngleRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const backgroundCacheRef = useRef<HTMLCanvasElement | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const lastHitPointsRef = useRef<Set<string>>(new Set());

  // Constants
  const SWEEP_SPEED = 0.03; // degrees per millisecond (360 degrees in 12 seconds)

  // Create background cache
  const createBackgroundCache = useCallback((width: number, height: number) => {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return null;

    const centerX = width / 2;
    const centerY = height / 2;
    const radarSize = Math.min(width, height);
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
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - halfSize, centerY - halfSize, radarSize, radarSize);

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.24)';
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
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - halfSize);
    ctx.lineTo(centerX, centerY + halfSize);
    ctx.moveTo(centerX - halfSize, centerY);
    ctx.lineTo(centerX + halfSize, centerY);
    ctx.stroke();

    // SWOT labels
    ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
    ctx.font = 'bold 14px monospace';
    ctx.shadowColor = 'rgba(52, 211, 153, 0.5)';
    ctx.shadowBlur = 6;

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

  // Animation loop
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
      sweepAngleRef.current = (sweepAngleRef.current + deltaTime * SWEEP_SPEED) % 360;
    }

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radarSize = Math.min(width, height);
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
      ctx.fillStyle = `rgba(52, 211, 153, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, halfSize, startRadians, endRadians, true);
      ctx.closePath();
      ctx.fill();
    }

    // REALISTIC TAPERED NEEDLE - Draw multiple segments with decreasing thickness
    const segments = 8;
    const maxWidth = 4; // Moderate thickness at center (was 8, too thick)
    const minWidth = 1; // Thin needle at edge
    const maxOpacity = 0.9; // More visible (was 0.8, too dim)
    const minOpacity = 0.5; // Less fade at tip (was 0.3, too translucent)

    // Draw tapered line segments
    for (let i = 0; i < segments; i++) {
      const progress = i / (segments - 1); // 0 to 1
      const segmentLength = halfSize / segments;

      // Calculate positions for this segment
      const startX = centerX + Math.cos(radians) * (segmentLength * i);
      const startY = centerY + Math.sin(radians) * (segmentLength * i);
      const endSegX = centerX + Math.cos(radians) * (segmentLength * (i + 1));
      const endSegY = centerY + Math.sin(radians) * (segmentLength * (i + 1));

      // Interpolate width and opacity (thick->thin, bright->dim)
      const lineWidth = maxWidth - (maxWidth - minWidth) * progress;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Draw segment with subtle glow
      ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = `rgba(52, 211, 153, ${opacity * 0.5})`;
      ctx.shadowBlur = 4; // Subtle glow
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endSegX, endSegY);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Check for sweep hits
    const sweepRadians = (sweepAngle - 90) * (Math.PI / 180);
    const hitPoints = new Set<string>();

    dataPoints.forEach((point) => {
      // Calculate angle from center to point
      const pointAngle = Math.atan2(point.y - centerY, point.x - centerX);
      const pointDegrees = ((pointAngle * 180) / Math.PI + 90 + 360) % 360;

      // Check if sweep is passing over this point (within 5 degree tolerance)
      const angleDiff = Math.abs(sweepAngle - pointDegrees);
      const isHit = angleDiff < 5 || angleDiff > 355;

      if (isHit) {
        hitPoints.add(point.id);
        // If this point wasn't hit in the last frame, trigger the callback
        if (!lastHitPointsRef.current.has(point.id)) {
          onSweepHit(point, point.x, point.y);
        }
      }
    });

    // Update last hit points
    lastHitPointsRef.current = hitPoints;

    // Draw data points
    const currentTimeMs = Date.now();
    dataPoints.forEach((point) => {
      const pulseIntensity = Math.sin(currentTimeMs * 0.003 + point.x * 0.01) * 0.4 + 0.8;
      const blobRadius = 6 + point.intensity * 8 * pulseIntensity;

      const colorMap: Record<string, string> = {
        strength: '#34d399',
        weakness: '#fb7185', // Softer rose-400
        opportunity: '#38bdf8', // sky-400
        threat: '#fbbf24', // amber-400
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
  }, [dataPoints, createBackgroundCache]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !onBlobClick) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if click is on any data point
      dataPoints.forEach((point) => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        const blobRadius = 6 + point.intensity * 8; // Base radius without animation

        if (distance <= blobRadius * 2) {
          // Click within blob area (including glow)
          onBlobClick(point);
        }
      });
    },
    [dataPoints, onBlobClick]
  );

  // Initialize canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    } else {
      canvas.width = 700;
      canvas.height = 500;
    }

    // Create background cache
    backgroundCacheRef.current = createBackgroundCache(canvas.width, canvas.height);

    // Start animation
    isAnimatingRef.current = true;
    lastTimeRef.current = performance.now();
    animate();

    // Add click listener
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      isAnimatingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [animate, createBackgroundCache, handleCanvasClick]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        filter: 'contrast(1.05) brightness(1.05)',
        background: 'transparent',
        cursor: 'crosshair',
      }}
    />
  );
};
