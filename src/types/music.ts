// ============================================
// TYPES TYPESCRIPT — MusicLibrary
// ============================================

export interface Track {
  title: string;
  url: string;
}

export interface Album {
  id: string;
  name: string;
  year: string | number;
  cover: string;
  cdnPath: string;
  projectName: string;
  albumSize?: string;
  albumOffset?: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  genres?: string[];
  albums: Album[];
}

export interface CurrentTrack {
  url: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  artistId: string;
  albumId: string;
  time: number;
  isPlaying: boolean;
}

export interface PlayerNav {
  prev: (() => void) | null;
  next: (() => void) | null;
}

// Extend window for compatibility with existing JS artist files
declare global {
  interface Window {
    addArtist: (artist: Artist) => void;
    musicLibrary: { artists: Artist[] };
    globalAudio: HTMLAudioElement;
    globalAudioData: {
      title: string;
      artist: string;
      album: string;
      cover: string;
      artistId: string;
      albumId: string;
    };
    globalPlayerNav: PlayerNav;
    playGlobalTrack: (
      url: string,
      title: string,
      artist: string,
      album: string,
      cover?: string,
      artistId?: string,
      albumId?: string
    ) => void;
    _durationCache: Record<string, string>;
  }
}
