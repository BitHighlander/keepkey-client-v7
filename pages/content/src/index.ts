// content-script.js

console.log('Content script loaded');

// Inject the provider script into the page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js'); // Adjust the path as necessary
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);
