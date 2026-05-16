// lib/holidays.ts — 节日检测与装饰配置

export interface HolidayOverride {
  name: string;
  decorations: DecorationConfig;
  emoji: string;
}

export interface DecorationConfig {
  floating: string[];      // 漂浮emoji
  banner: string | null;   // 顶部横幅文字
  bannerEmoji: string;     // 横幅emoji
  bgPattern: string | null; // 背景纹样 (CSS gradient or pattern)
  accentColor: string;     // 强调色
}

interface LunarHoliday {
  name: string;
  emoji: string;
  month: number;  // 公历近似月份
  day: number;
  range: number;  // 前后天数
  decorations: DecorationConfig;
}

// 中国传统节日（公历近似日期）
const chineseHolidays: LunarHoliday[] = [
  {
    name: '春节', emoji: '🧧', month: 1, day: 29, range: 10,
    decorations: {
      floating: ['🧧', '🏮', '🧨', '✨', '🧧', '🏮', '🎆', '🧧', '🏮', '🧨', '✨', '🧧', '🏮', '🎆'],
      banner: '新春大吉，万事如意！',
      bannerEmoji: '🧧',
      bgPattern: 'repeating-linear-gradient(45deg, #ff000008 0px, #ff000008 20px, #ffd70008 20px, #ffd70008 40px)',
      accentColor: '#DC2626',
    },
  },
  {
    name: '元宵节', emoji: '🏮', month: 2, day: 12, range: 3,
    decorations: {
      floating: ['🏮', '🏮', '✨', '🏮', '🏮', '✨', '🏮', '🥟', '🏮', '🏮'],
      banner: '元宵快乐，团团圆圆！',
      bannerEmoji: '🏮',
      bgPattern: null,
      accentColor: '#EA580C',
    },
  },
  {
    name: '清明节', emoji: '🍃', month: 4, day: 5, range: 3,
    decorations: {
      floating: ['🍃', '🪁', '🌸', '🌿', '🪁', '🍃', '🌿', '🌸'],
      banner: '清明时节，春和景明',
      bannerEmoji: '🍃',
      bgPattern: null,
      accentColor: '#65A30D',
    },
  },
  {
    name: '端午节', emoji: '🐲', month: 5, day: 31, range: 5,
    decorations: {
      floating: ['🐲', '🎋', '🍙', '🐲', '🎋', '🍙', '🐲', '🎋'],
      banner: '端午安康，粽叶飘香！',
      bannerEmoji: '🐲',
      bgPattern: null,
      accentColor: '#15803D',
    },
  },
  {
    name: '七夕', emoji: '💫', month: 8, day: 29, range: 2,
    decorations: {
      floating: ['💫', '💕', '✨', '🌉', '💫', '💕', '✨', '🌟'],
      banner: '七夕佳节，鹊桥相会',
      bannerEmoji: '💫',
      bgPattern: null,
      accentColor: '#DB2777',
    },
  },
  {
    name: '中秋节', emoji: '🌕', month: 10, day: 6, range: 5,
    decorations: {
      floating: ['🌕', '🥮', '🏮', '🐇', '🌕', '🥮', '🏮', '🐇', '🌕', '🥮', '🏮'],
      banner: '中秋快乐，月圆人团圆！',
      bannerEmoji: '🌕',
      bgPattern: 'radial-gradient(circle at 80% 20%, #fbbf2420 0%, transparent 50%)',
      accentColor: '#D97706',
    },
  },
  {
    name: '重阳节', emoji: '🌺', month: 10, day: 29, range: 3,
    decorations: {
      floating: ['🌺', '⛰️', '🍂', '🌺', '⛰️', '🍂', '🌺'],
      banner: '重阳登高，敬老爱老',
      bannerEmoji: '🌺',
      bgPattern: null,
      accentColor: '#B45309',
    },
  },
  {
    name: '冬至', emoji: '🥟', month: 12, day: 22, range: 3,
    decorations: {
      floating: ['🥟', '❄️', '🔥', '🥟', '❄️', '🔥', '🥟', '❄️'],
      banner: '冬至快乐，吃饺子啦！',
      bannerEmoji: '🥟',
      bgPattern: null,
      accentColor: '#DC2626',
    },
  },
  {
    name: '腊八节', emoji: '🥣', month: 1, day: 7, range: 2,
    decorations: {
      floating: ['🥣', '🫘', '🌾', '🥣', '🫘', '🌾'],
      banner: '过了腊八就是年！',
      bannerEmoji: '🥣',
      bgPattern: null,
      accentColor: '#92400E',
    },
  },
];

