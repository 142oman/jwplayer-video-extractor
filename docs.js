
<script src="engine.js"></script>

# TextML Documentation

toc:

This engine transforms a simple plaintext document into an edgy, serious, and beautifully formatted webpage without the
clutter of HTML tags.

## Core Principles
1. **No Tags Required:** Just write your text as you would in Notepad.
2. **Whitespace is Binding:** Your indentation is strictly preserved.
3. **Edgy by Default:** Stark contrasts, crisp typography, and bold borders.

## Built-in Blocks
You can invoke blocks by cleanly wrapping them in braces or brackets. For example `card {` and then ending with `}`. We
are extremely forgiving: `[quote]`, `[/quote]`, and varying whitespace are all supported!

card {
This is a card block.
It's surrounded by a solid border and casts a stark shadow. Perfect for grouping related information.
}

quote {
This is a quote block.
It uses an elegant serif font and an italic style to stand out from the brutalist body text.
}

warning {
This is a warning block.
Its aggressive red styling ensures the reader doesn't miss critical alerts.
}

code {
This is a code block.
It gives you an old-school terminal vibe, ideal for code snippets or console outputs.
}

note {
This is a note block.
It uses a dashed border for softer, non-critical highlights.
}

## Smart Linking
To link pages automatically, just prepend an "@" to the filename.
For example, clicking on @index will take you back to the home page demo. Or you could check out @beautifulMention.

## Headers
Prefix your lines with `#`, `##`, or `###` to create headers.

## Lists
Any line starting with a hyphen and a space (`- `) or an asterisk and a space (`* `) will naturally turn into an
unordered list.
- Item one
- Item two
- Item three

## Tables
Need to display tabular data? Just create a `table {` block and separate your cells with pipes `|`. The first row is
automatically styled as a header. Don't forget to close it with `}`!

table {
Column 1 | Column 2 | Column 3
Row 1 A | Row 1 B | Row 1 C
Row 2 A | Row 2 B | Row 2 C
}

## Dark Mode
The engine fully supports Dark Mode! It automatically detects your system's color scheme preference, or you can manually
toggle it anytime using the aggressive `TOGGLE DARK` button dynamically injected at the top right corner of the page.

## Encryption
Need to host a file securely? You can easily encrypt any document using the client-side AES-GCM engine.
1. Open the included `@encryptor` tool in your browser.
2. Paste your plain text markup.
3. Provide a secure key (password).
4. Copy the generated output, which starts with the `encrypted:` marker.
5. Paste it into your file instead of plain text.

When you open the file in the browser, the engine detects the `encrypted:` marker, securely prompts for the key, and
decrypts the UI entirely on the client side without ever sending data to a server.

## Table of Contents
If your document is very long, just add a `toc:` on its own line:

toc:

It will automatically gather all your headers into a neat, linked index map. You can see it in action at the top of this
very page!

---
The separator above is created by typing three hyphens (`---`) on its own line.

Now go forth and build clean, aggressive webpages with the simplest markup engine ever.
