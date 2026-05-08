'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    const result = login(email.trim().toLowerCase(), password);
    if (result) {
      setSuccess(true);
    } else {
      setError(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#060b18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Scan-line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)',
        animation: 'scanline 3s linear infinite',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes panelScanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>

      {/* Login panel */}
      <div style={{
        position: 'relative',
        width: '420px',
        maxWidth: '90vw',
        padding: '40px 36px',
        background: 'rgba(6,11,24,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,240,255,0.3)',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0,240,255,0.1), inset 0 0 30px rgba(0,240,255,0.02)',
        overflow: 'hidden',
      }}>
        {/* Panel scan-line */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.6), transparent)',
          animation: 'panelScanline 4s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/openclaw-dashboard/logo.png"
            alt="Livio"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid rgba(0,240,255,0.5)',
              boxShadow: '0 0 15px rgba(0,240,255,0.3)',
              margin: '0 auto',
              display: 'block',
            }}
          />
        </div>

        <h1 style={{
          textAlign: 'center',
          color: '#00f0ff',
          fontSize: '22px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(0,240,255,0.6), 0 0 20px rgba(0,240,255,0.3)',
          letterSpacing: '4px',
          marginBottom: '6px',
        }}>
          IDENTIFY YOURSELF
        </h1>

        <p style={{
          textAlign: 'center',
          color: 'rgba(0,240,255,0.5)',
          fontSize: '10px',
          fontFamily: 'monospace',
          letterSpacing: '3px',
          marginBottom: '30px',
        }}>
          LIVIO AI INFRASTRUCTURE // ACCESS CONTROL
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(false); }}
            placeholder="Enter your Livio email"
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '16px',
              background: 'rgba(0,240,255,0.03)',
              border: '1px solid rgba(0,240,255,0.2)',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontFamily: 'monospace',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(0,240,255,0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(0,240,255,0.2)'}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Access code"
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '20px',
              background: 'rgba(0,240,255,0.03)',
              border: '1px solid rgba(0,240,255,0.2)',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontFamily: 'monospace',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(0,240,255,0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(0,240,255,0.2)'}
          />

          {error && (
            <div style={{
              textAlign: 'center',
              color: '#ff3333',
              fontFamily: 'monospace',
              fontSize: '11px',
              marginBottom: '16px',
              letterSpacing: '2px',
              textShadow: '0 0 10px rgba(255,0,0,0.3)',
            }}>
              ACCESS DENIED — Invalid credentials
            </div>
          )}

          {success && (
            <div style={{
              textAlign: 'center',
              color: '#00ff88',
              fontFamily: 'monospace',
              fontSize: '11px',
              marginBottom: '16px',
              letterSpacing: '2px',
              textShadow: '0 0 10px rgba(0,255,136,0.3)',
            }}>
              ACCESS GRANTED
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid rgba(0,240,255,0.4)',
              borderRadius: '4px',
              color: '#00f0ff',
              fontFamily: 'monospace',
              fontSize: '13px',
              letterSpacing: '3px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.3), inset 0 0 20px rgba(0,240,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(0,240,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)';
            }}
          >
            ACCESS SYSTEM
          </button>
        </form>
      </div>
    </div>
  );
}
