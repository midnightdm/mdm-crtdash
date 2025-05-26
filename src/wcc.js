import { initializeApp } from 'firebase/app'
import {
  getFirestore, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  query,
  where,
  collection
} from 'firebase/firestore'
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { DataModel } from './DataModel.js'
import { Environment } from './environment'


/* State Management*/
const dataModel = DataModel;
let adminMsg = {};
let user     = {};
let userIsLogged = false;
let userIsAdmin = false;
let showVideo, showVideoOn, webcamNum, webcamZoom, camSwitchBtns, camEnableBtns, fldrBtns, playerMain = null; 

window.env    = Environment

/* Link Database */
const firebaseConfig = window.env.firebaseConfig
const firebaseApp    = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp);
const adminMsgRef = doc(db, 'Passages', 'Admin');
const controlsWebcamSitesRef = doc(db, 'Controls', 'webcamSites');
//const camerasRef = doc(db, 'Cameras');
const auth   = getAuth(firebaseApp);

const insertPoint  = document.getElementById('insert-point');
const siteFolderTabs = document.getElementById('site-folder-tabs')
const preview = document.getElementById('preview')


const holderA      = document.getElementById('cam1');
const holderB      = document.getElementById('cam2');

const cam3         = document.getElementById('cam3');
const iframeBtn    = document.getElementById('iframe-btn');
const loginCntr    = document.getElementById('login-container');
const gridCntr     = document.querySelector('main.grid-container');

const loginEmail   = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const buttonLogout = document.getElementById("logout-btn");
const buttonLogin  = document.getElementById("login-btn");

const buttonVideo  = document.getElementById("video-button");
const buttonVText  = document.getElementById("video-button-text");
const buttonDR     = document.getElementById("skip-downriver-button");
const buttonUR     = document.getElementById("skip-upriver-button");
const buttonSM     = document.getElementById("skip-sawmill-button");


const controlLabel = document.getElementById("control-label");
const controlText  = document.getElementById("control-text");

const switchButtonA = document.getElementById("switch-buttonA");
const switchButtonB = document.getElementById("switch-buttonB");
const switchButtonCL = document.getElementById("switch-buttonCL");
const switchButtonCC = document.getElementById("switch-buttonCC");
const switchButtonCR = document.getElementById("switch-buttonCR");
const switchButtonD = document.getElementById("switch-buttonD");

const ledA = document.querySelector("#switch-buttonA span.led");
const ledB = document.querySelector("#switch-buttonB span.led");
const ledCL = document.querySelector("#switch-buttonCL span.led");
const ledCC = document.querySelector("#switch-buttonCC span.led");
const ledCR = document.querySelector("#switch-buttonCR span.led");
const ledD = document.querySelector("#switch-buttonD span.led");

const refreshLabel   = document.getElementById("refresh-label");
const refreshBtn     = document.getElementById("refresh-button");
const refreshBtnTxt  = document.getElementById("refresh-button-text");
const refreshCtrlTxt = document.getElementById("refresh-control-text");
const timeStatement  = document.getElementById("time-statement");

const resetLabel   = document.getElementById("reset-label");
const resetBtn     = document.getElementById("reset-button");
const resetBtnTxt  = document.getElementById("reset-button-text");
const resetCtrlTxt = document.getElementById("reset-control-text");



const options      = {
  autoplay: "muted",
  preload: "auto",
  responsive: true,
  loadingSpinner: false

}

//General Event Listeners
buttonLogin.addEventListener('click', function() {
  handleLogin();
})


let playerA;
let playerB;





/* * * * * * * * *
* Functions  
*/
async function initWcc() {  
  //Setup data model
  monitorAuthState()
  fetchData()
  setTimeout(buildView, 4000)
  //buildView()
}

async function fetchData() {
    await fetchCameras()
    await fetchSites()
    await loadSavedSite()
}

