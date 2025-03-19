document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode === true) {
      document.body.classList.add('dark-mode-body');
    }
  });
});