/**
 * Accordion - Enhanced details/summary with smooth transitions
 * Native details/summary enhancement with keyboard navigation
 */

class Accordion {
  constructor(options = {}) {
    this.selector = options.selector || 'details[data-accordion]';
    this.groupSelector = options.groupSelector || '[data-accordion-group]';
    this.toggleSelector = options.toggleSelector || 'summary';
    this.contentSelector = options.contentSelector || '.accordion-content';
    this.animateClass = options.animateClass || 'animate';
    this.expandedClass = options.expandedClass || 'expanded';
    this.duration = options.duration || 300;

    this.items = [];
    this.groups = [];

    this.init();
  }

  init() {
    this.items = Array.from(document.querySelectorAll(this.selector));
    this.groups = Array.from(document.querySelectorAll(this.groupSelector));

    if (this.items.length === 0) return;

    this.items.forEach(item => this.enhance(item));
    this.setupGroups();
    this.setupKeyboardNavigation();
  }

  enhance(details) {
    const summary = details.querySelector(this.toggleSelector);
    const content = details.querySelector(this.contentSelector) || this.findContent(details);

    if (!summary || !content) return;

    // Set initial ARIA attributes
    summary.setAttribute('role', 'button');
    summary.setAttribute('aria-expanded', details.open);

    // Wrap content for animation
    if (!content.classList.contains('accordion-content-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'accordion-content-wrapper';

      // Move all children after summary into wrapper
      const children = Array.from(details.children).filter(child => child !== summary);
      children.forEach(child => wrapper.appendChild(child));

      details.appendChild(wrapper);
    }

    // Store references
    details._accordion = {
      summary,
      content: details.querySelector('.accordion-content-wrapper'),
      isAnimating: false
    };

    // Handle toggle
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle(details);
    });

