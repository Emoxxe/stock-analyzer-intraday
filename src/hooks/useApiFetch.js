/**
 * useApiFetch — performant data fetching hook.
 *
 * Features:
 *  - Request dedup: concurrent calls for the same key share one in-flight promise.
 *  - Caching: results go through cacheService (memory + localStorage).
 *  - Abort: switching a dynamic URL aborts the stale request before it resolves.
 *  - Revalidation: a manual `refresh()` forces a live fetch (bypassing cache).
 *
 * Returns { data, loading, error, refresh }.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { cacheService } from '../services/apiCache';

const INFLIGHT = new Map(); // url -> Promise

function isAbortError(err) {
  return err?.name === 'AbortError' || /aborted|aborted without reason/i.test(err?.message || '');
}

function makeKey(path, opts) {
  return typeof path === 'function' ? path() : path;
}

export function useApiFetch(path, { ttl = 60_000, disabled = false, dependencies = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ctrlRef = useRef(null);
  const pathRef = useRef(null);
  const ttlRef = useRef(ttl);

  const run = useCallback(
    async (opts) => {
      const key = makeKey(path, opts);
      if (!key) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      // In React StrictMode, mount effects are intentionally run twice.
      // Only abort a previous request when the URL actually changes.
      const previousKey = pathRef.current;
      if (previousKey && previousKey !== key) {
        ctrlRef.current?.abort?.();
      }
      pathRef.current = key;

      // Serve from cache first (unless skipped)
      if (opts?.force !== true) {
        const cached = cacheService.get(key);
        if (cached) {
          setData(cached);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // Dedup: share an in-flight request for the same key
      if (INFLIGHT.has(key)) {
        try {
          const result = await INFLIGHT.get(key);
          setData(result);
          setError(null);
        } catch (err) {
          if (!isAbortError(err)) {
            setError(err.message || 'Request failed');
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      if (previousKey && previousKey !== key) {
        ctrlRef.current?.abort?.();
      }
      ctrlRef.current = controller;
      setLoading(true);
      setError(null);

      const promise = (async () => {
        const res = await fetch(key, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success === false) {
          throw new Error(json.error || 'Request failed');
        }
        return json.data ?? json;
      })();

      INFLIGHT.set(key, promise);
      try {
        const result = await promise;
        cacheService.set(key, result, ttlRef.current);
        setData(result);
      } catch (err) {
        if (!isAbortError(err)) {
          setError(err.message || 'Request failed');
        }
      } finally {
        INFLIGHT.delete(key);
        if (ctrlRef.current === controller) setLoading(false);
      }
    },
    [path]
  );

  const refresh = useCallback(() => run({ force: true }), [run]);

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      return;
    }
    run({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, disabled, ...dependencies]);

  return { data, loading, error, refresh };
}

/**
 * useDebouncedValue — returns `value` after it has been stable for `delay`.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}