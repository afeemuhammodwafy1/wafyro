/* Wafyro Software - shared scripts */
(function () {
  'use strict';

  /* Mobile menu */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    var icon = menuBtn.querySelector('use');
    var setMenu = function (open) {
      navLinks.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      icon.setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    menuBtn.addEventListener('click', function () { setMenu(!navLinks.classList.contains('open')); });
    navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* Footer year */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Sample QR pattern (home page preview) */
  var qr = document.getElementById('qr');
  if (qr) {
    var N = 25, seed = 7, out = '';
    var rnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    var finder = function (x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#0F1B2D"/>' +
             '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/>' +
             '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#0F1B2D"/>';
    };
    var inFinder = function (r, c) { return (r < 8 && c < 8) || (r < 8 && c > N - 9) || (r > N - 9 && c < 8); };
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        if (!inFinder(r, c) && rnd() > 0.52) out += '<rect x="' + c + '" y="' + r + '" width="1" height="1" fill="#0F1B2D"/>';
      }
    }
    qr.innerHTML = out + finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7);
  }

  /* Home page product stage */
  var stage = document.getElementById('stage');
  if (stage) {
    var tabs = Array.prototype.slice.call(stage.querySelectorAll('.tab'));
    var panels = Array.prototype.slice.call(stage.querySelectorAll('.panel'));
    var barName = document.getElementById('barName');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0, timer = null, DUR = 6000;
    stage.style.setProperty('--dur', (DUR / 1000) + 's');

    var show = function (i) {
      current = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('active', on);
      });
      barName.textContent = tabs[i].getAttribute('data-name');
      var sel = tabs[i];
      sel.style.animation = 'none';
      void sel.offsetWidth;
      sel.style.animation = '';
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      if (reduce || stage.classList.contains('manual')) return;
      stop();
      stage.classList.remove('paused');
      timer = setInterval(function () { show((current + 1) % tabs.length); }, DUR);
    };

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { stage.classList.add('manual'); stop(); show(k); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (k + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (k - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); stage.classList.add('manual'); stop(); show(n); tabs[n].focus(); }
      });
    });
    stage.addEventListener('mouseenter', function () { if (!stage.classList.contains('manual')) { stage.classList.add('paused'); stop(); } });
    stage.addEventListener('mouseleave', function () { if (!stage.classList.contains('manual')) { stage.classList.remove('paused'); start(); } });

    show(0);
    start();
  }

  /* Contact form (Formspree) */
  var form = document.getElementById('contactForm');
  if (form) {
    var statusEl = document.getElementById('cf-status');
    var submitBtn = document.getElementById('cf-submit');
    var rules = {
      'cf-name': { test: function (v) { return v.trim().length > 1; }, msg: 'Enter your name.' },
      'cf-email': { test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: 'Enter a valid email address.' },
      'cf-message': { test: function (v) { return v.trim().length > 4; }, msg: 'Write a short message.' }
    };
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      var e = document.createElement('span');
      e.className = 'err';
      e.id = id + '-err';
      e.textContent = rules[id].msg;
      el.parentNode.appendChild(e);
      el.setAttribute('aria-describedby', e.id);
      el.addEventListener('input', function () {
        if (rules[id].test(el.value)) { el.parentNode.classList.remove('invalid'); el.setAttribute('aria-invalid', 'false'); }
      });
    });
    var setStatus = function (text, cls) { statusEl.textContent = text; statusEl.className = 'form-status ' + (cls || ''); };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true, firstBad = null;
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        var valid = rules[id].test(el.value);
        el.parentNode.classList.toggle('invalid', !valid);
        el.setAttribute('aria-invalid', valid ? 'false' : 'true');
        if (!valid && !firstBad) firstBad = el;
        ok = ok && valid;
      });
      if (!ok) { setStatus('Fix the highlighted fields and try again.', 'bad'); firstBad.focus(); return; }

      submitBtn.disabled = true;
      setStatus('Sending...', '');
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            setStatus('Message sent. We will reply to your email soon.', 'ok');
            return;
          }
          return res.json().then(function (d) {
            var m = d && d.errors && d.errors[0] && d.errors[0].message;
            throw new Error(m || 'The message could not be sent.');
          });
        })
        .catch(function (err) {
          setStatus((err && err.message ? err.message : 'The message could not be sent.') + ' Check your connection and try again.', 'bad');
        })
        .then(function () { submitBtn.disabled = false; });
    });
  }
})();
