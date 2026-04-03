// ============================================
// HOOK — Lecteur Audio Global (robuste)
// Wake Lock API → empêche la mise en veille
// MediaSession → contrôles écran verrouillé
// ended → piste suivante automatique
// ============================================
import { useEffect, useCallback } from 'react';
import type { CurrentTrack } from '../types/music';

// ─── Wake Lock ────────────────────────────────────────────────────────────────
// Empêche le téléphone de couper l'audio en veille sur certains navigateurs.
// On demande le lock au play, on le libère au pause/ended.
let wakeLock: WakeLockSentinel | null = null;

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    if (wakeLock && !wakeLock.released) return; // déjà actif
    wakeLock = await (navigator as Navigator & { wakeLock: WakeLockManager }).wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      // Re-demander si la lecture est encore active quand la page redevient visible
      wakeLock = null;
    });
  } catch {
    // Wake Lock refusé (batterie faible, etc.) — pas bloquant
  }
}

function releaseWakeLock() {
  if (wakeLock && !wakeLock.released) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

// Re-acquérir le Wake Lock quand la page redevient visible (ex: retour de veille)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !window.globalAudio.paused) {
    requestWakeLock();
  }
});

// ─── Types manquants ──────────────────────────────────────────────────────────
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  release(): Promise<void>;
}
interface WakeLockManager {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getImageMimeType(url: string): string {
  if (!url) return 'image/jpeg';
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

// ─── Singleton Audio ──────────────────────────────────────────────────────────
if (!window.globalAudio) {
  window.globalAudio = new Audio();
  // Indispensable pour la lecture en arrière-plan sur iOS Safari
  window.globalAudio.preload = 'auto';
}
if (!window.globalAudioData) {
  window.globalAudioData = {
    title: '',
    artist: '',
    album: '',
    cover: '',
    artistId: '',
    albumId: '',
  };
}
if (!window.globalPlayerNav) {
  window.globalPlayerNav = { prev: null, next: null };
}

// ─── Gestionnaire "ended" unique ──────────────────────────────────────────────
// Un seul listener, jamais doublé. Lance la piste suivante avec un léger délai.
let endedListenerAdded = false;
if (!endedListenerAdded) {
  window.globalAudio.addEventListener('ended', () => {
    releaseWakeLock();
    // Délai court pour laisser le temps au DOM de se stabiliser
    setTimeout(() => {
      if (typeof window.globalPlayerNav.next === 'function') {
        window.globalPlayerNav.next();
      }
    }, 300);
  });
  endedListenerAdded = true;
}

// ─── Media Session ────────────────────────────────────────────────────────────
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const data = window.globalAudioData;
  const mimeType = getImageMimeType(data.cover);
  const artwork = data.cover
    ? [
        { src: data.cover, sizes: '256x256', type: mimeType },
        { src: data.cover, sizes: '512x512', type: mimeType },
      ]
    : [];

  navigator.mediaSession.metadata = new MediaMetadata({
    title: data.title || 'Lecture en cours',
    artist: data.artist || '',
    album: data.album || '',
    artwork,
  });

  // Enregistrer les actions UNE seule fois suffit, mais on les réenregistre
  // à chaque piste pour que prev/next pointent vers les bonnes fonctions.
  navigator.mediaSession.setActionHandler('play', () => {
    window.globalAudio.play().catch(() => {});
    navigator.mediaSession.playbackState = 'playing';
    requestWakeLock();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    window.globalAudio.pause();
    navigator.mediaSession.playbackState = 'paused';
    releaseWakeLock();
  });
  navigator.mediaSession.setActionHandler('stop', () => {
    window.globalAudio.pause();
    navigator.mediaSession.playbackState = 'paused';
    releaseWakeLock();
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    window.globalPlayerNav.prev?.();
  });
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    window.globalPlayerNav.next?.();
  });
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime !== undefined) {
      window.globalAudio.currentTime = details.seekTime;
    }
  });
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    window.globalAudio.currentTime = Math.max(
      0,
      window.globalAudio.currentTime - (details.seekOffset ?? 10)
    );
  });
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    window.globalAudio.currentTime = Math.min(
      window.globalAudio.duration || 0,
      window.globalAudio.currentTime + (details.seekOffset ?? 10)
    );
  });

  navigator.mediaSession.playbackState = window.globalAudio.paused
    ? 'paused'
    : 'playing';
}

