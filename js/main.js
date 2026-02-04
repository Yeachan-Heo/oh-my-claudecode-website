/**
 * Main Entry Point - Oh My ClaudeCode Website
 * Initializes all services, UI components, and event handlers
 */

import { APP_CONFIG as CONFIG, FEATURES, prefersReducedMotion, UI_CONFIG } from './config.js';
import { statsService } from './services/statsService.js';
import { storageService } from './services/storageService.js';
import { initScrollReveal, observeElement, staggerReveal } from './ui/scrollReveal.js';
import { Skeletons } from './ui/skeletons.js';

/**
 * Application State
 */
const AppState = {
  initialized: false,
  statsLoaded: false,
  reducedMotion: false,
  viewport: 'desktop',
};

/**
 * Utility: Safe requestIdleCallback with fallback to setTimeout
 * @param {Function} callback - Function to execute
 * @param {Object} options - Options object
 */
function scheduleIdleWork(callback, options = { timeout: 2000 }) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  }
  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, 1);
}

/**
 * Utility: Animate number counting
 * @param {HTMLElement} element - Element to animate
 * @param {number} target - Target number
 * @param {number} duration - Animation duration in ms
 * @param {string} suffix - Optional suffix (k, M, etc.)
 */
function animateNumber(element, target, duration = 1000, suffix = '') {
  if (!element || AppState.reducedMotion) {
    element.textContent = target.toLocaleString() + suffix;
    return;
  }

  const startTime = performance.now();
  const startValue = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out-cubic)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startValue + (target - startValue) * easeOut);

    element.textContent = current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Initialize Services
 * Preload cached data and set up service workers if available
 */
async function initializeServices() {
  // Preload any cached stats data
  try {
    const cachedStats = storageService.get('stats');
    if (cachedStats) {
      console.debug('[Main] Preloaded cached stats:', cachedStats);
    }
  } catch (error) {
    console.debug('[Main] No cached stats available');
  }

  // Check for service worker support and register if available
  if ('serviceWorker' in navigator) {
    scheduleIdleWork(() => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.debug('[Main] ServiceWorker registered:', registration.scope);
        })
        .catch((error) => {
          console.debug('[Main] ServiceWorker registration failed:', error);
        });
    });
  }
}

/**
 * Initialize UI Components
 * Set up scroll reveal, skeletons, and lazy loading
 */
function initializeUI() {
  // Initialize skeleton styles
  if (FEATURES.skeletons) {
    Skeletons.init();
  }

  // Initialize scroll reveal for elements with [data-reveal]
  if (FEATURES.scrollReveal) {
    initScrollReveal({
      selector: '[data-reveal]',
      visibleClass: 'revealed',
      once: true,
    });
  }

  // Lazy load below-fold sections using IntersectionObserver
  setupLazyLoading();
}

/**
 * Setup lazy loading for below-fold content
 */
function setupLazyLoading() {
  const lazySections = document.querySelectorAll('[data-lazy]');

  if (!('IntersectionObserver' in window)) {
    // Fallback: load all immediately
    lazySections.forEach((section) => {
      section.classList.add('is-loaded');
    });
    return;
  }

  const lazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const section = entry.target;
          section.classList.add('is-loaded');

          // Trigger any section-specific initialization
          const loadEvent = new CustomEvent('section:loaded', {
            detail: { section },
          });
          section.dispatchEvent(loadEvent);

          lazyObserver.unobserve(section);
        }
      });
    },
    {
      rootMargin: '100px 0px',
      threshold: 0.01,
    }
  );

  lazySections.forEach((section) => {
    lazyObserver.observe(section);
  });
}

/**
 * Hero Animation
 * Triggers entrance animation with character stagger effect
 */
function initHeroAnimation() {
  if (!FEATURES.heroAnimation || AppState.reducedMotion) {
    // Show hero immediately without animation
    const heroElements = document.querySelectorAll('.hero [data-animate]');
    heroElements.forEach((el) => {
      el.classList.add('is-animated');
    });
    return;
  }

  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Animate hero title with character stagger
  const title = hero.querySelector('.hero__title');
  if (title) {
    animateTitleCharacters(title);
  }

  // Animate hero subtitle
  const subtitle = hero.querySelector('.hero__subtitle');
  if (subtitle) {
    setTimeout(() => {
      subtitle.classList.add('is-visible');
    }, 300);
  }

  // Animate CTA buttons
  const ctaButtons = hero.querySelectorAll('.hero__cta');
  ctaButtons.forEach((btn, index) => {
    setTimeout(() => {
      btn.classList.add('is-visible');
    }, 500 + index * 100);
  });

  // Animate hero graphic/illustration
  const graphic = hero.querySelector('.hero__graphic');
  if (graphic) {
    setTimeout(() => {
      graphic.classList.add('is-visible');
    }, 200);
  }
}

/**
 * Animate title characters with stagger effect
 * @param {HTMLElement} titleElement - The title element
 */
