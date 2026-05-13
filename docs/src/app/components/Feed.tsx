'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationProvider';


interface Post {
  id: string;
  badgeNumber: string;
  alias: string;
  content: string;
  timestamp: string;
  expires_at: string;
  created_at: string;
  commentsCount: number;
  report_count: number;
}

interface Comment {
  id: string;
  badgeNumber: string;
  alias: string;
  content: string;
  created_at: string;
  report_count: number;
  depth: number;
}

export default function Feed({ 
  user, 
  onSelectUser 
}: { 
  user: { alias: string; badgeNumber: string },
  onSelectUser?: (badge: string) => void
}) {
  const { showToast } = useNotifications();
  const [content, setContent] = useState('');

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (e) {
      console.error('Fetch posts error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error('Fetch comments error:', e);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(() => {
      fetchPosts();
      if (selectedPost) {
        fetchComments(selectedPost.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPosts, fetchComments, selectedPost]);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost, fetchComments]);

  const handlePost = async () => {
    if (!content.trim()) return;
    
    const text = content;
    setContent('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      
      if (res.ok) {
        fetchPosts();
      } else {
        if (res.status === 422) {
          const errorData = await res.json();
          showToast('POLICY_VIOLATION', errorData.reason || 'Content rejected by security protocol.', 'error');
        } else {
          showToast('SYSTEM_ERROR', 'Failed to synchronize post with network.', 'error');
        }
        setContent(text);
      }

    } catch (e) {
      console.error('Create post error:', e);
      setContent(text);
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;
    
    const text = commentInput;
    setCommentInput('');

    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      
      if (res.ok) {
        fetchComments(selectedPost.id);
      } else {
        if (res.status === 422) {
          const errorData = await res.json();
          showToast('POLICY_VIOLATION', errorData.reason || 'Comment rejected by security protocol.', 'error');
        } else {
          showToast('SYSTEM_ERROR', 'Failed to synchronize comment with network.', 'error');
        }
        setCommentInput(text);
      }

    } catch (e) {
      console.error('Create comment error:', e);
      setCommentInput(text);
    }
  };

  const handleFlag = async (e: React.MouseEvent, type: string, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      });
      if (res.ok) {
        alert('Report logged. System will evaluate for policy violations.');
        if (type === 'post') fetchPosts();
        if (type === 'comment' && selectedPost) fetchComments(selectedPost.id);
      }
    } catch (e) {
      console.error('Flag error', e);
    }
  };

  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getExpiry = (isoString: string) => {
    const expiry = new Date(isoString);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return 'expired';
    
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  };

  if (loading && posts.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>SYNCHRONIZING FEED...</div>;
  }

  // --- THREAD VIEW ---
  if (selectedPost) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button 
          onClick={() => setSelectedPost(null)}
          style={{ padding: '1rem', background: '#111', color: '#fff', textAlign: 'left', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
        >
          ← Back to Global Feed
        </button>

        <article style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(20,20,20,0.5)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '40px', height: '40px', background: '#111', border: '1px solid var(--color-border)',
              color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', borderRadius: '2px'
            }} className="mono">
              {selectedPost.alias?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedPost.alias}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }} className="mono">{selectedPost.badgeNumber}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{getRelativeTime(selectedPost.created_at)}</span>
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>
                {selectedPost.content}
              </p>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                <span>⏱ {getExpiry(selectedPost.expires_at)} left</span>
                <span style={{ cursor: 'pointer', color: selectedPost.report_count > 0 ? 'var(--color-warning)' : '' }} onClick={(e) => handleFlag(e, 'post', selectedPost.id)}>
                  ⚐ Flag ({selectedPost.report_count || 0})
                </span>
              </div>
            </div>
          </div>
        </article>

        <div style={{ padding: '1.5rem', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a reply..."
                style={{ flex: 1, background: '#000', border: '1px solid #222', padding: '1rem', color: 'var(--color-text-primary)', resize: 'none', minHeight: '60px' }}
              />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
             <button onClick={handleComment} className="btn-primary" disabled={!commentInput.trim()}>Reply</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border-subtle)', marginLeft: `${comment.depth * 2}rem` }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{
                  width: '30px', height: '30px', background: '#0a0a0a', border: '1px solid #222',
                  color: 'var(--color-accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', borderRadius: '2px'
                }} className="mono">
                  {comment.alias[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{comment.alias}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }} className="mono">{comment.badgeNumber}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{getRelativeTime(comment.created_at)}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {comment.content}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ cursor: 'pointer', color: comment.report_count > 0 ? 'var(--color-warning)' : '' }} onClick={(e) => handleFlag(e, 'comment', comment.id)}>
                      ⚐ Flag ({comment.report_count || 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No replies yet.</div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN FEED VIEW ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* TERMINAL COMPOSER */}
      <div style={{
        padding: '1.25rem',
        borderBottom: '1px solid var(--color-border)',
        background: '#050505',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="mono" style={{ color: 'var(--color-accent-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{user?.alias}@socio:~$</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="BROADCAST_MESSAGE..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                padding: '0.25rem 0',
                fontFamily: 'var(--font-mono)'
              }}
              className="mono"
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '-2px', 
              left: 0, 
              width: content ? '100%' : '20px', 
              height: '1px', 
              background: 'var(--color-accent-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <button 
            onClick={handlePost}
            style={{ 
              background: 'none', 
              border: '1px solid var(--color-accent-primary)', 
              color: 'var(--color-accent-primary)',
              padding: '0.2rem 1rem',
              fontSize: '0.7rem',
              cursor: 'pointer',
              opacity: content.trim() ? 1 : 0.3,
              transition: 'all 0.2s'
            }}
            className="mono"
            disabled={!content.trim()}
          >
            EXECUTE
          </button>
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginLeft: '2.5rem' }} className="mono">
          [!] CONTENT_SENSITIVE_FILTERING_ACTIVE // PERSISTENCE: EPHEMERAL_30D
        </div>
      </div>

      {/* POSTS */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {posts.map(post => (
          <article key={post.id} onClick={() => setSelectedPost(post)} style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border-subtle)',
            transition: 'background 0.2s',
            cursor: 'pointer',
            background: 'transparent'
          }} className="post-item">
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: '#0a0a0a',
                border: '1px solid #222',
                color: 'var(--color-accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                borderRadius: '2px',
                flexShrink: 0
              }} className="mono">
                {post.alias?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.alias}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '1px' }} className="mono">{post.badgeNumber}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', flexShrink: 0 }} className="mono">{getRelativeTime(post.created_at)}</span>
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', margin: 0, wordBreak: 'break-word' }}>
                  {post.content}
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  marginTop: '0.75rem', 
                  color: 'var(--color-text-muted)',
                  fontSize: '0.7rem' 
                }} className="mono">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: 'var(--color-accent-primary)' }}>▶</span> {post.commentsCount || 0} REPLIES
                  </span>
                  <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectUser) onSelectUser(post.badgeNumber);
                  }}>
                    <span style={{ color: 'var(--color-accent-secondary)' }}>◈</span> TRUST_SCAN
                  </span>
                  <span style={{ cursor: 'pointer', color: post.report_count > 0 ? 'var(--color-warning)' : '', marginLeft: 'auto' }} onClick={(e) => handleFlag(e, 'post', post.id)}>
                    [ FLAG_VIOLATION ]
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', letterSpacing: '2px' }} className="mono">
            NO_BROADCASTS_DETECTED_IN_THIS_SECTOR
          </div>
        )}
      </div>

      <style jsx>{`
        .post-item:hover {
          background: rgba(139, 0, 0, 0.03) !important;
        }
        .post-item:hover p {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
