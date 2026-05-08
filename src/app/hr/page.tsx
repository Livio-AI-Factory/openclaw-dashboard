'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBadge, getProgressPercent } from '@/lib/badges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import AnimatedCounter from '@/components/AnimatedCounter';
import ProgressBar from '@/components/ProgressBar';
import ParticleBackground from '@/components/ParticleBackground';
import RocketAnimation from '@/components/RocketAnimation';
import ExportPDFButton from '@/components/ExportPDFButton';

interface Employee {
  name: string;
  agentId: string;
  weeklyHours: number;
  estimatedHours: number;
  totalTokens: number;
  weeklyTokens: number;
  tokensIn: number;
  tokensOut: number;
  totalCost: number;
  weeklyCost: number;
  streak: number;
  rank: number;
  lastActive: string;
  sessionCount: number;
}

// Badge pill config (text only, no emojis)
const badgeConfig: Record<string, { color: string; bgColor: string }> = {
  Pioneer: { color: '#c084fc', bgColor: 'rgba(192,132,252,0.15)' },
  Voltage: { color: '#00d4ff', bgColor: 'rgba(0,212,255,0.15)' },
  Sniper: { color: '#00ff88', bgColor: 'rgba(0,255,136,0.15)' },
  Diamond: { color: '#ffaa00', bgColor: 'rgba(255,170,0,0.15)' },
  Flame: { color: '#ff3366', bgColor: 'rgba(255,51,102,0.15)' },
};

