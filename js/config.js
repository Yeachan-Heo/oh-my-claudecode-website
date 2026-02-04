/**
 * Configuration Module
 * API endpoints, cache settings, and application constants
 */

/**
 * API Endpoints Configuration
 */
export const API_ENDPOINTS = {
  /** GitHub repository stats */
  github: {
    repo: 'https://api.github.com/repos/yeachan-heo/oh-my-claudecode',
    releases: 'https://api.github.com/repos/yeachan-heo/oh-my-claudecode/releases/latest',
    rawContent: 'https://raw.githubusercontent.com/yeachan-heo/oh-my-claudecode/main',
  },

  /** npm registry stats */
  npm: {
    downloads: 'https://api.npmjs.org/downloads/point',
    package: 'https://registry.npmjs.org/oh-my-claude-sisyphus',
  },

  /** Local data files */
  local: {
    stats: './data/stats.json',
  },
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  /** Cache duration in milliseconds (5 minutes) */
  duration: 5 * 60 * 1000,

  /** localStorage key prefix */
  storageKey: 'omc_cache',

  /** Cache version - bump to invalidate existing caches */
  version: '1.0.0',

  /** Maximum cache entries to prevent storage bloat */
  maxEntries: 50,
};

/**
 * Application Constants
 */
export const APP_CONFIG = {
  /** Application name */
  name: 'Oh My ClaudeCode',

  /** Short name */
  shortName: 'OMC',

  /** GitHub repository URL */
  repoUrl: 'https://github.com/yeachan-heo/oh-my-claudecode',

  /** Documentation URL */
  docsUrl: 'https://yeachan-heo.github.io/oh-my-claudecode-website/',

  /** npm package URL */
  npmUrl: 'https://www.npmjs.com/package/oh-my-claude-sisyphus',
};

/**
 * Animation Configuration
 */
export const ANIMATION_CONFIG = {
  /** Default animation duration in milliseconds */
  duration: 600,

  /** Default animation easing */
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',

  /** Stagger delay between animated elements in milliseconds */
  staggerDelay: 100,

  /** IntersectionObserver threshold */
  threshold: 0.1,

  /** IntersectionObserver root margin */
  rootMargin: '0px 0px -50px 0px',

  /** Reduced motion query */
  reducedMotionQuery: '(prefers-reduced-motion: reduce)',
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  /** Mobile breakpoint in pixels */
  mobileBreakpoint: 768,

  /** Tablet breakpoint in pixels */
  tabletBreakpoint: 1024,

  /** Header height in pixels */
  headerHeight: 64,

  /** Maximum content width */
  maxWidth: 1280,

  /** Scroll offset for anchor links (header height + padding) */
  scrollOffset: 80,
};

/**
 * Feature Flags
 */
export const FEATURES = {
  /** Enable scroll reveal animations */
  scrollReveal: true,

  /** Enable hero entrance animation */
  heroAnimation: true,

  /** Enable loading skeletons */
  skeletons: true,

  /** Enable documentation search */
  docSearch: true,

  /** Enable stats auto-refresh */
  statsAutoRefresh: true,

  /** Enable reduced motion support */
  reducedMotion: true,
};

/**
 * Get the full cache key with version
 * @param {string} key - Base cache key
 * @returns {string} Versioned cache key
 */
export const getCacheKey = (key) => {
  return `${CACHE_CONFIG.storageKey}_${CACHE_CONFIG.version}_${key}`;
};

/**
 * Check if reduced motion is preferred
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(ANIMATION_CONFIG.reducedMotionQuery).matches;
};

/**
 * Get current viewport type
 * @returns {'mobile'|'tablet'|'desktop'} Current viewport type
 */
export const getViewport = () => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < UI_CONFIG.mobileBreakpoint) return 'mobile';
  if (width < UI_CONFIG.tabletBreakpoint) return 'tablet';
  return 'desktop';
};

/**
 * Debounce utility
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 250) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle utility
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit = 100) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export default {
  API_ENDPOINTS,
  CACHE_CONFIG,
  APP_CONFIG,
  ANIMATION_CONFIG,
  UI_CONFIG,
  FEATURES,
  getCacheKey,
  prefersReducedMotion,
  getViewport,
  debounce,
  throttle,
};
