import type { AlarmSoundType } from '../types';

class FocusAudioEngine {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playAlarm(type: AlarmSoundType, volumePercent: number): void {
    const ctx = this.ensureContext();
    const vol = Math.max(0, Math.min(1, volumePercent / 100));
    if (vol === 0) return;

    const now = ctx.currentTime;

    if (type === 'bell') {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(vol * 0.25, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 1.2);
      });
    } else if (type === 'chime') {
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.22);

        gain.gain.setValueAtTime(0.0001, now + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(vol * 0.28, now + i * 0.22 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 1.5);
      });
    } else {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now + i * 0.25);

        gain.gain.setValueAtTime(0.0001, now + i * 0.25);
        gain.gain.exponentialRampToValueAtTime(vol * 0.2, now + i * 0.25 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.25 + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.25);
        osc.stop(now + i * 0.25 + 0.18);
      }
    }
  }
}

export const focusAudio = new FocusAudioEngine();
