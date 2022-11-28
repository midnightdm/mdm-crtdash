import { initializeApp } from 'firebase/app'
import {
  getFirestore, 
  onSnapshot, 
  doc, 
  setDoc
} from 'firebase/firestore'
import { getAuth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { Environment } from './environment'

//CSS animation 
const animateCSS = (element, animation, prefix = 'animate__') => {
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = document.querySelector(element);
    node.classList.add(`${prefix}animated`, animationName);
    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }
    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });
}

/* State Management*/
let adminMsg = {};
let user     = {};
let userIsLogged = false;
let userIsAdmin = false;


/* Helper objects */
let playerA = videojs("cameraA", {
  autoplay: "muted",
  preload: "auto"
});
let playerB = videojs("cameraB", {
  autoplay: "muted",
  preload: "auto"
});


window.env    = Environment
const firebaseConfig = window.env.firebaseConfig
const firebaseApp    = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp);
const adminMsgRef = doc(db, 'Passages', 'Admin');
const auth   = getAuth(firebaseApp);


/* Content values */
const taLabel = "Trigger Activated";
const toLabel = "Trigger Off";
const taText  = "A near-by vessel has triggered the cabin webcams to broadcast live.";
const toText  = "The cabin webcams are not currently triggered by any vessels.";
const ccLabelOn = "Enabled";
const ccTextOn  = "The cabin webcams are enabled to go live if triggered by a server event. Press the button below to override server control.";
const ccLabelOff = "Disabled";
const ccTextOff  = "The cabin webcams are disabled from server control. No video broadcasts will be allowed until you enable them.";
const auTextOn = "Cabin microphones are enabld. Audio will broadcast whenever the camera is streaming unless you press the button below.";
const auTextOff = "Cabin microphones are disabled from server contorl. No audio will broadcast until you enable it.";



/* DOM references */
const cameraA      = document.getElementById('cameraA');
const cameraB      = document.getElementById('cameraB');
const holderA      = document.getElementById('cameraA-container');
const holderB      = document.getElementById('cameraB-container');

const controlLabel = document.getElementById("control-label");
const controlText  = document.getElementById("control-text");

const audioLabel   = document.getElementById("audio-label");
const audioText    = document.getElementById("audio-text");

const triggerLabel = document.getElementById("trigger-label");
const triggerText  = document.getElementById("trigger-text");

const buttonVideo  = document.getElementById("video-button");
const buttonAudio  = document.getElementById("audio-button");
const buttonVText  = document.getElementById("video-button-text");
const buttonAText  = document.getElementById("audio-button-text");
const buttonLogin  = document.getElementById("login-btn");
const buttonLogout = document.getElementById("logout-btn");


/* * * * * * * * *
* Functions  
*/
function initWcc() {  
  //Setup data model
  fetchAdminMessages();

  //Add event listeners
  buttonVideo.addEventListener("click", toggleWebcam);
  buttonAudio.addEventListener("click", toggleWebaudio);
  buttonLogin.addEventListener("click", handleLogin);
  buttonLogout.addEventListener("click", handleLogout);
  cameraA.addEventListener("click", switchToCamA);
  cameraB.addEventListener("click", switchToCamB);
  onAuthStateChanged(auth, (u) => {
    console.log("onAuthStateChanged u", u);
    if(u) {
      user = u;
      if(testLoggeduserIsAdmin(u.uid)) {
        buttonLogout.style = `display: block`;
      }
    } else {
      userIsLogged = false;
      userIsAdmin  = false;
      buttonLogout.style = `visibility: hidden`;
      console.log("User is logged out.");
    }
    console.log("user state changed", user);
  });
}

async function fetchAdminMessages() {
  const adminSnapshot = onSnapshot(doc(db, "Passages", "Admin"), (querySnapshot) => {  
    let dataSet = querySnapshot.data();
    adminMsg =  Object.assign({}, dataSet);
    let showVideo, showVideoOn, webcamNum, showAudioOn;    
    showVideo   = dataSet.showClVideo;
    showVideoOn = dataSet.showClVideoOn;
    webcamNum   = dataSet.webcamNumCl;
    showAudioOn = dataSet.showClAudioOn;
    outputWebcamControl(showVideoOn, showAudioOn, showVideo, webcamNum);
  })
  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  });
}         

async function handleLogin() {

  await signInWithEmailAndPassword(auth, "admin@clintonrivertraffic.com", "SnoodleDog")
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
}

function outputWebcamControl(showVideoOn, showAudioOn, showVideo, webcamNum) {
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
  if(showAudioOn==true) {
    audioLabel.innerText = "Audio "+ccLabelOn;
    audioLabel.className = "green";
    audioText.innerText  = auTextOn;
    buttonAText.innerText = "Disable";
  } else if(showAudioOn==false) {
    audioLabel.innerText = "Audio "+ccLabelOff;
    audioLabel.className = "red";
    audioText.innerText = auTextOff;
    buttonAText.innerText = "Enable";
  }
  if(showVideo==true) {
    triggerLabel.innerText = taLabel;
    triggerLabel.className = "green";
    triggerText.innerText  = taText;
  } else if(showVideo==false) {
    triggerLabel.innerText = toLabel;
    triggerLabel.className = "red";
    triggerText.innerText  = toText;
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

function toggleWebaudio() {
  console.log("toggleWebaudio()",adminMsg);
  if(!userIsAdmin && !userIsLogged) {
    return alert("User not authorized for webcam operation.")
  }
  if(adminMsg.showClAudioOn==true) {
    adminMsg.showClAudioOn=false
  } else {
    adminMsg.showClAudioOn=true
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

//Initiate the app
initWcc();