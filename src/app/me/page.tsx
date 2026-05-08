'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';

/* ── Types ── */
interface EmployeeData {
  name: string;
  agentId: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  weeklyTokensIn: number;
  weeklyTokensOut: number;
  weeklyTokens: number;
  estimatedHours: number;
  weeklyHours: number;
  totalCost: number;
  weeklyCost: number;
  streak: number;
  lastActive: string;
  sessionCount: number;
  rank: number;
}

interface KanbanProject {
  id: string;
  workspace: string;
  employee_name: string;
  department: string;
  title: string;
  column: string;
  status: string;
  current_phase: number;
  total_phases: number;
  phases: { name: string; status: string }[];
  cost_usd: number;
  tokens_used: number;
  updated_at: string;
  created_at: string;
}

/* ── Helpers ── */
function formatCurrency(v: number) {
  return '$' + v.toFixed(2);
}
function formatTokens(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return v.toString();
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
function columnLabel(col: string) {
  const map: Record<string, string> = { backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
  return map[col] || col;
}
function columnColor(col: string) {
  const map: Record<string, string> = { backlog: '#ffaa00', todo: '#00d4ff', in_progress: '#00d4ff', review: '#ffaa00', done: '#00ff88' };
  return map[col] || '#00d4ff';
}

/* ── Component ── */
export default function MePage() {
  const { user, isAdmin } = useAuth();
  const [emp, setEmp] = useState<EmployeeData | null>(null);
  const [projects, setProjects] = useState<KanbanProject[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch('/openclaw-dashboard/data/usage.json').then(r => r.json()),
      fetch('/openclaw-dashboard/data/kanban.json').then(r => r.json()),
    ]).then(([usageData, kanbanData]) => {
      const employees: EmployeeData[] = usageData.employees || [];
      setAllEmployees(employees);
      const me = employees.find((e: EmployeeData) => e.agentId === user.workspace);
      setEmp(me || null);
      const myProjects = (kanbanData.projects || []).filter(
        (p: KanbanProject) => p.workspace === user.workspace
      );
      setProjects(myProjects);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return null; // AuthContext handles redirect

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#060b18' }}>
        <div style={{ color: '#00d4ff', fontFamily: 'monospace', fontSize: 14, letterSpacing: 2 }}>LOADING...</div>
      </main>
    );
  }

  const weeklyGoal = 10;
  const weeklyPct = emp ? Math.min(Math.round((emp.weeklyHours / weeklyGoal) * 100), 100) : 0;
  const loginDate = new Date(user.loginTime);

  /* Company-wide stats for admin */
  const companyStats = isAdmin && allEmployees.length > 0 ? {
    totalEmployees: allEmployees.length,
    totalCost: allEmployees.reduce((s, e) => s + e.totalCost, 0),
    totalTokens: allEmployees.reduce((s, e) => s + e.totalTokens, 0),
    activeThisWeek: allEmployees.filter(e => e.weeklyHours > 0).length,
  } : null;

  return (
    <main className="min-h-screen relative" style={{ background: '#060b18' }}>
      {/* Grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Scan line */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.008) 2px, rgba(0,212,255,0.008) 4px)',
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 style={{
            color: '#00d4ff', fontSize: 24, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 3,
            textShadow: '0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.2)',
          }}>
            MY DASHBOARD
          </h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/openclaw-dashboard/hr" style={{
                padding: '4px 12px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1,
                border: '1px solid rgba(255,51,102,0.4)', color: '#ff3366', background: 'rgba(255,51,102,0.06)',
                textDecoration: 'none',
              }}>
                ADMIN PANEL
              </Link>
            )}
            <Link href="/openclaw-dashboard" style={{ color: 'rgba(0,212,255,0.5)', fontFamily: 'monospace', fontSize: 12, textDecoration: 'none' }}>
              ← HOME
            </Link>
          </div>
        </div>

        {/* Welcome Banner */}
        <div style={{
          background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.08)',
          borderRadius: 8, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{ color: '#00d4ff', fontSize: 22, fontWeight: 600 }}>
            Welcome back, {user.name}
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(0,212,255,0.6)' }}>
              Workspace: {user.workspace}
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1,
              border: `1px solid ${isAdmin ? 'rgba(255,51,102,0.4)' : 'rgba(0,255,136,0.3)'}`,
              color: isAdmin ? '#ff3366' : '#00ff88',
              background: isAdmin ? 'rgba(255,51,102,0.06)' : 'rgba(0,255,136,0.04)',
            }}>
              {isAdmin ? 'ADMIN' : 'EMPLOYEE'}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(0,212,255,0.4)' }}>
              Last login: {loginDate.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'My Hours', value: emp ? `${emp.weeklyHours.toFixed(1)} / ${emp.estimatedHours.toFixed(1)}` : '—/—', sub: 'weekly / total', color: '#00d4ff' },
            { label: 'My Tokens', value: emp ? `${formatTokens(emp.weeklyTokens)} / ${formatTokens(emp.totalTokens)}` : '—/—', sub: 'weekly / total', color: '#00ff88' },
            { label: 'My Cost', value: emp ? `${formatCurrency(emp.weeklyCost)} / ${formatCurrency(emp.totalCost)}` : '—/—', sub: 'weekly / total', color: '#ffaa00' },
            { label: 'My Rank', value: emp ? `#${emp.rank}` : '—', sub: `of ${allEmployees.length}`, color: '#ff3366' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,212,255,0.02)', border: `1px solid ${s.color}15`,
              borderRadius: 8, padding: '16px',
            }}>
              <div style={{ color: 'rgba(0,212,255,0.5)', fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                {s.value}
              </div>
              <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Progress */}
        {emp && (
          <div style={{
            background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.08)',
            borderRadius: 8, padding: '16px 20px', marginBottom: 20,
          }}>
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: 'rgba(0,212,255,0.7)', fontSize: 12, fontFamily: 'monospace', letterSpacing: 1 }}>
                WEEKLY GOAL
              </span>
              <span style={{ color: weeklyPct >= 100 ? '#00ff88' : '#00d4ff', fontFamily: 'monospace', fontSize: 13 }}>
                {emp.weeklyHours.toFixed(1)} / {weeklyGoal} hrs
              </span>
            </div>
            <div style={{ background: 'rgba(0,212,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${weeklyPct}%`, height: '100%', borderRadius: 4,
                background: weeklyPct >= 100 ? 'linear-gradient(90deg, #00ff88, #00d4ff)' : 'linear-gradient(90deg, #00d4ff, rgba(0,212,255,0.4))',
                transition: 'width 0.5s ease',
              }} />
            </div>
            {emp.streak > 0 && (
              <div style={{ color: '#ffaa00', fontSize: 12, fontFamily: 'monospace', marginTop: 6 }}>
                🔥 {emp.streak}-week streak
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* My Projects */}
          <div style={{
            background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.08)',
            borderRadius: 8, padding: '20px',
          }}>
            <h2 style={{ color: '#00d4ff', fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
              MY PROJECTS ({projects.length})
            </h2>
            {projects.length === 0 ? (
              <div style={{ color: 'rgba(0,212,255,0.3)', fontFamily: 'monospace', fontSize: 12 }}>
                No projects yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {projects.map(p => {
                  const isExpanded = expandedProject === p.id;
                  const pct = p.total_phases > 0 ? Math.round((p.current_phase / p.total_phases) * 100) : 0;
                  return (
                    <div key={p.id} onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                      style={{
                        background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.06)',
                        borderRadius: 6, padding: '12px 14px', cursor: 'pointer',
                      }}>
                      <div className="flex justify-between items-start">
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{p.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span style={{
                              fontSize: 10, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 3,
                              border: `1px solid ${columnColor(p.column)}40`, color: columnColor(p.column),
                            }}>
                              {columnLabel(p.column).toUpperCase()}
                            </span>
                            <span style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>
                              {timeAgo(p.updated_at)}
                            </span>
                          </div>
                        </div>
                        <div style={{ color: 'rgba(0,212,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>
                          {pct}%
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ background: 'rgba(0,212,255,0.06)', borderRadius: 3, height: 4, marginTop: 8 }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 3,
                          background: pct === 100 ? '#00ff88' : '#00d4ff',
                        }} />
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 10, borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 10 }}>
                          {p.phases?.map((ph, i) => (
                            <div key={i} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                              <span style={{
                                color: ph.status === 'done' ? '#00ff88' : ph.status === 'in_progress' ? '#ffaa00' : 'rgba(0,212,255,0.3)',
                                fontSize: 10,
                              }}>
                                {ph.status === 'done' ? '✓' : ph.status === 'in_progress' ? '◉' : '○'}
                              </span>
                              <span style={{
                                color: ph.status === 'done' ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.3)',
                                fontSize: 11, fontFamily: 'monospace',
                              }}>
                                {ph.name}
                              </span>
                            </div>
                          ))}
                          <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace', marginTop: 6 }}>
                            Cost: {formatCurrency(p.cost_usd)} · Tokens: {formatTokens(p.tokens_used)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Usage */}
          <div style={{
            background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.08)',
            borderRadius: 8, padding: '20px',
          }}>
            <h2 style={{ color: '#00d4ff', fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
              MY USAGE
            </h2>
            {emp ? (
              <div>
                {/* Token breakdown */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: 'rgba(0,212,255,0.5)', fontSize: 11, fontFamily: 'monospace', marginBottom: 8 }}>TOKEN BREAKDOWN</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 10 }}>
                      <div style={{ color: '#00d4ff', fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                        {formatTokens(emp.weeklyTokensIn)}
                      </div>
                      <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Weekly In</div>
                    </div>
                    <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 10 }}>
                      <div style={{ color: '#00ff88', fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                        {formatTokens(emp.weeklyTokensOut)}
                      </div>
                      <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Weekly Out</div>
                    </div>
                    <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 10 }}>
                      <div style={{ color: '#00d4ff', fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                        {formatTokens(emp.tokensIn)}
                      </div>
                      <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Total In</div>
                    </div>
                    <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 10 }}>
                      <div style={{ color: '#00ff88', fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                        {formatTokens(emp.tokensOut)}
                      </div>
                      <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Total Out</div>
                    </div>
                  </div>
                </div>
                {/* Cost comparison */}
                <div>
                  <div style={{ color: 'rgba(0,212,255,0.5)', fontSize: 11, fontFamily: 'monospace', marginBottom: 8 }}>COST COMPARISON</div>
                  <div className="flex items-center gap-4">
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#ffaa00', fontSize: 18, fontFamily: 'monospace', fontWeight: 700 }}>
                        {formatCurrency(emp.weeklyCost)}
                      </div>
                      <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>This Week</div>
                    </div>
                    <div style={{ color: 'rgba(0,212,255,0.15)', fontSize: 20 }}>→</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#ff3366', fontSize: 18, fontFamily: 'monospace', fontWeight: 700 }}>
                        {formatCurrency(emp.totalCost)}
                      </div>
                      <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>All Time</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'rgba(0,212,255,0.3)', fontFamily: 'monospace', fontSize: 12 }}>
                No usage data found for your workspace
              </div>
            )}
          </div>
        </div>

        {/* Activity + Quick Actions row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* My Activity */}
          <div style={{
            background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.08)',
            borderRadius: 8, padding: '20px',
          }}>
            <h2 style={{ color: '#00d4ff', fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
              MY ACTIVITY
            </h2>
            {emp ? (
              <div className="grid grid-cols-2 gap-3">
                <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: '#00d4ff', fontSize: 20, fontFamily: 'monospace', fontWeight: 700 }}>
                    {emp.sessionCount}
                  </div>
                  <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Sessions</div>
                </div>
                <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: '#ffaa00', fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}>
                    {emp.streak > 0 ? `${emp.streak} weeks` : '—'}
                  </div>
                  <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Streak</div>
                </div>
                <div style={{ background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: 12, gridColumn: 'span 2' }}>
                  <div style={{ color: '#00ff88', fontSize: 13, fontFamily: 'monospace' }}>
                    {emp.lastActive ? timeAgo(emp.lastActive) : 'Unknown'}
                  </div>
                  <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}>Last Active</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'rgba(0,212,255,0.3)', fontFamily: 'monospace', fontSize: 12 }}>No activity data</div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'rgba(0,212,255,0.02)', border: '1px solid rgba(0,212,255,0.08)',
            borderRadius: 8, padding: '20px',
          }}>
            <h2 style={{ color: '#00d4ff', fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
              QUICK ACTIONS
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Start a new project', href: '/openclaw-dashboard', desc: 'Go to main dashboard' },
                { label: 'View Leaderboard', href: '/openclaw-dashboard/leaderboard', desc: 'See company rankings' },
                { label: 'View Kanban Board', href: '/openclaw-dashboard/kanban', desc: 'All projects overview' },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: 'block', padding: '10px 14px', borderRadius: 6,
                  border: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,212,255,0.02)',
                  textDecoration: 'none',
                }}>
                  <div style={{ color: '#00d4ff', fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                  <div style={{ color: 'rgba(0,212,255,0.3)', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>{a.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Admin: Company-wide stats */}
        {isAdmin && companyStats && (
          <div style={{
            background: 'rgba(255,51,102,0.03)', border: '1px solid rgba(255,51,102,0.15)',
            borderRadius: 8, padding: '20px', marginBottom: 20,
          }}>
            <h2 style={{ color: '#ff3366', fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}>
              🛡 COMPANY-WIDE STATS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Employees', value: companyStats.totalEmployees, color: '#ff3366' },
                { label: 'Active This Week', value: companyStats.activeThisWeek, color: '#00ff88' },
                { label: 'Total Cost', value: formatCurrency(companyStats.totalCost), color: '#ffaa00' },
                { label: 'Total Tokens', value: formatTokens(companyStats.totalTokens), color: '#00d4ff' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,51,102,0.04)', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: s.color, fontSize: 18, fontFamily: 'monospace', fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: 'rgba(255,51,102,0.4)', fontSize: 10, fontFamily: 'monospace' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
