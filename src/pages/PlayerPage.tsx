// ============================================
// PAGE — Lecteur (Player)
// ============================================
import { useEffect, useRef, useCallback } from "react";
import { getArtist, getAlbum } from "../data/musicLibrary";
import { Album3D } from "../components/Album3D";
import type { Route } from "../hooks/useRouter";

interface PlayerPageProps {
  artistId: string;
  albumId: string;
  navigateTo: (route: Route) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerPage({ artistId, albumId, navigateTo }: PlayerPageProps) {
  const artist = getArtist(artistId);
  const album = getAlbum(artistId, albumId);
  const listRef = useRef<HTMLUListElement>(null);
  const currentIndexRef = useRef(-1);

  useEffect(() => {
    if (!artist || !album) {
      navigateTo({ view: "artists" });
    }
  }, [artist, album, navigateTo]);

  useEffect(() => {
    if (artist && album) {
      document.title = `${album.name} — ${artist.name}`;
    }
    return () => {
      document.title = "MusicLibrary";
    };
  }, [artist, album]);

  const play = useCallback(
    (index: number) => {
      if (!artist || !album) return;
      const track = album.tracks[index];
      if (!track) return;

      currentIndexRef.current = index;

      // Mettre à jour la classe active dans la liste
      const lis = listRef.current?.querySelectorAll("li");
      lis?.forEach((li, i) => {
        li.classList.toggle("active", i === index);
      });

      // Scroll vers la piste active
      const activeLi = lis?.[index];
      activeLi?.scrollIntoView({ block: "nearest", behavior: "smooth" });

      window.playGlobalTrack(
        track.url,
        track.title,
        artist.name,
        `${album.year} — ${album.name}`,
        album.cover,
        artist.id,
        album.id,
      );

      // Mettre à jour les boutons prev/next
      window.globalPlayerNav.prev = index > 0 ? () => play(index - 1) : null;
      window.globalPlayerNav.next =
        index < album.tracks.length - 1 ? () => play(index + 1) : null;

      // Notifier le MiniPlayer
      window.dispatchEvent(new CustomEvent("navUpdated"));
    },
    [artist, album],
  );

  // Restaurer la piste active si elle appartient à cet album
  useEffect(() => {
    if (!album) return;
    const cached = _durationCacheInit(album.tracks.map((t) => t.url));

    // Restaurer l'état
    try {
      const saved = JSON.parse(localStorage.getItem("currentTrack") || "{}");
      if (saved.url) {
        const idx = album.tracks.findIndex((t) => t.url === saved.url);
        if (idx !== -1) {
          currentIndexRef.current = idx;
          const lis = listRef.current?.querySelectorAll("li");
          lis?.forEach((li, i) => li.classList.toggle("active", i === idx));
          lis?.[idx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });

          window.globalPlayerNav.prev = idx > 0 ? () => play(idx - 1) : null;
          window.globalPlayerNav.next =
            idx < album.tracks.length - 1 ? () => play(idx + 1) : null;
          window.dispatchEvent(new CustomEvent("navUpdated"));
        }
      }
    } catch {}

    return () => cached.cleanup();
  }, [album, play]);

  if (!artist || !album) return null;

  return (
    <>
      <div className="player-header">
        <button
          className="back-button-player"
          onClick={() => navigateTo({ view: "albums", artistId })}
        >
          ← Retour aux albums
        </button>
      </div>

      <div className="page">
        {/* Section Album 3D */}
        <div className="album-section">
          <Album3D
            cdnPath={album.cdnPath}
            projectName={album.projectName}
            size={album.albumSize ?? "55em"}
            albumOffset={album.albumOffset ?? "2em"}
          />
          <div className="album-info">
            <h1 className="artist-name">{artist.name}</h1>
            <h2 className="album-name">
              {album.year} — {album.name}
            </h2>
          </div>
        </div>

        {/* Playlist */}
        <div className="music-player">
          <div className="playlist">
            <ul className="track-list" ref={listRef}>
              {album.tracks.map((track, i) => (
                <TrackItem
                  key={`${track.url}-${i}`}
                  track={track}
                  index={i}
                  albumId={album.id}
                  onPlay={play}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TrackItem ────────────────────────────────────────────────────────────────

interface TrackItemProps {
  track: { title: string; url: string };
  index: number;
  albumId: string;
  onPlay: (index: number) => void;
}

function TrackItem({ track, index, albumId, onPlay }: TrackItemProps) {
  const durationRef = useRef<HTMLSpanElement>(null);
  const durationId = `duration-${albumId}-${index}`;

  useEffect(() => {
    const cache = window._durationCache ?? (window._durationCache = {});
    if (cache[track.url]) {
      if (durationRef.current)
        durationRef.current.textContent = cache[track.url];
      return;
    }
    const temp = new Audio();
    temp.preload = "metadata";
    temp.onloadedmetadata = () => {
      const formatted = formatDuration(temp.duration);
      cache[track.url] = formatted;
      if (durationRef.current) durationRef.current.textContent = formatted;
      temp.src = "";
    };
    temp.src = track.url;
    return () => {
      temp.src = "";
    };
  }, [track.url]);

  return (
    <li id={durationId} onClick={() => onPlay(index)}>
      <span className="track-number">{String(index + 1).padStart(2, "0")}</span>
      <span className="track-name">{track.title}</span>
      <span className="track-duration" ref={durationRef}>
        --:--
      </span>
    </li>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _durationCacheInit(urls: string[]) {
  // just ensures the cache object exists
  if (!window._durationCache) window._durationCache = {};
  return {
    cleanup: () => {},
  };
}
