// lib/sounds.ts — 8-bit 音效系统 (Web Audio API)
// 所有音效通过程序化合成，无需外部音频文件

let audioCtx: AudioContext | null = null;
let _enabled = true;
let _volume = 0.5;

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function setSoundEnabled(v: boolean) { _enabled = v; }
export function setSoundVolume(v: number) { _volume = Math.max(0, Math.min(1, v)); }
export function isSoundEnabled() { return _enabled; }

function play(freq: number, type: OscillatorType, duration: number, startFreq?: number, endFreq?: number, gainCurve?: number[]) {
  if (!_enabled) return;
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq ?? freq, c.currentTime);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + duration);
    }
    const curve = gainCurve || [1, 1, 0.3, 0];
    gain.gain.setValueAtTime(curve[0] * _volume * 0.15, c.currentTime);
    curve.forEach((v, i) => {
      if (i > 0) gain.gain.linearRampToValueAtTime(v * _volume * 0.15, c.currentTime + (i / curve.length) * duration);
    });
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* audio not available */ }
}

// 加分音效 — 上升叮咚
export function playPointAdd() {
  play(523, 'square', 0.25, 523, 1047, [1, 1, 0.5, 0]);
  setTimeout(() => play(659, 'square', 0.2, 659, 1318, [0.8, 0.6, 0.3, 0]), 120);
}

// 扣分音效 — 下降低音
export function playPointDeduct() {
  play(330, 'triangle', 0.35, 330, 165, [1, 0.8, 0.5, 0]);
}

// 兑换成功 — 庆祝旋律
export function playExchange() {
  play(523, 'square', 0.15, 523, 784, [1, 0.7, 0]);
  setTimeout(() => play(659, 'square', 0.15, 659, 988, [0.8, 0.6, 0]), 100);
  setTimeout(() => play(784, 'square', 0.2, 784, 1047, [0.9, 0.7, 0.3, 0]), 200);
  setTimeout(() => play(1047, 'square', 0.3, 1047, 1318, [1, 0.8, 0.4, 0]), 320);
}

// 按钮点击
export function playClick() {
  play(880, 'square', 0.06, 880, 660, [0.5, 0]);
}

// Toast 通知
export function playToast() {
  play(660, 'triangle', 0.12, 660, 880, [0.6, 0.3, 0]);
}

// 弹窗打开
export function playModalOpen() {
  play(440, 'sine', 0.2, 330, 660, [0.6, 0.5, 0.2, 0]);
}

// 切换开关
export function playToggle() {
  play(600, 'square', 0.05, 600, 900, [0.4, 0]);
}

// 里程碑庆祝
export function playMilestone() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1318];
  notes.forEach((n, i) => {
    setTimeout(() => play(n, 'square', 0.2, n, n * 1.5, [0.8, 0.5, 0.2, 0]), i * 120);
  });
}
