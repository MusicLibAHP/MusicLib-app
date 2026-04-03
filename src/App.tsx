// ============================================
// APP — Composant principal
// ============================================
import { useEffect } from "react";
import { useRouter } from "./hooks/useRouter";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { ArtistsPage } from "./pages/ArtistsPage";
import { AlbumsPage } from "./pages/AlbumsPage";
import { PlayerPage } from "./pages/PlayerPage";
import { MiniPlayer } from "./components/MiniPlayer";
// BACKGROUND shadergradient 
import BackgroundGradient from "./components/BackgroundGradient";

// Import de la bibliothèque (initialise window.addArtist)
import "./data/musicLibrary";
import "./data/loadArtists";



export default function App() {
  const { route, navigateTo } = useRouter();
  const { restoreTrack } = useAudioPlayer();

  // Restaurer la dernière piste au chargement
  useEffect(() => {
    restoreTrack();
  }, [restoreTrack]);

  return (
    <>
      <BackgroundGradient  />
      {route.view === "artists" && <ArtistsPage navigateTo={navigateTo} />}
      {route.view === "albums" && (
        <AlbumsPage artistId={route.artistId} navigateTo={navigateTo} />
      )}
      {route.view === "player" && (
        <PlayerPage
          artistId={route.artistId}
          albumId={route.albumId}
          navigateTo={navigateTo}
        />
      )}

      <MiniPlayer navigateTo={navigateTo} />
    </>
  );
}
