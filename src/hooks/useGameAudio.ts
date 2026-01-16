import { useEffect, useRef, useCallback } from 'react';
import { useMissionStore } from '@/stores/missionStore';

// Pre-generated audio data URLs for instant playback (base64 encoded simple sounds)
// These are placeholder beeps/sounds - in production you'd use ElevenLabs API

const AUDIO_CONFIG = {
  // Background music volumes
  normalMusicVolume: 0.3,
  missionMusicVolume: 0.4,
  
  // SFX volumes
  hitVolume: 0.6,
  jumpScareVolume: 0.8,
  successVolume: 0.5,
  failVolume: 0.5,
};

// Simple oscillator-based sound generation
function createOscillatorSound(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.5
): () => void {
  return () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.value = volume;
      
      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  };
}

// Sound effects
export const playSounds = {
  hit: createOscillatorSound(200, 0.2, 'sawtooth', AUDIO_CONFIG.hitVolume),
  ouch: createOscillatorSound(150, 0.3, 'square', AUDIO_CONFIG.hitVolume),
  jumpScare: () => {
    // Multiple frequencies for scary effect
    createOscillatorSound(100, 0.5, 'sawtooth', AUDIO_CONFIG.jumpScareVolume)();
    setTimeout(() => createOscillatorSound(80, 0.3, 'square', 0.6)(), 100);
    setTimeout(() => createOscillatorSound(120, 0.4, 'sawtooth', 0.4)(), 200);
  },
  success: () => {
    createOscillatorSound(523, 0.15, 'sine', AUDIO_CONFIG.successVolume)(); // C5
    setTimeout(() => createOscillatorSound(659, 0.15, 'sine', AUDIO_CONFIG.successVolume)(), 150); // E5
    setTimeout(() => createOscillatorSound(784, 0.3, 'sine', AUDIO_CONFIG.successVolume)(), 300); // G5
  },
  fail: () => {
    createOscillatorSound(200, 0.3, 'sawtooth', AUDIO_CONFIG.failVolume)();
    setTimeout(() => createOscillatorSound(150, 0.4, 'sawtooth', AUDIO_CONFIG.failVolume)(), 200);
  },
  notification: createOscillatorSound(880, 0.1, 'sine', 0.3),
  zombieGroan: () => {
    createOscillatorSound(80, 0.5, 'sawtooth', 0.3)();
    setTimeout(() => createOscillatorSound(70, 0.3, 'sawtooth', 0.2)(), 300);
  },
};

// Background music using oscillators (simple ambient loops)
class BackgroundMusic {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentMode: 'normal' | 'mission' | 'none' = 'none';
  
  private createContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  playNormalMode() {
    if (this.currentMode === 'normal') return;
    this.stop();
    
    const ctx = this.createContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = AUDIO_CONFIG.normalMusicVolume;
    this.gainNode.connect(ctx.destination);
    
    // Calm ambient tones
    const frequencies = [220, 277, 330]; // A3, C#4, E4 (A major chord)
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(this.gainNode!);
      osc.start();
      this.oscillators.push(osc);
    });
    
    this.isPlaying = true;
    this.currentMode = 'normal';
  }
  
  playMissionMode() {
    if (this.currentMode === 'mission') return;
    this.stop();
    
    const ctx = this.createContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = AUDIO_CONFIG.missionMusicVolume;
    this.gainNode.connect(ctx.destination);
    
    // Tense, darker tones
    const frequencies = [110, 138, 165]; // A2, C#3, E3 (lower, more ominous)
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'triangle';
      osc.connect(this.gainNode!);
      osc.start();
      this.oscillators.push(osc);
    });
    
    // Add pulsing LFO for tension
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 2; // 2 Hz pulse
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.1;
    lfo.connect(lfoGain);
    lfoGain.connect(this.gainNode!.gain);
    lfo.start();
    this.oscillators.push(lfo);
    
    this.isPlaying = true;
    this.currentMode = 'mission';
  }
  
  stop() {
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.oscillators = [];
    this.isPlaying = false;
    this.currentMode = 'none';
  }
  
  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

export const backgroundMusic = new BackgroundMusic();

// Hook to manage game audio based on mission state
export function useGameAudio() {
  const { isActive, phase } = useMissionStore();
  const hasInteracted = useRef(false);
  
  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      hasInteracted.current = true;
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
  
  // Switch music based on mission state
  useEffect(() => {
    if (!hasInteracted.current) return;
    
    if (isActive && phase !== 'inactive' && phase !== 'completed') {
      backgroundMusic.playMissionMode();
    } else {
      backgroundMusic.playNormalMode();
    }
    
    return () => {
      // Don't stop on unmount, let it continue
    };
  }, [isActive, phase]);
  
  const playHitSound = useCallback(() => {
    playSounds.ouch();
  }, []);
  
  const playJumpScareSound = useCallback(() => {
    playSounds.jumpScare();
  }, []);
  
  const playSuccessSound = useCallback(() => {
    playSounds.success();
  }, []);
  
  const playFailSound = useCallback(() => {
    playSounds.fail();
  }, []);
  
  const playNotificationSound = useCallback(() => {
    playSounds.notification();
  }, []);
  
  return {
    playHitSound,
    playJumpScareSound,
    playSuccessSound,
    playFailSound,
    playNotificationSound,
  };
}
