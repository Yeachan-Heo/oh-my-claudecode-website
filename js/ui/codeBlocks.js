/**
 * CodeBlocks - Syntax highlighting and copy buttons for code blocks
 * Auto-detects language, adds copy functionality with feedback
 */

class CodeBlocks {
  constructor(options = {}) {
    this.selector = options.selector || 'pre code';
    this.copyButtonClass = options.copyButtonClass || 'copy-btn';
    this.copiedClass = options.copiedClass || 'copied';
    this.lineNumbers = options.lineNumbers !== false;
    this.lineNumberClass = options.lineNumberClass || 'line-number';
    this.showLang = options.showLang !== false;
    this.langClass = options.langClass || 'code-lang';

    this.languages = {
      'language-js': 'JavaScript',
      'language-javascript': 'JavaScript',
      'language-ts': 'TypeScript',
      'language-typescript': 'TypeScript',
      'language-py': 'Python',
      'language-python': 'Python',
      'language-html': 'HTML',
      'language-css': 'CSS',
      'language-scss': 'SCSS',
      'language-bash': 'Bash',
      'language-sh': 'Shell',
      'language-shell': 'Shell',
      'language-json': 'JSON',
      'language-yaml': 'YAML',
      'language-yml': 'YAML',
      'language-md': 'Markdown',
      'language-markdown': 'Markdown',
      'language-sql': 'SQL',
      'language-go': 'Go',
      'language-rust': 'Rust',
      'language-java': 'Java',
      'language-c': 'C',
      'language-cpp': 'C++',
      'language-csharp': 'C#',
      'language-php': 'PHP',
      'language-ruby': 'Ruby',
      'language-rb': 'Ruby',
      'language-swift': 'Swift',
      'language-kotlin': 'Kotlin',
      'language-dockerfile': 'Dockerfile',
      'language-docker': 'Docker',
      'language-nginx': 'Nginx',
      'language-xml': 'XML',
      'language-svg': 'SVG',
      'language-regex': 'Regex',
      'language-diff': 'Diff',
      'language-plaintext': 'Text',
      'language-text': 'Text'
    };

    this.init();
  }

  init() {
    const codeBlocks = document.querySelectorAll(this.selector);
    codeBlocks.forEach(block => this.enhance(block));
  }

  enhance(codeElement) {
    const pre = codeElement.parentElement;
    if (!pre || pre.tagName !== 'PRE') return;

    // Skip if already enhanced
    if (pre.classList.contains('code-enhanced')) return;
    pre.classList.add('code-enhanced');

    // Detect language
    const lang = this.detectLanguage(codeElement);

    // Check if already wrapped (e.g. manually in HTML)
    const existingWrapper = pre.parentElement?.classList.contains('code-block-wrapper')
      ? pre.parentElement
      : null;

    let wrapper;
    if (existingWrapper) {
      wrapper = existingWrapper;

      // Add copy button to existing header if present
      const existingHeader = wrapper.querySelector('.code-block-header');
      if (existingHeader) {
        const copyBtn = this.createCopyButton(codeElement);
        existingHeader.appendChild(copyBtn);
      }
    } else {
      // Wrap in container
      wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Add header with language and copy button
      const header = document.createElement('div');
      header.className = 'code-block-header';

      // Language label
      if (this.showLang && lang) {
        const langLabel = document.createElement('span');
        langLabel.className = this.langClass;
        langLabel.textContent = lang;
        langLabel.setAttribute('aria-label', `Language: ${lang}`);
        header.appendChild(langLabel);
      }

      // Copy button
      const copyBtn = this.createCopyButton(codeElement);
      header.appendChild(copyBtn);

      wrapper.insertBefore(header, pre);
    }

    // Add line numbers if enabled
    if (this.lineNumbers) {
      this.addLineNumbers(codeElement);
    }

    // Make code focusable for keyboard navigation
    codeElement.setAttribute('tabindex', '0');
    codeElement.setAttribute('role', 'region');
    codeElement.setAttribute('aria-label', `${lang || 'Code'} block`);
  }

  detectLanguage(codeElement) {
    const classes = codeElement.className.split(' ');
    for (const cls of classes) {
      if (this.languages[cls]) {
        return this.languages[cls];
      }
    }
    return null;
  }

  createCopyButton(codeElement) {
    const button = document.createElement('button');
    button.className = this.copyButtonClass;
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.innerHTML = this.getCopyIcon();

    button.addEventListener('click', async () => {
      const code = codeElement.textContent;
      await this.copyToClipboard(code, button);
    });

    // Keyboard shortcut: Ctrl/Cmd + C when focused
    codeElement.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !window.getSelection().toString()) {
        e.preventDefault();
        button.click();
      }
    });

    return button;
  }

  getCopyIcon() {
    return `
      <svg class="icon-copy" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg class="icon-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }

  async copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopiedFeedback(button);
    } catch (err) {
      // Fallback for older browsers
      this.fallbackCopy(text, button);
    }
  }

  fallbackCopy(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    if (selected) {
      selection.removeAllRanges();
      selection.addRange(selected);
    }

    this.showCopiedFeedback(button);
  }

  showCopiedFeedback(button) {
    const originalText = button.getAttribute('aria-label');
    const iconCopy = button.querySelector('.icon-copy');
    const iconCheck = button.querySelector('.icon-check');

    button.classList.add(this.copiedClass);
    button.setAttribute('aria-label', 'Copied!');

    if (iconCopy) iconCopy.style.display = 'none';
    if (iconCheck) iconCheck.style.display = 'block';

    // Reset after delay
    setTimeout(() => {
      button.classList.remove(this.copiedClass);
      button.setAttribute('aria-label', originalText);

      if (iconCopy) iconCopy.style.display = 'block';
      if (iconCheck) iconCheck.style.display = 'none';
    }, 2000);
  }

  addLineNumbers(codeElement) {
    const lines = codeElement.textContent.split('\n');
    // Remove empty last line (common in code blocks)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    const lineCount = lines.length;
    if (lineCount < 2) return; // Don't add numbers for single line

    // Create line numbers container
    const lineNumbersEl = document.createElement('span');
    lineNumbersEl.className = 'line-numbers';
    lineNumbersEl.setAttribute('aria-hidden', 'true');

    const digits = String(lineCount).length;
    lineNumbersEl.style.minWidth = `${digits + 1}ch`;

    // Generate line numbers
    let numbersHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      numbersHtml += `<span class="${this.lineNumberClass}">${i}</span>\n`;
    }
    lineNumbersEl.innerHTML = numbersHtml.trim();

    // Wrap code in table-like structure
    const wrapper = document.createElement('div');
    wrapper.className = 'code-with-line-numbers';

    const pre = codeElement.parentElement;
    wrapper.appendChild(lineNumbersEl);
    wrapper.appendChild(codeElement);

    pre.appendChild(wrapper);
  }

  // Public API: Enhance new code blocks added dynamically
  refresh() {
    const codeBlocks = document.querySelectorAll(this.selector);
    codeBlocks.forEach(block => this.enhance(block));
  }

  // Public API: Add custom language mapping
  addLanguage(className, displayName) {
    this.languages[className] = displayName;
  }

  // Public API: Destroy
  destroy() {
    document.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
      const pre = wrapper.querySelector('pre');
      if (pre) {
        wrapper.parentNode.insertBefore(pre, wrapper);
      }
      wrapper.remove();
    });
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CodeBlocks());
} else {
  new CodeBlocks();
}

export { CodeBlocks };
export default CodeBlocks;
