// Sound notification utility for chat messages
let audioContext = null;
let soundEnabled = true;

// Initialize audio context (required for playing sounds)
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Play notification sound using Web Audio API
export const playNotificationSound = () => {
  if (!soundEnabled) return;

  try {
    const ctx = initAudioContext();
    
    // Create a pleasant notification sound (two-tone beep)
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect oscillators to gain node
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Set frequencies for a pleasant two-tone sound
    oscillator1.frequency.value = 800; // Higher tone
    oscillator2.frequency.value = 600; // Lower tone
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    // Set volume (gain)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    // Play the sound
    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.2);
    oscillator2.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

// Enable/disable sound notifications
export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
  localStorage.setItem('chatSoundEnabled', enabled.toString());
};

// Load sound preference from localStorage
export const getSoundEnabled = () => {
  const saved = localStorage.getItem('chatSoundEnabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
  return soundEnabled;
};

// Initialize sound preference on load
getSoundEnabled();

