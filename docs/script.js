/**
 * VPS Specs Slide Presentation
 * Interactive slide navigation with keyboard and touch support
 */

class SlidePresentation {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 10;
    this.isAnimating = false;

    // DOM Elements
    this.slides = document.querySelectorAll('.slide');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.currentSlideEl = document.getElementById('currentSlide');
    this.totalSlidesEl = document.getElementById('totalSlides');
    this.progressFill = document.getElementById('progressFill');
    this.shortcutsHint = document.getElementById('shortcutsHint');

    this.init();
  }

  init() {
    // Update total slides count
    this.totalSlides = this.slides.length;
    this.totalSlidesEl.textContent = this.totalSlides;

    // Event listeners
    this.prevBtn.addEventListener('click', () => this.prevSlide());
    this.nextBtn.addEventListener('click', () => this.nextSlide());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Touch support
    this.setupTouchNavigation();

    // Click to advance (on slide content)
    document.querySelectorAll('.slide-content').forEach((content) => {
      content.addEventListener('click', (e) => {
        if (!e.target.closest('a') && !e.target.closest('button')) {
          this.nextSlide();
        }
      });
    });

    // Show shortcuts hint briefly
    this.showShortcutsHint();

    // Update initial state
    this.updateSlide();

    // Handle hash in URL
    this.handleHashChange();
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  handleKeyboard(e) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        this.nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        this.prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(1);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.totalSlides);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        this.toggleFullscreen();
        break;
    }
  }

  setupTouchNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(touchStartX, touchEndX);
      },
      { passive: true }
    );
  }

  handleSwipe(startX, endX) {
    const threshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  nextSlide() {
    if (this.isAnimating || this.currentSlide >= this.totalSlides) return;
    this.goToSlide(this.currentSlide + 1);
  }

  prevSlide() {
    if (this.isAnimating || this.currentSlide <= 1) return;
    this.goToSlide(this.currentSlide - 1);
  }

  goToSlide(slideNum) {
    if (slideNum < 1 || slideNum > this.totalSlides || slideNum === this.currentSlide) return;

    this.isAnimating = true;
    const direction = slideNum > this.currentSlide ? 'next' : 'prev';

    // Update classes
    this.slides.forEach((slide, index) => {
      const num = index + 1;
      slide.classList.remove('active', 'prev');

      if (num === slideNum) {
        slide.classList.add('active');
      } else if (num < slideNum) {
        slide.classList.add('prev');
      }
    });

    this.currentSlide = slideNum;
    this.updateSlide();

    // Update URL hash
    window.history.replaceState(null, null, `#slide-${slideNum}`);

    // Reset animating flag
    setTimeout(() => {
      this.isAnimating = false;
    }, 500);
  }

  updateSlide() {
    // Update counter
    this.currentSlideEl.textContent = this.currentSlide;

    // Update progress bar
    const progress = (this.currentSlide / this.totalSlides) * 100;
    this.progressFill.style.width = `${progress}%`;

    // Update button states
    this.prevBtn.disabled = this.currentSlide === 1;
    this.nextBtn.disabled = this.currentSlide === this.totalSlides;
  }

  handleHashChange() {
    const hash = window.location.hash;
    const match = hash.match(/^#slide-(\d+)$/);

    if (match) {
      const slideNum = parseInt(match[1], 10);
      if (slideNum >= 1 && slideNum <= this.totalSlides) {
        this.goToSlide(slideNum);
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Fullscreen not available:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  showShortcutsHint() {
    setTimeout(() => {
      this.shortcutsHint.classList.add('visible');
      setTimeout(() => {
        this.shortcutsHint.classList.remove('visible');
      }, 4000);
    }, 2000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SlidePresentation();
});

// Add some entrance animations
document.addEventListener('DOMContentLoaded', () => {
  // Animate elements on first slide
  const titleSlide = document.querySelector('[data-slide="1"]');
  if (titleSlide) {
    const elements = titleSlide.querySelectorAll('.main-title, .subtitle, .tagline, .date-badge');
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(
        () => {
          el.style.transition = 'all 0.6s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        },
        200 + i * 150
      );
    });
  }
});
