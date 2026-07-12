/* Valor Rock — vanilla JS: reveals, nav state, parallax, accordion, form */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Scroll reveals (12px rise + fade, 80ms stagger) ---------- */

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  // Stagger siblings within a reveal group
  document.querySelectorAll('.reveal-group').forEach(function (group) {
    Array.prototype.forEach.call(group.querySelectorAll('.reveal'), function (el, i) {
      el.style.setProperty('--reveal-delay', (i * 80) + 'ms');
    });
  });

  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Nav active-section state ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sectionsById = {};
  navLinks.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    var section = document.getElementById(id);
    if (section) sectionsById[id] = section;
  });

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(sectionsById).forEach(function (id) {
      navObserver.observe(sectionsById[id]);
    });
  }

  /* ---------- Hero contour parallax (two speeds, max 30px) ---------- */

  var slowLayer = document.querySelector('.contour-slow');
  var fastLayer = document.querySelector('.contour-fast');
  var parallaxTicking = false;

  function applyParallax() {
    parallaxTicking = false;
    var y = window.scrollY || window.pageYOffset;
    var slow = Math.min(y * 0.03, 15);
    var fast = Math.min(y * 0.06, 30);
    if (slowLayer) slowLayer.style.transform = 'translateY(' + slow + 'px)';
    if (fastLayer) fastLayer.style.transform = 'translateY(' + fast + 'px)';
  }

  if (slowLayer && fastLayer && !prefersReducedMotion.matches) {
    window.addEventListener('scroll', function () {
      if (!parallaxTicking) {
        parallaxTicking = true;
        window.requestAnimationFrame(applyParallax);
      }
    }, { passive: true });
  }

  /* ---------- FAQ accordion ---------- */

  document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
    var panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        panel.classList.remove('open');
        var onEnd = function (e) {
          if (e.propertyName === 'grid-template-rows') {
            panel.hidden = true;
            panel.removeEventListener('transitionend', onEnd);
          }
        };
        if (prefersReducedMotion.matches) {
          panel.hidden = true;
        } else {
          panel.addEventListener('transitionend', onEnd);
        }
      } else {
        panel.hidden = false;
        // Force a frame so the grid-rows transition runs from 0fr
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            panel.classList.add('open');
          });
        });
      }
    });
  });

  /* ---------- Reserve form (front-end validation only) ---------- */
  /* TODO: wire to Formspree or backend before launch */

  var form = document.getElementById('reserve-form');
  var successCard = document.getElementById('reserve-success');

  function setFieldError(input, errorEl, hasError) {
    var field = input.closest('.form-field');
    if (field) field.classList.toggle('invalid', hasError);
    if (errorEl) errorEl.hidden = !hasError;
    input.setAttribute('aria-invalid', String(hasError));
  }

  if (form && successCard) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var nameInput = document.getElementById('field-name');
      var emailInput = document.getElementById('field-email');
      var ackInput = document.getElementById('field-ack');

      var nameValid = nameInput.value.trim().length > 0;
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
      var ackValid = ackInput.checked;

      setFieldError(nameInput, document.getElementById('error-name'), !nameValid);
      setFieldError(emailInput, document.getElementById('error-email'), !emailValid);
      setFieldError(ackInput, document.getElementById('error-ack'), !ackValid);

      if (!nameValid) { nameInput.focus(); return; }
      if (!emailValid) { emailInput.focus(); return; }
      if (!ackValid) { ackInput.focus(); return; }

      form.hidden = true;
      successCard.hidden = false;
      successCard.setAttribute('tabindex', '-1');
      successCard.focus();
    });

    // Clear an error as soon as the field is corrected
    ['field-name', 'field-email', 'field-ack'].forEach(function (id) {
      var input = document.getElementById(id);
      var errorEl = document.getElementById(id.replace('field-', 'error-'));
      var eventName = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventName, function () {
        setFieldError(input, errorEl, false);
      });
    });
  }
})();
