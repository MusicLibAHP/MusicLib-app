// ============================================
// PAGE — Artistes
// ============================================
import { useState, useMemo } from "react";
import { getMusicLibrary, getAllGenres } from "../data/musicLibrary";
import type { Route } from "../hooks/useRouter";

interface ArtistsPageProps {
  navigateTo: (route: Route) => void;
}

export function ArtistsPage({ navigateTo }: ArtistsPageProps) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");

  const library = getMusicLibrary();
  const allGenres = getAllGenres();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return library.artists.filter((artist) => {
      const matchName = artist.name.toLowerCase().includes(q);
      const matchGenre = !genre || (artist.genres ?? []).includes(genre);
      return matchName && matchGenre;
    });
  }, [library.artists, search, genre]);

  return (
    <div className="library-container">
      <header className="library-header">
        {/* Bouton Mes Vinyles */}
        <a
          href="https://vinylstack-ahp.netlify.app/"
          target="_blank"
          rel="noopener"
          className="vinyl-link-btn"
        >
          <span className="vinyl-icon" />
          <span className="vinyl-label">Mes Vinyles</span>
        </a>

        <h1>MusicLib</h1>
        <p className="subtitle">ARTISTES</p>

        <div className="search-wrapper">
          <input
            type="text"
            id="artist-search"
            placeholder="Rechercher un artiste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          <select
            id="genre-filter"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">Tous les styles</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid" id="artists-grid">
        {filtered.map((artist) => (
          <div
            key={artist.id}
            className="card"
            data-genres={(artist.genres ?? []).join(",")}
            onClick={() => navigateTo({ view: "albums", artistId: artist.id })}
          >
            <img
              src={artist.image}
              alt={artist.name}
              className="card-image"
              loading="lazy"
            />
            <div className="card-info">
              <div className="card-name">{artist.name}</div>
              {artist.genres && (
                <div className="card-genres">{artist.genres.join(" · ")}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