function buildView() {
    console.log("data for selected site", dataModel.webcamSites, dataModel.webcamSites.clinton);
    dataModel.selectedCamera = dataModel.webcamSites[dataModel.selectedSite].srcID;
    buildFolderTabs()
    buildCameraButtons()
    adjustVideoSize()
    updatePlayer()
    updateTallyLights()
    dataModel.init = false
}

function monitorAuthState() {
  onAuthStateChanged(auth, async (u) => {
    console.log("onAuthStateChanged", u);
    if(u) {
      //write to state management object
      user = u;
      console.log(u.uid+" is logged");
      let adminUsers = await getAdminUsers();
      console.log("adminUsers:", adminUsers);
      if(adminUsers.includes(u.uid)) {
        console.log(u.email+" is admin");
        userIsLogged = true;
        userIsAdmin  = true;
        buttonLogout.classList.add("logged");
        gridCntr.classList.add("logged");
        loginCntr.classList.add("logged");
        //fetchAdminMessages();
        addAdminEventListeners();
      } else if (adminUsers[0]=="No admin users") {
        userIsLogged = false;
        userIsAdmin  = false;
        buttonLogout.classList.remove("logged");
        gridCntr.classList.remove("logged");
        loginCntr.classList.remove("logged");
        console.log("User "+loginEmail.value+"is NOT admin.");
      } 
    } else {
      userIsLogged = false;
      userIsAdmin  = false;
      buttonLogout.classList.remove("logged");
      gridCntr.classList.remove("logged");
      loginCntr.classList.remove("logged");
      console.log("No User data found for "+loginEmail.value+".");
    }     
  });
}


async function fetchCameras() {
    let arr = [], data  
    dataModel.cameras = {}
    const q = query(collection(db, "Cameras"), where("srcID", "!=", ""))
    const camerasSnapshot = onSnapshot( q, (dataSet) => {
        //console.log("fetchCameras()")
        dataSet.docChanges().forEach((docChange)=>{
            data = docChange.doc.data()
            if(docChange.type ==="added") {
                // Only add new cameras to the arr array
                if(!arr.some(x => x.srcID === data.srcID)) {
                    arr.push(data)
                    dataModel.cameras[data.srcID] = data
                }
            } else if(docChange.type === "modified") {
                // Update the existing camera in the arr array
                let index = arr.findIndex(x => x.srcID === data.srcID)
                arr[index] = data
            } else if(docChange.type === "removed") {
                // Remove the duplicate camera from the arr array
                let index = arr.findIndex(x => x.srcID === data.srcID)
                arr.splice(index, 1)
            }
        })
        arr.sort( (a, b) => {
            if(a.srcID.toLowerCase() < b.srcID.toLowerCase()) { return -1 }
            if(a.srcID.toLowerCase() > b.srcID.toLowerCase()) { return  1 }
            return 0
        })        
        dataModel.camerasArr = arr
        if(dataModel.init==true) {
            return
        }
        buildCameraButtons()
        updateTallyLights()
        updatePlayer()
    });    

}


async function fetchSites() {
    const flagsSnapshot = onSnapshot(doc(db, "Controls", "webcamSites"), async (querySnapshot) => {  
        dataModel.webcamSites = querySnapshot.data() 
        //dataModel.selectedCamera = dataModel.webcamSites[dataModel.selectedSite].srcID
        console.log("fetchSites() webcamSites",dataModel.webcamSites)
        updatePlayer()
        updateTallyLights()
    })
}


async function loadSavedSite() {
    try {
        const site = window.localStorage.getItem('wccSelectedSite');
        dataModel.selectedSite = site == undefined || "undefined" ? "regional" : site;
        console.log("loadSavedSite()", window.localStorage)
        return true
    } catch(error) {
        console.error("Error loading site", error)
        return false
    }
}

