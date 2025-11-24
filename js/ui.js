/**
 * UI Manager for DOM interactions
 */
class UIManager {
    constructor(player, storage) {
        this.player = player;
        this.storage = storage;

        this.elements = {
            urlInput: document.getElementById('video-url'),
            loadBtn: document.getElementById('load-btn'),

            playPauseBtn: document.getElementById('play-pause-btn'),
            skipBackBtn: document.getElementById('skip-back-btn'),
            skipFwdBtn: document.getElementById('skip-fwd-btn'),
            rewindBtn: document.getElementById('rewind-btn'),
            forwardBtn: document.getElementById('forward-btn'),
            speedSelect: document.getElementById('speed-select'),

            setABtn: document.getElementById('set-a-btn'),
            setBBtn: document.getElementById('set-b-btn'),
            clearABBtn: document.getElementById('clear-ab-btn'),
            aMarker: document.getElementById('a-marker'),
            bMarker: document.getElementById('b-marker'),

            addBookmarkBtn: document.getElementById('add-bookmark-btn'),
            bookmarksList: document.getElementById('bookmarks-list'),

            clearHistoryBtn: document.getElementById('clear-history-btn'),
            historyList: document.getElementById('history-list')
        };

        this.currentVideoId = null;
        this.setupEventListeners();
        this.renderHistory();
    }

    setupEventListeners() {
        // URL Load
        this.elements.loadBtn.addEventListener('click', () => this.loadVideoFromInput());
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadVideoFromInput();
        });

        // Transport
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.skipBackBtn.addEventListener('click', () => this.player.seekBy(-10));
        this.elements.skipFwdBtn.addEventListener('click', () => this.player.seekBy(10));
        this.elements.rewindBtn.addEventListener('click', () => this.player.seekBy(-5));
        this.elements.forwardBtn.addEventListener('click', () => this.player.seekBy(5));

        // Speed
        this.elements.speedSelect.addEventListener('change', (e) => {
            this.player.setSpeed(e.target.value);
        });

        // A-B Repeat
        this.elements.setABtn.addEventListener('click', () => this.setAPoint());
        this.elements.setBBtn.addEventListener('click', () => this.setBPoint());
        this.elements.clearABBtn.addEventListener('click', () => this.clearABLoop());

        // Bookmarks
        this.elements.addBookmarkBtn.addEventListener('click', () => this.addBookmark());

        // History
        this.elements.clearHistoryBtn.addEventListener('click', () => {
            if (confirm('履歴をすべて削除しますか？')) {
                this.storage.clearHistory();
                this.renderHistory();
            }
        });
    }

    loadVideoFromInput() {
        const url = this.elements.urlInput.value.trim();
        const videoId = Utils.extractVideoId(url);

        if (videoId) {
            this.loadVideo(videoId);
        } else {
            alert('有効なYouTube URLを入力してください。');
        }
    }

    loadVideo(videoId) {
        this.currentVideoId = videoId;
        this.player.loadVideo(videoId);
        this.clearABLoop();
        this.renderBookmarks();

        // Add to history (will be updated with title when player is ready)
        this.storage.addToHistory({
            videoId: videoId,
            title: 'Loading...',
            lastTime: Date.now()
        });
        this.renderHistory();
    }

    togglePlayPause() {
        // This will be handled by checking player state, 
        // but for now we can't easily know state without querying player.
        // We'll rely on the player state change event to update the icon,
        // but here we just toggle.
        // Since we don't track internal state here, we might need to check player.
        // For simplicity, let's just assume if playing pause, if paused play.
        // But the API doesn't give a simple toggle.
        // We'll implement a simple check in player wrapper or just try to play/pause based on assumption.
        // Actually, let's just use play/pause based on current state if possible.
        // The player wrapper doesn't expose state directly yet.
        // Let's update player wrapper to expose state or just try to play.

        // Better approach: checking player state is async or requires polling.
        // Let's just trigger play for now, or maybe we can check player.getPlayerState() if available.
        // We will update the icon based on the callback.

        const state = this.player.player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            this.player.pause();
        } else {
            this.player.play();
        }
    }

    updatePlayPauseIcon(isPlaying) {
        const icon = this.elements.playPauseBtn.querySelector('.icon');
        icon.textContent = isPlaying ? '⏸️' : '▶️';
    }

    // --- A-B Loop UI ---

    setAPoint() {
        const time = this.player.setAPoint();
        this.elements.aMarker.querySelector('.time').textContent = Utils.formatTime(time);
        this.elements.aMarker.classList.add('active');
    }

    setBPoint() {
        const time = this.player.setBPoint();
        this.elements.bMarker.querySelector('.time').textContent = Utils.formatTime(time);
        this.elements.bMarker.classList.add('active');
    }

    clearABLoop() {
        this.player.clearLoop();
        this.elements.aMarker.querySelector('.time').textContent = '--:--';
        this.elements.bMarker.querySelector('.time').textContent = '--:--';
        this.elements.aMarker.classList.remove('active');
        this.elements.bMarker.classList.remove('active');
    }

    // --- Bookmarks UI ---

    addBookmark() {
        if (!this.currentVideoId) return;

        const time = this.player.getCurrentTime();
        const name = prompt('ブックマーク名を入力:', Utils.formatTime(time));

        if (name !== null) {
            this.storage.saveBookmark(this.currentVideoId, time, name);
            this.renderBookmarks();
        }
    }

    renderBookmarks() {
        const list = this.elements.bookmarksList;
        list.innerHTML = '';

        if (!this.currentVideoId) {
            list.innerHTML = '<div class="empty-state">動画を読み込んでください</div>';
            return;
        }

        const bookmarks = this.storage.getBookmarks(this.currentVideoId);

        if (bookmarks.length === 0) {
            list.innerHTML = '<div class="empty-state">保存された地点はありません</div>';
            return;
        }

        bookmarks.forEach(b => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${b.name}</div>
                    <div class="list-item-time">${Utils.formatTime(b.time)}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-sm btn-danger delete-btn">×</button>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    this.player.seekTo(b.time);
                }
            });

            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('削除しますか？')) {
                    this.storage.deleteBookmark(this.currentVideoId, b.id);
                    this.renderBookmarks();
                }
            });

            list.appendChild(item);
        });
    }

    // --- History UI ---

    renderHistory() {
        const list = this.elements.historyList;
        list.innerHTML = '';

        const history = this.storage.getHistory();

        if (history.length === 0) {
            list.innerHTML = '<div class="empty-state">履歴はありません</div>';
            return;
        }

        history.forEach(h => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${h.title || h.videoId}</div>
                    <div class="list-item-time">ID: ${h.videoId}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.elements.urlInput.value = `https://www.youtube.com/watch?v=${h.videoId}`;
                this.loadVideo(h.videoId);
            });

            list.appendChild(item);
        });
    }

    updateVideoTitle(title) {
        if (this.currentVideoId) {
            this.storage.addToHistory({
                videoId: this.currentVideoId,
                title: title,
                lastTime: Date.now()
            });
            this.renderHistory();
        }
    }
}
