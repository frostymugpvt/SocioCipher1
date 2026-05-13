import React from 'react';
import MainLayout from '../components/MainLayout';

export default function LegalPage() {
  return (
    <MainLayout user={null}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem', color: 'var(--color-text)' }}>
        <header style={{ marginBottom: '4rem', textAlign: 'left', borderLeft: '4px solid var(--color-accent-primary)', paddingLeft: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '0.5rem', color: 'var(--color-text)' }} className="mono">
            SOCIOCIPHER_LEGAL_FRAMEWORK_V2.0
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 'bold' }} className="mono">
            LAST_REVISION: 2026-05-13 // STATUS: ACTIVE_ENFORCEMENT
          </p>
        </header>

        <div style={{ display: 'grid', gap: '4rem' }}>
          <section>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="mono">
              <span style={{ color: 'var(--color-text-secondary)' }}>01_</span> PRIVACY_SAFETY_SYSTEMS
            </h2>
            <div style={{ background: 'var(--color-bg-alt)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                SocioCipher operates on a "Zero-Persistence" philosophy. Your safety is guaranteed by the architecture itself:
              </p>
              <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '1rem' }}>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>IP_ANONYMIZATION:</strong> We utilize a multi-stage header scrubbing process. Your source IP is stripped at the entry gateway and replaced with a temporary hash that is cryptographically rotated every 60 minutes.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>EPHEMERAL_DB_PURGE:</strong> All session metadata and OTP identifiers are stored in a volatile state. Automated "Reaper" threads purge all expired authentication data every 300 seconds.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>ZERO_DISK_SENSITIVE:</strong> Authentication secrets, JWT salts, and private session keys are never written to non-volatile storage. If the server loses power, all session data vanishes instantly.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>ENCRYPTION_LAYER:</strong> All traffic is forced through TLS 1.3 with Perfect Forward Secrecy (PFS), ensuring that even if past keys were compromised, your current transmissions remain secure.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="mono">
              <span style={{ color: 'var(--color-text-secondary)' }}>02_</span> TERMS_OF_ANONYMOUS_DISCOURSE
            </h2>
            <div style={{ background: 'var(--color-bg-alt)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                SocioCipher provides a sanctuary for radical open discussion. We protect your right to discuss sensitive topics, but draw a hard line at practical criminality:
              </p>
              <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '1rem' }}>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>OPEN_TOPICS:</strong> You are permitted to discuss, analyze, and debate taboo subjects including but not limited to: drugs, nudity, controversial ideologies, terrorism, and fringe philosophies. These are protected for theoretical and academic exploration.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>CRITICAL_PROHIBITION:</strong> The platform strictly prohibits the use of its infrastructure for **practical coordination** of illegal acts. This includes planning physical attacks, human or drug trafficking, distribution of illegal material, or any activity that constitutes a felony under international consensus.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>INTENT_FILTER:</strong> Discussion = Protected. Coordination = Prohibited. Users found to be using the platform as a tool for practical crime will have their access terminated and identifiers blacklisted.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="mono">
              <span style={{ color: 'var(--color-text-secondary)' }}>03_</span> INTERNATIONAL_LEGAL_COMPLIANCE
            </h2>
            <div style={{ background: 'var(--color-bg-alt)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                While we operate outside traditional corporate surveillance, we adhere to the foundational principles of international law:
              </p>
              <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '1rem' }}>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>EU_DIGITAL_SERVICES_ACT (DSA):</strong> We maintain a transparent reporting mechanism for illicit content and employ AI-driven moderation to mitigate systemic risks.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>GDPR_MINIMIZATION:</strong> By design, we process zero Personal Identifiable Information (PII). SocioCipher is inherently compliant with Article 5(1)(c) of the GDPR.</li>
                <li style={{ marginBottom: '1rem' }}><strong style={{ color: 'var(--color-text)' }}>UN_HUMAN_RIGHTS:</strong> Our mission aligns with Article 19 of the Universal Declaration of Human Rights—the right to seek, receive, and impart information and ideas through any media and regardless of frontiers.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="mono">
              <span style={{ color: 'var(--color-text-secondary)' }}>04_</span> MODERATION_&_ENFORCEMENT
            </h2>
            <div style={{ background: 'var(--color-bg-alt)', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                To preserve the network, SocioCipher utilizes a Security Audit Log system that monitors for behavioral patterns indicative of platform abuse. If your transmissions are flagged as practical threats or platform-destabilizing attacks (DDoS), the system will automatically revoke your session and block your ephemeral hash.
              </p>
            </div>
          </section>
        </div>

        <footer style={{ marginTop: '6rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }} className="mono">
            SOCIOCIPHER // SECURED_BY_VOLATILE_MEMORY_DELETION // EST_2024
          </p>
          <div style={{ marginTop: '1rem' }}>
            <a href="/" style={{ color: 'var(--color-accent-primary)', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid var(--color-accent-primary)', padding: '0.5rem 1rem' }}>
              RETURN_TO_INTERFACE
            </a>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
}
