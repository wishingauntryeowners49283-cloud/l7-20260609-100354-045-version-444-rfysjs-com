(function () {
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMobileNav() {
    var button = document.querySelector('[data-mobile-toggle]');
    if (!button) {
      return;
    }

    button.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });

    all('[data-mobile-nav] a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
      });
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = all('[data-hero-slide]', hero);
    var dots = all('[data-hero-dot]', hero);
    var next = hero.querySelector('[data-hero-next]');
    var prev = hero.querySelector('[data-hero-prev]');
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initLists() {
    all('[data-card-list]').forEach(function (list) {
      var scope = list.closest('[data-list-scope]') || document;
      var input = scope.querySelector('[data-search-input]');
      var category = scope.querySelector('[data-category-filter]');
      var sort = scope.querySelector('[data-sort-select]');
      var empty = scope.querySelector('[data-empty]');

      function cards() {
        return all('[data-movie-card]', list);
      }

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var cat = category ? category.value : 'all';
        var visible = 0;

        cards().forEach(function (card) {
          var matchesText = !query || (card.getAttribute('data-search') || '').indexOf(query) !== -1;
          var matchesCategory = cat === 'all' || card.getAttribute('data-category') === cat;
          var ok = matchesText && matchesCategory;
          card.style.display = ok ? '' : 'none';
          if (ok) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle('show', visible === 0);
        }
      }

      function reorder() {
        if (!sort) {
          apply();
          return;
        }

        var mode = sort.value;
        var sorted = cards().sort(function (a, b) {
          if (mode === 'hot') {
            return Number(b.getAttribute('data-views')) - Number(a.getAttribute('data-views'));
          }
          if (mode === 'year') {
            return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
          }
          return (a.querySelector('h2') ? a.querySelector('h2').textContent : '').localeCompare(b.querySelector('h2') ? b.querySelector('h2').textContent : '', 'zh-Hans-CN');
        });

        sorted.forEach(function (card) {
          list.appendChild(card);
        });
        apply();
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      if (category) {
        category.addEventListener('change', apply);
      }
      if (sort) {
        sort.addEventListener('change', reorder);
      }
      reorder();
    });
  }

  function initBackTop() {
    var button = document.querySelector('[data-back-top]');
    if (!button) {
      return;
    }

    function sync() {
      button.classList.toggle('show', window.scrollY > 320);
    }

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  function initPlayers() {
    all('[data-player]').forEach(function (box) {
      var video = box.querySelector('video');
      var overlay = box.querySelector('[data-play]');
      var status = box.querySelector('[data-player-status]');
      if (!video) {
        return;
      }

      var stream = video.getAttribute('data-stream');
      if (stream) {
        if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal && status) {
              status.textContent = '视频加载失败，请稍后重试';
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (status) {
          status.textContent = '当前浏览器暂不支持播放';
        }
      }

      function playVideo() {
        var action = video.paused ? video.play() : video.pause();
        if (action && action.catch) {
          action.catch(function () {});
        }
      }

      if (overlay) {
        overlay.addEventListener('click', function () {
          if (video.paused) {
            playVideo();
          }
        });
      }

      video.addEventListener('click', function () {
        playVideo();
      });

      video.addEventListener('play', function () {
        box.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        box.classList.remove('is-playing');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHero();
    initLists();
    initBackTop();
    initPlayers();
  });
})();
