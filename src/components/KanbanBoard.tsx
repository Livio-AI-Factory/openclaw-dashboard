'use client';

import { KanbanPhase, KanbanProject } from '@/types/kanban';
import { useState } from 'react';
import SubAgentPanel from './SubAgentPanel';

const COLUMN_CONFIG = {
  brainstorm: { icon: '◈', color: '#ffaa00', label: 'BRAINSTORM' },
  planning: { icon: '◉', color: '#0066ff', label: 'PLANNING' },
  executing: { icon: '⬡', color: '#00d4ff', label: 'EXECUTING' },
  done: { icon: '◆', color: '#00ff88', label: 'COMPLETE' },
} as const;

type ColumnKey = keyof typeof COLUMN_CONFIG;

const DEPT_COLORS: Record<string, string> = {
  Engineering: '#00d4ff',
  HR: '#ff6eb4',
  Sales: '#ffaa00',
  Design: '#06b6d4',
  Marketing: '#00ff88',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  const days = Math.floor(hrs / 24);
  return `${days}D AGO`;
}

function StatusBadge({ status }: { status: KanbanProject['status'] }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    active: { label: 'ACTIVE', bg: 'rgba(0,212,255,0.12)', fg: '#00d4ff' },
    paused: { label: 'PAUSED', bg: 'rgba(255,170,0,0.12)', fg: '#ffaa00' },
    completed: { label: 'COMPLETE', bg: 'rgba(0,255,136,0.12)', fg: '#00ff88' },
    errored: { label: 'ERROR', bg: 'rgba(255,51,102,0.12)', fg: '#ff3366' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1, background: s.bg, color: s.fg, border: `1px solid ${s.fg}33` }}>
      {s.label}
    </span>
  );
}

function PhaseBar({ phases }: { phases: KanbanPhase[] }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
      {phases.map((p, i) => (
        <div
          key={i}
          style={{
            height: 3,
            borderRadius: 1,
            flex: 1,
            background: p.status === 'done' ? '#00ff88' : p.status === 'running' ? '#00d4ff' : 'rgba(0,212,255,0.08)',
            boxShadow: p.status === 'done' ? '0 0 4px #00ff8866' : p.status === 'running' ? '0 0 8px #00d4ff66' : 'none',
            animation: p.status === 'running' ? 'segPulse 1.2s infinite' : undefined,
          }}
        />
      ))}
    </div>
  );
}

