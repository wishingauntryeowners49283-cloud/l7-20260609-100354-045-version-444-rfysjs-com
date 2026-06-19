(function () {
    const players = document.querySelectorAll("[data-player]");

    players.forEach(function (player) {
        const video = player.querySelector("video");
        const button = player.querySelector("[data-play-button]");
        const overlay = player.querySelector(".player-overlay");
        const status = player.querySelector("[data-player-status]");
        const source = player.dataset.videoSrc;
        let initialized = false;
        let hlsInstance = null;

        const setStatus = function (message) {
            if (status) {
                status.textContent = message;
            }
        };

        const initialize = function () {
            if (initialized || !video || !source) {
                return;
            }

            initialized = true;

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                setStatus("播放器已使用浏览器原生 HLS 初始化。");
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90
                });

                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);

                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    setStatus("HLS 播放源已加载，可开始播放。");
                });

                hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
                    if (data && data.fatal) {
                        setStatus("播放源加载异常，请刷新页面后重试。");
                    }
                });
            } else {
                video.src = source;
                setStatus("当前浏览器不支持 HLS.js，已尝试直接加载播放源。");
            }
        };

        const playVideo = function () {
            initialize();

            const playPromise = video.play();

            if (playPromise && typeof playPromise.then === "function") {
                playPromise.then(function () {
                    if (overlay) {
                        overlay.classList.add("is-hidden");
                    }
                }).catch(function () {
                    setStatus("浏览器阻止了自动播放，请再次点击播放按钮。");
                });
            }
        };

        if (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                playVideo();
            });
        }

        if (video) {
            video.addEventListener("play", function () {
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
            });

            video.addEventListener("pause", function () {
                if (overlay && !video.ended) {
                    overlay.classList.remove("is-hidden");
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
