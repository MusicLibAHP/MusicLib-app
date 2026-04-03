// ============================================
// MUSIC DATA — Compatible fichiers artistes .js
// ============================================

import type { Artist } from "../types/music";

/**
 * Sécurité TypeScript : extension du Window global
 */
declare global {
    interface Window {
        musicLibrary: {
            artists: Artist[];
        };
        addArtist: (artistData: Artist) => void;
    }
}

export { };

// ============================================
// INITIALISATION SAFE
// ============================================

// Initialise la bibliothèque si elle n'existe pas
if (typeof window !== "undefined") {
    window.musicLibrary = window.musicLibrary ?? { artists: [] };

    // IMPORTANT : éviter d'écraser une fonction existante par erreur
    if (typeof window.addArtist !== "function") {
        window.addArtist = (artistData: Artist) => {
            if (!window.musicLibrary) {
                window.musicLibrary = { artists: [] };
            }

            window.musicLibrary.artists.push(artistData);
        };
    }
}

// ============================================
// API FUNCTIONS
// ============================================

export function getMusicLibrary() {
    return window.musicLibrary ?? { artists: [] };
}

export function getArtist(artistId: string): Artist | undefined {
    return window.musicLibrary?.artists?.find((a) => a.id === artistId);
}

export function getAlbum(artistId: string, albumId: string) {
    const artist = getArtist(artistId);
    return artist?.albums?.find((alb) => alb.id === albumId);
}

export function getAllGenres(): string[] {
    const artists = window.musicLibrary?.artists ?? [];

    const genres = artists.flatMap((a) => a.genres ?? []);
    return [...new Set(genres)].sort();
}