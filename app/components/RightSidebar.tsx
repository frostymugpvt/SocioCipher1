'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationProvider';


interface Conversation {
  peer_badge: string;
  last_message: string;
  last_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  direction: 'sent' | 'received';
  created_at: string;
}

interface RightSidebarProps {
  user: { alias: string; badgeNumber: string; trustScore?: number } | null;
  selectedUserBadge?: string | null;
  onTrust?: (badge: string, value: number) => void;
}

export default function RightSidebar({ user, selectedUserBadge, onTrust }: RightSidebarProps) {
  const { showToast } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [dmTarget, setDmTarget] = useState('');
  const [dmContent, setDmContent] = useState('');
  const [sending, setSending] = useState(false);

  // Sync dm target when feed user selected
  useEffect(() => {
    if (selectedUserBadge) {
      setDmTarget(selectedUserBadge);
      setActiveThread(selectedUserBadge);
    }
  }, [selectedUserBadge]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (_) {}
  }, []);

  const fetchThread = useCallback(async (badge: string) => {
    try {
      const res = await fetch(`/api/messages?with=${badge}`);
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages || []);
        fetchConversations(); // Refresh to clear unread
      }
    } catch (_) {}
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (activeThread) {
      fetchThread(activeThread);
      const interval = setInterval(() => fetchThread(activeThread), 4000);
      return () => clearInterval(interval);
    }
  }, [activeThread, fetchThread]);

  const handleSend = async () => {
    const target = activeThread || dmTarget;
    if (!target || !dmContent.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_badge: target, content: dmContent }),
      });
      if (res.ok) {
        setDmContent('');
        fetchThread(target);
        fetchConversations();
      } else {
        if (res.status === 422) {
          const errorData = await res.json();
          showToast('POLICY_VIOLATION', errorData.reason || 'Message rejected by security protocol.', 'error');
        } else {
          const err = await res.json();
          showToast('SYSTEM_ERROR', err.error || 'Failed to transmit message.', 'error');
        }
      }

    } catch (_) {
      alert('Network error.');
    } finally {
      setSending(false);
    }
  };

  const getRelTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <aside className="right-sidebar">
      {/* TRUST INDEX */}
      <section style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>
          TRUST_INDEX {selectedUserBadge && selectedUserBadge !== user?.badgeNumber ? `→ ${selectedUserBadge}` : '(SELF)'}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent-primary)', textShadow: '0 0 20px rgba(139,0,0,0.4)', lineHeight: 1 }}>
            {user?.trustScore ?? 0}
          </div>
          <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>REPUTATION_WEIGHT</div>
        </div>

        {selectedUserBadge && selectedUserBadge !== user?.badgeNumber ? (
          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[-3, -1, 1, 3].map(v => (
              <button
                key={v}
                onClick={() => onTrust?.(selectedUserBadge, v)}
                style={{
                  flex: 1,
                  minWidth: '44px',
                  background: 'var(--color-bg-alt)',
                  border: `1px solid ${v > 0 ? '#1a3a1a' : '#3a1a1a'}`,
                  color: v > 0 ? '#4caf50' : '#f44336',
                  padding: '0.35rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  borderRadius: '2px',
                }}
              >
                {v > 0 ? `+${v}` : v}
              </button>
            ))}
          </div>
        ) : (
          <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            CLICK_USER_IN_FEED_TO_VOUCH
          </div>
        )}
        <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
          1/person/2d · max 2/day
        </div>
      </section>

      {/* ENCRYPTED DMs */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '2px' }}>
            ENCRYPTED_DIRECT_MESSAGES
          </div>
        </div>

        {/* Thread view */}
        {activeThread ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
              onClick={() => setActiveThread(null)}
              style={{ padding: '0.5rem 1.25rem', background: 'var(--color-bg-alt)', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
            >
              ← {activeThread}
            </div>
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {threadMessages.length === 0 ? (
                <div className="mono" style={{ fontSize: '0.6rem', color: '#333', textAlign: 'center', marginTop: '2rem' }}>
                  NO_TRANSMISSIONS_YET
                </div>
              ) : (
                threadMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.direction === 'sent' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: msg.direction === 'sent' ? 'rgba(139,0,0,0.15)' : 'var(--color-bg-alt)',
                      border: `1px solid ${msg.direction === 'sent' ? 'rgba(139,0,0,0.3)' : 'var(--color-border)'}`,
                      padding: '0.4rem 0.6rem',
                      borderRadius: '2px',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <div>{msg.content}</div>
                    <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                      {getRelTime(msg.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Conversation list */
          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div className="mono" style={{ padding: '2rem', textAlign: 'center', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                NO_PRIVATE_COMMS_DETECTED
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.peer_badge}
                  onClick={() => setActiveThread(conv.peer_badge)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-accent-primary)' }}>
                      {conv.peer_badge}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {conv.last_message}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--color-text-secondary)' }}>{getRelTime(conv.last_at)}</span>
                    {conv.unread_count > 0 && (
                      <span style={{ background: 'var(--color-accent-primary)', color: 'white', fontSize: '0.55rem', borderRadius: '10px', padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Compose */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {!activeThread && (
            <input
              type="text"
              placeholder="Target Badge #SC-XXXX-XXXX"
              value={dmTarget}
              onChange={e => setDmTarget(e.target.value)}
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '0.4rem 0.6rem', width: '100%', outline: 'none' }}
            />
          )}
          <textarea
            placeholder="Secure transmission..."
            value={dmContent}
            onChange={e => setDmContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={2}
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.4rem 0.6rem', width: '100%', resize: 'none', outline: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !dmContent.trim() || (!activeThread && !dmTarget.trim())}
            style={{ background: 'var(--color-accent-primary)', color: 'white', border: 'none', padding: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', opacity: sending ? 0.5 : 1 }}
          >
            {sending ? 'TRANSMITTING...' : 'SEND_ENCRYPTED ⇒'}
          </button>
        </div>
      </section>
    </aside>
  );
}
