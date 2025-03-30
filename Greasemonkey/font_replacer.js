// ==UserScript==
// @name         Font Replacer
// @namespace    https://openuserjs.org/users/pfzim
// @version      0.2
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
	const fontReplacements = {
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
		//"Inter": "Arial"
		// Add your custom replacements here
	};

	function parseAndReplaceFonts(fontFamilyString, replacements)
	{
		if(!fontFamilyString) return '';

		const withoutComments = fontFamilyString.replace(/\/\*.*?\*\//g, '');
		const fontList = [];
		let currentFont = '';
		let inQuotes = false;
		let quoteChar = null;
		let inParentheses = false;
		let escapeNext = false;

		for(let i = 0; i < withoutComments.length; i++)
		{
			const char = withoutComments[i];

			if(escapeNext)
			{
				currentFont += char;
				escapeNext = false;
				continue;
			}

			if(char === '\\')
			{
				escapeNext = true;
				currentFont += char;
				continue;
			}

			if((char === '"' || char === "'") && !inParentheses)
			{
				if(!inQuotes)
				{
					inQuotes = true;
					quoteChar = char;
				} else if(char === quoteChar)
				{
					inQuotes = false;
					quoteChar = null;
				}
				currentFont += char;
			} else if(char === '(' && !inQuotes)
			{
				inParentheses = true;
				currentFont += char;
			} else if(char === ')' && !inQuotes)
			{
				inParentheses = false;
				currentFont += char;
			} else if(char === ',' && !inQuotes && !inParentheses)
			{
				if(currentFont)
					fontList.push(processFont(currentFont, replacements));
				currentFont = '';
			} else
			{
				currentFont += char;
			}
		}

		if(currentFont)
			fontList.push(processFont(currentFont, replacements));

		return fontList.join(', ');
	}

	function processFont(font, replacements)
	{
		let unquotedFont = font;

		font = font.trim();
		if(font.startsWith('"') && font.endsWith('"'))
		{
			unquotedFont = font.slice(1, -1).replace(/\\"/g, '"');
		}
		else if(font.startsWith("'") && font.endsWith("'"))
		{
			unquotedFont = font.slice(1, -1).replace(/\\'/g, "'");
		}

		const lowerFont = unquotedFont.toLowerCase();

		for(const [original, replacement] of Object.entries(replacements))
		{
			if(lowerFont === original.toLowerCase())
			{
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
	function processElement(element)
	{
		const computedStyle = window.getComputedStyle(element);
		const originalFont = computedStyle.fontFamily;

		if(!originalFont) return;

		//const newFont = replaceFonts(originalFont);
		const newFont = parseAndReplaceFonts(originalFont, fontReplacements)

		if(newFont.toLowerCase() !== originalFont.toLowerCase())
		{
			element.style.fontFamily = newFont;
			// Debug logging (commented out):
			// console.log('Old font: ' + originalFont + '\nNew font: ' + newFont);
		}
	}

	// Recursive function to check all elements
	function checkAllElements(node)
	{
		processElement(node);

		for(let i = 0; i < node.children.length; i++)
		{
			checkAllElements(node.children[i]);
		}
	}

	// Process the entire page
	checkAllElements(document.body);

	// Monitor dynamically added elements
	const observer = new MutationObserver(mutations =>
	{
		mutations.forEach(mutation =>
		{
			mutation.addedNodes.forEach(node =>
			{
				if(node.nodeType === 1) // Node.ELEMENT_NODE
				{
					checkAllElements(node);
				}
			});
		});
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	// Optional: Add @font-face style to force font replacement (commented out)
	// const style = document.createElement('style');
	// style.textContent = `
	//     * {
	//         font-family: ${Object.values(fontReplacements).join(', ')} !important;
	//     }
	// `;
	// document.head.appendChild(style);

})();
