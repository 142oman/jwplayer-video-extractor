(function () {
    // hii Prevent FOUC by hiding the body as soon as this script is executed
    const style = document.createElement('style');
    style.id = 'txtml-hide-body';
    style.innerHTML = 'body { display: none !important; }';
    document.documentElement.appendChild(style);

    window.addEventListener('DOMContentLoaded', async () => {
        // Clone body to extract text
        let clone = document.body.cloneNode(true);
        clone.querySelectorAll('script, style').forEach(e => e.remove());
        let text = clone.textContent.replace(/^\s*[\r\n]/, '').trimEnd();

        // Check for encryption
        if (text.startsWith('encrypted:')) {
            let base64 = text.substring('encrypted:'.length).trim();
            // Ask for password
            let pwd = prompt("This document is encrypted. Enter password:");
            if (!pwd) {
                document.body.innerHTML = '<h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">Decryption Cancelled</h1><p style="text-align:center; font-family:sans-serif;">Refresh the page to try again.</p>';
                document.body.style.display = 'block';
                return;
            }
            try {
                text = await decryptTxtml(base64, pwd);
                text = text.replace(/^\s*[\r\n]/, '').trimEnd();
            } catch (e) {
                document.body.innerHTML = '<h1 style="font-family:sans-serif; text-align:center; margin-top:50px; color:red;">Decryption Failed</h1><p style="text-align:center; font-family:sans-serif;">Incorrect password or corrupted data.</p>';
                document.body.style.display = 'block';
                return;
            }
        }

        let parsedHTML = parseTxtml(text);

        // Inject Default Styles 
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
        document.head.appendChild(fontLink);

        const daisyLink = document.createElement('link');
        daisyLink.rel = 'stylesheet';
        daisyLink.href = 'https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css';
        document.head.appendChild(daisyLink);

        const uiStyle = document.createElement('style');
        uiStyle.innerHTML = `
            :root {
                --bg: #ffffff;
                --bg-secondary: #f8f9fa;
                --bg-tertiary: #f0f1f3;
                --text: #1a1a2e;
                --text-secondary: #555b6e;
                --text-muted: #8b949e;
                --accent: #1a1a2e;
                --link: #2563eb;
                --border: #d1d5db;
                --border-light: #e5e7eb;
                --warning: #dc2626;
                --warning-bg: #fef2f2;
                --success: #16a34a;
                --success-bg: #f0fdf4;
                --info: #2563eb;
                --info-bg: #eff6ff;
                --highlight: #f59e0b;
                --highlight-bg: #fffbeb;
                --code-bg: #1e1e2e;
                --code-text: #cdd6f4;
                --note-bg: #f8f9fa;
                --toc-bg: #f8f9fa;
                --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
                --shadow-md: 0 2px 8px rgba(0,0,0,0.06);
                --radius: 8px;
            }
            /* Mapping daisyUI variables to TextML variables (daisyUI v4 uses raw oklch values) */
            :root[data-theme] {
                --bg: oklch(var(--b1));
                --bg-secondary: oklch(var(--b2, var(--b1)));
                --bg-tertiary: oklch(var(--b3, var(--b2)));
                --text: oklch(var(--bc));
                --text-secondary: oklch(var(--bc) / 0.7);
                --text-muted: oklch(var(--bc) / 0.5);
                --accent: oklch(var(--p));
                --link: oklch(var(--p));
                --border: oklch(var(--bc) / 0.15);
                --border-light: oklch(var(--bc) / 0.08);
                --warning: oklch(var(--wa));
                --warning-bg: oklch(var(--wa) / 0.1);
                --success: oklch(var(--su));
                --success-bg: oklch(var(--su) / 0.1);
                --info: oklch(var(--in));
                --info-bg: oklch(var(--in) / 0.1);
                --highlight: oklch(var(--a));
                --highlight-bg: oklch(var(--a) / 0.1);
                --code-bg: oklch(var(--n));
                --code-text: oklch(var(--nc));
                --note-bg: oklch(var(--b2, var(--b1)));
                --toc-bg: oklch(var(--b2, var(--b1)));
            }
            body.dark-mode {
                --bg: #181825;
                --bg-secondary: #1e1e2e;
                --bg-tertiary: #313244;
                --text: #cdd6f4;
                --text-secondary: #a6adc8;
                --text-muted: #6c7086;
                --accent: #cdd6f4;
                --link: #89b4fa;
                --border: #45475a;
                --border-light: #313244;
                --warning: #f38ba8;
                --warning-bg: #2a1f28;
                --success: #a6e3a1;
                --success-bg: #1e2a24;
                --info: #89b4fa;
                --info-bg: #1e2536;
                --highlight: #f9e2af;
                --highlight-bg: #2a2620;
                --code-bg: #11111b;
                --code-text: #cdd6f4;
                --note-bg: #1e1e2e;
                --toc-bg: #1e1e2e;
                --shadow-sm: 0 1px 2px rgba(0,0,0,0.15);
                --shadow-md: 0 2px 8px rgba(0,0,0,0.25);
            }

            * { box-sizing: border-box; }
            html { scroll-behavior: smooth; }

            body {
                margin: 0 auto;
                max-width: 720px;
                line-height: 1.75;
                font-size: 16px;
                color: var(--text);
                padding: 48px 28px 80px;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                background-color: var(--bg);
                transition: background-color 0.25s ease, color 0.25s ease;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Reading progress bar */
            #txtml-progress {
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 3px;
                background: linear-gradient(90deg, var(--link), var(--success));
                z-index: 9999;
                transition: width 0.1s linear;
                border-radius: 0 2px 2px 0;
            }

            h1, h2, h3, h4 { 
                line-height: 1.3; 
                margin-top: 2em;
                margin-bottom: 0.6em;
                font-weight: 650;
                letter-spacing: -0.02em;
                color: var(--text);
            }
            h1 { 
                font-size: 1.85em; 
                border-bottom: 2px solid var(--border-light); 
                padding-bottom: 0.35em; 
            }
            h2 { 
                font-size: 1.4em; 
                border-bottom: 1px solid var(--border-light); 
                padding-bottom: 0.25em; 
            }
            h3 { font-size: 1.15em; }
            h4 { font-size: 1em; color: var(--text-secondary); }

            /* ----------- BLOCK STYLES ----------- */

            .block-card {
                border: 1px solid var(--border);
                padding: 18px 22px;
                margin: 20px 0;
                background: var(--bg-secondary);
                border-radius: var(--radius);
                box-shadow: var(--shadow-sm);
            }
            .block-quote {
                border-left: 3px solid var(--text-muted);
                padding: 6px 20px;
                margin: 20px 0;
                color: var(--text-secondary);
                font-style: italic;
                background: var(--bg-secondary);
                border-radius: 0 var(--radius) var(--radius) 0;
            }
            .block-warning {
                border: 1px solid var(--warning);
                border-left: 4px solid var(--warning);
                padding: 14px 18px;
                margin: 20px 0;
                background: var(--warning-bg);
                color: var(--warning);
                font-weight: 500;
                border-radius: var(--radius);
                display: flex;
                gap: 14px;
            }
            .block-success {
                border: 1px solid var(--success);
                border-left: 4px solid var(--success);
                padding: 14px 18px;
                margin: 20px 0;
                background: var(--success-bg);
                color: var(--success);
                font-weight: 500;
                border-radius: var(--radius);
                display: flex;
                gap: 14px;
            }
            .block-info {
                border: 1px solid var(--info);
                border-left: 4px solid var(--info);
                padding: 14px 18px;
                margin: 20px 0;
                background: var(--info-bg);
                color: var(--info);
                font-weight: 500;
                border-radius: var(--radius);
                display: flex;
                gap: 14px;
            }
            .block-highlight {
                border: 1px solid var(--highlight);
                border-left: 4px solid var(--highlight);
                padding: 14px 18px;
                margin: 20px 0;
                background: var(--highlight-bg);
                border-radius: var(--radius);
                display: flex;
                gap: 14px;
            }
            .block-icon-wrapper {
                flex-shrink: 0;
                margin-top: 1px;
            }
            .block-icon {
                width: 22px;
                height: 22px;
            }
            .block-content {
                flex: 1;
                min-width: 0;
            }
            .block-content > p:first-child { margin-top: 0; }
            .block-content > p:last-child { margin-bottom: 0; }
            .block-code {
                background: var(--code-bg);
                color: var(--code-text);
                padding: 18px 22px;
                margin: 20px 0;
                font-family: 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
                font-size: 0.85em;
                border-radius: var(--radius);
                overflow-x: auto;
                line-height: 1.65;
                box-shadow: var(--shadow-md);
                position: relative;
            }
            .block-code .code-copy-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(255,255,255,0.08);
                color: var(--code-text);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 4px;
                padding: 3px 10px;
                font-size: 11px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s, background 0.2s;
                font-family: inherit;
            }
            .block-code:hover .code-copy-btn {
                opacity: 1;
            }
            .block-code .code-copy-btn:hover {
                background: rgba(255,255,255,0.15);
            }
            .block-note {
                border: 1px solid var(--border);
                border-left: 3px solid var(--text-muted);
                padding: 14px 18px;
                margin: 20px 0;
                background: var(--note-bg);
                border-radius: var(--radius);
                font-size: 0.95em;
            }
            .block-details {
                border: 1px solid var(--border);
                margin: 20px 0;
                border-radius: var(--radius);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            }
            .block-details summary {
                padding: 14px 18px;
                background: var(--bg-secondary);
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95em;
                color: var(--text);
                user-select: none;
                list-style: none;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.15s;
            }
            .block-details summary:hover {
                background: var(--bg-tertiary);
            }
            .block-details summary::before {
                content: '▸';
                font-size: 0.85em;
                transition: transform 0.2s ease;
                display: inline-block;
                color: var(--text-muted);
            }
            .block-details[open] summary::before {
                transform: rotate(90deg);
            }
            .block-details summary::-webkit-details-marker {
                display: none;
            }
            .block-details .details-content {
                padding: 14px 18px;
                background: var(--bg);
                border-top: 1px solid var(--border-light);
            }

            /* TOC */
            .block-toc {
                border: 1px solid var(--border);
                margin: 24px 0;
                background: var(--toc-bg);
                border-radius: var(--radius);
                box-shadow: var(--shadow-sm);
                overflow: hidden;
            }
            .block-toc .toc-header {
                padding: 14px 20px;
                background: var(--bg-secondary);
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                transition: background 0.15s;
            }
            .block-toc .toc-header:hover {
                background: var(--bg-tertiary);
            }
            .block-toc .toc-header h2 {
                margin: 0;
                font-size: 0.8em;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-weight: 600;
                border-bottom: none;
                padding-bottom: 0;
            }
            .block-toc .toc-chevron {
                font-size: 0.7em;
                color: var(--text-muted);
                transition: transform 0.25s ease;
            }
            .block-toc.collapsed .toc-chevron {
                transform: rotate(-90deg);
            }
            .block-toc .toc-body {
                padding: 10px 20px 16px;
                overflow: hidden;
                max-height: 2000px;
                transition: max-height 0.35s ease, padding 0.35s ease, opacity 0.25s ease;
                opacity: 1;
            }
            .block-toc.collapsed .toc-body {
                max-height: 0;
                padding-top: 0;
                padding-bottom: 0;
                opacity: 0;
            }
            .block-toc ul { list-style-type: none; padding-left: 0; margin: 0; }
            .block-toc li { margin-bottom: 0.35em; }
            .block-toc a {
                color: var(--link);
                font-weight: 400;
                font-size: 0.95em;
                transition: color 0.15s;
            }
            .block-toc a:hover {
                text-decoration: underline;
            }

            /* Table */
            .block-table {
                margin: 20px 0;
                overflow-x: auto;
                border-radius: var(--radius);
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--border);
            }
            .txtml-table {
                width: 100%;
                border-collapse: collapse;
                background: var(--bg);
                color: var(--text);
                font-size: 0.9em;
            }
            .txtml-table td {
                border: 1px solid var(--border-light);
                padding: 10px 14px;
            }
            .txtml-table tr:first-child td {
                font-weight: 600;
                background: var(--bg-secondary);
                color: var(--text);
                border-bottom: 2px solid var(--border);
            }
            .txtml-table tr:nth-child(even) {
                background: var(--bg-secondary);
            }
            .txtml-table tr:hover {
                background: var(--bg-tertiary);
            }

            /* Lists */
            ul {
                padding-left: 24px;
                margin-bottom: 1em;
                line-height: 1.75;
            }
            li { margin-bottom: 0.35em; }

            /* Checklist */
            .txtml-checklist {
                list-style: none;
                padding-left: 4px;
            }
            .txtml-checklist li {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                margin-bottom: 0.4em;
            }
            .txtml-checklist .check-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                min-width: 20px;
                border-radius: 4px;
                margin-top: 3px;
                font-size: 12px;
                font-weight: 700;
            }
            .txtml-checklist .check-icon.checked {
                background: var(--success);
                color: #fff;
            }
            .txtml-checklist .check-icon.unchecked {
                background: var(--bg-tertiary);
                border: 2px solid var(--border);
                color: transparent;
            }
            .txtml-checklist .check-text.done {
                text-decoration: line-through;
                color: var(--text-muted);
            }

            a { 
                color: var(--link); 
                text-decoration: none;
                transition: color 0.15s;
            }
            a:hover { 
                text-decoration: underline;
            }
            p { 
                margin-bottom: 1em; 
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: inherit;
            }
            hr {
                border: 0;
                border-bottom: 1px solid var(--border-light);
                margin: 32px 0;
            }

            /* Inline formatting */
            strong, b { font-weight: 650; }
            em, i { font-style: italic; }
            code.inline-code {
                background: var(--bg-tertiary);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'JetBrains Mono', 'Consolas', monospace;
                font-size: 0.88em;
                border: 1px solid var(--border-light);
                color: var(--text);
            }
            del { 
                text-decoration: line-through;
                color: var(--text-muted);
            }
            mark {
                background: var(--highlight-bg);
                border-bottom: 2px solid var(--highlight);
                padding: 1px 4px;
                border-radius: 2px;
            }
            kbd {
                background: var(--bg-tertiary);
                border: 1px solid var(--border);
                border-bottom: 2px solid var(--border);
                border-radius: 4px;
                padding: 2px 7px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.85em;
                color: var(--text);
                box-shadow: 0 1px 0 rgba(0,0,0,0.05);
            }

            /* Theme toggle */
            #txtml-theme-toggle {
                position: fixed;
                top: 16px;
                right: 16px;
                background: var(--bg-secondary);
                color: var(--text-secondary);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 7px 12px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
                z-index: 1000;
                font-family: inherit;
                line-height: 1;
                box-shadow: var(--shadow-sm);
            }
            #txtml-theme-toggle:hover {
                background: var(--bg-tertiary);
                color: var(--text);
                box-shadow: var(--shadow-md);
            }

            /* Scroll to top */
            #txtml-scroll-top {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: var(--bg-secondary);
                color: var(--text-secondary);
                border: 1px solid var(--border);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                font-size: 18px;
                cursor: pointer;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: var(--shadow-md);
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: opacity 0.25s, visibility 0.25s, transform 0.25s, background 0.2s, color 0.2s;
            }
            #txtml-scroll-top.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            #txtml-scroll-top:hover {
                background: var(--bg-tertiary);
                color: var(--text);
            }

            /* Encryptor */
            .txtml-enc-input {
                width: 100%; padding: 10px 14px; margin-bottom: 10px;
                border: 1px solid var(--border); box-sizing: border-box;
                background: var(--bg); color: var(--text);
                font-family: 'JetBrains Mono', monospace; font-size: 14px;
                outline: none; border-radius: var(--radius);
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .txtml-enc-input:focus {
                border-color: var(--link);
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                outline: none;
            }
            .txtml-enc-btn {
                padding: 9px 18px; background: var(--bg-tertiary); color: var(--text);
                font-weight: 500; border: 1px solid var(--border); cursor: pointer;
                border-radius: var(--radius);
                transition: background 0.15s, box-shadow 0.15s;
                font-family: inherit; font-size: 14px;
            }
            .txtml-enc-btn:hover {
                background: var(--border-light);
                box-shadow: var(--shadow-sm);
            }
            .txtml-enc-btn:active {
                background: var(--border);
            }

            ::selection {
                background: var(--link);
                color: #fff;
            }

            /* Image block */
            .block-image {
                margin: 20px 0;
                text-align: center;
            }
            .block-image img {
                max-width: 100%;
                border-radius: var(--radius);
                box-shadow: var(--shadow-md);
            }
            .block-image .img-caption {
                margin-top: 8px;
                font-size: 0.85em;
                color: var(--text-muted);
                font-style: italic;
            }

            /* Numbered list (ordered) */
            ol {
                padding-left: 24px;
                margin-bottom: 1em;
                line-height: 1.75;
            }
            ol li { margin-bottom: 0.35em; }

            /* Badges */
            .txtml-badge {
                display: inline-block;
                padding: 2px 10px;
                border-radius: 99px;
                font-size: 0.78em;
                font-weight: 600;
                letter-spacing: 0.02em;
            }
            .txtml-badge-default { background: var(--bg-tertiary); color: var(--text-secondary); }
            .txtml-badge-success { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
            .txtml-badge-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning); }
            .txtml-badge-info { background: var(--info-bg); color: var(--info); border: 1px solid var(--info); }

            /* Footnotes */
            .txtml-footnote-ref {
                font-size: 0.75em;
                vertical-align: super;
                color: var(--link);
                cursor: pointer;
                font-weight: 600;
            }
            .txtml-footnotes {
                border-top: 1px solid var(--border-light);
                margin-top: 40px;
                padding-top: 16px;
                font-size: 0.9em;
                color: var(--text-secondary);
            }

            /* Filename Indicator */
            .txtml-filename-indicator {
                position: fixed;
                top: 12px;
                left: 12px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                color: var(--text-muted);
                padding: 5px 12px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-light);
                border-radius: 6px;
                z-index: 1000;
                opacity: 0.85;
                text-transform: lowercase;
                font-weight: 500;
                box-shadow: var(--shadow-sm);
                cursor: pointer;
                transition: all 0.2s ease;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                user-select: none;
            }
            .txtml-filename-indicator:hover {
                opacity: 1;
                background: var(--bg-secondary);
                border-color: var(--link);
                color: var(--link);
                max-width: 600px;
                box-shadow: var(--shadow-md);
            }
            .txtml-filename-indicator.full-path {
                max-width: 80vw;
                background: var(--bg);
                color: var(--text);
                border-color: var(--border);
            }

            @media (max-width: 600px) {
                body {
                    padding: 20px 16px 60px;
                    font-size: 15px;
                }
                h1 { font-size: 1.55em; }
                h2 { font-size: 1.25em; }
                #txtml-scroll-top {
                    bottom: 16px;
                    right: 16px;
                    width: 36px;
                    height: 36px;
                    font-size: 16px;
                }
                .txtml-filename-indicator {
                    display: none;
                }
            }

            @media print {
                #txtml-theme-toggle, #txtml-scroll-top, #txtml-progress { display: none !important; }
                body { max-width: 100%; padding: 20px; }
            }
        `;
        document.head.appendChild(uiStyle);

        // Replace body content with parsed HTML
        document.body.innerHTML = parsedHTML;

        // Load Twitter widget dynamically if any twitter-tweet blockquotes exist
        // (scripts set via innerHTML are inert; we must load it programmatically)
        if (document.querySelector('blockquote.twitter-tweet')) {
            const twitterScript = document.createElement('script');
            twitterScript.src = 'https://platform.twitter.com/widgets.js';
            twitterScript.async = true;
            twitterScript.charset = 'utf-8';
            twitterScript.onload = () => {
                if (window.twttr && window.twttr.widgets) {
                    window.twttr.widgets.load();
                }
            };
            document.head.appendChild(twitterScript);
        }

        // Setup encryptors if present
        const encryptorBlocks = document.querySelectorAll('.txtml-encryptor-ui');
        encryptorBlocks.forEach(container => {
            const actionBtn = container.querySelector('.txtml-enc-action-btn');
            actionBtn.addEventListener('click', async () => {
                const textNode = container.querySelector('.txtml-enc-text');
                const keyNode = container.querySelector('.txtml-enc-key');
                const text = textNode.value;
                const key = keyNode.value;
                if (!text || !key) return alert("Please provide both text and a key.");

                try {
                    const encryptedBase64 = await window.encryptTxtml(text, key);
                    const outContainer = container.querySelector('.txtml-enc-out-container');
                    const outDiv = container.querySelector('.txtml-enc-out');
                    outContainer.style.display = 'block';
                    outDiv.innerText = "<script src=\"engine.js\"></" + "script>\nencrypted:\n" + encryptedBase64;
                } catch (err) {
                    alert("Encryption failed: " + err);
                }
            });

            const copyBtn = container.querySelector('.txtml-enc-copy');
            copyBtn.addEventListener('click', () => {
                const outDiv = container.querySelector('.txtml-enc-out');
                navigator.clipboard.writeText(outDiv.innerText).then(() => {
                    const oldText = copyBtn.innerText;
                    copyBtn.innerText = "Copied!";
                    setTimeout(() => copyBtn.innerText = oldText, 2000);
                });
            });
        });

        // Setup code copy buttons
        document.querySelectorAll('.block-code').forEach(block => {
            const btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                const code = block.textContent.replace('Copy', '').replace('Copied!', '').trim();
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            });
            block.appendChild(btn);
        });

        // Setup TOC collapse
        document.querySelectorAll('.block-toc .toc-header').forEach(header => {
            header.addEventListener('click', () => {
                const toc = header.closest('.block-toc');
                toc.classList.toggle('collapsed');
            });
        });

        // Inject viewport meta for mobile responsiveness
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }

        // Add reading progress bar
        const progressBar = document.createElement('div');
        progressBar.id = 'txtml-progress';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                progressBar.style.width = Math.min((scrollTop / docHeight) * 100, 100) + '%';
            }
        });

        // Add theme selector
        const themes = ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset", "caramellatte", "abyss", "silk"];

        const themeSelector = document.createElement('select');
        themeSelector.id = 'txtml-theme-toggle';
        themeSelector.title = "Select Theme";

        themes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.innerText = t.charAt(0).toUpperCase() + t.slice(1);
            themeSelector.appendChild(opt);
        });

        const updateTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('txtml-theme', theme);

            // Sync with legacy dark-mode class for secondary styles
            const isDark = ['dark', 'dracula', 'black', 'luxury', 'halloween', 'forest', 'night', 'abyss', 'synthwave', 'coffee', 'dim', 'sunset'].includes(theme);
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        };

        const savedTheme = localStorage.getItem('txtml-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        themeSelector.value = savedTheme;
        updateTheme(savedTheme);

        themeSelector.addEventListener('change', () => {
            updateTheme(themeSelector.value);
        });
        document.body.appendChild(themeSelector);

        // Add Filename Indicator
        const fullPath = decodeURI(window.location.href).split('#')[0].split('?')[0];
        let fileName = fullPath.split('/').pop();
        if (!fileName || fileName === 'index.html') fileName = 'index';
        else fileName = fileName.replace(/\.html$/i, '');

        const fileIndicator = document.createElement('div');
        fileIndicator.className = 'txtml-filename-indicator';
        fileIndicator.innerText = fileName;
        fileIndicator.title = "Click to show full path";

        fileIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            fileIndicator.classList.toggle('full-path');
            if (fileIndicator.classList.contains('full-path')) {
                fileIndicator.innerText = fullPath;
            } else {
                fileIndicator.innerText = fileName;
            }
        });

        document.body.appendChild(fileIndicator);

        // Add scroll-to-top button
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'txtml-scroll-top';
        scrollBtn.innerHTML = '↑';
        scrollBtn.title = 'Scroll to top';
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.body.appendChild(scrollBtn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        // Remove the hide-body style
        const hideStyle = document.getElementById('txtml-hide-body');
        if (hideStyle) hideStyle.remove();

        document.body.style.display = 'block';
    });

    function parseTxtml(text) {
        const lines = text.split(/\r?\n/);
        let html = '';
        let blockStack = [];
        let blockContent = [];
        let pBuffer = [];
        let tocData = [];
        let inList = false;
        let inChecklist = false;
        let detailsSummary = '';

        const flushList = () => {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inChecklist) {
                html += '</ul>';
                inChecklist = false;
            }
        };

        const flushP = () => {
            flushList();
            if (pBuffer.length > 0) {
                while (pBuffer.length > 0 && pBuffer[pBuffer.length - 1].trim() === '') pBuffer.pop();
                while (pBuffer.length > 0 && pBuffer[0].trim() === '') pBuffer.shift();
                if (pBuffer.length > 0) {
                    let pText = pBuffer.join('\n');
                    pText = escapeHTML(pText);
                    pText = processInline(pText);
                    const currentBlock = blockStack.length > 0 ? blockStack[blockStack.length - 1] : null;
                    if (currentBlock === 'table') {
                        html += pText;
                    } else {
                        html += '<p>' + pText + '</p>';
                    }
                }
                pBuffer = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const currentBlock = blockStack.length > 0 ? blockStack[blockStack.length - 1] : null;
            // console.log(`[Line ${i}] blockStack:`, blockStack, 'line:', line);

            if (currentBlock) {
                let tLine = line.trim();
                // Check for block closing
                if (tLine === '}') {
                    flushP();
                    const closedBlock = blockStack.pop();
                    if (closedBlock === 'table') html += '</tbody></table></div>';
                    else if (closedBlock === 'details') html += '</div></details>';
                    else {
                        if (['success', 'warning', 'info', 'highlight'].includes(closedBlock)) {
                            html += '</div>';
                        }
                        html += '</div>';
                    }
                    continue;
                }

                // Ignore just an opening bracket if on a newline
                if (tLine === '{') {
                    continue;
                }

                // Strip optional leading indentation
                line = line.replace(/^(?: {1,4}|\t)/, '');

                if (currentBlock === 'table') {
                    if (line.trim() !== '') {
                        let cells = line.split('|').map(c => c.trim());
                        html += '<tr>' + cells.map(c => '<td>' + processInline(escapeHTML(c)) + '</td>').join('') + '</tr>';
                    }
                    continue;
                }

                // If inside code, don't allow nested blocks, just buffer
                if (currentBlock === 'code') {
                    pBuffer.push(line);
                    continue;
                }

                // If inside other blocks, allow detection of nested blocks!
            }

            // #### headings (h4)
            if (line.trim().startsWith('#### ')) {
                flushP();
                let text = line.trim().substring(5);
                let id = 'h-' + i;
                tocData.push({ level: 4, text, id });
                html += `<h4 id="${id}">` + processInline(escapeHTML(text)) + `</h4>`;
            } else if (line.trim().startsWith('### ')) {
                flushP();
                let text = line.trim().substring(4);
                let id = 'h-' + i;
                tocData.push({ level: 3, text, id });
                html += `<h3 id="${id}">` + processInline(escapeHTML(text)) + `</h3>`;
            } else if (line.trim().startsWith('## ')) {
                flushP();
                let text = line.trim().substring(3);
                let id = 'h-' + i;
                tocData.push({ level: 2, text, id });
                html += `<h2 id="${id}">` + processInline(escapeHTML(text)) + `</h2>`;
            } else if (line.trim().startsWith('# ')) {
                flushP();
                let text = line.trim().substring(2);
                let id = 'h-' + i;
                tocData.push({ level: 1, text, id });
                html += `<h1 id="${id}">` + processInline(escapeHTML(text)) + `</h1>`;
            } else if (line.trim() === '---') {
                flushP();
                html += '<hr>';
            } else if (line.trim().match(/^toc\s*\{\s*\}\s*$/i)) {
                flushP();
                html += '%%TOC_MARKER%%';
            } else if (line.trim().match(/^encryptor\s*\{\s*\}\s*$/i)) {
                flushP();
                html += '%%ENCRYPTOR_MARKER%%';
                // Image syntax: img { URL } or img { URL | caption }
            } else if (line.trim().match(/^img\s*\{\s*(.+?)\s*\}/i)) {
                flushP();
                let imgMatch = line.trim().match(/^img\s*\{\s*(.+?)\s*\}/i);
                let imgParts = imgMatch[1].split('|').map(s => s.trim());
                let imgUrl = imgParts[0];
                let caption = imgParts[1] || '';
                html += '<div class="block-image">';
                html += `<img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(caption || 'image')}" loading="lazy">`;
                if (caption) html += `<div class="img-caption">${processInline(escapeHTML(caption))}</div>`;
                html += '</div>';
                // Video syntax: video { URL }
            } else if (line.trim().match(/^video\s*\{\s*(.+?)\s*\}/i)) {
                flushP();
                let vidMatch = line.trim().match(/^video\s*\{\s*(.+?)\s*\}/i);
                let url = vidMatch[1].trim();
                html += '<div class="block-embed block-video" style="margin: 20px 0; text-align: center;">';
                html += `<video src="${escapeHTML(url)}" controls style="max-width: 100%; border-radius: var(--radius); box-shadow: var(--shadow-md);"></video>`;
                html += '</div>';
                // YouTube syntax: youtube { URL }
            } else if (line.trim().match(/^youtube\s*\{\s*(.+?)\s*\}/i)) {
                flushP();
                let ytMatch = line.trim().match(/^youtube\s*\{\s*(.+?)\s*\}/i);
                let url = ytMatch[1].trim();
                let videoId = "";
                let r1 = url.match(/v=([^&]+)/);
                if (r1) videoId = r1[1];
                else {
                    let r2 = url.match(/youtu\.be\/([^?]+)/);
                    if (r2) videoId = r2[1];
                }
                if (!videoId) videoId = url; // fallback
                let tMatch = url.match(/[?&]t=([0-9smh]+)/);
                let tQuery = tMatch ? `?start=${parseInt(tMatch[1])}` : '';
                html += '<div class="block-embed block-youtube" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); margin: 20px 0; background: #000; box-shadow: var(--shadow-md);">';
                html += `<iframe src="https://www.youtube.com/embed/${escapeHTML(videoId)}${tQuery}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                html += '</div>';
                // Twitter syntax: twitter { URL }
            } else if (line.trim().match(/^twitter\s*\{\s*(.+?)\s*\}/i)) {
                flushP();
                let twMatch = line.trim().match(/^twitter\s*\{\s*(.+?)\s*\}/i);
                let url = twMatch[1].trim();
                url = url.replace(/^https?:\/\/x\.com/, 'https://twitter.com');
                html += '<div class="block-embed block-twitter" style="display:flex; justify-content:center; margin: 20px 0;">';
                html += `<blockquote class="twitter-tweet"><a href="${escapeHTML(url)}"></a></blockquote>`; // scripts in innerHTML are inert; widgets.js loaded below
                html += '</div>';
                // Embed syntax: embed { URL }
            } else if (line.trim().match(/^embed\s*\{\s*(.+?)\s*\}/i)) {
                flushP();
                let emMatch = line.trim().match(/^embed\s*\{\s*(.+?)\s*\}/i);
                let url = emMatch[1].trim();
                html += '<div class="block-embed block-generic" style="margin: 20px 0;">';
                html += `<iframe src="${escapeHTML(url)}" style="width: 100%; height: 400px; border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm);" allowfullscreen></iframe>`;
                html += '</div>';
                // Badge syntax: badge { text } or badge { text | type }
            } else if (line.trim().match(/^badge\s*\{\s*(.+?)\s*\}/i)) {
                flushP();
                let badgeMatch = line.trim().match(/^badge\s*\{\s*(.+?)\s*\}/i);
                let badgeParts = badgeMatch[1].split('|').map(s => s.trim());
                let badgeText = badgeParts[0];
                let badgeType = (badgeParts[1] || 'default').toLowerCase();
                if (!['default', 'success', 'warning', 'info'].includes(badgeType)) badgeType = 'default';
                html += `<span class="txtml-badge txtml-badge-${badgeType}">${processInline(escapeHTML(badgeText))}</span> `;
                // Details block with a summary
            } else if (line.trim().match(/^details\s*\{(.+?)\}\s*\{?$/i)) {
                flushP();
                let detMatch = line.trim().match(/^details\s*\{(.+?)\}\s*\{?$/i);
                detailsSummary = detMatch[1] || 'Details';
                html += '<details class="block-details"><summary>' + processInline(escapeHTML(detailsSummary.trim())) + '</summary><div class="details-content">';
                blockStack.push('details');
            } else if (line.trim().match(/^(card|quote|warning|code|note|table|success|info|highlight)\s*\{$/i)) {
                flushP();
                let match = line.trim().match(/^(card|quote|warning|code|note|table|success|info|highlight)\s*\{$/i);
                let blockType = match[1].toLowerCase();
                html += '<div class="block-' + blockType + '">';

                let svgIcon = '';
                if (blockType === 'success') svgIcon = '<svg class="block-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
                else if (blockType === 'warning') svgIcon = '<svg class="block-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>';
                else if (blockType === 'info') svgIcon = '<svg class="block-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
                else if (blockType === 'highlight') svgIcon = '<svg class="block-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

                if (svgIcon) {
                    html += `<div class="block-icon-wrapper">${svgIcon}</div><div class="block-content">`;
                }

                if (blockType === 'table') html += '<table class="txtml-table"><tbody>';
                blockStack.push(blockType);
                // Checklist items: [x] or [ ]
            } else if (line.trim().match(/^\[( |x|X)\]\s+/)) {
                if (!inChecklist) {
                    flushP();
                    html += '<ul class="txtml-checklist">';
                    inChecklist = true;
                }
                let checked = line.trim().charAt(1).toLowerCase() === 'x';
                let content = line.trim().replace(/^\[.\]\s+/, '');
                html += '<li>';
                html += `<span class="check-icon ${checked ? 'checked' : 'unchecked'}">${checked ? '✓' : ''}</span>`;
                html += `<span class="check-text ${checked ? 'done' : ''}">${processInline(escapeHTML(content))}</span>`;
                html += '</li>';
                // Ordered list items: 1. text
            } else if (line.trim().match(/^\d+\.\s+/)) {
                if (!inList || html.slice(-5) !== '</ol>') {
                    flushP();
                    // Check if we're already in an ordered list context
                    if (inList) flushList();
                    html += '<ol>';
                    inList = true;
                }
                let liContent = line.trim().replace(/^\d+\.\s+/, '');
                html += '<li>' + processInline(escapeHTML(liContent)) + '</li>';
            } else if (line.trim().match(/^[-*]\s+/)) {
                if (inChecklist) flushList();
                if (!inList) {
                    flushP();
                    html += '<ul>';
                    inList = true;
                }
                let liContent = line.trim().replace(/^[-*]\s+/, '');
                html += '<li>' + processInline(escapeHTML(liContent)) + '</li>';
            } else if (line.trim() === '') {
                flushP();
            } else {
                flushList();
                pBuffer.push(line);
            }
        }

        flushP();
        while (blockStack.length > 0) {
            const closedBlock = blockStack.pop();
            if (closedBlock === 'table') html += '</tbody></table></div>';
            else if (closedBlock === 'details') html += '</div></details>';
            else {
                if (['success', 'warning', 'info', 'highlight'].includes(closedBlock)) {
                    html += '</div>';
                }
                html += '</div>';
            }
        }

        // Build collapsible TOC
        if (tocData.length > 0 && html.includes('%%TOC_MARKER%%')) {
            let tocHtml = '<div class="block-toc">';
            tocHtml += '<div class="toc-header"><h2>Table of Contents</h2><span class="toc-chevron">▼</span></div>';
            tocHtml += '<div class="toc-body"><ul>';
            tocData.forEach(h => {
                let margin = (h.level - 1) * 18;
                tocHtml += `<li style="margin-left: ${margin}px">&rarr; <a href="#${h.id}">${processInline(escapeHTML(h.text))}</a></li>`;
            });
            tocHtml += '</ul></div></div>';
            html = html.replace('%%TOC_MARKER%%', tocHtml);
        }

        if (html.includes('%%ENCRYPTOR_MARKER%%')) {
            const encryptorHtml = `
                <div class="block-card txtml-encryptor-ui">
                    <h2>Encrypt Document</h2>
                    <p>Paste your plain text document below. Set a key (password).</p>
                    <textarea class="txtml-enc-input txtml-enc-text" placeholder="# Hello\n\nThis is secret..." style="height:200px; resize:vertical;"></textarea>
                    <input type="password" class="txtml-enc-input txtml-enc-key" placeholder="super_secret_password...">
                    <button class="txtml-enc-btn txtml-enc-action-btn">Encrypt Document</button>
                    
                    <div class="txtml-enc-out-container" style="display:none; margin-top:20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <strong style="text-transform:uppercase; font-size: 0.85em; letter-spacing: 0.06em; color: var(--text-secondary);">Encrypted Output:</strong>
                            <button class="txtml-enc-btn txtml-enc-copy" style="padding:6px 14px; font-size:13px;">Copy to Clipboard</button>
                        </div>
                        <div class="txtml-enc-out" style="background:var(--note-bg); padding:16px; border:1px solid var(--border); border-radius:var(--radius); white-space:pre-wrap; word-break:break-all; font-family:'JetBrains Mono', monospace; font-size:13px; margin-top:0;"></div>
                    </div>
                </div>
            `;
            html = html.replace(/%%ENCRYPTOR_MARKER%%/g, encryptorHtml);
        }

        return html;
    }

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function processInline(str) {
        // Bold: **text**
        str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text*
        str = str.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Inline code: `text`
        str = str.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        // Strikethrough: ~~text~~
        str = str.replace(/~~(.+?)~~/g, '<del>$1</del>');
        // Highlight/mark: ==text==
        str = str.replace(/==(.+?)==/g, '<mark>$1</mark>');
        // Keyboard: [[key]]
        str = str.replace(/\[\[([^\]]+)\]\]/g, '<kbd>$1</kbd>');
        // Links with brackets: @[file name]
        // or traditional word characters, hyphens, dots, slashes
        str = str.replace(/@(?:\[([^\]]+)\]|([a-zA-Z0-9_\-\.\/]+))/g, (match, p1, p2) => {
            const path = p1 || p2;
            const href = path.match(/\.[a-zA-Z0-9]+$/) ? encodeURI(path) : encodeURI(path) + '.html';
            return `<a href="${href}">@${escapeHTML(path)}</a>`;
        });
        return str;
    }

    // --- ENCRYPTION LOGIC ---
    async function decryptTxtml(base64text, password) {
        const bundleStr = atob(base64text);
        const bundle = new Uint8Array(bundleStr.length);
        for (let i = 0; i < bundleStr.length; i++) {
            bundle[i] = bundleStr.charCodeAt(i);
        }

        const salt = bundle.slice(0, 16);
        const iv = bundle.slice(16, 16 + 12);
        const data = bundle.slice(16 + 12);

        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
        return new TextDecoder().decode(decrypted);
    }

    // Expose encrypt logic globally for the encryptor tool
    window.encryptTxtml = async function (text, password) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(text));

        const bundle = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        bundle.set(salt, 0);
        bundle.set(iv, salt.length);
        bundle.set(new Uint8Array(encrypted), salt.length + iv.length);

        let binary = '';
        const len = bundle.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bundle[i]);
        }
        return btoa(binary);
    };

})();
