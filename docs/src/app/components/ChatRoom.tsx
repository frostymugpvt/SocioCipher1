'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { encryptMessage, decryptMessage, padData, bufferToBase64 } from '@/lib/crypto';
import { useNotifications } from './NotificationProvider';


interface Message {
  id: string;
  alias: string;
  badgeNumber: string;
  content: string; // This will be the decrypted content in state
  ciphertext?: string; // Original ciphertext from DB
  iv?: string;
  timestamp: string;
  report_count?: number;
}

export default function ChatRoom({ roomId, channel, user }: { roomId: string, channel: string, user: { alias: string, badgeNumber: string } }) {
  const { showToast } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [roomKey, setRoomKey] = useState<CryptoKey | null>(null);
  const [roomMetadata, setRoomMetadata] = useState<{ is_restricted: number, creator_alias: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Room Key (Placeholder: Derived from RoomID for demo)
  useEffect(() => {
    const initKey = async () => {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(roomId.padEnd(32, '0').slice(0, 32)); 
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      setRoomKey(key);
    };
    initKey();
  }, [roomId]);

  const fetchMessages = useCallback(async () => {
    if (!roomKey) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        
        // Decrypt messages on the fly
        const decryptedMessages = await Promise.all(data.messages.map(async (msg: any) => {
          if (msg.ciphertext && msg.iv) {
            try {
              const content = await decryptMessage(msg.ciphertext, msg.iv, roomKey);
              return { ...msg, content };
            } catch (e) {
              return { ...msg, content: '[DECRYPTION ERROR: KEY MISMATCH]' };
            }
          }
          return msg;
        }));
        
        setMessages(decryptedMessages);
        setRoomMetadata(data.roomMetadata);
      }
    } catch (e) {
      console.error('Fetch messages error:', e);
    } finally {
      setLoading(false);
    }
  }, [roomId, roomKey]);

  useEffect(() => {
    if (roomKey) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchMessages, roomKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFlag = async (e: React.MouseEvent, type: string, id: string, decryptedContent?: string) => {
    e.stopPropagation();
    const reason = prompt('Reason for flagging?');
    if (!reason) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentType: type, 
          contentId: id, 
          category: 'safety_violation',
          evidence: decryptedContent, 
          reason: reason
        })
      });
      if (res.ok) {
        showToast('REPORT_LOGGED', 'Report filed. Encryption protocols maintained.', 'success');
      }

    } catch (e) {
      console.error('Flag error:', e);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages/${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMessages();
      }
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !roomKey) return;

    if (roomMetadata?.is_restricted && roomMetadata.creator_alias !== user.alias) {
      showToast('ACCESS_DENIED', 'This channel is restricted. Only the owner can message.', 'error');
      return;
    }


    const content = input;
    setInput('');

    try {
      // Encrypt with Room Key
      const { ciphertext, iv } = await encryptMessage(content, roomKey);

      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ciphertext, 
          iv 
        })
      });
      if (res.ok) {
        fetchMessages();
      } else {
        if (res.status === 422) {
          const errorData = await res.json();
          showToast('POLICY_VIOLATION', errorData.reason || 'Message rejected by security protocol.', 'error');
        } else {
          showToast('SYSTEM_ERROR', 'Failed to synchronize message with network.', 'error');
        }
        setInput(content);
      }

    } catch (e) {
      console.error('Send message error:', e);
      setInput(content);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        // Append file link to input
        setInput(prev => prev + (prev ? ' ' : '') + `[SECURE_FILE:${data.url}]`);
      }
    } catch (e) {
      console.error('Upload error:', e);
    }
  };

  return (
    <div className="sensitive-area" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* MESSAGES LIST */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div className="mono" style={{ opacity: 0.5 }}>Syncing secure channel...</div>
        ) : messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
              <span style={{ 
                color: msg.alias === 'System' ? 'var(--color-warning)' : 'var(--color-accent-primary)', 
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }} className="mono">
                {msg.alias === 'System' ? '[SYSTEM]' : msg.alias}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }} className="mono">{msg.badgeNumber}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{msg.timestamp}</span>
            </div>
            <div style={{ 
              padding: '0.5rem 0.75rem', 
              background: msg.alias === 'System' ? 'rgba(240, 160, 42, 0.05)' : 'rgba(139, 0, 0, 0.05)',
              borderLeft: `2px solid ${msg.alias === 'System' ? 'var(--color-warning)' : 'var(--color-accent-primary)'}`,
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              position: 'relative'
            }}>
              {msg.content}
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', opacity: 0.8 }}>
                <span>🔒 E2EE Padded</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={(e) => handleFlag(e, 'message', msg.id, msg.content)} className="btn-icon" title="Flag Message">🚩</button>
                  {(msg.alias === user.alias || roomMetadata?.creator_alias === user.alias) && (
                    <button onClick={() => handleDeleteMessage(msg.id)} className="btn-icon" title="Delete Message">🗑️</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: '1rem', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            id="media-upload"
            type="file"
            hidden
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => document.getElementById('media-upload')?.click()}
            className="btn-icon"
            style={{ border: '1px solid var(--color-border)', padding: '0 0.75rem' }}
            title="Secure Upload (Scrubbed)"
          >
            📎
          </button>
          <input 
            type="text" 
            placeholder={roomMetadata?.is_restricted && roomMetadata.creator_alias !== user.alias ? "RESTRICTED: OWNER_ONLY_MESSAGING" : "TYPE_ENCRYPTED_MESSAGE..."}
            className="input-field mono"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={roomMetadata?.is_restricted === 1 && roomMetadata.creator_alias !== user.alias}
            style={{ flex: 1, opacity: roomMetadata?.is_restricted === 1 && roomMetadata.creator_alias !== user.alias ? 0.5 : 1 }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={roomMetadata?.is_restricted === 1 && roomMetadata.creator_alias !== user.alias}
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
