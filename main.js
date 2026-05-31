/* ════════════════════════════════════════════════════════════
   FEROX — JavaScript
   Animations · Interactions · Parallax · Counter · Particles
════════════════════════════════════════════════════════════ */

'use strict';

// ── DYNAMIC LOGO CROP & BACKGROUND REMOVAL ────────────────────
(function processLogos() {
  const logoImgs = document.querySelectorAll('.loader-crest-logo, .nav-crest-logo');
  if (!logoImgs.length) return;
  
  const originalSrc = 'assets/logo.jpg';
  const img = new Image();
  img.src = originalSrc;
  img.onload = () => {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0);
      
      const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;
      const width = tempCanvas.width;
      const height = tempCanvas.height;
      
      // Find bounding box of the crest (non-black pixels)
      let minX = width, maxX = 0, minY = height, maxY = 0;
      const threshold = 90; // Pixels brighter than this are part of the crest
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];
          const maxVal = Math.max(r, g, b);
          
          if (maxVal >= threshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      // Add a small padding to prevent clipping edges
      const padding = 8;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width - 1, maxX + padding);
      maxY = Math.min(height - 1, maxY + padding);
      
      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;
      
      if (croppedWidth <= 0 || croppedHeight <= 0) {
        throw new Error("Invalid bounding box");
      }
      
      // Create final canvas for the cropped, transparent logo
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = croppedWidth;
      finalCanvas.height = croppedHeight;
      const finalCtx = finalCanvas.getContext('2d');
      
      // Get the image data for the cropped region
      const croppedData = tempCtx.getImageData(minX, minY, croppedWidth, croppedHeight);
      const cData = croppedData.data;
      
      // Apply chroma key / background removal with smooth transition on the cropped region
      for (let i = 0; i < cData.length; i += 4) {
        const r = cData[i];
        const g = cData[i+1];
        const b = cData[i+2];
        const maxVal = Math.max(r, g, b);
        
        if (maxVal < 65) {
          cData[i+3] = 0; // Fully transparent
        } else if (maxVal < 105) {
          // Smooth alpha transition
          const factor = (maxVal - 65) / 40;
          cData[i+3] = Math.round(factor * 255);
        }
      }
      
      finalCtx.putImageData(croppedData, 0, 0);
      const transparentDataUrl = finalCanvas.toDataURL('image/png');
      
      console.log(`Logo processed successfully. Crop box: [${minX}, ${minY}] to [${maxX}, ${maxY}], Size: ${croppedWidth}x${croppedHeight}`);
      
      logoImgs.forEach(el => {
        el.src = transparentDataUrl;
      });
    } catch (err) {
      console.warn("Could not dynamically crop and remove logo background: ", err);
    }
  };
})();

// ── LOADING SCREEN ─────────────────────────────────────────────
(function initLoader() {
  document.body.classList.add('loading');
  const fill    = document.getElementById('loaderBarFill');
  const percent = document.getElementById('loaderPercent');
  const loader  = document.getElementById('loader');
  let pct = 0;

  const steps = [
    { target: 30,  delay: 100 },
    { target: 60,  delay: 300 },
    { target: 85,  delay: 500 },
    { target: 100, delay: 800 },
  ];

  let stepIndex = 0;
  function runStep() {
    if (stepIndex >= steps.length) return;
    const { target, delay } = steps[stepIndex++];
    const start = pct;
    const duration = delay;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      pct = start + (target - start) * eased;
      fill.style.width = pct + '%';
      percent.textContent = Math.round(pct) + '%';
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(runStep, 80);
    }
    requestAnimationFrame(tick);
  }
  setTimeout(runStep, 200);

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
      initSite();
    }, 1800);
  });
})();

// ── SITE INIT (runs after loader) ─────────────────────────────
function initSite() {
  initSmoothScroll();
  initCursor();
  initNav();
  initParticles();
  initScrollReveal();
  initParallax();
  initCounters();
  initTelemetryConsole();
  initSpeedLines();
  initGalleryLightbox();
  initReserveForm();
  initNewsletterForm();
}

