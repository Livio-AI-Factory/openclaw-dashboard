'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimatedCounter from '@/components/AnimatedCounter';
import ProgressBar from '@/components/ProgressBar';
import RocketAnimation from '@/components/RocketAnimation';
import { getBadge, getProgressPercent } from '@/lib/badges';

interface Employee {
  name: string;
  agentId: string;
  weeklyHours: number;
  estimatedHours: number;
  totalTokens: number;
  weeklyTokens: number;
  totalCost: number;
  weeklyCost: number;
  streak: number;
  rank: number;
  lastActive: string;
  sessionCount: number;
}

const PODIUM_STYLES = [
  { color: '#ffaa00', border: 'rgba(255,170,0,0.4)', glow: '0 0 20px rgba(255,170,0,0.3)', symbol: 'I' },
  { color: '#00d4ff', border: 'rgba(0,212,255,0.4)', glow: '0 0 20px rgba(0,212,255,0.3)', symbol: 'II' },
  { color: '#00ff88', border: 'rgba(0,255,136,0.4)', glow: '0 0 20px rgba(0,255,136,0.3)', symbol: 'III' },
];

export default function LeaderboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'total'>('weekly');

  useEffect(() => {
    const loadData = () => {
      fetch('/openclaw-dashboard/data/usage.json')
        .then(r => r.json())
        .then(data => {
          setEmployees(data.employees);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#060b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#00d4ff', fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, animation: 'pulse 1.5s infinite' }}>LOADING LEADERBOARD...</div>
      </main>
    );
  }

  const sorted = [...employees].sort((a, b) =>
    viewMode === 'weekly' ? b.weeklyHours - a.weeklyHours : b.estimatedHours - a.estimatedHours
  );

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const getHours = (e: Employee) => viewMode === 'weekly' ? e.weeklyHours : e.estimatedHours;
  const getCost = (e: Employee) => viewMode === 'weekly' ? e.weeklyCost : e.totalCost;

  const totalHours = employees.reduce((a, e) => a + getHours(e), 0);
  const goalMet = employees.filter(e => getHours(e) >= 10).length;
  const avgHours = totalHours / employees.length;

  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <main style={{ minHeight: '100vh', background: '#060b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Grid overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Scan line overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.008) 2px, rgba(0,212,255,0.008) 4px)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#00d4ff', letterSpacing: 4, textShadow: '0 0 10px rgba(0,212,255,0.5)', margin: 0 }}>
            LEADERBOARD
          </h1>
          <div style={{ fontSize: 11, color: 'rgba(0,212,255,0.4)', fontFamily: 'monospace', letterSpacing: 2, marginTop: 6 }}>
            TOP PERFORMERS {viewMode === 'weekly' ? 'THIS WEEK' : 'ALL TIME'}
          </div>

          {/* View toggle */}
          <div style={{ display: 'inline-flex', marginTop: 16, background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: 8, padding: 3 }}>
            {(['weekly', 'total'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  background: viewMode === mode ? 'rgba(0,212,255,0.1)' : 'transparent',
                  border: viewMode === mode ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent',
                  color: viewMode === mode ? '#00d4ff' : 'rgba(0,212,255,0.4)',
                  boxShadow: viewMode === mode ? '0 0 10px rgba(0,212,255,0.15)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <Link href="/" style={{ fontSize: 11, color: 'rgba(0,212,255,0.4)', fontFamily: 'monospace', textDecoration: 'none', letterSpacing: 1 }}>
              ⟐ HOME
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'TOTAL HOURS', value: totalHours.toFixed(1), color: '#00d4ff' },
            { label: 'HIT 10HR GOAL', value: `${employees.length > 0 ? Math.round((goalMet / employees.length) * 100) : 0}%`, color: '#00ff88' },
            { label: 'AVG HOURS', value: avgHours.toFixed(1), color: '#ffaa00' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,212,255,0.03)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 10,
              padding: '12px 18px',
              flex: 1,
              minWidth: 120,
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: s.color, textShadow: `0 0 15px ${s.color}55`, fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 40 }}>
            {podiumOrder.map((emp, idx) => {
              const actualRank = idx === 0 ? 1 : idx === 1 ? 0 : 2;
              const podium = PODIUM_STYLES[actualRank];
              const hours = getHours(emp);
              const badge = getBadge(hours);
              const isPower = hours >= 10;
              const heights = ['180px', '220px', '150px'];

              return (
                <div key={emp.agentId} style={{
                  background: 'rgba(0,212,255,0.02)',
                  border: `1px solid ${podium.border}`,
                  borderRadius: 12,
                  padding: '20px 16px',
                  minWidth: 150,
                  height: heights[idx],
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  backdropFilter: 'blur(10px)',
                  boxShadow: podium.glow,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Scan line inside */}
                  <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.05), transparent)', animation: 'scanLine 4s infinite linear' }} />
                  {/* Rank circle */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: `2px solid ${podium.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, fontFamily: 'monospace',
                    color: podium.color,
                    boxShadow: `0 0 15px ${podium.color}44`,
                    marginBottom: 8,
                  }}>
                    {actualRank + 1}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', textAlign: 'center', position: 'relative' }}>{emp.name}</div>
                  <span style={{ fontSize: 10, marginTop: 4, padding: '2px 8px', borderRadius: 10, fontFamily: 'monospace', letterSpacing: 0.5, background: badge.bgColor, color: badge.color, position: 'relative' }}>
                    {badge.name}
                  </span>
                  <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 18, fontWeight: 700, marginTop: 6, position: 'relative' }}>{hours.toFixed(1)}h</div>
                  <div style={{ marginTop: 6, width: '80%', position: 'relative' }}>
                    <ProgressBar percent={getProgressPercent(hours)} color={badge.color} className="" />
                  </div>
                  {isPower && <div style={{ marginTop: 4, position: 'relative' }}><RocketAnimation /></div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Remaining ranks */}
        {rest.length > 0 && (
          <div style={{
            background: 'rgba(0,212,255,0.02)',
            border: '1px solid rgba(0,212,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 32,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', letterSpacing: 2, fontFamily: 'monospace' }}>RANKINGS</div>
            </div>
            {rest.map((emp, idx) => {
              const hours = getHours(emp);
              const badge = getBadge(hours);
              const cost = getCost(emp);
              const isPower = hours >= 10;

              return (
                <div
                  key={emp.agentId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(0,212,255,0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,212,255,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  {/* Rank */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1px solid rgba(0,212,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontFamily: 'monospace', color: 'rgba(0,212,255,0.6)',
                  }}>
                    {idx + 4}
                  </div>
                  <span style={{ color: '#e2e8f0', fontWeight: 500, flex: 1, fontSize: 14 }}>{emp.name}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontFamily: 'monospace', background: badge.bgColor, color: badge.color }}>
                    {badge.name}
                  </span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13, width: 50, textAlign: 'right' }}>{hours.toFixed(1)}h</span>
                  <div style={{ width: 80 }}>
                    <ProgressBar percent={getProgressPercent(hours)} color={badge.color} className="" />
                  </div>
                  <span style={{ color: '#ffaa00', fontSize: 12, width: 50, textAlign: 'right', fontFamily: 'monospace' }}>${cost.toFixed(2)}</span>
                  {isPower && <RocketAnimation />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanLine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </main>
  );
}
