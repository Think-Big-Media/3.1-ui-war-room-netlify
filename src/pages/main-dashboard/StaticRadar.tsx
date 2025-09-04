export default function StaticRadar() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#22c55e',
        fontFamily: 'monospace',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>SWOT Intelligence Radar</h1>

      <div
        style={{
          width: '600px',
          height: '600px',
          margin: '0 auto',
          backgroundColor: '#0d1f0d',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '2px',
            backgroundColor: '#22c55e',
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '2px',
            height: '100%',
            backgroundColor: '#22c55e',
            opacity: 0.3,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          STRENGTHS
        </div>

        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          WEAKNESSES
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          OPPORTUNITIES
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          THREATS
        </div>

        <div
          style={{
            width: '200px',
            height: '200px',
            border: '2px solid rgba(34, 197, 94, 0.5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '24px' }}>RADAR</span>
        </div>
      </div>

      <p style={{ marginTop: '20px', fontSize: '18px' }}>
        Real-time strategic analysis powered by advanced data intelligence
      </p>
    </div>
  );
}