// ── CUSTOM CURSOR ──────────────────────────────────────────────
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  // Hover states
  const hoverEls = document.querySelectorAll(
    'a, button, .bento-item, .future-model-card, .telemetry-spec-card, .telemetry-hotspot, .bp-callout, .interior-feature, #telemetryCarImg'
  );
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ── NAVIGATION ─────────────────────────────────────────────────
function initNav() {
  const nav         = document.getElementById('mainNav');
  const menuTrigger = document.getElementById('navMenuTrigger');
  const hamburger   = document.getElementById('navHamburger');
  const mobileNav   = document.getElementById('mobileNav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  if (menuTrigger) {
    menuTrigger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });
}

// ── PARTICLES CANVAS ───────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const PARTICLE_COUNT = 80;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle());

  function createParticle(x, y) {
    return {
      x: x !== undefined ? x : Math.random() * canvas.width,
      y: y !== undefined ? y : Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.35 + 0.05,
      color: '#ffffff',
    };
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw subtle connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.04 * (1 - dist / 90)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ── SCROLL REVEAL ──────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal-on-scroll, .reveal-text, .statement-text');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Animate stat bars
        const bars = entry.target.querySelectorAll('.perf-stat-bar-fill');
        bars.forEach(b => b.parentElement.parentElement.classList.add('visible'));
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => obs.observe(el));

  // Also observe perf cards for bar animation
  document.querySelectorAll('.perf-stat-card').forEach(card => obs.observe(card));
}

