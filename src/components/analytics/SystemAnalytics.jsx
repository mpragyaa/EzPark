import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Download, TrendingUp, Calendar, Clock, BarChart3, Star } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { exportToCSV } from '../../utils/csvExport';

const PIE_COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-success)'];

export default function SystemAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getDashboardAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportCSV = (dataset, prefix) => {
    if (!data) return;
    exportToCSV(data[dataset], prefix);
  };

  if (loading || !data) {
    return <div style={{ color: 'var(--text-muted)' }}>Synching analytical ledger graphs...</div>;
  }

  const tooltipStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Export Controls Toolbar */}
      <div className="table-panel-header">
        <h3 className="panel-title" style={{ margin: 0 }}>System Analytics Report</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn-add-entity" 
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => handleExportCSV('revenueTrends', 'revenue_trends')}
          >
            <Download size={12} />
            <span>Export Revenue</span>
          </button>
          <button 
            type="button" 
            className="btn-add-entity" 
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => handleExportCSV('occupancyTrends', 'occupancy_trends')}
          >
            <Download size={12} />
            <span>Export Occupancy</span>
          </button>
        </div>
      </div>

      {/* Grid containing comparative Recharts */}
      <div className="analytics-grid">
        
        {/* 1. Revenue & Bookings Trends */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="panel-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} /> Weekly Revenue Trends
            </h4>
          </div>
          <div className="chart-wrapper-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Peak Hours Occupancy */}
        <div className="chart-card">
          <h4 className="panel-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} /> Hourly Peak Occupancy (%)
          </h4>
          <div className="chart-wrapper-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar 
                  dataKey="occupancy" 
                  fill="var(--color-accent)" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Popular Parking Lots Share */}
        <div className="chart-card">
          <h4 className="panel-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Star size={16} /> Popular Parking Lots share
          </h4>
          <div className="chart-wrapper-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.popularLots}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.popularLots.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Weekly Average Occupancy */}
        <div className="chart-card">
          <h4 className="panel-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart3 size={16} /> Weekly Occupancy Trends (%)
          </h4>
          <div className="chart-wrapper-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.occupancyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar 
                  dataKey="averageOccupancy" 
                  fill="var(--color-primary)" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
