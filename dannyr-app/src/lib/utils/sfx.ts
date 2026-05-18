/**
 * ANDCLAU Celestial SFX Engine
 * Synthesizes ultra-premium, low-latency UI sound effects using the browser's Web Audio API.
 * No external .mp3 files required!
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Create AudioContext lazily on first user interaction to satisfy browser security policies
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Play a very soft, tactile click for hover micro-interactions
 */
export function playHoverSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') return; // Don't block if not yet authorized by user click

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Ultra-short high frequency pop
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    // Very soft volume envelope
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Graceful failure if AudioContext is blocked
  }
}

/**
 * Play a satisfying, crisp mechanical click for buttons and links
 */
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (since click is a direct user action, browser will allow it)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Graceful failure
  }
}

/**
 * Play a beautiful, ascending luxury golden chime for success states
 */
export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;
    
    // Play a gorgeous major chord (arpeggio) with metallic sine tones
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Golden Chime)
    
    notes.forEach((freq, index) => {
      const time = now + index * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.03, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
      
      osc.start(time);
      osc.stop(time + 0.4);
    });
  } catch (e) {
    // Graceful failure
  }
}

/**
 * Play a gorgeous, synthesized "cha-ching" cash register/coins sound for sales success!
 */
export function playCashSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;

    // 1. High frequency bell "ping"
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(2200, now);
    bellOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    
    bellOsc.start(now);
    bellOsc.stop(now + 0.5);

    // 2. A quick metallic secondary resonance chime (creates a rich mechanical tone)
    const bellOsc2 = ctx.createOscillator();
    const bellGain2 = ctx.createGain();
    bellOsc2.connect(bellGain2);
    bellGain2.connect(ctx.destination);
    
    bellOsc2.type = 'sine';
    bellOsc2.frequency.setValueAtTime(2700, now);
    
    bellGain2.gain.setValueAtTime(0, now);
    bellGain2.gain.linearRampToValueAtTime(0.04, now + 0.01);
    bellGain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    
    bellOsc2.start(now);
    bellOsc2.stop(now + 0.4);

    // 3. The "cha-ching" mechanical sliding coins (rapid tumbling pitch arpeggios)
    const coinTimes = [0.08, 0.14, 0.20];
    coinTimes.forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1300, now + delay + 0.04);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.03, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.06);

      osc.start(now + delay);
      osc.stop(now + delay + 0.07);
    });
  } catch (e) {
    // Graceful failure
  }
}

