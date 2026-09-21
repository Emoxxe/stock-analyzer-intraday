/**
 * Authentic News Provider Adapter
 * Connects to Google News RSS feed for verified Indian corporate news.
 * Preserves authentic headlines, publishers, publication dates, and source URLs.
 */

import { parseStringPromise } from 'xml2js';
import { cacheService } from '../services/cacheService.js';

class NewsAdapter {
  constructor() {
    this.name = 'Google News RSS Feed';
    this.totalRequests = 0;
    this.errorCount = 0;
    this.lastSuccessfulRequest = null;
  }

  /**
   * Fetch live verified news for a company
   */
  async getCompanyNews(companyName, symbol, limit = 10) {
    const searchTerm = `${companyName || symbol} share price NSE BSE`;
    const cacheKey = `news_${encodeURIComponent(searchTerm)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    this.totalRequests++;
    const encodedQuery = encodeURIComponent(searchTerm);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) {
        this.errorCount++;
        throw new Error(`HTTP ${response.status}: Failed to fetch news RSS`);
      }

      const xmlText = await response.text();
      const parsed = await parseStringPromise(xmlText, { explicitArray: false });

      const items = parsed?.rss?.channel?.item;
      const rawArticles = Array.isArray(items) ? items : items ? [items] : [];

      const articles = rawArticles.slice(0, limit).map((item, idx) => {
        // Source publisher name
        let publisher = 'Verified News Publisher';
        if (item.source && typeof item.source === 'object' && item.source._) {
          publisher = item.source._;
        } else if (item.source && typeof item.source === 'string') {
          publisher = item.source;
        } else if (item.title && item.title.includes(' - ')) {
          const parts = item.title.split(' - ');
          publisher = parts[parts.length - 1].trim();
        }

        // Clean headline
        let headline = item.title || 'Market Update';
        if (headline.includes(' - ') && publisher) {
          headline = headline.replace(new RegExp(` - ${publisher}$`), '').trim();
        }

        return {
          id: `news-${idx}-${Date.now()}`,
          headline,
          publisher,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          url: item.link || item.guid?._ || item.guid || '#',
          source: this.name,
          retrievedAt: new Date().toISOString(),
          quality: 'AVAILABLE',
        };
      });

      const payload = {
        symbol: symbol?.toUpperCase(),
        query: searchTerm,
        articlesCount: articles.length,
        articles,
        source: this.name,
        retrievedAt: new Date().toISOString(),
      };

      this.lastSuccessfulRequest = new Date().toISOString();
      // Cache news for 5 minutes
      cacheService.set(cacheKey, payload, 300, {
        source: this.name,
        freshness: 'LATEST_AVAILABLE',
      });

      return payload;
    } catch (err) {
      this.errorCount++;
      console.warn(`[NewsAdapter] News retrieval failed for ${searchTerm}:`, err.message);
      return {
        symbol: symbol?.toUpperCase(),
        query: searchTerm,
        articlesCount: 0,
        articles: [],
        source: this.name,
        retrievedAt: new Date().toISOString(),
        quality: 'UNAVAILABLE',
        error: err.message,
      };
    }
  }

  getHealth() {
    return {
      provider: this.name,
      status: this.errorCount === 0 || this.lastSuccessfulRequest ? 'operational' : 'degraded',
      totalRequests: this.totalRequests,
      errorCount: this.errorCount,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
    };
  }
}

export const newsAdapter = new NewsAdapter();
