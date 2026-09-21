/**
 * In-Memory TTL Cache Service with Provider Timestamp Preservation
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return {
      data: entry.data,
      cachedAt: entry.cachedAt,
      providerTimestamp: entry.providerTimestamp,
      retrievedAt: entry.retrievedAt,
      source: entry.source,
      freshness: entry.freshness,
      isCacheHit: true,
    };
  }

  set(key, data, ttlSeconds = 60, metadata = {}) {
    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: new Date(now).toISOString(),
      expiresAt: now + ttlSeconds * 1000,
      providerTimestamp: metadata.providerTimestamp || null,
      retrievedAt: metadata.retrievedAt || new Date(now).toISOString(),
      source: metadata.source || 'Unknown',
      freshness: metadata.freshness || 'LATEST_AVAILABLE',
    });
    this.stats.sets++;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio: this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
        : '0.0%',
    };
  }
}

export const cacheService = new CacheService();
