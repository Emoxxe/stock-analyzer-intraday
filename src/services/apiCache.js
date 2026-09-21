// In-Memory & LocalStorage Cache for Financial Telemetry
const MEMORY_CACHE = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export const cacheService = {
  get(key) {
    if (MEMORY_CACHE.has(key)) {
      const entry = MEMORY_CACHE.get(key);
      if (Date.now() < entry.expiry) return entry.data;
      MEMORY_CACHE.delete(key);
    }
    try {
      const item = localStorage.getItem(`stock_cache_${key}`);
      if (item) {
        const parsed = JSON.parse(item);
        if (Date.now() < parsed.expiry) {
          MEMORY_CACHE.set(key, parsed);
          return parsed.data;
        }
        localStorage.removeItem(`stock_cache_${key}`);
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  },

  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    const entry = { data, expiry: Date.now() + ttlMs, timestamp: Date.now() };
    MEMORY_CACHE.set(key, entry);
    try {
      localStorage.setItem(`stock_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore storage errors
    }
  },

  invalidate(key) {
    MEMORY_CACHE.delete(key);
    try {
      localStorage.removeItem(`stock_cache_${key}`);
    } catch {}
  },

  clearAll() {
    MEMORY_CACHE.clear();
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('stock_cache_'))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};
