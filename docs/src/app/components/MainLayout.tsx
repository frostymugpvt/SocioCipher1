'use client';

import React, { useState, useEffect } from 'react';
import RightSidebar from './RightSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  user: { alias: string; badgeNumber: string; trustScore?: number } | null;
  onLogout?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCreateClick?: () => void;
  rooms?: any[];
  communities?: any[];
  activeCommunity?: string;
  onCommunityChange?: (id: string) => void;
  onDeleteCommunity?: (id: string) => void;
  onEditCommunity?: (comm: any) => void;
  onDeleteRoom?: (id: string) => void;
  onEditRoom?: (room: any) => void;
  onTrust?: (badge: string, value: number) => void;
  selectedUserBadge?: string | null;
}

export default function MainLayout({ 
  children, 
  user, 
  onLogout, 
  activeTab = 'GLOBAL_FEED', 
  onTabChange, 
  onCreateClick, 
  rooms = [], 
  communities = [],
  activeCommunity = 'GLOBAL',
  onCommunityChange,
  onDeleteCommunity,
  onEditCommunity,
  onDeleteRoom,
  onEditRoom,
  onTrust,
  selectedUserBadge
}: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    '[SEC_PROC] 1024-byte packet padding enabled...',
    `[ENC_SYS] AES-GCM session keys rotated for node ${user?.badgeNumber || 'SC-GLOBAL'}...`,
    '[PRIV_L] IP header stripping active on all gateway nodes...',
    '[TRUST] Cross-referencing reputation weightings...',
    '[SYS] Zero-knowledge authentication verified...',
    '[MEM] Secure memory wipe scheduled in T-3600s...'
  ]);

  useEffect(() => {
    const fetchLatestLogs = async () => {
      try {
        const res = await fetch('/api/admin/security/logs?limit=5');
        if (res.ok) {
          const data = await res.json();
          const newLogs = data.logs.map((log: any) => 
            `[${log.event_type}] ${log.details.substring(0, 50)}${log.details.length > 50 ? '...' : ''}`
          );
          setSecurityLogs(prev => {
            const combined = [...prev, ...newLogs];
            return Array.from(new Set(combined)).slice(-15);
          });
        }
      } catch (e) { console.error('Failed to fetch protocol stream:', e); }
    };

    fetchLatestLogs();
    const interval = setInterval(fetchLatestLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="main-grid">
      {/* LEFT SIDEBAR: IDENTITY & NAVIGATION */}
      <aside className={`left-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', background: 'linear-gradient(to bottom, #0a0a0a, #000)' }}>
          <div className="mono" style={{ color: 'var(--color-accent-primary)', fontSize: '0.6rem', marginBottom: '0.2rem' }}>ASSIGNED_ID</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{user?.badgeNumber || 'SC-XXXX-XXXX'}</div>
          <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>{user?.alias}</div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {/* SYSTEM CHANNELS */}
          <div className="sidebar-section">
            <span className="section-header">CHANNELS</span>
            <div onClick={() => handleTabChange('GLOBAL_FEED')} className={`channel-item ${activeTab === 'GLOBAL_FEED' ? 'active' : ''}`}>
              <span className="channel-icon">📡</span>
              <span className="channel-label">Global Frequencies</span>
            </div>
            <div onClick={() => handleTabChange('NEWS')} className={`channel-item ${activeTab === 'NEWS' ? 'active' : ''}`}>
              <span className="channel-icon">📰</span>
              <span className="channel-label">Global News</span>
            </div>
            <div onClick={() => handleTabChange('UPDATES')} className={`channel-item ${activeTab === 'UPDATES' ? 'active' : ''}`}>
              <span className="channel-icon">⚙️</span>
              <span className="channel-label">Community Updates</span>
            </div>
            <div onClick={() => window.location.href = '/legal'} className="channel-item">
              <span className="channel-icon">⚖️</span>
              <span className="channel-label" style={{ color: 'var(--color-accent-primary)' }}>LEGAL_PROTOCOL</span>
            </div>
            
            {/* ADMIN TOOLS */}
            {(user?.alias === 'SystemAdmin' || user?.badgeNumber?.startsWith('SC-ROOT')) && (
              <div onClick={() => window.location.href = '/admin/security'} className="channel-item">
                <span className="channel-icon">🛡️</span>
                <span className="channel-label" style={{ color: 'var(--color-warning)' }}>SECURITY_DASHBOARD</span>
              </div>
            )}
          </div>

          {/* PUBLIC / POPULAR CHANNELS */}
          <div className="sidebar-section">
            <span className="section-header">PUBLIC_CHANNELS</span>
            {rooms.filter(r => !r.community_id && r.visibility === 'public').map(room => (
              <div key={room.id} onClick={() => handleTabChange(`room:${room.id}`)} className={`channel-item ${activeTab === `room:${room.id}` ? 'active' : ''}`}>
                <span className="channel-icon">#</span>
                <span className="channel-label">{room.name}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="member-count">{room.member_count || 0}</span>
                  {room.creator_alias === user?.alias && (
                    <div className="owner-actions">
                      <button onClick={(e) => { e.stopPropagation(); onEditRoom?.(room); }} className="btn-mini">✎</button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteRoom?.(room.id); }} className="btn-mini">✕</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* JOINED CHANNELS */}
          <div className="sidebar-section">
            <span className="section-header">JOINED_CHANNELS</span>
            {rooms.filter(r => r.is_joined).map(room => (
              <div key={room.id} onClick={() => handleTabChange(`room:${room.id}`)} className={`channel-item ${activeTab === `room:${room.id}` ? 'active' : ''}`}>
                <span className="channel-icon">●</span>
                <span className="channel-label">{room.name}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="member-count">{room.member_count || 0}</span>
                  {room.creator_alias === user?.alias && (
                    <div className="owner-actions">
                      <button onClick={(e) => { e.stopPropagation(); onEditRoom?.(room); }} className="btn-mini">✎</button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteRoom?.(room.id); }} className="btn-mini">✕</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* COMMUNITIES */}
          <div className="sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '1rem' }}>
              <span className="section-header">COMMUNITIES</span>
              <button onClick={onCreateClick} className="btn-icon" style={{ color: 'var(--color-accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
            </div>
            {communities.map(comm => (
              <div key={comm.id} onClick={() => onCommunityChange?.(comm.id)} className={`channel-item ${activeCommunity === comm.id ? 'active' : ''}`}>
                <span className="channel-icon">▣</span>
                <span className="channel-label">{comm.name}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="member-count">{comm.member_count || 0}</span>
                  {comm.creator_alias === user?.alias && (
                    <div className="owner-actions">
                      <button onClick={(e) => { e.stopPropagation(); onEditCommunity?.(comm); }} className="btn-mini">✎</button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteCommunity?.(comm.id); }} className="btn-mini">✕</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="user-control-panel">
          {onLogout && (
            <button onClick={onLogout} className="logout-mini-btn">
              TERMINATE_SESSION ⏻
            </button>
          )}
        </div>
      </aside>

      {/* CENTER: CONTENT AREA */}
      <main className="main-content">
        <header className="content-header">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
          <div className="header-info">
            <span className="hash">#</span>
            <h1 className="header-title">
              {activeTab === 'GLOBAL_FEED' ? 'global-feed' : 
               activeTab === 'NEWS' ? 'intel-stream' :
               activeTab === 'UPDATES' ? 'system-updates' :
               rooms.find(r => `room:${r.id}` === activeTab)?.name.toLowerCase().replace(/\s+/g, '-') || 'terminal'}
            </h1>
          </div>
        </header>

        <div className="content-body">
          <div className="scroll-content no-scrollbar">
            {children}
          </div>
          
          {/* REAL-TIME SECURITY PROTOCOL LOG */}
          <div className="security-protocol-log">
            <div className="log-header">
              <span className="pulse-dot"></span>
              REAL-TIME SECURITY PROTOCOL STREAM
            </div>
            <div className="log-entries mono">
              {securityLogs.map((log, i) => (
                <div key={i} style={{ opacity: (i + 1) / securityLogs.length }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <RightSidebar
        user={user}
        selectedUserBadge={selectedUserBadge}
        onTrust={onTrust}
      />
    </div>
  );
}
