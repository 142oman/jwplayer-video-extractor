(function() {
    // Prevent FOUC by hiding the body as soon as this script is executed
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
            } catch(e) {
                document.body.innerHTML = '<h1 style="font-family:sans-serif; text-align:center; margin-top:50px; color:red;">Decryption Failed</h1><p style="text-align:center; font-family:sans-serif;">Incorrect password or corrupted data.</p>';
                document.body.style.display = 'block';
                return;
            }
        }

        let parsedHTML = parseTxtml(text);

        // Inject Default Styles 
        const uiStyle = document.createElement('style');
        uiStyle.innerHTML = `
            :root {
                --bg: #fff;
                --text: #000;
                --accent: #000;
                --accent-bg: #fff;
                --shadow: #000;
                --warning: #ff0000;
                --warning-bg: #fff0f0;
                --code-bg: #000;
                --code-text: #0f0;
                --note-bg: #f9f9f9;
                --toc-bg: #f4f4f4;
            }
            body.dark-mode {
                --bg: #111;
                --text: #eee;
                --accent: #eee;
                --accent-bg: #111;
                --shadow: #eee;
                --warning: #ff5555;
                --warning-bg: #331111;
                --code-bg: #222;
                --code-text: #5f5;
                --note-bg: #222;
                --toc-bg: #222;
            }

            body {
                margin: 40px auto;
                max-width: 650px;
                line-height: 1.6;
                font-size: 18px;
                color: var(--text);
                padding: 0 20px;
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                background-color: var(--bg);
                transition: background-color 0.3s, color 0.3s;
            }
            h1, h2, h3 { 
                line-height: 1.2; 
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                font-weight: 900;
                letter-spacing: -0.05em;
                text-transform: uppercase;
                color: var(--text);
            }
            .block-card {
                border: 3px solid var(--accent);
                padding: 20px;
                margin: 20px 0;
                background: var(--accent-bg);
                box-shadow: 6px 6px 0px var(--shadow);
            }
            .block-quote {
                border-left: 5px solid var(--accent);
                padding-left: 20px;
                margin: 20px 0;
                font-style: italic;
                font-family: Georgia, serif;
                font-size: 1.2em;
            }
            .block-warning {
                border: 3px solid var(--warning);
                padding: 20px;
                margin: 20px 0;
                background: var(--warning-bg);
                color: var(--warning);
                font-weight: bold;
                box-shadow: 6px 6px 0px var(--warning);
            }
            .block-code {
                background: var(--code-bg);
                color: var(--code-text);
                padding: 20px;
                margin: 20px 0;
                font-family: "Courier New", Courier, monospace;
                box-shadow: 6px 6px 0px var(--shadow);
            }
            .block-note {
                border: 3px dashed var(--accent);
                padding: 20px;
                margin: 20px 0;
                background: var(--note-bg);
            }
            .block-toc {
                border: 3px solid var(--accent);
                padding: 20px;
                margin: 20px 0;
                background: var(--toc-bg);
                box-shadow: 6px 6px 0px var(--shadow);
            }
            .block-toc h2 { margin-top: 0; font-size: 1.2em; color: var(--accent); }
            .block-toc ul { list-style-type: none; padding-left: 0; }
            .block-toc li { margin-bottom: 0.5em; }
            ul {
                padding-left: 20px;
                margin-bottom: 1em;
                line-height: 1.6;
            }
            li {
                margin-bottom: 0.5em;
            }
            .block-table {
                margin: 20px 0;
                overflow-x: auto;
            }
            .txtml-table {
                width: 100%;
                border-collapse: collapse;
                border: 3px solid var(--accent);
                box-shadow: 6px 6px 0px var(--shadow);
                background: var(--accent-bg);
                color: var(--text);
            }
            .txtml-table td {
                border: 1px solid var(--accent);
                padding: 10px;
            }
            .txtml-table tr:first-child td {
                font-weight: 900;
                background: var(--accent);
                color: var(--bg);
                text-transform: uppercase;
                letter-spacing: -0.02em;
            }
            a { 
                color: var(--text); 
                text-decoration: none; 
                border-bottom: 2px solid var(--accent);
                font-weight: bold;
                transition: background 0.2s, color 0.2s;
            }
            a:hover { 
                background: var(--accent);
                color: var(--bg); 
            }
            p { 
                margin-bottom: 1em; 
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: inherit;
            }
            hr {
                border: 0;
                border-bottom: 3px solid var(--accent);
                margin: 30px 0;
            }
            #txtml-theme-toggle {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--accent);
                color: var(--bg);
                border: 2px solid var(--accent);
                padding: 5px 10px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 4px 4px 0px var(--shadow);
                transition: transform 0.1s;
                z-index: 1000;
                font-family: inherit;
            }
            #txtml-theme-toggle:active {
                transform: translate(2px, 2px);
                box-shadow: 2px 2px 0px var(--shadow);
            }
            .txtml-enc-input {
                width: 100%; padding: 10px; margin-bottom: 10px;
                border: 3px solid var(--accent); box-sizing: border-box;
                background: var(--bg); color: var(--text);
                font-family: monospace; font-size: 16px;
                outline: none;
            }
            .txtml-enc-input:focus {
                background: var(--note-bg);
            }
            .txtml-enc-btn {
                padding: 10px 20px; background: var(--accent); color: var(--bg);
                font-weight: bold; border: none; cursor: pointer;
                text-transform: uppercase; box-shadow: 4px 4px 0px var(--shadow);
                transition: transform 0.1s;
                font-family: inherit; font-size: 16px;
            }
            .txtml-enc-btn:active {
                transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--shadow);
            }
        `;
        document.head.appendChild(uiStyle);

        // Replace body content with parsed HTML
        document.body.innerHTML = parsedHTML;
        
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
        
        // Add theme toggle button
        const themeBtn = document.createElement('button');
        themeBtn.id = 'txtml-theme-toggle';
        themeBtn.innerText = 'TOGGLE DARK';
        
        // Detect system preference initially
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        }

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
        document.body.appendChild(themeBtn);

        // Remove the hide-body style
        const hideStyle = document.getElementById('txtml-hide-body');
        if (hideStyle) hideStyle.remove();
        
        document.body.style.display = 'block'; 
    });

    function parseTxtml(text) {
        const lines = text.split(/\r?\n/);
        let html = '';
        let inBlock = null; 
        let pBuffer = [];
        let tocData = [];
        let inList = false;

        const flushList = () => {
            if (inList) {
                html += '</ul>';
                inList = false;
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
                    // Do not wrap table content in <p> if it's inside a table block
                    if (inBlock === 'table') {
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

            let tLineSkipped = false;
            if (inBlock) {
                let tLine = line.trim();
                // Check for block closing
                if (tLine === '}' || tLine === ']' || tLine.toLowerCase() === '[/' + inBlock + ']') {
                    flushP();
                    if (inBlock === 'table') html += '</tbody></table></div>';
                    else html += '</div>';
                    inBlock = null;
                    continue;
                }
                
                // Forgiving matching: if line is just an opening bracket, ignore it
                if (tLine === '{' || tLine === '[') {
                    continue;
                }

                // Strip optional leading indentation (up to 4 spaces or 1 tab) from content inside blocks
                line = line.replace(/^(?: {1,4}|\t)/, '');

                if (inBlock === 'table') {
                    if (line.trim() !== '') {
                        let cells = line.split('|').map(c => c.trim());
                        html += '<tr>' + cells.map(c => '<td>' + processInline(escapeHTML(c)) + '</td>').join('') + '</tr>';
                    }
                    continue; // Skip further processing for table lines
                }
                // For other blocks, line falls through to be processed as normal text/markdown!
            }

            if (line.trim().startsWith('# ')) {
                flushP();
                let text = line.trim().substring(2);
                let id = 'h-' + i;
                tocData.push({ level: 1, text, id });
                html += `<h1 id="${id}">` + processInline(escapeHTML(text)) + `</h1>`;
            } else if (line.trim().startsWith('## ')) {
                flushP();
                let text = line.trim().substring(3);
                let id = 'h-' + i;
                tocData.push({ level: 2, text, id });
                html += `<h2 id="${id}">` + processInline(escapeHTML(text)) + `</h2>`;
            } else if (line.trim().startsWith('### ')) {
                flushP();
                let text = line.trim().substring(4);
                let id = 'h-' + i;
                tocData.push({ level: 3, text, id });
                html += `<h3 id="${id}">` + processInline(escapeHTML(text)) + `</h3>`;
            } else if (line.trim() === '---') {
                flushP();
                html += '<hr>';
            } else if (line.trim() === 'toc:') {
                flushP();
                html += '%%TOC_MARKER%%';
            } else if (line.trim() === 'encryptor:') {
                flushP();
                html += '%%ENCRYPTOR_MARKER%%';
            } else if (!inBlock && line.trim().match(/^\[?(card|quote|warning|code|note|table)\]?(?:\s*\{|\s*:)?$/i)) {
                flushP();
                let match = line.trim().match(/^\[?(card|quote|warning|code|note|table)/i);
                let blockType = match[1].toLowerCase();
                html += '<div class="block-' + blockType + '">';
                if (blockType === 'table') html += '<table class="txtml-table"><tbody>';
                inBlock = blockType;
            } else if (line.trim().match(/^[-*]\s+/)) {
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
        if (inBlock) {
            if (inBlock === 'table') html += '</tbody></table></div>';
            else html += '</div>';
        }

        if (tocData.length > 0 && html.includes('%%TOC_MARKER%%')) {
            let tocHtml = '<div class="block-toc"><h2>Table of Contents</h2><ul>';
            tocData.forEach(h => {
                let margin = (h.level - 1) * 20;
                tocHtml += `<li style="margin-left: ${margin}px">&rarr; <a href="#${h.id}">${processInline(escapeHTML(h.text))}</a></li>`;
            });
            tocHtml += '</ul></div>';
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
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="text-transform:uppercase;">Encrypted Output:</strong>
                            <button class="txtml-enc-btn txtml-enc-copy" style="padding:5px 10px; font-size:14px; box-shadow:2px 2px 0px var(--shadow);">Copy to Clipboard</button>
                        </div>
                        <div class="txtml-enc-out" style="background:var(--note-bg); padding:20px; border:3px solid var(--accent); white-space:pre-wrap; word-break:break-all; font-family:monospace; margin-top:0;"></div>
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
        // Match word characters, hyphens, dots, and slashes for folder paths
        // Negative lookbehind or trailing strictness usually isn't necessary for basic links,
        // but we ensure it supports standard path characters.
        return str.replace(/@([a-zA-Z0-9_\-\.\/]+)/g, '<a href="$1.html">@$1</a>');
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
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), {name: "PBKDF2"}, false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
            {name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256"},
            keyMaterial, {name: "AES-GCM", length: 256}, false, ["decrypt"]
        );
        
        const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, key, data);
        return new TextDecoder().decode(decrypted);
    }

    // Expose encrypt logic globally for the encryptor tool
    window.encryptTxtml = async function(text, password) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), {name: "PBKDF2"}, false, ["deriveKey"]);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256"},
            keyMaterial, {name: "AES-GCM", length: 256}, false, ["encrypt"]
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, key, enc.encode(text));
        
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
 
