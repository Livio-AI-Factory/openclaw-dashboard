'use client';

import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function GlowCard({ children, className = '', glowColor = 'rgba(168,85,247,0.3)', onClick, style }: GlowCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 transition-all duration-300 hover:scale-105 hover:border-white/40 ${className}`}
      style={{ boxShadow: `0 0 30px ${glowColor}`, ...style }}
    >
      {children}
    </div>
  );
}
