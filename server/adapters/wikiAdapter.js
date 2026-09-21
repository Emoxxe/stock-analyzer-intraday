/**
 * Supplementary Wikipedia Adapter
 * Provides background summary, company history, and overview.
 * Explicitly labeled: "Supplementary source: Wikipedia".
 */

import { cacheService } from '../services/cacheService.js';

class WikiAdapter {
  constructor() {
    this.name = 'Supplementary source: Wikipedia';
    this.totalRequests = 0;
    this.lastSuccessfulRequest = null;
  }

  async getSummary(companyName) {
    if (!companyName) return null;
    const clean = companyName.replace(/Limited|Ltd\.|Ltd/gi, '').trim();
    const cacheKey = `wiki_${clean.toUpperCase()}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    this.totalRequests++;
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'IndianStockAnalyzer/1.0 (https://stockanalyzer.local; contact@stockanalyzer.local)',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) return null;

      const data = await res.json();
      const payload = {
        title: data.title,
        extract: data.extract,
        description: data.description,
        thumbnailUrl: data.thumbnail?.source || null,
        originalImageUrl: data.originalimage?.source || null,
        pageUrl: data.content_urls?.desktop?.page || null,
        source: this.name,
        retrievedAt: new Date().toISOString(),
        quality: 'AVAILABLE',
      };

      this.lastSuccessfulRequest = new Date().toISOString();
      cacheService.set(cacheKey, payload, 3600, {
        source: this.name,
        freshness: 'HISTORICAL',
      });

      return payload;
    } catch {
      return null;
    }
  }

  getHealth() {
    return {
      provider: this.name,
      status: 'operational',
      totalRequests: this.totalRequests,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
    };
  }
}

export const wikiAdapter = new WikiAdapter();