function animateTitleCharacters(titleElement) {
  const text = titleElement.textContent;
  const chars = text.split('');

  // Wrap each character in a span
  titleElement.innerHTML = chars
    .map((char, index) => {
      const isSpace = char === ' ';
      const delay = index * 30; // 30ms stagger between characters
      return isSpace
        ? ' '
        : `<span class="char" style="--char-delay: ${delay}ms">${char}</span>`;
    })
    .join('');

  // Trigger animation after a short delay
  setTimeout(() => {
    titleElement.classList.add('is-animating');
  }, 100);
}

/**
 * Stats Loading
 * Show skeletons, fetch stats with caching, animate number counting
 */
async function loadStats() {
  const statsContainer = document.querySelector('.stats-container');
  if (!statsContainer) return;

  // Show skeleton placeholders
  const skeletonGrid = Skeletons.statsGrid(4);
  skeletonGrid.className = 'stats-skeletons stats-grid';
  statsContainer.innerHTML = '';
  statsContainer.appendChild(skeletonGrid);

  try {
    // Fetch stats (uses caching internally)
    const stats = await statsService.get();
    AppState.statsLoaded = true;

    // Render stats with animation
    renderStats(statsContainer, stats);
  } catch (error) {
    console.error('[Main] Failed to load stats:', error);
    renderStatsError(statsContainer);
  }
}

/**
 * Render stats cards with number animation
 * @param {HTMLElement} container - Container element
 * @param {Object} stats - Stats data object
 */
