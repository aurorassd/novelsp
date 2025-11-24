/**
 * Main Application Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    const storage = new StorageManager();

    // Initialize UI first to have access to elements
    // But UI needs player, and player needs callbacks that might update UI.
    // We'll create player first with callbacks that reference a ui instance variable that we set later,
    // or we pass a callback that calls the ui instance.

    let ui;

    const onPlayerStateChange = (event) => {
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
        if (event.data === YT.PlayerState.PLAYING) {
            ui.updatePlayPauseIcon(true);
        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            ui.updatePlayPauseIcon(false);
        }
    };

    const onPlayerReady = (event) => {
        const playerInstance = event.target;
        const data = playerInstance.getVideoData();
        if (data && data.title) {
            ui.updateVideoTitle(data.title);
        }
    };

    const onPlayerError = (event) => {
        // Error codes:
        // 2: Invalid parameter
        // 5: HTML5 player error
        // 100: Video not found or private
        // 101, 150: Embedding not allowed

        let message = 'エラーが発生しました。';
        const code = event.data;

        if (code === 100) {
            message = '動画が見つからないか、非公開です。';
        } else if (code === 101 || code === 150) {
            message = 'この動画は埋め込み再生が許可されていません。YouTubeで直接ご覧ください。';
        } else {
            message = `再生エラー (${code})。別の動画を試してください。`;
        }

        alert(message);
    };

    const player = new YouTubePlayer('player', onPlayerStateChange, onPlayerReady, onPlayerError);

    ui = new UIManager(player, storage);

    // Expose for debugging
    window.app = { player, ui, storage };
});
