/**
 * Wrapper for YouTube IFrame Player API
 */
class YouTubePlayer {
    constructor(containerId, onStateChange, onReady, onError) {
        this.containerId = containerId;
        this.player = null;
        this.onStateChangeCallback = onStateChange;
        this.onReadyCallback = onReady;
        this.onErrorCallback = onError;

        this.loopInterval = null;
        this.aPoint = null;
        this.bPoint = null;
        this.isLooping = false;

        this.init();
    }

    init() {
        // Load YouTube API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Define global callback
            window.onYouTubeIframeAPIReady = () => {
                this.createPlayer();
            };
        } else if (window.YT && window.YT.Player) {
            this.createPlayer();
        }
    }

    createPlayer() {
        this.player = new YT.Player(this.containerId, {
            height: '100%',
            width: '100%',
            playerVars: {
                'playsinline': 1,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onReady': (event) => {
                    this.startLoopCheck();
                    if (this.onReadyCallback) this.onReadyCallback(event);
                },
                'onStateChange': (event) => {
                    if (this.onStateChangeCallback) this.onStateChangeCallback(event);
                },
                'onError': (event) => {
                    if (this.onErrorCallback) this.onErrorCallback(event);
                }
            }
        });
    }

    loadVideo(videoId) {
        if (this.player && this.player.loadVideoById) {
            this.player.loadVideoById(videoId);
            this.resetLoop();
        }
    }

    play() {
        if (this.player && this.player.playVideo) this.player.playVideo();
    }

    pause() {
        if (this.player && this.player.pauseVideo) this.player.pauseVideo();
    }

    seekTo(seconds) {
        if (this.player && this.player.seekTo) {
            this.player.seekTo(seconds, true);
        }
    }

    seekBy(seconds) {
        if (this.player && this.player.getCurrentTime) {
            const current = this.player.getCurrentTime();
            this.seekTo(current + seconds);
        }
    }

    setSpeed(rate) {
        if (this.player && this.player.setPlaybackRate) {
            this.player.setPlaybackRate(parseFloat(rate));
        }
    }

    getCurrentTime() {
        return (this.player && this.player.getCurrentTime) ? this.player.getCurrentTime() : 0;
    }

    getDuration() {
        return (this.player && this.player.getDuration) ? this.player.getDuration() : 0;
    }

    getVideoData() {
        return (this.player && this.player.getVideoData) ? this.player.getVideoData() : null;
    }

    // --- A-B Loop Logic ---

    setAPoint() {
        this.aPoint = this.getCurrentTime();
        this.checkLoopState();
        return this.aPoint;
    }

    setBPoint() {
        this.bPoint = this.getCurrentTime();
        // Ensure B is after A
        if (this.aPoint !== null && this.bPoint < this.aPoint) {
            [this.aPoint, this.bPoint] = [this.bPoint, this.aPoint];
        }
        this.checkLoopState();
        return this.bPoint;
    }

    clearLoop() {
        this.aPoint = null;
        this.bPoint = null;
        this.isLooping = false;
    }

    resetLoop() {
        this.clearLoop();
    }

    checkLoopState() {
        if (this.aPoint !== null && this.bPoint !== null) {
            this.isLooping = true;
        } else {
            this.isLooping = false;
        }
    }

    startLoopCheck() {
        if (this.loopInterval) clearInterval(this.loopInterval);

        this.loopInterval = setInterval(() => {
            if (!this.player || !this.isLooping) return;

            const current = this.getCurrentTime();

            // If we passed B point, go back to A
            // Add a small buffer (0.5s) to prevent glitching if seeking exactly to B
            if (current >= this.bPoint) {
                this.seekTo(this.aPoint);
            }

            // If we are before A point (user seeked back), let it play until B

        }, 100); // Check every 100ms
    }
}
