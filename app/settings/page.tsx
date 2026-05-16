'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RainbowDivider } from '@/components/ui/RainbowDivider';
import { toast } from '@/components/ui/Toast';
import { setSoundEnabled as saveSoundEnabled, setSoundVolume as saveSoundVolume } from '@/lib/sounds';

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(70);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const enabled = d.data.sound_enabled ?? true;
          const volume = d.data.sound_volume ?? 0.5;
          setSoundEnabled(enabled);
          setSoundVolume(Math.round(volume * 100));
          saveSoundEnabled(enabled);
          saveSoundVolume(volume);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { toast('请填写旧密码和新密码', 'error'); return; }
    if (newPassword.length < 6) { toast('新密码至少6位', 'error'); return; }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast('密码已修改！🔒', 'success');
        setShowPassword(false); setOldPassword(''); setNewPassword('');
      } else toast(data.error || '修改失败', 'error');
    } catch { toast('修改失败', 'error'); }
    finally { setChangingPassword(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soundEnabled,
          soundVolume: soundVolume / 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast('设置已保存！✨', 'success');
        saveSoundEnabled(soundEnabled);
        saveSoundVolume(soundVolume / 100);
      } else toast(data.error || '保存失败', 'error');
    } catch { toast('保存失败', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">⚙️ 个性化设置</h1>

      <section>
        <h2 className="text-lg font-display font-bold text-[var(--color-text)] mb-4">🔊 音效设置</h2>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--color-text)]">音效开关</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-4 py-1.5 rounded-[var(--radius-full)] text-sm font-bold cursor-pointer transition-colors ${
                soundEnabled ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}
            >
              {soundEnabled ? '🟢 开启' : '⚪ 关闭'}
            </button>
          </div>
          <div>
            <span className="text-sm font-bold text-[var(--color-text)]">音量: {soundVolume}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={soundVolume}
              onChange={e => setSoundVolume(Number(e.target.value))}
              className="w-full mt-2 accent-[var(--color-primary)]"
            />
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-display font-bold text-[var(--color-text)] mb-4">🔒 账号安全</h2>
        <Card>
          {!showPassword ? (
            <Button variant="secondary" size="sm" onClick={() => setShowPassword(true)}>🔑 修改密码</Button>
          ) : (
            <div className="space-y-3">
              <Input
                type="password"
                label="旧密码"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
              />
              <Input
                type="password"
                label="新密码 (至少6位)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowPassword(false); setOldPassword(''); setNewPassword(''); }}>取消</Button>
                <Button variant="primary" size="sm" onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? '修改中...' : '确认修改'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      <RainbowDivider />

      <Button variant="primary" size="lg" className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? '⏳ 保存中...' : '💾 保存设置'}
      </Button>
    </div>
  );
}
