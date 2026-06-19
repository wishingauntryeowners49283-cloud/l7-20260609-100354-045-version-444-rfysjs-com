
import { H as Hls } from './hls-vendor.js';

function initHlsPlayer(container) {
    var video = container.querySelector('video');
    var button = container.querySelector('[data-player-toggle]');
    var message = container.querySelector('[data-player-message]');
    var source = container.getAttribute('data-src');
    var hlsInstance = null;
    var attached = false;

    if (!video || !source) {
        return;
    }

    function setMessage(text) {
        if (message) {
            message.textContent = text;
        }
    }

    function attachSource() {
        if (attached) {
            return Promise.resolve();
        }

        attached = true;
        setMessage('正在加载播放源...');

        if (Hls && Hls.isSupported && Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);

            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                setMessage('播放源已就绪');
            });

            hlsInstance.on(Hls.Events.ERROR, function (_, data) {
                if (data && data.fatal) {
                    setMessage('视频加载失败，请稍后重试');
                }
            });

            return Promise.resolve();
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            setMessage('播放源已就绪');
            return Promise.resolve();
        }

        setMessage('当前浏览器不支持 HLS 播放');
        return Promise.reject(new Error('HLS is not supported'));
    }

    function playVideo() {
        attachSource().then(function () {
            return video.play();
        }).catch(function () {
            setMessage('请再次点击播放或更换浏览器尝试');
        });
    }

    if (button) {
        button.addEventListener('click', playVideo);
    }

    video.addEventListener('play', function () {
        container.classList.add('is-playing');
        setMessage('正在播放');
    });

    video.addEventListener('pause', function () {
        container.classList.remove('is-playing');
        setMessage('已暂停，点击继续播放');
    });

    video.addEventListener('loadedmetadata', function () {
        setMessage('播放源已就绪');
    });

    video.addEventListener('click', function () {
        if (video.paused) {
            playVideo();
        }
    });

    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-hls-player]').forEach(initHlsPlayer);
});
