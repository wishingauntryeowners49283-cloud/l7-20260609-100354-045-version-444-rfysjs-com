
(function () {
    function normalize(value) {
        return (value || '').toString().trim().toLowerCase();
    }

    function initMobileMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');

        if (!button || !nav) {
            return;
        }

        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
            button.textContent = nav.classList.contains('is-open') ? '×' : '☰';
        });
    }

    function initImageFallback() {
        document.querySelectorAll('.poster-frame img').forEach(function (image) {
            image.addEventListener('error', function () {
                var frame = image.closest('.poster-frame');

                if (frame) {
                    frame.classList.add('poster-missing');
                }

                image.remove();
            }, { once: true });
        });
    }

    function initHeroCarousel() {
        var shell = document.querySelector('[data-hero-carousel]');

        if (!shell) {
            return;
        }

        var slides = Array.prototype.slice.call(shell.querySelectorAll('[data-hero-slide]'));
        var dotsWrap = shell.querySelector('[data-hero-dots]');
        var current = 0;
        var timer = null;

        if (!slides.length || !dotsWrap) {
            return;
        }

        function show(index) {
            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });

            dotsWrap.querySelectorAll('button').forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        slides.forEach(function (_, index) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', '切换到第 ' + (index + 1) + ' 个推荐');
            dot.addEventListener('click', function () {
                show(index);
                restart();
            });
            dotsWrap.appendChild(dot);
        });

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }

            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        show(0);
        restart();
    }

    function initFilters() {
        var panel = document.querySelector('[data-filter-panel]');
        var grid = document.querySelector('[data-filter-grid]');

        if (!panel || !grid) {
            return;
        }

        var keywordInput = panel.querySelector('[data-filter-keyword]');
        var yearSelect = panel.querySelector('[data-filter-year]');
        var typeSelect = panel.querySelector('[data-filter-type]');
        var regionSelect = panel.querySelector('[data-filter-region]');
        var resetButton = panel.querySelector('[data-filter-reset]');
        var counter = document.querySelector('[data-result-count]');
        var cards = Array.prototype.slice.call(grid.children);

        function apply() {
            var keyword = normalize(keywordInput && keywordInput.value);
            var year = normalize(yearSelect && yearSelect.value);
            var type = normalize(typeSelect && typeSelect.value);
            var region = normalize(regionSelect && regionSelect.value);
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags')
                ].join(' '));
                var cardYear = normalize(card.getAttribute('data-year'));
                var cardType = normalize(card.getAttribute('data-type'));
                var cardRegion = normalize(card.getAttribute('data-region'));
                var matched = true;

                if (keyword && haystack.indexOf(keyword) === -1) {
                    matched = false;
                }

                if (year && cardYear !== year) {
                    matched = false;
                }

                if (type && cardType !== type) {
                    matched = false;
                }

                if (region && cardRegion !== region) {
                    matched = false;
                }

                card.setAttribute('data-filter-hidden', matched ? 'false' : 'true');

                if (matched) {
                    visible += 1;
                }
            });

            if (counter) {
                counter.textContent = '显示 ' + visible + ' 部影片';
            }
        }

        [keywordInput, yearSelect, typeSelect, regionSelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                if (keywordInput) {
                    keywordInput.value = '';
                }
                if (yearSelect) {
                    yearSelect.value = '';
                }
                if (typeSelect) {
                    typeSelect.value = '';
                }
                if (regionSelect) {
                    regionSelect.value = '';
                }
                apply();
            });
        }
    }

    function movieCard(item) {
        var tags = (item.tags || []).slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');

        return '' +
            '<article class="movie-card">' +
                '<a class="movie-cover-link" href="' + escapeAttribute(item.url) + '" aria-label="观看 ' + escapeAttribute(item.title) + '">' +
                    '<div class="poster-frame">' +
                        '<img src="' + escapeAttribute(item.poster) + '" alt="' + escapeAttribute(item.title) + '" loading="lazy">' +
                        '<span class="poster-fallback">' + escapeHtml((item.title || '').slice(0, 6)) + '</span>' +
                    '</div>' +
                    '<span class="play-badge">▶</span>' +
                    '<span class="duration-badge">' + escapeHtml(item.duration || '') + '</span>' +
                '</a>' +
                '<div class="movie-card-body">' +
                    '<a class="movie-title" href="' + escapeAttribute(item.url) + '">' + escapeHtml(item.title) + '</a>' +
                    '<p class="movie-one-line">' + escapeHtml(item.oneLine || '') + '</p>' +
                    '<div class="movie-meta-row">' +
                        '<span>' + escapeHtml(item.year || '年代未注明') + '</span>' +
                        '<span>' + escapeHtml(item.region || '') + '</span>' +
                        '<span>' + escapeHtml(item.type || '') + '</span>' +
                    '</div>' +
                    '<div class="movie-tags">' + tags + '</div>' +
                '</div>' +
            '</article>';
    }

    function escapeHtml(value) {
        return (value || '').toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    function initSearchPage() {
        var data = window.MOVIE_SEARCH_DATA;
        var results = document.querySelector('[data-search-results]');
        var summary = document.querySelector('[data-search-summary]');
        var input = document.querySelector('#site-search-input');

        if (!data || !results || !summary || !input) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q') || '';
        input.value = initialQuery;

        function render() {
            var query = normalize(input.value);

            if (!query) {
                results.innerHTML = data.slice(0, 40).map(movieCard).join('');
                summary.textContent = '推荐展示 40 部影片，可输入关键词搜索全部片库。';
                initImageFallback();
                return;
            }

            var matched = data.filter(function (item) {
                var haystack = normalize([
                    item.title,
                    item.category,
                    item.year,
                    item.region,
                    item.type,
                    item.genre,
                    (item.tags || []).join(' '),
                    item.oneLine
                ].join(' '));

                return haystack.indexOf(query) !== -1;
            }).slice(0, 120);

            results.innerHTML = matched.map(movieCard).join('');
            summary.textContent = '搜索“' + input.value + '”找到 ' + matched.length + ' 个结果。';
            initImageFallback();
        }

        input.addEventListener('input', render);
        render();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initImageFallback();
        initHeroCarousel();
        initFilters();
        initSearchPage();
    });
}());
