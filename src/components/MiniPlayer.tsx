// ============================================
// COMPOSANT — Mini Player Global
// ============================================
import { useState, useEffect, useRef, useCallback } from "react";
import type { Route } from "../hooks/useRouter";

interface MiniPlayerProps {
  navigateTo: (route: Route) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MiniPlayer({ navigateTo }: MiniPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [title, setTitle] = useState("");
  const [artistAlbum, setArtistAlbum] = useState("");
  const [cover, setCover] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);
  const artistIdRef = useRef("");
  const albumIdRef = useRef("");

  const updateFromGlobal = useCallback(() => {
    const data = window.globalAudioData;
    if (data?.title) {
      setIsVisible(true);
      setTitle(data.title);
      setArtistAlbum(`${data.artist} — ${data.album}`);
      setCover(data.cover ?? "");
      artistIdRef.current = data.artistId ?? "";
      albumIdRef.current = data.albumId ?? "";
      setIsPlaying(!window.globalAudio.paused);
    }
    setPrevDisabled(!window.globalPlayerNav?.prev);
    setNextDisabled(!window.globalPlayerNav?.next);
  }, []);

  useEffect(() => {
    // Écouter les changements de piste
    window.addEventListener("trackChanged", updateFromGlobal);

    // Écouter les changements de navigation prev/next
    window.addEventListener("navUpdated", updateFromGlobal);

    const audio = window.globalAudio;

    const onPlay = () => {
      setIsPlaying(true);
      updateFromGlobal();
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setDuration(audio.duration);
    };
    const onLoaded = () => {
      if (audio.duration) setDuration(audio.duration);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);

    // Restaurer le volume sauvegardé
    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume !== null) {
      const v = parseFloat(savedVolume);
      audio.volume = v;
      setVolume(v);
    }

    // Afficher si une piste était en cours
    updateFromGlobal();

    return () => {
      window.removeEventListener("trackChanged", updateFromGlobal);
      window.removeEventListener("navUpdated", updateFromGlobal);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [updateFromGlobal]);

  const togglePlayPause = () => {
    const audio = window.globalAudio;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const handlePrev = () => window.globalPlayerNav?.prev?.();
  const handleNext = () => window.globalPlayerNav?.next?.();

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (window.globalAudio.duration) {
      window.globalAudio.currentTime = percent * window.globalAudio.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    window.globalAudio.volume = v;
    window.globalAudio.muted = v === 0;
    setVolume(v);
    setIsMuted(v === 0);
    localStorage.setItem("playerVolume", String(v));
  };

  const toggleMute = () => {
    const audio = window.globalAudio;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const volumeIcon =
    isMuted || volume === 0
      ? "🔇"
      : volume < 0.4
        ? "🔈"
        : volume < 0.7
          ? "🔉"
          : "🔊";
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleInfoClick = () => {
    if (artistIdRef.current && albumIdRef.current) {
      navigateTo({
        view: "player",
        artistId: artistIdRef.current,
        albumId: albumIdRef.current,
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div id="mini-player">
      <div className="mini-player-main">
        {/* Pochette */}
        <div className="mini-player-cover-wrapper">
          {cover && <img id="mini-player-cover" src={cover} alt="Pochette" />}
        </div>
        {/* Infos */}
        <div className="mini-player-info">
          <div
            id="mini-player-title"
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#ffffff", // Blanc pur pour contraste
              letterSpacing: "-0.5px",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)", // Légère ombre texte
            }}
          >
            {title}
          </div>

          <div
            id="mini-player-artist"
            onClick={handleInfoClick}
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8", // Gris bleuté (Tailwind slate-400)
              cursor: artistIdRef.current ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {artistAlbum}
          </div>
        </div>
        {/* Contrôles */}
        <div className="mini-player-controls">
          <button
            id="mini-player-prev"
            title="Piste précédente"
            disabled={prevDisabled}
            onClick={handlePrev}
          >
            ⏮
          </button>
          <button id="mini-player-play-pause" onClick={togglePlayPause}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            id="mini-player-next"
            title="Piste suivante"
            disabled={nextDisabled}
            onClick={handleNext}
          >
            ⏭
          </button>
        </div>
        {/* Barre de progression */}
        <div className="mini-player-progress">
          <span id="mini-current-time">{formatTime(currentTime)}</span>
          <div className="mini-progress-bar" onClick={handleProgressClick}>
            <div
              className="mini-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span id="mini-duration">{formatTime(duration)}</span>
        </div>
        {/* Volume */}
        <div className="mini-player-volume">
          <button id="mini-volume-icon" title="Volume" onClick={toggleMute}>
            {volumeIcon}
          </button>
          <input
            type="range"
            id="mini-volume-slider"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={
              {
                "--volume-percent": (isMuted ? 0 : volume) * 100,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}
