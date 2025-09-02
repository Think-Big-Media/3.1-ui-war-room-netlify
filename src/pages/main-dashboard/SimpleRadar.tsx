import React, { useRef, useEffect } from 'react';

export default function SimpleRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;

    // Draw simple radar background
    ctx.fillStyle = '#0d1f0d';
    ctx.fillRect(0, 0, 600, 600);

    // Draw green grid
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 1;

    // Draw grid lines
    for (let i = 0; i <= 20; i++) {
      const pos = (600 / 20) * i;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 600);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(600, pos);
      ctx.stroke();
    }

    // Draw center crosshairs
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 600);
    ctx.moveTo(0, 300);
    ctx.lineTo(600, 300);
    ctx.stroke();

    // Draw SWOT labels
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.font = 'bold 16px monospace';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('STRENGTHS', 50, 50);

    ctx.textAlign = 'right';
    ctx.fillText('WEAKNESSES', 550, 50);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('OPPORTUNITIES', 50, 550);

    ctx.textAlign = 'right';
    ctx.fillText('THREATS', 550, 550);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <h1
        style={{
          color: '#22c55e',
          marginBottom: '30px',
          fontFamily: 'monospace',
          fontSize: '32px',
        }}
      >
        SWOT Intelligence Radar
      </h1>
      <div
        style={{
          border: '2px solid #22c55e',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#000',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            border: '1px solid #22c55e',
          }}
        />
      </div>
    </div>
  );
}
