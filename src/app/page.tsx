'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ParticleBackground from '@/components/ParticleBackground';
import GlowCard from '@/components/GlowCard';
import AnimatedCounter from '@/components/AnimatedCounter';

interface Summary {
  totalEmployees: number;
  totalWeeklyHours: number;
  goalMetCount: number;
  totalTokens: number;
  totalCost: number;
}

export default function LandingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [typed, setTyped] = useState('');
  const fullText = 'Track. Earn. Launch. 🚀';

  useEffect(() => {
    const loadData = () => {
      fetch('/openclaw-dashboard/data/usage.json')
        .then(r => r.json())
        .then(data => setSummary(data.summary))
        .catch(() => {});
    };
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTyped(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    {
      icon: '👤',
      title: 'My Dashboard',
      desc: 'Your personal AI usage stats',
      href: '/me',
      glow: 'rgba(0,240,255,0.3)',
      delay: '0s',
    },
    {
      icon: '👔',
      title: 'HR Dashboard',
      desc: 'Team analytics & insights',
      href: '/hr',
      glow: 'rgba(176,0,255,0.3)',
      delay: '0.5s',
    },
    {
      icon: '🏆',
      title: 'Leaderboard',
      desc: 'Top performers this week',
      href: '/leaderboard',
      glow: 'rgba(0,255,136,0.3)',
      delay: '1s',
    },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 40%, #1a0a2e 70%, #0a0a1a 100%)' }}>
      <ParticleBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white animate-neon-glow mb-4">
            OpenClaw Dashboard
          </h1>
          <p className="text-2xl md:text-3xl text-purple-200 font-mono min-h-[2.5rem]">
            {typed}<span className="animate-pulse">|</span>
          </p>
          <p className="text-lg text-purple-300/60 mt-2">AI Usage Analytics for Team Livio</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl w-full">
          {cards.map(card => (
            <Link key={card.href} href={card.href} className="block">
              <GlowCard glowColor={card.glow} className="text-center animate-float" style={{ animationDelay: card.delay } as React.CSSProperties}>
                <div className="text-5xl mb-4">{card.icon}</div>
                <h2 className="text-xl font-bold text-white mb-2">{card.title}</h2>
                <p className="text-purple-300/70 text-sm">{card.desc}</p>
              </GlowCard>
            </Link>
          ))}
        </div>

        {/* Stats Bar */}
        {summary && (
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                <AnimatedCounter target={summary.totalEmployees} />
              </div>
              <div className="text-purple-300/60 text-sm">Employees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                <AnimatedCounter target={summary.totalWeeklyHours} decimals={1} />
              </div>
              <div className="text-purple-300/60 text-sm">Weekly Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                <AnimatedCounter target={summary.goalMetCount} />
              </div>
              <div className="text-purple-300/60 text-sm">Power Users</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-purple-300/20 text-xs" style={{ textShadow: '0 0 10px rgba(168,85,247,0.3)' }}>
          Powered by OpenClaw · Livio AI
        </p>
      </div>
    </main>
  );
}
