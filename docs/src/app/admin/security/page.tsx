'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SecurityLog {
  id: number;
  user_id: string | null;
  event_type: string;
  details: string;
  ip_hash: string;
  created_at: string;
}

export default function SecurityDashboard() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/security/logs?limit=100');
      if (!res.ok) throw new Error('Failed to fetch security logs');
      const data = await res.json();
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (type: string) => {
    if (type.includes('FAIL') || type.includes('BLOCKED') || type.includes('RATE_LIMIT')) return 'var(--color-warning)';
    if (type.includes('SUCCESS') || type.includes('LOGIN')) return '#00ff00';
    return 'var(--color-accent-primary)';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="loading-screen">
        INITIALIZING SECURITY AUDIT INTERFACE...
      </div>
    );
  }

  return (
    <div className="security-dashboard-container">
      <header className="dashboard-header">
        <div className="header-meta">
          <span className="mono pulse-text">SYSTEM STATUS: MONITORING</span>
          <h1 className="mono">SECURITY_AUDIT_LOGS</h1>
        </div>
        <button className="btn-secondary mono" onClick={() => router.back()}>[ EXIT_SECURE_VIEW ]</button>
      </header>

      <main className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label mono">TOTAL_EVENTS_RECORDED</span>
            <span className="stat-value mono">{logs.length}+</span>
          </div>
          <div className="stat-card">
            <span className="stat-label mono">ACTIVE_THREAT_LEVEL</span>
            <span className="stat-value mono" style={{ color: 'var(--color-warning)' }}>LOW</span>
          </div>
          <div className="stat-card">
            <span className="stat-label mono">NODE_UPTIME</span>
            <span className="stat-value mono">99.99%</span>
          </div>
        </div>

        <div className="log-table-container">
          <table className="log-table">
            <thead className="mono">
              <tr>
                <th>TIMESTAMP</th>
                <th>EVENT_TYPE</th>
                <th>SUBJECT</th>
                <th>IP_METADATA</th>
                <th>PAYLOAD_DETAILS</th>
              </tr>
            </thead>
            <tbody className="mono">
              {logs.map((log) => (
                <tr key={log.id} className="log-row">
                  <td className="time-cell">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="type-cell" style={{ color: getEventColor(log.event_type) }}>
                    [{log.event_type}]
                  </td>
                  <td className="user-cell">{log.user_id || 'ANONYMOUS'}</td>
                  <td className="ip-cell">{log.ip_hash}</td>
                  <td className="details-cell">
                    <div className="details-scroll no-scrollbar">
                      {log.details}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <style jsx>{`
        .security-dashboard-container {
          background: #000;
          color: #fff;
          min-height: 100vh;
          padding: 2rem;
          font-family: var(--font-mono);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 2rem;
          margin-bottom: 2rem;
        }

        .header-meta h1 {
          margin: 0;
          font-size: 2.5rem;
          letter-spacing: -1px;
          color: var(--color-accent-primary);
        }

        .pulse-text {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          letter-spacing: 2px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #050505;
          border: 1px solid var(--color-border);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label {
          font-size: 0.6rem;
          color: var(--color-text-muted);
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .log-table-container {
          background: #050505;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .log-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }

        .log-table th {
          text-align: left;
          padding: 1rem;
          background: #0a0a0a;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
        }

        .log-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--color-border-subtle);
          vertical-align: top;
        }

        .log-row:hover {
          background: rgba(139, 0, 0, 0.05);
        }

        .time-cell {
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        .type-cell {
          font-weight: bold;
          white-space: nowrap;
        }

        .user-cell {
          color: #888;
        }

        .ip-cell {
          color: #555;
        }

        .details-cell {
          max-width: 400px;
        }

        .details-scroll {
          max-height: 40px;
          overflow-y: auto;
          color: #666;
          word-break: break-all;
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }

        .pulse-text {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
