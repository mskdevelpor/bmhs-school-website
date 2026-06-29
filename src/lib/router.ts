import { useState, useEffect, useCallback } from 'react';

// Minimal hash-based router — no external dependency.
export function useHashRoute() {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/dashboard');

  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/dashboard');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
    window.scrollTo(0, 0);
  }, []);

  return { path, navigate };
}
