'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/openclaw-dashboard', label: 'HOME' },
  { href: '/openclaw-dashboard/hr', label: 'HR' },
  { href: '/openclaw-dashboard/leaderboard', label: 'LEADERBOARD' },
  { href: '/openclaw-dashboard/watchdog', label: 'WATCHDOG' },
  { href: '/openclaw-dashboard/my-dashboard', label: 'MY DASHBOARD' },
  { href: '/openclaw-dashboard/kanban', label: 'KANBAN' },
];

export default function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav style={{
        background: 'linear-gradient(180deg, #0a0f1e, #060b18)',
        borderBottom: '1px solid rgba(0,240,255,0.15)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <img
            src="/openclaw-dashboard/logo.png"
            alt="Livio"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid rgba(0,240,255,0.5)',
              boxShadow: '0 0 10px rgba(0,240,255,0.3)',
            }}
          />
          <span style={{
            color: 'rgba(0,240,255,0.7)',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '2px',
            whiteSpace: 'nowrap',
          }}>
            LIVIO AI INFRASTRUCTURE
          </span>
        </div>

        {/* Center: Nav Links (desktop) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
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
                  color: isActive ? '#00f0ff' : 'rgba(255,255,255,0.4)',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderBottom: isActive ? '2px solid rgba(0,240,255,0.6)' : '2px solid transparent',
                  textShadow: isActive ? '0 0 8px rgba(0,240,255,0.4)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {user && (
            <>
              <span style={{
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'monospace',
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}>
                {user.name}
              </span>
              {isAdmin && (
                <span style={{
                  color: '#00f0ff',
                  fontFamily: 'monospace',
                  fontSize: '8px',
                  letterSpacing: '1px',
                  border: '1px solid rgba(0,240,255,0.4)',
                  padding: '1px 5px',
                  borderRadius: '2px',
                }}>
                  ADMIN
                </span>
              )}
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0,240,255,0.3)',
                  borderRadius: '3px',
                  color: '#00f0ff',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  letterSpacing: '1px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
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
              border: '1px solid rgba(0,240,255,0.3)',
              borderRadius: '3px',
              color: '#00f0ff',
              padding: '6px 10px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '14px',
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
        background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)',
      }} />

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: '#060b18',
          borderBottom: '1px solid rgba(0,240,255,0.15)',
          padding: '12px 24px',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '8px',
        }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/openclaw-dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: isActive ? '#00f0ff' : 'rgba(255,255,255,0.4)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  letterSpacing: '1.5px',
                  textDecoration: 'none',
                  padding: '6px 0',
                }}
              >
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
