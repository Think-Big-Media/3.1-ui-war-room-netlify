import React from 'react';

export default function MinimalTest() {
  // No hooks, no state, no effects - just pure HTML
  return React.createElement(
    'div',
    {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#ff0000',
        color: '#ffffff',
        fontSize: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999999,
      },
    },
    'MINIMAL TEST WORKS!'
  );
}
