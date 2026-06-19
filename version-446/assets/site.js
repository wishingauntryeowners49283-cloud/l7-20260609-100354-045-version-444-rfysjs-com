document.addEventListener("DOMContentLoaded", function () {
  setupNavigation();
  setupListingSearch();
  setupHeroQuery();
  setupPlayer();
});

function setupNavigation() {
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-nav-menu]");
  if (!toggle || !menu) {
    return;
  }
  toggle.addEventListener("click", function () {
    menu.classList.toggle("is-open");
  });
}

function setupHeroQuery() {
  var listings = document.querySelectorAll("[data-listing]");
  if (!listings.length) {
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var query = params.get("q");
  if (!query) {
    return;
  }
  listings.forEach(function (listing) {
    var input = listing.querySelector("[data-search-input]");
    if (input) {
      input.value = query;
      input.dispatchEvent(new Event("input"));
    }
  });
}

function setupListingSearch() {
  document.querySelectorAll("[data-listing]").forEach(function (listing) {
    var input = listing.querySelector("[data-search-input]");
    var clear = listing.querySelector("[data-clear-search]");
    var cards = Array.prototype.slice.call(listing.querySelectorAll("[data-movie-card]"));
    var message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "没有找到匹配内容";

    function textOf(card) {
      return [
        card.getAttribute("data-title"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-region"),
        card.getAttribute("data-year"),
        card.textContent
      ].join(" ").toLowerCase();
    }

    function apply() {
      var value = input ? input.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (card) {
        var matched = !value || textOf(card).indexOf(value) !== -1;
        card.classList.toggle("is-hidden-card", !matched);
        if (matched) {
          shown += 1;
        }
      });
      if (!shown && cards.length) {
        if (!message.parentNode) {
          listing.querySelector(".listing-grid").appendChild(message);
        }
      } else if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    if (clear) {
      clear.addEventListener("click", function () {
        if (input) {
          input.value = "";
        }
        apply();
      });
    }
    apply();
  });
}

function setupPlayer() {
  document.querySelectorAll("[data-player]").forEach(function (shell) {
    var video = shell.querySelector("video");
    var trigger = shell.querySelector("[data-play-trigger]");
    if (!video || !trigger) {
      return;
    }
    var streamUrl = video.getAttribute("data-video-url");
    var loaded = false;

    function attachStream() {
      if (loaded || !streamUrl) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      attachStream();
      trigger.classList.add("is-hidden");
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          trigger.classList.remove("is-hidden");
        });
      }
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      play();
    });

    shell.addEventListener("click", function (event) {
      if (event.target === shell) {
        play();
      }
    });
  });
}
