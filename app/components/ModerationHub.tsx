'use client';

import React, { useState, useEffect } from 'react';

interface Report {
  id: string;
  reporter_alias: string;
  content_type: string;
  content_id: string;
  category: string;
  evidence: string;
  reason: string;
  created_at: string;
}

export default function ModerationHub() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (e) {
      console.error('Fetch reports error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <div className="mono p-4">AUTHENTICATING MODERATOR ACCESS...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 className="mono" style={{ color: 'var(--color-accent-primary)', marginBottom: '2rem' }}>[ MODERATION_INTELLIGENCE_QUEUE ]</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reports.map(report => (
          <div key={report.id} style={{ 
            background: 'var(--color-bg-surface)', 
            border: '1px solid var(--color-border)',
            padding: '1.5rem',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="mono" style={{ color: 'var(--color-accent-secondary)', fontSize: '0.8rem' }}>
                ID: {report.id.substring(0, 8)}... | TYPE: {report.content_type.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{new Date(report.created_at).toLocaleString()}</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>REPORTED_REASON:</p>
              <p style={{ color: 'var(--color-warning)' }}>{report.reason || 'No reason provided.'}</p>
            </div>

            {report.evidence && (
              <div style={{ marginBottom: '1rem', background: 'var(--color-bg)', padding: '1rem', border: '1px dashed var(--color-border)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>DECRYPTED_EVIDENCE (OPTION_B):</p>
                <p className="mono" style={{ color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{report.evidence}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}>PURGE_CONTENT</button>
              <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }} onClick={fetchReports}>DISMISS</button>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <p className="mono">NO_OUTSTANDING_VIOLATIONS_DETECTED</p>
          </div>
        )}
      </div>
    </div>
  );
}
