'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBadge } from '@/lib/badges';

interface Employee {
  name: string;
  agentId: string;
  weeklyHours: number;
  estimatedHours: number;
  totalTokens: number;
  streak: number;
  rank: number;
  lastActive: string;
}

export default function MePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/openclaw-dashboard/data/usage.json')
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

  if (!selected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Who are you?</h1>
          <p className="text-purple-200 mb-8">Select your name to see your dashboard</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {employees.map(emp => (
              <button
                key={emp.agentId}
                onClick={() => setSelected(emp)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-left hover:bg-white/20 transition-all hover:scale-105"
              >
                <div className="text-white font-semibold">{emp.name}</div>
                <div className="text-purple-300 text-sm">{emp.weeklyHours} hrs this week</div>
              </button>
            ))}
          </div>
          <a href="/" className="inline-block mt-8 text-purple-300 hover:text-white">← Back</a>
        </div>
      </main>
    );
  }

  const badge = getBadge(selected.weeklyHours);
  const progress = Math.min(Math.round((selected.weeklyHours / 10) * 100), 100);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-lg mx-auto">
        <button onClick={() => setSelected(null)} className="text-purple-300 hover:text-white mb-6">← Pick someone else</button>
        <a href="/" className="text-purple-300 hover:text-white ml-4">← Home</a>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-6 text-center">
          <div className="text-6xl mb-4">{badge.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-1">{selected.name}</h1>
          <div className="text-purple-200 text-lg">{badge.name}</div>
          {selected.streak > 0 && (
            <div className="mt-2 text-orange-400 font-semibold">🔥 {selected.streak}-week streak</div>
          )}
        </div>

        {/* Progress Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-semibold">Weekly Progress</span>
            <span className="text-white">{selected.weeklyHours} / 10 hrs</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-4 mb-2">
            <div
              className="h-4 rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? '#a855f7' : progress >= 70 ? '#3b82f6' : progress >= 50 ? '#22c55e' : '#eab308',
              }}
            />
          </div>
          <div className="text-purple-300 text-sm">{progress}% to 10-hour goal</div>
          {selected.weeklyHours >= 10 && (
            <div className="mt-3 text-green-400 font-bold text-lg">✅ 10-hour goal reached!</div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">#{selected.rank}</div>
            <div className="text-purple-300 text-sm">Rank</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{selected.estimatedHours}</div>
            <div className="text-purple-300 text-sm">Total Hours</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{(selected.totalTokens / 1000).toFixed(0)}k</div>
            <div className="text-purple-300 text-sm">Total Tokens</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{selected.weeklyHours >= 10 ? '✅' : '❌'}</div>
            <div className="text-purple-300 text-sm">10hr Goal</div>
          </div>
        </div>

        {/* Badge Progress */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Badge Progress</h3>
          <div className="space-y-3">
            {[
              { icon: '🔴', name: 'Beginner', hrs: 0 },
              { icon: '🟡', name: 'Learner', hrs: 2 },
              { icon: '🟢', name: 'Explorer', hrs: 5 },
              { icon: '🔵', name: 'Achiever', hrs: 8 },
              { icon: '🟣', name: 'Master', hrs: 10 },
              { icon: '🏆', name: 'Champion', hrs: 15 },
            ].map(b => (
              <div key={b.name} className="flex items-center gap-3">
                <span className="text-xl">{b.icon}</span>
                <span className={`flex-1 ${selected.weeklyHours >= b.hrs ? 'text-white' : 'text-white/30'}`}>
                  {b.name} ({b.hrs}+ hrs)
                </span>
                {selected.weeklyHours >= b.hrs ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <span className="text-white/20">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