function ProjectCard({ project, isExpanded, onToggle, isNew }: { project: KanbanProject; isExpanded: boolean; onToggle: () => void; isNew?: boolean }) {
  const avatarColor = DEPT_COLORS[project.department] || '#00d4ff';
  const colCfg = COLUMN_CONFIG[project.column as ColumnKey];

  return (
    <div
      onClick={onToggle}
      style={{
        background: isExpanded ? 'rgba(0,212,255,0.04)' : 'rgba(0,212,255,0.02)',
        border: `1px solid ${isExpanded ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.08)'}`,
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s',
        animation: isNew ? 'newCard 5s ease-out forwards' : 'cardSpawn 0.5s ease-out',
        boxShadow: isNew ? '0 0 20px #00d4ff88' : undefined,
        backdropFilter: 'blur(5px)',
      }}
      onMouseEnter={e => {
        if (!isExpanded) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.25)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 15px rgba(0,212,255,0.08)';
        }
      }}
      onMouseLeave={e => {
        if (!isExpanded) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.08)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }
      }}
    >
      {/* Holographic scan line for executing cards */}
      {project.column === 'executing' && (
        <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.04), transparent)', animation: 'scanLine 3s infinite linear', pointerEvents: 'none' }} />
      )}

      {/* Employee line */}
      <div style={{ fontSize: 10, color: 'rgba(0,212,255,0.5)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', letterSpacing: 0.5 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${avatarColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: avatarColor, border: `1px solid ${avatarColor}33` }}>
          {project.employee_name[0]}
        </div>
        {project.employee_name.toUpperCase()} — {project.department.toUpperCase()}
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, lineHeight: 1.4, color: '#e2e8f0', textShadow: isExpanded ? '0 0 8px rgba(0,212,255,0.2)' : 'none' }}>
        {project.title}
      </div>

      {/* Phase bar */}
      <PhaseBar phases={project.phases} />

      {/* Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: 'rgba(0,212,255,0.3)', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={project.status} />
          {isNew && (
            <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 700, background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid #00d4ff44', fontFamily: 'monospace', letterSpacing: 1, animation: 'fadeOut 10s ease-out forwards' }}>NEW</span>
          )}
        </div>
        <span>{timeAgo(project.updated_at)}</span>
      </div>

      {/* Expanded sub-agent panel */}
      {isExpanded && (
        <div style={{ animation: 'panelExpand 0.4s ease-out' }}>
          <SubAgentPanel project={project} />
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard({ projects, filter, newProjectIds }: { projects: KanbanProject[]; filter: string; newProjectIds?: Set<string> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === 'All Workspaces'
    ? projects
    : projects.filter(p => p.department === filter);

  const columns: ColumnKey[] = ['brainstorm', 'planning', 'executing', 'done'];

  return (
    <div className="kanban-board" style={{ display: 'flex', gap: 12, padding: '12px 24px', minHeight: '65vh', overflowX: 'auto' }}>
      {columns.map(col => {
        const cfg = COLUMN_CONFIG[col];
        const colProjects = filtered.filter(p => p.column === col);
        return (
          <div key={col} style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
              padding: '10px 14px',
              fontWeight: 700,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: cfg.color,
              fontFamily: 'monospace',
              borderBottom: `1px solid ${cfg.color}22`,
              marginBottom: 8,
              textShadow: `0 0 10px ${cfg.color}44`,
            }}>
              <span style={{ fontSize: 14 }}>{cfg.icon}</span> {cfg.label}
              <span style={{ background: `${cfg.color}15`, color: cfg.color, fontSize: 10, padding: '1px 7px', borderRadius: 4, border: `1px solid ${cfg.color}22` }}>{colProjects.length}</span>
            </div>
            {/* Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colProjects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isExpanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  isNew={newProjectIds?.has(p.id)}
                />
              ))}
              {colProjects.length === 0 && (
                <div style={{ color: 'rgba(0,212,255,0.15)', fontSize: 10, textAlign: 'center', padding: 30, fontFamily: 'monospace', letterSpacing: 1 }}>NO DATA</div>
              )}
            </div>
          </div>
        );
      })}

      {/* Global keyframes */}
      <style jsx global>{`
        @keyframes segPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes newCard {
          0% { box-shadow: 0 0 20px #00d4ff88; border-color: #00d4ff; }
          100% { box-shadow: none; border-color: rgba(0,212,255,0.08); }
        }
        @keyframes fadeOut {
          0%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes cardSpawn {
          0% { opacity: 0; transform: scale(0.85) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes panelExpand {
          0% { opacity: 0; max-height: 0; }
          100% { opacity: 1; max-height: 500px; }
        }
        @keyframes iconGlow {
          0%, 100% { box-shadow: 0 0 4px rgba(0,212,255,0.3); }
          50% { box-shadow: 0 0 16px rgba(0,212,255,0.6), 0 0 32px rgba(0,212,255,0.15); }
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        @keyframes scanLine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes materialize {
          0% { opacity: 0; transform: scaleX(0.3); filter: blur(4px); }
          50% { opacity: 0.6; filter: blur(1px); }
          100% { opacity: 1; transform: scaleX(1); filter: blur(0); }
        }
        @media (max-width: 768px) {
          .kanban-board { flex-direction: column !important; }
          .kanban-board > div { min-width: auto !important; }
        }
      `}</style>
    </div>
  );
}
