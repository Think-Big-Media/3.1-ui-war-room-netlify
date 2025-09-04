import React from 'react';

export default function TestDashboard() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
      }}
    >
      <h1>V2 Dashboard Test</h1>
      <p>If you see this, the route is working!</p>
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #22c55e' }}>
        SWOT Radar will load here...
      </div>
    </div>
  );
}
