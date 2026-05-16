'use client';
import { useEffect, useRef } from 'react';

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#C084FC'];
const PARTICLE_COUNT = 6;
const PARTICLE_DELAY = 3; // frames between particles

export function RainbowTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<{ x: number; y: number; color: string; alpha: number; size: number }[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  const frame = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    let animId: number;
    const animate = () => {
      frame.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles
      if (frame.current % PARTICLE_DELAY === 0 && mouse.current.x > 0) {
        const color = COLORS[particles.current.length % COLORS.length];
        particles.current.push({
          x: mouse.current.x + (Math.random() - 0.5) * 6,
          y: mouse.current.y + (Math.random() - 0.5) * 6,
          color,
          alpha: 0.8,
          size: 3 + Math.random() * 3,
        });
      }

      // Update and draw particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.alpha -= 0.03;
        p.y -= 0.3;
        if (p.alpha <= 0) {
          particles.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      // Cap particles
      if (particles.current.length > 30) {
        particles.current.splice(0, particles.current.length - 30);
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[999]"
      aria-hidden
    />
  );
}
