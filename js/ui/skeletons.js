/**
 * Skeleton UI Components - Performance-optimized loading placeholders
 * Implements progressive loading patterns with CSS animations
 */

const Skeletons = (function() {
  'use strict';

  /**
   * Base skeleton styles
   */
  const baseStyles = `
    <style>
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--skeleton-base, #1a1a2e) 25%,
          var(--skeleton-highlight, #252542) 50%,
          var(--skeleton-base, #1a1a2e) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
      }

      .skeleton-pulse {
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* Card Skeleton */
      .skeleton-card {
        background: var(--card-bg, #0f0f1a);
        border-radius: 12px;
        padding: 20px;
        border: 1px solid var(--border-color, #1e1e3f);
      }

      .skeleton-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
      }

      .skeleton-title {
        height: 20px;
        width: 60%;
        border-radius: 4px;
      }

      .skeleton-subtitle {
        height: 14px;
        width: 40%;
        margin-top: 8px;
        border-radius: 4px;
      }

      .skeleton-content-line {
        height: 12px;
        margin-bottom: 10px;
        border-radius: 4px;
      }

      .skeleton-content-line:last-child {
        width: 70%;
      }

      /* Stats Skeleton */
      .skeleton-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .skeleton-stat-card {
        background: var(--card-bg, #0f0f1a);
        border-radius: 12px;
        padding: 24px;
        border: 1px solid var(--border-color, #1e1e3f);
        text-align: center;
      }

      .skeleton-stat-icon {
        width: 40px;
        height: 40px;
        margin: 0 auto 16px;
        border-radius: 8px;
      }

      .skeleton-stat-value {
        height: 32px;
        width: 80px;
        margin: 0 auto 8px;
        border-radius: 4px;
      }

      .skeleton-stat-label {
        height: 14px;
        width: 100px;
        margin: 0 auto;
        border-radius: 4px;
      }

      /* Code Block Skeleton */
      .skeleton-code-block {
        background: var(--code-bg, #0d1117);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border-color, #30363d);
      }

      .skeleton-code-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: var(--code-header-bg, #161b22);
        border-bottom: 1px solid var(--border-color, #30363d);
      }

      .skeleton-code-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .skeleton-code-content {
        padding: 16px;
        font-family: 'Fira Code', monospace;
      }

      .skeleton-code-line {
        height: 16px;
        margin-bottom: 8px;
        border-radius: 2px;
      }

      .skeleton-code-line.indent-1 { margin-left: 20px; width: 85%; }
      .skeleton-code-line.indent-2 { margin-left: 40px; width: 70%; }
      .skeleton-code-line.indent-3 { margin-left: 60px; width: 50%; }

      /* List Skeleton */
      .skeleton-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .skeleton-list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--card-bg, #0f0f1a);
        border-radius: 8px;
        border: 1px solid var(--border-color, #1e1e3f);
      }

      .skeleton-list-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        flex-shrink: 0;
      }

      .skeleton-list-content {
        flex: 1;
      }

      .skeleton-list-title {
        height: 16px;
        width: 40%;
        margin-bottom: 6px;
        border-radius: 3px;
      }

      .skeleton-list-desc {
        height: 12px;
        width: 70%;
        border-radius: 3px;
      }

      /* Grid Skeleton */
      .skeleton-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }

      /* Animation variants */
      .skeleton-fast {
        animation-duration: 1s;
      }

      .skeleton-slow {
        animation-duration: 2s;
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          background: var(--skeleton-base, #1a1a2e);
          opacity: 0.6;
        }
      }
    </style>
  `;

  /**
   * Insert base styles into document head if not already present
   */
  function ensureStyles() {
    if (!document.getElementById('skeleton-styles')) {
      const styleEl = document.createElement('div');
      styleEl.innerHTML = baseStyles;
      const style = styleEl.querySelector('style');
      style.id = 'skeleton-styles';
      document.head.appendChild(style);
    }
  }

  /**
   * Create a skeleton element with specified dimensions
   */
  function createSkeletonElement(className, options = {}) {
    const {
      width,
      height,
      variant = 'shimmer',
      customClass = ''
    } = options;

    const el = document.createElement('div');
    el.className = `skeleton ${variant === 'pulse' ? 'skeleton-pulse' : ''} ${className} ${customClass}`;

    if (width) el.style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) el.style.height = typeof height === 'number' ? `${height}px` : height;

    return el;
  }

  return {
    /**
     * Initialize skeleton styles
     */
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureStyles);
      } else {
        ensureStyles();
      }
    },

    /**
     * Generate a card skeleton
     * @param {Object} options - Configuration options
     * @returns {HTMLElement}
     */
    card(options = {}) {
      const {
        showAvatar = true,
        titleLines = 1,
        contentLines = 3,
        customClass = ''
      } = options;

      const card = document.createElement('div');
      card.className = `skeleton-card ${customClass}`;

      if (showAvatar) {
        const header = document.createElement('div');
        header.className = 'skeleton-card-header';

        const avatar = createSkeletonElement('skeleton-avatar');
        header.appendChild(avatar);

        const titleGroup = document.createElement('div');
        titleGroup.style.flex = '1';

        for (let i = 0; i < titleLines; i++) {
          const title = createSkeletonElement(i === 0 ? 'skeleton-title' : 'skeleton-subtitle');
          titleGroup.appendChild(title);
        }

        header.appendChild(titleGroup);
        card.appendChild(header);
      }

      const content = document.createElement('div');
      content.className = 'skeleton-card-content';

      for (let i = 0; i < contentLines; i++) {
        const line = createSkeletonElement('skeleton-content-line');
        content.appendChild(line);
      }

      card.appendChild(content);
      return card;
    },

    /**
     * Generate a grid of card skeletons
     * @param {number} count - Number of cards
     * @param {Object} options - Card options
     * @returns {HTMLElement}
     */
    cardGrid(count, options = {}) {
      const grid = document.createElement('div');
      grid.className = 'skeleton-grid';

      for (let i = 0; i < count; i++) {
        grid.appendChild(this.card(options));
      }

      return grid;
    },

    /**
     * Generate a stats card skeleton
     * @param {Object} options - Configuration options
     * @returns {HTMLElement}
     */
    statCard(options = {}) {
      const { showIcon = true, customClass = '' } = options;

      const card = document.createElement('div');
      card.className = `skeleton-stat-card ${customClass}`;

      if (showIcon) {
        const icon = createSkeletonElement('skeleton-stat-icon');
        card.appendChild(icon);
      }

      const value = createSkeletonElement('skeleton-stat-value');
      card.appendChild(value);

      const label = createSkeletonElement('skeleton-stat-label');
      card.appendChild(label);

      return card;
    },

    /**
     * Generate a stats grid skeleton
     * @param {number} count - Number of stat cards
     * @returns {HTMLElement}
     */
    statsGrid(count) {
      const grid = document.createElement('div');
      grid.className = 'skeleton-stats';

      for (let i = 0; i < count; i++) {
        grid.appendChild(this.statCard());
      }

      return grid;
    },

    /**
     * Generate a code block skeleton
     * @param {Object} options - Configuration options
     * @returns {HTMLElement}
     */
    codeBlock(options = {}) {
      const {
        showHeader = true,
        lines = 8,
        showIndentation = true,
        customClass = ''
      } = options;

      const block = document.createElement('div');
      block.className = `skeleton-code-block ${customClass}`;

      if (showHeader) {
        const header = document.createElement('div');
        header.className = 'skeleton-code-header';

        ['#ff5f56', '#ffbd2e', '#27c93f'].forEach(color => {
          const dot = createSkeletonElement('skeleton-code-dot');
          dot.style.background = color;
          dot.style.animation = 'none';
          header.appendChild(dot);
        });

        block.appendChild(header);
      }

      const content = document.createElement('div');
      content.className = 'skeleton-code-content';

      for (let i = 0; i < lines; i++) {
        const line = createSkeletonElement('skeleton-code-line');

        if (showIndentation) {
          const indentLevel = Math.floor(Math.random() * 3);
          if (indentLevel > 0) {
            line.classList.add(`indent-${indentLevel}`);
          }
        }

        content.appendChild(line);
      }

      block.appendChild(content);
      return block;
    },

    /**
     * Generate a list skeleton
     * @param {number} count - Number of list items
     * @param {Object} options - Configuration options
     * @returns {HTMLElement}
     */
    list(count, options = {}) {
      const { showIcon = true, customClass = '' } = options;

      const list = document.createElement('div');
      list.className = `skeleton-list ${customClass}`;

      for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'skeleton-list-item';

        if (showIcon) {
          const icon = createSkeletonElement('skeleton-list-icon');
          item.appendChild(icon);
        }

        const content = document.createElement('div');
        content.className = 'skeleton-list-content';

        const title = createSkeletonElement('skeleton-list-title');
        content.appendChild(title);

        const desc = createSkeletonElement('skeleton-list-desc');
        content.appendChild(desc);

        item.appendChild(content);
        list.appendChild(item);
      }

      return list;
    },

    /**
     * Replace an element with a skeleton and restore when data loads
     * @param {HTMLElement} element - Element to replace
     * @param {HTMLElement} skeleton - Skeleton to show
     * @returns {Function} Function to restore the original element
     */
    wrap(element, skeleton) {
      const parent = element.parentNode;
      const placeholder = document.createComment('skeleton-placeholder');

      parent.insertBefore(placeholder, element);
      parent.replaceChild(skeleton, element);

      return function restore(newContent) {
        const content = newContent || element;
        skeleton.remove();
        parent.insertBefore(content, placeholder);
        placeholder.remove();
      };
    },

    /**
     * Create a skeleton for a specific content type
     * @param {string} type - Type of skeleton (card, stats, code, list)
     * @param {Object} options - Type-specific options
     * @returns {HTMLElement}
     */
    create(type, options = {}) {
      switch (type) {
        case 'card':
          return this.card(options);
        case 'stats':
          return options.count ? this.statsGrid(options.count) : this.statCard(options);
        case 'code':
          return this.codeBlock(options);
        case 'list':
          return this.list(options.count || 5, options);
        case 'cardGrid':
          return this.cardGrid(options.count || 4, options);
        default:
          console.warn(`Unknown skeleton type: ${type}`);
          return createSkeletonElement('skeleton', options);
      }
    }
  };
})();

// Auto-initialize styles
Skeletons.init();

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Skeletons;
} else if (typeof window !== 'undefined') {
  window.Skeletons = Skeletons;
}

// ES module exports
export { Skeletons };
export default Skeletons;
