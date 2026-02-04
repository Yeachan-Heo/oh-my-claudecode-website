/**
 * Scroll Reveal Module
 * IntersectionObserver-based scroll animations
 */

import { ANIMATION_CONFIG, prefersReducedMotion } from '../config.js';

/**
 * Default observer options
 * @type {IntersectionObserverInit}
 */
const DEFAULT_OPTIONS = {
  root: null,
  rootMargin: ANIMATION_CONFIG.rootMargin,
  threshold: ANIMATION_CONFIG.threshold,
};

/**
 * Active observer instance
 * @type {IntersectionObserver|null}
 */
let activeObserver = null;

/**
 * Map of observed elements to their callbacks
 * @type {WeakMap<Element, Function>}
 */
const elementCallbacks = new WeakMap();

/**
 * Initialize scroll reveal for elements with [data-reveal] attribute
 * @param {Object} options - Configuration options
 * @param {string} options.selector - CSS selector for reveal elements
 * @param {string} options.visibleClass - Class to add when visible
 * @param {boolean} options.once - Whether to unobserve after reveal
 * @param {IntersectionObserverInit} options.observerOptions - IntersectionObserver options
 * @returns {IntersectionObserver|null} The created observer or null if reduced motion
 */
export const initScrollReveal = (options = {}) => {
  const {
    selector = '[data-reveal]',
    visibleClass = 'revealed',
    once = true,
    observerOptions = DEFAULT_OPTIONS,
  } = options;

  // Respect reduced motion preference
  if (prefersReducedMotion()) {
    // Immediately show all elements without animation
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add(visibleClass);
    });
    return null;
  }

  // Check for IntersectionObserver support
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all elements
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add(visibleClass);
    });
    return null;
  }

  // Clean up existing observer
  destroyScrollReveal();

  // Create new observer
  activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;

        // Add visible class
        element.classList.add(visibleClass);

        // Call custom callback if registered
        const callback = elementCallbacks.get(element);
        if (callback) {
          callback(element);
        }

        // Unobserve if once mode
        if (once) {
          activeObserver.unobserve(element);
          elementCallbacks.delete(element);
        }
      } else if (!once) {
        // Remove visible class when scrolling out of view (if not once)
        entry.target.classList.remove(visibleClass);
      }
    });
  }, observerOptions);

  // Observe all matching elements
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => activeObserver.observe(el));

  return activeObserver;
};

/**
 * Observe a single element for scroll reveal
 * @param {Element} element - Element to observe
 * @param {Object} options - Configuration options
 * @param {string} options.visibleClass - Class to add when visible
 * @param {boolean} options.once - Whether to unobserve after reveal
 * @param {Function} options.onReveal - Callback when element is revealed
 * @param {IntersectionObserverInit} options.observerOptions - IntersectionObserver options
 * @returns {IntersectionObserver|null}
 */
export const observeElement = (element, options = {}) => {
  const {
    visibleClass = 'revealed',
    once = true,
    onReveal = null,
    observerOptions = DEFAULT_OPTIONS,
  } = options;

  if (!element) return null;

  // Respect reduced motion preference
  if (prefersReducedMotion()) {
    element.classList.add(visibleClass);
    if (onReveal) onReveal(element);
    return null;
  }

  // Check for IntersectionObserver support
  if (!('IntersectionObserver' in window)) {
    element.classList.add(visibleClass);
    if (onReveal) onReveal(element);
    return null;
  }

  // Register callback if provided
  if (onReveal) {
    elementCallbacks.set(element, onReveal);
  }

  // Create observer for this element
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(visibleClass);

        const callback = elementCallbacks.get(entry.target);
        if (callback) callback(entry.target);

        if (once) {
          observer.unobserve(entry.target);
          elementCallbacks.delete(entry.target);
        }
      } else if (!once) {
        entry.target.classList.remove(visibleClass);
      }
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * Reveal all elements immediately (useful for initial page load or fallback)
 * @param {string} selector - CSS selector for elements to reveal
 * @param {string} visibleClass - Class to add
 */
export const revealAll = (selector = '[data-reveal]', visibleClass = 'revealed') => {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add(visibleClass);
  });
};

/**
 * Reset all elements to hidden state
 * @param {string} selector - CSS selector for elements to reset
 * @param {string} visibleClass - Class to remove
 */
export const resetAll = (selector = '[data-reveal]', visibleClass = 'revealed') => {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.remove(visibleClass);
  });
};

/**
 * Destroy the active scroll reveal observer
 */
export const destroyScrollReveal = () => {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
};

/**
 * Refresh scroll reveal (re-observe all elements)
 * Useful after DOM changes or dynamic content loading
 * @param {Object} options - Same options as initScrollReveal
 */
export const refreshScrollReveal = (options = {}) => {
  destroyScrollReveal();
  return initScrollReveal(options);
};

/**
 * Create a staggered reveal effect for child elements
 * @param {Element} container - Parent container element
 * @param {Object} options - Configuration options
 * @param {string} options.childSelector - Selector for child elements
 * @param {number} options.staggerDelay - Delay between each child in milliseconds
 * @param {string} options.baseDelay - CSS custom property name for delay
 */
export const staggerReveal = (container, options = {}) => {
  const {
    childSelector = '> *',
    staggerDelay = 100,
    baseDelay = '--reveal-delay',
  } = options;

  if (!container) return;

  const children = container.querySelectorAll(childSelector);

  children.forEach((child, index) => {
    const delay = index * staggerDelay;
    child.style.setProperty(baseDelay, `${delay}ms`);

    // If using CSS custom property for transition-delay
    child.style.transitionDelay = `${delay}ms`;
  });
};

/**
 * Parallax effect utility
 * @param {Element} element - Element to apply parallax to
 * @param {Object} options - Configuration options
 * @param {number} options.speed - Parallax speed (0-1, where 1 is full scroll)
 * @param {string} options.direction - 'vertical' or 'horizontal'
 */
export const parallax = (element, options = {}) => {
  const { speed = 0.5, direction = 'vertical' } = options;

  if (!element || prefersReducedMotion()) return;

  let rafId = null;
  let isActive = true;

  const handleScroll = () => {
    if (!isActive) return;

    rafId = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Only animate when element is in view
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const offset = (scrollProgress - 0.5) * 100 * speed;

        if (direction === 'vertical') {
          element.style.transform = `translateY(${offset}px)`;
        } else {
          element.style.transform = `translateX(${offset}px)`;
        }
      }

      rafId = null;
    });
  };

  // Throttled scroll listener
  let ticking = false;
  const scrollListener = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', scrollListener, { passive: true });
  handleScroll(); // Initial call

  // Return cleanup function
  return () => {
    isActive = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', scrollListener);
  };
};

/**
 * Scroll progress indicator
 * @param {Element} element - Progress bar element
 * @returns {Function} Cleanup function
 */
export const scrollProgress = (element) => {
  if (!element) return () => {};

  let rafId = null;

  const updateProgress = () => {
    rafId = requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;

      element.style.width = `${progress}%`;
      rafId = null;
    });
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', updateProgress);
  };
};

// Export all utilities
export default {
  initScrollReveal,
  observeElement,
  revealAll,
  resetAll,
  destroyScrollReveal,
  refreshScrollReveal,
  staggerReveal,
  parallax,
  scrollProgress,
};
