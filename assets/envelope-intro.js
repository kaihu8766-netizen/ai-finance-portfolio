/* Homepage video only. The real letter stays in the document and is never moved. */
(function () {
  'use strict';
  var cover = document.getElementById('letterEnvelope');
  var video = document.getElementById('envelopeVideo');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 769px) and (orientation: landscape)');
  var storageKey = 'portfolio-letter-opened';
  try { if (sessionStorage.getItem(storageKey) === '1') return; } catch (e) { return; }
  function remember() { try { sessionStorage.setItem(storageKey, '1'); } catch (e) {} }
  if (motion.matches) { remember(); return; }
  // No sources are attached on narrow/portrait screens or without JS.
  if (!desktop.matches || typeof cover.showModal !== 'function') return;

  var state = 'loading', source = '', loadTimer, stallTimer, fadeTimer, wallTimer, frame;
  var fadeSeconds = .5;
  function finish() {
    if (state === 'done') return;
    state = 'done';
    [loadTimer, stallTimer, fadeTimer, wallTimer].forEach(clearTimeout);
    cancelAnimationFrame(frame);
    remember();
    var wasOpen = cover.open;
    if (wasOpen) cover.close();
    cover.hidden = true;
    document.documentElement.classList.remove('envelope-active');
    video.pause();
    video.removeAttribute('src');
    video.load();
    // A failed background preload must not steal focus from the readable page.
    if (wasOpen) {
      var letter = document.getElementById('letter');
      if (letter) letter.focus({ preventScroll: true });
    }
  }
  function reveal() {
    if (state !== 'playing') return;
    state = 'fading';
    clearTimeout(stallTimer);
    cover.classList.add('is-leaving');
    fadeTimer = setTimeout(finish, fadeSeconds * 1000);
  }
  function checkTail() {
    if (state === 'playing' && Number.isFinite(video.duration) && video.duration > 0 &&
        video.currentTime >= Math.max(0, video.duration - fadeSeconds)) reveal();
  }
  function watch() {
    checkTail();
    if (state === 'playing') frame = requestAnimationFrame(watch);
  }
  function showCover() {
    if (state === 'done' || !desktop.matches || motion.matches) { finish(); return false; }
    if (!cover.open) {
      try {
        cover.hidden = false;
        cover.showModal();
        document.documentElement.classList.add('envelope-active');
      } catch (e) { finish(); return false; }
    }
    return true;
  }
  function start() {
    if (state !== 'loading' || !showCover()) return;
    var attempt = source;
    try {
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function (error) {
        if (state === 'done' || source !== attempt) return;
        if (error && error.name === 'NotSupportedError') mediaError(); else finish();
      });
    } catch (e) { finish(); }
  }
  function load(file) {
    source = file;
    video.src = 'assets/' + file + '?v=727';
    video.load();
  }
  function mediaError() {
    if (state === 'done') return;
    // Some systems advertise HEVC but lack a usable hardware decoder.
    if (source === 'envelope-intro.mp4' && state === 'loading') {
      load('envelope-intro-h264.mp4');
    } else finish();
  }
  function stalled() {
    clearTimeout(stallTimer);
    if (state === 'playing') {
      var at = video.currentTime;
      stallTimer = setTimeout(function () {
        if (state === 'playing' && video.currentTime <= at + .1) finish();
      }, 2000);
    }
  }

  video.muted = video.defaultMuted = true;
  video.volume = 0;
  video.playsInline = true;
  video.preload = 'auto';
  video.addEventListener('loadeddata', start);
  video.addEventListener('playing', function () {
    if (state === 'done' || state === 'fading') return;
    if (!showCover()) return;
    clearTimeout(loadTimer);
    clearTimeout(stallTimer);
    if (state === 'playing') return;
    state = 'playing';
    remember();
    wallTimer = setTimeout(finish, (Number.isFinite(video.duration) ? video.duration : 8) * 1000 + 2000);
    watch();
  });
  video.addEventListener('timeupdate', checkTail);
  video.addEventListener('ended', finish); // Never hold on the final blank-paper frame.
  video.addEventListener('error', mediaError);
  video.addEventListener('waiting', stalled);
  video.addEventListener('stalled', stalled);
  video.addEventListener('pause', function () { if (state === 'playing') finish(); });
  cover.addEventListener('transitionend', function (e) {
    if (state === 'fading' && e.target === cover && e.propertyName === 'opacity') finish();
  });
  document.getElementById('envelopeSkip').addEventListener('click', function (e) { e.preventDefault(); finish(); });
  cover.addEventListener('cancel', function (e) { e.preventDefault(); finish(); });
  window.addEventListener('beforeprint', finish);
  window.addEventListener('pagehide', finish);
  document.addEventListener('visibilitychange', function () { if (document.hidden) finish(); });
  function preferenceChanged() { if (motion.matches || !desktop.matches) finish(); }
  [motion, desktop].forEach(function (query) {
    if (query.addEventListener) query.addEventListener('change', preferenceChanged);
    else if (query.addListener) query.addListener(preferenceChanged);
  });
  // While the video preloads, the letter remains readable and interactive.
  // If the visitor starts reading, a late load must not interrupt them.
  function readingStarted() { if (state === 'loading' && !cover.open) finish(); }
  document.addEventListener('pointerdown', readingStarted, { capture: true, passive: true });
  document.addEventListener('keydown', readingStarted, true);
  document.addEventListener('wheel', readingStarted, { passive: true });
  loadTimer = setTimeout(finish, 3000);
  load(video.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') ? 'envelope-intro.mp4' : 'envelope-intro-h264.mp4');
})();
