/* ============================================
   BPBV — Interactive JavaScript
   i18n, scroll animations, counters, particles,
   navigation, and smooth interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- I18N (centralized translations) ----------
  const SUPPORTED_LANGS = ['uk', 'en', 'de', 'fr'];
  const LANG_LABELS = { uk: 'UA', en: 'EN', de: 'DE', fr: 'FR' };
  const LANG_FLAGS = { uk: '🇺🇦', en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷' };

  const params = new URLSearchParams(window.location.search);
  const paramLang = params.get('lang');
  let lang = paramLang || 'uk';
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'uk';
  localStorage.setItem('bpbv-lang', lang);

  const T = window.BPBV_TRANSLATIONS && window.BPBV_TRANSLATIONS[lang] ? window.BPBV_TRANSLATIONS[lang] : window.BPBV_TRANSLATIONS.uk;

  document.documentElement.lang = lang;
  if (T['meta.title']) document.title = T['meta.title'];
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && T['meta.description']) metaDesc.setAttribute('content', T['meta.description']);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (T[key] !== undefined) el.innerHTML = T[key];
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr');
    const [key, attr] = spec ? spec.split(':') : [];
    if (key && attr && T[key] !== undefined) el.setAttribute(attr, T[key]);
  });

  const navLangWrap = document.getElementById('navLangSwitcher');
  if (navLangWrap && window.BPBV_TRANSLATIONS) {
    const basePath = (window.location.pathname || 'index.html').split('?')[0] || 'index.html';
    navLangWrap.innerHTML = '';

    const currentBtn = document.createElement('button');
    currentBtn.type = 'button';
    currentBtn.className = 'nav__lang-current';
    currentBtn.setAttribute('aria-haspopup', 'listbox');
    currentBtn.setAttribute('aria-expanded', 'false');

    const currentFlagSpan = document.createElement('span');
    currentFlagSpan.className = 'nav__lang-flag';
    currentFlagSpan.textContent = LANG_FLAGS[lang] || LANG_LABELS[lang] || '🌐';
    currentBtn.appendChild(currentFlagSpan);

    navLangWrap.appendChild(currentBtn);

    const list = document.createElement('ul');
    list.className = 'nav__lang-dropdown';
    list.setAttribute('role', 'listbox');

    const LANG_NAMES = {
      uk: 'Українська',
      en: 'English',
      de: 'Deutsch',
      fr: 'Français'
    };

    SUPPORTED_LANGS.forEach(l => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav__lang-option';
      btn.setAttribute('data-lang', l);
      btn.setAttribute('aria-selected', l === lang ? 'true' : 'false');

      const flagSpan = document.createElement('span');
      flagSpan.className = 'nav__lang-flag';
      flagSpan.textContent = LANG_FLAGS[l] || LANG_LABELS[l];

      const textSpan = document.createElement('span');
      textSpan.className = 'nav__lang-name';
      textSpan.textContent = LANG_NAMES[l] || l.toUpperCase();

      btn.appendChild(flagSpan);
      btn.appendChild(textSpan);
      li.appendChild(btn);
      list.appendChild(li);
    });

    navLangWrap.appendChild(list);

    const toggleDropdown = () => {
      const expanded = currentBtn.getAttribute('aria-expanded') === 'true';
      currentBtn.setAttribute('aria-expanded', String(!expanded));
      list.classList.toggle('nav__lang-dropdown--open', !expanded);
    };

    currentBtn.addEventListener('click', toggleDropdown);

    list.addEventListener('click', (e) => {
      const target = e.target.closest('.nav__lang-option');
      if (!target) return;
      const newLang = target.getAttribute('data-lang');
      if (!newLang || !SUPPORTED_LANGS.includes(newLang)) return;
      const href = newLang === 'uk'
        ? basePath
        : basePath + (basePath.includes('?') ? '&' : '?') + 'lang=' + newLang;
      window.location.href = href;
    });

    document.addEventListener('click', (e) => {
      if (!navLangWrap.contains(e.target)) {
        currentBtn.setAttribute('aria-expanded', 'false');
        list.classList.remove('nav__lang-dropdown--open');
      }
    });
  }

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

  // Burger menu (панель під шапкою)
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('open');
    nav.classList.toggle('menu-open', navLinks.classList.contains('open'));
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navLinks.classList.remove('open');
      nav.classList.remove('menu-open');
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

  // Open lightbox on faculty photo click (circular mode)
  document.querySelectorAll('.faculty-card__photo').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.classList.add('lightbox__img--circle');
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  // Close lightbox
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === closeBtn) {
      lightbox.style.display = 'none';
      lightboxImg.classList.remove('lightbox__img--circle');
      document.body.style.overflow = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
      lightboxImg.classList.remove('lightbox__img--circle');
      document.body.style.overflow = '';
    }
  });

  // ---------- HERO PARTICLES ----------
  const particlesContainer = document.getElementById('particles');

  const syncParticleDrift = () => {
    if (!particlesContainer) return;
    const h = particlesContainer.offsetHeight;
    if (!h) return;
    let tag = document.getElementById('particle-drift-dyn');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'particle-drift-dyn';
      document.head.appendChild(tag);
    }
    tag.textContent = `@keyframes particleDrift{0%{opacity:0;transform:translateY(0) scale(.92)}4%{opacity:1;transform:translateY(0) scale(1)}25%{transform:translateY(-${h*.25}px) scale(1.02)}50%{transform:translateY(-${h*.5}px) scale(.98)}75%{transform:translateY(-${h*.75}px) scale(1.01)}100%{opacity:1;transform:translateY(-${h}px) scale(1)}}`;
  };
  syncParticleDrift();
  window.addEventListener('resize', syncParticleDrift);

  const createBubbleEl = (size, borderColor, bgGradient, blurAmount) => {
    const el = document.createElement('div');
    el.classList.add('particle');
    const bw = size < 5 ? 1 : Math.min(2, Math.max(1, Math.round(size / 10)));
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${bgGradient};
      border: ${bw}px solid ${borderColor};
      filter: blur(${blurAmount}px);
      box-shadow: 0 0 ${size * 0.8}px ${borderColor};
    `;
    return el;
  };

  const createParticle = () => {
    const size = Math.random() * 12 + 3;
    const x = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.25 + 0.6;

    const colors = [
      'rgba(247, 241, 212, VAR)',
      'rgba(243, 230, 179, VAR)',
      'rgba(234, 214, 150, VAR)',
      'rgba(255, 248, 225, VAR)',
    ];
    const borderColor = colors[Math.floor(Math.random() * colors.length)].replace('VAR', opacity.toString());
    const innerChampagne = `rgba(243, 230, 179, ${0.12 + Math.random() * 0.1})`;
    const bgGradient = `radial-gradient(circle at 50% 50%, ${innerChampagne}, transparent 85%)`;
    const blurAmount = Math.random() < 0.45 ? 0 : (Math.random() * 2.5 + 1.5);

    // Велика бульбашка (≥ 8px) — у ~60% під нею пливе 5–10 маленьких у одній черзі
    const isLarge = size >= 8;
    const hasTrail = isLarge && Math.random() < 0.6;
    if (hasTrail) {
      const group = document.createElement('div');
      group.className = 'particle-group';
      group.style.cssText = `
        position: absolute;
        left: ${x}%;
        bottom: -10px;
        animation: particleDrift linear infinite;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;

      const main = createBubbleEl(size, borderColor, bgGradient, blurAmount);
      main.style.bottom = '0';
      main.style.left = '50%';
      main.style.transform = 'translateX(-50%)';
      group.appendChild(main);

      const trailCount = Math.floor(Math.random() * 6) + 5; // 5–10
      const minSize = 2;
      const maxTrailSize = Math.max(minSize, size / 3);
      // Відстань від основної до першої — щоб не впиралась; далі більші проміжки між бульбашками
      let bottomOffset = Math.random() * 12 + 14; // 14–26 px від основни до першої

      for (let i = 0; i < trailCount; i++) {
        const t = i / (trailCount - 1 || 1);
        const trailSize = maxTrailSize - (maxTrailSize - minSize) * t;
        bottomOffset += (Math.random() * 14 + 12); // 12–26 px між бульбашками

        const trail = createBubbleEl(trailSize, borderColor, bgGradient, blurAmount);
        trail.style.bottom = `-${bottomOffset}px`;
        trail.style.left = '50%';
        trail.style.transform = 'translateX(-50%)';
        trail.style.position = 'absolute';
        group.appendChild(trail);
      }

      particlesContainer.appendChild(group);
      setTimeout(() => group.remove(), (duration + delay) * 1000);
    } else {
      const particle = createBubbleEl(size, borderColor, bgGradient, blurAmount);
      particle.style.cssText += `
        position: absolute;
        left: ${x}%;
        bottom: -10px;
        animation: particleDrift linear infinite;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;
      particlesContainer.appendChild(particle);
      setTimeout(() => particle.remove(), (duration + delay) * 1000);
    }
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

  // ---------- NEWS SECTION (LOCAL JSON FEED) ----------
  // Frontend читає останні новини з локального файлу news.json.
  // Формат JSON:
  // [{ title: string, message: string, date: string, url: string }]
  const newsList = document.getElementById('newsList');
  const NEWS_API_URL = 'news.json';

  if (newsList) {
    fetch(NEWS_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) return;
        newsList.innerHTML = '';

        items.slice(0, 2).forEach((item) => {
          const card = document.createElement('article');
          card.className = 'news-card';

          const date = document.createElement('div');
          date.className = 'news-card__date';
          date.textContent = item.date || '';

          const title = document.createElement('h3');
          title.className = 'news-card__title';
          title.textContent = item.title || 'Новина кафедри';

          const excerpt = document.createElement('p');
          excerpt.className = 'news-card__excerpt';
          excerpt.textContent = item.message || '';

          const link = document.createElement('a');
          link.className = 'news-card__link';
          link.href = item.url || 'https://www.facebook.com/groups/918669628322290/';
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Читати у Facebook';

          card.appendChild(date);
          card.appendChild(title);
          card.appendChild(excerpt);
          card.appendChild(link);
          newsList.appendChild(card);
        });
      })
      .catch(() => {
        // Keep placeholder; no crash if backend is not configured yet
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

  // ---------- PROGRAM CARDS ACCORDION ----------
  document.querySelectorAll('[data-program-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.program-card');
      card.classList.toggle('active');
    });
  });

  // ---------- FACULTY CARDS ACCORDION ----------
  document.querySelectorAll('[data-faculty-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.faculty-card');
      card.classList.toggle('active');
    });
  });

  // ---------- HISTORY TIMELINE ACCORDION ----------
  document.querySelectorAll('[data-history-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.history__item');
      const wasActive = item.classList.contains('active');

      document.querySelectorAll('.history__item.active').forEach(i => {
        if (i !== item) i.classList.remove('active');
      });

      item.classList.toggle('active', !wasActive);
    });
  });

});
