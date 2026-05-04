export interface BadgeLevel {
  name: string;
  icon: string;
  color: string;
  minHours: number;
  bgColor: string;
}

export const BADGE_LEVELS: BadgeLevel[] = [
  { name: 'Beginner', icon: '🔴', color: '#ef4444', minHours: 0, bgColor: '#fef2f2' },
  { name: 'Learner', icon: '🟡', color: '#eab308', minHours: 2, bgColor: '#fefce8' },
  { name: 'Explorer', icon: '🟢', color: '#22c55e', minHours: 5, bgColor: '#f0fdf4' },
  { name: 'Achiever', icon: '🔵', color: '#3b82f6', minHours: 8, bgColor: '#eff6ff' },
  { name: 'Master', icon: '🟣', color: '#a855f7', minHours: 10, bgColor: '#faf5ff' },
  { name: 'Champion', icon: '🏆', color: '#f59e0b', minHours: 15, bgColor: '#fffbeb' },
];

export function getBadge(hours: number): BadgeLevel {
  let badge = BADGE_LEVELS[0];
  for (const level of BADGE_LEVELS) {
    if (hours >= level.minHours) badge = level;
  }
  return badge;
}

export function getProgressPercent(weeklyHours: number): number {
  return Math.min(Math.round((weeklyHours / 10) * 100), 100);
}
