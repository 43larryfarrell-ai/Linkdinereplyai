// Content script for LinkedIn Reply AI
// This script runs on LinkedIn pages and can extract page text when requested

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    try {
      const text = document.body.innerText.trim();
      // Limit to 1500 characters
      const limitedText = text.length > 1500 ? text.substring(0, 1500) : text;
      sendResponse({ success: true, text: limitedText });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true; // Indicates we will send a response asynchronously
  }
});

