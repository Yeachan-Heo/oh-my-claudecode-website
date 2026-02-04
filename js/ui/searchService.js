/**
 * SearchService - Documentation search with fuzzy matching
 * Builds index from headings and content, supports keyboard shortcuts
 */

class SearchService {
  constructor(options = {}) {
    this.contentSelector = options.contentSelector || '.docs-content';
    this.headingSelector = options.headingSelector || 'h1, h2, h3, h4, h5, h6';
    this.textSelector = options.textSelector || 'p, li, td';
    this.searchInputSelector = options.searchInput || '#search-input';
    this.resultsSelector = options.results || '#search-results';
    this.overlaySelector = options.overlay || '#search-overlay';
    this.minQueryLength = options.minQueryLength || 2;
    this.maxResults = options.maxResults || 10;
    this.debounceMs = options.debounceMs || 150;

    this.index = [];
    this.searchInput = null;
    this.resultsContainer = null;
    this.overlay = null;
    this.debounceTimer = null;
    this.isOpen = false;
    this.selectedIndex = -1;

    this.init();
  }

  init() {
    this.searchInput = document.querySelector(this.searchInputSelector);
    this.resultsContainer = document.querySelector(this.resultsSelector);

    if (!this.searchInput) {
      this.createSearchUI();
    }

    this.buildIndex();
    this.setupEventListeners();
    this.setupKeyboardShortcut();
  }

  createSearchUI() {
    // Create search input if not exists
    const searchContainer = document.createElement('div');
    searchContainer.className = 'docs-search';
    searchContainer.innerHTML = `
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="search"
          id="search-input"
          class="search-input"
          placeholder="Search documentation..."
          aria-label="Search documentation"
          autocomplete="off"
        />
        <kbd class="search-shortcut">/</kbd>
      </div>
      <div id="search-results" class="search-results" role="listbox" aria-label="Search results"></div>
    `;

    // Insert at top of sidebar or body
    const sidebar = document.querySelector('.docs-sidebar');
    if (sidebar) {
      sidebar.insertBefore(searchContainer, sidebar.firstChild);
    } else {
      document.body.insertBefore(searchContainer, document.body.firstChild);
    }

    this.searchInput = searchContainer.querySelector('#search-input');
    this.resultsContainer = searchContainer.querySelector('#search-results');

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'search-overlay';
    this.overlay.className = 'search-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.overlay);
  }

  buildIndex() {
    const content = document.querySelector(this.contentSelector);
    if (!content) return;

    const headings = content.querySelectorAll(this.headingSelector);
    const textElements = content.querySelectorAll(this.textSelector);

    // Index headings
    headings.forEach(heading => {
      const id = heading.id || this.generateId(heading);
      if (!heading.id) heading.id = id;

      this.index.push({
        type: 'heading',
        level: parseInt(heading.tagName[1]),
        text: this.cleanText(heading.textContent),
        id: id,
        context: this.getContext(heading),
        weight: 7 - parseInt(heading.tagName[1]) // h1 = 6, h6 = 1
      });
    });

    // Index text content
    textElements.forEach(el => {
      const text = this.cleanText(el.textContent);
      if (text.length < 20) return; // Skip short fragments

      // Find nearest heading for context
      const context = this.findNearestHeading(el);

      this.index.push({
        type: 'content',
        text: text.slice(0, 200), // Limit length
        id: context?.id || '',
        context: context?.text || '',
        weight: 1
      });
    });

    // Sort by weight
    this.index.sort((a, b) => b.weight - a.weight);
  }

  generateId(heading) {
    const base = heading.textContent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let id = base;
    let counter = 1;
    while (document.getElementById(id)) {
      id = `${base}-${counter++}`;
    }
    return id;
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
  }

  getContext(element) {
    const parent = element.closest('section, article, .section');
    if (parent) {
      const heading = parent.querySelector('h1, h2, h3');
      if (heading && heading !== element) {
        return this.cleanText(heading.textContent);
      }
    }
    return '';
  }

  findNearestHeading(element) {
    let current = element;
    while (current && current !== document.body) {
      const prevHeading = current.previousElementSibling;
      if (prevHeading && /^H[1-6]$/.test(prevHeading.tagName)) {
        return {
          id: prevHeading.id,
          text: this.cleanText(prevHeading.textContent)
        };
      }
      current = current.parentElement;
    }
    return null;
  }

