'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Report {
  id: string;
  ticket_id: string;
  reporter_alias: string;
  content_type: string;
  content_id: string;
  category: string;
  status: string;
  created_at: string;
  content_snippet?: string;
}

export default function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (e) {
      console.error('Fetch reports error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      console.error('Action error', e);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>LOADING REPORTS...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem' }}>
      <h2 style={{ color: 'var(--color-accent-primary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>MODERATION DASHBOARD</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reports.length === 0 && <div style={{ color: 'var(--color-text-muted)' }}>No reports found.</div>}
        
        {reports.map(report => (
          <div key={report.id} style={{ 
            background: 'var(--color-bg-surface)', 
            border: '1px solid var(--color-border)', 
            padding: '1.5rem', 
            borderRadius: '4px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                  Ticket: {report.ticket_id} <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    background: report.status === 'pending' ? 'var(--color-warning)' : (report.status === 'dismissed' ? 'var(--color-text-muted)' : 'var(--color-success)'),
                    color: '#000',
                    marginLeft: '0.5rem',
                    fontWeight: 'bold'
                  }}>{report.status.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Reported by <span className="mono">{report.reporter_alias || 'Unknown'}</span> for <b>{report.category}</b>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Type: {report.content_type} | Date: {new Date(report.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ 
              background: '#000', 
              padding: '1rem', 
              borderLeft: '2px solid var(--color-accent-secondary)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.95rem',
              marginBottom: '1rem'
            }}>
              "{report.content_snippet || 'Content deleted or unavailable'}"
            </div>

            {report.status === 'pending' && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleAction(report.id, 'dismiss')}
                  style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', cursor: 'pointer' }}
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => handleAction(report.id, 'delete_content')}
                  style={{ background: 'var(--color-warning)', color: '#000', border: 'none', padding: '0.5rem 1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Delete Content
                </button>
                <button 
                  onClick={() => handleAction(report.id, 'ban_user')}
                  style={{ background: 'var(--color-accent-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Delete & Suspend User
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
