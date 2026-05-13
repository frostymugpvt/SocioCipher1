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
      // Intercept PrtScn (though browser support varies)
      if (e.key === 'PrintScreen') {
        alert('Screenshots are disabled for privacy.');
        navigator.clipboard.writeText('Privacy Violation: Screenshot Attempted');
      }
      
      // Intercept Cmd/Ctrl + Shift + S or similar (browser specific)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        // e.preventDefault();
      }
    };

    // 3. Blur on Focus Loss
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className={`security-wrapper ${isBlurred ? 'privacy-blur' : ''} no-select`}>
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
