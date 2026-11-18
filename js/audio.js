import { stageIndex } from "./data.js";

let ctx = null;
let muted = false;

function context() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

export function tone(freq, dur = 0.15, type = "sine", gain = 0.05) {
  if (muted) return;
  const ac = context();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + dur);
}

export function creatureCall(species, stage) {
  const i = stageIndex(stage);
  const freq = species.voice * (1.45 - i * 0.13);
  tone(freq, 0.14, species.voiceType || "triangle", 0.045);
  if (i === 0) tone(freq * 1.55, 0.08, "sine", 0.03);
}

export function chime() {
  [523, 659, 784, 1046].forEach((f, i) => {
    setTimeout(() => tone(f, 0.18, "sine", 0.055), i * 90);
  });
}

export function eatSound() {
  tone(180, 0.08, "triangle", 0.04);
  setTimeout(() => tone(240, 0.1, "sine", 0.03), 70);
}

export function blip() {
  tone(660, 0.07, "sine", 0.04);
}
