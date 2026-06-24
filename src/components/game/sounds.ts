// Shared click sound for all game buttons
export const playClickSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "square";
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

// Coin collection sound
export const playCoinSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.value = 0.2;
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
};

// Spooky ghost wail — eerie detuned descending tone with a creepy whisper layer
export const playGhostSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // Low howl
    const wail = ctx.createOscillator();
    const wailGain = ctx.createGain();
    wail.type = "sawtooth";
    wail.frequency.value = 220;
    wailGain.gain.value = 0.0;
    wail.connect(wailGain); wailGain.connect(master);
    wail.start();
    wailGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.15);
    wail.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 1.6);
    wailGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    wail.stop(ctx.currentTime + 1.85);

    // High shriek harmonic
    const shriek = ctx.createOscillator();
    const shriekGain = ctx.createGain();
    shriek.type = "triangle";
    shriek.frequency.value = 880;
    shriekGain.gain.value = 0.0;
    shriek.connect(shriekGain); shriekGain.connect(master);
    shriek.start();
    shriekGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1);
    shriek.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.4);
    shriekGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.7);
    shriek.stop(ctx.currentTime + 1.75);

    // Detune vibrato for creepiness
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 7;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(wail.frequency);
    lfoGain.connect(shriek.frequency);
    lfo.start();
    lfo.stop(ctx.currentTime + 1.85);

    setTimeout(() => { try { ctx.close(); } catch {} }, 2000);
  } catch {}
};
