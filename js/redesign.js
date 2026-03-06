/**
 * Redesign Enhancements - Interactivity & 3D Effects
 */

import { debounce, throttle } from './config.js';

export class RedesignUI {
  constructor() {
    this.tiltElements = document.querySelectorAll('[data-tilt]');
    this.parallaxElements = document.querySelectorAll('[data-parallax]');
    this.init();
  }

  init() {
    this.setupTiltEffect();
    this.setupParallax();
    this.setupGlowFollow();
  }

  /**
   * Interactive 3D Tilt Effect for cards
   */
  setupTiltEffect() {
    this.tiltElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        
        // Update mouse position for glow effect if present
        el.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        el.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) translateZ(0)`;
      });
    });
  }

  /**
   * Subtle Parallax for background elements
   */
  setupParallax() {
    const handleScroll = throttle(() => {
      const scrolled = window.scrollY;
      this.parallaxElements.forEach(el => {
        const speed = el.dataset.parallaxSpeed || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    }, 10);

    window.addEventListener('scroll', handleScroll);
  }

  /**
   * Ambient glow sphere following mouse in hero
   */
  setupGlowFollow() {
    const hero = document.querySelector('.hero--redesign');
    const glow = document.querySelector('.hero__glow-sphere');
    
    if (!hero || !glow) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      glow.style.left = `${x - 300}px`;
      glow.style.top = `${y - 300}px`;
    });
  }
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
  window.redesign = new RedesignUI();
});
