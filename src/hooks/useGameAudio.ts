import { useEffect } from 'react';

let userHasInteracted = false;
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!userHasInteracted) return null;

  if (!sharedAudioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new Ctx();
  }

  if (sharedAudioContext.state === 'suspended') {
    // Best effort; must be within user gesture in many browsers.
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

function playTone(
  frequency: number,
  durationSeconds: number,
  type: OscillatorType,
  volume: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const t0 = ctx.currentTime;
    gainNode.gain.setValueAtTime(volume, t0);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t0 + durationSeconds);

    oscillator.start(t0);
    oscillator.stop(t0 + durationSeconds);
  } catch {
    // ignore
  }
}

// Only the sounds you requested: jump, walking, trap hit, notification
export const playSounds = {
  ouch: () => playTone(180, 0.18, 'square', 0.22),
  notification: () => playTone(880, 0.08, 'sine', 0.16),
  jump: () => {
    playTone(440, 0.06, 'sine', 0.12);
    setTimeout(() => playTone(660, 0.08, 'sine', 0.1), 60);
  },
  step: () => playTone(120, 0.04, 'triangle', 0.08),
};

// Hook only enables audio after the first user interaction (no background music)
export function useGameAudio() {
  useEffect(() => {
    const handleInteraction = () => {
      userHasInteracted = true;
      // Create/resume context eagerly after gesture
      const ctx = getAudioContext();
      ctx?.resume().catch(() => {});
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return null;
}
