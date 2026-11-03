let ctx: AudioContext | null = null;

/** Hay que llamarlo desde un gesto del usuario (política de autoplay). */
export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
}

/** Campanita de dos notas, sin archivos. */
export function chime() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [
    [880, 0],
    [1318.5, 0.16],
  ].forEach(([f, dt]) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + dt);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.9);
    o.connect(g).connect(ctx!.destination);
    o.start(t0 + dt);
    o.stop(t0 + dt + 1);
  });
}
