/**
 * Stats Service
 * Centralized data fetching with caching for GitHub/npm stats
 */

import { API_ENDPOINTS, CACHE_CONFIG, getCacheKey } from '../config.js';

/**
 * @typedef {Object} StatsData
 * @property {number} stars - GitHub star count
 * @property {number} downloads - npm download count
 * @property {number} agents - Number of agents
 * @property {string} version - Latest version
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {StatsData} data - The cached data
 * @property {number} timestamp - When the cache was created
 */

class StatsService {
  constructor() {
    /** @type {Promise<StatsData>|null} */
    this.pendingRequest = null;

    /** @type {StatsData|null} */
    this.memoryCache = null;

    /** @type {number|null} */
    this.memoryCacheTime = null;
  }

  /**
   * Get stats - always fetches fresh data from live APIs
   * @returns {Promise<StatsData>} Stats data
   */
  async get() {
    // Always fetch fresh data from APIs
    return this.fetchFresh();
  }

  /**
   * Force refresh stats data
   * @returns {Promise<StatsData>} Fresh stats data
   */
  async refresh() {
    return this.fetchFresh();
  }

  /**
   * Fetch fresh data from API
   * @private
   * @returns {Promise<StatsData>}
   */
  async fetchFresh() {
    // If there's already a pending request, return it (request coalescing)
    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    // Create new request
    this.pendingRequest = this.doFetch();

    try {
      const data = await this.pendingRequest;
      return data;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Perform the actual fetch
   * @private
   * @returns {Promise<StatsData>}
   */
  async doFetch() {
    try {
      // data/stats.json is the offline baseline (it is the only source of the
      // capability counts); live APIs then win field by field.
      const [localStats, npmLatest, npmData, githubData] = await Promise.all([
        this.fetchLocalStats().catch(() => null),
        this.fetchNpmLatest().catch(() => null),
        this.fetchNpmStats().catch(() => null),
        this.fetchGitHubStats().catch(() => null),
      ]);

      const data = { ...(localStats || {}) };

      if (typeof npmLatest?.version === 'string') data.version = npmLatest.version;
      if (typeof npmData?.downloads === 'number') data.downloads = npmData.downloads;
      if (typeof githubData?.stargazers_count === 'number') {
        data.stars = githubData.stargazers_count;
        data.forks = githubData.forks_count;
      }
      if (npmLatest || npmData || githubData) {
        data.updatedAt = new Date().toISOString();
      }

      this.updateCache(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // No hardcoded numbers: an unresolved field leaves the rendered markup
      // untouched rather than advertising a stale release.
      return {};
    }
  }

  /**
   * Fetch stats from local JSON file (pre-computed by GitHub Action)
   * @private
   * @returns {Promise<StatsData|null>}
   */
  async fetchLocalStats() {
    try {
      const response = await fetch(API_ENDPOINTS.local.stats, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const raw = await response.json();
      const data = {};
      const numbers = ['agents', 'skills', 'commands', 'mcpTools', 'downloads', 'stars', 'forks'];
      for (const key of numbers) {
        if (typeof raw[key] === 'number') data[key] = raw[key];
      }
      if (typeof raw.version === 'string') data.version = raw.version;
      if (typeof raw.lastUpdated === 'string') data.updatedAt = raw.lastUpdated;
      return data;
    } catch (error) {
      // Local stats file might not exist yet
      return null;
    }
  }

  /**
   * Fetch the published npm version
   * @private
   * @returns {Promise<Object>}
   */
  async fetchNpmLatest() {
    const response = await fetch(API_ENDPOINTS.npm.latest, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`npm registry error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch GitHub repository stats
   * @private
   * @returns {Promise<Object>}
   */
  async fetchGitHubStats() {
    const response = await fetch(API_ENDPOINTS.github.repo, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch npm download stats
   * @private
   * @returns {Promise<Object>}
   */
  async fetchNpmStats() {
    const url = `${API_ENDPOINTS.npm.downloads}/last-month/oh-my-claude-sisyphus`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`npm API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Refresh data in background (don't wait for result)
   * @private
   */
  refreshInBackground() {
    this.fetchFresh().catch((error) => {
      // Silently fail on background refresh
      console.debug('Background refresh failed:', error);
    });
  }

  /**
   * Check if cache is still valid (not expired)
   * @private
   * @param {number} timestamp
   * @returns {boolean}
   */
  isCacheValid(timestamp) {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_CONFIG.duration;
  }

  /**
   * Check if cache is stale (valid but should refresh)
   * @private
   * @param {number} timestamp
   * @returns {boolean}
   */
  isCacheStale(timestamp) {
    if (!timestamp) return true;
    // Consider cache stale after half the duration
    return Date.now() - timestamp > CACHE_CONFIG.duration / 2;
  }

  /**
   * Get cache from localStorage
   * @private
   * @returns {CacheEntry|null}
   */
  getLocalCache() {
    try {
      const key = getCacheKey('stats');
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const entry = JSON.parse(cached);

      // Check if cache is expired
      if (!this.isCacheValid(entry.timestamp)) {
        localStorage.removeItem(key);
        return null;
      }

      return entry;
    } catch (error) {
      // localStorage might be disabled or full
      return null;
    }
  }

  /**
   * Update both memory and localStorage cache
   * @private
   * @param {StatsData} data
   */
  updateCache(data) {
    const timestamp = Date.now();

    // Update memory cache
    this.memoryCache = data;
    this.memoryCacheTime = timestamp;

    // Update localStorage
    try {
      const key = getCacheKey('stats');
      const entry = { data, timestamp };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      // localStorage might be disabled or full
      console.debug('Failed to update localStorage cache:', error);
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.memoryCache = null;
    this.memoryCacheTime = null;

    try {
      const key = getCacheKey('stats');
      localStorage.removeItem(key);
    } catch (error) {
      console.debug('Failed to clear localStorage cache:', error);
    }
  }

  /**
   * Format number for display (e.g., 1500 -> "1.5k")
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   * @param {string} isoDate
   * @returns {string}
   */
  getRelativeTime(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}

// Export singleton instance
export const statsService = new StatsService();

// Default export for convenience
export default statsService;