  setupEventListeners() {
    // Input handling
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.performSearch(e.target.value);
      }, this.debounceMs);
    });

    // Focus handling
    this.searchInput.addEventListener('focus', () => {
      this.open();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.docs-search')) {
        this.close();
      }
    });

    // Handle result clicks
    this.resultsContainer.addEventListener('click', (e) => {
      const resultItem = e.target.closest('.search-result-item');
      if (resultItem) {
        this.navigateToResult(resultItem);
      }
    });
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // / to focus search (when not typing in input)
      if (e.key === '/' && !this.isTypingInInput(e.target)) {
        e.preventDefault();
        this.searchInput.focus();
        this.open();
      }

      // Escape to close
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.searchInput.blur();
      }

      // Arrow navigation
      if (this.isOpen) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            this.selectNext();
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.selectPrevious();
            break;
          case 'Enter':
            e.preventDefault();
            this.activateSelected();
            break;
        }
      }
    });
  }

  isTypingInInput(element) {
    return element.tagName === 'INPUT' ||
           element.tagName === 'TEXTAREA' ||
           element.isContentEditable;
  }

  performSearch(query) {
    query = query.trim();

    if (query.length < this.minQueryLength) {
      this.clearResults();
      return;
    }

    const results = this.fuzzySearch(query);
    this.renderResults(results, query);
  }

  fuzzySearch(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    const results = [];

    this.index.forEach(item => {
      const textLower = item.text.toLowerCase();
      let score = 0;

      // Exact match
      if (textLower.includes(queryLower)) {
        score += 10;
        if (textLower.startsWith(queryLower)) score += 5;
      }

      // Word boundary matches
      queryWords.forEach(word => {
        if (textLower.includes(word)) {
          score += 3;
          // Word boundary bonus
          const regex = new RegExp(`\\b${word}`, 'i');
          if (regex.test(item.text)) score += 2;
        }
      });

      // Fuzzy match (character sequence)
      if (this.fuzzyMatch(textLower, queryLower)) {
        score += 2;
      }

      // Apply item weight
      score *= item.weight;

      if (score > 0) {
        results.push({ ...item, score });
      }
    });

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxResults);
  }

  fuzzyMatch(text, pattern) {
    let textIndex = 0;
    let patternIndex = 0;

    while (textIndex < text.length && patternIndex < pattern.length) {
      if (text[textIndex] === pattern[patternIndex]) {
        patternIndex++;
      }
      textIndex++;
    }

    return patternIndex === pattern.length;
  }

  renderResults(results, query) {
    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-no-results">
          No results found for "${this.escapeHtml(query)}"
        </div>
      `;
      return;
    }

    const html = results.map((result, index) => {
      const highlightedText = this.highlightMatch(result.text, query);
      const highlightedContext = result.context
        ? this.highlightMatch(result.context, query)
        : '';

      return `
        <div
          class="search-result-item ${index === 0 ? 'selected' : ''}"
          data-index="${index}"
          data-id="${result.id}"
          role="option"
          aria-selected="${index === 0}"
        >
          <div class="search-result-type">${result.type === 'heading' ? 'Heading' : 'Content'}</div>
          <div class="search-result-text">${highlightedText}</div>
          ${highlightedContext ? `<div class="search-result-context">in ${highlightedContext}</div>` : ''}
        </div>
      `;
    }).join('');

    this.resultsContainer.innerHTML = html;
    this.selectedIndex = 0;
  }

  highlightMatch(text, query) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    let highlighted = this.escapeHtml(text);

    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearResults() {
    this.resultsContainer.innerHTML = '';
    this.selectedIndex = -1;
  }

  selectNext() {
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    this.selectedIndex = (this.selectedIndex + 1) % items.length;
    this.updateSelection(items);
  }

  selectPrevious() {
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
    this.updateSelection(items);
  }

  updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
      item.setAttribute('aria-selected', index === this.selectedIndex);
    });

    // Scroll selected into view
    const selected = items[this.selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  activateSelected() {
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    if (items[this.selectedIndex]) {
      this.navigateToResult(items[this.selectedIndex]);
    }
  }

  navigateToResult(resultItem) {
    const id = resultItem.dataset.id;
    if (id) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.focus({ preventScroll: true });
      }
    }
    this.close();
  }

  open() {
    this.isOpen = true;
    this.resultsContainer.classList.add('visible');
    if (this.overlay) {
      this.overlay.classList.add('visible');
      this.overlay.setAttribute('aria-hidden', 'false');
    }
  }

  close() {
    this.isOpen = false;
    this.resultsContainer.classList.remove('visible');
    if (this.overlay) {
      this.overlay.classList.remove('visible');
      this.overlay.setAttribute('aria-hidden', 'true');
    }
  }

  // Public API: Refresh index when content changes
  refresh() {
    this.index = [];
    this.buildIndex();
  }

  // Public API: Programmatic search
  search(query) {
    this.searchInput.value = query;
    this.performSearch(query);
    this.open();
  }

  // Public API: Destroy
  destroy() {
    clearTimeout(this.debounceTimer);
    this.searchInput?.removeEventListener('input', this.performSearch);
    this.close();
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SearchService());
} else {
  new SearchService();
}

export { SearchService };
export default SearchService;
