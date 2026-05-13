'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from './components/MainLayout';
import Auth from './components/Auth';
import Feed from './components/Feed';
import ChatRoom from './components/ChatRoom';
import ModerationHub from './components/ModerationHub';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('GLOBAL_FEED');
  const [activeCommunity, setActiveCommunity] = useState('GLOBAL');
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'CHANNEL' | 'COMMUNITY'>('CHANNEL');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [targetBadge, setTargetBadge] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const [rRes, cRes, tRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/communities'),
        fetch('/api/trust')
      ]);
      if (rRes.ok) setRooms((await rRes.json()).rooms);
      if (cRes.ok) setCommunities((await cRes.json()).communities);
      if (tRes.ok) {
        const tData = await tRes.json();
        setUser((prev: any) => prev ? { ...prev, trustScore: tData.trust_score } : null);
      }
    } catch (e) { console.error(e); }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // After getting user, fetch everything else including trust
        const tRes = await fetch('/api/trust');
        if (tRes.ok) {
          const tData = await tRes.json();
          setUser((prev: any) => ({ ...prev, trustScore: tData.trust_score }));
        }
        fetchRooms();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [fetchRooms]);


  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    setActiveTab('GLOBAL_FEED');
    setActiveCommunity('GLOBAL');
  };

  const handleCreateOrUpdate = async () => {
    if (!newChannelName.trim()) return;
    
    const isEdit = isEditMode && editTarget;
    let endpoint = createType === 'CHANNEL' ? '/api/rooms' : '/api/communities';
    if (isEdit) endpoint += `/${editTarget.id}`;

    const body = createType === 'CHANNEL' 
      ? { 
          name: newChannelName, 
          description: newChannelDesc, 
          community_id: activeCommunity !== 'GLOBAL' ? activeCommunity : null,
          is_restricted: isRestricted ? 1 : 0
        }
      : { name: newChannelName, description: newChannelDesc };

    try {
      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setIsEditMode(false);
        setEditTarget(null);
        setNewChannelName('');
        setNewChannelDesc('');
        setIsRestricted(false);
        fetchRooms();
        if (!isEdit) {
          if (createType === 'CHANNEL') {
            setActiveTab(`room:${data.roomId}`);
          } else {
            setActiveCommunity(data.communityId);
          }
        }
      }
    } catch (e) { console.error(e); }
  };

  const openEditCommunity = (comm: any) => {
    setCreateType('COMMUNITY');
    setEditTarget(comm);
    setIsEditMode(true);
    setNewChannelName(comm.name);
    setNewChannelDesc(comm.description || '');
    setShowCreateModal(true);
  };

  const openEditRoom = (room: any) => {
    setCreateType('CHANNEL');
    setEditTarget(room);
    setIsEditMode(true);
    setNewChannelName(room.name);
    setNewChannelDesc(room.description || '');
    setIsRestricted(room.is_restricted === 1);
    setShowCreateModal(true);
  };

  const handleDeleteCommunity = async (id: string) => {
    if (!confirm('Destroy this community?')) return;
    await fetch(`/api/communities/${id}`, { method: 'DELETE' });
    setActiveCommunity('GLOBAL');
    setActiveTab('GLOBAL_FEED');
    fetchRooms();
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Purge this channel?')) return;
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
    if (activeTab === `room:${id}`) setActiveTab('GLOBAL_FEED');
    fetchRooms();
  };

  const handleTrust = async (badge: string, value: number) => {
    try {
      const res = await fetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_badge: badge, value })
      });
      if (res.ok) {
        alert(`Successfully awarded ${value > 0 ? '+' : ''}${value} trust to ${badge}`);
        setTargetBadge(null);
        fetchRooms(); // Refresh trust score
      } else {
        const err = await res.json();
        alert(err.error || "Failed to award trust.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  if (loading) {
    return <div className="loading-screen">INITIALIZING...</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {user ? (
        <MainLayout 
          user={user} 
          onLogout={handleSignOut} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onCreateClick={() => {
            setIsEditMode(false);
            setEditTarget(null);
            setNewChannelName('');
            setNewChannelDesc('');
            setIsRestricted(false);
            setShowCreateModal(true);
          }}
          rooms={rooms}
          communities={communities}
          activeCommunity={activeCommunity}
          onCommunityChange={setActiveCommunity}
          onDeleteCommunity={handleDeleteCommunity}
          onEditCommunity={openEditCommunity}
          onDeleteRoom={handleDeleteRoom}
          onEditRoom={openEditRoom}
          onTrust={handleTrust}
          selectedUserBadge={targetBadge}
        >
          {activeTab === 'GLOBAL_FEED' ? (
            <Feed user={user} onSelectUser={(badge) => setTargetBadge(badge)} />
          ) : activeTab === 'MODERATION' ? (
            <ModerationHub />
          ) : activeTab === 'NEWS' ? (
            <div style={{ padding: '2rem' }}>
              <h2 className="mono">[ SECURITY_INTEL ]</h2>
              <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Protocol v2.4 initialized. IP stripping active.</p>
            </div>
          ) : activeTab.startsWith('room:') ? (
            <ChatRoom 
              roomId={activeTab.split(':')[1]} 
              channel={rooms.find(r => `room:${r.id}` === activeTab)?.name || 'Unknown'} 
              user={user} 
            />
          ) : null}
        </MainLayout>
      ) : (
        <Auth onAuthenticated={(data: any) => { setUser(data); fetchRooms(); }} />
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 className="mono" style={{ marginBottom: '1.5rem', color: 'var(--color-accent-primary)' }}>
              {isEditMode ? 'MODIFY' : 'INITIALIZE'}_{createType}
            </h2>
            
            {!isEditMode && (
              <div className="segmented-control" style={{ marginBottom: '1rem' }}>
                <button className={createType === 'CHANNEL' ? 'active' : ''} onClick={() => setCreateType('CHANNEL')}>CHANNEL</button>
                <button className={createType === 'COMMUNITY' ? 'active' : ''} onClick={() => setCreateType('COMMUNITY')}>COMMUNITY</button>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="mono" style={{ fontSize: '0.7rem' }}>NAME</label>
              <input 
                className="input-field"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Secure Node Name"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="mono" style={{ fontSize: '0.7rem' }}>DESCRIPTION</label>
              <textarea 
                className="input-field"
                style={{ minHeight: '60px' }}
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                placeholder="Purpose of this node..."
              />
            </div>

            {createType === 'CHANNEL' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={isRestricted} onChange={e => setIsRestricted(e.target.checked)} />
                <span className="mono" style={{ fontSize: '0.7rem' }}>RESTRICT_MESSAGING (OWNER_ONLY)</span>
              </label>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>ABORT</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreateOrUpdate} disabled={!newChannelName.trim()}>EXECUTE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
