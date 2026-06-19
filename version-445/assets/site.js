(function () {
    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function setupMobileMenu() {
        var button = document.querySelector('[data-mobile-menu-button]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('open');
        });
    }

    function setupGlobalSearch() {
        var forms = document.querySelectorAll('[data-global-search]');
        forms.forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"], input[type="search"]');
                var query = input ? input.value.trim() : '';
                var target = './search.html';
                if (query) {
                    target += '?q=' + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
        if (!slides.length) {
            return;
        }
        var current = 0;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var index = Number(dot.getAttribute('data-hero-dot')) || 0;
                show(index);
            });
        });
        setInterval(function () {
            show(current + 1);
        }, 5200);
    }

    function setupFiltering() {
        var input = document.querySelector('[data-page-search]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
        var empty = document.querySelector('[data-empty-state]');
        if (!cards.length) {
            return;
        }
        var activeFilter = { key: 'all', value: 'all' };
        function apply() {
            var query = normalize(input ? input.value : '');
            var visible = 0;
            cards.forEach(function (card) {
                var text = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.textContent
                ].join(' '));
                var queryMatch = !query || text.indexOf(query) !== -1;
                var filterMatch = true;
                if (activeFilter.key !== 'all') {
                    filterMatch = normalize(card.getAttribute('data-' + activeFilter.key)).indexOf(normalize(activeFilter.value)) !== -1;
                }
                var shouldShow = queryMatch && filterMatch;
                card.style.display = shouldShow ? '' : 'none';
                if (shouldShow) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('visible', visible === 0);
            }
        }
        if (input) {
            input.addEventListener('input', apply);
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query) {
                input.value = query;
            }
            if (input.hasAttribute('data-autofocus')) {
                setTimeout(function () {
                    input.focus();
                }, 120);
            }
        }
        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                buttons.forEach(function (item) {
                    item.classList.remove('active');
                });
                button.classList.add('active');
                activeFilter = {
                    key: button.getAttribute('data-filter') || 'all',
                    value: button.getAttribute('data-value') || 'all'
                };
                apply();
            });
        });
        apply();
    }

    function setupLocalForms() {
        var forms = document.querySelectorAll('[data-local-search]');
        forms.forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupGlobalSearch();
        setupHero();
        setupLocalForms();
        setupFiltering();
    });
})();

function initializeMoviePlayer(videoId, buttonId, sourceUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var hlsInstance = null;
    var loaded = false;
    if (!video || !button || !sourceUrl) {
        return;
    }

    function beginPlayback() {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
        }
    }

    function loadSource() {
        if (loaded) {
            beginPlayback();
            return;
        }
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                beginPlayback();
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    button.classList.remove('hidden');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
            video.addEventListener('loadedmetadata', beginPlayback, { once: true });
            video.load();
        } else {
            video.src = sourceUrl;
            video.load();
            beginPlayback();
        }
    }

    button.addEventListener('click', function () {
        button.classList.add('hidden');
        loadSource();
    });

    video.addEventListener('play', function () {
        button.classList.add('hidden');
    });

    video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
            button.classList.remove('hidden');
        }
    });

    video.addEventListener('ended', function () {
        button.classList.remove('hidden');
    });

    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
