import Phaser from "phaser";

/**
 * Sound effects synthesized with the Web Audio API, so the game ships no audio files.
 * Everything plays through Phaser's own audio context: Phaser unlocks it on the first tap or key,
 * suspends it when the tab is hidden, and `game.sound.mute` silences all of it.
 */

const STORE_KEY = "samurai.sound";

let manager: Phaser.Sound.WebAudioSoundManager | undefined;
let noiseBuffer: AudioBuffer | undefined;
// Tracked here because Phaser's `mute` getter reads a gain value that stays stale until audio unlocks.
let enabled = readSetting();

function readSetting() {
  try {
    return localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function initSfx(game: Phaser.Game) {
  if (!(game.sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
  manager = game.sound;
  manager.mute = !enabled;
}

export function soundEnabled() {
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORE_KEY, on ? "on" : "off");
  } catch {
    /* private mode: keep the setting for this visit only */
  }
  if (manager) manager.mute = !on;
}

type ToneOpts = {
  type?: OscillatorType;
  from: number; // start frequency in Hz
  to?: number; // end frequency (pitch slide)
  dur: number; // seconds
  vol?: number;
  delay?: number; // seconds from now
};

function ready() {
  if (!manager || !enabled || manager.context.state !== "running") return undefined;
  return manager;
}

function tone({ type = "square", from, to = from, dur, vol = 0.15, delay = 0 }: ToneOpts) {
  const m = ready();
  if (!m) return;
  const ctx = m.context;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(m.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

type NoiseOpts = {
  from: number; // band-pass centre at start, Hz
  to?: number;
  dur: number;
  vol?: number;
  q?: number;
  delay?: number;
};

function noise({ from, to = from, dur, vol = 0.3, q = 1.5, delay = 0 }: NoiseOpts) {
  const m = ready();
  if (!m) return;
  const ctx = m.context;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(m.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

/** Pentatonic notes (A minor) for the jingles. */
const NOTE = { A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, A5: 880 };

export const sfx = {
  swing() {
    noise({ from: 900, to: 3800, dur: 0.13, vol: 0.35, q: 2 });
  },
  hit() {
    tone({ type: "square", from: 180, to: 60, dur: 0.12, vol: 0.2 });
    noise({ from: 2500, to: 800, dur: 0.08, vol: 0.4, q: 0.8 });
  },
  kill() {
    sfx.hit();
    tone({ type: "triangle", from: 520, to: 110, dur: 0.35, vol: 0.18, delay: 0.05 });
  },
  /** The ronin's blade glints before it strikes: a clear warning to dodge or swing first. */
  enemyWindup(vol = 1) {
    tone({ type: "sine", from: 1800, to: 2600, dur: 0.18, vol: 0.06 * vol });
    tone({ type: "sine", from: 2700, to: 3900, dur: 0.12, vol: 0.03 * vol, delay: 0.02 });
  },
  enemyStrike(vol = 1) {
    noise({ from: 500, to: 1800, dur: 0.16, vol: 0.25 * vol, q: 2 });
  },
  hurt() {
    tone({ type: "sawtooth", from: 320, to: 90, dur: 0.25, vol: 0.16 });
    noise({ from: 400, to: 150, dur: 0.2, vol: 0.3, q: 0.7 });
  },
  jump() {
    tone({ type: "square", from: 240, to: 520, dur: 0.1, vol: 0.07 });
  },
  land() {
    noise({ from: 260, to: 90, dur: 0.09, vol: 0.25, q: 0.8 });
  },
  star() {
    tone({ type: "sine", from: NOTE.E5, dur: 0.08, vol: 0.12 });
    tone({ type: "sine", from: NOTE.A5, dur: 0.16, vol: 0.12, delay: 0.06 });
  },
  heal() {
    [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.A5].forEach((f, i) => tone({ type: "triangle", from: f, dur: 0.18, vol: 0.12, delay: i * 0.07 }));
  },
  pit() {
    tone({ type: "sine", from: 900, to: 120, dur: 0.5, vol: 0.12 });
  },
  win() {
    const tune = [NOTE.A4, NOTE.C5, NOTE.D5, NOTE.E5, NOTE.D5, NOTE.E5, NOTE.A5];
    tune.forEach((f, i) => tone({ type: "triangle", from: f, dur: i === tune.length - 1 ? 0.6 : 0.16, vol: 0.14, delay: i * 0.13 }));
  },
  lose() {
    const tune = [NOTE.E4, NOTE.D4, NOTE.C4, NOTE.A3];
    tune.forEach((f, i) => tone({ type: "triangle", from: f, dur: i === tune.length - 1 ? 0.7 : 0.25, vol: 0.14, delay: i * 0.22 }));
  },
  click() {
    tone({ type: "square", from: 660, to: 880, dur: 0.05, vol: 0.06 });
  },
};
