'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

import { toast } from '@/components/ui/Toast';
import { triggerPetHappy } from '@/components/layout/PixelPet';
import { fireConfetti } from '@/lib/confetti';
import { playExchange } from '@/lib/sounds';

interface GiftItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_price: number;
  stock: number;
  emoji: string;
}

interface StudentItem {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  class_name?: string;
}

export default function ExchangePage() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchStudent, setSearchStudent] = useState('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const selectedStudentRef = useRef<StudentItem | null>(null);
  selectedStudentRef.current = selectedStudent;

  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exchanging, setExchanging] = useState(false);

  // 兑换成功动画
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedGift, setCelebratedGift] = useState<GiftItem | null>(null);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exchange?pageSize=100');
      const data = await res.json();
      if (data.success) setGifts(data.data);
    } catch { toast('加载礼物失败', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  // 搜索学生
  useEffect(() => {
    if (!searchStudent.trim()) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(searchStudent)}&pageSize=10`);
        const data = await res.json();
        if (data.success) setStudents(data.data);
      } catch { /* ignore */ }
      finally { setSearchingStudents(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchStudent]);

  const handleStudentSearch = useCallback((v: string) => {
    setSearchStudent(v);
    // debounce 追赶触发时，如果值匹配当前已选中学生，不清除选择
    if (selectedStudentRef.current && v === selectedStudentRef.current.name) return;
    setSelectedStudent(null);
  }, []);

  const handleExchange = async () => {
    if (!selectedStudent || !selectedGift) return;
    setExchanging(true);
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id, giftId: selectedGift.id }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirm(false);
        setCelebratedGift(selectedGift);
        setShowCelebration(true);
        triggerPetHappy();
        fireConfetti();
        playExchange();
        fetchGifts();
        // 更新学生积分
        setSelectedStudent(prev => prev ? { ...prev, points: data.data.student.points } : null);
        setTimeout(() => setShowCelebration(false), 3000);
      } else toast(data.error || '兑换失败', 'error');
    } catch { toast('兑换失败', 'error'); }
    finally { setExchanging(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">🎪 积分兑换小铺</h1>
      </div>

      {/* 选择学生 */}
      <div className="relative z-10">
        <label className="text-sm font-bold text-[var(--color-text-secondary)]">👨‍🎓 选择学生</label>
        <SearchInput value={searchStudent} onChange={handleStudentSearch} placeholder="搜索学生姓名..." className="mt-1" />
        {searchingStudents && <p className="text-xs text-[var(--color-text-secondary)] mt-1">搜索中...</p>}
        {students.length > 0 && !selectedStudent && (
          <div className="z-10 mt-1 w-full bg-[var(--color-cardBg)] border-2 border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg max-h-48 overflow-y-auto">
            {students.map(s => (
              <button key={s.id} onClick={() => { setSelectedStudent(s); setSearchStudent(s.name); setStudents([]); }}
                className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-border)] flex items-center gap-2 transition-colors">
                <span className="text-xl">{s.avatar_emoji}</span>
                <span className="font-bold text-[var(--color-text)]">{s.name}</span>
                <span className="text-sm text-[var(--color-text-secondary)] ml-auto">⭐ {s.points} 分</span>
              </button>
            ))}
          </div>
        )}
        {selectedStudent && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 rounded-full">
            <span className="text-xl">{selectedStudent.avatar_emoji}</span>
            <span className="font-bold text-[var(--color-text)]">{selectedStudent.name}</span>
            <span className="font-display font-bold text-[var(--color-primary)]">⭐ {selectedStudent.points} 分</span>
            <button onClick={() => { setSelectedStudent(null); setSearchStudent(''); }} className="ml-1 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]">✕</button>
          </motion.div>
        )}
      </div>

      {/* 兑换成功动画 */}
      <AnimatePresence>
        {showCelebration && celebratedGift && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
              className="bg-[var(--color-cardBg)] rounded-[var(--radius-lg)] p-8 text-center shadow-2xl border-4 border-[var(--color-primary)]">
              <motion.span className="text-6xl block mb-4" animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
                {celebratedGift.emoji}
              </motion.span>
              <h2 className="text-2xl font-display font-bold text-[var(--color-primary)] mb-2">兑换成功！🎉</h2>
              <p className="text-lg text-[var(--color-text)]">{selectedStudent?.name} 获得了 <strong>{celebratedGift.name}</strong></p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">消耗 ⭐ {celebratedGift.points_price} 分</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : gifts.length === 0 ? (
        <EmptyState emoji="🎁" title="还没有礼物哦~" description="请先在礼物管理中添加可兑换的礼物" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {gifts.map((g, i) => {
              const canExchange = selectedStudent && selectedStudent.points >= g.points_price && g.stock !== 0;
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`${!canExchange && selectedStudent ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {g.image_url ? (
                        <img src={g.image_url} alt={g.name} className="w-16 h-16 rounded-[var(--radius-md)] object-cover border-2 border-[var(--color-border)]" />
                      ) : (
                        <span className="text-4xl">{g.emoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-[var(--color-text)] truncate">{g.name}</h3>
                        <p className="text-lg font-display font-bold text-[var(--color-primary)]">⭐ {g.points_price} 分</p>
                        {g.stock >= 0 && <p className="text-xs text-[var(--color-text-secondary)]">库存: {g.stock}</p>}
                        {g.stock === 0 && <p className="text-xs text-[var(--color-danger)] font-bold">已售罄</p>}
                      </div>
                    </div>
                    {g.description && <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">{g.description}</p>}
                    <Button
                      variant={canExchange ? 'success' : 'secondary'}
                      size="sm" className="w-full"
                      disabled={!canExchange}
                      onClick={() => { setSelectedGift(g); setShowConfirm(true); }}
                    >
                      {!selectedStudent ? '👆 请先选择学生' :
                        g.stock === 0 ? '😢 已售罄' :
                        selectedStudent.points < g.points_price ? `😅 积分不足 (差${g.points_price - selectedStudent.points}分)` :
                        `🎁 兑换 (需${g.points_price}分)`}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 确认兑换弹窗 */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="🎁 确认兑换">
        <div className="space-y-4 text-center">
          <span className="text-5xl block">{selectedGift?.emoji}</span>
          <div>
            <p className="text-lg font-bold text-[var(--color-text)]">
              {selectedStudent?.name} {selectedStudent?.avatar_emoji}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">当前积分: ⭐ {selectedStudent?.points} 分</p>
          </div>
          <div>
            <p className="font-display font-bold text-[var(--color-text)]">兑换 <span className="text-[var(--color-primary)]">{selectedGift?.name}</span></p>
            <motion.p className="text-2xl font-display font-bold mt-2"
              animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              ⭐ {selectedGift?.points_price} 分
            </motion.p>
            {selectedStudent && selectedGift && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                剩余积分: {selectedStudent.points - selectedGift.points_price} 分
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>取消</Button>
            <Button variant="success" onClick={handleExchange} disabled={exchanging}>
              {exchanging ? '兑换中...' : '🎉 确认兑换'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
