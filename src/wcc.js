import { initializeApp } from 'firebase/app'
import {
  getFirestore, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc
} from 'firebase/firestore'
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { Environment } from './environment'


/* State Management*/
let adminMsg = {};
let user     = {};
let userIsLogged = false;
let userIsAdmin = false;
let showVideo, showVideoOn, webcamNum, webcamZoom; 

window.env    = Environment
const firebaseConfig = window.env.firebaseConfig
const firebaseApp    = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp);
const adminMsgRef = doc(db, 'Passages', 'Admin');
const auth   = getAuth(firebaseApp);

const cameraA      = document.getElementById('cameraA');
const cameraB      = document.getElementById('cameraB');
const cameraC      = document.getElementById('cameraC');
const cameraD      = document.getElementById('cameraD');

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

/* Content values */
const taLabel = "Trigger Activated";
const toLabel = "Trigger Off";
const taText  = "A near-by vessel has triggered the cabin webcams to broadcast live.";
const toText  = "The cabin webcams are not currently triggered by any vessels.";
const ccLabelOn = "Enabled";
const ccTextOn  = "Cabin webcams are enabled for live streaming. Press the button above to override server control.";
const ccLabelOff = "Disabled";
const ccTextOff  = "The cabin webcams are disabled from server control. No video broadcasts will be allowed until you enable them.";



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
  monitorAuthState();  
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
        fetchAdminMessages();
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

function addAdminEventListeners() {
  switchButtonA.addEventListener('click', switchToCamA);
  switchButtonB.addEventListener('click', switchToCamB);
  switchButtonCL.addEventListener('click', switchToCamCL);
  switchButtonCC.addEventListener('click', switchToCamCC);
  switchButtonCR.addEventListener('click', switchToCamCR);
  switchButtonD.addEventListener('click', switchToCamD);
  buttonVideo.addEventListener("click", toggleWebcam);
  buttonLogout.addEventListener('click', function() {
    handleLogout();
  })
  
  cam3.addEventListener('mouseenter', function() {
    iframeBtn.classList.add('show');
    console.log("hover");
    setTimeout(()=>iframeBtn.classList.remove('show'),5000);
  });
  
  cam3.addEventListener('click', function() {
    window.location = "index.html"
  })
  playerA = videojs("cameraA", options);
  playerB = videojs("cameraB", options);
  refreshBtn.addEventListener("click", refreshClients);
  resetBtn.addEventListener("click", handleResetCams);
  buttonDR.addEventListener("click", toggleDownriver);
  buttonUR.addEventListener("click", toggleUpriver);
  buttonSM.addEventListener("click", toggleSawmill);

}

