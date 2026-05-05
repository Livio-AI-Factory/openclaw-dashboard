'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ParticleBackground from '@/components/ParticleBackground';
import GlowCard from '@/components/GlowCard';
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

const PODIUM_COLORS = [
  { glow: 'rgba(255,215,0,0.4)', border: 'rgba(255,215,0,0.6)', label: '🥇', height: 'h-48' },
  { glow: 'rgba(192,192,192,0.4)', border: 'rgba(192,192,192,0.6)', label: '🥈', height: 'h-40' },
  { glow: 'rgba(205,127,50,0.4)', border: 'rgba(205,127,50,0.6)', label: '🥉', height: 'h-32' },
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
    const interval = setInterval(loadData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)' }}>
        <div className="text-white text-xl animate-pulse">Loading leaderboard...</div>
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
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 40%, #1a0a2e 70%, #0a0a1a 100%)' }}>
      <ParticleBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white animate-neon-glow mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-purple-300/60">Top performers {viewMode === 'weekly' ? 'this week' : 'all time'}</p>

          <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-lg p-1 mt-4">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'weekly' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'total' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'}`}
            >
              All Time
            </button>
          </div>

          <Link href="/" className="inline-block mt-4 text-purple-300 hover:text-white text-sm">
            ← Home
          </Link>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end gap-4 mb-12">
            {podiumOrder.map((emp, idx) => {
              const actualRank = idx === 0 ? 1 : idx === 1 ? 0 : 2;
              const podium = PODIUM_COLORS[actualRank];
              const hours = getHours(emp);
              const badge = getBadge(hours);
              const isPower = hours >= 10;

              return (
                <GlowCard
                  key={emp.agentId}
                  glowColor={podium.glow}
                  className={`flex flex-col items-center justify-end ${podium.height} min-w-[140px]`}
                >
                  <div className="text-3xl mb-1">{podium.label}</div>
                  <div className="text-lg font-bold text-white">{emp.name}</div>
                  <span className="text-xs mt-1 px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: badge.bgColor, color: badge.color }}>
                    {badge.icon} {badge.name}
                  </span>
                  <div className="text-white font-mono text-lg mt-1">{hours.toFixed(1)}h</div>
                  <ProgressBar percent={getProgressPercent(hours)} color={badge.color} className="mt-2 w-24" />
                  {isPower && <RocketAnimation className="mt-1" />}
                </GlowCard>
              );
            })}
          </div>
        )}

        {/* Remaining ranks */}
        {rest.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden mb-10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Rankings</h2>
            </div>
            {rest.map((emp, idx) => {
              const hours = getHours(emp);
              const badge = getBadge(hours);
              const cost = getCost(emp);
              const isPower = hours >= 10;

              return (
                <div
                  key={emp.agentId}
                  className={`flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/5 ${isPower ? 'power-user-row' : ''}`}
                >
                  <span className="text-white/40 font-mono w-8 text-right">{idx + 4}</span>
                  <span className="text-white font-medium flex-1">{emp.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: badge.bgColor, color: badge.color }}>
                    {badge.icon} {badge.name}
                  </span>
                  <span className="text-white font-mono w-16 text-right">{hours.toFixed(1)}h</span>
                  <ProgressBar percent={getProgressPercent(hours)} color={badge.color} className="w-24" />
                  <span className="text-amber-400 text-sm w-16 text-right">${cost.toFixed(2)}</span>
                  {isPower && <RocketAnimation />}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white"><AnimatedCounter target={totalHours} decimals={1} /></div>
            <div className="text-purple-300/60 text-sm">Total Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400"><AnimatedCounter target={employees.length > 0 ? Math.round((goalMet / employees.length) * 100) : 0} />%</div>
            <div className="text-purple-300/60 text-sm">Hit 10hr Goal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white"><AnimatedCounter target={avgHours} decimals={1} /></div>
            <div className="text-purple-300/60 text-sm">Avg Hours</div>
          </div>
        </div>
      </div>
    </main>
  );
}
