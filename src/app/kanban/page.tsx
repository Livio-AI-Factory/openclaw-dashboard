'use client';

import { useCallback, useEffect, useState } from 'react';
import { KanbanData } from '@/types/kanban';
import KanbanBoard from '@/components/KanbanBoard';

const FILTERS = ['All Workspaces', 'Engineering', 'HR', 'Sales', 'Design'];

function LastSyncFooter({ lastSyncTime }: { lastSyncTime: number }) {
  const [ago, setAgo] = useState('0s');
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - lastSyncTime) / 1000);
      setAgo(s < 1 ? '0s' : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastSyncTime]);
  return (
    <div style={{ textAlign: 'center', padding: 14, fontSize: 10, color: 'rgba(0,212,255,0.25)', fontFamily: 'monospace', letterSpacing: 1 }}>
      LAST SYNC {ago.toUpperCase()} AGO · AUTO-REFRESH 3S
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function KanbanPage() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [filter, setFilter] = useState('All Workspaces');
  const [newProjectIds, setNewProjectIds] = useState<Set<string>>(new Set());
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  useEffect(() => {
    let lastUpdate: string | null = null;
    let prevIds = new Set<string>();

    const loadFull = () => {
      fetch('/openclaw-dashboard/data/kanban.json')
        .then(r => r.json())
        .then((d: KanbanData) => {
          setData(d);
          setLastSyncTime(Date.now());
          // Detect new projects
          const currentIds = new Set(d.projects.map(p => p.id));
          const added = new Set<string>();
          currentIds.forEach(id => { if (!prevIds.has(id)) added.add(id); });
          if (prevIds.size > 0 && added.size > 0) setNewProjectIds(added);
          prevIds = currentIds;
          // Clear NEW badges after 10s
          if (added.size > 0) setTimeout(() => setNewProjectIds(prev => {
            const next = new Set(prev); added.forEach(id => next.delete(id)); return next;
          }), 10000);
        })
        .catch(() => {});
    };

    const poll = () => {
      fetch('/openclaw-dashboard/data/kanban-updated.json')
        .then(r => r.json())
        .then((u: { last_update: string }) => {
          if (lastUpdate === null || u.last_update !== lastUpdate) {
            lastUpdate = u.last_update;
            loadFull();
          }
        })
        .catch(() => loadFull()); // fallback if tiny file missing
    };

    loadFull();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  const projects = data?.projects || [];
  const activeCount = projects.filter(p => p.status === 'active').length;
  const runningNow = projects.filter(p => p.phases.some(ph => ph.status === 'running')).length;
  const todayCost = projects.reduce((sum, p) => sum + p.cost_usd, 0);
  const stuckCount = projects.filter(p => {
    const diff = Date.now() - new Date(p.updated_at).getTime();
    return diff > 86400000 && p.status === 'active';
  }).length;

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

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Top bar */}
        <div style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #060b18 100%)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Logo */}
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,212,255,0.4)', boxShadow: '0 0 20px rgba(0,212,255,0.2)', animation: 'logoPulse 3s infinite', position: 'relative' }}>
              <img src="/openclaw-dashboard/logo.png" alt="OpenClaw" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#00d4ff', letterSpacing: 3, textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>MISSION CONTROL</div>
              <div style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', letterSpacing: 2, fontFamily: 'monospace' }}>OPENCLAW // LIVIO</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#00ff88', fontFamily: 'monospace' }}>
            <div style={{ width: 8, height: 8, background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 8px #00ff88', animation: 'pulse 1.5s infinite' }} />
            LIVE — {activeCount} ACTIVE
          </div>
        </div>

        {/* Cyan accent line */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)', boxShadow: '0 0 10px rgba(0,212,255,0.3)' }} />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, padding: '14px 24px', flexWrap: 'wrap' }}>
          {[
            { label: 'ACTIVE PROJECTS', value: activeCount, color: '#00d4ff' },
            { label: 'RUNNING NOW', value: runningNow, color: '#00ff88' },
            { label: "TODAY'S COST", value: `$${todayCost.toFixed(2)}`, color: '#ffaa00' },
            { label: 'STUCK (>24H)', value: stuckCount, color: '#ff3366' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,212,255,0.03)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 10,
              padding: '12px 18px',
              flex: 1,
              minWidth: 140,
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Scan line inside card */}
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.05), transparent)', animation: 'scanLine 4s infinite linear' }} />
              <div style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'monospace', position: 'relative' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: s.color, textShadow: `0 0 15px ${s.color}55`, position: 'relative', fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 24px 12px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.02)',
                border: `1px solid ${filter === f ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.08)'}`,
                color: filter === f ? '#00d4ff' : 'rgba(0,212,255,0.4)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'monospace',
                letterSpacing: 1,
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                boxShadow: filter === f ? '0 0 10px rgba(0,212,255,0.15)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Board */}
        <KanbanBoard projects={projects} filter={filter} newProjectIds={newProjectIds} />

        {/* Footer */}
        <LastSyncFooter lastSyncTime={lastSyncTime} />
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.2); }
          50% { box-shadow: 0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.1); }
        }
        @keyframes scanLine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @media (max-width: 768px) {
          .kanban-board { flex-direction: column !important; padding: 12px !important; }
        }
      `}</style>
    </main>
  );
}
