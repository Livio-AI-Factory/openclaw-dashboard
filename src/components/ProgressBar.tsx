'use client';

interface ProgressBarProps {
  percent: number;
  color?: string;
  className?: string;
}

export default function ProgressBar({ percent, color = '#a855f7', className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full bg-white/10 rounded-full h-2 ${className}`}>
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}