function buildCameraButtons() {
    let i, bs, bString = "", bHolder = "", btnSets = {}, btn, iStr, selString
    //Build button strings
    for(bs in dataModel.siteList) {
        i=0
        btnSets[bs] = ""
        dataModel.camerasArr.forEach((cam) => {
            iStr = i.toString()
            bString = cam.isViewEnabled==true ? "Enabled":"Disabled"
            btnSets[bs] += 
            `<button class="${dataModel.siteList[bs]} camswitch" id="${dataModel.siteList[bs]+cam.srcID+'btn'}" data-id="${cam.srcID}"><span id="${dataModel.siteList[bs]+cam.srcID+'led'}" class="led"></span>&nbsp;&nbsp;${cam.srcID}</button>
            <button class="camenabled" id="${dataModel.siteList[bs]+cam.srcID+'-Enb'}" data-id="${cam.srcID}"><span class="oval ${bString}">${bString}</span></button></br/>`
            i++
        })
        selString = dataModel.selectedSite==dataModel.siteList[bs] ? " selected" : "";
        bHolder += `<div id="tb-${dataModel.siteList[bs]}" class="tab-body${selString}"><h3>${dataModel.siteList[bs].toUpperCase()}</h3><div><span>SELECT</span> &nbsp;&nbsp;&nbsp;<span>STATUS</span></div><div>${btnSets[bs]}</div></div>`
    }
    insertPoint.innerHTML = bHolder
    //Set Event handlers
    camSwitchBtns = document.getElementsByClassName('camswitch')
    for(i=0; i < camSwitchBtns.length; i++) {
        btn = camSwitchBtns[i]
        btn.addEventListener('click', handleCameraSelection)
    }
    camEnableBtns = document.getElementsByClassName('camenabled')
    for(i=0; i<camEnableBtns.length; i++) {
        btn = camEnableBtns[i]
        btn.addEventListener('click', handleCameraEnable)
    }
}


function buildFolderTabs() {
    let lString = "", selString, btn, i
    dataModel.siteList.forEach( (site) => {
        selString = site==dataModel.selectedSite ? " selected" : ""
        lString += `<li id="${'tab-'+site}" class="ftab${selString}">${site}</li>`
    })
    siteFolderTabs.innerHTML = lString
    fldrBtns = document.getElementsByClassName('ftab')
    for(i=0; i<fldrBtns.length; i++) {
        btn = fldrBtns[i]
        btn.addEventListener('click', handleSiteSelection)
    }
}

function updateTallyLights() {
    //remove all current lights
    let i, selcam, site, srcID, bs, onLeds = document.querySelectorAll('.led.on')    
    for(i=0; i < onLeds?.length; i++) {
        onLeds[i]?.classList.remove('on')
    }
    //Set currently active cameras from the dataModel    
    for(bs in dataModel.siteList) {
        site = dataModel.siteList[bs]
        srcID = dataModel.webcamSites[site].srcID
        console.log("updateTallyLights()",site, srcID)
        selcam = document.querySelectorAll(`[id="${site+srcID+'btn'}"] span.led`)
        selcam[0]?.classList.add('on')
    }
}


async function updatePlayer() {
    let i, camObj = dataModel.cameras[dataModel.selectedCamera]
    console.log("updatePlayer() selectedCamera, camObj", dataModel.selectedCamera, camObj)

    //initiate VJS if new
    if(playerMain == null) {
        const videoPlayerOptions= {
            autoplay: true,
            preload: "auto",
            fluid: false,
            loadingSpinner: false,
            muted: true,
            controls: false,
            aspectRatio: "16:9",
            techOrder: ["html5", "youtube"]
        }
        playerMain = videojs("vt-preview", videoPlayerOptions, function onPlayerReady() {
            this.on('ended', function() {
                this.play();
            });
            this.src({ 
                type: camObj.srcType,
                src: camObj.srcUrl 
                
            });
            console.log("Video playing ", camObj.srcID)
            dataModel.previousCamera = dataModel.selectedCamera
            this.play();
        }); 
    //Otherwise just change source if its different
    } else if(dataModel.selectedCamera != dataModel.previousCamera) {
        playerMain.src({ 
            type: camObj.srcType,
            src: camObj.srcUrl 
        })
        playerMain.play()
        console.log("Video playing ", camObj.srcID)
        dataModel.previousCamera = dataModel.selectedCamera
        return true
    }
    return false
}

