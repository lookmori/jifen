'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getHolidayOverride } from '@/lib/holidays';

export function HolidayDecorations() {
  const holiday = getHolidayOverride();

  const floatingData = useMemo(() => {
    if (!holiday) return [];
    return holiday.decorations.floating.map((emoji, i) => ({
      emoji,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      driftX: (Math.random() - 0.5) * 60,
      driftY: (Math.random() - 0.5) * 60,
      duration: 8 + Math.random() * 10,
      delay: i * 0.5,
      size: 24 + Math.random() * 16,
    }));
  }, [holiday]);

  if (!holiday) return null;

  return (
    <>
      {/* 浮动emoji — 始终可见，缓慢漂移 */}
      <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" aria-hidden="true" suppressHydrationWarning>
        {floatingData.map((item, i) => (
          <motion.span
            key={i}
            className="absolute select-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.size}px`,
              opacity: 0.55,
            }}
            animate={{
              x: [0, item.driftX, 0, -item.driftX, 0],
              y: [0, -item.driftY, 0, item.driftY, 0],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: 'easeInOut',
            }}
          >
            {item.emoji}
          </motion.span>
        ))}
      </div>

      {/* 顶部横幅 — 固定定位，不需要等待动画 */}
      <div
        className="fixed top-16 left-0 right-0 z-20 flex items-center justify-center gap-3 py-2.5 px-4"
        style={{
          background: `linear-gradient(135deg, ${holiday.decorations.accentColor}25, ${holiday.decorations.accentColor}10, ${holiday.decorations.accentColor}25)`,
          borderBottom: `2px solid ${holiday.decorations.accentColor}40`,
        }}
      >
        <motion.span
          className="text-xl"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {holiday.decorations.bannerEmoji}
        </motion.span>
        <motion.span
          className="font-display font-bold text-sm sm:text-base"
          style={{ color: holiday.decorations.accentColor }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {holiday.name} — {holiday.decorations.banner}
        </motion.span>
        <motion.span
          className="text-xl"
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          {holiday.decorations.bannerEmoji}
        </motion.span>
      </div>
    </>
  );
}
