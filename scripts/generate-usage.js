#!/usr/bin/env node
/**
 * Reads live OpenClaw session data and generates public/data/usage.json
 * Run: node scripts/generate-usage.js
 * Can be called via cron for real-time updates.
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/data/.openclaw/agents';
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'usage.json');

// Name mapping from agentId
const NAME_MAP = {
  abhishek_workspace: 'Abhishek',
  akash_workspace: 'Akash',
  akshay_workspace: 'Akshay',
  anupam_workspace: 'Anupam',
  apurva_workspace: 'Apurva',
  arvind_workspace: 'Arvind',
  ashwin_workspace: 'Ashwin',
  chris_workspace: 'Chris',
  communal_workspace: 'Communal',
  dhananjay_workspace: 'Dhananjay',
  dipak_workspace: 'Dipak',
  ethan_workspace: 'Ethan',
  gopika_workspace: 'Gopika',
  jatin_workspace: 'Jatin',
  kailash_workspace: 'Kailash',
  kristi_workspace: 'Kristi',
  manju_workspace: 'Manju',
  nav_workspace: 'Nav',
  naveen_workspace: 'Naveen',
  neel_workspace: 'Neel',
  nidhi_workspace: 'Nidhi',
  nidhin_workspace: 'Nidhin',
  omkar_workspace: 'Omkar',
  pawan_workspace: 'Pawan',
  pooja_workspace: 'Pooja',
  pramod_workspace: 'Pramod',
  prasad_workspace: 'Prasad',
  raghu_workspace: 'Raghu',
  rahul_workspace: 'Rahul',
  josh_workspace: 'Josh',
  rohan_workspace: 'Rohan',
  sanjay_workspace: 'Sanjay',
  sameer_workspace: 'Sameer',
  vivek_workspace: 'Vivek',
  priya_workspace: 'Priya',
  amit_workspace: 'Amit',
  suresh_workspace: 'Suresh',
  main: 'System',
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.getTime();
}

function parseAgent(agentId) {
  const sessionsDir = path.join(AGENTS_DIR, agentId, 'sessions');
  const name = NAME_MAP[agentId] || agentId.replace('_workspace', '').replace(/_/g, ' ');

  let totalTokensIn = 0, totalTokensOut = 0, totalCost = 0, totalRuntimeMs = 0;
  let weeklyTokensIn = 0, weeklyTokensOut = 0, weeklyCost = 0, weeklyRuntimeMs = 0;
  let sessionCount = 0, lastActive = 0;
  const weekStart = getWeekStart();

  if (!fs.existsSync(sessionsDir)) {
    return null;
  }

  const sessionFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl') && !f.includes('.checkpoint') && !f.includes('.bak'));

  for (const file of sessionFiles) {
    const filePath = path.join(sessionsDir, file);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    let fileSessionCount = 0;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'message' && entry.message?.role === 'assistant' && entry.message?.usage) {
          const usage = entry.message.usage;
          const cost = usage.cost?.total || 0;
          const tokensIn = usage.input || usage.cacheRead || 0;
          const tokensOut = usage.output || 0;
          const ts = new Date(entry.timestamp).getTime();

          totalTokensIn += tokensIn;
          totalTokensOut += tokensOut;
          totalCost += cost;

          if (ts >= weekStart) {
            weeklyTokensIn += tokensIn;
            weeklyTokensOut += tokensOut;
            weeklyCost += cost;
          }

          if (ts > lastActive) lastActive = ts;
          fileSessionCount++;
        }
      } catch {}
    }

    sessionCount += fileSessionCount > 0 ? 1 : 0;
  }

  // Also check sessions.json for lastActive
  const sessionsJsonPath = path.join(sessionsDir, 'sessions.json');
  if (fs.existsSync(sessionsJsonPath)) {
    try {
      const sessions = JSON.parse(fs.readFileSync(sessionsJsonPath, 'utf-8'));
      for (const key of Object.keys(sessions)) {
        const s = sessions[key];
        if (s.updatedAt && s.updatedAt > lastActive) lastActive = s.updatedAt;
      }
    } catch {}
  }

  const totalTokens = totalTokensIn + totalTokensOut;
  const weeklyTokens = weeklyTokensIn + weeklyTokensOut;
  const estimatedHours = totalRuntimeMs > 0 ? totalRuntimeMs / 3600000 : Math.max(0, (totalTokens / 100000) * 0.5);
  const weeklyHours = weeklyRuntimeMs > 0 ? weeklyRuntimeMs / 3600000 : Math.max(0, (weeklyTokens / 100000) * 0.5);

  return {
    name,
    agentId,
    tokensIn: Math.round(totalTokensIn),
    tokensOut: Math.round(totalTokensOut),
    totalTokens: Math.round(totalTokens),
    weeklyTokensIn: Math.round(weeklyTokensIn),
    weeklyTokensOut: Math.round(weeklyTokensOut),
    weeklyTokens: Math.round(weeklyTokens),
    estimatedHours: Math.round(estimatedHours * 10) / 10,
    weeklyHours: Math.round(weeklyHours * 10) / 10,
    totalCost: Math.round(totalCost * 10000) / 10000,
    weeklyCost: Math.round(weeklyCost * 10000) / 10000,
    totalRuntimeMs,
    weeklyRuntimeMs,
    streak: 0,
    lastActive: lastActive > 0 ? new Date(lastActive).toISOString() : '',
    sessionCount,
  };
}

// Main
const agents = fs.readdirSync(AGENTS_DIR).filter(d => {
  return fs.statSync(path.join(AGENTS_DIR, d)).isDirectory() && d !== 'main';
});

const employees = agents
  .map(parseAgent)
  .filter(Boolean)
  .filter(e => e.totalTokens > 0 || e.sessionCount > 0)
  .sort((a, b) => b.weeklyHours - a.weeklyHours || b.estimatedHours - a.estimatedHours)
  .map((e, i) => ({ ...e, rank: i + 1 }));

const summary = {
  totalEmployees: employees.length,
  totalWeeklyHours: Math.round(employees.reduce((a, e) => a + e.weeklyHours, 0) * 10) / 10,
  goalMetCount: employees.filter(e => e.weeklyHours >= 10).length,
  totalTokens: employees.reduce((a, e) => a + e.totalTokens, 0),
  totalCost: Math.round(employees.reduce((a, e) => a + e.totalCost, 0) * 100) / 100,
  lastUpdated: new Date().toISOString(),
};

const output = { summary, employees };

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`✅ Generated usage.json: ${employees.length} employees, updated ${summary.lastUpdated}`);