function handleCameraSelection() {
    if(!userIsAdmin && !userIsLogged) {
        return alert("User not authorized for remote client refresh operation.")
    }     
    //Write to database
    dataModel.selectedCamera = this.dataset.id
    dataModel.selectedSite   = this.classList[0]
    let webcamSites = Object.assign( {}, dataModel.webcamSites )    
    webcamSites[dataModel.selectedSite].srcID = dataModel.selectedCamera 
    webcamSites[dataModel.selectedSite].zoom  = defineZoom(dataModel.selectedCamera)
    setDoc(controlsWebcamSitesRef, webcamSites, {merge: true})
    adjustVideoSize()
    console.log("handleCamerSelection() site, camera", dataModel.selectedSite,dataModel.webcamSites[dataModel.selectedSite].srcID)
    
}


function adjustVideoSize() {
    //Add CSS flag for certain video sizes
    if(dataModel.webcamSites[dataModel.selectedSite].srcID=="CabinUR") {
        preview.classList.remove('sd')
        preview.classList.add('hd')
    } else if(dataModel.webcamSites[dataModel.selectedSite].srcID=="CabinDR") {
        preview.classList.remove('hd')
        preview.classList.add('sd')
    } else {
        preview.classList.remove('hd', 'sd')
    }
}

function handleSiteSelection() {
    const clickedId = this.id;  // Get the element's ID
    const siteName = clickedId.slice(4); // Extract substring starting from index 4 (after "tab-")
    console.log("handleSiteSelection()", siteName);
    dataModel.selectedSite = siteName
    window.localStorage.setItem('wccSelectedSite', dataModel.selectedSite)
    //Unselect all tabs
    const tabs = document.querySelectorAll('li.ftab.selected')
    tabs.forEach((tab)=> {tab.classList.remove('selected')})
    //Unselect tab-body
    const tb = document.querySelectorAll('div.tab-body.selected')
    tb.forEach((tb)=> tb.classList.remove('selected'))
    //Mark the selcted tab
    const selectedLi = document.getElementById(clickedId) 
    if(selectedLi) {
        selectedLi.classList.add('selected')
    }
    //Mark the selected tab body
    const selectedTabBody = document.getElementById('tb-'+siteName)
    if(selectedTabBody) {
        selectedTabBody.classList.add('selected')
    }
    dataModel.selectedCamera = dataModel.webcamSites[dataModel.selectedSite].srcID
    dataModel.selectedZoom   = defineZoom(dataModel.selectedCamera)
    adjustVideoSize()
    updateTallyLights()
    updatePlayer()

}

function handleCameraEnable() {
    if(!userIsAdmin && !userIsLogged) {
        return alert("User not authorized for camera enable/disable operation.")
    }
    let srcID = this.dataset.id
    let camera = Object.assign( {}, dataModel.cameras[srcID])
    if(camera.isViewEnabled == true) {
        camera.isViewEnabled = false
    }  else {
        camera.isViewEnabled = true
    }
    setDoc(doc(db, "Cameras", srcID), camera)
    //Enabled indicator propigates though fetch to buildButtons
}

function defineZoom(srcID) {
    let zoom
    switch(srcID) {
        case "Sawmill-C": zoom="2"; break;
        case "Sawmill-L": zoom="1"; break;
        case "Sawmill-R": zoom="3"; break;
        default:          zoom="0";
    }
    return zoom;
}

