import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          🦞 OpenClaw Dashboard
        </h1>
        <p className="text-xl text-purple-200">
          Track your AI usage, earn badges, hit your goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/me"
          className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-white mb-2">My Dashboard</h2>
          <p className="text-purple-200">See your hours, badge, streak & rank</p>
        </Link>

        <Link
          href="/hr"
          className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="text-4xl mb-4">👔</div>
          <h2 className="text-2xl font-bold text-white mb-2">HR Dashboard</h2>
          <p className="text-purple-200">Full company overview & 10-hr tracker</p>
        </Link>
      </div>

      <p className="text-purple-300/50 mt-12 text-sm">
        Livio AI · Powered by OpenClaw
      </p>
    </main>
  );
}
