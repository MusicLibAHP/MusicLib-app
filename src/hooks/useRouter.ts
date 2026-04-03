// ============================================
// HOOK — Routeur SPA Hash
// ============================================
import { useState, useEffect, useCallback } from 'react';

export type Route =
  | { view: 'artists' }
  | { view: 'albums'; artistId: string }
  | { view: 'player'; artistId: string; albumId: string };

function parseHash(hash: string): Route {
  const h = hash || '#/';
  if (h === '#/' || h === '' || h === '#') {
    return { view: 'artists' };
  }
  if (h.startsWith('#/artist/')) {
    const parts = h.split('/');
    return { view: 'albums', artistId: parts[2] ?? '' };
  }
  if (h.startsWith('#/player/')) {
    const parts = h.split('/');
    return { view: 'player', artistId: parts[2] ?? '', albumId: parts[3] ?? '' };
  }
  return { view: 'artists' };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(window.location.hash)
  );

  useEffect(() => {
    const handlePop = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigateTo = useCallback((newRoute: Route) => {
    let url = '#/';
    if (newRoute.view === 'albums') {
      url = `#/artist/${newRoute.artistId}`;
    } else if (newRoute.view === 'player') {
      url = `#/player/${newRoute.artistId}/${newRoute.albumId}`;
    }
    history.pushState(null, '', url);
    setRoute(newRoute);
  }, []);

  return { route, navigateTo };
}
