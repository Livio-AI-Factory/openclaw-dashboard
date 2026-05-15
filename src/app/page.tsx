'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimatedCounter from '@/components/AnimatedCounter';

interface Summary {
  totalEmployees: number;
  totalWeeklyHours: number;
  goalMetCount: number;
  totalTokens: number;
  totalCost: number;
}

const NAV_CARDS = [
  { icon: '◈', title: 'Home', desc: 'System overview & stats', href: '/', xp: 0 },
  { icon: '⬡', title: 'HR', desc: 'Team analytics & insights', href: '/hr', xp: 50 },
  { icon: '◉', title: 'Leaderboard', desc: 'Top performers & rankings', href: '/leaderboard', xp: 25 },
  { icon: '⟐', title: 'My Dashboard', desc: 'Your personal AI stats & progress', href: '/me', xp: 100 },
];

export default function LandingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const loadData = () => {
      fetch('/openclaw-dashboard/data/usage.json')
        .then(r => r.json())
        .then(data => setSummary(data.summary))
        .catch(() => {});
    };
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#060b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Grid background overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Scan line overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.008) 2px, rgba(0,212,255,0.008) 4px)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#00d4ff', letterSpacing: 6, textShadow: '0 0 10px rgba(0,212,255,0.5)', margin: 0 }}>
            LIVIO AI INFRASTRUCTURE
          </h1>
          <div style={{ fontSize: 14, color: 'rgba(0,212,255,0.5)', letterSpacing: 3, fontFamily: 'monospace', marginTop: 10 }}>
            MISSION CONTROL // DASHBOARD
          </div>
        </div>

        {/* Cyan accent line */}
        <div style={{ width: '60%', maxWidth: 600, height: 1, background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)', boxShadow: '0 0 10px rgba(0,212,255,0.3)', marginBottom: 32 }} />

        {/* Stats row */}
        {summary && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
            {[
              { label: 'ACTIVE USERS', value: summary.totalEmployees, color: '#00d4ff', icon: '◉' },
              { label: 'WEEKLY HOURS', value: summary.totalWeeklyHours.toFixed(1), color: '#00ff88', icon: '◈' },
              { label: 'POWER USERS', value: summary.goalMetCount, color: '#ffaa00', icon: '⬡' },
              { label: 'TOTAL COST', value: `$${summary.totalCost.toFixed(2)}`, color: '#ff3366', icon: '◆' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(0,212,255,0.03)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 10,
                padding: '12px 18px',
                minWidth: 140,
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'monospace' }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6, color: s.color, textShadow: `0 0 15px ${s.color}55`, fontFamily: 'monospace' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 900, width: '100%' }}>
          {NAV_CARDS.map(card => (
            <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(0,212,255,0.02)',
                border: '1px solid rgba(0,212,255,0.08)',
                borderRadius: 14,
                padding: '28px 24px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.5)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 30px rgba(0,212,255,0.15), inset 0 0 30px rgba(0,212,255,0.03)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px) scale(1.02)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.08)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0) scale(1)';
                }}
              >
                <div style={{ fontSize: 40, color: '#00d4ff', marginBottom: 14, fontFamily: 'monospace', textShadow: '0 0 15px rgba(0,212,255,0.4)' }}>{card.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(0,212,255,0.5)', fontFamily: 'monospace' }}>{card.desc}</div>
                <div style={{ marginTop: 12, padding: '4px 10px', borderRadius: 6, display: 'inline-block', border: '1px solid rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.04)', color: '#00ff88', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 }}>+{card.xp} XP</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, fontSize: 10, color: 'rgba(0,212,255,0.25)', fontFamily: 'monospace', letterSpacing: 1 }}>
          POWERED BY OPENCLAW · LIVIO AI
        </div>
      </div>
    </main>
  );
}
