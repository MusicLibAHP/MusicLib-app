import type { Artist } from "./types/music";

declare global {
    interface Window {
        musicLibrary: {
            artists: Artist[];
        };
        addArtist: (artist: Artist) => void;
    }
}

export { };