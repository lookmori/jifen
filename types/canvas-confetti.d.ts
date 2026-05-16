declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    startVelocity?: number;
    ticks?: number;
    zIndex?: number;
    angle?: number;
  }
  function confetti(options?: ConfettiOptions): void;
  export default confetti;
}
