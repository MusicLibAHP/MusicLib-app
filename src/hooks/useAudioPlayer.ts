// ============================================
// HOOK — Lecteur Audio Global
// ============================================
import { useEffect, useCallback } from 'react';
import type { CurrentTrack } from '../types/music';

function getImageMimeType(url: string): string {
    if (!url) return 'image/jpeg';
    const lower = url.toLowerCase();
    if (lower.includes('.png')) return 'image/png';
    if (lower.includes('.webp')) return 'image/webp';
    if (lower.includes('.svg')) return 'image/svg+xml';
    return 'image/jpeg';
}

// Initialisation singleton de l'audio global
if (!window.globalAudio) {
    window.globalAudio = new Audio();
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

// Gestionnaire "ended" unique pour la piste suivante
let endedListenerAdded = false;
if (!endedListenerAdded) {
    window.globalAudio.addEventListener('ended', () => {
        setTimeout(() => {
            if (typeof window.globalPlayerNav.next === 'function') {
                window.globalPlayerNav.next();
            }
        }, 300);
    });
    endedListenerAdded = true;
}

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

    navigator.mediaSession.setActionHandler('play', () => {
        window.globalAudio.play().catch(() => { });
        navigator.mediaSession.playbackState = 'playing';
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        window.globalAudio.pause();
        navigator.mediaSession.playbackState = 'paused';
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
    navigator.mediaSession.playbackState = window.globalAudio.paused
        ? 'paused'
        : 'playing';
}

// Fonction globale de lecture
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
    audio.src = trackUrl;
    audio.play().catch((err) => console.warn('[Player] Erreur lecture :', err));

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
    // Dispatch event so MiniPlayer re-renders
    window.dispatchEvent(new CustomEvent('trackChanged'));
};

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
                window.globalAudio.currentTime = data.time ?? 0;
                if (data.isPlaying) {
                    window.globalAudio.play().catch(() => { });
                }
                updateMediaSession();
                window.dispatchEvent(new CustomEvent('trackChanged'));
            }
        } catch (e) {
            console.error('[Player] Erreur restauration:', e);
        }
    }, []);

    useEffect(() => {
        // Sauvegarde position toutes les 500ms
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

        const handleTimeUpdateMediaSession = () => {
            if ('mediaSession' in navigator && window.globalAudio.duration) {
                try {
                    navigator.mediaSession.setPositionState({
                        duration: window.globalAudio.duration,
                        playbackRate: window.globalAudio.playbackRate,
                        position: window.globalAudio.currentTime,
                    });
                } catch { }
            }
        };

        window.globalAudio.addEventListener('timeupdate', handleTimeUpdate);
        window.globalAudio.addEventListener(
            'timeupdate',
            handleTimeUpdateMediaSession
        );

        return () => {
            clearTimeout(saveTimeout);
            window.globalAudio.removeEventListener('timeupdate', handleTimeUpdate);
            window.globalAudio.removeEventListener(
                'timeupdate',
                handleTimeUpdateMediaSession
            );
        };
    }, []);

    return { restoreTrack };
}