// ─── Fonction globale de lecture ──────────────────────────────────────────────
window.playGlobalTrack = function (
  trackUrl,
  title,
  artist,
  album,
  cover = '',
  artistId = '',
  albumId = ''
) {
  const audio = window.globalAudio;

  // Stopper proprement avant de changer de src
  audio.pause();
  audio.src = trackUrl;
  audio.load(); // force le rechargement (important sur iOS)

  audio.play().catch((err) => console.warn('[Player] Erreur lecture :', err));

  // Acquérir le Wake Lock
  requestWakeLock();

  window.globalAudioData.title = title;
  window.globalAudioData.artist = artist;
  window.globalAudioData.album = album;
  window.globalAudioData.cover = cover;
  window.globalAudioData.artistId = artistId;
  window.globalAudioData.albumId = albumId;

  const trackData: CurrentTrack = {
    url: trackUrl,
    title,
    artist,
    album,
    cover,
    artistId,
    albumId,
    time: 0,
    isPlaying: true,
  };
  localStorage.setItem('currentTrack', JSON.stringify(trackData));

  updateMediaSession();
  window.dispatchEvent(new CustomEvent('trackChanged'));
};

// ─── Hook React ───────────────────────────────────────────────────────────────
export function useAudioPlayer() {
  const restoreTrack = useCallback(() => {
    const saved = localStorage.getItem('currentTrack');
    if (!saved) return;
    try {
      const data: CurrentTrack = JSON.parse(saved);
      if (data.url && window.globalAudio.src !== data.url) {
        window.globalAudioData.title = data.title;
        window.globalAudioData.artist = data.artist;
        window.globalAudioData.album = data.album;
        window.globalAudioData.cover = data.cover ?? '';
        window.globalAudioData.artistId = data.artistId ?? '';
        window.globalAudioData.albumId = data.albumId ?? '';
        window.globalAudio.src = data.url;
        window.globalAudio.load();
        window.globalAudio.currentTime = data.time ?? 0;
        if (data.isPlaying) {
          window.globalAudio
            .play()
            .then(() => requestWakeLock())
            .catch(() => {});
        }
        updateMediaSession();
        window.dispatchEvent(new CustomEvent('trackChanged'));
      }
    } catch (e) {
      console.error('[Player] Erreur restauration:', e);
    }
  }, []);

  useEffect(() => {
    // ── Wake Lock sur play/pause ──
    const onPlay = () => requestWakeLock();
    const onPause = () => releaseWakeLock();
    window.globalAudio.addEventListener('play', onPlay);
    window.globalAudio.addEventListener('pause', onPause);

    // ── Sauvegarde de position (throttle 500ms) ──
    let saveTimeout: ReturnType<typeof setTimeout>;
    const handleTimeUpdate = () => {
      if (!window.globalAudioData.title) return;
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const saved = JSON.parse(
          localStorage.getItem('currentTrack') || '{}'
        );
        if (saved.url) {
          saved.time = window.globalAudio.currentTime;
          saved.isPlaying = !window.globalAudio.paused;
          localStorage.setItem('currentTrack', JSON.stringify(saved));
        }
      }, 500);
    };

    // ── MediaSession position state ──
    const handlePositionState = () => {
      if ('mediaSession' in navigator && window.globalAudio.duration) {
        try {
          navigator.mediaSession.setPositionState({
            duration: window.globalAudio.duration,
            playbackRate: window.globalAudio.playbackRate,
            position: Math.min(
              window.globalAudio.currentTime,
              window.globalAudio.duration
            ),
          });
        } catch {}
      }
    };

    window.globalAudio.addEventListener('timeupdate', handleTimeUpdate);
    window.globalAudio.addEventListener('timeupdate', handlePositionState);

    return () => {
      clearTimeout(saveTimeout);
      window.globalAudio.removeEventListener('play', onPlay);
      window.globalAudio.removeEventListener('pause', onPause);
      window.globalAudio.removeEventListener('timeupdate', handleTimeUpdate);
      window.globalAudio.removeEventListener('timeupdate', handlePositionState);
    };
  }, []);

  return { restoreTrack };
}
