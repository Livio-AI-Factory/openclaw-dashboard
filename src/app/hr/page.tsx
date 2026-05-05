'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBadge, getProgressPercent } from '@/lib/badges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import GlowCard from '@/components/GlowCard';
import AnimatedCounter from '@/components/AnimatedCounter';
import ProgressBar from '@/components/ProgressBar';
import ParticleBackground from '@/components/ParticleBackground';
import RocketAnimation from '@/components/RocketAnimation';

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

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'total'>('weekly');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rocketUsers, setRocketUsers] = useState<Set<string>>(new Set());

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
    const interval = setInterval(loadData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Check for users who just hit 10 hours
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
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative">
        <ParticleBackground />
        <div className="text-white text-xl animate-pulse relative z-10">Loading...</div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative">
        <ParticleBackground />
        <GlowCard className="max-w-sm w-full relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4 text-center">👔 HR Access</h1>
          <input
            type="password"
            placeholder="Enter HR password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && password === 'livio2026' && setAuthed(true)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 mb-4 focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={() => password === 'livio2026' && setAuthed(true)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Access Dashboard
          </button>
          {password && password !== 'livio2026' && (
            <p className="text-red-400 text-sm mt-2 text-center">Incorrect password</p>
          )}
          <Link href="/" className="block mt-4 text-purple-300 hover:text-white text-center text-sm">← Back to Home</Link>
        </GlowCard>
      </main>
    );
  }

  const totalEmployees = employees.length;
  const goalMet = employees.filter(e => e.weeklyHours >= 10).length;
  const totalWeeklyHours = employees.reduce((a, e) => a + e.weeklyHours, 0);
  const totalHours = employees.reduce((a, e) => a + e.estimatedHours, 0);
  const avgWeeklyHours = totalWeeklyHours / totalEmployees;
  const totalTokens = employees.reduce((a, e) => a + e.totalTokens, 0);
  const totalCost = employees.reduce((a, e) => a + e.totalCost, 0);
  const weeklyCost = employees.reduce((a, e) => a + e.weeklyCost, 0);

  const sortedEmployees = viewMode === 'weekly' 
    ? [...employees].sort((a, b) => b.weeklyHours - a.weeklyHours)
    : [...employees].sort((a, b) => b.estimatedHours - a.estimatedHours);

  // Weekly chart data
  const weeklyChartData = [...employees].sort((a, b) => b.weeklyHours - a.weeklyHours).map(e => ({
    name: e.name.split(' ')[0],
    hours: e.weeklyHours,
    goalMet: e.weeklyHours >= 10,
  }));

  // All-time chart data
  const totalChartData = [...employees].sort((a, b) => b.estimatedHours - a.estimatedHours).map(e => ({
    name: e.name.split(' ')[0],
    hours: e.estimatedHours,
    goalMet: e.estimatedHours >= 10,
  }));

  const neonTooltipStyle = {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    border: '1px solid #a855f7',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 relative">
      <ParticleBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">👔 HR Dashboard</h1>
            <p className="text-purple-200">Live OpenClaw Usage Data</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex border border-white/20">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'weekly' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-purple-300 hover:text-white'}`}
              >
                This Week
              </button>
              <button
                onClick={() => setViewMode('total')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'total' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-purple-300 hover:text-white'}`}
              >
                All Time
              </button>
            </div>
            <Link href="/" className="text-purple-300 hover:text-white text-sm">← Home</Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <GlowCard className="text-center !p-4" glowColor="rgba(59, 130, 246, 0.3)">
            <div className="text-3xl font-bold text-white">
              <AnimatedCounter target={totalEmployees} />
            </div>
            <div className="text-purple-300 text-sm">Employees</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(34, 197, 94, 0.3)">
            <div className="text-3xl font-bold text-white">
              <AnimatedCounter target={viewMode === 'weekly' ? totalWeeklyHours : totalHours} decimals={1} />
            </div>
            <div className="text-purple-300 text-sm">{viewMode === 'weekly' ? 'Weekly Hours' : 'Total Hours'}</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(168, 85, 247, 0.3)">
            <div className="text-3xl font-bold text-white">
              <AnimatedCounter target={viewMode === 'weekly' ? avgWeeklyHours : (totalHours / totalEmployees)} decimals={1} />
            </div>
            <div className="text-purple-300 text-sm">Avg Hours</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(234, 179, 8, 0.3)">
            <div className="text-3xl font-bold text-green-400">
              <AnimatedCounter target={goalMet} />
            </div>
            <div className="text-purple-300 text-sm">Hit 10hr Goal</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(251, 191, 36, 0.3)">
            <div className="text-3xl font-bold text-amber-400">
              $<AnimatedCounter target={viewMode === 'weekly' ? weeklyCost : totalCost} decimals={2} />
            </div>
            <div className="text-purple-300 text-sm">{viewMode === 'weekly' ? 'Weekly Cost' : 'Total Cost'}</div>
          </GlowCard>
        </div>

        {/* Dual Charts */}
        <div className="space-y-6 mb-8">
          {/* Weekly Chart */}
          <GlowCard className={`${viewMode === 'total' ? 'opacity-60' : ''} transition-opacity duration-300`}>
            <h2 className="text-xl font-bold text-white mb-4">This Week — Hours by Employee</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#c4b5fd', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#c4b5fd' }} />
                <Tooltip
                  contentStyle={neonTooltipStyle}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#c4b5fd' }}
                />
                <ReferenceLine y={10} stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" label={{ value: '10hr Goal', fill: '#a855f7', fontSize: 12 }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {weeklyChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.goalMet ? '#a855f7' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>

          {/* All Time Chart */}
          <GlowCard className={`${viewMode === 'weekly' ? 'opacity-60' : ''} transition-opacity duration-300`}>
            <h2 className="text-xl font-bold text-white mb-4">All Time — Hours by Employee</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totalChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#c4b5fd', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#c4b5fd' }} />
                <Tooltip
                  contentStyle={neonTooltipStyle}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#c4b5fd' }}
                />
                <ReferenceLine y={10} stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" label={{ value: '10hr Goal', fill: '#a855f7', fontSize: 12 }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {totalChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.goalMet ? '#a855f7' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlowCard>
        </div>

        {/* Employee Table */}
        <GlowCard className="!p-0 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Employee Breakdown — {viewMode === 'weekly' ? 'This Week' : 'All Time'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">#</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Employee</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Badge</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Hours</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Progress</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">10hr Goal</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Tokens</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Cost</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-4 py-3">Sessions</th>
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
                  
                  return (
                    <>
                      <tr 
                        key={emp.agentId} 
                        onClick={() => setExpandedRow(isExpanded ? null : emp.agentId)}
                        className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${isPowerUser ? 'power-user-row' : ''}`}
                      >
                        <td className="px-4 py-3 text-white/50">{idx + 1}</td>
                        <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                          {emp.name}
                          {isPowerUser && (
                            <RocketAnimation className="text-lg" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bgColor, color: badge.color }}>
                            {badge.icon} {badge.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono">{hours}</td>
                        <td className="px-4 py-3 w-32">
                          <ProgressBar percent={pct} color={badge.color} />
                          <span className="text-purple-300 text-xs">{pct}%</span>
                        </td>
                        <td className="px-4 py-3 text-lg">{hours >= 10 ? '✅' : '❌'}</td>
                        <td className="px-4 py-3 text-purple-300 text-sm">{(tokens / 1000).toFixed(0)}k</td>
                        <td className="px-4 py-3 text-amber-400 text-sm">${cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-purple-300 text-sm">{emp.sessionCount}</td>
                      </tr>
                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr key={`${emp.agentId}-detail`} className="bg-purple-900/30 border-b border-white/10">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-purple-300">Tokens In:</span>
                                <span className="text-white ml-2 font-mono">{(emp.tokensIn / 1000).toFixed(1)}k</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Tokens Out:</span>
                                <span className="text-white ml-2 font-mono">{(emp.tokensOut / 1000).toFixed(1)}k</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Weekly Cost:</span>
                                <span className="text-amber-400 ml-2">${emp.weeklyCost.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Total Cost:</span>
                                <span className="text-amber-400 ml-2">${emp.totalCost.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Session Count:</span>
                                <span className="text-white ml-2">{emp.sessionCount}</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Last Active:</span>
                                <span className="text-white ml-2">{emp.lastActive || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Streak:</span>
                                <span className="text-orange-400 ml-2">{emp.streak > 0 ? `🔥 ${emp.streak} weeks` : '—'}</span>
                              </div>
                              <div>
                                <span className="text-purple-300">Rank:</span>
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
        </GlowCard>

        <p className="text-purple-300/30 text-xs mt-6 text-center">
          Data refreshed from OpenClaw session files · Last update: {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Calcutta' })}
        </p>
      </div>

      <style jsx global>{`
        .power-user-row {
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, transparent 100%);
          box-shadow: inset 3px 0 0 #a855f7;
        }
        .power-user-row:hover {
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.05) 100%);
        }
      `}</style>
    </main>
  );
}
