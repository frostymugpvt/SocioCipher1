'use client';

import { useState } from 'react';

export default function Auth({ onAuthenticated }: { onAuthenticated: (data: { alias: string, badgeNumber: string }) => void }) {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [userData, setUserData] = useState<{ alias: string, badgeNumber: string } | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
        setError('YOU MUST ACKNOWLEDGE THE LEGAL PROTOCOL');
        return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setStep('otp');
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
        setError('YOU MUST ACKNOWLEDGE THE LEGAL PROTOCOL');
        return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: 'anonymous' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to authenticate');
        return;
      }
      setUserData({ alias: data.alias, badgeNumber: data.badgeNumber });
      setStep('success');
      onAuthenticated({ alias: data.alias, badgeNumber: data.badgeNumber });
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid OTP');
        return;
      }

      setUserData({ alias: data.alias, badgeNumber: data.badgeNumber });
      setStep('success');
      
      // Automatic redirect immediately
      onAuthenticated({ alias: data.alias, badgeNumber: data.badgeNumber });
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success' && userData) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20vh', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-accent-primary)', letterSpacing: '4px' }} className="mono">✦ ACCESS_GRANTED ✦</h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', background: 'rgba(20,0,0,0.2)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', display: 'block' }}>BADGE_ID</span>
            <span className="mono" style={{ color: '#fff' }}>{userData.badgeNumber}</span>
          </div>
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', background: 'rgba(20,0,0,0.2)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', display: 'block' }}>SESSION_ALIAS</span>
            <span className="mono" style={{ color: 'var(--color-accent-secondary)' }}>{userData.alias}</span>
          </div>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Initializing secure shell... <span className="pulse">|</span></p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '40vh auto', 
      padding: '0.75rem 1.5rem', 
      background: 'rgba(5, 5, 5, 0.95)', 
      border: '1px solid var(--color-border)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 0 40px rgba(139, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRight: '1px solid var(--color-border)', paddingRight: '1rem' }}>
        <h1 style={{ fontSize: '1rem', letterSpacing: '2px', color: '#fff', margin: 0 }} className="mono">SOCIOCIPHER</h1>
        <span style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)', opacity: 0.5 }}>v2.4.0</span>
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ 
                flex: 1,
                padding: '0.5rem 1rem', 
                fontSize: '0.9rem', 
                background: 'rgba(20, 0, 0, 0.6)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                outline: 'none'
              }}
              required
              placeholder="PHONE_IDENTIFIER"
              className="mono"
            />
            <button type="submit" className="btn-primary" disabled={loading || !phoneNumber} style={{ padding: '0 1.5rem', height: '38px', fontSize: '0.8rem' }}>
              {loading ? '...' : 'INITIATE'}
            </button>
            <button type="button" onClick={handleAnonymousLogin} className="btn-secondary" disabled={loading} style={{ padding: '0 1.5rem', height: '38px', fontSize: '0.8rem' }}>
              {loading ? '...' : 'ANONYMOUS'}
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            alignItems: 'center', 
            whiteSpace: 'nowrap',
            padding: '0.5rem 1rem',
            border: '1px solid var(--color-border)',
            background: 'rgba(0,0,0,0.3)'
          }}>
            <input 
              type="checkbox" 
              id="legal-agree" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ 
                cursor: 'pointer',
                accentColor: 'var(--color-accent-primary)',
                width: '16px',
                height: '16px'
              }} 
            />
            <label htmlFor="legal-agree" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }} className="mono">
              ACKNOWLEDGE <a href="/legal" target="_blank" style={{ color: 'var(--color-accent-primary)', textDecoration: 'underline' }}>LEGAL_PROTOCOL_V2.0</a>
            </label>
          </div>

          {error && <div style={{ position: 'absolute', bottom: '-2.5rem', left: 0, color: 'var(--color-danger)', fontSize: '0.7rem' }}>[!] {error}</div>}
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ 
                flex: 1,
                padding: '0.5rem 1rem', 
                fontSize: '0.9rem', 
                background: 'rgba(20, 0, 0, 0.6)',
                border: '1px solid var(--color-accent-primary)',
                color: '#fff',
                outline: 'none'
              }}
              required
              maxLength={12}
              placeholder="VERIFICATION_TOKEN"
              className="mono"
            />
            <button type="submit" className="btn-primary" disabled={loading || !otp} style={{ padding: '0 1.5rem', height: '38px', fontSize: '0.8rem' }}>
              {loading ? '...' : 'AUTHORIZE'}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>DEST: {phoneNumber}</span>
            <button type="button" onClick={() => setStep('phone')} style={{ color: 'var(--color-accent-primary)', fontSize: '0.6rem', background: 'none', border: 'none', cursor: 'pointer' }}>[ ABORT ]</button>
          </div>

          {error && <div style={{ position: 'absolute', bottom: '-2.5rem', left: 0, color: 'var(--color-danger)', fontSize: '0.7rem' }}>[!] {error}</div>}
        </form>
      )}
    </div>
  );
}
