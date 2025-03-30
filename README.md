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
    "pattern_url": ".*\\.gitlab\\.com",
    "replacements": {
      "GitLab Sans": "Verdana",
      "GitLab Mono": "Courier New"
    }
  },
  {
    "pattern_url": ".*",
    "replacements": {
      "Helvetica": "Verdana",
      "Segoe UI": "Tahoma",
      "Roboto Mono": "Courier New"
    }
  }
]
```

**Ideal For:**  
- Users who dislike anti-aliased/blurry text  
- Designers testing font fallbacks  
- Improving readability on low-DPI screens  
- Enforcing corporate font policies  

Includes advanced CSS parsing to handle complex font-family declarations.  
