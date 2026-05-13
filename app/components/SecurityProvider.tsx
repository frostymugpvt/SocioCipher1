'use client';

import React, { useEffect, useState } from 'react';

/**
 * SecurityProvider
 * Implements high-level client-side anti-capture and privacy measures.
 */
export default function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // 1. Prevent Context Menu (Right-Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Anti-Screenshot Key Detection (Basic)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        alert('Screenshots are disabled for privacy.');
        navigator.clipboard.writeText('Privacy Violation: Screenshot Attempted');
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        // Intercept capture shortcuts if possible
      }
      // Prevent ctrl+c
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        navigator.clipboard.writeText('Privacy Violation: Copy Attempted');
      }
    };

    // 3. Blur on Focus Loss (DISABLED in dev environment for usability)
    const handleBlur = () => {
      // setIsBlurred(true); 
      // if (navigator.clipboard) {
      //   navigator.clipboard.writeText('');
      // }
    };
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };
    
    // Prevent cut and copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', 'Privacy Violation: Copy Attempted');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
    };
  }, []);

  return (
    <div className={`security-wrapper ${isBlurred ? 'privacy-blur' : ''} no-select`} style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      {/* Invisible overlay to deter element selection and capturing */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99998, background: 'rgba(255,255,255,0.001)' }} />
      {children}
      {isBlurred && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff0000',
          fontSize: '1.5rem',
          fontFamily: 'monospace',
          pointerEvents: 'all'
        }}>
          [ CONTENT ENCRYPTED / SCREEN PROTECTED ]
        </div>
      )}
    </div>
  );
}