function renderStats(container, stats) {
  const statsData = [
    {
      label: 'GitHub Stars',
      value: stats.stars || 0,
      icon: 'star',
      suffix: '',
    },
    {
      label: 'Monthly Downloads',
      value: stats.downloads || 0,
      icon: 'download',
      suffix: '',
    },
    {
      label: 'Agents',
      value: stats.agents || 33,
      icon: 'users',
      suffix: '',
    },
    {
      label: 'Latest Version',
      value: stats.version || '0.0.0',
      icon: 'tag',
      isText: true,
    },
  ];

  container.innerHTML = `
    <div class="stats-grid">
      ${statsData
        .map(
          (stat, index) => `
        <div class="stat-card" data-reveal style="--reveal-delay: ${index * 100}ms">
          <div class="stat-card__icon">
            <svg class="icon icon--${stat.icon}" aria-hidden="true">
              <use href="#icon-${stat.icon}"></use>
            </svg>
          </div>
          <div class="stat-card__value" data-value="${stat.value}" data-suffix="${stat.suffix}" ${stat.isText ? 'data-text="true"' : ''}>
            ${stat.isText ? stat.value : '0'}
          </div>
          <div class="stat-card__label">${stat.label}</div>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="stats-updated">
      Updated ${statsService.getRelativeTime(stats.updatedAt)}
    </div>
  `;

  // Animate numbers after render
  if (!AppState.reducedMotion) {
    container.querySelectorAll('.stat-card__value').forEach((el, index) => {
      if (el.dataset.text) return; // Skip text values (version)

      const value = parseInt(el.dataset.value, 10) || 0;
      const suffix = el.dataset.suffix || '';

      // Stagger animations
      setTimeout(() => {
        animateNumber(el, value, 1500, suffix);
      }, index * 150);
    });
  } else {
    // Show final values immediately
    container.querySelectorAll('.stat-card__value').forEach((el) => {
      if (!el.dataset.text) {
        const value = parseInt(el.dataset.value, 10) || 0;
        const suffix = el.dataset.suffix || '';
        el.textContent = value.toLocaleString() + suffix;
      }
    });
  }

  // Update hero stat badges
  const heroStars = document.getElementById('hero-stars');
  const heroDownloads = document.getElementById('hero-downloads');
  const heroVersion = document.getElementById('hero-version');

  if (heroStars) heroStars.textContent = stats.stars ? (stats.stars >= 1000 ? (stats.stars / 1000).toFixed(1) + 'k' : stats.stars.toString()) : '---';
  if (heroDownloads) heroDownloads.textContent = stats.downloads ? (stats.downloads >= 1000 ? (stats.downloads / 1000).toFixed(1) + 'k' : stats.downloads.toString()) : '---';
  if (heroVersion) heroVersion.textContent = stats.version || '---';

  // Initialize scroll reveal for new elements
  if (FEATURES.scrollReveal) {
    observeElement(container, {
      visibleClass: 'revealed',
      once: true,
    });
  }
}

/**
 * Render error state for stats
 * @param {HTMLElement} container - Container element
 */
function renderStatsError(container) {
  container.innerHTML = `
    <div class="stats-error">
      <p>Unable to load stats. Please try again later.</p>
      <button class="btn btn--secondary" onclick="location.reload()">Retry</button>
    </div>
  `;
}

/**
 * Event Listeners
 * Copy code buttons, mobile menu, keyboard shortcuts
 */
function setupEventListeners() {
  // Copy code buttons
  setupCopyButtons();

  // Mobile menu toggle
  setupMobileMenu();

  // Keyboard shortcuts
  setupKeyboardShortcuts();

  // Smooth scroll for anchor links
  setupSmoothScroll();

  // Handle visibility change (pause animations when tab hidden)
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Handle resize with debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
  });
}

/**
 * Setup copy code buttons
 */
function setupCopyButtons() {
  document.querySelectorAll('.code-block').forEach((block) => {
    const copyBtn = block.querySelector('.copy-btn');
    const codeElement = block.querySelector('code');

    if (!copyBtn || !codeElement) return;

    copyBtn.addEventListener('click', async () => {
      const code = codeElement.textContent;

      try {
        await navigator.clipboard.writeText(code);

        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('is-copied');

        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('is-copied');
        }, 2000);
      } catch (error) {
        console.error('[Main] Failed to copy:', error);
        copyBtn.textContent = 'Failed';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      }
    });
  });
}

/**
 * Setup mobile menu toggle
 */
function setupMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('is-open');
    document.body.classList.toggle('menu-open');

    // Trap focus in menu when open
    if (!isExpanded) {
      trapFocus(navMenu);
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (
      navMenu.classList.contains('is-open') &&
      !navMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      menuToggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }
  });
}

/**
 * Trap focus within an element (for accessibility)
 * @param {HTMLElement} element - Element to trap focus in
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });

  firstFocusable?.focus();
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ignore if inside input/textarea
    if (event.target.matches('input, textarea')) return;

    // Cmd/Ctrl + K: Focus search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.querySelector('.search-input');
      searchInput?.focus();
    }

    // Escape: Close mobile menu, modals
    if (event.key === 'Escape') {
      const menuToggle = document.querySelector('.menu-toggle');
      const navMenu = document.querySelector('.nav-menu');

      if (navMenu?.classList.contains('is-open')) {
        menuToggle?.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
        menuToggle?.focus();
      }
    }
  });
}

/**
 * Setup smooth scroll for anchor links
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      event.preventDefault();

      const headerOffset = UI_CONFIG?.headerHeight || 64;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: AppState.reducedMotion ? 'auto' : 'smooth',
      });

      // Update focus for accessibility
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus({ preventScroll: true });
    });
  });
}

/**
 * Handle page visibility change
 */
function handleVisibilityChange() {
  if (document.hidden) {
    // Pause expensive operations when tab is hidden
    document.body.classList.add('is-inactive');
  } else {
    document.body.classList.remove('is-inactive');
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  const newViewport =
    window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

  if (newViewport !== AppState.viewport) {
    AppState.viewport = newViewport;

    // Dispatch custom event for components that need to respond
    window.dispatchEvent(
      new CustomEvent('viewport:change', {
        detail: { viewport: newViewport },
      })
    );
  }
}

/**
 * Performance: Initialize non-critical features
 * Uses requestIdleCallback for deferred work
 */
function initializeNonCritical() {
  scheduleIdleWork(() => {
    // Preload resources for likely next navigation
    preloadResources();

    // Initialize analytics (non-blocking)
    initAnalytics();

    // Setup progressive enhancement features
    setupProgressiveEnhancement();
  });
}

/**
 * Preload resources for likely next navigation
 */
function preloadResources() {
  const prefetchLinks = [
    // Add likely next pages here
    // '/docs',
    // '/agents',
  ];

  prefetchLinks.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Initialize analytics (placeholder)
 */
function initAnalytics() {
  // Analytics initialization would go here
  // Respect Do Not Track settings
  if (navigator.doNotTrack === '1') return;

  // Example: Initialize privacy-respecting analytics
  console.debug('[Main] Analytics initialized (placeholder)');
}

/**
 * Setup progressive enhancement features
 */
function setupProgressiveEnhancement() {
  // Add intersection observer for images if native lazy loading isn't supported
  if (!('loading' in HTMLImageElement.prototype)) {
    setupImageLazyLoading();
  }
}

/**
 * Fallback lazy loading for images
 */
function setupImageLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach((img) => imageObserver.observe(img));
}

/**
 * Main Initialization
 * Entry point - called when DOM is ready
 */
async function init() {
  // Prevent double initialization
  if (AppState.initialized) return;

  // Check user preferences
  AppState.reducedMotion = prefersReducedMotion();
  AppState.viewport =
    window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

  // Add reduced motion class if needed
  if (AppState.reducedMotion) {
    document.documentElement.classList.add('reduced-motion');
  }

  console.debug('[Main] Initializing application...');

  try {
    // Phase 1: Critical initialization (blocking)
    await initializeServices();
    initializeUI();

    // Phase 2: Hero animation (immediate visual feedback)
    initHeroAnimation();

    // Phase 3: Load stats (non-blocking, shows skeletons)
    loadStats();

    // Phase 4: Event listeners
    setupEventListeners();

    // Phase 5: Non-critical features (deferred)
    initializeNonCritical();

    AppState.initialized = true;
    console.debug('[Main] Application initialized successfully');

    // Dispatch initialization complete event
    window.dispatchEvent(new CustomEvent('app:initialized', { detail: AppState }));
  } catch (error) {
    console.error('[Main] Initialization failed:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded
  init();
}

// Expose minimal API for debugging
window.OMC = {
  version: '1.0.0',
  state: AppState,
  stats: statsService,
  storage: storageService,
  refreshStats: () => loadStats(),
};

// Default export for module systems
export { init, AppState };