function AccessDenied() {
  return (
    <main className="min-h-screen flex items-center justify-center relative" style={{ background: '#060b18' }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative z-10 text-center">
        <div className="mb-6" style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: '#ff3366',
          textShadow: '0 0 30px rgba(255,51,102,0.6), 0 0 60px rgba(255,51,102,0.3)',
          letterSpacing: '0.15em',
          fontFamily: 'monospace',
        }}>
          ACCESS DENIED
        </div>
        <p className="text-gray-400 mb-2" style={{ textShadow: '0 0 10px rgba(0,212,255,0.3)' }}>
          This section requires administrator access
        </p>
        <p className="text-gray-600 text-sm mb-8">
          Contact your system administrator
        </p>
        <Link
          href="/openclaw-dashboard/"
          className="inline-block px-6 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.3)',
            color: '#00d4ff',
          }}
        >
          ◂ Return to Home
        </Link>
      </div>
    </main>
  );
}

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'total'>('weekly');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rocketUsers, setRocketUsers] = useState<Set<string>>(new Set());

  // Admin check from localStorage
  useEffect(() => {
    const session = localStorage.getItem('livio_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        const adminEmails = ['ashwin@golivio.com','vignesh@golivio.com','sagar@golivio.com','navneet@golivio.com','manju@golivio.com'];
        setIsAdmin(adminEmails.includes(user.email));
      } catch {}
    }
  }, []);

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

  useEffect(() => {
    if (employees.length > 0) {
      const powerUsers = new Set<string>();
      employees.forEach(e => {
        if (e.weeklyHours >= 10) {
          powerUsers.add(e.agentId);
        }
      });
      setRocketUsers(powerUsers);
    }
  }, [employees]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center relative" style={{ background: '#060b18' }}>
        <ParticleBackground />
        <div className="text-cyan-400 text-xl animate-pulse relative z-10 font-mono">LOADING...</div>
      </main>
    );
  }

  // Admin gate
  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center relative" style={{ background: '#060b18' }}>
        <ParticleBackground />
        <div className="max-w-sm w-full relative z-10 p-8 rounded-2xl" style={{
          background: 'rgba(0,212,255,0.02)',
          border: '1px solid rgba(0,212,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}>
          <h1 className="text-2xl font-bold text-white mb-4 text-center" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
            ◈ HR Access
          </h1>
          <input
            type="password"
            placeholder="Enter HR password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && password === 'livio2026' && setAuthed(true)}
            className="w-full bg-white/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-300/30 mb-4 focus:outline-none focus:border-cyan-400/50 font-mono"
          />
          <button
            onClick={() => password === 'livio2026' && setAuthed(true)}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Access Dashboard
          </button>
          {password && password !== 'livio2026' && (
            <p className="text-red-400 text-sm mt-2 text-center">Incorrect password</p>
          )}
          <Link href="/openclaw-dashboard/" className="block mt-4 text-cyan-300/60 hover:text-cyan-300 text-center text-sm">◂ Back to Home</Link>
        </div>
      </main>
    );
  }

  const totalEmployees = employees.length;
  const goalMet = employees.filter(e => e.weeklyHours >= 10).length;
  const totalWeeklyHours = employees.reduce((a, e) => a + e.weeklyHours, 0);
  const totalHours = employees.reduce((a, e) => a + e.estimatedHours, 0);
  const avgWeeklyHours = totalWeeklyHours / totalEmployees;
  const totalCost = employees.reduce((a, e) => a + e.totalCost, 0);
  const weeklyCost = employees.reduce((a, e) => a + e.weeklyCost, 0);

  const sortedEmployees = viewMode === 'weekly'
    ? [...employees].sort((a, b) => b.weeklyHours - a.weeklyHours)
    : [...employees].sort((a, b) => b.estimatedHours - a.estimatedHours);

  const weeklyChartData = [...employees].sort((a, b) => b.weeklyHours - a.weeklyHours).map(e => ({
    name: e.name.split(' ')[0],
    hours: e.weeklyHours,
    goalMet: e.weeklyHours >= 10,
  }));

  const totalChartData = [...employees].sort((a, b) => b.estimatedHours - a.estimatedHours).map(e => ({
    name: e.name.split(' ')[0],
    hours: e.estimatedHours,
    goalMet: e.estimatedHours >= 10,
  }));

  const neonTooltipStyle = {
    backgroundColor: 'rgba(6,11,24,0.95)',
    border: '1px solid #00d4ff',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0,212,255,0.4)',
  };

  return (
    <main className="min-h-screen p-4 md:p-8 relative" style={{ background: '#060b18' }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Scan-line texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.1) 2px, rgba(0,212,255,0.1) 4px)',
        backgroundSize: '100% 4px',
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
              ◈ HR Dashboard
            </h1>
            <p className="text-cyan-300/60">Live OpenClaw Usage Data</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="rounded-lg p-1 flex" style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.15)',
            }}>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'weekly' ? 'text-white shadow-lg' : 'text-cyan-300/50 hover:text-cyan-300'}`}
                style={viewMode === 'weekly' ? { background: 'rgba(0,212,255,0.2)', boxShadow: '0 0 15px rgba(0,212,255,0.3)' } : {}}
              >
                This Week
              </button>
              <button
                onClick={() => setViewMode('total')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'total' ? 'text-white shadow-lg' : 'text-cyan-300/50 hover:text-cyan-300'}`}
                style={viewMode === 'total' ? { background: 'rgba(0,212,255,0.2)', boxShadow: '0 0 15px rgba(0,212,255,0.3)' } : {}}
              >
                All Time
              </button>
            </div>
            <ExportPDFButton employees={employees} viewMode={viewMode} />
            <Link href="/openclaw-dashboard/" className="text-cyan-300/50 hover:text-cyan-300 text-sm">◂ Home</Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Employees', value: totalEmployees, color: '#00d4ff' },
            { label: viewMode === 'weekly' ? 'Weekly Hours' : 'Total Hours', value: viewMode === 'weekly' ? totalWeeklyHours : totalHours, decimals: 1, color: '#0066ff' },
            { label: 'Goal Met (10hr)', value: goalMet, color: '#00ff88' },
            { label: viewMode === 'weekly' ? 'Weekly Cost' : 'Total Cost', value: viewMode === 'weekly' ? weeklyCost : totalCost, decimals: 2, prefix: '$', color: '#ffaa00' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl text-center" style={{
              background: 'rgba(0,212,255,0.02)',
              border: '1px solid rgba(0,212,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}>
              <div className="text-3xl font-bold font-mono" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}40` }}>
                {stat.prefix || ''}<AnimatedCounter target={stat.value} decimals={stat.decimals || 0} />
              </div>
              <div className="text-cyan-300/40 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="space-y-6 mb-8">
          <div className={`rounded-2xl p-6 ${viewMode === 'total' ? 'opacity-60' : ''} transition-opacity duration-300`} style={{
            background: 'rgba(0,212,255,0.02)',
            border: '1px solid rgba(0,212,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>
            <h2 className="text-lg font-bold text-white mb-4" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
              This Week — Hours by Employee
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#00d4ff80', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#00d4ff80' }} />
                <Tooltip contentStyle={neonTooltipStyle} labelStyle={{ color: '#00d4ff' }} itemStyle={{ color: '#00d4ff' }} />
                <ReferenceLine y={10} stroke="#00d4ff" strokeWidth={2} strokeDasharray="5 5" label={{ value: '10hr Goal', fill: '#00d4ff', fontSize: 12 }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {weeklyChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.goalMet ? '#00d4ff' : '#0066ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-2xl p-6 ${viewMode === 'weekly' ? 'opacity-60' : ''} transition-opacity duration-300`} style={{
            background: 'rgba(0,212,255,0.02)',
            border: '1px solid rgba(0,212,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>
            <h2 className="text-lg font-bold text-white mb-4" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
              All Time — Hours by Employee
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totalChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#00d4ff80', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#00d4ff80' }} />
                <Tooltip contentStyle={neonTooltipStyle} labelStyle={{ color: '#00d4ff' }} itemStyle={{ color: '#00d4ff' }} />
                <ReferenceLine y={10} stroke="#00d4ff" strokeWidth={2} strokeDasharray="5 5" label={{ value: '10hr Goal', fill: '#00d4ff', fontSize: 12 }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {totalChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.goalMet ? '#00d4ff' : '#0066ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Table */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(0,212,255,0.02)',
          border: '1px solid rgba(0,212,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="p-6" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
            <h2 className="text-lg font-bold text-white" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
              Employee Breakdown — {viewMode === 'weekly' ? 'This Week' : 'All Time'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
                  {['#', 'Employee', 'Badge', 'Hours', 'Progress', '10hr Goal', 'Tokens', 'Cost', 'Sessions'].map(h => (
                    <th key={h} className="text-left text-sm font-semibold px-4 py-3 font-mono" style={{ color: '#00d4ff' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.map((emp, idx) => {
                  const hours = viewMode === 'weekly' ? emp.weeklyHours : emp.estimatedHours;
                  const badge = getBadge(hours);
                  const pct = getProgressPercent(hours);
                  const tokens = viewMode === 'weekly' ? emp.weeklyTokens : emp.totalTokens;
                  const cost = viewMode === 'weekly' ? emp.weeklyCost : emp.totalCost;
                  const isPowerUser = emp.weeklyHours >= 10;
                  const isExpanded = expandedRow === emp.agentId;
                  const badgeStyle = badgeConfig[badge.name] || { color: '#9ca3af', bgColor: 'rgba(156,163,175,0.15)' };

                  return (
                    <>
                      <tr
                        key={emp.agentId}
                        onClick={() => setExpandedRow(isExpanded ? null : emp.agentId)}
                        className={`border-b border-cyan-500/5 hover:bg-cyan-500/5 cursor-pointer transition-all ${isPowerUser ? 'power-user-row' : ''}`}
                        style={idx % 2 === 1 ? { background: 'rgba(0,212,255,0.02)' } : {}}
                      >
                        <td className="px-4 py-3 text-white/30 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                          {emp.name}
                          {isPowerUser && <RocketAnimation className="text-lg" />}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono" style={{ backgroundColor: badgeStyle.bgColor, color: badgeStyle.color }}>
                            {badge.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono">{hours}</td>
                        <td className="px-4 py-3 w-32">
                          <ProgressBar percent={pct} color={badgeStyle.color} />
                          <span className="text-cyan-300/40 text-xs font-mono">{pct}%</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: hours >= 10 ? '#00ff88' : '#ff3366' }}>
                          {hours >= 10 ? '◉' : '○'}
                        </td>
                        <td className="px-4 py-3 text-cyan-300/50 text-sm font-mono">{(tokens / 1000).toFixed(0)}k</td>
                        <td className="px-4 py-3 text-sm font-mono" style={{ color: '#ffaa00' }}>${cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-cyan-300/50 text-sm font-mono">{emp.sessionCount}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${emp.agentId}-detail`} className="border-b border-cyan-500/5" style={{ background: 'rgba(0,212,255,0.03)' }}>
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
                              <div>
                                <span className="text-cyan-300/40">Tokens In:</span>
                                <span className="text-white ml-2">{(emp.tokensIn / 1000).toFixed(1)}k</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Tokens Out:</span>
                                <span className="text-white ml-2">{(emp.tokensOut / 1000).toFixed(1)}k</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Weekly Cost:</span>
                                <span className="ml-2" style={{ color: '#ffaa00' }}>${emp.weeklyCost.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Total Cost:</span>
                                <span className="ml-2" style={{ color: '#ffaa00' }}>${emp.totalCost.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Session Count:</span>
                                <span className="text-white ml-2">{emp.sessionCount}</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Last Active:</span>
                                <span className="text-white ml-2">{emp.lastActive || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Streak:</span>
                                <span className="ml-2" style={{ color: '#ffaa00' }}>{emp.streak > 0 ? `▸ ${emp.streak} weeks` : '—'}</span>
                              </div>
                              <div>
                                <span className="text-cyan-300/40">Rank:</span>
                                <span className="text-white ml-2">#{emp.rank}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-cyan-300/20 text-xs mt-6 text-center font-mono">
          Data refreshed from OpenClaw session files · Last update: {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Calcutta' })}
        </p>
      </div>

      <style jsx global>{`
        .power-user-row {
          background: linear-gradient(90deg, rgba(0,212,255,0.08) 0%, transparent 100%);
          box-shadow: inset 3px 0 0 #00d4ff;
        }
        .power-user-row:hover {
          background: linear-gradient(90deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.03) 100%);
        }
      `}</style>
    </main>
  );
}
