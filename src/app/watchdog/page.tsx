'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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
  critical: { color: '#ff3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.3)', icon: '◆', label: 'Critical' },
  warning: { color: '#ffaa00', bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.3)', icon: '◉', label: 'Warning' },
  info: { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.3)', icon: '◈', label: 'Info' },
};

const STATUS_CONFIG = {
  started: { color: '#00d4ff', icon: '◈', label: 'Fixing' },
  success: { color: '#00ff88', icon: '✓', label: 'Fixed' },
  failed: { color: '#ff3366', icon: '◆', label: 'Failed' },
  skipped: { color: 'rgba(0,212,255,0.3)', icon: '—', label: 'Skipped' },
};

const TYPE_ICONS: Record<string, string> = {
  cost_spike: '◈', token_flood: '◈', daily_spend: '◈', session_cost: '◈',
  employee_budget: '◉', tool_loop: '◉', error_storm: '◆', idle_session: '◉',
  zombie_session: '◆', unusual_hours: '◉', expensive_model: '◈',
  ram_high: '◆', cpu_high: '◆', container_restarts: '◉',
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

function FixFlowAnimation({ incident, fixerEntry }: { incident: Incident; fixerEntry?: FixerEntry }) {
  const isFixed = fixerEntry?.status === 'success';
  const isFixing = fixerEntry?.status === 'started';
  const isFailed = fixerEntry?.status === 'failed';

  const nodeStyle = (active: boolean, color: string) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontFamily: 'monospace' as const,
    background: active ? `${color}15` : 'rgba(0,212,255,0.03)',
    color: active ? color : 'rgba(0,212,255,0.3)',
    border: `1px solid ${active ? `${color}40` : 'rgba(0,212,255,0.06)'}`,
  });

  const cyan = '#00d4ff';
  const green = '#00ff88';
  const red = '#ff3366';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
      <div style={nodeStyle(true, red)}>
        <span>{isFixed ? '✓' : '◆'}</span>
        <span>Watchdog</span>
      </div>
      <div style={{ width: 20, height: 1, background: isFixed ? green : isFixing ? cyan : 'rgba(0,212,255,0.1)' }} />
      <div style={nodeStyle(isFixing || isFixed, isFixing ? cyan : green)}>
        <span>{isFixing ? '◈' : '✓'}</span>
        <span>Fixer</span>
      </div>
      <div style={{ width: 20, height: 1, background: isFixed ? green : 'rgba(0,212,255,0.1)' }} />
      <div style={nodeStyle(isFixed || isFailed, isFixed ? green : isFailed ? red : 'rgba(0,212,255,0.3)')}>
        <span>{isFixed ? '✓' : isFailed ? '◆' : '—'}</span>
        <span>{isFixed ? 'Resolved' : isFailed ? 'Failed' : 'Pending'}</span>
      </div>
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
      <main style={{ minHeight: '100vh', background: '#060b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, color: '#00d4ff', fontFamily: 'monospace', animation: 'pulse 1.5s infinite' }}>◆</div>
          <div style={{ color: '#00d4ff', fontSize: 12, fontFamily: 'monospace', letterSpacing: 2, marginTop: 12 }}>INITIALIZING WATCHDOG...</div>
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

  const fixerMap: Record<string, FixerEntry> = {};
  fixerLog.forEach(f => {
    const key = `${f.fix_type}_${f.workspace}`;
    fixerMap[key] = f;
  });

  const affectedWorkspaces = [...new Set(incidents.map(i => i.workspace))].filter(w => w !== 'SYSTEM');
  const totalFixes = fixerResults?.fixes_success || 0;
  const totalFailed = fixerResults?.fixes_failed || 0;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(0,212,255,0.02)',
    border: '1px solid rgba(0,212,255,0.08)',
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(10px)',
  };

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

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: '#00d4ff', letterSpacing: 4, textShadow: '0 0 10px rgba(0,212,255,0.5)', margin: 0 }}>
                WATCHDOG
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 10, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <div style={{ width: 6, height: 6, background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 8px #00ff88', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#00ff88', fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(0,212,255,0.4)', fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>
              ANOMALY DETECTION · {scanData?.workspaces_scanned || 0} WORKSPACES
            </div>
            <div style={{ fontSize: 9, color: 'rgba(0,212,255,0.25)', fontFamily: 'monospace', marginTop: 2 }}>
              SCAN #{scanCount} · LAST: {lastRefresh.toLocaleTimeString('en-IN', { timeZone: 'Asia/Calcutta' })} IST
              {scanData?.scan_time && <span> · DATA: {formatTime(scanData.scan_time)}</span>}
            </div>
          </div>
          <Link href="/" style={{ fontSize: 11, color: 'rgba(0,212,255,0.4)', fontFamily: 'monospace', textDecoration: 'none', letterSpacing: 1 }}>
            ⟐ HOME
          </Link>
        </div>

        {/* Fixer Pipeline Status */}
        <div style={{ ...cardStyle, marginBottom: 20, borderColor: 'rgba(0,212,255,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', letterSpacing: 2, fontFamily: 'monospace' }}>
              ◈ FIXER PIPELINE
            </div>
            <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.3)', fontFamily: 'monospace' }}>
              {fixerResults ? `LAST RUN: ${formatTime(fixerResults.fixer_time)}` : 'AWAITING FIRST FIX'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {[
              { dot: '#ff3366', label: 'Detected', value: incidents.length },
              { dot: '#00d4ff', label: 'Analyzed', value: fixerResults?.fixes_attempted || 0 },
              { dot: '#00ff88', label: 'Fixed', value: totalFixes, bold: true },
              { dot: '#0066ff', label: 'Verified', value: totalFixes > 0 ? '✓' : '—' },
            ].map((item, idx) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {idx > 0 && <span style={{ color: 'rgba(0,212,255,0.2)', fontFamily: 'monospace' }}>→</span>}
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, boxShadow: `0 0 6px ${item.dot}44` }} />
                <span style={{ color: 'rgba(0,212,255,0.4)', fontSize: 11 }}>{item.label}</span>
                <span style={{ color: item.bold ? '#00ff88' : '#e2e8f0', fontFamily: 'monospace', fontSize: 12, fontWeight: item.bold ? 700 : 400 }}>{item.value}</span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: 'rgba(0,212,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, transition: 'width 1s ease-out',
              width: incidents.length > 0 ? `${(totalFixes / incidents.length) * 100}%` : '0%',
              background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
              boxShadow: '0 0 10px rgba(0,212,255,0.4)',
            }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'CRITICAL', value: criticalCount, color: '#ff3366' },
            { label: 'WARNINGS', value: warningCount, color: '#ffaa00' },
            { label: 'INFO', value: infoCount, color: '#00d4ff' },
            { label: 'FIXED', value: totalFixes, color: '#00ff88' },
            { label: 'AFFECTED', value: affectedWorkspaces.length, color: '#0066ff' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,212,255,0.03)',
              border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 10,
              padding: '12px 18px',
              flex: 1,
              minWidth: 100,
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.05), transparent)', animation: 'scanLine 4s infinite linear' }} />
              <div style={{ fontSize: 9, color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'monospace', position: 'relative' }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: s.color, textShadow: `0 0 15px ${s.color}55`, fontFamily: 'monospace', position: 'relative' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', 'critical', 'warning', 'info'] as const).map(f => {
            const count = f === 'all' ? incidents.length : incidents.filter(i => i.severity === f).length;
            const isActive = filter === f;
            const sevColor = f === 'critical' ? '#ff3366' : f === 'warning' ? '#ffaa00' : f === 'info' ? '#00d4ff' : '#00d4ff';
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  background: isActive ? `${sevColor}15` : 'rgba(0,212,255,0.02)',
                  border: `1px solid ${isActive ? `${sevColor}50` : 'rgba(0,212,255,0.08)'}`,
                  color: isActive ? sevColor : 'rgba(0,212,255,0.4)',
                  boxShadow: isActive ? `0 0 10px ${sevColor}22` : 'none',
                }}
              >
                {f === 'all' ? '◈ ALL' : `${SEVERITY_CONFIG[f].icon} ${SEVERITY_CONFIG[f].label.toUpperCase()}`}
                <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 6, fontSize: 9, background: 'rgba(0,212,255,0.08)' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Incident Feed */}
        <div style={{ marginBottom: 24 }}>
          {filtered.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 40, color: '#00ff88', fontFamily: 'monospace', marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>All Clear</div>
              <div style={{ fontSize: 12, color: 'rgba(0,212,255,0.4)', fontFamily: 'monospace' }}>No {filter !== 'all' ? filter : ''} incidents detected</div>
              <div style={{ fontSize: 10, color: 'rgba(0,255,136,0.3)', fontFamily: 'monospace', marginTop: 12, animation: 'pulse 2s infinite' }}>
                Monitoring {scanData?.workspaces_scanned || 0} workspaces...
              </div>
            </div>
          ) : (
            filtered.map((incident, idx) => {
              const sev = SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
              const typeIcon = TYPE_ICONS[incident.type] || '◉';
              const fixKey = `${incident.type}_${incident.workspace}`;
              const fixerEntry = fixerMap[fixKey];
              return (
                <div
                  key={`${incident.type}-${incident.workspace}-${idx}`}
                  style={{
                    ...cardStyle,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: sev.color,
                    borderColor: sev.border,
                    background: sev.bg,
                    boxShadow: incident.severity === 'critical' ? `0 0 20px ${sev.color}22` : 'none',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.003)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 24, color: sev.color, fontFamily: 'monospace', lineHeight: 1 }}>{typeIcon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace', color: sev.color, background: sev.bg }}>
                          {sev.label.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{METRIC_NAMES[incident.type] || incident.type}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(0,212,255,0.7)', margin: '4px 0 8px' }}>{incident.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, flexWrap: 'wrap', fontFamily: 'monospace' }}>
                        {incident.workspace !== 'SYSTEM' && (
                          <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,255,0.06)', color: 'rgba(0,212,255,0.6)', fontSize: 10 }}>
                            ◉ {ws(incident.workspace)}
                          </span>
                        )}
                        {incident.metric !== undefined && (
                          <span style={{ color: 'rgba(0,212,255,0.4)' }}>
                            Value: <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{typeof incident.metric === 'number' ? incident.metric.toLocaleString() : incident.metric}</span>
                            {incident.threshold !== undefined && <> / Limit: <span>{incident.threshold}</span></>}
                          </span>
                        )}
                        {incident.timestamp && (
                          <span style={{ color: 'rgba(0,212,255,0.25)', marginLeft: 'auto' }}>{formatTime(incident.timestamp)}</span>
                        )}
                      </div>
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,212,255,0.06)' }}>
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
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 12 }}>
              ◈ FIXER ACTIVITY LOG
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 8 }}>
              {[...fixerLog].reverse().slice(0, 20).map((fix, idx) => {
                const sc = STATUS_CONFIG[fix.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.skipped;
                return (
                  <div
                    key={`${fix.fix_type}-${fix.workspace}-${idx}`}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: 8, borderRadius: 6, marginBottom: 4,
                      background: fix.status === 'success' ? 'rgba(0,255,136,0.03)' :
                                  fix.status === 'failed' ? 'rgba(255,51,102,0.03)' :
                                  fix.status === 'started' ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.02)',
                      border: `1px solid ${fix.status === 'success' ? 'rgba(0,255,136,0.15)' :
                                          fix.status === 'failed' ? 'rgba(255,51,102,0.15)' :
                                          fix.status === 'started' ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.05)'}`,
                    }}
                  >
                    <span style={{ fontSize: 14, color: sc.color, fontFamily: 'monospace' }}>{sc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: sc.color, fontFamily: 'monospace', letterSpacing: 0.5 }}>{sc.label.toUpperCase()}</span>
                        <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.5)' }}>{fix.fix_type.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.25)', fontFamily: 'monospace', marginLeft: 'auto' }}>{ws(fix.workspace)}</span>
                      </div>
                      <p style={{ fontSize: 10, color: 'rgba(0,212,255,0.5)', margin: 0 }}>{fix.message}</p>
                    </div>
                    <span style={{ fontSize: 9, color: 'rgba(0,212,255,0.2)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTime(fix.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 14 Metrics Grid */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 12 }}>
            ◉ 14 MONITORED METRICS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {Object.entries(METRIC_NAMES).map(([type, name]) => {
              const count = incidentsByType[type]?.length || 0;
              const sev = incidentsByType[type]?.[0]?.severity || 'ok';
              const isActive = count > 0;
              const sevConfig = SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG];
              return (
                <div
                  key={type}
                  style={{
                    padding: 8, borderRadius: 6,
                    background: isActive ? (sevConfig?.bg || 'rgba(0,212,255,0.05)') : 'rgba(0,212,255,0.01)',
                    border: `1px solid ${isActive ? (sevConfig?.border || 'rgba(0,212,255,0.15)') : 'rgba(0,212,255,0.04)'}`,
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, color: isActive && sev === 'critical' ? '#ff3366' : '#00d4ff', fontFamily: 'monospace' }}>{TYPE_ICONS[type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 500, color: isActive ? '#e2e8f0' : 'rgba(0,212,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      {isActive ? (
                        <div style={{ fontSize: 9, fontWeight: 700, color: sevConfig?.color || '#00d4ff', fontFamily: 'monospace' }}>
                          {count} ALERT{count > 1 ? 'S' : ''}
                        </div>
                      ) : (
                        <div style={{ fontSize: 9, color: 'rgba(0,255,136,0.3)', fontFamily: 'monospace' }}>✓ CLEAR</div>
                      )}
                    </div>
                    {isActive && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: sevConfig?.color || '#00d4ff',
                        boxShadow: `0 0 6px ${sevConfig?.color || '#00d4ff'}44`,
                        animation: sev === 'critical' ? 'pulse 1s infinite' : 'none',
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Affected Workspaces */}
        {affectedWorkspaces.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 12 }}>
              ◉ AFFECTED WORKSPACES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
              {affectedWorkspaces.map(wk => {
                const wsIncidents = incidents.filter(i => i.workspace === wk);
                const hasCritical = wsIncidents.some(i => i.severity === 'critical');
                const fixKey = `${wsIncidents[0]?.type}_${wk}`;
                const isFixed = fixerMap[fixKey]?.status === 'success';
                return (
                  <div
                    key={wk}
                    style={{
                      padding: 8, borderRadius: 6, textAlign: 'center',
                      background: isFixed ? 'rgba(0,255,136,0.05)' : hasCritical ? 'rgba(255,51,102,0.05)' : 'rgba(255,170,0,0.05)',
                      border: `1px solid ${isFixed ? 'rgba(0,255,136,0.15)' : hasCritical ? 'rgba(255,51,102,0.2)' : 'rgba(255,170,0,0.15)'}`,
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{ws(wk)}</div>
                    <div style={{ fontSize: 9, marginTop: 2, fontFamily: 'monospace', color: isFixed ? '#00ff88' : hasCritical ? '#ff3366' : '#ffaa00' }}>
                      {isFixed ? '✓ FIXED' : `${wsIncidents.length} ISSUE${wsIncidents.length > 1 ? 'S' : ''}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 9, color: 'rgba(0,212,255,0.2)', fontFamily: 'monospace', letterSpacing: 1 }}>
          ◆ LIVIO USAGE GUARDIAN · WATCHDOG → FIXER → VERIFIED · 14 ANOMALY TYPES
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        @keyframes scanLine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,212,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
      `}</style>
    </main>
  );
}
