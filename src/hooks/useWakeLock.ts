import { useEffect, useState } from 'react';

/** Mantiene la pantalla encendida (Screen Wake Lock API). Reintenta al volver al foco. */
export function useWakeLock(enabled: boolean) {
  const [active, setActive] = useState(false);
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  useEffect(() => {
    if (!enabled || !supported) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        setActive(true);
        sentinel.addEventListener('release', () => {
          setActive(false);
          // el sistema lo suelta al ocultar la pestaña; se pide de nuevo al volver
          if (!cancelled && document.visibilityState === 'visible') setTimeout(request, 1000);
        });
      } catch {
        setActive(false);
      }
    };

    const onVis = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    request();
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
      sentinel?.release().catch(() => {});
    };
  }, [enabled, supported]);

  return { supported, active };
}
