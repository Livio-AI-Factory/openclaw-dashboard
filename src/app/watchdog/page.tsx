'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import ParticleBackground from '@/components/ParticleBackground';
import GlowCard from '@/components/GlowCard';

interface Incident {
  type: string;
  severity: string;
  workspace: string;
  metric: number | string;
  threshold: number | string;
  message: string;
  timestamp?: string;
}

interface FixerEntry {
  id?: string;
  timestamp: string;
  fix_type: string;
  workspace: string;
  status: 'started' | 'success' | 'failed' | 'skipped';
  message: string;
  details?: Record<string, any>;
}

interface ScanData {
  scan_time: string;
  workspaces_scanned: number;
  incidents: Incident[];
  auto_fixes: any[];
  fixerResults?: {
    fixer_time: string;
    fixes_attempted: number;
    fixes_success: number;
    fixes_failed: number;
    fixes_skipped: number;
  };
  fixerLog: FixerEntry[];
}

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', icon: '🚨', label: 'Critical', glow: '0 0 20px rgba(239,68,68,0.3)' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', icon: '🟡', label: 'Warning', glow: '0 0 20px rgba(245,158,11,0.3)' },
  info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', icon: 'ℹ️', label: 'Info', glow: '0 0 20px rgba(59,130,246,0.3)' },
};

const STATUS_CONFIG = {
  started: { color: '#a855f7', icon: '⚡', label: 'Fixing' },
  success: { color: '#22c55e', icon: '✅', label: 'Fixed' },
  failed: { color: '#ef4444', icon: '❌', label: 'Failed' },
  skipped: { color: '#6b7280', icon: '⏭️', label: 'Skipped' },
};

const TYPE_ICONS: Record<string, string> = {
  cost_spike: '💰', token_flood: '🔢', daily_spend: '💳', session_cost: '💵',
  employee_budget: '📊', tool_loop: '🔄', error_storm: '❌', idle_session: '⏳',
  zombie_session: '🧟', unusual_hours: '🌙', expensive_model: '💸',
  ram_high: '🧠', cpu_high: '⚙️', container_restarts: '🔄',
};

const METRIC_NAMES: Record<string, string> = {
  cost_spike: 'Hourly Cost Spike', token_flood: 'Token Flood', daily_spend: 'Daily Company Spend',
  session_cost: 'Session Cost', employee_budget: 'Employee Budget', tool_loop: 'Tool Loop',
  error_storm: 'Error Storm', idle_session: 'Idle Session', zombie_session: 'Zombie Session',
  unusual_hours: 'Unusual Hours', expensive_model: 'Expensive Model',
  ram_high: 'RAM High', cpu_high: 'CPU High', container_restarts: 'Container Restarts',
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Calcutta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: 'short' });
  } catch { return iso; }
}

function ws(ws: string) {
  return ws.replace('_workspace', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Animated scanning line component
function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent animate-scan-line" />
    </div>
  );
}

// Pulsing dot for live indicator
function LiveDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
    </span>
  );
}

// Fix flow animation: Watchdog -> Fixer -> Resolved
function FixFlowAnimation({ incident, fixerEntry }: { incident: Incident; fixerEntry?: FixerEntry }) {
  const isFixed = fixerEntry?.status === 'success';
  const isFixing = fixerEntry?.status === 'started';
  const isFailed = fixerEntry?.status === 'failed';

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-700 ${
        isFixed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        <span className={isFixed ? '' : 'animate-pulse'}>{isFixed ? '🛡️' : '⚠️'}</span>
        <span>Watchdog</span>
      </div>

      {/* Arrow with animation */}
      <div className={`flex items-center ${isFixing ? 'animate-pulse' : ''}`}>
        <div className={`w-8 h-[2px] transition-all duration-700 ${
          isFixed ? 'bg-green-500' : isFixing ? 'bg-purple-500 animate-pulse' : 'bg-white/20'
        }`} />
        <div className={`w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent transition-all duration-700 ${
          isFixed ? 'border-l-[6px] border-l-green-500' : isFixing ? 'border-l-[6px] border-l-purple-500' : 'border-l-[6px] border-l-white/20'
        }`} />
      </div>

      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-700 ${
        isFixed ? 'bg-green-500/20 text-green-400' : isFixing ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 'bg-white/5 text-white/30'
      }`}>
        <span>{isFixed ? '🔧' : isFixing ? '⚡' : '🔧'}</span>
        <span>Fixer</span>
      </div>

      <div className={`flex items-center ${
        isFixed ? '' : ''
      }`}>
        <div className={`w-8 h-[2px] transition-all duration-700 ${
          isFixed ? 'bg-green-500' : 'bg-white/10'
        }`} />
        <div className={`w-0 h-0 transition-all duration-700 ${
          isFixed ? 'border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-green-500' : 'border-l-[6px] border-l-white/10 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent'
        }`} />
      </div>

      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-700 ${
        isFixed ? 'bg-green-500/20 text-green-400' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/30'
      }`}>
        <span className={isFixed ? 'animate-bounce' : ''}>{isFixed ? '✅' : isFailed ? '❌' : '🔄'}</span>
        <span>{isFixed ? 'Resolved' : isFailed ? 'Failed' : 'Pending'}</span>
      </div>
    </div>
  );
}

