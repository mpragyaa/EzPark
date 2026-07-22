import React, { useState, useEffect } from 'react';
import { ShieldAlert, Info, Download, Eye, X } from 'lucide-react';
import { activityService } from '../../services/activityService';
import { exportToCSV } from '../../utils/csvExport';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await activityService.fetchLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportLogs = () => {
    exportToCSV(logs, 'admin_activity_audit_logs');
  };

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      const matchSearch = log.admin.toLowerCase().includes(search.toLowerCase()) || 
        log.action.toLowerCase().includes(search.toLowerCase()) || 
        log.affectedResource.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  };

  return (
    <div className="admin-table-container">
      
      {/* Table controls */}
      <div className="table-panel-header" style={{ padding: '1.25rem' }}>
        <h3 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <ShieldAlert size={18} />
          Operator Activity Audit Trail
        </h3>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="topbar-search-input"
            style={{ width: '220px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            type="button" 
            className="btn-add-entity"
            onClick={handleExportLogs}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table grid */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin Operator</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Client IP</th>
              <th>Status</th>
              <th>Audit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Syncing secure audit databases...</td>
              </tr>
            ) : getFilteredLogs().length > 0 ? (
              getFilteredLogs().map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700 }}>{log.admin}</td>
                  <td style={{ color: 'var(--color-primary)' }}>{log.action}</td>
                  <td>{log.affectedResource}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{log.ip}</td>
                  <td>
                    <span className="admin-badge open">
                      {log.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-table-action"
                      title="Inspect State Change"
                      onClick={() => setSelectedAudit(log)}
                      disabled={!log.oldValue && !log.newValue}
                      style={{ opacity: !log.oldValue && !log.newValue ? 0.35 : 1 }}
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit trails matches search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* State Change Inspector Modal popup */}
      {selectedAudit && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Info size={18} /> Audit Inspector
              </h3>
              <div style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedAudit(null)}>
                <X size={20} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginTop: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{new Date(selectedAudit.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action By</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedAudit.admin} ({selectedAudit.ip})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modified resource</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedAudit.affectedResource}</div>
              </div>

              {/* State Diffs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-error)', textTransform: 'uppercase', fontWeight: 700 }}>Before</span>
                  <pre style={{
                    margin: '0.35rem 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--mono)'
                  }}>{selectedAudit.oldValue || '[N/A / Created]'}</pre>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-success)', textTransform: 'uppercase', fontWeight: 700 }}>After</span>
                  <pre style={{
                    margin: '0.35rem 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--mono)'
                  }}>{selectedAudit.newValue || '[N/A / Deleted]'}</pre>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-auth-submit" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => setSelectedAudit(null)}
            >
              Close inspector
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
