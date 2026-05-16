'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Phone, Lock, School, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/Toast';

interface SchoolOption {
  teacherId: string;
  schoolId: string;
  schoolName: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  // 多学校选择状态
  const [showSchoolSelect, setShowSchoolSelect] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast('请输入手机号和密码', 'error');
      return;
    }
    setLoading(true);
    const result = await login(phone, password);
    setLoading(false);

    if (result.needsSchoolSelect) {
      setSchools(result.schools);
      setShowSchoolSelect(true);
    } else if (result.success) {
      toast('欢迎回来！🌈', 'success');
      router.push('/dashboard');
    } else {
      toast(result.error || '登录失败', 'error');
    }
  };

  const handleSchoolSelect = async (school: SchoolOption) => {
    setLoading(true);
    const result = await login(phone, password, school.schoolId);
    setLoading(false);

    if (result.success && !result.needsSchoolSelect) {
      toast('欢迎回来！🌈', 'success');
      router.push('/dashboard');
    } else {
      toast(result.error || '登录失败', 'error');
      setShowSchoolSelect(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
      {/* 背景装饰 — 漂浮 emoji */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🌟', '⭐', '✨', '🎈', '🌈', '💫', '🦋', '🌸'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-20"
            style={{
              left: `${10 + (i * 11) % 80}%`,
              top: `${5 + (i * 13) % 85}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* 彩虹条顶部 */}
      <div className="absolute top-0 left-0 right-0 h-2 rainbow-divider" />

      {/* 登录卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 w-full max-w-sm mx-auto"
      >
        <div className="bg-[var(--color-card-bg)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-8 shadow-xl">
          <AnimatePresence mode="wait">
            {showSchoolSelect ? (
              <motion.div
                key="school-select"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-3"
                  >
                    🏫
                  </motion.div>
                  <h1 className="text-xl font-display font-bold text-[var(--color-text)]">
                    选择学校
                  </h1>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 font-body">
                    检测到你在多个学校任职，请选择要登录的学校
                  </p>
                </div>

                <div className="space-y-3">
                  {schools.map((school) => (
                    <button
                      key={school.teacherId}
                      onClick={() => handleSchoolSelect(school)}
                      disabled={loading}
                      className="w-full p-4 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)]
                                bg-[var(--color-bg)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5
                                transition-all duration-200 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center
                                      text-lg group-hover:scale-110 transition-transform">
                          🏫
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text)]">
                            {school.schoolName}
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)]">
                            {school.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowSchoolSelect(false)}
                  className="mt-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]
                            flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <ArrowLeft size={14} /> 返回重试
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* 标题 */}
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-3"
                  >
                    🌟
                  </motion.div>
                  <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">
                    积分乐园
                  </h1>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 font-body">
                    欢迎回来！请登录你的账号
                  </p>
                </div>

                {/* 表单 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <Phone size={14} /> 手机号
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border-2 border-[var(--color-border)]
                                bg-[var(--color-bg)] text-[var(--color-text)] font-body
                                focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                                transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <Lock size={14} /> 密码
                    </label>
                    <div className="relative">
                      <input
                        type={passwordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full px-4 py-2.5 pr-10 rounded-[var(--radius-md)] border-2 border-[var(--color-border)]
                                  bg-[var(--color-bg)] text-[var(--color-text)] font-body
                                  focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                                  transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer"
                        aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                      >
                        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]/60">
                      {passwordVisible ? '🔓 密码明文可见' : '🔒 密码已隐藏'}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    shimmer
                    className="w-full mt-6"
                    disabled={loading}
                  >
                    {loading ? '正在进入... 🏃' : '🚀 冲进乐园'}
                  </Button>
                </form>

                {/* 底部提示 */}
                <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6 font-body">
                  💡 没有账号？请联系管理员添加
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 底部彩虹条 */}
      <div className="absolute bottom-0 left-0 right-0 h-2 rainbow-divider" />
    </div>
  );
}
