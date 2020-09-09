chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({sb_safes: {}}, function() {
    console.log("safes set");
  });
});