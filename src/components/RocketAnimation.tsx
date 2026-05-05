'use client';

export default function RocketAnimation({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block animate-bounce ${className}`} title="Power User!">
      🚀
    </span>
  );
}
