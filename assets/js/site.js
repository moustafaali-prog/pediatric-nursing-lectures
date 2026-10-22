/* Nursing Lectures Platform — interaction layer
   Theme, tabs, slide viewer, keyboard navigation (Enter / arrows / Esc / Home / End). */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ------------------------------------------------------------ theme -- */
  var KEY = 'nursing-theme';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { }
  if (!saved) {
    saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', saved);

  function paint(btn) {
    var dark = root.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '\u2601' : '\u263E';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
  }

  function initTheme() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    paint(btn);
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { }
      paint(btn);
    });
  }

  /* -------------------------------------------------------------- tabs -- */
  function initTabs() {
    var btns = document.querySelectorAll('[data-tab]');
    if (!btns.length) return;
    var panels = document.querySelectorAll('[data-panel]');

    function activate(name, push) {
      Array.prototype.forEach.call(btns, function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-tab') === name ? 'true' : 'false');
      });
      Array.prototype.forEach.call(panels, function (p) {
        p.classList.toggle('on', p.getAttribute('data-panel') === name);
      });
      if (push && history.replaceState) history.replaceState(null, '', '#' + name);
    }

    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { activate(b.getAttribute('data-tab'), true); });
    });

    var hash = (location.hash || '').replace('#', '');
    if (hash && document.querySelector('[data-tab="' + hash + '"]')) activate(hash, false);
  }

  /* ------------------------------------------------------------ viewer -- */
  function initViewer() {
    var v = document.getElementById('viewer');
    if (!v) return;
    var img = v.querySelector('.frame img');
    var pos = v.querySelector('.pos');
    var prev = v.querySelector('[data-prev]');
    var next = v.querySelector('[data-next]');
    var fs = v.querySelector('[data-fullscreen]');
    var strip = Array.prototype.slice.call(v.querySelectorAll('.strip .th'));
    var urls = (v.getAttribute('data-urls') || '').split('|').filter(Boolean);
    var total = strip.length || urls.length;
    if (!total || !img) return;
    var cur = 1;

    function show(n, silent) {
      cur = Math.max(1, Math.min(total, n));
      var src = urls[cur - 1];
      if (src) { img.setAttribute('src', src); img.setAttribute('alt', 'Slide ' + cur); }
      if (pos) pos.textContent = cur + ' / ' + total;
      strip.forEach(function (t, i) { t.setAttribute('aria-current', i === cur - 1 ? 'true' : 'false'); });
      var box = strip[cur - 1] && strip[cur - 1].parentNode;
      if (box && box.scrollHeight > box.clientHeight && strip[cur - 1].scrollIntoView) {
        strip[cur - 1].scrollIntoView({ block: 'nearest' });
      }
      var txt = document.getElementById('slideText');
      if (txt) {
        var t = document.getElementById('st-' + cur);
        txt.innerHTML = t ? t.innerHTML : '';
      }
      if (!silent && history.replaceState) history.replaceState(null, '', '#s' + cur);
    }

    function slidesActive() {
      var p = document.querySelector('[data-panel="slides"]');
      return p && p.classList.contains('on');
    }

    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });
    strip.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i + 1); });
      t.setAttribute('tabindex', '0');
      t.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i + 1); }
      });
    });
    if (fs) {
      fs.addEventListener('click', function () {
        var frame = v.querySelector('.frame');
        if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
        else if (frame.requestFullscreen) frame.requestFullscreen();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!slidesActive()) return;
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': show(cur + 1); e.preventDefault(); break;
        case 'ArrowLeft': case 'PageUp': show(cur - 1); e.preventDefault(); break;
        case 'Home': show(1); e.preventDefault(); break;
        case 'End': show(total); e.preventDefault(); break;
        case 'f': case 'F':
          if (fs) fs.click();
          break;
        case 'Escape':
          if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
          break;
      }
    });

    var m = /#s(\d+)$/.exec(location.hash || '');
    show(m ? parseInt(m[1], 10) : 1, true);
  }

  /* ------------------------------------------------- toc keyboard flow -- */
  function initTocKeys() {
    var list = document.querySelectorAll('.toc');
    Array.prototype.forEach.call(list, function (l) {
      var links = l.querySelectorAll('a');
      Array.prototype.forEach.call(links, function (a) {
        a.addEventListener('keydown', function (e) {
          var i = Array.prototype.indexOf.call(links, a);
          var t = null;
          if (e.key === 'ArrowDown') t = links[i + 1];
          else if (e.key === 'ArrowUp') t = links[i - 1];
          else if (e.key === 'Home') t = links[0];
          else if (e.key === 'End') t = links[links.length - 1];
          if (t) { e.preventDefault(); t.focus(); }
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme(); initTabs(); initViewer(); initTocKeys();
  });
})();
