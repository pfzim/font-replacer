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
        "pattern_url": "^http[s]?://[^/]*gitlab\\.com/",
        "replacements": {
            "GitLab": "Verdana",
            "GitLab Sans": "Verdana",
            "GitLab Mono": "Courier New"
        }
    },
    {
        "pattern_url": "^http[s]?://[^/]*market\\.yandex\\.ru/",
        "replacements": {},
		"skip_body": true,
		"skip_observer": true,
		"skip_styles": true
    },
    {
        "pattern_url": ".*",
        "replacements": {
			"Barlow": "Verdana",
			"Georgia": "Times New Roman",
			"GitLab Mono": "Courier New",
			"GitLab Sans": "Verdana",
			"Golos Text": "Arial",
			"Golos": "Arial",
			"Google Sans": "Verdana",
			"Helvetica": "Verdana",
			"Inter": "Arial",
			"Kaspersky Sans": "Verdana",
			"Lato": "Arial",
			"Lato": "Verdana",
			"Manrope": "Verdana",
			"Metropolis": "Verdana",
			"Museo Sans": "Verdana",
			"Open Sans": "Verdana",
			"Optimistic Display": "Verdana",
			"Optimistic Text": "Verdana",
			"Roboto Mono": "Courier New",
			"Roboto": "Verdana",
			"Segoe UI": "Arial",
			"Source Code Pro": "Courier New",
			"Stolzl": "Verdana",
			"Verdana Neue": "Verdana",
			"ui-sans-serif": "Arial"
		},
		"skip_body": false,
		"skip_observer": false,
		"skip_styles": false
    }
];

let replacement_rule = null;

chrome.storage.sync.get(['enabled', 'fontConfig'], (data) => {
    const enabled = data.enabled !== false;
    if (data.fontConfig) {
        fontConfig = data.fontConfig;
    }
    else {
        chrome.storage.sync.set({ enabled: enabled, fontConfig: fontConfig });
    }
    replacement_rule = getReplacementsForCurrentSite();
    if (enabled && replacement_rule && Object.keys(replacement_rule.replacements).length > 0) {
        // Process the entire page
		if(!replacement_rule.skip_styles) processAllStyles(document.styleSheets);
        if(!replacement_rule.skip_body) processAllElements(document.body);
        if(!replacement_rule.skip_observer) startObserver();
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
                return rule || {};
            }
        } catch (e) {
            console.warn(`Invalid regex pattern: ${rule.pattern_url}`, e);
        }
    }
    return null;
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

// 	for(const [oldFont, newFont] of Object.entries(replacement_rule.replacements))
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
    const newFont = parseAndReplaceFonts(originalFont, replacement_rule.replacements)

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
                    // Removes the !important
                    //rule.style.fontFamily = rule.style.fontFamily;
					if(rule.style.getPropertyPriority('font-family') === 'important')
						rule.style.setProperty('font-family', rule.style.getPropertyValue('font-family'), null);

                    // I don't know, but the code below doesn't work for some reason.

                    // const originalFont = rule.style.getPropertyValue('font-family').trim();
                    // const newFont = parseAndReplaceFonts(originalFont, replacement_rule.replacements)

                    // if (newFont.toLowerCase() !== originalFont.toLowerCase()) {
						// rule.style.setProperty('font-family', newFont, rule.style.getPropertyPriority('font-family'));
						// // Debug logging (commented out):
						// // console.log('Old font: ' + originalFont + '\nNew font: ' + newFont);
                    // }

                    // console.log('FF: ' + rule.style.fontFamily);
                }
            });
        }
        catch (e) {
            console.log('Font Replacer: Cannot read rules from', sheet.href, e);
        }
    });
}
