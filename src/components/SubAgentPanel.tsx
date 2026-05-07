'use client';

import { KanbanProject } from '@/types/kanban';

export default function SubAgentPanel({ project }: { project: KanbanProject }) {
  const estimatedTokens = Math.max(project.total_phases * 50000, project.tokens_used + 1000);
  const tokenPct = Math.min((project.tokens_used / estimatedTokens) * 100, 100);
  const estimatedCost = Math.max(project.total_phases * 0.15, project.cost_usd + 0.05);

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,212,255,0.1)' }}>
      {/* Phase title */}
      <div style={{ fontSize: 10, color: '#00d4ff', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', letterSpacing: 1, textShadow: '0 0 8px rgba(0,212,255,0.4)' }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#00d4ff', borderRadius: '50%', boxShadow: '0 0 6px #00d4ff', animation: 'pulse 1.2s infinite' }} />
        PHASE {project.current_phase}/{project.total_phases}: {(project.phases[project.current_phase - 1]?.name || 'UNKNOWN').toUpperCase()}
      </div>

      {/* Sub-agent rows */}
      {project.phases.map((phase, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 10, animation: 'materialize 0.4s ease-out', animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}>
          {/* Icon */}
          {phase.status === 'done' ? (
            <div style={{ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', boxShadow: '0 0 6px rgba(0,255,136,0.2)' }}>✓</div>
          ) : phase.status === 'running' ? (
            <div style={{ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.4)', animation: 'iconGlow 1.5s infinite', position: 'relative' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>⟐</span>
              {/* Scanning ring */}
              <div style={{ position: 'absolute', inset: -2, borderRadius: 6, border: '1px solid rgba(0,212,255,0.2)', animation: 'ringPulse 2s infinite' }} />
            </div>
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: 'rgba(0,212,255,0.02)', color: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.05)', animation: 'queuedPulse 3s infinite' }}>○</div>
          )}

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ color: phase.status === 'done' ? 'rgba(0,255,136,0.7)' : phase.status === 'running' ? '#e2e8f0' : 'rgba(0,212,255,0.25)', fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5 }}>
              {phase.name}
            </div>
            <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 8, marginTop: 1, fontFamily: 'monospace', letterSpacing: 0.5 }}>
              {phase.status === 'done' ? 'COMPLETED' : phase.status === 'running' ? 'PROCESSING...' : 'QUEUED'}
            </div>
          </div>

          {/* Progress bar with shimmer */}
          <div style={{ width: 55, height: 3, background: 'rgba(0,212,255,0.06)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%',
              borderRadius: 2,
              width: phase.status === 'done' ? '100%' : phase.status === 'running' ? '55%' : '0%',
              background: phase.status === 'done'
                ? 'linear-gradient(90deg, #00ff88, #00ff88)'
                : phase.status === 'running'
                ? 'linear-gradient(90deg, #0066ff, #00d4ff)'
                : 'transparent',
              transition: 'width 0.5s',
              boxShadow: phase.status === 'done' ? '0 0 4px #00ff8866' : phase.status === 'running' ? '0 0 6px #00d4ff66' : 'none',
            }} />
            {/* Shimmer effect for running */}
            {phase.status === 'running' && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)', backgroundSize: '200px 100%', animation: 'shimmer 2s infinite linear' }} />
            )}
          </div>
        </div>
      ))}

      {/* Token meter */}
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 3, background: 'rgba(0,212,255,0.06)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #00ff88, #00d4ff)', borderRadius: 2, width: `${tokenPct}%`, transition: 'width 0.5s', boxShadow: '0 0 6px rgba(0,212,255,0.3)' }} />
          {/* Shimmer */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200px 100%', animation: 'shimmer 3s infinite linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(0,212,255,0.3)', marginTop: 3, fontFamily: 'monospace', letterSpacing: 0.5 }}>
          <span>{(project.tokens_used / 1000).toFixed(0)}K TOKENS</span>
          <span>~{(estimatedTokens / 1000).toFixed(0)}K EST</span>
        </div>
      </div>

      {/* Cost */}
      <div style={{ fontSize: 8, color: 'rgba(0,212,255,0.3)', marginTop: 3, fontFamily: 'monospace', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between' }}>
        <span>${project.cost_usd.toFixed(2)} SPENT</span>
        <span>~${estimatedCost.toFixed(2)} EST</span>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.4); }
        }
        @keyframes iconGlow {
          0%, 100% { box-shadow: 0 0 4px rgba(0,212,255,0.3); }
          50% { box-shadow: 0 0 16px rgba(0,212,255,0.6), 0 0 32px rgba(0,212,255,0.15); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        @keyframes queuedPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.15; }
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        @keyframes materialize {
          0% { opacity: 0; transform: scaleX(0.5); filter: blur(3px); }
          60% { opacity: 0.7; filter: blur(1px); }
          100% { opacity: 1; transform: scaleX(1); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
