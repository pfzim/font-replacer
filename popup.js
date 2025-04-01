document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const textarea = document.getElementById('fontConfig');
    const saveBtn = document.getElementById('saveBtn');
    const notification = document.getElementById('notification');

    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.className = isError ? 'notification error show' : 'notification show';

        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    // Load current settings
    chrome.storage.sync.get(['enabled', 'fontConfig'], (data) => {
        enableToggle.checked = data.enabled !== false;
        textarea.value = JSON.stringify(data.fontConfig || [], null, 2);
    });

    // Save settings
    saveBtn.addEventListener('click', () => {
        try {
            const config = JSON.parse(textarea.value);
            if (!Array.isArray(config)) {
                throw new Error('Config must be an array. Example: [{"pattern_url":".*","replacements":{"Helvetica":"Verdana","Segoe UI":"Arial"}}]');
            }
            chrome.storage.sync.set({ enabled: enableToggle.checked, fontConfig: config }, () => {
                showNotification('Settings saved successfully! Reload pages to apply changes.');
                // window.close();
            });
        } catch (e) {
            showNotification('Invalid JSON: ' + e.message, true);
        }
    });
});
