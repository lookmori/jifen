'use client';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MomentItem {
  id: string;
  points_change: number;
  reason: string;
  type: string;
  image_url: string;
  teacher_name: string;
  created_at: string;
}

interface StudentMoments {
  id: string;
  name: string;
  points: number;
  avatar_emoji: string;
  moments: MomentItem[];
}

interface ClassInfo {
  id: string;
  name: string;
  teacher_name: string;
}

interface HighlightMomentsPDFProps {
  classInfo: ClassInfo;
  students: StudentMoments[];
  label?: string;
  autoGenerate?: boolean;
  onGenerated?: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function poeticReason(reason: string, type: string): string {
  const praiseMap: Record<string, string> = {
    '积极回答问题': '勇敢举起小手的那一刻，整个教室都被你的热情点亮了',
    '作业完成优秀': '一笔一划都是认真的模样，字里行间藏着你的努力',
    '帮助同学': '善良的心是最闪亮的星，你伸出援手的样子真美',
    '课堂纪律好': '安静专注的你，是课堂上最美的风景线',
    '考试成绩进步': '每一次进步都是汗水浇灌出的花朵，你做到了',
    '主动打扫卫生': '弯腰拾起的不仅是一张纸屑，更是一份对集体的热爱',
  };
  return praiseMap[reason] || (type === 'add'
    ? '这是属于你的高光时刻，每一个闪光点都值得被记住'
    : '成长路上总有小磕绊，但每一次反思都会让你更强大');
}

function buildHTML(classInfo: ClassInfo, students: StudentMoments[]): string {
  const now = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const studentPages = students.map((student) => {
    const momentsHTML = student.moments.map((m) => {
      const subtitle = poeticReason(m.reason, m.type);
      const dateStr = formatDate(m.created_at);
      return `
      <div class="moment-card">
        <div class="photo-frame">
          <img src="${m.image_url}" alt="${m.reason}" />
        </div>
        <div class="moment-text">
          <div class="points-badge ${m.type}">${m.type === 'add' ? '+' : ''}${m.points_change} 分 · ${m.type === 'add' ? '成长的足迹' : '反思的力量'}</div>
          <h3>${m.type === 'add' ? '✨' : '💪'} ${m.reason}</h3>
          <p class="subtitle">${subtitle}</p>
          <div class="meta">
            <span>📅 ${dateStr}</span>
            ${m.teacher_name ? `<span>👩‍🏫 记录人：${m.teacher_name}老师</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="student-page">
      <div class="student-card">
        <div class="avatar">${student.avatar_emoji}</div>
        <div class="student-info">
          <h2>${student.name}</h2>
          <p>⭐ 累计积分 <strong>${student.points}</strong> 分</p>
        </div>
        <div class="count-badge">${student.moments.length}<span>个瞬间</span></div>
      </div>
      ${momentsHTML}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>精彩瞬间 — ${classInfo.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
    background: #FFFAF5;
    color: #4A3728;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .student-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 48px 40px;
    page-break-after: always;
  }
  .student-page:last-child { page-break-after: auto; }

  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  .header .tag {
    font-size: 13px;
    color: #B0A89E;
    letter-spacing: 3px;
    margin-bottom: 12px;
  }
  .header .tag span { margin: 0 12px; color: #FF8C42; }
  .header h1 {
    font-family: 'ZCOOL KuaiLe', sans-serif;
    font-size: 38px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  .header .divider {
    width: 80px; height: 3px; border-radius: 2px;
    background: linear-gradient(90deg, #FF8C42, #FFD166, #EF476F);
    margin: 0 auto 12px;
  }
  .header .class-info { font-size: 14px; color: #8B7E74; }

  .student-card {
    display: flex; align-items: center; gap: 20px;
    padding: 24px 28px; margin-bottom: 36px;
    background: #fff; border-radius: 18px;
    box-shadow: 0 2px 12px rgba(255,140,66,0.06);
    border: 1px solid rgba(255,140,66,0.08);
  }
  .student-card .avatar {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #FFF5E8, #FFE0C0);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px;
  }
  .student-card .student-info { flex: 1; }
  .student-card .student-info h2 {
    font-family: 'ZCOOL KuaiLe', sans-serif;
    font-size: 24px; margin-bottom: 4px;
  }
  .student-card .student-info p { font-size: 13px; color: #8B7E74; }
  .student-card .student-info strong { color: #FF8C42; font-size: 16px; }
  .count-badge {
    text-align: center; padding: 10px 18px;
    background: linear-gradient(135deg, #FFF5E8, #FFE0C0);
    border-radius: 12px; font-size: 28px;
    font-family: 'ZCOOL KuaiLe', sans-serif;
    color: #FF8C42; line-height: 1;
  }
  .count-badge span { display: block; font-size: 11px; color: #8B7E74; margin-top: 2px; }

  .moment-card { margin-bottom: 40px; }
  .photo-frame {
    width: 100%; border-radius: 14px; overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.03);
    background: #fff;
  }
  .photo-frame img {
    width: 100%; max-height: 420px;
    object-fit: cover; display: block;
  }
  .moment-text { padding: 20px 16px 0; }
  .points-badge {
    display: inline-block; padding: 3px 12px;
    border-radius: 14px; font-size: 12px; font-weight: 600;
    margin-bottom: 12px; letter-spacing: 0.3px;
  }
  .points-badge.add { color: #06D6A0; background: rgba(6,214,160,0.08); }
  .points-badge.deduct { color: #EF476F; background: rgba(239,71,111,0.08); }
  .moment-text h3 {
    font-family: 'ZCOOL KuaiLe', sans-serif;
    font-size: 20px; margin-bottom: 8px;
  }
  .moment-text .subtitle {
    font-size: 14px; color: #8B7E74;
    line-height: 1.7; margin-bottom: 14px;
    font-style: italic;
  }
  .moment-text .meta {
    display: flex; gap: 18px; padding-top: 14px;
    border-top: 1px dashed rgba(255,140,66,0.2);
    font-size: 12px; color: #B0A89E;
  }

  .footer {
    text-align: center; margin-top: 40px; padding-top: 20px;
    border-top: 2px solid #FFE0C0;
  }
  .footer p { font-size: 12px; color: #B0A89E; margin-bottom: 2px; }

  @media print {
    body { background: #fff; }
    .student-page { padding: 30px 32px; max-width: 100%; }
    .photo-frame img { max-height: 320px; }
  }
</style>
</head>
<body>
  <div class="student-page">
    <div class="header">
      <div class="tag"><span>━</span> 成长纪念册 <span>━</span></div>
      <h1>精彩瞬间</h1>
      <div class="divider"></div>
      <p class="class-info">${classInfo.name} · ${classInfo.teacher_name}老师</p>
    </div>
    ${studentPages}
    <div class="footer">
      <p>🌈 积分乐园 · 让每一份努力都被看见</p>
      <p>导出日期: ${now}</p>
    </div>
  </div>
</body>
</html>`;
}

export function HighlightMomentsPDF({ classInfo, students, label, autoGenerate, onGenerated }: HighlightMomentsPDFProps) {
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleExport = useCallback(async () => {
    if (students.length === 0) {
      toast('没有精彩瞬间可导出', 'error');
      return;
    }
    setGenerating(true);
    try {
      const html = buildHTML(classInfo, students);
      const w = window.open('', '_blank');
      if (!w) { toast('请允许弹出窗口以导出 PDF', 'error'); setGenerating(false); return; }

      w.document.write(html);
      w.document.close();

      // 等图片全部加载完再触发打印
      const imgs = w.document.querySelectorAll('img');
      let loaded = 0;
      const total = imgs.length;

      if (total === 0) {
        w.print();
        setGenerating(false);
        onGenerated?.();
        return;
      }

      const checkDone = () => {
        loaded++;
        if (loaded >= total) {
          setTimeout(() => {
            w.print();
            setGenerating(false);
            onGenerated?.();
          }, 300);
        }
      };

      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) { checkDone(); return; }
        img.onload = checkDone;
        img.onerror = checkDone;
        // 超时兜底
        setTimeout(() => {
          if (!img.dataset.done) { img.dataset.done = '1'; checkDone(); }
        }, 8000);
      });
    } catch (err) {
      console.error('Export error:', err);
      toast('导出失败，请重试', 'error');
      setGenerating(false);
    }
  }, [students, classInfo, onGenerated]);

  useEffect(() => {
    if (autoGenerate && students.length > 0) {
      const timer = setTimeout(() => handleExport(), 300);
      return () => clearTimeout(timer);
    }
  }, [autoGenerate, students, handleExport]);

  const overlay = generating && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl p-8 shadow-xl text-center mx-4">
        <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mx-auto mb-4" />
        <p className="text-lg font-display font-bold text-[var(--color-text)]">正在准备精彩瞬间...</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">图片加载完成后将自动弹出打印窗口 ✨</p>
      </div>
    </div>
  );

  return (
    <>
      {!autoGenerate && (
        <Button
          variant="primary" size="sm" onClick={handleExport}
          disabled={generating || students.length === 0}
          className="gap-2"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {label || '📸 导出精彩瞬间'}
        </Button>
      )}
      {mounted && overlay && createPortal(overlay, document.body)}
    </>
  );
}
