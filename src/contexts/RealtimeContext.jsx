import React, { createContext, useContext, useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [connectionState, setConnectionState] = useState('connected'); // connected, connecting, disconnected
  const [retryCount, setRetryCount] = useState(0);

  const handleStatusChange = (status, err) => {
    console.log(`Supabase Realtime socket status: ${status}`);
    if (status === 'SUBSCRIBED') {
      setConnectionState('connected');
      setRetryCount(0);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setConnectionState('disconnected');
      // Trigger automatic retry sequence
      setRetryCount(prev => prev + 1);
    } else {
      setConnectionState('connecting');
    }
  };

  // Reconnection loops
  useEffect(() => {
    if (connectionState === 'disconnected' && retryCount < 5) {
      const timer = setTimeout(() => {
        console.log(`Retrying realtime connection (Attempt ${retryCount})...`);
        setConnectionState('connecting');
        // Setting state triggers subscriber updates which automatically reinstates active channels
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, retryCount]);

  return (
    <RealtimeContext.Provider value={{ connectionState, setConnectionState, handleStatusChange }}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Sleek floating real-time health indicator component
export function RealtimeIndicator() {
  const { connectionState } = useContext(RealtimeContext) || { connectionState: 'connected' };

  let color = 'var(--color-success)';
  let label = 'Live Sync Active';
  let Icon = Wifi;

  if (connectionState === 'connecting') {
    color = '#f97316'; // orange
    label = 'Connecting sockets...';
  } else if (connectionState === 'disconnected') {
    color = 'var(--color-error)';
    label = 'Connection Offline';
    Icon = WifiOff;
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      padding: '0.35rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: 'var(--text-secondary)'
    }}>
      <Icon size={12} style={{ color }} />
      <span>{label}</span>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: color
      }} />
    </div>
  );
}

export function useRealtimeStatus() {
  return useContext(RealtimeContext);
}
