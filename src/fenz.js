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
let showVideo, showVideoOn, webcamNum; 

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

const controlLabel = document.getElementById("control-label");
const controlText  = document.getElementById("control-text");

const refreshLabel   = document.getElementById("refresh-label");
const refreshBtn     = document.getElementById("refresh-button");
const refreshBtnTxt  = document.getElementById("refresh-button-text");
const refreshCtrlTxt = document.getElementById("refresh-control-text");

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
}

//Event Listeners
buttonLogin.addEventListener('click', function() {
  console.log("handleLogin for",loginEmail.value);
  handleLogin();
})


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
let playerA = videojs("cameraA", options);
let playerB = videojs("cameraB", options);
//let playerC = videojs("cameraC", options);
//let playerD = videojs("cameraD", options);
//playerA.requestFullScreen();


/* * * * * * * * *
* Functions  
*/
async function initWcc() {  
  //Setup data model
  monitorAuthState();
  fetchAdminMessages();
  
  //Add event listeners

  
  buttonVideo.addEventListener("click", toggleWebcam);
  //buttonAudio.addEventListener("click", toggleWebaudio);
  //buttonLogin.addEventListener("click", handleLogin);
  //buttonLogout.addEventListener("click", handleLogout);
  cameraA.addEventListener("click", switchToCamA);
  cameraB.addEventListener("click", switchToCamB);
  
  
  
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
      } else if (adminUsers[0]=="No admin users") {
        userIsLogged = false;
        userIsAdmin  = false;
        buttonLogout.classList.remove("logged");
        gridCntr.classList.remove("logged");
        loginCntr.classList.remove("logged");
        console.log("User is NOT admin.");
      } 
    } else {
      userIsLogged = false;
      userIsAdmin  = false;
      buttonLogout.classList.remove("logged");
      gridCntr.classList.remove("logged");
      loginCntr.classList.remove("logged");
      console.log("No User data found.");
    }     
  });
}

function fetchAdminMessages() {
  const adminSnapshot = onSnapshot(doc(db, "Passages", "Admin"), (querySnapshot) => {  
    let dataSet = querySnapshot.data();
    //adminMsg =  Object.assign({}, dataSet);
    
    showVideo   = dataSet.showClVideo;
    showVideoOn = dataSet.showClVideoOn;
    webcamNum   = dataSet.webcamNumCl;
    
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
  await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
  .then((u) => {
    console.log("signInWithEmailAndPassword -> user", u);
    if(testLoggeduserIsAdmin(u.user.uid)) {
      userIsLogged = true;
    }
    
    console.log("userIsAdmin =", userIsAdmin)
  }).catch((error) => {
    console.log("Login error", error);
  })
  
}

function handleLogout() {
  console.log("logging out now.");
  signOut(auth).then(()=>{}).catch((error)=>{alert("There was a problem signing out:"+error)})
  buttonLogout.classList.remove("logged");
  gridCntr.classList.remove("logged");
  loginCntr.classList.remove("logged");
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

function switchToCamA() {
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  adminMsg.webcamNumCl = "A";
  setDoc(adminMsgRef, adminMsg, {merge: true})
}


function switchToCamB() {
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  adminMsg.webcamNumCl = "B";
  setDoc(adminMsgRef, adminMsg, {merge: true})
}


function outputWebcamControl(showVideoOn, showVideo, webcamNum) {
  
  if(showVideoOn==true) {
    controlLabel.innerText = "Video "+ccLabelOn;
    controlLabel.className = "green";
    controlText.innerText  = ccTextOn;
    buttonVText.innerText = "Disable";
  } else if(showVideoOn==false) {
    controlLabel.innerText = "Video "+ccLabelOff;
    controlLabel.className = "red";
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
  
  console.log("outputWebcamControl() "+showVideoOn+showvideo+webcamNum);
}


//Activate
initWcc();