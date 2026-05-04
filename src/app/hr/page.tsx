'use client';

import { useEffect, useState } from 'react';
import { getBadge, getProgressPercent } from '@/lib/badges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Employee {
  name: string;
  agentId: string;
  weeklyHours: number;
  estimatedHours: number;
  totalTokens: number;
  tokensIn: number;
  tokensOut: number;
  streak: number;
  rank: number;
  lastActive: string;
}

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetch('/data/usage.json')
      .then(r => r.json())
      .then(data => {
        setEmployees(data.employees);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-sm w-full">
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
          <a href="/" className="block mt-4 text-purple-300 hover:text-white text-center text-sm">← Back to Home</a>
        </div>
      </main>
    );
  }

  const totalEmployees = employees.length;
  const goalMet = employees.filter(e => e.weeklyHours >= 10).length;
  const totalHours = employees.reduce((a, e) => a + e.weeklyHours, 0);
  const avgHours = totalHours / totalEmployees;
  const totalTokens = employees.reduce((a, e) => a + e.totalTokens, 0);
  const totalCost = (totalTokens / 1_000_000 * 0.6).toFixed(2);

  const chartData = employees.map(e => ({
    name: e.name.split(' ')[0],
    hours: e.weeklyHours,
    goalMet: e.weeklyHours >= 10,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">👔 HR Dashboard</h1>
            <p className="text-purple-200">Week of May 5 – May 11, 2026</p>
          </div>
          <a href="/" className="text-purple-300 hover:text-white">← Home</a>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{totalEmployees}</div>
            <div className="text-purple-300 text-sm">Employees</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{totalHours.toFixed(1)}</div>
            <div className="text-purple-300 text-sm">Total Hours</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{avgHours.toFixed(1)}</div>
            <div className="text-purple-300 text-sm">Avg Hours</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{goalMet}</div>
            <div className="text-purple-300 text-sm">Hit 10hr Goal</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">${totalCost}</div>
            <div className="text-purple-300 text-sm">Est. Cost</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Weekly Hours by Employee</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: '#c4b5fd', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#c4b5fd' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #6d28d9', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#c4b5fd' }}
              />
              <ReferenceLine y={10} stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" label={{ value: '10hr Goal', fill: '#a855f7', fontSize: 12 }} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.goalMet ? '#a855f7' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Table */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Employee Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">#</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">Employee</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">Badge</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">Weekly Hrs</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">Progress</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">10hr Goal</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">Tokens</th>
                  <th className="text-left text-purple-300 text-sm font-semibold px-6 py-3">Streak</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const badge = getBadge(emp.weeklyHours);
                  const pct = getProgressPercent(emp.weeklyHours);
                  return (
                    <tr key={emp.agentId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 text-white/50">{emp.rank}</td>
                      <td className="px-6 py-4 text-white font-medium">{emp.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: badge.bgColor, color: badge.color }}>
                          {badge.icon} {badge.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{emp.weeklyHours}</td>
                      <td className="px-6 py-4 w-40">
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: badge.color }}
                          />
                        </div>
                        <span className="text-purple-300 text-xs">{pct}%</span>
                      </td>
                      <td className="px-6 py-4 text-lg">{emp.weeklyHours >= 10 ? '✅' : '❌'}</td>
                      <td className="px-6 py-4 text-purple-300 text-sm">{(emp.totalTokens / 1000).toFixed(0)}k</td>
                      <td className="px-6 py-4 text-white">
                        {emp.streak > 0 ? <span className="text-orange-400">🔥 {emp.streak}</span> : <span className="text-white/20">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
