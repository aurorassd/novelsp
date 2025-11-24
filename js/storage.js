/**
 * Storage Manager for LocalStorage operations
 */
class StorageManager {
    constructor() {
        this.BOOKMARKS_KEY = 'yt_player_bookmarks';
        this.HISTORY_KEY = 'yt_player_history';
        this.HISTORY_LIMIT = 50;
    }

    // --- Bookmarks ---

    /**
     * Get all bookmarks for a specific video
     * @param {string} videoId 
     * @returns {Array} List of bookmarks
     */
    getBookmarks(videoId) {
        const allBookmarks = this._getAllBookmarks();
        return allBookmarks[videoId] || [];
    }

    /**
     * Save a new bookmark
     * @param {string} videoId 
     * @param {number} time 
     * @param {string} name 
     */
    saveBookmark(videoId, time, name) {
        const allBookmarks = this._getAllBookmarks();
        if (!allBookmarks[videoId]) {
            allBookmarks[videoId] = [];
        }

        const newBookmark = {
            id: Date.now().toString(),
            time: time,
            name: name || `Bookmark at ${Utils.formatTime(time)}`,
            createdAt: Date.now()
        };

        allBookmarks[videoId].push(newBookmark);
        // Sort by time
        allBookmarks[videoId].sort((a, b) => a.time - b.time);

        localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(allBookmarks));
        return newBookmark;
    }

    /**
     * Delete a bookmark
     * @param {string} videoId 
     * @param {string} bookmarkId 
     */
    deleteBookmark(videoId, bookmarkId) {
        const allBookmarks = this._getAllBookmarks();
        if (allBookmarks[videoId]) {
            allBookmarks[videoId] = allBookmarks[videoId].filter(b => b.id !== bookmarkId);
            localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(allBookmarks));
        }
    }

    _getAllBookmarks() {
        const data = localStorage.getItem(this.BOOKMARKS_KEY);
        return data ? JSON.parse(data) : {};
    }

    // --- History ---

    /**
     * Get playback history
     * @returns {Array} List of history items
     */
    getHistory() {
        const data = localStorage.getItem(this.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Add or update video in history
     * @param {Object} videoData { videoId, title, lastTime }
     */
    addToHistory(videoData) {
        let history = this.getHistory();

        // Remove existing entry if present (to move it to top)
        history = history.filter(item => item.videoId !== videoData.videoId);

        // Add new entry to top
        history.unshift({
            ...videoData,
            updatedAt: Date.now()
        });

        // Limit size
        if (history.length > this.HISTORY_LIMIT) {
            history = history.slice(0, this.HISTORY_LIMIT);
        }

        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }

    /**
     * Clear entire history
     */
    clearHistory() {
        localStorage.removeItem(this.HISTORY_KEY);
    }
}
