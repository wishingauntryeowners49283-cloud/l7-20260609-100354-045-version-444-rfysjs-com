(function () {
    const body = document.body;
    const menuButton = document.querySelector("[data-menu-toggle]");
    const mobilePanel = document.querySelector("[data-mobile-panel]");

    if (menuButton && mobilePanel) {
        menuButton.addEventListener("click", function () {
            body.classList.toggle("menu-open");
        });
    }

    const backToTop = document.querySelector("[data-back-to-top]");

    if (backToTop) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 320) {
                backToTop.classList.add("is-visible");
            } else {
                backToTop.classList.remove("is-visible");
            }
        });

        backToTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const heroSlider = document.querySelector("[data-hero-slider]");

    if (heroSlider) {
        const slides = Array.from(heroSlider.querySelectorAll("[data-hero-slide]"));
        const dots = Array.from(heroSlider.querySelectorAll("[data-hero-dot]"));
        let currentIndex = 0;

        const activate = function (index) {
            currentIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === currentIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === currentIndex);
            });
        };

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                activate(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                activate(currentIndex + 1);
            }, 5200);
        }
    }

    const filterBox = document.querySelector("[data-card-filter]");

    if (filterBox) {
        const keywordInput = filterBox.querySelector("[data-filter-keyword]");
        const yearSelect = filterBox.querySelector("[data-filter-year]");
        const countText = filterBox.querySelector("[data-filter-count]");
        const cards = Array.from(document.querySelectorAll("[data-movie-card]"));

        const applyFilter = function () {
            const keyword = (keywordInput ? keywordInput.value : "").trim().toLowerCase();
            const year = yearSelect ? yearSelect.value : "";
            let visibleCount = 0;

            cards.forEach(function (card) {
                const haystack = [
                    card.dataset.title,
                    card.dataset.year,
                    card.dataset.region,
                    card.dataset.type,
                    card.dataset.category,
                    card.dataset.genre
                ].join(" ").toLowerCase();

                const matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                const cardYear = Number(card.dataset.year || 0);
                let matchesYear = true;

                if (year && year !== "2021") {
                    matchesYear = String(cardYear) === year;
                }

                if (year === "2021") {
                    matchesYear = cardYear <= 2021;
                }

                const visible = matchesKeyword && matchesYear;
                card.classList.toggle("is-hidden", !visible);

                if (visible) {
                    visibleCount += 1;
                }
            });

            if (countText) {
                countText.textContent = "当前显示 " + visibleCount + " 部影片";
            }
        };

        if (keywordInput) {
            keywordInput.addEventListener("input", applyFilter);
        }

        if (yearSelect) {
            yearSelect.addEventListener("change", applyFilter);
        }
    }

    const searchPage = document.querySelector("[data-search-page]");

    if (searchPage && window.MovieSearchData) {
        const input = searchPage.querySelector("[data-search-input]");
        const category = searchPage.querySelector("[data-search-category]");
        const region = searchPage.querySelector("[data-search-region]");
        const year = searchPage.querySelector("[data-search-year]");
        const button = searchPage.querySelector("[data-search-button]");
        const reset = searchPage.querySelector("[data-search-reset]");
        const count = searchPage.querySelector("[data-search-count]");
        const results = document.getElementById("searchResults");
        const params = new URLSearchParams(window.location.search);
        const initialQuery = params.get("q") || "";

        const escapeHtml = function (value) {
            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        const createCard = function (item) {
            const tags = item.tags.slice(0, 3).map(function (tag) {
                return "<span>" + escapeHtml(tag) + "</span>";
            }).join("");

            return "" +
                "<article class=\"movie-card\">" +
                    "<a class=\"poster-link\" href=\"" + escapeHtml(item.url) + "\" aria-label=\"观看" + escapeHtml(item.title) + "\">" +
                        "<span class=\"poster-shell\">" +
                            "<img src=\"" + escapeHtml(item.cover) + "\" alt=\"" + escapeHtml(item.title) + "海报\" loading=\"lazy\" onerror=\"this.classList.add('image-failed');\" />" +
                            "<span class=\"poster-fallback\" aria-hidden=\"true\"><strong>" + escapeHtml(item.title.slice(0, 14)) + "</strong><small>" + escapeHtml(item.year) + " · " + escapeHtml(item.region) + "</small></span>" +
                            "<span class=\"quality-badge\">HD</span>" +
                            "<span class=\"score-badge\">" + escapeHtml(item.score) + "</span>" +
                        "</span>" +
                    "</a>" +
                    "<div class=\"movie-card-body\">" +
                        "<div class=\"movie-meta-line\"><a href=\"" + escapeHtml(item.categoryUrl) + "\">" + escapeHtml(item.category) + "</a><span>" + escapeHtml(item.year) + "</span></div>" +
                        "<h3><a href=\"" + escapeHtml(item.url) + "\">" + escapeHtml(item.title) + "</a></h3>" +
                        "<p>" + escapeHtml(item.oneLine) + "</p>" +
                        "<div class=\"movie-tags\">" + tags + "</div>" +
                    "</div>" +
                "</article>";
        };

        const applySearch = function () {
            const queryValue = (input.value || "").trim().toLowerCase();
            const categoryValue = category.value || "";
            const regionValue = (region.value || "").trim().toLowerCase();
            const yearValue = (year.value || "").trim();

            const matched = window.MovieSearchData.filter(function (item) {
                const haystack = [
                    item.title,
                    item.region,
                    item.type,
                    item.year,
                    item.genre,
                    item.category,
                    item.tags.join(" "),
                    item.oneLine
                ].join(" ").toLowerCase();

                return (!queryValue || haystack.indexOf(queryValue) !== -1) &&
                    (!categoryValue || item.category === categoryValue) &&
                    (!regionValue || String(item.region).toLowerCase().indexOf(regionValue) !== -1) &&
                    (!yearValue || String(item.year) === yearValue);
            }).slice(0, 120);

            results.innerHTML = matched.map(createCard).join("");
            count.textContent = "当前显示 " + matched.length + " 部影片" + (matched.length === 120 ? "，可继续缩小条件" : "");
        };

        if (initialQuery && input) {
            input.value = initialQuery;
        }

        [input, category, region, year].forEach(function (element) {
            if (element) {
                element.addEventListener("input", applySearch);
                element.addEventListener("change", applySearch);
            }
        });

        if (button) {
            button.addEventListener("click", applySearch);
        }

        if (reset) {
            reset.addEventListener("click", function () {
                input.value = "";
                category.value = "";
                region.value = "";
                year.value = "";
                applySearch();
            });
        }

        applySearch();
    }
})();
