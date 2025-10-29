import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { getRingtoneUrl, getDefaultRingtone } from './ringtones';

let currentSound = null;
let isAudioSessionInitialized = false;

export async function setSystemVolumeToMax() {
  try {
    console.log('[AudioManager] Setting audio session for maximum volume playback');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });
    console.log('[AudioManager] Audio session optimized for alarm playback');
    return { success: true };
  } catch (error) {
    console.error('[AudioManager] Failed to optimize audio session:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function initAudioSession() {
  if (isAudioSessionInitialized) {
    console.log('[AudioManager] Audio session already initialized');
    return true;
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });

    isAudioSessionInitialized = true;
    console.log('[AudioManager] Audio session initialized successfully');
    return true;
  } catch (error) {
    console.error('[AudioManager] Failed to initialize audio session:', error);
    return false;
  }
}

export async function playAlarmRingtone(ringtoneUri = null, options = {}) {
  try {
    await setSystemVolumeToMax();
    await initAudioSession();

    if (currentSound) {
      console.log('[AudioManager] Stopping current sound before playing new ringtone');
      await stopAllSounds();
    }

    const soundOptions = {
      shouldPlay: true,
      isLooping: options.loop !== false,
      volume: options.volume || 1.0,
      rate: 1.0,
      shouldCorrectPitch: true,
    };

    let finalRingtoneUri = ringtoneUri;

    if (!finalRingtoneUri) {
      const defaultRingtone = getDefaultRingtone();
      finalRingtoneUri = defaultRingtone.url;
      console.log('[AudioManager] Using default ringtone:', defaultRingtone.name);
    }

    if (finalRingtoneUri && finalRingtoneUri.startsWith('http')) {
      console.log('[AudioManager] Loading ringtone from URL:', finalRingtoneUri);
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: finalRingtoneUri },
          soundOptions
        );
        currentSound = sound;
      } catch (error) {
        console.error('[AudioManager] Failed to load ringtone, using notification sound');
        return await playSystemAlarmSound();
      }
    } else {
      console.log('[AudioManager] Invalid ringtone URL, using system sound');
      return await playSystemAlarmSound();
    }

    if (currentSound) {
      currentSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish && !status.isLooping) {
          console.log('[AudioManager] Ringtone finished playing');
        }
      });
    }

    console.log('[AudioManager] Ringtone started playing');
    return { success: true };
  } catch (error) {
    console.error('[AudioManager] Failed to play ringtone:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function playSystemAlarmSound() {
  try {
    await initAudioSession();

    if (currentSound) {
      await stopAllSounds();
    }

    console.log('[AudioManager] Using system notification channel for alarm');

    currentSound = null;

    return { success: true, usesNotification: true };
  } catch (error) {
    console.error('[AudioManager] Failed to play system alarm sound:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function speakWakeMessage(text, options = {}) {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      console.log('[AudioManager] Already speaking, stopping previous speech');
      await Speech.stop();
    }

    const speechOptions = {
      language: options.language || 'en-US',
      pitch: options.pitch || 1.0,
      rate: options.rate || 0.9,
      volume: options.volume || 1.0,
      voice: options.voice || undefined,
      onStart: () => {
        console.log('[AudioManager] Started speaking:', text);
      },
      onDone: () => {
        console.log('[AudioManager] Finished speaking');
      },
      onError: (error) => {
        console.error('[AudioManager] Speech error:', error);
      },
    };

    await Speech.speak(text, speechOptions);
    return { success: true };
  } catch (error) {
    console.error('[AudioManager] Failed to speak message:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function stopAllSounds() {
  try {
    if (currentSound) {
      console.log('[AudioManager] Stopping current sound');
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      console.log('[AudioManager] Stopping speech');
      await Speech.stop();
    }

    console.log('[AudioManager] All sounds stopped');
    return { success: true };
  } catch (error) {
    console.error('[AudioManager] Failed to stop sounds:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function pauseSound() {
  try {
    if (currentSound) {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await currentSound.pauseAsync();
        console.log('[AudioManager] Sound paused');
        return { success: true };
      }
    }
    return { success: false, error: 'No sound playing' };
  } catch (error) {
    console.error('[AudioManager] Failed to pause sound:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function resumeSound() {
  try {
    if (currentSound) {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await currentSound.playAsync();
        console.log('[AudioManager] Sound resumed');
        return { success: true };
      }
    }
    return { success: false, error: 'No sound to resume' };
  } catch (error) {
    console.error('[AudioManager] Failed to resume sound:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function setVolume(volume) {
  try {
    if (currentSound) {
      await currentSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      console.log('[AudioManager] Volume set to:', volume);
      return { success: true };
    }
    return { success: false, error: 'No sound loaded' };
  } catch (error) {
    console.error('[AudioManager] Failed to set volume:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function fadeOut(durationMs = 2000) {
  try {
    if (!currentSound) {
      return { success: false, error: 'No sound loaded' };
    }

    const status = await currentSound.getStatusAsync();
    if (!status.isLoaded || !status.isPlaying) {
      return { success: false, error: 'Sound not playing' };
    }

    const startVolume = status.volume || 1.0;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeDecrement = startVolume / steps;

    for (let i = 0; i < steps; i++) {
      const newVolume = startVolume - (volumeDecrement * (i + 1));
      await currentSound.setVolumeAsync(Math.max(0, newVolume));
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    await stopAllSounds();
    console.log('[AudioManager] Fade out completed');
    return { success: true };
  } catch (error) {
    console.error('[AudioManager] Failed to fade out:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAvailableVoices() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.filter(voice => voice.language.startsWith('en'));
  } catch (error) {
    console.error('[AudioManager] Failed to get available voices:', error);
    return [];
  }
}

export async function isPlaying() {
  try {
    if (!currentSound) {
      return false;
    }

    const status = await currentSound.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch (error) {
    console.error('[AudioManager] Failed to check playing status:', error);
    return false;
  }
}

export async function getCurrentSoundStatus() {
  try {
    if (!currentSound) {
      return null;
    }

    const status = await currentSound.getStatusAsync();
    return {
      isLoaded: status.isLoaded,
      isPlaying: status.isPlaying,
      volume: status.volume,
      duration: status.durationMillis,
      position: status.positionMillis,
    };
  } catch (error) {
    console.error('[AudioManager] Failed to get sound status:', error);
    return null;
  }
}

export function cleanup() {
  if (currentSound) {
    currentSound.unloadAsync().catch(console.error);
    currentSound = null;
  }
  isAudioSessionInitialized = false;
  console.log('[AudioManager] Cleanup completed');
}
