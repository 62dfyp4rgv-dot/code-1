import { useEffect } from 'react';
import { AppState } from 'react-native';
import { autosaveIfNeeded } from '../state/gameStore';

/** Autosave whenever the app goes to the background / the browser tab is hidden. */
export function useAutosaveOnBackground(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' || s === 'inactive') void autosaveIfNeeded();
    });
    return () => sub.remove();
  }, []);
}