    // Initial state
    if (details.open) {
      this.open(details, false);
    }
  }

  findContent(details) {
    // Find first non-summary element
    for (const child of details.children) {
      if (child.tagName !== 'SUMMARY') {
        return child;
      }
    }
    return null;
  }

  toggle(details) {
    if (details.open) {
      this.close(details);
    } else {
      this.open(details);

      // Handle exclusive groups
      const group = details.closest(this.groupSelector);
      if (group && group.hasAttribute('data-exclusive')) {
        this.closeOthersInGroup(details, group);
      }
    }
  }

  open(details, animate = true) {
    if (details._accordion?.isAnimating) return;

    const { summary, content } = details._accordion || {};
    if (!content) return;

    details.open = true;
    summary?.setAttribute('aria-expanded', 'true');
    details.classList.add(this.expandedClass);

    if (!animate) {
      content.style.height = 'auto';
      return;
    }

    // Animate opening
    details._accordion.isAnimating = true;

    const height = content.scrollHeight;
    content.style.height = '0px';
    content.style.overflow = 'hidden';

    // Force reflow
    content.offsetHeight;

    content.style.transition = `height ${this.duration}ms ease-out`;
    content.classList.add(this.animateClass);

    requestAnimationFrame(() => {
      content.style.height = `${height}px`;
    });

    setTimeout(() => {
      content.style.height = 'auto';
      content.style.overflow = '';
      content.classList.remove(this.animateClass);
      details._accordion.isAnimating = false;
    }, this.duration);
  }

  close(details, animate = true) {
    if (details._accordion?.isAnimating) return;

    const { summary, content } = details._accordion || {};
    if (!content) return;

    summary?.setAttribute('aria-expanded', 'false');
    details.classList.remove(this.expandedClass);

    if (!animate) {
      details.open = false;
      return;
    }

    // Animate closing
    details._accordion.isAnimating = true;

    const height = content.scrollHeight;
    content.style.height = `${height}px`;
    content.style.overflow = 'hidden';

    // Force reflow
    content.offsetHeight;

    content.style.transition = `height ${this.duration}ms ease-in`;
    content.classList.add(this.animateClass);

    requestAnimationFrame(() => {
      content.style.height = '0px';
    });

    setTimeout(() => {
      details.open = false;
      content.style.height = '';
      content.style.overflow = '';
      content.style.transition = '';
      content.classList.remove(this.animateClass);
      details._accordion.isAnimating = false;
    }, this.duration);
  }

  closeOthersInGroup(currentDetails, group) {
    const siblings = group.querySelectorAll(this.selector);
    siblings.forEach(sibling => {
      if (sibling !== currentDetails && sibling.open) {
        this.close(sibling);
      }
    });
  }

  setupGroups() {
    this.groups.forEach(group => {
      const items = group.querySelectorAll(this.selector);

      items.forEach((item, index) => {
        const summary = item.querySelector(this.toggleSelector);
        if (summary) {
          summary.setAttribute('data-accordion-index', index);
        }
      });
    });
  }

  setupKeyboardNavigation() {
    this.groups.forEach(group => {
      const items = Array.from(group.querySelectorAll(this.selector));
      const summaries = items.map(item => item.querySelector(this.toggleSelector)).filter(Boolean);

      group.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        const currentIndex = summaries.indexOf(activeElement);

        if (currentIndex === -1) return;

        let newIndex = currentIndex;

        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            e.preventDefault();
            newIndex = (currentIndex + 1) % summaries.length;
            break;

          case 'ArrowUp':
          case 'ArrowLeft':
            e.preventDefault();
            newIndex = (currentIndex - 1 + summaries.length) % summaries.length;
            break;

          case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;

          case 'End':
            e.preventDefault();
            newIndex = summaries.length - 1;
            break;

          default:
            return;
        }

        summaries[newIndex].focus();
      });
    });

    // Individual accordion keyboard support
    this.items.forEach(item => {
      const summary = item.querySelector(this.toggleSelector);
      if (!summary) return;

      summary.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle(item);
        }
      });
    });
  }

  // Public API: Open specific accordion
  openById(id) {
    const details = document.getElementById(id);
    if (details && details.matches(this.selector)) {
      this.open(details);
    }
  }

  // Public API: Close specific accordion
  closeById(id) {
    const details = document.getElementById(id);
    if (details && details.matches(this.selector)) {
      this.close(details);
    }
  }

  // Public API: Open all in group
  openAll(groupSelector) {
    const group = document.querySelector(groupSelector);
    if (!group) return;

    const items = group.querySelectorAll(this.selector);
    items.forEach(item => this.open(item));
  }

  // Public API: Close all in group
  closeAll(groupSelector) {
    const group = document.querySelector(groupSelector);
    if (!group) return;

    const items = group.querySelectorAll(this.selector);
    items.forEach(item => this.close(item));
  }

  // Public API: Refresh for dynamically added accordions
  refresh() {
    const newItems = Array.from(document.querySelectorAll(this.selector))
      .filter(item => !this.items.includes(item));

    newItems.forEach(item => {
      this.enhance(item);
      this.items.push(item);
    });

    this.setupGroups();
    this.setupKeyboardNavigation();
  }

  // Public API: Destroy
  destroy() {
    this.items.forEach(details => {
      const { summary, content } = details._accordion || {};

      if (summary) {
        summary.removeAttribute('role');
        summary.removeAttribute('aria-expanded');
        summary.removeAttribute('data-accordion-index');

        // Clone to remove event listeners
        const newSummary = summary.cloneNode(true);
        summary.parentNode.replaceChild(newSummary, summary);
      }

      if (content) {
        content.style.height = '';
        content.style.overflow = '';
        content.style.transition = '';
        content.classList.remove(this.animateClass, 'accordion-content-wrapper');

        // Unwrap content
        while (content.firstChild) {
          details.appendChild(content.firstChild);
        }
        content.remove();
      }

      details.classList.remove(this.expandedClass);
      delete details._accordion;
    });

    this.items = [];
    this.groups = [];
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Accordion());
} else {
  new Accordion();
}

export { Accordion };
export default Accordion;
