/**
 * SidebarSpy - Active section highlighting for documentation
 * Uses IntersectionObserver for performant section tracking
 */

class SidebarSpy {
  constructor(options = {}) {
    this.sidebarSelector = options.sidebar || '.docs-sidebar';
    this.contentSelector = options.content || '.docs-content';
    this.linkSelector = options.links || '.sidebar-link';
    this.sectionSelector = options.sections || '[data-section]';
    this.activeClass = options.activeClass || 'active';
    this.collapsibleClass = options.collapsibleClass || 'collapsible';
    this.collapsedClass = options.collapsedClass || 'collapsed';

    this.sidebar = null;
    this.links = [];
    this.sections = [];
    this.observer = null;
    this.currentActive = null;

    this.init();
  }

  init() {
    this.sidebar = document.querySelector(this.sidebarSelector);
    if (!this.sidebar) return;

    this.links = this.sidebar.querySelectorAll(this.linkSelector);
    this.sections = document.querySelectorAll(this.sectionSelector);

    if (this.sections.length === 0) return;

    this.setupObserver();
    this.setupEventListeners();
    this.setupCollapsible();

    // Set initial active state based on URL hash or first section
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.scrollToSection(hash);
    }
  }

  setupObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveSection(entry.target.id);
        }
      });
    }, options);

    this.sections.forEach(section => {
      this.observer.observe(section);
    });
  }

  setActiveSection(sectionId) {
    if (this.currentActive === sectionId) return;
    this.currentActive = sectionId;

    // Update link states
    this.links.forEach(link => {
      const href = link.getAttribute('href');
      const linkSectionId = href?.startsWith('#') ? href.slice(1) : null;

      if (linkSectionId === sectionId) {
        link.classList.add(this.activeClass);
        link.setAttribute('aria-current', 'true');

        // Expand parent collapsible if needed
        const parentCollapsible = link.closest(`.${this.collapsibleClass}`);
        if (parentCollapsible) {
          parentCollapsible.classList.remove(this.collapsedClass);
          const toggle = parentCollapsible.querySelector('.collapsible-toggle');
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
          }
        }

        // Scroll link into view in sidebar
        this.scrollLinkIntoView(link);
      } else {
        link.classList.remove(this.activeClass);
        link.removeAttribute('aria-current');
      }
    });

    // Update URL without jumping
    if (sectionId && history.replaceState) {
      history.replaceState(null, null, `#${sectionId}`);
    }
  }

  scrollLinkIntoView(link) {
    const sidebarRect = this.sidebar.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    const isAbove = linkRect.top < sidebarRect.top;
    const isBelow = linkRect.bottom > sidebarRect.bottom;

    if (isAbove || isBelow) {
      link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  setupEventListeners() {
    // Smooth scroll on link click
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href?.startsWith('#')) {
          e.preventDefault();
          const sectionId = href.slice(1);
          this.scrollToSection(sectionId);
        }
      });
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        this.scrollToSection(hash, false);
      }
    });
  }

  scrollToSection(sectionId, updateHistory = true) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Temporarily disable observer to prevent flicker
    this.observer.disconnect();

    const headerOffset = 80; // Account for fixed header
    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth'
    });

    // Set active immediately for responsiveness
    this.setActiveSection(sectionId);

    // Re-enable observer after scroll completes
    setTimeout(() => {
      this.sections.forEach(s => this.observer.observe(s));
    }, 500);

    // Update URL if needed
    if (updateHistory && history.pushState) {
      history.pushState(null, null, `#${sectionId}`);
    }
  }

  setupCollapsible() {
    const collapsibles = this.sidebar.querySelectorAll(`.${this.collapsibleClass}`);

    collapsibles.forEach(collapsible => {
      const toggle = collapsible.querySelector('.collapsible-toggle');
      const submenu = collapsible.querySelector('.submenu');

      if (!toggle || !submenu) return;

      toggle.addEventListener('click', () => {
        const isCollapsed = collapsible.classList.toggle(this.collapsedClass);
        toggle.setAttribute('aria-expanded', !isCollapsed);
        submenu.setAttribute('aria-hidden', isCollapsed);
      });

      // Initialize state
      const isCollapsed = collapsible.classList.contains(this.collapsedClass);
      toggle.setAttribute('aria-expanded', !isCollapsed);
      submenu.setAttribute('aria-hidden', isCollapsed);
    });
  }

  // Public API: Refresh when DOM changes
  refresh() {
    this.observer.disconnect();
    this.links = this.sidebar.querySelectorAll(this.linkSelector);
    this.sections = document.querySelectorAll(this.sectionSelector);
    this.setupObserver();
  }

  // Public API: Destroy
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.links = [];
    this.sections = [];
  }
}

export { SidebarSpy };
export default SidebarSpy;
