'use strict';
/* audio.js — every sound is synthesized with WebAudio. No audio files. */
window.NL = window.NL || {};

NL.Audio = (() => {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return true;
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol, cutoff) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff || 600;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
  }

  return {
    ensure,
    footstep(crouched) { noise(0.07, crouched ? 0.04 : 0.11, crouched ? 380 : 560); },
    pickup() { tone(660, 0.09, 'square', 0.13); tone(990, 0.13, 'square', 0.13, null, 0.07); },
    suspicious() { tone(196, 0.16, 'sawtooth', 0.07, 294); },
    spotted() { tone(440, 0.12, 'sawtooth', 0.16, 587); tone(440, 0.12, 'sawtooth', 0.16, 587, 0.16); },
    caught() { tone(170, 0.55, 'sawtooth', 0.28, 42); noise(0.4, 0.18, 900); },
    clear() { tone(523, 0.14, 'triangle', 0.18); tone(784, 0.2, 'triangle', 0.18, null, 0.1); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, null, i * 0.12)); },
    toggleMute() { muted = !muted; return muted; },
  };
})();