function addAdminEventListeners() {
//   switchButtonA.addEventListener('click', switchToCamA);
//   switchButtonB.addEventListener('click', switchToCamB);
//   switchButtonCL.addEventListener('click', switchToCamCL);
//   switchButtonCC.addEventListener('click', switchToCamCC);
//   switchButtonCR.addEventListener('click', switchToCamCR);
//   switchButtonD.addEventListener('click', switchToCamD);
//   buttonVideo.addEventListener("click", toggleWebcam);
  buttonLogout.addEventListener('click', function() {
    handleLogout();
  })
  
//   cam3.addEventListener('mouseenter', function() {
//     iframeBtn.classList.add('show');
//     console.log("hover");
//     setTimeout(()=>iframeBtn.classList.remove('show'),5000);
//   });
  
//   cam3.addEventListener('click', function() {
//     window.location = "index.html"
//   })
//   playerA = videojs("cameraA", options);
//   playerB = videojs("cameraB", options);
//   refreshBtn.addEventListener("click", refreshClients);
//   resetBtn.addEventListener("click", handleResetCams);
//   buttonDR.addEventListener("click", toggleDownriver);
//   buttonUR.addEventListener("click", toggleUpriver);
//   buttonSM.addEventListener("click", toggleSawmill);

}

//Not needed?
function fetchAdminMessages() {
  const adminSnapshot = onSnapshot(doc(db, "Passages", "Admin"), (querySnapshot) => {  
    let dataSet = querySnapshot.data();
    adminMsg =  Object.assign({}, dataSet);
    showVideo   = dataSet.showClVideo;
    showVideoOn = dataSet.showClVideoOn;
    webcamNum   = dataSet.webcamNumCl;
    webcamZoom  = dataSet.webcamZoomCl;
    updateTallyLights()    
    //outputWebcamControl(showVideoOn, showVideo, webcamNum);
  });
}         

async function getAdminUsers() {
  const docRef = doc(db, "Passages", "Admin");
  const docSnap = await getDoc(docRef);
  let adminUsers, msg
  return new Promise((resolve, reject) => {
    if(docSnap.exists()) {
      msg = docSnap.data();
      adminUsers = msg.adminUsers;
      resolve(adminUsers);
    } else {
      reject(["No admin users"]);
    }
  })  
}

async function handleLogin() {
  console.log("handleLogin for", loginEmail.value);
  await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
  .then((u) => {
    console.log("signInWithEmailAndPassword -> user", u);
    if(testLoggeduserIsAdmin(u.user.uid)) {
      userIsLogged = true;
    }
    
    console.log("userIsAdmin =", userIsAdmin)
  }).catch((error) => {
    alert("Login error"+ error);
   
  })
  
}

function handleLogout() {
  console.log("logging out now.");
  signOut(auth).then(()=>{}).catch((error)=>{alert("There was a problem signing out:"+error)})
  buttonLogout.classList.remove("logged");
  gridCntr.classList.remove("logged");
  loginCntr.classList.remove("logged");
}

async function handleResetCams() {
  let pkg = {
    action: "resetWebcams",
    authUser: window.env.authUser,
    authToken: window.env.clientCode
  }
  const myHeaders = new Headers({
    'Content-Type': 'application/json'
    
  });
  const response = await fetch(window.env.gcfUrl, { 
    method:'POST', 
    headers: myHeaders,
    body: JSON.stringify(pkg)
  })
  //.catch(function (error){
  //  console.error(error);
  //})

  if(response.status===200) {
    const data = await response.json();
    console.log("handleResetCams response", data)
  } else {
    alert("handleResetCams response: "+response.status)
  }
}



function getTime() { 
  var date = new Date(); 
  var now = { 
    month: (date.getMonth()+1),
    date: date.getDate(),
    hour: date.getHours(), 
    min: date.getMinutes(), 
    sec: date.getSeconds() 
  }
  if(now.month > 12) { now.month = 1; }
  return now; 
} 

function xSecondsLater(time, x) {
  let sec = time.sec + x;
  let min = time.min;
  if(sec>59) { 
    sec = 60-sec; 
    min = min+1;
  }
  if(min>59) {
    min = 0;
  }
  return {sec, min };
}



function testLoggeduserIsAdmin(uid) {
  //Test that obj property is array
  if(Array.isArray(adminMsg.adminUsers) && adminMsg.adminUsers.length) {
    userIsAdmin = adminMsg.adminUsers.includes(uid);
    return userIsAdmin;
  } else {
    userIsAdmin = false;
    return userIsAdmin;
  }
}




//Activate
initWcc();