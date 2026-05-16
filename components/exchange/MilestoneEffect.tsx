'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkMilestone, fireMilestone } from '@/lib/confetti';

interface MilestoneEffectProps {
  oldPoints: number;
  newPoints: number;
  show: boolean;
  onComplete: () => void;
}

export function MilestoneEffect({ oldPoints, newPoints, show, onComplete }: MilestoneEffectProps) {
  const milestone = checkMilestone(oldPoints, newPoints);

  useEffect(() => {
    if (milestone && show) {
      fireMilestone(milestone);
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    } else if (show) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [milestone, show, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center"
        >
          <div className="text-8xl">
            {milestone ? '🎉' : '✨'}
          </div>
          {milestone && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-display font-bold text-[var(--color-primary)] mt-2"
            >
              达成 {milestone} 分里程碑！
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
