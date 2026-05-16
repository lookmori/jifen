import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  });
}

export function fireStars() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  confetti({ ...defaults, particleCount: 50, origin: { x: Math.random(), y: Math.random() * 0.4 } });
}

export function fireMilestone(points: number) {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ['#FFD700', '#FFA500', '#FF6347'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

const milestones = [100, 200, 500, 1000, 2000, 5000];

export function checkMilestone(oldPoints: number, newPoints: number): number | null {
  for (const m of milestones) {
    if (oldPoints < m && newPoints >= m) return m;
  }
  return null;
}
