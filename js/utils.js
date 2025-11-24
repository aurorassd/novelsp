/**
 * Utility functions for YouTube Advanced Player
 */

const Utils = {
    /**
     * Format seconds into MM:SS or HH:MM:SS
     * @param {number} seconds 
     * @returns {string} Formatted time string
     */
    formatTime: (seconds) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        const mStr = m.toString().padStart(2, '0');
        const sStr = s.toString().padStart(2, '0');
        
        if (h > 0) {
            return `${h}:${mStr}:${sStr}`;
        }
        return `${mStr}:${sStr}`;
    },

    /**
     * Extract Video ID from various YouTube URL formats
     * @param {string} url 
     * @returns {string|null} Video ID or null if invalid
     */
    extractVideoId: (url) => {
        if (!url) return null;
        
        // Handle standard URL: https://www.youtube.com/watch?v=VIDEO_ID
        // Handle short URL: https://youtu.be/VIDEO_ID
        // Handle embed URL: https://www.youtube.com/embed/VIDEO_ID
        
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    },

    /**
     * Debounce function to limit execution rate
     * @param {Function} func 
     * @param {number} wait 
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
