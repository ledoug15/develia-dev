/* =========================================================================
   Develia — scripts du site
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- Navigation ---------- */
  const header = document.getElementById('header');
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');

  const closeNav = () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
  };

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Lien actif selon la section visible ---------- */
  const links    = [...document.querySelectorAll('.nav__link')];
  const sections = links
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(l =>
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id)
        );
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Apparition au scroll ---------- */
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('is-visible'), i * 70);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Comparateurs avant / après ---------- */
  document.querySelectorAll('[data-ba]').forEach(initBeforeAfter);

  function initBeforeAfter(figure) {
    const handle = figure.querySelector('[data-ba-handle]');
    let pos = 50;

    const setPos = value => {
      pos = Math.min(100, Math.max(0, value));
      figure.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', Math.round(pos));
    };

    const fromEvent = event => {
      const rect = figure.getBoundingClientRect();
      const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
      setPos((x / rect.width) * 100);
    };

    /* Pointer / souris / tactile */
    const start = event => {
      figure.classList.add('is-dragging');
      fromEvent(event);
      if (event.cancelable && event.type === 'touchstart') event.preventDefault();
    };
    const move = event => {
      if (!figure.classList.contains('is-dragging')) return;
      fromEvent(event);
      if (event.cancelable && event.type === 'touchmove') event.preventDefault();
    };
    const stop = () => figure.classList.remove('is-dragging');

    figure.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);

    figure.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', stop);

    /* Survol : le curseur suit la souris */
    figure.addEventListener('mousemove', event => {
      if (figure.classList.contains('is-dragging')) return;
      fromEvent(event);
    });
    figure.addEventListener('mouseleave', () => { if (!figure.classList.contains('is-dragging')) setPos(50); });

    /* Clavier */
    handle.addEventListener('keydown', event => {
      const step = event.shiftKey ? 10 : 2;
      if (event.key === 'ArrowLeft')       setPos(pos - step);
      else if (event.key === 'ArrowRight') setPos(pos + step);
      else if (event.key === 'Home')       setPos(0);
      else if (event.key === 'End')        setPos(100);
      else return;
      event.preventDefault();
    });
    handle.addEventListener('click', e => e.preventDefault());

    setPos(50);
  }

  /* ---------- Vidéo YouTube (chargée au clic) ---------- */
  document.querySelectorAll('.yt').forEach(box => {
    const btn = box.querySelector('.yt__play');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const id = box.dataset.yt;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = box.dataset.ytTitle || 'Vidéo Develia';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  });

  /* ---------- Formulaire Formspree (envoi AJAX) ---------- */
  const form   = document.getElementById('form-devis');
  const status = document.getElementById('form-status');

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      const label  = button.innerHTML;
      button.disabled = true;
      button.textContent = 'Envoi en cours…';
      status.className = 'form__status';
      status.textContent = '';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (response.ok) {
          form.reset();
          status.className = 'form__status is-ok';
          status.textContent = 'Merci, votre demande a bien été envoyée. Nous vous recontactons sous 24 à 48 h ouvrées.';
        } else {
          const data = await response.json().catch(() => ({}));
          status.className = 'form__status is-error';
          status.textContent = (data.errors && data.errors.map(e => e.message).join(', '))
            || "L'envoi a échoué. Merci de réessayer ou de nous appeler au 01 89 70 68 60 .";
        }
      } catch (err) {
        status.className = 'form__status is-error';
        status.textContent = "Connexion impossible. Merci de réessayer ou de nous écrire à contact@develia.fr.";
      } finally {
        button.disabled = false;
        button.innerHTML = label;
      }
    });
  }

  /* ---------- Année courante ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
