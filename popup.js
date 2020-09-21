let listDiv = document.getElementById("locker-container");
let saveSlots = [1,2,3,4,5]
const SECTION_LIMIT = 15

// ///WHEN "LOCKING" make sure MORE THAN visually 'CLOSED"
function makeTwoElements(elem) {
  return [document.createElement(elem),document.createElement(elem)]
}

function clearClassList(elem) {
  var classList = elem.classList;
  while (classList.length > 0) {
    classList.remove(classList.item(0));
  }
  return elem
}

function createLocker(slot) {
  let inputInfo = document.getElementById("name-" + slot)
  let date = new Date()
  let period = date.getHours() >= 12 ? "PM" : "AM"
  let [month,day,year,hours,mins] = [date.getMonth() + 1, date.getDate(), date.getFullYear(), Math.ceil((date.getHours()+ 1)/2), date.getMinutes()]
  let formattedDate = `${month}/${day}/${year} ${hours}:${mins < 10 ? '0' + mins : mins} ${period}`

  chrome.storage.sync.get("tabLockers",function({tabLockers}) {
    chrome.tabs.query({currentWindow: true}, tabs => {
      let newTabs = tabs.map(({url,title,favIconUrl}) => {
        return {url, title, favIconUrl}
      })
      let sections =  Math.ceil(newTabs.length/SECTION_LIMIT)
      let newStorage = { 
        ...tabLockers,
        [slot]: { 
          header: inputInfo.value || formattedDate, 
          sections
        }
      }
      chrome.storage.sync.set({tabLockers:  newStorage})
      for(let i = 1; i <= sections;i++) {
        chrome.storage.sync.set({[`tabLocker${slot}${i}`] : newTabs.slice(SECTION_LIMIT * (i-1), SECTION_LIMIT * i)})
      }
      resetLocker(slot, newTabs, newStorage[slot].header)
    })
  })
}

function removeLocker(slot) {
  chrome.storage.sync.get("tabLockers",function({tabLockers}) {
    let slotSections = tabLockers[slot].sections
    let newStorage = { ...tabLockers, [slot]: {header: "", sections: 0}} 
    chrome.storage.sync.set({tabLockers:  newStorage})
    let sectionsToRemove = [...Array(slotSections)].map((e,index) => `tabLocker${slot}${index + 1}`)
    chrome.storage.sync.remove(sectionsToRemove, resetLocker.bind(null, slot, []))
  })
}

function openWindow(tabs) {
  chrome.windows.create({url: tabs.map(tab => tab.url), state: "maximized"})
}

function resetButtons(saveButton, deleteButton, tabs, slot) {
  let newSaveBtn = clearClassList(saveButton.cloneNode(true))
  let newDeleteBtn = deleteButton.cloneNode(true)
  newSaveBtn.innerText = tabs.length ? "Open " + tabs.length + " Tabs" : "Save Tabs"  
  newSaveBtn.classList.add( tabs.length ? "open" : "save")
  newSaveBtn.addEventListener("click", tabs.length ? openWindow.bind(this, tabs) : createLocker.bind(this, slot))
  newDeleteBtn.disabled = !tabs.length
  tabs.length && newDeleteBtn.addEventListener("click", removeLocker.bind(this,slot))
  newDeleteBtn.classList.add("delete")

  saveButton.parentNode.replaceChild(newSaveBtn, saveButton);
  deleteButton.parentNode.replaceChild(newDeleteBtn, deleteButton);
}

function resetTopDiv(topDiv, tabLength, slot, header) {
  let inputInfo = document.getElementById("name-" + slot)
  let nameInput = document.createElement("input")      
  inputInfo && inputInfo.remove()
  topDiv.classList.add("locker-name")
  topDiv.innerText = tabLength ? header : ""
  if(!tabLength) {
    nameInput.id = "name-" + slot
    nameInput.style.padding = "3px"
    nameInput.style.textAlign = "center"
    nameInput.placeholder = "INSERT NAME"
    nameInput.maxLength = 21
    topDiv.appendChild(nameInput)
  }
}

function resetLocker(slot, tabs, header){
  ///ADD A LITTLE SOMETHING, ANIMATION???
    let listItem = document.getElementById("locker-" + slot)
    resetButtons(...listItem.children[1].children, tabs, slot)
    resetTopDiv(listItem.children[0], tabs.length, slot, header)
}

function startUpView(tabsList, lockers) {
  Object.entries(tabsList).forEach(function([slot,tabs]){
    let nameInput = document.createElement("input")
    let listItem = document.createElement("li")
    let [topDiv, botDiv] = makeTwoElements("div")
    let [saveBtn,deleteBtn] = makeTwoElements("button")
    nameInput.id = "name-" + slot
    nameInput.style.padding = "3px"
    nameInput.style.textAlign = "center"
    nameInput.placeholder = "INSERT NAME"
    nameInput.maxLength = 21
    listItem.id = "locker-" + slot      
    listItem.classList.add("lockers")
    topDiv.classList.add("locker-name")
    botDiv.style.display = "flex"
    botDiv.style.display = "space between"
    saveBtn.classList.add( tabs.length ? "open" : "save")    
    saveBtn.innerText = tabs.length ? "Open " + tabs.length + " Tabs" : "Save Tabs"
    saveBtn.addEventListener("click", tabs.length ? openWindow.bind(null, tabs) : createLocker.bind(null, slot))
    deleteBtn.innerText = "Delete"
    deleteBtn.disabled = !tabs.length
    deleteBtn.classList.add("delete")
    if(tabs.length) {
      deleteBtn.addEventListener("click", removeLocker.bind(null, slot))
      nameInput.display = "none"
      topDiv.innerText = lockers[slot].header || tabs.length + " Tabs"
    } else {
      topDiv.appendChild(nameInput)
    }
    botDiv.appendChild(saveBtn)
    botDiv.appendChild(deleteBtn)
    listDiv.appendChild(listItem)
    listItem.appendChild(topDiv)
    listItem.appendChild(botDiv)
  })
}

function startUpData(callback, lockers) {
  let tabsList = {}
  saveSlots.forEach((slot, slotIndex) => {
    let tabsForSlot = []
    let sections = lockers[slot].sections
    let i = 0;
    for(let i = 0; i === 0 || i < sections; i++) {
      let tabsChunkTag = `tabLocker${slot}${i + 1}`
      chrome.storage.sync.get(tabsChunkTag, function (result) {
        if(sections === 0) {//if slot has no saved tabs move along
          tabsList[slot] = tabsForSlot 
          if(slot === 5) {
            callback(tabsList,lockers)
          }
          return
        }
        tabsForSlot.push(...result[tabsChunkTag])
        if(i + 1 === sections) { tabsList[slot] = tabsForSlot }
        if(slot === 5)  { callback(tabsList, lockers)}
      })
    }
  })
}

function startUp() {
  //call this on download?v?v?v?v?v?v?
  // chrome.storage.sync.set({tabLockers:  {1: {header: '', sections: 0}, 2:{header:'', sections: 0}, 3: {header:'', sections:0}, 4:{header:'', sections:0}, 5:{header:'', sections:0}}})
  chrome.storage.sync.get("tabLockers", function({tabLockers}) { 
    let lockers = tabLockers || {1: {header: '', sections: 0}, 2:{header:'', sections: 0}, 3: {header:'', sections:0}, 4:{header:'', sections:0}, 5:{header:'', sections:0}}
    startUpData(startUpView, lockers)
  })
}
startUp()