// 公历节日
const solarHolidays: { name: string; emoji: string; month: number; day: number; range: number; decorations: DecorationConfig }[] = [
  {
    name: '元旦', emoji: '🎊', month: 1, day: 1, range: 3,
    decorations: {
      floating: ['🎊', '✨', '🌟', '🎉', '🎊', '✨', '🌟'],
      banner: '新年快乐！Happy New Year!',
      bannerEmoji: '🎊',
      bgPattern: null,
      accentColor: '#F59E0B',
    },
  },
  {
    name: '儿童节', emoji: '🎈', month: 6, day: 1, range: 5,
    decorations: {
      floating: ['🎈', '🎪', '🎠', '🎨', '🎈', '🎪', '🎠', '🎨', '🎈', '🎪', '🎠'],
      banner: '六一快乐，童心未泯！',
      bannerEmoji: '🎈',
      bgPattern: 'repeating-linear-gradient(0deg, #ff6b6b10 0px, #ff6b6b10 10px, #4ecdc410 10px, #4ecdc410 20px, #ffe66d10 20px, #ffe66d10 30px)',
      accentColor: '#EC4899',
    },
  },
  {
    name: '教师节', emoji: '💐', month: 9, day: 10, range: 3,
    decorations: {
      floating: ['💐', '✉️', '🍎', '💐', '✉️', '🍎', '💐'],
      banner: '教师节快乐，桃李满天下！',
      bannerEmoji: '💐',
      bgPattern: null,
      accentColor: '#7C3AED',
    },
  },
  {
    name: '国庆节', emoji: '🇨🇳', month: 10, day: 1, range: 7,
    decorations: {
      floating: ['🇨🇳', '🎆', '✨', '🇨🇳', '🎆', '✨', '🇨🇳', '🎆', '✨', '🇨🇳'],
      banner: '祖国繁荣昌盛！',
      bannerEmoji: '🇨🇳',
      bgPattern: null,
      accentColor: '#DC2626',
    },
  },
  {
    name: '万圣节', emoji: '🎃', month: 10, day: 31, range: 3,
    decorations: {
      floating: ['🎃', '👻', '🦇', '🍬', '🎃', '👻', '🦇'],
      banner: 'Trick or Treat! 🎃',
      bannerEmoji: '🎃',
      bgPattern: null,
      accentColor: '#F97316',
    },
  },
  {
    name: '圣诞节', emoji: '🎄', month: 12, day: 25, range: 3,
    decorations: {
      floating: ['🎄', '❄️', '🎅', '🦌', '🎄', '❄️', '🎅', '🎄', '❄️'],
      banner: 'Merry Christmas! 圣诞快乐！',
      bannerEmoji: '🎄',
      bgPattern: 'repeating-linear-gradient(0deg, #ffffff08 0px, #ffffff08 5px, #ff000008 5px, #ff000008 10px, #00ff0008 10px, #00ff0008 15px)',
      accentColor: '#DC2626',
    },
  },
];

function isInRange(month: number, day: number, targetMonth: number, targetDay: number, range: number): boolean {
  const d = month * 100 + day;
  const t = targetMonth * 100 + targetDay;
  const r = range;
  return d >= t - r && d <= t + r;
}

export function getHolidayOverride(): HolidayOverride | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  // 中国传统节日优先
  for (const h of chineseHolidays) {
    if (isInRange(m, d, h.month, h.day, h.range)) {
      return { name: h.name, decorations: h.decorations, emoji: h.emoji };
    }
  }

  // 公历节日
  for (const h of solarHolidays) {
    if (isInRange(m, d, h.month, h.day, h.range)) {
      return { name: h.name, decorations: h.decorations, emoji: h.emoji };
    }
  }

  return null;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function getTimeGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 6) return `夜深了，${name}还在忙呀~ 🌙`;
  if (hour < 12) return `早上好，${name}！☀️`;
  if (hour < 14) return `中午好，${name}！🌤️`;
  if (hour < 18) return `下午好，${name}！🌻`;
  return `晚上好，${name}！🌙`;
}
