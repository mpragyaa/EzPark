import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Cpu, Radio, Activity, RefreshCw } from 'lucide-react';

export default function HealthStatus() {
  const [responseTime, setResponseTime] = useState(42);
  const [activeSocketListeners, setActiveSocketListeners] = useState(19);

  // Animate values slightly to simulate live tracking updates
  useEffect(() => {
    const timer = setInterval(() => {
      setResponseTime(prev => Math.min(65, Math.max(28, prev + Math.floor(Math.random() * 9) - 4)));
      setActiveSocketListeners(prev => Math.min(25, Math.max(12, prev + Math.floor(Math.random() * 3) - 1)));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const healthMetrics = [
    {
      title: 'Backend Node.js Server',
      status: 'Healthy',
      desc: 'Uptime: 14 days, 5 hrs',
      icon: Cpu,
      color: 'var(--color-success)',
      metric: '99.98% Up'
    },
    {
      title: 'PostgreSQL Database',
      status: 'Active',
      desc: 'Query execution latency: 8.4ms',
      icon: ShieldCheck,
      color: 'var(--color-success)',
      metric: 'Connected'
    },
    {
      title: 'Realtime WebSockets',
      status: 'Connected',
      desc: `Listeners: ${activeSocketListeners} sockets`,
      icon: Radio,
      color: 'var(--color-success)',
      metric: 'Active Sync'
    },
    {
      title: 'Supabase Auth',
      status: 'Secure',
      desc: 'JWT validation tokens: Active',
      icon: Activity,
      color: 'var(--color-success)',
      metric: 'OAuth Synced'
    },
    {
      title: 'File Storage Bucket',
      status: 'Normal',
      desc: 'Used 14.2 GB of 100 GB limit',
      icon: HardDrive,
      color: 'var(--color-primary)',
      metric: '14.2% Capacity'
    },
    {
      title: 'Average Response Time',
      status: 'Fast',
      desc: 'Global API latency threshold',
      icon: RefreshCw,
      color: 'var(--color-success)',
      metric: `${responseTime} ms`
    }
  ];

  return (
    <div className="dashboard-section-panel">
      <div className="panel-header">
        <h3 className="panel-title">System Health & Services Monitoring</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
          All Services Operational
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {healthMetrics.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                textAlign: 'left'
              }}
            >
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}>
                <Icon size={20} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexGrow: 1 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.metric}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: item.color,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px'
                  }}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
