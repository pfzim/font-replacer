/**
 * Microsoft Edge browser extension for replacing fonts on web pages according to configurable rules.
 * 
 * Key Features:
 * - Font replacement based on URL patterns (regular expressions)
 * - First-match-wins pattern system (the first matching pattern in the config is applied)
 * - Handles both static elements and dynamically added content via MutationObserver
 * - Properly processes font-family with quotes, parentheses, and escape characters
 * - Supports configuration persistence via chrome.storage.sync
 * 
 * Default configuration includes rules for:
 * - GitLab (replaces brand fonts with Verdana/Courier New)
 * - Common font replacements (Helvetica, Roboto, Inter, etc.)
 * 
 * The extension processes rules in order - the FIRST matching URL pattern determines 
 * which font replacements will be applied to the current page.
 * 
 * Author: Dmitry V. Zimin
 * Contact: pfzim@mail.ru
 * Version: 1.0
 * Repository: https://github.com/pfzim/font-replacer
 * 
 * Requires "storage" permission in manifest.json.
 */

let fontConfig = [
    {
        "pattern_url": "^.*gitlab\\.com",
        "replacements": {
            "GitLab": "Verdana",
            "GitLab Sans": "Verdana",
            "GitLab Mono": "Courier New"
        }
    },
    {
        "pattern_url": ".*",
        "replacements": {
            "Helvetica": "Verdana",
            "Kaspersky Sans": "Verdana",
            "Verdana Neue": "Verdana",
            "GitLab Sans": "Verdana",
            "Segoe UI": "Arial",
            "Inter": "Arial",
            "Georgia": "Times New Roman",
            "Roboto Mono": "Courier New",
            "Roboto": "Verdana",
            "Metropolis": "Verdana",
            "Open Sans": "Verdana",
            "Manrope": "Verdana",
            "Lato": "Arial",
            "Golos": "Arial",
            "Golos Text": "Arial",
            "GitLab Mono": "Courier New"
        }
    }
];

let fontReplacements = {};

chrome.storage.sync.get(['enabled', 'fontConfig'], (data) => {
    const enabled = data.enabled !== false;
    if (data.fontConfig) {
        fontConfig = data.fontConfig;
    }
    else {
        chrome.storage.sync.set({ enabled: enabled, fontConfig: fontConfig });
    }
    fontReplacements = getReplacementsForCurrentSite();
    if (enabled && Object.keys(fontReplacements).length > 0) {
        // Process the entire page
        processAllStyles(document.styleSheets);
        processAllElements(document.body);
        startObserver();
    }
    else {
        console.log('Font Replacer: disabled for this url or globally!');
    }
});

function startObserver() {
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // Node.ELEMENT_NODE
                    processAllElements(node);
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function getReplacementsForCurrentSite() {
    const url = window.location.href;
    for (const rule of fontConfig) {
        try {
            const regex = new RegExp(rule.pattern_url);
            if (regex.test(url)) {
                console.log('Font Replacer: matched pattern: ' + rule.pattern_url);
                return rule.replacements || {};
            }
        } catch (e) {
            console.warn(`Invalid regex pattern: ${rule.pattern_url}`, e);
        }
    }
    return {};
}

function parseAndReplaceFonts(fontFamilyString, replacements) {
    if (!fontFamilyString) return fontFamilyString;

    const withoutComments = fontFamilyString.replace(/\/\*.*?\*\//g, '');
    const fontList = [];
    let currentFont = '';
    let inQuotes = false;
    let quoteChar = null;
    let inParentheses = false;
    let escapeNext = false;

    for (let i = 0; i < withoutComments.length; i++) {
        const char = withoutComments[i];

        if (escapeNext) {
            currentFont += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            currentFont += char;
            continue;
        }

        if ((char === '"' || char === "'") && !inParentheses) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                inQuotes = false;
                quoteChar = null;
            }
            currentFont += char;
        } else if (char === '(' && !inQuotes) {
            inParentheses = true;
            currentFont += char;
        } else if (char === ')' && !inQuotes) {
            inParentheses = false;
            currentFont += char;
        } else if (char === ',' && !inQuotes && !inParentheses) {
            if (currentFont)
                fontList.push(processFont(currentFont, replacements));
            currentFont = '';
        } else {
            currentFont += char;
        }
    }

    if (currentFont)
        fontList.push(processFont(currentFont, replacements));

    return fontList.join(', ');
}