function fetchAdminMessages() {
  const adminSnapshot = onSnapshot(doc(db, "Passages", "Admin"), (querySnapshot) => {  
    let dataSet = querySnapshot.data();
    adminMsg =  Object.assign({}, dataSet);
    showVideo   = dataSet.showClVideo;
    showVideoOn = dataSet.showClVideoOn;
    webcamNum   = dataSet.webcamNumCl;
    webcamZoom  = dataSet.webcamZoomCl;
    updateTallyLights()    
    outputWebcamControl(showVideoOn, showVideo, webcamNum);
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


function toggleWebcam() {
  console.log("toggleWebcam()",adminMsg);
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  if(adminMsg.showClVideoOn==true) {
    adminMsg.showClVideoOn=false
  } else {
    adminMsg.showClVideoOn=true
  }
  setDoc(adminMsgRef, adminMsg, {merge: true})
}


function toggleDownriver() {
    console.log("toggleDownriver()",adminMsg);
    if(!userIsAdmin && !userIsLogged) {
      return alert("User not authorized for webcam operation.")
    }
    if(adminMsg.webcamClaIsDisabled==true) {
      adminMsg.webcamClaIsDisabled=false
      document.getElementById("skip-downriver-span").classList.add("green");
    } else {
      adminMsg.webcamClaIsDisabled=true
    }
    setDoc(adminMsgRef, adminMsg, {merge: true})
}

function toggleUpriver() {
    console.log("toggleUpriver()",adminMsg);
    if(!userIsAdmin && !userIsLogged) {
      return alert("User not authorized for webcam operation.")
    }
    if(adminMsg.webcamClbIsDisabled==true) {
      adminMsg.webcamClbIsDisabled=false
      document.getElementById("skip-upriver-span").classList.add("green")
    } else {
      adminMsg.webcamClbIsDisabled=true
    }
    setDoc(adminMsgRef, adminMsg, {merge: true})
}

function toggleSawmill() {
    console.log("toggleSawmill()",adminMsg);
    if(!userIsAdmin && !userIsLogged) {
      return alert("User not authorized for webcam operation.")
    }
    if(adminMsg.webcamClcIsDisabled==true) {
      adminMsg.webcamClcIsDisabled=false
      document.getElementById("skip-sawmill-span").classList.add("green")
    } else {
      adminMsg.webcamClcIsDisabled=true
    }
    setDoc(adminMsgRef, adminMsg, {merge: true})
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


function refreshClients() {
  const tsbase = "15 seconds after pressing"
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for remote client refresh operation.")
  }
  let now = getTime()
  let n15 = xSecondsLater(now, 15)
  let tsmsg = "at "+n15.min+":"+n15.sec+" on the screen clock"
  timeStatement.innerText = tsmsg
  adminMsg.resetTime[4] = n15
  setDoc(adminMsgRef, adminMsg, {merge: true})
  setTimeout(()=>{
    adminMsg.resetTime.pop()
    setDoc(adminMsgRef, adminMsg, {merge: true})
    timeStatement.innerText = tsbase
  },30000)

}

function switchToCamA() {
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  adminMsg.webcamNumCl = "A";
  updateTallyLights();
  setDoc(adminMsgRef, adminMsg, {merge: true})
}


function switchToCamB() {
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  adminMsg.webcamNumCl = "B";
  updateTallyLights();
  setDoc(adminMsgRef, adminMsg, {merge: true})
}

function switchToCamCL() {
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  adminMsg.webcamNumCl = "C";
  adminMsg.webcamZoomCl = 1;
  updateTallyLights();
  setDoc(adminMsgRef, adminMsg, {merge: true})
}

function switchToCamCC() {
   if(!userIsAdmin && !userIsLogged) {
     return alert("User not authorized for webcam operation.")
   }
   adminMsg.webcamNumCl = "C";
   adminMsg.webcamZoomCl = 2;
   updateTallyLights();
   setDoc(adminMsgRef, adminMsg, {merge: true})
 }

 function switchToCamCR() {
   if(!userIsAdmin && !userIsLogged) {
     return alert("User not authorized for webcam operation.")
   }
   adminMsg.webcamNumCl = "C";
   adminMsg.webcamZoomCl = 3;
   updateTallyLights();
   setDoc(adminMsgRef, adminMsg, {merge: true})
 }

function switchToCamD() {
    console.log("switchToCamD()");
    if(!userIsAdmin && !userIsLogged) {
        return alert("User not authorized for webcam operation.")
    }
    adminMsg.webcamNumCl = "D";
    updateTallyLights();
    setDoc(adminMsgRef, adminMsg, {merge: true})
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


function updateTallyLights() {
    console.log("updateTallyLights() webcamZoom="+webcamZoom);
    ledA.classList.remove("on")
    ledB.classList.remove("on");
    ledCL.classList.remove("on");
    ledCC.classList.remove("on");
    ledCR.classList.remove("on");
    ledD.classList.remove("on")
  if(webcamNum=="A") {
    ledA.classList.add("on")
  }
  if(webcamNum=="B") {
    ledB.classList.add("on")
  }
  if(webcamNum=="C") {

   if(webcamZoom==1) {
      ledCL.classList.add("on");
   } 
   if(webcamZoom==2) {
      ledCC.classList.add("on");
   }
   if(webcamZoom==3) {
      ledCR.classList.add("on");
   }
  }
  if(webcamNum=="D") {
    ledD.classList.add("on")
  }
  if(adminMsg.webcamClaIsDisabled) {
    document.getElementById("skip-downriver-span").classList.remove("green");
  } else {
    document.getElementById("skip-downriver-span").classList.add("green");
  }
  if(adminMsg.webcamClbIsDisabled) {
    document.getElementById("skip-upriver-span").classList.remove("green");
  } else {
    document.getElementById("skip-upriver-span").classList.add("green");
  }
  if(adminMsg.webcamClcIsDisabled) {
    document.getElementById("skip-sawmill-span").classList.remove("green");
  } else {
    document.getElementById("skip-sawmill-span").classList.add("green");
  }



}


function outputWebcamControl(showVideoOn, showVideo, webcamNum) {
  
  if(showVideoOn==true) {
    controlLabel.innerText = "Video "+ccLabelOn;
    controlLabel.classList.add("green");
    controlText.innerText  = ccTextOn;
    buttonVText.innerText = "Disable";
  } else if(showVideoOn==false) {
    controlLabel.innerText = "Video "+ccLabelOff;
    controlLabel.classList.add("red");
    controlText.innerText = ccTextOff;
    buttonVText.innerText = "Enable";
  }
  if(showVideo==true && showVideoOn==true) {
    if(webcamNum=="A") {
      holderA.classList.add('active');
      holderB.classList.remove('active');
      console.log("A active")
    }
    if(webcamNum=="B") {
      holderB.classList.add('active');
      holderA.classList.remove('active');  
      console.log("B active")
    }
  }
  
  console.log("outputWebcamControl() "+showVideoOn+showVideo+webcamNum);
}


//Activate
initWcc();