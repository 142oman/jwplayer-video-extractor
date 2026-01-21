// JW Player Video Source Extractor Frontend

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('extractForm');
    const urlInput = document.getElementById('urlInput');
    const extractBtn = document.getElementById('extractBtn');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.getElementById('spinner');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const sourcesContainer = document.getElementById('sourcesContainer');
    const errorMessage = document.getElementById('errorMessage');
    const videoPlayerDiv = document.getElementById('videoPlayer');
    const closePlayerBtn = document.getElementById('closePlayerBtn');

    let player = null;

    // Video player functions
    function initVideoPlayer() {
        if (player) {
            player.dispose();
        }

        const options = {
            autoplay: false,
            controls: true,
            responsive: true,
            fluid: true,
            html5: {
                hls: {
                    overrideNative: !videojs.browser.IS_SAFARI
                }
            }
        };

        player = videojs('videoPlayerElement', options);
    }

    function playVideo(videoUrl, videoType) {
        if (!player) {
            initVideoPlayer();
        }

        // Reset player
        player.pause();
        player.currentTime(0);

        // Set source
        player.src({
            src: videoUrl,
            type: videoType || 'application/x-mpegURL'
        });

        // Show player
        videoPlayerDiv.style.display = 'block';
        videoPlayerDiv.scrollIntoView({ behavior: 'smooth' });

        // Start playing
        player.ready(function() {
            console.log('Player ready, attempting to play:', videoUrl);
            player.play().catch(function(error) {
                console.error('Error playing video:', error);
            });
        });
    }

    function closePlayer() {
        if (player) {
            player.pause();
        }
        videoPlayerDiv.style.display = 'none';
    }

    // Event listeners
    closePlayerBtn.addEventListener('click', closePlayer);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const url = urlInput.value.trim();
        if (!url) {
            showError('Please enter a valid URL');
            return;
        }

        // Show loading state
        setLoading(true);
        hideResults();
        hideError();

        try {
            const response = await fetch('/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (data.success) {
                displayResults(data.data);
            } else {
                showError(data.error || 'Failed to extract video sources');
            }
        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        extractBtn.disabled = loading;
        spinner.style.display = loading ? 'block' : 'none';
        btnText.textContent = loading ? 'Extracting...' : 'Extract Video Sources';
    }

    function displayResults(data) {
        if (!data || data.length === 0) {
            showError('No video sources found on this page');
            return;
        }

        sourcesContainer.innerHTML = '';

        data.forEach((item, index) => {
            if (item.sources && item.sources.length > 0) {
                const sourceItem = createSourceItem(item, index);
                sourcesContainer.appendChild(sourceItem);
            }
        });

        resultsDiv.style.display = 'block';
    }

    function createSourceItem(item, index) {
        const sourceItem = document.createElement('div');
        sourceItem.className = 'source-item';

        const title = document.createElement('h3');
        title.textContent = item.title || `Source Set ${index + 1}`;
        sourceItem.appendChild(title);

        const sourceLinks = document.createElement('div');
        sourceLinks.className = 'source-links';

        item.sources.forEach((source, sourceIndex) => {
            const sourceLink = createSourceLink(source, sourceIndex);
            sourceLinks.appendChild(sourceLink);
        });

        sourceItem.appendChild(sourceLinks);
        return sourceItem;
    }

    function createSourceLink(source, index) {
        const sourceLink = document.createElement('div');
        sourceLink.className = 'source-link';

        const sourceInfo = document.createElement('div');
        sourceInfo.className = 'source-info';

        const sourceUrl = document.createElement('a');
        sourceUrl.className = 'source-url';
        sourceUrl.href = source.file || source.src || source;
        sourceUrl.target = '_blank';
        sourceUrl.textContent = source.file || source.src || source;

        const sourceType = document.createElement('div');
        sourceType.className = 'source-type';
        sourceType.textContent = `Type: ${source.type || 'Unknown'} | Label: ${source.label || 'N/A'}`;

        sourceInfo.appendChild(sourceUrl);
        sourceInfo.appendChild(sourceType);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy URL';
        copyBtn.addEventListener('click', () => copyToClipboard(source.file || source.src || source, copyBtn));

        buttonContainer.appendChild(copyBtn);

        // Add play button for video sources
        const videoUrl = source.file || source.src || source;
        const videoType = source.type || 'application/x-mpegURL';

        if (videoUrl && (videoUrl.includes('.m3u8') || videoUrl.includes('.mp4') || videoType.includes('mpegurl') || videoType.includes('mp4'))) {
            const playBtn = document.createElement('button');
            playBtn.className = 'play-btn';
            playBtn.textContent = 'Play Video';
            playBtn.addEventListener('click', () => playVideo(videoUrl, videoType));
            buttonContainer.appendChild(playBtn);
        }

        sourceLink.appendChild(sourceInfo);
        sourceLink.appendChild(buttonContainer);

        return sourceLink;
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');

            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = 'Copy URL';
                button.classList.remove('copied');
            }, 2000);
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function hideResults() {
        resultsDiv.style.display = 'none';
    }
});