/* Homepage envelope cover only. The real letter stays in the document and is never moved. */
(function () {
  'use strict';
  var cover = document.getElementById('letterEnvelope');
  var openBtn = document.getElementById('envelopeOpen');
  var image = document.getElementById('envelopeImage');
  var skipBtn = document.getElementById('envelopeSkip');
  if (!cover || !openBtn || !image) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var portrait = window.matchMedia('(orientation: portrait)');
  var storageKey = 'portfolio-letter-opened';

  try {
    if (sessionStorage.getItem(storageKey) === '1') return;
  } catch (e) {
    return;
  }

  function remember() {
    try { sessionStorage.setItem(storageKey, '1'); } catch (e) {}
  }

  if (motion.matches) {
    remember();
    return;
  }

  // No image is fetched on browsers without <dialog>.
  if (typeof cover.showModal !== 'function') return;

  // Portrait screens get the tall mobile cover; landscape gets the desktop cover.
  function pickCover() {
    return portrait.matches
      ? { src: 'assets/envelope-cover-mobile.webp?v=729', width: 1080, height: 1920 }
      : { src: 'assets/envelope-cover.webp?v=729', width: 1440, height: 960 };
  }

  var state = 'loading'; // 'loading' -> 'ready' -> 'fading' -> 'done'
  var loadTimer = null;
  var fadeTimer = null;
  var fadeDurationMs = 950;

  function focusLetter() {
    var letter = document.getElementById('letter');
    if (letter) letter.focus({ preventScroll: true });
  }

  // Immediate teardown (used on skip, Esc, load error, or after fade completes)
  function finish() {
    if (state === 'done') return;
    state = 'done';
    clearTimeout(loadTimer);
    clearTimeout(fadeTimer);
    remember();

    var wasOpen = cover.open;
    if (wasOpen) {
      try { cover.close(); } catch (e) {}
    }
    cover.hidden = true;
    cover.classList.remove('is-leaving');
    document.documentElement.classList.remove('envelope-active', 'envelope-opening');

    if (wasOpen) {
      focusLetter();
    }
  }

  // Smooth ~1s zoom + fade transition when user clicks the envelope/wax seal
  function triggerOpen() {
    if (state !== 'ready') return;
    if (motion.matches) {
      finish();
      return;
    }
    state = 'fading';
    remember();
    document.documentElement.classList.add('envelope-opening');
    cover.classList.add('is-leaving');
    fadeTimer = setTimeout(finish, fadeDurationMs + 50);
  }

  function showCover() {
    if (state !== 'loading' || motion.matches) {
      finish();
      return;
    }
    clearTimeout(loadTimer);
    try {
      cover.hidden = false;
      cover.showModal();
      document.documentElement.classList.add('envelope-active');
      state = 'ready';
      openBtn.focus({ preventScroll: true });
    } catch (e) {
      finish();
    }
  }

  // Image preload events
  image.addEventListener('load', function () {
    if (state !== 'loading') return;
    if (image.decode) {
      image.decode().then(showCover).catch(showCover);
    } else {
      showCover();
    }
  });
  image.addEventListener('error', finish);

  // User interactions
  openBtn.addEventListener('click', function (e) {
    e.preventDefault();
    triggerOpen();
  });

  // Clicking anywhere on the cover opens the letter.
  cover.addEventListener('click', function () {
    triggerOpen();
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', function (e) {
      e.preventDefault();
      finish();
    });
  }

  cover.addEventListener('cancel', function (e) {
    e.preventDefault();
    finish();
  });

  cover.addEventListener('transitionend', function (e) {
    if (state === 'fading' && e.target === cover && e.propertyName === 'opacity') {
      finish();
    }
  });

  window.addEventListener('beforeprint', finish);
  window.addEventListener('pagehide', finish);

  function preferenceChanged() {
    if (motion.matches) finish();
  }
  if (motion.addEventListener) motion.addEventListener('change', preferenceChanged);
  else if (motion.addListener) motion.addListener(preferenceChanged);

  // If the visitor rotates before the cover finishes loading, swap to the matching cover.
  function orientationChanged() {
    if (state !== 'loading') return;
    var choice = pickCover();
    image.width = choice.width;
    image.height = choice.height;
    image.src = choice.src;
  }
  if (portrait.addEventListener) portrait.addEventListener('change', orientationChanged);
  else if (portrait.addListener) portrait.addListener(orientationChanged);

  // If the visitor starts reading before the image finishes loading, do not interrupt them.
  function readingStarted() {
    if (state === 'loading' && !cover.open) finish();
  }
  document.addEventListener('pointerdown', readingStarted, { capture: true, passive: true });
  document.addEventListener('keydown', readingStarted, true);
  document.addEventListener('wheel', readingStarted, { passive: true });

  // Fallback timeout: if image takes longer than 2.5s, go straight to the letter
  loadTimer = setTimeout(finish, 2500);
  var initial = pickCover();
  image.width = initial.width;
  image.height = initial.height;
  image.src = initial.src;
})();
