(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function initHeader() {
        var header = document.getElementById("site-header");
        var toggle = document.getElementById("menu-toggle");
        var panel = document.getElementById("mobile-panel");

        function updateHeader() {
            if (!header) {
                return;
            }
            if (window.scrollY > 16) {
                header.classList.add("nav-scrolled");
            } else {
                header.classList.remove("nav-scrolled");
            }
        }

        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });

        if (toggle && panel) {
            toggle.addEventListener("click", function () {
                panel.classList.toggle("open");
                document.body.classList.toggle("menu-open", panel.classList.contains("open"));
            });
        }
    }

    function initCarousel() {
        var carousel = document.querySelector("[data-carousel]");
        if (!carousel) {
            return;
        }

        var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
        var prev = carousel.querySelector(".hero-arrow.prev");
        var next = carousel.querySelector(".hero-arrow.next");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5600);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                start();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }

        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initCatalogFilters() {
        var pages = Array.prototype.slice.call(document.querySelectorAll(".catalog-page"));
        if (!pages.length) {
            return;
        }

        pages.forEach(function (page) {
            var search = page.querySelector(".catalog-search");
            var year = page.querySelector(".filter-year");
            var type = page.querySelector(".filter-type");
            var region = page.querySelector(".filter-region");
            var cards = Array.prototype.slice.call(page.querySelectorAll(".movie-card"));
            var empty = page.querySelector(".empty-state");

            function normalize(value) {
                return String(value || "").trim().toLowerCase();
            }

            function apply() {
                var q = normalize(search && search.value);
                var selectedYear = year ? year.value : "";
                var selectedType = type ? type.value : "";
                var selectedRegion = region ? region.value : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var text = normalize(card.getAttribute("data-search"));
                    var cardYear = card.getAttribute("data-year") || "";
                    var cardType = card.getAttribute("data-type") || "";
                    var cardRegion = card.getAttribute("data-region") || "";
                    var matched = true;

                    if (q && text.indexOf(q) === -1) {
                        matched = false;
                    }
                    if (selectedYear && cardYear !== selectedYear) {
                        matched = false;
                    }
                    if (selectedType && cardType.indexOf(selectedType) === -1) {
                        matched = false;
                    }
                    if (selectedRegion && cardRegion.indexOf(selectedRegion) === -1) {
                        matched = false;
                    }

                    card.hidden = !matched;
                    if (matched) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            [search, year, type, region].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });

            if (page.classList.contains("search-page") && search) {
                var params = new URLSearchParams(window.location.search);
                var q = params.get("q");
                if (q) {
                    search.value = q;
                }
            }

            apply();
        });
    }

    function initMoviePlayer(videoId, coverId, sourceUrl) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        var loaded = false;
        var hls = null;

        if (!video || !sourceUrl) {
            return;
        }

        function attach() {
            if (loaded) {
                return;
            }
            loaded = true;

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(sourceUrl);
                hls.attachMedia(video);
            } else {
                video.src = sourceUrl;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }

        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            } else {
                video.pause();
            }
        });

        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    window.initMoviePlayer = initMoviePlayer;

    ready(function () {
        initHeader();
        initCarousel();
        initCatalogFilters();
    });
})();
