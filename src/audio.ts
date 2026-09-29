type SoundName = "tap" | "correct" | "wrong" | "pass" | "finish";

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, volume: number, type: OscillatorType = "square"): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const patterns: Record<SoundName, Array<[number, number, number]>> = {
    tap: [[440, 0, 0.045]],
    correct: [[660, 0, 0.08], [880, 0.08, 0.12]],
    wrong: [[180, 0, 0.12], [130, 0.1, 0.16]],
    pass: [[330, 0, 0.07], [260, 0.07, 0.09]],
    finish: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.18]]
  };
  patterns[name].forEach(([frequency, offset, duration]) => tone(ctx, frequency, now + offset, duration, name === "wrong" ? 0.045 : 0.035));
}
