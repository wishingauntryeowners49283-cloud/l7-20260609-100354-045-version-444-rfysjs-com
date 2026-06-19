(function () {
    var base = document.body.getAttribute("data-base") || ".";
    var pathPrefix = base === "." ? "./" : base + "/";

    function joinPath(href) {
        if (/^https?:\/\//.test(href)) {
            return href;
        }
        return pathPrefix + href.replace(/^\.\//, "");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    var menuButton = document.querySelector("[data-mobile-menu]");
    var mobilePanel = document.querySelector("[data-mobile-panel]");
    if (menuButton && mobilePanel) {
        menuButton.addEventListener("click", function () {
            mobilePanel.classList.toggle("is-open");
        });
    }

    var heroSlides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var heroDots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var heroIndex = 0;
    var heroTimer = null;

    function showHero(index) {
        if (!heroSlides.length) {
            return;
        }
        heroIndex = (index + heroSlides.length) % heroSlides.length;
        heroSlides.forEach(function (slide, i) {
            slide.classList.toggle("is-active", i === heroIndex);
        });
        heroDots.forEach(function (dot, i) {
            dot.classList.toggle("is-active", i === heroIndex);
        });
    }

    function startHeroTimer() {
        if (heroSlides.length < 2) {
            return;
        }
        clearInterval(heroTimer);
        heroTimer = setInterval(function () {
            showHero(heroIndex + 1);
        }, 5200);
    }

    heroDots.forEach(function (dot) {
        dot.addEventListener("click", function () {
            showHero(Number(dot.getAttribute("data-hero-dot") || 0));
            startHeroTimer();
        });
    });
    startHeroTimer();

    var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
    searchInputs.forEach(function (input) {
        var wrap = input.closest(".header-search") || input.closest(".mobile-panel") || document;
        var panel = wrap.querySelector("[data-search-results]");
        if (!panel) {
            return;
        }
        input.addEventListener("input", function () {
            var keyword = input.value.trim().toLowerCase();
            if (!keyword) {
                panel.classList.remove("is-open");
                panel.innerHTML = "";
                return;
            }
            var list = (window.SEARCH_INDEX || []).filter(function (item) {
                var text = [item.title, item.year, item.region, item.genre, item.category, item.line].join(" ").toLowerCase();
                return text.indexOf(keyword) !== -1;
            }).slice(0, 10);
            panel.innerHTML = list.map(function (item) {
                return "<a class=\"search-result\" href=\"" + joinPath(item.href) + "\">" +
                    "<img src=\"" + joinPath(item.cover) + "\" alt=\"" + escapeHtml(item.title) + "\">" +
                    "<span><strong>" + escapeHtml(item.title) + "</strong><small>" + escapeHtml(item.year + " · " + item.region + " · " + item.category) + "</small></span>" +
                    "</a>";
            }).join("");
            panel.classList.toggle("is-open", list.length > 0);
        });
        input.addEventListener("focus", function () {
            if (panel.innerHTML.trim()) {
                panel.classList.add("is-open");
            }
        });
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".header-search") && !event.target.closest(".mobile-panel")) {
            document.querySelectorAll("[data-search-results]").forEach(function (panel) {
                panel.classList.remove("is-open");
            });
        }
    });

    var filterInput = document.querySelector("[data-filter-input]");
    if (filterInput) {
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        filterInput.addEventListener("input", function () {
            var keyword = filterInput.value.trim().toLowerCase();
            cards.forEach(function (card) {
                var text = (card.getAttribute("data-search") || "").toLowerCase();
                card.classList.toggle("is-hidden", keyword && text.indexOf(keyword) === -1);
            });
        });
    }

    document.querySelectorAll("[data-player]").forEach(function (player) {
        var video = player.querySelector("video");
        var overlay = player.querySelector("[data-player-overlay]");
        var stream = player.getAttribute("data-stream");
        var hlsInstance = null;
        var ready = false;

        function attachStream() {
            if (!video || !stream || ready) {
                return;
            }
            ready = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    maxBufferLength: 45,
                    enableWorker: true
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else {
                video.src = stream;
            }
        }

        function startPlayback() {
            attachStream();
            player.classList.add("is-playing");
            var playAttempt = video.play();
            if (playAttempt && playAttempt.catch) {
                playAttempt.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener("click", startPlayback);
        }
        if (video) {
            video.addEventListener("play", function () {
                player.classList.add("is-playing");
            });
            video.addEventListener("click", function () {
                if (video.paused) {
                    startPlayback();
                }
            });
        }
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