// ── PARALLAX ───────────────────────────────────────────────────
function initParallax() {
  const heroBgImg   = document.getElementById('heroBgImg');
  const interiorImg = document.getElementById('interiorBgImg');
  const stripImg    = document.getElementById('stripImg');

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        if (heroBgImg) {
          heroBgImg.style.transform = `scale(1.05) translateY(${sy * 0.2}px)`;
        }
        if (interiorImg) {
          const rect = interiorImg.closest('.interior-section').getBoundingClientRect();
          const offset = (rect.top / window.innerHeight) * 40;
          interiorImg.style.transform = `scale(1.08) translateY(${offset}px)`;
        }
        if (stripImg) {
          const rect = stripImg.closest('.cinematic-strip').getBoundingClientRect();
          const offset = (rect.top / window.innerHeight) * 60;
          stripImg.style.transform = `translateY(${offset * 0.4}px) scale(1.1)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ── SMOOTH SCROLL (LENIS) ──────────────────────────────────────
let lenis;
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo easing
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1.0,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

// ── ANIMATED COUNTERS ──────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.counter-value[data-target]');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el        = entry.target;
      const target    = parseFloat(el.dataset.target);
      const suffix    = el.dataset.suffix || '';
      const isDecimal = !Number.isInteger(target);
      const duration  = 1800; // Sporty fast transition
      const start     = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4); // Quartic ease out
        const val = target * eased;
        
        // Motion blur calculation: higher velocity at start, fading out
        const velocity = 1 - t; // 1 to 0
        const blurAmount = velocity * 12; // Max 12px blur
        const stretchAmount = 1 + velocity * 0.18; // Stretch scale
        
        el.style.filter = `blur(${blurAmount}px)`;
        el.style.transform = `scaleY(${stretchAmount}) translateY(${-velocity * 4}px)`;
        el.style.transformOrigin = 'bottom';
        
        el.textContent = (isDecimal ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
        
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          // Reset styles to clean static focus
          el.style.filter = '';
          el.style.transform = '';
          el.textContent = (isDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
          
          // Trigger a subtle light sweep highlight on the card
          const card = el.closest('.telemetry-spec-card');
          if (card) {
            const sweep = card.querySelector('.spec-card-sweep');
            if (sweep) {
              sweep.style.animation = 'none';
              void sweep.offsetWidth; // force reflow
              sweep.style.animation = 'sweepSheen 1.2s var(--ease-out-expo) forwards';
            }
          }
        }
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.15 });

  counters.forEach(el => obs.observe(el));
}

// ── TELEMETRY CONSOLE SPEC CARD HOVER ACTION ──────────────────
function initTelemetryConsole() {
  const cards = document.querySelectorAll('.telemetry-spec-card');
  const hotspots = document.querySelectorAll('.telemetry-hotspot');
  const telemetryCarImg = document.getElementById('telemetryCarImg');
  
  if (!cards.length) return;

  function activateSpec(specId) {
    cards.forEach(card => {
      if (card.dataset.spec === specId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    hotspots.forEach(hot => {
      if (hot.dataset.spec === specId) {
        hot.classList.add('active');
      } else {
        hot.classList.remove('active');
      }
    });

    // Swap car image based on active spec
    if (telemetryCarImg) {
      if (specId === '5' || specId === '7') {
        telemetryCarImg.src = 'assets/car_crimson_rear.jpg';
      } else {
        telemetryCarImg.src = 'assets/car_crimson_front.jpg';
      }
    }
  }

  function clearActive() {
    cards.forEach(card => card.classList.remove('active'));
    hotspots.forEach(hot => hot.classList.remove('active'));
    if (telemetryCarImg) {
      telemetryCarImg.src = 'assets/car_crimson_front.jpg';
    }
  }

  // Bind hover actions
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      activateSpec(card.dataset.spec);
    });
    card.addEventListener('mouseleave', clearActive);
  });

  // Handle hover and toggle-on-tap for mobile devices
  hotspots.forEach(hot => {
    hot.addEventListener('mouseenter', () => {
      activateSpec(hot.dataset.spec);
    });
    hot.addEventListener('mouseleave', clearActive);

    // Support toggle tap behavior on touch devices
    hot.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = hot.classList.contains('active');
      if (isActive) {
        clearActive();
      } else {
        activateSpec(hot.dataset.spec);
      }
    });
  });

  // Clear active telemetry states when clicking elsewhere
  document.addEventListener('click', () => {
    clearActive();
  });
}

// ── SPEED LINES CANVAS ANIMATION ──────────────────────────────
function initSpeedLines() {
  const canvases = document.querySelectorAll('.speed-lines-canvas');
  if (!canvases.length) return;

  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const card = canvas.closest('.telemetry-spec-card');
    if (!card) return;

    let width = (canvas.width = card.offsetWidth);
    let height = (canvas.height = card.offsetHeight);
    
    window.addEventListener('resize', () => {
      width = canvas.width = card.offsetWidth;
      height = canvas.height = card.offsetHeight;
    }, { passive: true });

    let lines = [];
    const maxLines = 12;

    function createLine() {
      return {
        x: -Math.random() * 80,
        y: Math.random() * height,
        length: Math.random() * 50 + 15,
        speed: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.3 + 0.05,
      };
    }

    // Populate initial lines
    for (let i = 0; i < maxLines; i++) {
      lines.push(createLine());
      lines[i].x = Math.random() * width;
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      const isActive = card.classList.contains('active');
      const speedMultiplier = isActive ? 3.5 : 1.0;
      const density = isActive ? maxLines : 4;

      if (lines.length < density) {
        lines.push(createLine());
      } else if (lines.length > density) {
        lines.pop();
      }

      lines.forEach((line, index) => {
        line.x += line.speed * speedMultiplier;
        if (line.x > width) {
          lines[index] = createLine();
        }

        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.length, line.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    }
    animate();
  });
}

// ── GALLERY LIGHTBOX ───────────────────────────────────────────
function initGalleryLightbox() {
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lightboxImg');
  const lbClose   = document.getElementById('lightboxClose');
  const bentoItems = document.querySelectorAll('.bento-item[data-lightbox]');

  bentoItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.lightbox;
      lbImg.src = src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const telemetryCar = document.getElementById('telemetryCarImg');
  if (telemetryCar) {
    telemetryCar.addEventListener('click', () => {
      lbImg.src = telemetryCar.src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 400);
  }

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// ── RESERVATION FORM ───────────────────────────────────────────
function handleReserve(e) {
  e.preventDefault();
  const form    = document.getElementById('reserveForm');
  const success = document.getElementById('reserveSuccess');
  const btn     = document.getElementById('reserveBtn');
  
  const fullName = document.getElementById('fullName').value;
  const emailAddress = document.getElementById('emailAddress').value;
  const country = document.getElementById('country').value;

  btn.disabled = true;
  const btnText = btn.querySelector('.reserve-btn-text');
  const originalText = btnText.textContent;
  btnText.textContent = 'Processing...';

  fetch('/api/reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fullName, emailAddress, country })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      form.style.display = 'none';
      success.classList.add('visible');
    } else {
      alert("Error submitting reservation: " + (data.error || "Please try again."));
      btn.disabled = false;
      btnText.textContent = originalText;
    }
  })
  .catch(err => {
    console.error("Submission error:", err);
    alert("Network error: Could not reach reservation server.");
    btn.disabled = false;
    btnText.textContent = originalText;
  });

  return false;
}

// ── NEWSLETTER FORM ────────────────────────────────────────────
function handleNewsletter(e) {
  e.preventDefault();
  const btn = document.getElementById('newsletterBtn');
  const input = document.getElementById('newsletterEmail');
  btn.textContent = '✓';
  btn.style.background = '#1a6b2a';
  input.value = '';
  input.placeholder = 'Subscribed!';
  return false;
}

// ── HUD COUNTER ANIMATION ──────────────────────────────────────
(function animateHUD() {
  const hudVals = [
    { el: '.hud-el-1 span', min: 0,    max: 470,   unit: ' KM/H', speed: 80 },
    { el: '.hud-el-2 span', min: 1000, max: 11000, unit: '',      speed: 150 },
    { el: '.hud-el-3 span', min: 0.0,  max: 2.8,   unit: 'G',     speed: 70 },
  ];

  hudVals.forEach(hv => {
    const el = document.querySelector(hv.el);
    if (!el) return;

    let current = hv.min;
    let direction = 1;

    setInterval(() => {
      current += direction * (hv.max - hv.min) * 0.03;
      if (current >= hv.max) direction = -1;
      if (current <= hv.min) direction = 1;
      const disp = typeof hv.min === 'number' && hv.min % 1 !== 0 || hv.max % 1 !== 0
        ? current.toFixed(1)
        : Math.round(current).toLocaleString();
      el.textContent = disp + hv.unit;
    }, hv.speed);
  });
})();

// ── SMOOTH ANCHOR SCROLL ───────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navH = 80;
    if (lenis) {
      lenis.scrollTo(target, { offset: -navH });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── HERO LIGHT SWEEP AUTO-REPEAT ──────────────────────────────
// Handled entirely via CSS animation.

// ── MOUSE TRAIL ON HERO ────────────────────────────────────────
(function initHeroMouseLight() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty('--mx', x + '%');
    hero.style.setProperty('--my', y + '%');
  });
})();

// ── SCROLL PROGRESS INDICATOR ──────────────────────────────────
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 1px;
    background: linear-gradient(90deg, #555, #aaa, #fff);
    width: 0%;
    z-index: 9999;
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(255,255,255,0.25);
    pointer-events: none;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrolled / total * 100) + '%';
  }, { passive: true });
})();

// ── STATS BAR FILL ON SCROLL ───────────────────────────────────
(function initStatBars() {
  const bars = document.querySelectorAll('.perf-stat-bar-fill');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.style.getPropertyValue('--w') || getComputedStyle(e.target).getPropertyValue('--w');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => obs.observe(b));
})();

// ── FUTURE MODELS — REVEAL ON HOVER ───────────────────────────
document.querySelectorAll('.future-model-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.querySelector('.future-card-desc').style.transitionDelay = '0s';
  });
});

// ── ENGINEERING SECTION — ACTIVE ON SCROLL ─────────────────────
(function initBlueprintReveal() {
  const section = document.querySelector('.engineering-section');
  if (!section) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        section.classList.add('active');
        obs.unobserve(section);
      }
    });
  }, { threshold: 0.2 });
  obs.observe(section);
})();

// ── NAV ACTIVE STATE ON SCROLL ─────────────────────────────────
(function initNavActive() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + id
          ? 'var(--white)' : '';
      });
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
})();



console.log('%cFEROX SV — BORN UNCONQUERED', 'font-size:18px;font-weight:bold;color:#ffffff;background:#111;padding:12px 24px;');
console.log('%cV16 · 8.3L · 1250+ HP · 470 KM/H · EXTREME AERO PACKAGE', 'font-size:12px;color:#888;background:#111;padding:4px 24px;');
