chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard.html"), // Replace with your actual page
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard.html"),
  });
});
