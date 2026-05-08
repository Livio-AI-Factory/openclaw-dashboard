'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/openclaw-dashboard', label: 'HOME', icon: '◈' },
  { href: '/openclaw-dashboard/hr', label: 'HR', icon: '⬡' },
  { href: '/openclaw-dashboard/leaderboard', label: 'RANKINGS', icon: '◉' },
  { href: '/openclaw-dashboard/watchdog', label: 'WATCHDOG', icon: '◆' },
  { href: '/openclaw-dashboard/me', label: 'MY DASH', icon: '⟐' },
  { href: '/openclaw-dashboard/kanban', label: 'KANBAN', icon: '✓' },
];

export default function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav style={{
        background: 'linear-gradient(180deg, #0a0f1e, #060b18)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Logo + Title */}
        <Link href="/openclaw-dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, textDecoration: 'none' }}>
          <img
            src="/openclaw-dashboard/logo.png"
            alt="Livio"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '2px solid rgba(0,212,255,0.5)',
              boxShadow: '0 0 12px rgba(0,212,255,0.3)',
            }}
          />
          <span style={{
            color: '#00d4ff',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '2px',
            whiteSpace: 'nowrap',
            textShadow: '0 0 10px rgba(0,212,255,0.3)',
          }}>
            LIVIO AI
          </span>
        </Link>

        {/* Center: Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          flex: 1,
          justifyContent: 'center',
        }}
          className="nav-links-desktop"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/openclaw-dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '1.5px',
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderBottom: isActive ? '2px solid rgba(0,212,255,0.7)' : '2px solid transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,212,255,0.4)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span style={{ fontSize: 14 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {user && (
            <>
              <span style={{
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'monospace',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}>
                {user.name}
              </span>
              {isAdmin && (
                <span style={{
                  color: '#ff3366',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  border: '1px solid rgba(255,51,102,0.5)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255,51,102,0.08)',
                  textShadow: '0 0 8px rgba(255,51,102,0.3)',
                }}>
                  ADMIN
                </span>
              )}
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: '4px',
                  color: '#00d4ff',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.7)';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 0 10px rgba(0,212,255,0.2)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.3)';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                LOGOUT
              </button>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: '4px',
              color: '#00d4ff',
              padding: '8px 12px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            className="nav-hamburger"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Cyan accent line */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)',
        boxShadow: '0 0 8px rgba(0,212,255,0.2)',
      }} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: '#060b18',
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '10px',
        }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/openclaw-dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  letterSpacing: '1.5px',
                  textDecoration: 'none',
                  padding: '8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: 16 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
}
