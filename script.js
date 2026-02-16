/* ============================================
   BPBV — Interactive JavaScript
   Scroll animations, counters, particles,
   navigation, and smooth interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- NAVIGATION ----------
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  // Scroll effect for nav
  const handleNavScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // Burger menu
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active nav link highlighting
  const sections = document.querySelectorAll('section[id]');
  const navItems = navLinks.querySelectorAll('a[href^="#"]');

  const highlightNav = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navItems.forEach(a => a.classList.remove('active'));
        const active = navLinks.querySelector(`a[href="#${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });

  // ---------- REVEAL ON SCROLL (Intersection Observer) ----------
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ---------- COUNTER ANIMATION ----------
  const counters = document.querySelectorAll('[data-count]');

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 2000;
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = Math.floor(easedProgress * target);

      el.textContent = current.toLocaleString('uk-UA');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString('uk-UA');
      }
    };

    requestAnimationFrame(update);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));

  // Also animate .pub-stat__number elements
  const pubCounters = document.querySelectorAll('.pub-stat__number[data-count]');
  pubCounters.forEach(c => counterObserver.observe(c));

  // ---------- LIGHTBOX FOR GALLERY & TIMELINE IMAGES ----------
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Закрити">&times;</button>
    <img class="lightbox__img" src="" alt="" />
  `;
  lightbox.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(26, 17, 24, 0.95);
    backdrop-filter: blur(20px);
    display: none; align-items: center; justify-content: center;
    cursor: pointer;
  `;
  const closeBtn = lightbox.querySelector('.lightbox__close');
  closeBtn.style.cssText = `
    position: absolute; top: 20px; right: 24px;
    background: none; border: none; color: #fff;
    font-size: 2.5rem; cursor: pointer; z-index: 10001;
    font-family: 'Cinzel', serif; line-height: 1;
  `;
  const lightboxImg = lightbox.querySelector('.lightbox__img');
  lightboxImg.style.cssText = `
    max-width: 90vw; max-height: 85vh; object-fit: contain;
    border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(lightbox);

  // Open lightbox on gallery/timeline image click
  document.querySelectorAll('.gallery__item img, .timeline-gallery img, .photo-mosaic__item img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  // Close lightbox
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === closeBtn) {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  // ---------- HERO PARTICLES ----------
  const particlesContainer = document.getElementById('particles');

  const createParticle = () => {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const duration = Math.random() * 12 + 8;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.4 + 0.1;

    // Wine/gold color palette for particles
    const colors = [
      'rgba(201, 169, 78, VAR)',  // gold
      'rgba(163, 68, 112, VAR)',  // wine-light
      'rgba(229, 202, 110, VAR)', // gold-light
      'rgba(91, 26, 58, VAR)',    // burgundy
    ];
    const color = colors[Math.floor(Math.random() * colors.length)].replace('VAR', opacity.toString());

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      bottom: -10px;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      box-shadow: 0 0 ${size * 2}px ${color};
    `;

    particlesContainer.appendChild(particle);

    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, (duration + delay) * 1000);
  };

  // Create initial batch
  for (let i = 0; i < 25; i++) {
    createParticle();
  }

  // Keep creating particles
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      createParticle();
    }
  }, 800);

  // ---------- SMOOTH ANCHOR SCROLLING ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top,
          behavior: 'smooth'
        });
      }
    });
  });

  // ---------- PARALLAX-LIKE EFFECT ON HERO ----------
  const heroContent = document.querySelector('.hero__content');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = document.querySelector('.hero').offsetHeight;

    if (scrollY < heroHeight) {
      const progress = scrollY / heroHeight;
      heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
      heroContent.style.opacity = 1 - progress * 1.2;
    }
  }, { passive: true });

  // ---------- MAGNETIC HOVER ON BUTTONS ----------
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ---------- TILT EFFECT ON CARDS ----------
  const tiltCards = document.querySelectorAll('.program-card, .science-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.transform = `
        perspective(1000px)
        rotateX(${y * -5}deg)
        rotateY(${x * 5}deg)
        translateY(-4px)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ---------- TYPING EFFECT ON HERO BADGE ----------
  const badge = document.querySelector('.hero__badge');
  if (badge) {
    const text = badge.textContent;
    badge.textContent = '';
    badge.style.opacity = '1';
    badge.style.transform = 'none';

    let i = 0;
    const typeInterval = setInterval(() => {
      badge.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(typeInterval);
    }, 40);
  }

  // ---------- CURSOR GLOW (desktop only) ----------
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(201, 169, 78, 0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.15s ease;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(glow);

    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX - 150 + 'px';
      glow.style.top = e.clientY - 150 + 'px';
    });
  }

  // ---------- SCIENTIFIC CLUBS ACCORDION ----------
  document.querySelectorAll('[data-club-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.club-card');
      const wasActive = card.classList.contains('active');
      
      // Close all other clubs
      document.querySelectorAll('.club-card.active').forEach(c => {
        if (c !== card) c.classList.remove('active');
      });
      
      // Toggle current
      card.classList.toggle('active', !wasActive);
    });
  });

  // Open first club by default
  const firstClub = document.querySelector('.club-card');
  if (firstClub) firstClub.classList.add('active');

});