function processFont(font, replacements) {
    let unquotedFont = font;

    font = font.trim();
    if (font.startsWith('"') && font.endsWith('"')) {
        unquotedFont = font.slice(1, -1).replace(/\\"/g, '"');
    }
    else if (font.startsWith("'") && font.endsWith("'")) {
        unquotedFont = font.slice(1, -1).replace(/\\'/g, "'");
    }

    const lowerFont = unquotedFont.toLowerCase();

    for (const [original, replacement] of Object.entries(replacements)) {
        if (lowerFont === original.toLowerCase()) {
            return replacement;
        }
    }

    return unquotedFont;
}

// // Function to replace fonts in a string
// function replaceFonts(fontFamily)
// {
// 	let newFontFamily = fontFamily;

// 	for(const [oldFont, newFont] of Object.entries(fontReplacements))
// 	{
// 		newFontFamily = newFontFamily.replace(
// 			new RegExp(`\\b${oldFont}\\b`, 'gi'),
// 			newFont
// 		);
// 		// Alternative matching approach (commented out):
// 		// if(newFontFamily.toLowerCase().includes(oldFont.toLowerCase()))
// 		// {
// 		// 	return newFont;
// 		// }
// 	}

// 	return newFontFamily;
// }

// Main element processing function
function processElement(element) {
    const computedStyle = window.getComputedStyle(element);
    const originalFont = computedStyle.fontFamily;

    if (!originalFont) return;

    //const newFont = replaceFonts(originalFont);
    const newFont = parseAndReplaceFonts(originalFont, fontReplacements)

    if (newFont.toLowerCase() !== originalFont.toLowerCase()) {
        element.style.fontFamily = newFont;
        // Debug logging (commented out):
        // console.log('Old font: ' + originalFont + '\nNew font: ' + newFont);
    }
}

// Recursive function to check all elements
function processAllElements(node) {
    processElement(node);

    for (let i = 0; i < node.children.length; i++) {
        processAllElements(node.children[i]);
    }
}

// Recursive function to check all styles
function processAllStyles(node) {
    Array.from(node).forEach(sheet => {
        try {
            Array.from(sheet.cssRules || []).forEach(rule => {
                if (rule.style && rule.style.fontFamily) {
                    //console.log("my object: " + JSON.stringify(rule.style.fontFamily));
                    //console.log(Object.keys(rule.style.fontFamily));
                    //if(rule.style.fontFamily.match(/important/i) !== null){ console.log('font: ' + rule.style.fontFamily);
                    //rule.style.fontFamily = rule.style.fontFamily.replace(' !important', '');

                    // I don't know, but this trick removes the !important

                    rule.style.fontFamily = rule.style.fontFamily;

                    // I don't know, but the code below doesn't work for some reason.

                    // const originalFont = rule.style.fontFamily.trim();
                    // const newFont = parseAndReplaceFonts(originalFont, fontReplacements)

                    // if (newFont.toLowerCase() !== originalFont.toLowerCase()) {
                    // rule.style.fontFamily = newFont;
                    // // Debug logging (commented out):
                    // // console.log('Old font: ' + originalFont + '\nNew font: ' + newFont);
                    // }

                    // rule.style.fontFamily = rule.style.fontFamily;
                    // console.log('FF: ' + rule.style.fontFamily);
                }
            });
        }
        catch (e) {
            console.log('Font Replacer: Cannot read rules from', sheet.href, e);
        }
    });
}
