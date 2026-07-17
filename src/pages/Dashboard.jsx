import React from 'react';

export default function Dashboard() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{
        fontSize: '3.5rem',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem',
        letterSpacing: '-0.03em'
      }}>
        EZPARK Dashboard
      </h1>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '1.25rem',
        maxWidth: '600px',
        fontWeight: '300'
      }}>
        Real-time parking insights, status, and AI recommendations. Dashboard page successfully initialized.
      </p>
    </main>
  );
}
