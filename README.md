**Font Replacement Toolkit**  

A browser extension that replaces fonts on websites according to your custom rules. Perfect for designers, developers, and users who prefer crisp, non-smoothed fonts without ClearType rendering.  

**Key Features:**  
- Replace fonts site-by-site using regex rules  
- Pre-configured defaults for common font stacks  
- Disables font smoothing for sharper text  
- Lightweight with no performance impact  
- Works with dynamic content (SPAs, lazy loading)  

**For Sharp Text Without Smoothing:**  
Add these registry tweaks (Windows) to disable font smoothing:  
```
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Control Panel\Desktop]
"FontSmoothing"="0"
"FontSmoothingType"=dword:00000001
```
Or you can use [ClearType Switch 1.1](https://karpolan.com/software/cleartype-switch/) to enable or disable ClearType and anti-aliasing text settings.

**Example Config (JSON):**  
```json
[
    {
        "pattern_url": "^http[s]?://[^/]*gitlab\\.com/",
        "replacements": {
            "GitLab": "Verdana",
            "GitLab Sans": "Verdana",
            "GitLab Mono": "Courier New"
        }
    },
    {
        "pattern_url": "^http[s]?://[^/]*market\\.yandex\\.ru/",  <-- RegExp match URL pattern
        "replacements": {},                                       <-- Disable any font replacemets on matched URL
		"skip_body": true,                                        <-- Do not modify fonts in page content (optional)
		"skip_observer": true,                                    <-- Do not track DOM changes (optional)
		"skip_styles": true                                       <-- Do not modify fonts in CSS (optional)
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
]
```

**Ideal For:**  
- Users who dislike anti-aliased/blurry text  
- Designers testing font fallbacks  
- Improving readability on low-DPI screens  
- Enforcing corporate font policies  

Includes advanced CSS parsing to handle complex font-family declarations.  
