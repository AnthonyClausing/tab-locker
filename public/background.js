let lockers = { 1: { header: '', sections: 0 }, 2: { header: '', sections: 0 }, 3: { header: '', sections: 0}, 4: { header: '', sections: 0 }, 5: { header: '', sections: 0 } }

chrome.runtime.onInstalled.addListener(function({reason}) {
   if(reason === "install") {
      chrome.storage.sync.get("tabLockers", ({tabLockers}) => { 
         if(!tabLockers) {
            chrome.storage.sync.set({ tabLockers: lockers })
         }
      })
   }
});
