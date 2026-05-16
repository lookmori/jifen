'use client';
import { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  emoji: string;
}

const decorations = ['🌟', '⭐', '💫', '✨', '🫧', '🌸'];

export function FloatingBubbles() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const items: Bubble[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 12 + Math.random() * 24,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
      emoji: decorations[Math.floor(Math.random() * decorations.length)],
    }));
    setBubbles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="floating-bubble absolute"
          style={{
            left: `${b.x}%`,
            bottom: '-30px',
            fontSize: `${b.size}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          {b.emoji}
        </div>
      ))}
    </div>
  );
}
