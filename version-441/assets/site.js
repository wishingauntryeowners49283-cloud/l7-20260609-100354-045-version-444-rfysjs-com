(function () {
  var header = document.querySelector('[data-header]');
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  function onScroll() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;
    var timer = null;

    function show(next) {
      if (!slides.length) {
        return;
      }
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    show(0);
    start();
  });

  function getIndex() {
    return Array.isArray(window.SEARCH_INDEX) ? window.SEARCH_INDEX : [];
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function matchMovies(query, limit) {
    var q = normalize(query);
    if (!q) {
      return [];
    }
    return getIndex().filter(function (item) {
      return normalize(item.title + ' ' + item.region + ' ' + item.year + ' ' + item.type + ' ' + item.genre + ' ' + item.tags).indexOf(q) !== -1;
    }).slice(0, limit || 10);
  }

  document.querySelectorAll('[data-site-search]').forEach(function (form) {
    var input = form.querySelector('[data-search-input]');
    var box = form.querySelector('[data-search-results]');
    if (!input || !box) {
      return;
    }

    function render() {
      var list = matchMovies(input.value, 8);
      box.innerHTML = list.map(function (item) {
        return '<a class="suggest-item" href="' + item.url + '"><strong>' + item.title + '</strong><span>' + item.region + ' · ' + item.year + ' · ' + item.type + '</span></a>';
      }).join('');
      box.classList.toggle('is-open', list.length > 0);
    }

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', function () {
      window.setTimeout(function () {
        box.classList.remove('is-open');
      }, 180);
    });
  });

  document.querySelectorAll('[data-filter-bar]').forEach(function (bar) {
    var section = bar.closest('section');
    var textInput = bar.querySelector('[data-filter-text]');
    var typeSelect = bar.querySelector('[data-filter-type]');
    var yearSelect = bar.querySelector('[data-filter-year]');
    var cards = Array.prototype.slice.call(section.querySelectorAll('[data-movie-card]'));
    var empty = section.querySelector('[data-filter-empty]');

    function apply() {
      var text = normalize(textInput && textInput.value);
      var type = normalize(typeSelect && typeSelect.value);
      var year = normalize(yearSelect && yearSelect.value);
      var shown = 0;

      cards.forEach(function (card) {
        var hay = normalize(card.dataset.title + ' ' + card.dataset.region + ' ' + card.dataset.type + ' ' + card.dataset.year + ' ' + card.dataset.tags);
        var ok = true;
        if (text && hay.indexOf(text) === -1) {
          ok = false;
        }
        if (type && normalize(card.dataset.type) !== type) {
          ok = false;
        }
        if (year && normalize(card.dataset.year) !== year) {
          ok = false;
        }
        card.style.display = ok ? '' : 'none';
        if (ok) {
          shown += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', shown === 0);
      }
    }

    [textInput, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  });

  var pageForm = document.querySelector('[data-search-page-form]');
  var pageInput = document.querySelector('[data-search-page-input]');
  var pageResults = document.querySelector('[data-search-page-results]');
  var pageTitle = document.querySelector('[data-search-title]');
  var pageSubtitle = document.querySelector('[data-search-subtitle]');

  function renderSearchPage(query) {
    if (!pageResults || !pageTitle || !pageSubtitle) {
      return;
    }

    var list = matchMovies(query, 80);
    if (!query) {
      return;
    }

    pageTitle.textContent = '搜索结果';
    pageSubtitle.textContent = list.length ? '已匹配到相关影片，点击进入详情页观看。' : '暂无匹配影片，可尝试更换关键词。';
    pageResults.innerHTML = list.length ? '<div class="movie-grid">' + list.map(function (item) {
      return '<a class="search-result-card" href="' + item.url + '"><img src="' + item.cover + '" alt="' + item.title + '"><span><h3>' + item.title + '</h3><p>' + item.oneLine + '</p><em>' + item.region + ' · ' + item.year + ' · ' + item.genre + '</em></span></a>';
    }).join('') + '</div>' : '<p class="empty-state is-visible">暂无匹配影片</p>';
  }

  if (pageForm && pageInput) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    pageInput.value = initial;
    renderSearchPage(initial);

    pageForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var q = pageInput.value.trim();
      var url = q ? window.location.pathname + '?q=' + encodeURIComponent(q) : window.location.pathname;
      window.history.replaceState(null, '', url);
      renderSearchPage(q);
    });
  }

  var hlsPromise = null;

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsPromise) {
      return hlsPromise;
    }
    hlsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return hlsPromise;
  }

  function startPlayer(player) {
    var video = player.querySelector('video');
    var cover = player.querySelector('[data-play]');
    if (!video) {
      return;
    }
    var stream = video.getAttribute('data-stream');
    if (!stream) {
      return;
    }

    function playNow() {
      if (cover) {
        cover.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    if (video.dataset.ready === '1') {
      playNow();
      return;
    }

    video.dataset.ready = '1';
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      video.addEventListener('loadedmetadata', playNow, { once: true });
      video.load();
      window.setTimeout(playNow, 250);
      return;
    }

    loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        var hls = new Hls({ enableWorker: true });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, playNow);
      } else {
        video.src = stream;
        video.load();
        playNow();
      }
    }).catch(function () {
      video.src = stream;
      video.load();
      playNow();
    });
  }

  document.querySelectorAll('[data-player]').forEach(function (player) {
    var cover = player.querySelector('[data-play]');
    if (cover) {
      cover.addEventListener('click', function (event) {
        event.preventDefault();
        startPlayer(player);
      });
    }
    player.addEventListener('click', function (event) {
      if (event.target === player) {
        startPlayer(player);
      }
    });
  });
})();
