// ==UserScript==
// @name         Font Replacer
// @namespace    https://openuserjs.org/users/pfzim
// @version      0.3
// @description  Replaces specified fonts with alternatives across all page elements
// @author       pfzim
// @copyright    2025, pfzim (https://openuserjs.org/users/pfzim)
// @license      GPL-3.0-or-later
// @match        *://*/*
// @grant        none
// @updateURL    https://openuserjs.org/meta/pfzim/Font_Replacer.meta.js
// @downloadURL  https://openuserjs.org/install/pfzim/Font_Replacer.user.js
// ==/UserScript==

(function ()
{
	'use strict';

	// Font replacement settings (format: { "target font": "replacement", ... })

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
			"replacements": {
				"YS Text": "Arial"
			},
			"skip_body": true,
			"skip_observer": true,
			"skip_styles": false
		},
		{
			"pattern_url": ".*",
			"replacements": {
				"Barlow": "Verdana",
				"Geist": "Verdana",
				"Geist Mono": "Courier New",
				"Georgia": "Times New Roman",
				"GitLab Mono": "Courier New",
				"GitLab Sans": "Verdana",
				"Golos Text": "Arial",
				"Golos": "Arial",
				"Google Sans": "Verdana",
				"GothamProRegular": "Verdana",
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
		// Add your custom replacements here
	];

	let replacement_rule = null;

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
					if ((rule instanceof CSSStyleRule) && rule.style && rule.style.fontFamily) { // not rule instanceof CSSFontFaceRule
						// Removes the !important
						//rule.style.fontFamily = rule.style.fontFamily;
						// if(rule.style.getPropertyPriority('font-family') === 'important')
							// rule.style.setProperty('font-family', rule.style.getPropertyValue('font-family'), null);

						// Replace fonts

						const originalFont = rule.style.getPropertyValue('font-family').trim();
						const newFont = parseAndReplaceFonts(originalFont, replacement_rule.replacements)

						if (newFont.toLowerCase() !== originalFont.toLowerCase()) {
							rule.style.setProperty('font-family', newFont, rule.style.getPropertyPriority('font-family'));
							// Debug logging (commented out):
							// console.log('Old font: ' + originalFont + '\nNew font: ' + newFont);
						}
					}
				});
			}
			catch (e) {
				console.log('Font Replacer: Cannot read rules from', sheet.href, e);
			}
		});
	}

	replacement_rule = getReplacementsForCurrentSite();
	if (replacement_rule && Object.keys(replacement_rule.replacements).length > 0) {
		// Process the entire page
		if(!replacement_rule.skip_styles) processAllStyles(document.styleSheets);
		if(!replacement_rule.skip_body) processAllElements(document.body);
		if(!replacement_rule.skip_observer) startObserver();
	}
	else {
		console.log('Font Replacer: disabled for this url or globally!');
	}

	// Optional: Add @font-face style to force font replacement (commented out)
	// const style = document.createElement('style');
	// style.textContent = `
	//     * {
	//         font-family: ${Object.values(fontReplacements).join(', ')} !important;
	//     }
	// `;
	// document.head.appendChild(style);

})();
