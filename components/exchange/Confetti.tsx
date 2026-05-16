'use client';
import { useEffect, useRef } from 'react';
import { fireConfetti } from '@/lib/confetti';

interface ConfettiProps {
  trigger: boolean;
}

export function Confetti({ trigger }: ConfettiProps) {
  const prev = useRef(false);

  useEffect(() => {
    if (trigger && !prev.current) {
      fireConfetti();
    }
    prev.current = trigger;
  }, [trigger]);

  return null;
}
