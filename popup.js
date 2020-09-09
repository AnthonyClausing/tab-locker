//get ul element of list
let listDiv = document.getElementById("locker-container");
let saveSlots = [1,2,3,4,5]

///////WHY RESET WHOLE THING
//////WHY RESET WHOLE THING
///WHY RESET WHOLE THING
///////WHY RESET WHOLE THING
//////WHY RESET WHOLE THING
///////WHY RESET WHOLE THING
////LIMIT ON INPUT 22 characters?
///WHEN "LOCKING" make sure MORE THAN visually 'CLOSED"
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
  let formattedDate = `${month}/${day}/${year} ${hours}:${mins} ${period}`

  chrome.storage.sync.get("sb_lockers",function({sb_lockers}) { //get the data
    chrome.tabs.query({currentWindow: true}, tabs => { // get the tabs
      let newStorage = { //normalize the tabs into payload object
        ...sb_lockers,
        [slot]: { 
          header: inputInfo.value || formattedDate, 
          tabs: tabs.map(({url,title,favIconUrl}) => {
            return {url, title, favIconUrl}
          }) 
        }
      }
      chrome.storage.sync.set({sb_lockers:  newStorage}, resetView) //set the data on storage
    })
  })
}

function removeLocker(slot) {
  chrome.storage.sync.get("sb_lockers",function({sb_lockers}) { //get the data
    let newStorage = { ...sb_lockers, [slot]: {}} //reassign slot
    chrome.storage.sync.set({sb_lockers:  newStorage}, resetView) //set the data on storage
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
    nameInput.placeholder = "Type Name Before Saving"
    topDiv.appendChild(nameInput)
  }
}
function resetView(){
  ///ADD A LITTLE SOMETHING, ANIMATION???
  chrome.storage.sync.get("sb_lockers", function({sb_lockers}) { 
    let lockers = sb_lockers || {}
    saveSlots.forEach((slot) => {
      let listItem = document.getElementById("locker-" + slot)
      let tabs = lockers[slot] && lockers[slot].tabs || []
      let header = lockers[slot] && lockers[slot].header || ""
      resetButtons(...listItem.children[1].children, tabs, slot)
      resetTopDiv(listItem.children[0], tabs.length, slot, header)
    })
  })
}
function startUp() {
  chrome.storage.sync.get("sb_lockers", function({sb_lockers}) { 
    let lockers = sb_lockers || {}
    saveSlots.forEach((slot) => {
      let tabs = lockers[slot] && lockers[slot].tabs || []
      let nameInput = document.createElement("input")
      let listItem = document.createElement("li")
      let [topDiv, botDiv] = makeTwoElements("div")
      let [saveBtn,deleteBtn] = makeTwoElements("button")

      nameInput.id = "name-" + slot
      nameInput.style.padding = "3px"
      nameInput.placeholder = "Type Name Before Saving"
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
        deleteBtn.addEventListener("click", removeLocker.bind(null,slot))
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
  })
}
startUp()
