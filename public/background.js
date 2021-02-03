let lockers = { 1: { header: '', sections: 0 }, 2: { header: '', sections: 0 }, 3: { header: '', sections: 0}, 4: { header: '', sections: 0 }, 5: { header: '', sections: 0 } }
chrome.runtime.onInstalled.addListener(function() {
   chrome.storage.sync.set({ tabLockers: lockers })
});