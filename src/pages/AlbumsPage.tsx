// ============================================
// PAGE — Albums d'un artiste
// ============================================
import { useEffect } from "react";
import { getArtist } from "../data/musicLibrary";
import { BackButton } from "../components/BackButton";
import type { Route } from "../hooks/useRouter";

interface AlbumsPageProps {
  artistId: string;
  navigateTo: (route: Route) => void;
}

export function AlbumsPage({ artistId, navigateTo }: AlbumsPageProps) {
  const artist = getArtist(artistId);

  useEffect(() => {
    if (!artist) {
      navigateTo({ view: "artists" });
    }
  }, [artist, navigateTo]);

  if (!artist) return null;

  return (
    <>
      <BackButton navigateTo={navigateTo} target={{ view: "artists" }} />

      <div className="library-container">
        <header className="library-header">
          <h1>{artist.name}</h1>
          <p className="subtitle">ALBUMS</p>
        </header>

        <div className="grid">
          {artist.albums.map((album) => (
            <div
              key={`${album.id}-${album.name}`}
              className="card"
              onClick={() =>
                navigateTo({
                  view: "player",
                  artistId: artist.id,
                  albumId: album.id,
                })
              }
            >
              <img
                src={album.cover}
                alt={album.name}
                className="card-image"
                loading="lazy"
              />
              <div className="card-info">
                <div className="card-name">{album.name}</div>
                <div className="card-year">{album.year}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
