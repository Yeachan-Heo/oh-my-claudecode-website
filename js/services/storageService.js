/**
 * Storage Service - Performance-optimized caching layer
 * Implements TTL-based caching, Cache API fallback, and stale-while-revalidate pattern
 */

const StorageService = (function() {
  'use strict';

  // Default TTL values (in milliseconds)
  const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  const CACHE_VERSION = 'v1';
  const CACHE_NAME = `omc-website-${CACHE_VERSION}`;

  // Check if Cache API is available
  const hasCacheAPI = typeof caches !== 'undefined';

  /**
   * Generate a cache key with namespace
   */
  function getCacheKey(key) {
    return `omc:${key}`;
  }

  /**
   * Wrap data with metadata for TTL tracking
   */
  function wrapData(data, ttl) {
    return {
      data,
      timestamp: Date.now(),
      ttl: ttl || DEFAULT_TTL
    };
  }

  /**
   * Check if cached item is expired
   */
  function isExpired(wrappedData) {
    if (!wrappedData || !wrappedData.timestamp) return true;
    const age = Date.now() - wrappedData.timestamp;
    return age > wrappedData.ttl;
  }

  /**
   * Check if cached item is stale (for stale-while-revalidate)
   * Item is stale at 80% of TTL
   */
  function isStale(wrappedData) {
    if (!wrappedData || !wrappedData.timestamp) return true;
    const age = Date.now() - wrappedData.timestamp;
    return age > (wrappedData.ttl * 0.8);
  }

  /**
   * Store data in localStorage
   */
  function setLocalStorage(key, wrappedData) {
    try {
      const serialized = JSON.stringify(wrappedData);
      localStorage.setItem(getCacheKey(key), serialized);
      return true;
    } catch (e) {
      // localStorage quota exceeded or disabled
      console.warn('localStorage unavailable, falling back to memory cache');
      return false;
    }
  }

  /**
   * Retrieve data from localStorage
   */
  function getLocalStorage(key) {
    try {
      const serialized = localStorage.getItem(getCacheKey(key));
      if (!serialized) return null;
      return JSON.parse(serialized);
    } catch (e) {
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  function removeLocalStorage(key) {
    try {
      localStorage.removeItem(getCacheKey(key));
      return true;
    } catch (e) {
      return false;
    }
  }

  // In-memory fallback cache for when localStorage is unavailable
  const memoryCache = new Map();

  /**
   * Store data in memory cache
   */
  function setMemoryCache(key, wrappedData) {
    memoryCache.set(getCacheKey(key), wrappedData);
    // Limit memory cache size
    if (memoryCache.size > 100) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
  }

  /**
   * Retrieve data from memory cache
   */
  function getMemoryCache(key) {
    return memoryCache.get(getCacheKey(key)) || null;
  }

  /**
   * Store data using Cache API
   */
  async function setCacheAPI(key, wrappedData) {
    if (!hasCacheAPI) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify(wrappedData), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache-Time': Date.now().toString()
        }
      });
      await cache.put(getCacheKey(key), response);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieve data from Cache API
   */
  async function getCacheAPI(key) {
    if (!hasCacheAPI) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(getCacheKey(key));
      if (!response) return null;
      const data = await response.json();
      return data;
    } catch (e) {
      return null;
    }
  }

  // Stale-while-revalidate tracking
  const pendingRevalidations = new Set();

  /**
   * Perform revalidation in the background
   */
  async function revalidateInBackground(key, fetchFn, ttl, onUpdate) {
    if (pendingRevalidations.has(key)) return;
    pendingRevalidations.add(key);

    try {
      const freshData = await fetchFn();
      await StorageService.set(key, freshData, ttl);
      if (onUpdate) {
        onUpdate(freshData);
      }
    } catch (e) {
      console.warn(`Revalidation failed for key: ${key}`, e);
    } finally {
      pendingRevalidations.delete(key);
    }
  }

  /**
   * Public API
   */
  return {
    /**
     * Store data with optional TTL
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time-to-live in milliseconds
     * @returns {Promise<boolean>}
     */
    async set(key, data, ttl = DEFAULT_TTL) {
      const wrapped = wrapData(data, ttl);

      // Try localStorage first
      if (setLocalStorage(key, wrapped)) {
        // Also update Cache API for service worker sync
        await setCacheAPI(key, wrapped);
        return true;
      }

      // Fall back to memory cache
      setMemoryCache(key, wrapped);
      return true;
    },

    /**
     * Retrieve data from cache
     * @param {string} key - Cache key
     * @returns {*|null}
     */
    get(key) {
      // Try localStorage first
      let wrapped = getLocalStorage(key);

      // Fall back to memory cache
      if (!wrapped) {
        wrapped = getMemoryCache(key);
      }

      if (!wrapped) return null;
      if (isExpired(wrapped)) return null;

      return wrapped.data;
    },

    /**
     * Retrieve data asynchronously (checks Cache API as well)
     * @param {string} key - Cache key
     * @returns {Promise<*>}
     */
    async getAsync(key) {
      // Try synchronous caches first
      const syncResult = this.get(key);
      if (syncResult !== null) return syncResult;

      // Try Cache API
      const wrapped = await getCacheAPI(key);
      if (wrapped && !isExpired(wrapped)) {
        // Restore to localStorage for faster access next time
        setLocalStorage(key, wrapped);
        return wrapped.data;
      }

      return null;
    },

    /**
     * Get data with stale-while-revalidate pattern
     * Returns cached data immediately if available, refreshes in background
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch fresh data
     * @param {Object} options - Options
     * @param {number} options.ttl - Cache TTL
     * @param {Function} options.onUpdate - Callback when fresh data arrives
     * @returns {Promise<*>}
     */
    async getStaleWhileRevalidate(key, fetchFn, options = {}) {
      const { ttl = DEFAULT_TTL, onUpdate } = options;

      const wrapped = getLocalStorage(key) || getMemoryCache(key);

      if (wrapped) {
        const expired = isExpired(wrapped);
        const stale = isStale(wrapped);

        // If fresh, return immediately
        if (!expired && !stale) {
          return wrapped.data;
        }

        // If stale but not expired, return and revalidate in background
        if (!expired && stale) {
          revalidateInBackground(key, fetchFn, ttl, onUpdate);
          return wrapped.data;
        }

        // If expired, we need fresh data
        if (expired) {
          // If we have stale data, return it immediately while fetching
          if (wrapped.data !== undefined) {
            revalidateInBackground(key, fetchFn, ttl, onUpdate);
            return wrapped.data;
          }
        }
      }

      // No cache or completely expired with no data - fetch fresh
      try {
        const freshData = await fetchFn();
        await this.set(key, freshData, ttl);
        return freshData;
      } catch (e) {
        // If fetch fails and we have any cached data, return it
        if (wrapped && wrapped.data !== undefined) {
          console.warn(`Fetch failed for ${key}, using stale cache`);
          return wrapped.data;
        }
        throw e;
      }
    },

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     */
    async remove(key) {
      removeLocalStorage(key);
      memoryCache.delete(getCacheKey(key));

      if (hasCacheAPI) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.delete(getCacheKey(key));
        } catch (e) {
          // Ignore
        }
      }
    },

    /**
     * Clear all cached data
     */
    async clear() {
      // Clear localStorage (only our keys)
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('omc:')) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Ignore
      }

      // Clear memory cache
      memoryCache.clear();

      // Clear Cache API
      if (hasCacheAPI) {
        try {
          await caches.delete(CACHE_NAME);
        } catch (e) {
          // Ignore
        }
      }
    },

    /**
     * Preload data into cache
     * @param {Array} items - Array of {key, data, ttl} objects
     */
    async preload(items) {
      const promises = items.map(item =>
        this.set(item.key, item.data, item.ttl || DEFAULT_TTL)
      );
      await Promise.all(promises);
    },

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getStats() {
      let localStorageCount = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('omc:')) {
            localStorageCount++;
          }
        }
      } catch (e) {
        // Ignore
      }

      return {
        localStorageItems: localStorageCount,
        memoryCacheItems: memoryCache.size,
        pendingRevalidations: pendingRevalidations.size,
        cacheAPIName: CACHE_NAME
      };
    }
  };
})();

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
} else if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
}

// ES module exports
export const storageService = StorageService;
export default StorageService;
