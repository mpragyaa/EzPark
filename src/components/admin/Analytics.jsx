import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// Mock datasets for operators
const REVENUE_DATA = [
  { name: 'Jan', revenue: 4200 },
  { name: 'Feb', revenue: 5100 },
  { name: 'Mar', revenue: 7800 },
  { name: 'Apr', revenue: 9400 },
  { name: 'May', revenue: 11200 },
  { name: 'Jun', revenue: 14800 },
  { name: 'Jul', revenue: 16400 },
];

const OCCUPANCY_DATA = [
  { name: 'Aether Plaza', rate: 82 },
  { name: 'Vortex Garage', rate: 94 },
  { name: 'Lumina Hub', rate: 100 },
  { name: 'Nexus Vault', rate: 76 },
  { name: 'Stellar Deck', rate: 44 },
  { name: 'Meridian Lots', rate: 68 },
];

const WEEKLY_BOOKINGS = [
  { name: 'Mon', bookings: 32 },
  { name: 'Tue', bookings: 45 },
  { name: 'Wed', bookings: 54 },
  { name: 'Thu', bookings: 48 },
  { name: 'Fri', bookings: 76 },
  { name: 'Sat', bookings: 92 },
  { name: 'Sun', bookings: 58 },
];

const PEAK_HOURS = [
  { hour: '08:00', occupancy: 65 },
  { hour: '10:00', occupancy: 85 },
  { hour: '12:00', occupancy: 92 },
  { hour: '14:00', occupancy: 78 },
  { hour: '16:00', occupancy: 80 },
  { hour: '18:00', occupancy: 95 },
  { hour: '20:00', occupancy: 70 },
  { hour: '22:00', occupancy: 45 },
];

export default function Analytics() {
  // Common Dark Grid and Tooltip styling variables
  const tooltipStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem'
  };

  return (
    <div className="analytics-grid">
      
      {/* 1. Monthly Revenue Area Chart */}
      <div className="chart-card">
        <h4 className="panel-title" style={{ fontSize: '1.05rem', textAlign: 'left' }}>Monthly Revenue ($)</h4>
        <div className="chart-wrapper-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Facility Occupancy Bar Chart */}
      <div className="chart-card">
        <h4 className="panel-title" style={{ fontSize: '1.05rem', textAlign: 'left' }}>Facility Occupancy (%)</h4>
        <div className="chart-wrapper-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={OCCUPANCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
              <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar 
                dataKey="rate" 
                fill="var(--color-accent)" 
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Weekly Bookings Area Chart */}
      <div className="chart-card">
        <h4 className="panel-title" style={{ fontSize: '1.05rem', textAlign: 'left' }}>Weekly Reservations Count</h4>
        <div className="chart-wrapper-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={WEEKLY_BOOKINGS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area 
                type="monotone" 
                dataKey="bookings" 
                stroke="var(--color-success)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBook)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Peak Hours Bar Chart */}
      <div className="chart-card">
        <h4 className="panel-title" style={{ fontSize: '1.05rem', textAlign: 'left' }}>Peak Occupancy Hours (%)</h4>
        <div className="chart-wrapper-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PEAK_HOURS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar 
                dataKey="occupancy" 
                fill="var(--color-primary)" 
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
