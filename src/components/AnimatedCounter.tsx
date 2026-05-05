'use client';

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  target: number;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({ target, decimals = 0, className = '' }: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);

  return <span className={className}>{current.toFixed(decimals)}</span>;
}
