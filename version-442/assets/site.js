(function () {
    var header = document.querySelector('[data-header]');
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    function updateHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 18) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
        var activeIndex = 0;
        var timer = null;

        function activate(index) {
            if (!slides.length) {
                return;
            }
            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === activeIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === activeIndex);
            });
            thumbs.forEach(function (thumb, thumbIndex) {
                thumb.classList.toggle('active', thumbIndex === activeIndex);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                activate(activeIndex + 1);
            }, 6000);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                activate(Number(dot.getAttribute('data-hero-dot')) || 0);
                restart();
            });
        });

        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                activate(Number(thumb.getAttribute('data-hero-thumb')) || 0);
                restart();
            });
        });

        activate(0);
        restart();
    }

    function setupGlobalSearch() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-global-search]'));
        if (!inputs.length || !window.SEARCH_INDEX) {
            return;
        }

        inputs.forEach(function (input) {
            var box = input.parentElement.querySelector('[data-search-results]');
            if (!box) {
                return;
            }

            function close() {
                box.classList.remove('is-open');
                box.innerHTML = '';
            }

            function renderResults(query) {
                var words = query.trim().toLowerCase();
                if (!words) {
                    close();
                    return;
                }

                var results = window.SEARCH_INDEX.filter(function (item) {
                    return (item.title + ' ' + item.year + ' ' + item.region + ' ' + item.type + ' ' + item.genre).toLowerCase().indexOf(words) !== -1;
                }).slice(0, 8);

                if (!results.length) {
                    close();
                    return;
                }

                box.innerHTML = results.map(function (item) {
                    return '<a class="search-result-item" href="' + item.url + '">' +
                        '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '">' +
                        '<span><strong>' + escapeHtml(item.title) + '</strong><span>' + item.year + ' · ' + escapeHtml(item.region) + ' · ' + escapeHtml(item.type) + '</span></span>' +
                        '</a>';
                }).join('');
                box.classList.add('is-open');
            }

            input.addEventListener('input', function () {
                renderResults(input.value);
            });

            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    var first = box.querySelector('a');
                    if (first) {
                        window.location.href = first.href;
                    }
                }
                if (event.key === 'Escape') {
                    close();
                    input.blur();
                }
            });

            document.addEventListener('click', function (event) {
                if (!input.parentElement.contains(event.target)) {
                    close();
                }
            });
        });
    }

    function setupLocalFilters() {
        var input = document.querySelector('[data-local-filter]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        var yearButtons = Array.prototype.slice.call(document.querySelectorAll('[data-year-filter]'));
        var selectedYear = 'all';

        if (!cards.length) {
            return;
        }

        function applyFilter() {
            var query = input ? input.value.trim().toLowerCase() : '';
            cards.forEach(function (card) {
                var title = card.getAttribute('data-title') || '';
                var meta = card.getAttribute('data-meta') || '';
                var year = card.getAttribute('data-year') || '';
                var text = (title + ' ' + meta + ' ' + year).toLowerCase();
                var matchQuery = !query || text.indexOf(query) !== -1;
                var matchYear = selectedYear === 'all' || year === selectedYear;
                card.classList.toggle('is-hidden-card', !(matchQuery && matchYear));
            });
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }

        yearButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                selectedYear = button.getAttribute('data-year-filter') || 'all';
                yearButtons.forEach(function (item) {
                    item.classList.toggle('active', item === button);
                });
                applyFilter();
            });
        });
    }

    function setupPlayers() {
        var stages = Array.prototype.slice.call(document.querySelectorAll('[data-player-stage]'));
        stages.forEach(function (stage) {
            var video = stage.querySelector('video[data-m3u8]');
            var button = stage.querySelector('[data-play-button]');
            if (!video) {
                return;
            }

            function loadSource() {
                if (video.dataset.loaded === 'true') {
                    var action = video.paused ? video.play() : video.pause();
                    if (action && action.catch) {
                        action.catch(function () {});
                    }
                    return;
                }

                var src = video.getAttribute('data-m3u8');
                video.dataset.loaded = 'true';

                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(src);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        var playResult = video.play();
                        if (playResult && playResult.catch) {
                            playResult.catch(function () {});
                        }
                    });
                    video._hlsInstance = hls;
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                    video.addEventListener('loadedmetadata', function () {
                        var playResult = video.play();
                        if (playResult && playResult.catch) {
                            playResult.catch(function () {});
                        }
                    }, { once: true });
                } else {
                    video.src = src;
                    var playResult = video.play();
                    if (playResult && playResult.catch) {
                        playResult.catch(function () {});
                    }
                }

                if (button) {
                    button.classList.add('is-hidden');
                }
            }

            if (button) {
                button.addEventListener('click', loadSource);
            }

            video.addEventListener('click', function () {
                if (video.dataset.loaded !== 'true') {
                    loadSource();
                }
            });

            video.addEventListener('play', function () {
                if (button) {
                    button.classList.add('is-hidden');
                }
            });
        });
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupHero();
        setupGlobalSearch();
        setupLocalFilters();
        setupPlayers();
    });
})();