// Radar sweep animation
function RadarSweep() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <div className="absolute inset-0 rounded-full border border-purple-500/20" />
      <div className="absolute inset-3 rounded-full border border-purple-500/15" />
      <div className="absolute inset-6 rounded-full border border-purple-500/10" />
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left animate-radar-sweep"
          style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.8), transparent)' }} />
      </div>
      <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500 animate-pulse" />
    </div>
  );
}

export default function WatchdogPage() {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [scanCount, setScanCount] = useState(0);
  const prevIncidentCount = useRef(0);

  useEffect(() => {
    const loadData = () => {
      fetch('/openclaw-dashboard/data/guardian.json')
        .then(r => r.json())
        .then(data => {
          if (data.incidents?.length !== prevIncidentCount.current) {
            prevIncidentCount.current = data.incidents?.length || 0;
          }
          setScanData(data);
          setLoading(false);
          setLastRefresh(new Date());
          setScanCount(c => c + 1);
        })
        .catch(() => setLoading(false));
    };
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <ParticleBackground />
        <div className="relative z-10 text-center">
          <RadarSweep />
          <div className="text-white text-xl animate-pulse">Initializing Watchdog...</div>
        </div>
      </main>
    );
  }

  const incidents = scanData?.incidents || [];
  const fixerLog = scanData?.fixerLog || [];
  const fixerResults = scanData?.fixerResults;
  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.severity === filter);

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const warningCount = incidents.filter(i => i.severity === 'warning').length;
  const infoCount = incidents.filter(i => i.severity === 'info').length;

  const incidentsByType: Record<string, Incident[]> = {};
  incidents.forEach(i => {
    if (!incidentsByType[i.type]) incidentsByType[i.type] = [];
    incidentsByType[i.type].push(i);
  });

  // Map fixer log entries to incident types + workspaces
  const fixerMap: Record<string, FixerEntry> = {};
  fixerLog.forEach(f => {
    const key = `${f.fix_type}_${f.workspace}`;
    fixerMap[key] = f; // Last entry wins (most recent)
  });

  const affectedWorkspaces = [...new Set(incidents.map(i => i.workspace))].filter(w => w !== 'SYSTEM');
  const totalFixes = fixerResults?.fixes_success || 0;
  const totalFailed = fixerResults?.fixes_failed || 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 p-4 md:p-8 relative overflow-hidden">
      <ParticleBackground />
      <ScanLine />

      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with radar */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-6">
            <RadarSweep />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold text-white animate-fade-in">🛡️ Watchdog</h1>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                  <LiveDot />
                  <span className="text-green-400 text-xs font-bold">LIVE</span>
                </div>
              </div>
              <p className="text-purple-200/60 mt-1">Real-time anomaly detection across {scanData?.workspaces_scanned || 0} workspaces</p>
              <p className="text-purple-300/30 text-xs mt-1">
                Scan #{scanCount} • Last: {lastRefresh.toLocaleTimeString('en-IN', { timeZone: 'Asia/Calcutta' })} IST
                {scanData?.scan_time && <span> • Data: {formatTime(scanData.scan_time)}</span>}
              </p>
            </div>
          </div>
          <Link href="/" className="text-purple-300 hover:text-white text-sm transition-colors">← Home</Link>
        </div>

        {/* Fixer Pipeline Status */}
        <div className="mb-8 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <span className="animate-pulse">⚡</span> Fixer Pipeline
            </h3>
            <span className="text-xs text-purple-300/50">
              {fixerResults ? `Last run: ${formatTime(fixerResults.fixer_time)}` : 'Awaiting first fix'}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/60 text-sm">Detected</span>
              <span className="text-white font-mono">{incidents.length}</span>
            </div>
            <div className="text-purple-500">→</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-white/60 text-sm">Analyzed</span>
              <span className="text-white font-mono">{fixerResults?.fixes_attempted || 0}</span>
            </div>
            <div className="text-purple-500">→</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-white/60 text-sm">Fixed</span>
              <span className="text-green-400 font-mono font-bold">{totalFixes}</span>
            </div>
            <div className="text-purple-500">→</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-white/60 text-sm">Verified</span>
              <span className="text-blue-400 font-mono">{totalFixes > 0 ? '✓' : '—'}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: incidents.length > 0 ? `${(totalFixes / incidents.length) * 100}%` : '0%',
                background: 'linear-gradient(90deg, #a855f7, #22c55e)',
                boxShadow: '0 0 10px rgba(168,85,247,0.5)',
              }}
            />
          </div>
        </div>

        {/* Status Cards with animated counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { value: criticalCount, label: '🚨 Critical', color: '#ef4444', glow: '0 0 30px rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.12)' },
            { value: warningCount, label: '🟡 Warnings', color: '#f59e0b', glow: '0 0 30px rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.12)' },
            { value: infoCount, label: 'ℹ️ Info', color: '#3b82f6', glow: '0 0 30px rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.12)' },
            { value: totalFixes, label: '🔧 Fixed', color: '#22c55e', glow: '0 0 30px rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.12)' },
            { value: affectedWorkspaces.length, label: '👤 Affected', color: '#a855f7', glow: '0 0 30px rgba(168,85,247,0.3)', bg: 'rgba(168,85,247,0.12)' },
          ].map((card, idx) => (
            <GlowCard
              key={card.label}
              className="text-center !p-4 animate-slide-up"
              glowColor={card.glow.replace('0 0 30px ', '').replace(')', '')}
              style={{ animationDelay: `${idx * 0.1}s` } as React.CSSProperties}
            >
              <div className="text-3xl font-bold transition-all duration-500" style={{ color: card.color, textShadow: card.glow }}>
                {card.value}
              </div>
              <div className="text-purple-300/60 text-sm">{card.label}</div>
            </GlowCard>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'critical', 'warning', 'info'].map(f => {
            const count = f === 'all' ? incidents.length : incidents.filter(i => i.severity === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === f
                    ? f === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/10'
                      : f === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : f === 'info' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                    : 'bg-white/5 text-purple-300/50 hover:text-white border border-transparent hover:border-white/10'
                }`}
              >
                {f === 'all' ? '🔍 All' : SEVERITY_CONFIG[f as keyof typeof SEVERITY_CONFIG]?.icon + ' ' + SEVERITY_CONFIG[f as keyof typeof SEVERITY_CONFIG]?.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/10">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Incident Feed */}
        <div className="space-y-3 mb-8">
          {filtered.length === 0 ? (
            <GlowCard glowColor="rgba(34,197,94,0.3)" className="text-center py-16">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h2 className="text-2xl font-bold text-white mb-2">All Clear</h2>
              <p className="text-purple-300/60">No {filter !== 'all' ? filter : ''} incidents detected</p>
              <p className="text-green-400/40 text-sm mt-4 animate-pulse">Monitoring 39 workspaces...</p>
            </GlowCard>
          ) : (
            filtered.map((incident, idx) => {
              const sev = SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
              const typeIcon = TYPE_ICONS[incident.type] || '⚠️';
              const fixKey = `${incident.type}_${incident.workspace}`;
              const fixerEntry = fixerMap[fixKey];
              return (
                <div
                  key={`${incident.type}-${incident.workspace}-${idx}`}
                  className="relative rounded-xl border p-4 transition-all duration-300 hover:scale-[1.005] animate-slide-in"
                  style={{
                    background: sev.bg,
                    borderColor: sev.border,
                    borderLeftWidth: '4px',
                    borderLeftColor: sev.color,
                    animationDelay: `${idx * 0.05}s`,
                    boxShadow: incident.severity === 'critical' ? sev.glow : 'none',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="text-3xl animate-float" style={{ animationDelay: `${idx * 0.2}s` }}>{typeIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-black tracking-wider px-2 py-0.5 rounded" style={{ color: sev.color, background: sev.bg }}>
                          {sev.label.toUpperCase()}
                        </span>
                        <span className="text-white/80 text-sm font-medium">{METRIC_NAMES[incident.type] || incident.type}</span>
                      </div>
                      <p className="text-white text-sm mb-3">{incident.message}</p>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        {incident.workspace !== 'SYSTEM' && (
                          <span className="px-2 py-1 rounded-full bg-white/10 text-purple-300 font-mono text-xs">
                            👤 {ws(incident.workspace)}
                          </span>
                        )}
                        {incident.metric !== undefined && (
                          <span className="text-white/50">
                            Value: <span className="text-white font-mono font-bold">{typeof incident.metric === 'number' ? incident.metric.toLocaleString() : incident.metric}</span>
                            {incident.threshold !== undefined && (
                              <> / Limit: <span className="font-mono">{incident.threshold}</span></>
                            )}
                          </span>
                        )}
                        {incident.timestamp && (
                          <span className="text-white/30 ml-auto">{formatTime(incident.timestamp)}</span>
                        )}
                      </div>
                      {/* Fix flow animation */}
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <FixFlowAnimation incident={incident} fixerEntry={fixerEntry} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fixer Activity Log */}
        {fixerLog.length > 0 && (
          <GlowCard className="mb-8" glowColor="rgba(34,197,94,0.2)">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="animate-spin-slow">🔧</span> Fixer Activity Log
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {[...fixerLog].reverse().slice(0, 20).map((fix, idx) => {
                const sc = STATUS_CONFIG[fix.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.skipped;
                return (
                  <div
                    key={`${fix.fix_type}-${fix.workspace}-${idx}`}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all animate-fade-in ${
                      fix.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                      fix.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                      fix.status === 'started' ? 'bg-purple-500/5 border-purple-500/20 animate-pulse' :
                      'bg-white/5 border-white/10'
                    }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <span className="text-lg mt-0.5">{sc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold" style={{ color: sc.color }}>{sc.label.toUpperCase()}</span>
                        <span className="text-white/60 text-xs">{fix.fix_type.replace(/_/g, ' ')}</span>
                        <span className="text-purple-300/40 text-xs font-mono ml-auto">{ws(fix.workspace)}</span>
                      </div>
                      <p className="text-white/70 text-xs">{fix.message}</p>
                    </div>
                    <span className="text-white/20 text-xs whitespace-nowrap">{formatTime(fix.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </GlowCard>
        )}

        {/* 14 Metrics Grid with status indicators */}
        <GlowCard className="mb-8" glowColor="rgba(168,85,247,0.2)">
          <h2 className="text-xl font-bold text-white mb-4">📊 14 Monitored Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(METRIC_NAMES).map(([type, name], idx) => {
              const count = incidentsByType[type]?.length || 0;
              const sev = incidentsByType[type]?.[0]?.severity || 'ok';
              const isActive = count > 0;
              return (
                <div
                  key={type}
                  className={`p-3 rounded-lg border transition-all duration-500 animate-slide-up ${
                    isActive
                      ? sev === 'critical' ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5'
                        : sev === 'warning' ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/3 border-white/5 hover:border-white/10'
                  }`}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${isActive && sev === 'critical' ? 'animate-pulse' : ''}`}>{TYPE_ICONS[type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-white/30'}`}>{name}</div>
                      {isActive ? (
                        <div className="text-xs mt-0.5 font-bold" style={{ color: SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG]?.color }}>
                          {count} alert{count > 1 ? 's' : ''}
                        </div>
                      ) : (
                        <div className="text-xs text-green-400/30 mt-0.5">✓ Clear</div>
                      )}
                    </div>
                    {isActive && (
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        sev === 'critical' ? 'bg-red-500' : sev === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* Affected Workspaces */}
        {affectedWorkspaces.length > 0 && (
          <GlowCard className="mb-8" glowColor="rgba(168,85,247,0.2)">
            <h2 className="text-xl font-bold text-white mb-4">👤 Affected Workspaces</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {affectedWorkspaces.map((wk, idx) => {
                const wsIncidents = incidents.filter(i => i.workspace === wk);
                const hasCritical = wsIncidents.some(i => i.severity === 'critical');
                const fixKey = `${wsIncidents[0]?.type}_${wk}`;
                const isFixed = fixerMap[fixKey]?.status === 'success';
                return (
                  <div
                    key={wk}
                    className={`p-3 rounded-lg border text-center transition-all duration-500 animate-slide-up ${
                      isFixed ? 'bg-green-500/10 border-green-500/20' :
                      hasCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <div className="text-white text-sm font-medium">{ws(wk)}</div>
                    <div className={`text-xs mt-1 ${isFixed ? 'text-green-400' : hasCritical ? 'text-red-400' : 'text-amber-400'}`}>
                      {isFixed ? '✅ Fixed' : `${wsIncidents.length} issue${wsIncidents.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlowCard>
        )}

        <p className="text-purple-300/20 text-xs text-center mt-8">
          🛡️ Livio Usage Guardian · Zero-token Python · Watchdog → Fixer → Verified · 14 anomaly types
        </p>
      </div>

      {/* Global animations */}
      <style jsx global>{`
        @keyframes scan-line {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 4s linear infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-radar-sweep {
          animation: radar-sweep 3s linear infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }
      `}</style>
    </main>
  );
}
