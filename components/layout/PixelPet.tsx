'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

type PetMood = 'idle' | 'happy' | 'sad' | 'sleeping' | 'celebrating' | 'walking';

const moodEmoji: Record<PetMood, string> = {
  idle: '😊',
  happy: '😸',
  sad: '😿',
  sleeping: '😴',
  celebrating: '🥳',
  walking: '🚶',
};

const bubbleMessages: Record<PetMood, string[]> = {
  idle: ['今天好开心~ 🌟', '小朋友们加油！', '老师辛苦啦~ ☕'],
  happy: ['太厉害了！👍', '继续加油！💪', '好棒好棒！🎉'],
  sad: ['下次注意哦~ 💪', '不要灰心！🌈', '没什么大不了的~'],
  sleeping: ['zzz... 💤', '呼...呼...', '😴'],
  celebrating: ['太棒了！🎊', '恭喜恭喜！🎉', '好厉害！👑'],
  walking: ['走走走走~ 🚶', '散个步~ 🐾', '锻炼身体！'],
};

export function PixelPet() {
  const [mood, setMood] = useState<PetMood>('idle');
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const randomMessage = useCallback((m: PetMood) => {
    const msgs = bubbleMessages[m];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, []);

  const showMessage = useCallback((m: PetMood) => {
    setBubbleText(randomMessage(m));
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 3000);
  }, [randomMessage]);

  // 随机动作
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const actions: PetMood[] = ['walking', 'idle', 'idle', 'happy'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setMood(action);
      if (action !== 'idle') {
        setTimeout(() => setMood('idle'), 2000);
      }
    }, 15000);

    // 3分钟无操作 → 睡觉
    let inactivityTimeout: ReturnType<typeof setTimeout>;
    const resetInactivity = () => {
      clearTimeout(inactivityTimeout);
      if (mood === 'sleeping') setMood('idle');
      inactivityTimeout = setTimeout(() => setMood('sleeping'), 180000);
    };

    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('click', resetInactivity);
    window.addEventListener('keydown', resetInactivity);
    resetInactivity();

    return () => {
      clearInterval(idleTimer);
      clearTimeout(inactivityTimeout);
      window.removeEventListener('mousemove', resetInactivity);
      window.removeEventListener('click', resetInactivity);
      window.removeEventListener('keydown', resetInactivity);
    };
  }, [mood]);

  // 接收全局事件
  useEffect(() => {
    const handleExchange = () => { setMood('celebrating'); showMessage('celebrating'); setTimeout(() => setMood('idle'), 3000); };
    const handlePointAdd = () => { setMood('happy'); showMessage('happy'); setTimeout(() => setMood('idle'), 2000); };
    const handlePointDeduct = () => { setMood('sad'); showMessage('sad'); setTimeout(() => setMood('idle'), 2000); };

    window.addEventListener('pet:celebrate', handleExchange);
    window.addEventListener('pet:happy', handlePointAdd);
    window.addEventListener('pet:sad', handlePointDeduct);

    return () => {
      window.removeEventListener('pet:celebrate', handleExchange);
      window.removeEventListener('pet:happy', handlePointAdd);
      window.removeEventListener('pet:sad', handlePointDeduct);
    };
  }, [showMessage]);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    showMessage('happy');

    if (newCount >= 5) {
      // 彩蛋: 宠物暴走
      setMood('walking');
      setTimeout(() => { setMood('idle'); }, 2000);
      setClickCount(0);
    }
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50 select-none"
      onClick={handleClick}
    >
      {/* 对话气泡 */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-12 right-0 bg-white text-[var(--color-text)] px-3 py-1.5 rounded-[var(--radius-md)] shadow-lg text-sm font-bold whitespace-nowrap border border-[var(--color-border)]"
          >
            {bubbleText}
            <div className="absolute -bottom-1 right-4 w-3 h-3 bg-white border-b border-r border-[var(--color-border)] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 宠物 emoji */}
      <motion.div
        animate={
          mood === 'sleeping'
            ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } }
            : mood === 'celebrating'
              ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1], transition: { duration: 0.5 } }
              : mood === 'walking'
                ? { x: [0, 10, 0, -10, 0], transition: { repeat: Infinity, duration: 1 } }
                : { y: [0, -3, 0], transition: { repeat: Infinity, duration: 2 } }
        }
        className="text-5xl cursor-pointer hover:scale-110 transition-transform"
      >
        {moodEmoji[mood]}
      </motion.div>

      {/* 小窝 */}
      <div className="absolute -bottom-1 -left-2 w-16 h-4 bg-[var(--color-border)]/50 rounded-[var(--radius-full)] -z-10" />
    </div>
  );
}

// 全局事件触发函数
export function triggerPetCelebrate() { window.dispatchEvent(new Event('pet:celebrate')); }
export function triggerPetHappy() { window.dispatchEvent(new Event('pet:happy')); }
export function triggerPetSad() { window.dispatchEvent(new Event('pet:sad')); }
