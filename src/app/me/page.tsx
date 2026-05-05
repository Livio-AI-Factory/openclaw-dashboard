'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getBadge, getProgressPercent } from '@/lib/badges';
import GlowCard from '@/components/GlowCard';
import AnimatedCounter from '@/components/AnimatedCounter';
import ProgressBar from '@/components/ProgressBar';
import ParticleBackground from '@/components/ParticleBackground';

interface Employee {
  name: string;
  agentId: string;
  weeklyHours: number;
  estimatedHours: number;
  totalTokens: number;
  totalCost: number;
  weeklyCost: number;
  streak: number;
  rank: number;
  lastActive: string;
  sessionCount: number;
}

export default function MePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRocket, setShowRocket] = useState(false);
  const [rocketComplete, setRocketComplete] = useState(false);
  const rocketRef = useRef<HTMLDivElement>(null);

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

  // Trigger rocket animation when user has 10+ hours
  useEffect(() => {
    if (selected && selected.weeklyHours >= 10 && !rocketComplete) {
      setShowRocket(true);
      const timer = setTimeout(() => {
        setShowRocket(false);
        setRocketComplete(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selected, rocketComplete]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative">
        <ParticleBackground />
        <div className="text-white text-xl animate-pulse relative z-10">Loading...</div>
      </main>
    );
  }

  if (!selected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 relative">
        <ParticleBackground />
        <div className="max-w-2xl mx-auto relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Who are you?</h1>
          <p className="text-purple-200 mb-8">Select your name to see your dashboard</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {employees.map(emp => (
              <GlowCard 
                key={emp.agentId}
                className="!p-4 cursor-pointer text-left"
                onClick={() => setSelected(emp)}
                glowColor="rgba(168, 85, 247, 0.2)"
              >
                <div className="text-white font-semibold">{emp.name}</div>
                <div className="text-purple-300 text-sm">{emp.estimatedHours} hrs total</div>
              </GlowCard>
            ))}
          </div>
          <Link href="/" className="inline-block mt-8 text-purple-300 hover:text-white">← Back</Link>
        </div>
      </main>
    );
  }

  const badge = getBadge(selected.weeklyHours || selected.estimatedHours);
  const weeklyProgress = Math.min(Math.round(((selected.weeklyHours || 0) / 10) * 100), 100);
  const isLaunched = selected.weeklyHours >= 10;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 relative overflow-hidden">
      <ParticleBackground />
      
      {/* Rocket Animation Overlay */}
      {showRocket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="rocket-animation">
            <span className="text-8xl">🚀</span>
          </div>
          <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />
        </div>
      )}

      <div className="max-w-lg mx-auto relative z-10">
        <div className="flex gap-4 mb-6">
          <button onClick={() => { setSelected(null); setRocketComplete(false); }} className="text-purple-300 hover:text-white">← Pick someone else</button>
          <Link href="/" className="text-purple-300 hover:text-white">← Home</Link>
        </div>

        {/* Profile Card */}
        <div ref={rocketRef} className="relative">
          <GlowCard 
            className="text-center mb-6"
            glowColor={isLaunched ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.3)'}
          >
            {isLaunched && (
              <div className="absolute -top-2 -right-2 text-3xl animate-bounce">
                🚀
              </div>
            )}
            <div className="text-6xl mb-4">{badge.icon}</div>
            <h1 className="text-3xl font-bold text-white mb-1">{selected.name}</h1>
            <div className="text-purple-200 text-lg">{badge.name}</div>
            {selected.streak > 0 && (
              <div className="mt-2 text-orange-400 font-semibold">🔥 {selected.streak}-week streak</div>
            )}
          </GlowCard>

          {/* LAUNCHED Banner */}
          {isLaunched && rocketComplete && (
            <div className="launched-banner mb-6 text-center py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 animate-pulse">
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                🚀 LAUNCHED! 🚀
              </span>
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <GlowCard className="mb-6" glowColor={weeklyProgress >= 100 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.3)'}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-semibold">This Week</span>
            <span className="text-white">{selected.weeklyHours} / 10 hrs</span>
          </div>
          <ProgressBar 
            percent={weeklyProgress} 
            color={weeklyProgress >= 100 ? '#a855f7' : weeklyProgress >= 70 ? '#3b82f6' : weeklyProgress >= 50 ? '#22c55e' : '#eab308'}
            className="h-4"
          />
          <div className="text-purple-300 text-sm mt-2">{weeklyProgress}% to 10-hour weekly goal</div>
          {isLaunched && (
            <div className="mt-3 text-green-400 font-bold text-lg">✅ 10-hour goal reached!</div>
          )}
        </GlowCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <GlowCard className="text-center !p-4" glowColor="rgba(251, 191, 36, 0.3)">
            <div className="text-2xl font-bold text-white">#{selected.rank}</div>
            <div className="text-purple-300 text-sm">Rank</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(34, 197, 94, 0.3)">
            <div className="text-2xl font-bold text-white">
              <AnimatedCounter target={selected.estimatedHours} decimals={1} />
            </div>
            <div className="text-purple-300 text-sm">Total Hours</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(99, 102, 241, 0.3)">
            <div className="text-2xl font-bold text-white">
              <AnimatedCounter target={selected.totalTokens / 1000} decimals={0} />k
            </div>
            <div className="text-purple-300 text-sm">Total Tokens</div>
          </GlowCard>
          <GlowCard className="text-center !p-4" glowColor="rgba(251, 191, 36, 0.3)">
            <div className="text-2xl font-bold text-white">
              $<AnimatedCounter target={selected.totalCost} decimals={2} />
            </div>
            <div className="text-purple-300 text-sm">Total Cost</div>
          </GlowCard>
        </div>

        {/* Badge Progress */}
        <GlowCard className="mb-6" glowColor="rgba(168, 85, 247, 0.2)">
          <h3 className="text-white font-semibold mb-4">Badge Progress</h3>
          <div className="space-y-3">
            {[
              { icon: '🔴', name: 'Beginner', hrs: 0 },
              { icon: '🟡', name: 'Learner', hrs: 2 },
              { icon: '🟢', name: 'Explorer', hrs: 5 },
              { icon: '🔵', name: 'Achiever', hrs: 8 },
              { icon: '🟣', name: 'Master', hrs: 10 },
              { icon: '🏆', name: 'Champion', hrs: 15 },
            ].map((b, i) => {
              const hrs = selected.weeklyHours || selected.estimatedHours;
              const achieved = hrs >= b.hrs;
              return (
                <div 
                  key={b.name} 
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${achieved ? 'bg-white/5' : ''}`}
                  style={achieved ? { boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)' } : {}}
                >
                  <span className="text-xl">{b.icon}</span>
                  <span className={`flex-1 ${achieved ? 'text-white' : 'text-white/30'}`}>
                    {b.name} ({b.hrs}+ hrs)
                  </span>
                  {achieved ? (
                    <span className="text-green-400 animate-pulse">✓</span>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* Session Stats */}
        <GlowCard className="!p-4" glowColor="rgba(59, 130, 246, 0.2)">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-purple-300">Sessions: </span>
              <span className="text-white">{selected.sessionCount}</span>
            </div>
            <div>
              <span className="text-purple-300">Last Active: </span>
              <span className="text-white">{selected.lastActive || 'Unknown'}</span>
            </div>
          </div>
        </GlowCard>
      </div>

      <style jsx global>{`
        .rocket-animation {
          animation: rocketLaunch 3s ease-out forwards;
        }
        
        @keyframes rocketLaunch {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(0) rotate(-5deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(5deg);
            opacity: 0;
          }
        }
        
        .launched-banner {
          animation: glowPulse 2s ease-in-out infinite;
        }
        
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.8), 0 0 60px rgba(236, 72, 153, 0.5);
          }
        }
      `}</style>
    </main>
  );
}
