<script>
import { onMount } from "svelte";
const SECTION_LIMIT = 15

// state
let lockers = {1: {header: '', sections: 0}, 2:{header:'', sections: 0}, 3: {header:'', sections:0}, 4:{header:'', sections:0}, 5:{header:'', sections:0}}
let tabsList = {1:[], 2:[], 3:[], 4:[], 5:[]}
let tempHeaders = {1:'',2:'',3:'',4:'',5:''}

//mutations
function clearState(slot) {
	lockers[slot] = {header: '', sections: 0}
	tabsList[slot] = []
	tempHeaders[slot] = ''
}
function updateLocker(slot,tabs,locker){
	lockers[slot] = locker
	tabsList[slot] = tabs
}
function setTabsList(slot,tabs) {
	tabsList[slot] = tabs
}

//utils
function openWindow(tabs) {
	chrome.windows.create({url: tabs, state: "maximized"})
}
function getCurrentDate(){
	let now = new Date()
  let hoursin24 = now.getHours()
	return {
		month: now.getMonth() + 1, 
		day: now.getDate(), 
		year: now.getFullYear(), 
		hours: hoursin24 > 12 ? hoursin24 - 12 : hoursin24 === 0 ? 12 : hoursin24, 
		minutes: now.getMinutes(),
		period: hoursin24 >= 12 ? "PM" : "AM"
	}
}

//methods
function createLocker(slot) {
	let {month,day,year,hours,minutes,period} = getCurrentDate()
	let newHeader = tempHeaders[slot] || `${month}/${day}/${year} ${hours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`
	chrome.tabs.query({currentWindow: true},(tabs) => {
		let newTabs = tabs.map(({url}) => url)	
		let sections =  Math.ceil(newTabs.length/SECTION_LIMIT)
		let newLocker = { header: newHeader, sections}
		let newStorage = {...lockers,[slot]: newLocker}
		chrome.storage.sync.set({tabLockers: newStorage}, () => {
			for(let i = 1; i <= sections; i++) {
				chrome.storage.sync.set({[`tabLocker${slot}${i}`] : newTabs.slice(SECTION_LIMIT * (i-1), SECTION_LIMIT * i)})
			}
			updateLocker(slot, newTabs, newLocker)
		})
	})
}
function deleteLocker(slot) {
	let newStorage = {...lockers}
	newStorage[slot] = {header: "", sections: 0}
	let slotSections = lockers[slot].sections
	let sectionsToRemove = [...Array(slotSections)].map((section) => `tabLocker${slot}${section}`)
	chrome.storage.sync.set({tabLockers:  newStorage}, () => {
		chrome.storage.sync.remove(sectionsToRemove, () => clearState(slot))
	})
}
function initTabList() {
	Object.keys(lockers).forEach(slotNum => {
		let sections = lockers[slotNum].sections
		if(!sections){ //if falsey i.e: 0,undefined,null
			setTabsList(slotNum, [])
			return
		}else{
			let tabsForSlot = []
			for(let i = 1; i <= sections; i++) {
				let tabsChunkTag = `tabLocker${slotNum}${i}`
				chrome.storage.sync.get(tabsChunkTag, function (result) {
					tabsForSlot.push(...result[tabsChunkTag])
					if(i === sections) setTabsList(slotNum,tabsForSlot)
				})
			}
		}
	})
}
//Lifecycle methods
onMount(() => {
	chrome.storage.sync.get("tabLockers", ({tabLockers}) => { 
		lockers = tabLockers || lockers
		initTabList()
	})
})
</script>

<main>
	<ul id="locker-container">
		{#each Object.keys(lockers) as slot}
			<li id="locker-{slot}" class="lockers">
				<div class="locker-name">
					{#if lockers[slot].header}
						<div>{lockers[slot].header}</div>
					{:else}
						<input id="name-{slot}" bind:value={tempHeaders[slot]} class="name-input" placeholder="INSERT NAME" maxlength="21">
					{/if}
				</div>
				<div class="buttons">
					{#if tabsList[slot].length}
						<button class="open" on:click={() => openWindow(tabsList[slot])}>Open {tabsList[slot].length} Tabs</button>
					{:else}
						<button class="save" on:click={() => createLocker(slot)}>Save Tabs</button>
					{/if}
					<button disabled="{!tabsList[slot].length}" class="delete" on:click={() => deleteLocker(slot)}>Delete</button>
				</div>
			</li>
		{/each}
	</ul>
</main>

<style>
	.open {
		background: #3bbf53;
	}
	.open:hover {
		box-shadow:  0 0 15px #3bbf53, 0 0 20px #3bbf53, 0 0 25px #3bbf53;
	}
	.save {
		background: #6c9974;
	}
	.save:hover {
		box-shadow: 0 0 15px #6c9974, 0 0 20px #6c9974, 0 0 25px #6c9974;
	}
	.delete {
		background: #f43838;
	}
	.delete:enabled:hover {
		box-shadow: 0 0 15px #f43838, 0 0 20px #f43838, 0 0 25px #f43838;
	}
	.delete:disabled {
		background: #ece9e9;
	}
	#locker-container {
		list-style: none;
		padding: 0;
		width: 14rem;
	}
	.lockers {
		max-height: 7em;
		text-align: center;
		padding: 0.25rem;
		margin: 0.25rem;
		border: 2px solid black;
		background-color: #4d4855;
		background-image: linear-gradient(192deg, #4d4855 0%, #000000 74%);
	}
	.name-input {
		padding: 2px 0;
		text-align: center;
		outline: none;
	}
	.locker-name {
		color: #fff;
		font-size: 14px;
		margin: 5px;
		text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0073e64f, 0 0 20px #0073e64f, 0 0 25px #0073e64f, 0 0 30px #0073e64f, 0 0 35px #0073e64f;
	}
	.locker-name > div{
		padding: 2px;
	}
	.buttons {
		display: flex;
		justify-content: space-between;
	}
</style>
