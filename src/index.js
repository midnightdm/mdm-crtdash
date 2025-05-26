import { initializeApp } from 'firebase/app'
import {
  getFirestore, onSnapshot, doc, getDoc
} from 'firebase/firestore'
import { LiveScanModel } from './LiveScanModel'
import { Environment } from './environment'
import LiveScan from './LiveScan'
//import Hls from './hls.min.js'
//UNCOMMENT BELOW FOR TEST DATA (& Set line 365 to true)
import { fakeLiveScan } from './fakeLiveScan.js'
import TimeAgo from 'javascript-time-ago'

// Timeago init
import en from 'javascript-time-ago/locale/en.json'
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

//Keypress event listeners
var keysPressed = {};
document.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;

  if (keysPressed['Control'] && event.code == 'Space') {
    console.log("playSound() triggered by CTRL + SPACE key press");  
    playSound();
      
  }
  if (keysPressed['Shift'] && event.code == 'Space') {
    console.log("playAnnouncement() triggered by SHIFT + SPACE key press");
    playAnnouncement();

  }
  if (keysPressed['Shift'] && event.code == 'KeyT') {
    toggleTvMode();
  };
  if (keysPressed['Shift'] && event.code == 'KeyL') {
    zoomControl("L");
  }
  if (keysPressed['Shift'] && event.code == 'KeyR') {
    zoomControl("R");
  }
  if (keysPressed['Shift'] && event.code == 'KeyC') {
    zoomControl("C");
  }
  if (keysPressed['Shift'] && event.code == 'KeyO') {
    zoomControl("O");
  }


});

document.addEventListener('keyup', (event) => {
  keysPressed[event.key] = false;
});

//Fit vessel list length to screen height
window.addEventListener('resize', testHeight);

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

window.env    = Environment
window.region = process.env.DASH_REGION;
window.sitename = process.env.SITE_NAME;
let privateMode, tvMode;

switch(sitename) {
  case 'clintondash':
  case 'qcdash':      privateMode = true;  tvMode = false; break;
  case 'regional':   privateMode = false; tvMode = false;  break;
  case 'clinton':
  case 'qc':          privateMode = false; tvMode = true; break;
}

console.log("privateMode = ", privateMode);
const fakeDataMode= false;
const firebaseConfig = env.firebaseConfig

initializeApp(firebaseConfig)
//initializeLiveScan

const db = getFirestore();
const liveScanModel = LiveScanModel;
liveScanModel.initRegion();


const liveScans     = [];
  //Load initial liveScans data
  updateLiveScanData();
  fetchWebcamSources();
  fetchWebcamSites();
  fetchWaypoint();
  
const siteLabel     = document.getElementById("site-label");
siteLabel.innerText = liveScanModel.title;
const selVessel     = document.getElementById("selected-vessel");
const dataTitle     = document.getElementById("data-title");
const dataImage     = document.getElementById("data-image");
const allVessels    = document.getElementById("all-vessels");
const totVessels    = document.getElementById("total-vessels");
const ulPass        = document.getElementById("passenger-ul");
const ulOther       = document.getElementById("other-ul"); 
const waypoint      = document.getElementById("waypoint");
const waypointDiv   = document.getElementById("waypoint-inner"); 
const waypointLabel = document.getElementById("waypoint-label");
const quad3Label    = document.getElementById("quad3-label");
const overlay3      = document.getElementById("overlay3");
const news          = document.getElementById("newstext");
const newsbar       = document.getElementById("newsbar");
const videoTag      = document.getElementById('video');
const mapTag        = document.getElementById("overlay");
const logoImg       = document.getElementById("logo-img");
const videoSource   = document.getElementById("video-source");
const overlay2      = document.getElementById("overlay2");
const overlayList   = document.getElementById("overlay-list");
const map2          = document.getElementById("map2");
const map3          = document.getElementById("map3");
const popup1        = document.getElementById("popup1");
const hb            = document.getElementById("headlineBtn");
const secondBtn     = document.getElementById('sb1');
const trOn  = document.getElementById('tracker-on');
const trOff = document.getElementById('tracker-off');
const trRb  = document.querySelectorAll('input[name="tracker-mode-switch"]');




//Event Listeners
hb.addEventListener('click', togglePopup);

secondBtn.addEventListener('click', togglePopup);

popup1.addEventListener('click', ()=> {
  //Record radio button choice
  let mode;
  for(const rb of trRb) {
    if(rb.checked) {
      //mode will be on or off
      mode = rb.value;
    }
  }
  liveScanModel.trackerStatus.enabled = mode==="on" ? true : false;
  window.localStorage.setItem('crtTrackerStatusEnabled', LiveScanModel.trackerStatus.enabled);
  //Record select box choice
  
  if(liveScanModel.trackerStatus.enabled) {
    const trOp  = document.getElementById('tracker-options')
    liveScanModel.trackerStatus.followingId = parseInt(trOp.value);
    let key = getKeyOfId(liveScans, liveScanModel.trackerStatus.followingId);
    if(key>-1) {
      window.localStorage.setItem('crtTrackerStatusFollowingId', liveScanModel.trackerStatus.followingId);
      liveScanModel.trackerStatus.obj = liveScans[key]; 
      console.log("User selected to track "+trOp.options[trOp.selectedIndex].text);
    }
  }
  outputManualTrackerOverlay()
})




let player = null;   

function initMap() {
  liveScanModel.initalizeMap();
}
window.initMap = initMap;
window.initLiveScan = initLiveScan;
testHeight()


setTimeout(loadSavedTracker, 25000);









//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
/* * * * * * * * * * * *
 *  GENERAL FUNCTIONS  *  
 * * * * * * * * * * * */
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$






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

function fifteenSecondsLater(time) {
  let sec = time.sec + 15;
  let min = time.min;
  if(sec>59) { 
    sec = 60-sec; 
    min = min+1;
  }
  return {sec, min };
}

function getPassageFor(liveKey) {
  return new Promise(async (resolve, reject)=>{
    var vesselID = liveScans[liveKey].id
    var passage = liveScanModel.passagesList.filter( o=>  vesselID===o.id)
    if(passage.length = 0) {
      resolve([{date: "Not Available"}])
    }
    if(liveKey==undefined) {
      reject([{date: "missing liveKey"}])
    }
    resolve(passage)
  })
}

function toggleFullVideo(videoIsFull) {
  if(videoIsFull && !liveScanModel.cameraStatus.videoIsFull) {
    videoTag.classList.add("full")
    waypointLabel.classList.add("full")
    quad3Label.classList.add("full")
    mapTag.classList.add("full")
    logoImg.classList.add("full")
    news.classList.add("full")
    overlay2.classList.add("full")
    overlay2.classList.remove("active");
    overlay3.classList.add("full")
    map3.classList.add("full")
  } else {
    videoTag.classList.remove("full")
    waypointLabel.classList.remove("full")
    quad3Label.classList.remove("full")
    mapTag.classList.remove("full")
    logoImg.classList.remove("full")
    news.classList.remove("full")
    overlay2.classList.remove("full")
    overlay3.classList.remove("full")
    map3.classList.remove("full")
  }
  liveScanModel.cameraStatus.videoIsFull = videoIsFull
}

function togglePassingCloseup(videoIsPassingCloseup, videoIsFull) {
  if(videoIsPassingCloseup && !liveScanModel.cameraStatus.videoIsPassingCloseup) {
    newsbar.classList.add("passing")
    map3.classList.add("passing")
    videoTag.classList.add("passing")
    waypointLabel.classList.add("passing")
    quad3Label.classList.add("passing")
    mapTag.classList.add("passing")
  } else {
    newsbar.classList.remove("passing")
    map3.classList.remove("passing")
    videoTag.classList.remove("passing")
    waypointLabel.classList.remove("passing")
    quad3Label.classList.remove("passing")
    mapTag.classList.remove("passing")
  }
  liveScanModel.cameraStatus.videoIsPassingCloseup = videoIsPassingCloseup
  toggleFullVideo(videoIsFull)
}

function togglePopup(event) {
  event.stopPropagation();
  if(LiveScanModel.trackerStatus.popupOn) {
    LiveScanModel.trackerStatus.popupOn = false;
    popup1.classList.remove("sawmill");
  } else {
    LiveScanModel.trackerStatus.popupOn = true;
    popup1.classList.add("sawmill");
  }
  console.log("popup1 state is "+popup1.classList);
}

function playSound() {
  let audio = new Audio(liveScanModel.waypoint.apubVoiceUrl);
  audio.loop = false;
  audio.play(); 
}

function playAnnouncement() {
  let audio = new Audio(liveScanModel.announcement.vpubVoiceUrl);
  audio.loop = false;
  audio.play(); 
}

function toggleTvMode() {
  if(tvMode == true) {
    alert("TV Mode is off. No promos will play.");
    tvMode = false;
  } else {
    alert("TV Mode is on.  Promos will play 4 times per hour.");
    tvMode = true;
  }
}

function zoomControl(state) {
  videoTag.classList.remove("smz");
  videoTag.classList.remove(liveScanModel.cameraStatus.zoomArray[liveScanModel.cameraStatus.zoomMode]);
  if(liveScanModel.promoIsOn || liveScanModel.playProgram || liveScanModel.cameraStatus.webcamID != 'Sawmill') {
    console.log("Sawmill Zoom off, webcamID/zoom/promoIsOn: ",liveScanModel.cameraStatus.webcamID, liveScanModel.cameraStatus.webcamZoom, liveScanModel.promoIsOn);
    return;
  }
  console.log("zoomControl -> webcamID/zoom/promoIsOn: ",liveScanModel.cameraStatus.webcamID, liveScanModel.cameraStatus.webcamZoom, liveScanModel.promoIsOn);
  videoTag.classList.add("smz");
  switch(state) {
    case "L":
    case 1: 
      videoTag.classList.add(liveScanModel.cameraStatus.zoomArray[1]);
      liveScanModel.cameraStatus.zoomMode = 1;
      break;
    
    case "C":
    case 2: 
      videoTag.classList.add(liveScanModel.cameraStatus.zoomArray[2]);
      liveScanModel.cameraStatus.zoomMode = 2;
      break;
    
    case "R":
    case 3: 
      videoTag.classList.add(liveScanModel.cameraStatus.zoomArray[3]);
      liveScanModel.cameraStatus.zoomMode = 3;
      break;
    
    default :{
      liveScanModel.cameraStatus.zoomMode = 0;
      
    }
  }
}


function clearZoom() {
  console.log("------------------------> clearZoom()");
  const v = document.getElementById('video');
  if(v.classList.contains("smz")) {
    v.classList.remove("smz");
  }
  if(v.classList.contains("center")) {
    v.classList.remove("center");
  }
  if(v.classList.contains("right")) {
    v.classList.remove("right");
  }
  if(v.classList.contains("left")) {
    v.classList.remove("left");
  }
}





//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
/* * * * * * * * * * * * * * 
 *  OUTPUT VIEW FUNCTIONS  *
 * * * * * * * * * * * * * */

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$








async function outputWaypoint(showVideoOn, showVideo, webcamID, videoIsFull, playPromo, playProgram, videoIsPassingCloseup) {  
  if(privateMode==true) { 
    showVideoOn=false;
  }
  console.log("outputWaypoint(showVideoOn, showVideo, webcamID, videoIsFull), videoSource", showVideoOn, showVideo, webcamID, videoIsFull, liveScanModel.videoSource);
  if(showVideoOn==true && showVideo==true) {
    liveScanModel.videoIsOn = true;
    waypointDiv.style = `display: none`;
    videoTag.style = `display: block; z-index: 0`;
    const options = {
      autoplay: true,
      preload: "auto",
      fluid: true,
      loadingSpinner: false,
      techOrder: ["html5", "youtube"]
    };
    console.log("webcamID is", webcamID);
    if(videoIsPassingCloseup && !liveScanModel.cameraStatus.videoIsPassingCloseup) {
      //Turn on closeup if passing and not on already
      togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
    } else if(liveScanModel.cameraStatus.videoIsPassingCloseup && !videoIsPassingCloseup) {
      //Turn off closeup if on and not passing
      togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
    }
    // Play promo from rotation at random
    if(playPromo && tvMode) {
      let sk = Math.floor(Math.random() * liveScanModel.promoSources.length)
      let promoSource = location.protocol + '//' + location.host + '/' + liveScanModel.promoSources[sk];
      console.log("promo source", promoSource);
      //clearZoom();
      waypointLabel.innerHTML = "Thank You For Watching";
      liveScanModel.promoIsOn = true;
      zoomControl(liveScanModel.cameraStatus.webcamZoom)
      //Turn off vessel name overlay when promo running
      if(overlay2.classList.contains("active")) {
        overlay2.classList.remove("active");
      }

      player = videojs("video", options, function onPlayerReady() {
        this.on('ended', function() {
          this.src({ type: liveScanModel.videoType, src: liveScanModel.videoSource, });
          if(liveScanModel.videoType == "video/youtube") {
            console.log("Muting audio from source type YouTube.");
            this.muted(true)
          }
          this.play();
          liveScanModel.promoIsOn = false;
          //togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
          if(videoIsPassingCloseup && !liveScanModel.cameraStatus.videoIsPassingCloseup) {
            //Turn on closeup if passing and not on already
            togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
          } else if(liveScanModel.cameraStatus.videoIsPassingCloseup && !videoIsPassingCloseup) {
            //Turn off closeup if on and not passing
            togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
          }
          zoomControl(liveScanModel.cameraStatus.webcamZoom);
          waypointLabel.innerHTML = liveScanModel.webcamSources[webcamID].name; //"3 Miles South of Drawbridge";
        });
        this.src({ type:"application/x-mpegURL" , src: promoSource });
        this.play();
      });
    }
    //Play scheduled video program
    if(playProgram && tvMode) {  
      waypointLabel.innerHTML = liveScanModel.videoProgram.dataTitle;
      liveScanModel.videoProgramIsOn = true;
      zoomControl(liveScanModel.cameraStatus.webcamZoom)
      //Turn off vessel overlay when program playing
      if(overlay2.classList.contains("active")) {
        overlay2.classList.remove("active");
      }
      player = videojs("video", options, function onPlayerReady() {
        this.on('ended', function() {camNum
          this.src({ type: liveScanModel.videoType, src: liveScanModel.videoSource });
          if(liveScanModel.videoType == "video/youtube") {
            console.log("Muting audio from source type YouTube.");
            this.muted(true)
          }
          this.play();
          liveScanModel.videoProgramIsOn = false;
          //togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
          if(videoIsPassingCloseup && !liveScanModel.cameraStatus.videoIsPassingCloseup) {
            //Turn on closeup if passing and not on already
            togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
          } else if(liveScanModel.cameraStatus.videoIsPassingCloseup && !videoIsPassingCloseup) {
            //Turn off closeup if on and not passing
            togglePassingCloseup(videoIsPassingCloseup, videoIsFull)
          }
          zoomControl(liveScanModel.cameraStatus.webcamZoom)
          waypointLabel.innerHTML = liveScanModel.webcamSources[webcamID].name; //"3 Miles South of Drawbridge";
        })
        
        this.src({ type: liveScanModel.videoProgram.type, src: liveScanModel.videoProgram.source });
        
        this.play();
      });
    } else {
      zoomControl(liveScanModel.cameraStatus.webcamZoom);
      //Switch camera source if changed
      if(webcamID != liveScanModel.prevWebcamID) {
        waypointLabel.innerHTML = liveScanModel.webcamSources[webcamID].name; //"3 Miles South of Drawbridge"
        liveScanModel.videoSource = liveScanModel.webcamSources[webcamID].src;
        liveScanModel.videoType = liveScanModel.webcamSources[webcamID].type;
        console.log("video source", liveScanModel.webcamSources[webcamID]);

        if(player==null) {
          player = videojs("video", options);
        }
        player.ready(function() {
          player.src({ type: liveScanModel.videoType, src: liveScanModel.videoSource })
          if(liveScanModel.videoType == "video/youtube") {
            console.log("Muting audio from source type YouTube.");
            player.muted(true)
          }
          player.play()
        });
        liveScanModel.prevWebcamID = webcamID;      
        console.log("outputWaypoint(showVideoOn, showVideo, webcamID, videoIsFull), videoSource", showVideoOn, showVideo, webcamID, videoIsFull, liveScanModel.videoSource);
      }
    }   
    //waypointLabel.style = `z-index: 1`;
  } else {
    liveScanModel.videoIsOn = false;
    videoTag.style = `display: none`;
    waypoint.style = `background-image: url(${liveScanModel.waypoint.bgMap})`;
    waypointLabel.innerHTML = "WAYPOINT";
    waypointDiv.innerHTML = `<h3>${liveScanModel.waypoint.apubText}</h3>`;
    waypointDiv.style.display = "block";
    console.log("outputWaypoint(showVideoOn, showVideo, webcamID, videoIsFull)", showVideoOn, showVideo, webcamID, videoIsFull);
  }
  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  })  
}

function outputVideoOverlay() {
    console.log("outputVideoOverlay() run");
  //Superimpose list of vessels in camera range
  if(liveScanModel.videoIsOn && liveScanModel.cameraStatus.vesselsInRange[0] != 'None') {
    let v, vlist = "";
    for(v in liveScanModel.cameraStatus.vesselsInRange) {
      vlist += `<li class="crv-list">${liveScanModel.cameraStatus.vesselsInRange[v]}</li>`;
    }
    console.log("outputVideoOverlay() activated.");
    overlayList.innerHTML = vlist;
    liveScanModel.vesselsAreInCameraRange = true;
    if(!overlay2.classList.contains("active")) {
      const patterns = ['zoomInDown','zoomIn','zoomInLeft','zoomInRight','zoomInUp','rotateIn','rootateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight','fadeIn',
      'fadeInDown','fadeInDownBig', 'fadeInLeft', 'fadeInLeftBig','fadeInRight','fadeInRightBig','fadeInUp','fadeInUpBig','fadeInTopLeft','fadeInTopRight',
      'fadeInBottomLeft', 'fadeInBottomRight'
      ];
      let r = Math.floor((Math.random() * patterns.length)+1)
      animateCSS('#overlay2', patterns[r]);
      overlay2.classList.add("active");
    }
    //See initLiveScan() for the camera in view test
  } else {
    if(liveScanModel.cameraStatus.vesselsInRange[0] == 'None' && liveScanModel.vesselsAreInCameraRange && overlay2.classList.contains("active")) {
      overlay2.classList.remove("active")
      liveScanModel.vesselsAreInCameraRange = false;
    }
  }
}


async function outputSelVessel() {
  let selVesselOutput = ""
  let live   = liveScanModel.rotatingKey; 
  //let vessObj = liveScanModel.passengerTrackerIsOn ? 
  //  liveScanModel.vesselsArePass[liveScanModel.passRotKey] : liveScans[live]
  
  let vessObj;
  if(liveScanModel.watchedTrackerIsOn) {
    vessObj = liveScanModel.vesselsAreWatched[liveScanModel.watchedRotKey];
    //console.log("outputSelVessel in passengerTracker mode", vessObj);
  } else if(liveScanModel.manualTrackerIsOn ) {
    vessObj = liveScanModel.trackerStatus.obj;
    console.log("outputSelVessel in manual tracker mode", vessObj);
  } else {
    vessObj = liveScans[live];
    console.log("outputSelVessel in liveScans mode", vessObj, "live key is ", live);
  }
  if(vessObj===undefined) { 
    if(liveScanModel.rotatingKey > liveScans.length) {
      console.log("Rotating Key updated from "+liveScanModel.rotatingKey+" to 0 by outputSelVessel()")
      liveScanModel.rotatingKey = 0
    } else {
      console.log("outputSelVessel() had undefined vessObj");
    }  
    return new Promise((resolve, reject )=>{
      resolve()
      reject()
    })
  }
  if(typeof vessObj.lat != 'number') {
    let to = typeof vessObj.lat
    console.log("outputSelVessel() "+vessObj.name+" failed because lat "+vessObj.lat+" is NaN.  Instead it was typeof", to);
    return new Promise((resolve, reject )=>{
      resolve()
      reject()
    })
  }
  if(typeof vessObj.lng != 'number') {
    let to = typeof vessObj.lng
    console.log("outputSelVessel() "+vessObj.name+" failed because lng "+vessObj.lng+" is NaN.   Instead it was typeof ", to);
    return new Promise((resolve, reject )=>{
      resolve()
      reject()
    })
  }

  liveScanModel.map2.setCenter(  
      new google.maps.LatLng(vessObj.lat, vessObj.lng)
  );
  let vesselID = vessObj.id
  let passageIdx = liveScanModel.passagesList.findIndex( o=> o.id === vesselID)
  let passageDate = liveScanModel.passagesList[passageIdx]?.date || ""
  console.log("passage date", passageDate)
  //let passageDate = new Date(vessObj.lastDetectedTS);

  //Add special CSS class for passenger vessel
  let mapWatchedClass = vessObj.vesselWatchOn ? ' type-watched' : '';

  //Build output for selected vessel
  selVesselOutput += 
    `<li class="dataPoint"><span class="th">TYPE:</span> <span class="td">
    ${vessObj.type}</span></li>
    <li class="dataPoint"><span class="th">MMSI #:</span> <span class="td">
    ${vessObj.id}</span></li>
    <li class="dataPoint"><span class="th">LABEL:</span> <span class="td"><h4 class="map-label ${mapWatchedClass}">
    ${vessObj.mapLabel}</h4></span></li>
    <li class="dataPoint"><span class="th">COURSE:</span> <span class="td">
  ${vessObj.course}°</span></li>
  <li class=dataPoint><span class=th>SPEED:</span> <span class=td>
  ${vessObj.speed} Knots</span></li>
  <li class="dataPoint"><span class="th">DIRECTION:</span> <span class="td dir">
  ${vessObj.dir}</span>  </li>
  <li class="dataPoint"><span class="th">COORDINATES:</span> <span class="td dir">
  ${vessObj.lat.toFixed(7)}, ${vessObj.lng.toFixed(7)}</span>  </li>
  <li class="dataPoint"><span class="th">LOCATION:</span> <span class="td">
  ${vessObj.liveLocation}</span></li>`;
  /*
  <li class="dataPoint"><span class="th">LAST PASSAGE:</span> <span class="td">
  ${passageDate.toDateString()}
  </span></li>`;
  */
  selVessel.innerHTML  = selVesselOutput;      //Selected Vessel's Data
  dataTitle.innerHTML  = vessObj.name;
  dataImage.setAttribute('src', vessObj.imageUrl);
  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  }) 
}

async function outputAllVessels() {
  let allVesselsOutput = "", mapWatchedClass;
  //Build output for transponder list (from viewList if used)
  if(liveScanModel.transponder.viewList.length> 0){
    let c = 0;
    
    for(let vessel in liveScanModel.transponder.viewList) {
      let obj = liveScanModel.transponder.viewList[vessel]
      //Add special CSS class for passenger vessel
      mapWatchedClass = obj.vesselWatchOn ? ' type-watched' : '';

      allVesselsOutput+= c==liveScanModel.transponder.stepMax-1 ? `<li class="animate__animated animate__slideInLeft">` : `<li class="animate__animated animate__slideInUp">`;
      
      allVesselsOutput+=
        `<div class="list-wrap">
          <h4 class="map-label ${mapWatchedClass}">${obj.mapLabel}</h4>
          <h4 class="tile-title">${obj.name}</h4> 
          <div class="dir-container">
            <img class="dir-img" src="${obj.dirImg}"/>          
            <span class="speed">${Math.round(obj.speed)}</span>
          </div>            
        </div>
        <h5>${obj.liveLocation}</h5>
      </li>`;
      //Test for vessels in camera view
      c++;
    }
  } else {
    for(let vessel in liveScans) {
      let obj = liveScans[vessel];
      let spd = "";
      if(obj.dir !=="undetermined") {
        spd = Math.round(obj.speed);
      }
      //Add special CSS class for passenger vessel
      mapWatchedClass = obj.vesselWatchOn ? ' type-watched' : '';
      allVesselsOutput+= 
      `<li>
        <div class="list-wrap">
          <h4 class="map-label ${mapWatchedClass}">${obj.mapLabel}</h4>
          <h4 class="tile-title">${obj.name}</h4> 
          <div class="dir-container">
            <img class="dir-img" src="${obj.dirImg}"/>
            <span class="speed">${spd}</span>
          </div>               
        </div>
        <h5>${obj.liveLocation}</h5>
      </li>`;
    }
  }
  
  //console.log("Content of liveScanModel:", liveScanModel);
  totVessels.innerHTML = liveScans.length+" Vessels"; //Total Vessels Title
  allVessels.innerHTML = allVesselsOutput;     //List of All transponders in range
}

function outputPassengerTrackerOverlay() {
  console.log("outputPassengerTrackerOverlay() "+liveScanModel.watchedTrackerIsOn+" WATCHED="+liveScanModel.vesselsAreWatched.length)

  //Supercede Events list with passenger vessel tracking map
  if(liveScanModel.vesselsAreWatched.length>0 && !liveScanModel.watchedTrackerIsOn) {
    liveScanModel.watchedTrackerIsOn = true
    map2.classList.remove("active")
    map3.classList.add("active")
    quad3Label.classList.add("active")
    overlay3.classList.add("lower")
    ulOther.classList.add("tracker")
    ulPass.innerHTML = ""
    ulOther.innerHTML = ""
  } else if(liveScanModel.vesselsAreWatched.length==0 && !liveScanModel.manualTrackerIsOn) {
    liveScanModel.watchedTrackerIsOn = false
    map3.classList.remove("active")
    map2.classList.add("active")
    quad3Label.classList.remove("active")
    overlay3.classList.remove("lower")
    ulOther.classList.remove("tracker")
  }
  console.log("outputWatchedTrackerOverlay() "+liveScanModel.watchedTrackerIsOn)
}

function outputManualTrackerOverlay() {
  //console.log("outputManualTrackerOverlay() before"+liveScanModel.manualTrackerIsOn)
  //Void when passenger tracker is on
  if(liveScanModel.watchedTrackerIsOn) return;
  //Supercede Events list with  vessel tracking map
  if(liveScanModel.trackerStatus.enabled && !liveScanModel.manualTrackerIsOn) {
    liveScanModel.manualTrackerIsOn = true
    map2.classList.remove("active")
    map3.classList.add("active")
    quad3Label.classList.add("active")
    overlay3.classList.add("lower")
    ulOther.classList.add("tracker")
    ulPass.innerHTML = ""
    ulOther.innerHTML = ""
  } else if(!liveScanModel.trackerStatus.enabled && liveScanModel.manualTrackerIsOn) {
    liveScanModel.manualTrackerIsOn = false
    map3.classList.remove("active")
    map2.classList.add("active")
    quad3Label.classList.remove("active")
    overlay3.classList.remove("lower")
    ulOther.classList.remove("tracker")
    outputPassengerAlerts();
    outputOtherAlerts();
  }
  console.log("outputManualTrackerOverlay() after "+liveScanModel.manualTrackerIsOn)
}

async function outputTrackerOptions() {
  const trOp  = document.getElementById('tracker-options')
  let opStr  = "", obj, vessel, selected;
  for(vessel in liveScans) {
    obj = liveScans[vessel];
    selected = liveScanModel.trackerStatus.followingId==obj.id ? "selected" : ""
    opStr+= `<option value="${obj.id}" ${selected}>${obj.name}</option>\n`
  }
  if(LiveScanModel.trackerStatus.enabled) {
    trOn.checked = true
    trOff.checked = false
  } else {
    trOn.checked = false
    trOff.checked = true
  }
  trOp.innerHTML = opStr;
}

function outputTrackerAlerts(isPassenger=true) {
  if(isPassenger) {
    //Build single passenger alert
    if(!liveScanModel.alertsPassenger.length) return;
    let alertsOutputPassenger =
    `<div id="pass19" class="card animate__animated animate__slideInRight">
    <h4>${liveScanModel.alertsPassenger[19].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsPassenger[19].date.toISOString()}">${timeAgo.format(liveScanModel.alertsPassenger[19].date)}</time></h4>
    <p>${liveScanModel.alertsPassenger[19].apubText}</p>
    </div>`;
    if(!overlay3.classList.contains("lower")) {
      overlay3.classList.add("lower")
    }
    overlay3.innerHTML = alertsOutputPassenger;
  } else {
      //Build single other alert
      if(!liveScanModel.alertsAll.length) return;
      let alertsOutputAll =
      `<div id="all19" class="card animate__animated animate__slideInRight">
      <h4>${liveScanModel.alertsAll[19].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsAll[19].date.toISOString()}">${timeAgo.format(liveScanModel.alertsAll[19].date)}</time></h4>
      <p>${liveScanModel.alertsAll[19].apubText}</p>
      </div>`;
      if(!overlay3.classList.contains("lower")) {
        overlay3.classList.add("lower")
      }
      overlay3.innerHTML = alertsOutputAll;
  }

  
}

function outputPassengerAlerts() {
  //Build output for passenger alerts
  if(!liveScanModel.alertsPassenger.length || liveScanModel.watchedTrackerIsOn || liveScanModel.manualTrackerIsOn) return;
  let alertsOutputPassenger =
    `<li id="pass19" class="card animate__animated animate__slideInRight">
      <h4>${liveScanModel.alertsPassenger[19].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsPassenger[19].date.toISOString()}">${timeAgo.format(liveScanModel.alertsPassenger[19].date)}</time></h4>
      <p>${liveScanModel.alertsPassenger[19].apubText}</p>
    </li>
    <li class="card animate__animated animate__slideInDown">
      <h4>${liveScanModel.alertsPassenger[18].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsPassenger[18].date.toISOString()}">${timeAgo.format(liveScanModel.alertsPassenger[18].date)}</time></h4>
      <p>${liveScanModel.alertsPassenger[18].apubText}</p>
    </li>
    <li class="card animate__animated animate__slideInDown">
      <h4>${liveScanModel.alertsPassenger[17].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsPassenger[17].date.toISOString()}">${timeAgo.format(liveScanModel.alertsPassenger[17].date)}</time></h4>
      <p>${liveScanModel.alertsPassenger[17].apubText}</p>
    </li>
    <li class="card animate__animated animate__slideInDown">
      <h4>${liveScanModel.alertsPassenger[16].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsPassenger[16].date.toISOString()}">${timeAgo.format(liveScanModel.alertsPassenger[16].date)}</time></h4>
      <p>${liveScanModel.alertsPassenger[16].apubText}</p>
    </li>
    <li class="card animate__animated animate__slideInDown">
      <h4>${liveScanModel.alertsPassenger[15].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsPassenger[15].date.toISOString()}">${timeAgo.format(liveScanModel.alertsPassenger[15].date)}</time></h4>
      <p>${liveScanModel.alertsPassenger[15].apubText}</p>
    </li>`;
    if(ulPass.classList.contains("lower")) {
      ulPass.classList.remove("lower")
    }
    ulPass.innerHTML     = alertsOutputPassenger;
}

function outputOtherAlerts() {
    console.log("outputOtherAlerts()", liveScanModel.alertsAll);
  //Build output for other alerts
  if(!liveScanModel.alertsAll.length || liveScanModel.watchedTrackerIsOn || liveScanModel.manualTrackerIsOn) {
    ulOther.innerHTML = `<li id="all19" class="card animate__animated animate__slideInRight"><h4>outputOtherAlers() ended </h4></li>`;
    return;
  }
  let alertsOutputOther =
  `<li id="all19" class="card animate__animated animate__slideInRight">
  <h4>${liveScanModel.alertsAll[19].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsAll[19].date.toISOString()}">${timeAgo.format(liveScanModel.alertsAll[19].date)}</time></h4>
  <p>${liveScanModel.alertsAll[19].apubText}</p>
  </li>
  <li class="card animate__animated animate__slideInDown">
  <h4>${liveScanModel.alertsAll[18].apubVesselName} <time class="timeago"datetime="${liveScanModel.alertsAll[18].date.toISOString()}">${timeAgo.format(liveScanModel.alertsAll[18].date)}</time></h4>
  <p>${liveScanModel.alertsAll[18].apubText}</p>
  </li>
  <li class="card animate__animated animate__slideInDown">
  <h4>${liveScanModel.alertsAll[17].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsAll[17].date.toISOString()}">${timeAgo.format(liveScanModel.alertsAll[17].date)}</time></h4>
  <p>${liveScanModel.alertsAll[17].apubText}</p>
  </li>
  <li class="card animate__animated animate__slideInDown">
  <h4>${liveScanModel.alertsAll[16].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsAll[16].date.toISOString()}">${timeAgo.format(liveScanModel.alertsAll[16].date)}</time></h4>
  <p>${liveScanModel.alertsAll[16].apubText}</p>
  </li>
  <li class="card animate__animated animate__slideInDown">
  <h4>${liveScanModel.alertsAll[15].apubVesselName} <time class="timeago" datetime="${liveScanModel.alertsAll[15].date.toISOString()}">${timeAgo.format(liveScanModel.alertsAll[15].date)}</time></h4>
  <p>${liveScanModel.alertsAll[15].apubText}</p>
  </li>`;
  ulOther.innerHTML    = alertsOutputOther;
}

function outputNews() {
  //News section
  animateCSS('#newstext', 'fadeIn');
  news.innerHTML = liveScanModel.news[liveScanModel.newsKey].text;
}






















async function initLiveScan(rotateTransponders=true) {  
  /*   *   *   *   *   *   *   *   *   *   *  *  *  *
   *                                                *
   * Begin a 60 sec master clock for loop control   *
   *                                                *
   *   *   *   *   *   *   *   *   *   *   *  *  *  */

  setInterval( async ()=> {
    let now, nowObj, key, vessObj;
    //Reset clock to 0 every 1 min (& increment minute)
    if(liveScanModel.tock==60) {
      liveScanModel.tock = 0
      //Also refresh time element views
      updateTimes()
    }
    //Events below to fire on specific intervals (Modulas % determines multiples)

    //Step transponder list scroll every 10 seconds
    if(rotateTransponders && liveScans.length > 0 && liveScanModel.tock%10==0) {
      stepTransponderView()
    } 

    //Change data slide every 15 sec when there is live data
    if(liveScans.length > 0 && liveScanModel.tock%15==0) {
      console.log("Tracker status check:",liveScanModel.trackerStatus.enabled, liveScanModel.manualTrackerIsOn);
      await outputSelVessel();
      liveScanModel.rotatingKey++;       
      if(liveScanModel.rotatingKey > liveScans.length) {
        console.log("Rotating key updated from "+liveScanModel.rotatingKey+" to 0 by loop controller.")
        liveScanModel.rotatingKey = 0;
      }
    }

    //Also every 15 sec when there are >1 pass vess, change tracker map
    // if(liveScanModel.vesselsArePass.length>0 && liveScanModel.tock%15==0) {
    //   liveScanModel.passRotKey++;
    //   if(liveScanModel.passRotKey > liveScanModel.vesselsArePass.length) {
    //     liveScanModel.passRotKey = 0;
    //   }
    //   liveScanModel.map3.setCenter(  
    //     new google.maps.LatLng(
    //       liveScanModel.vesselsArePass[liveScanModel.passRotKey].lat, 
    //       liveScanModel.vesselsArePass[liveScanModel.passRotKey].lng
    //     )
    //   )
    // } else if(liveScanModel.manualTrackerIsOn && liveScanModel.tock%15==0) {
    //   key = getKeyOfId(liveScans, liveScanModel.trackerStatus.followingId);
    //   if(key>-1) {
    //     console.log("ob for setCenter ", liveScanModel.trackerStatus.obj );
    //     liveScanModel.map3.setCenter(  
    //       new google.maps.LatLng(liveScanModel.trackerStatus.obj.lat, liveScanModel.trackerStatus.obj.lng)
    //     )
    //   }
      
    // }
    
    //Also every 15 sec when there are >1 watched vess, change tracker map
    if(liveScanModel.vesselsAreWatched.length>0 && liveScanModel.tock%15==0) {
        liveScanModel.watchedRotKey++;
        if(liveScanModel.watchedRotKey > liveScanModel.vesselsAreWatched.length-1) {
          liveScanModel.watchedRotKey = 0;
        }
        //Recenter map if there's valid live lat data
        if(Object.hasOwn(liveScanModel.vesselsAreWatched[liveScanModel.watchedRotKey], 'lat')) {
            liveScanModel.map3.setCenter(  
                new google.maps.LatLng(
                  liveScanModel.vesselsAreWatched[liveScanModel.watchedRotKey].lat, 
                  liveScanModel.vesselsAreWatched[liveScanModel.watchedRotKey].lng
                )
              )
        }
        
      } else if(liveScanModel.manualTrackerIsOn && liveScanModel.tock%15==0) {
        key = getKeyOfId(liveScans, liveScanModel.trackerStatus.followingId);
        if(key>-1) {
          console.log("ob for setCenter ", liveScanModel.trackerStatus.obj );
          liveScanModel.map3.setCenter(  
            new google.maps.LatLng(liveScanModel.trackerStatus.obj.lat, liveScanModel.trackerStatus.obj.lng)
          )
        }
        
      }


    //Every 20 sec --> 
    if(liveScanModel.tock%20==0) {
      //Change news text...
      if(liveScanModel.news.length) {
        if(liveScanModel.newsKey >= liveScanModel.news.length) {
          liveScanModel.newsKey = 0;
        }
        //Disable output news when pass vess passing camera
        if(!liveScanModel.cameraStatus.videoIsPassingCloseup && !liveScanModel.vesselsAreWatched.length) {
          outputNews();
          liveScanModel.newsKey++
        } else {
          news.innerHTML = "Now live tracking "+liveScanModel.vesselsAreWatched[0].type+" vessel <em>"+liveScanModel.vesselsAreWatched[0].name+"</em>."
        }
        
      }
      updateLiveScanData();
    }
    //Every 1 sec advance clock 
    liveScanModel.tock++;
    //Advance moving vessel icons predictively
    predictMovement()
    //Test for time triggers
    
    now = getTime();
    liveScanModel.resetTime.forEach((rt)=>{
      if(now.min==rt.min && now.sec==rt.sec) {
        location.reload();
      }
    })
    liveScanModel.idTime.forEach(async (idt) => {
        if(now.min==idt.min && now.sec==idt.sec) {
            await outputWaypoint(
            liveScanModel.cameraStatus.showVideoOn,
            liveScanModel.cameraStatus.showVideo,
            liveScanModel.cameraStatus.webcamID,
            idt.videoIsFull,
            true,
            false,
            false
            )
        }
      
        if(liveScanModel.videoProgram &&
            now.month==liveScanModel.videoProgram.month &&
            now.date ==liveScanModel.videoProgram.date  &&
            now.hour ==liveScanModel.videoProgram.hour  &&
            now.min  ==liveScanModel.videoProgram.min   &&
            now.sec  ==liveScanModel.videoProgram.sec) {
                await outputWaypoint(
                liveScanModel.cameraStatus.showVideoOn,
                liveScanModel.cameraStatus.showVideo,
                liveScanModel.cameraStatus.webcamID,
                liveScanModel.videoProgram.videoIsFull,
                false,
                true,
                false
            )
        }
      
      
    })


  }, 1000);
  /*  END OF CLOCK LOOP   */


  await fetchAllAlerts().then((unsubscribe) =>{
    //Do outputs
    console.log("//Doing outputOtherAlerts AFTER fetch.");
    outputOtherAlerts();
  });
  await fetchPassengerAlerts().then((unsubscribe) => {
    console.log("//Doing outputPassengerAlerts AFTER fetch.");
    outputPassengerAlerts();
  });
  await fetchWebcamSources();
  await fetchWebcamSites();
  await fetchWaypoint();
  await fetchNews();
  await fetchPassagesList()
  //Do first outputs
//   console.log("//Do first outputs");
//   outputOtherAlerts();
//   outputPassengerAlerts();
  //outputTrackerAlerts();
  outputSelVessel();
  outputVideoOverlay();
  outputPassengerTrackerOverlay();
  outputManualTrackerOverlay();  
}

function updateTimes() {
  const times = [...(document.getElementsByTagName("time"))]
  let quantity = times.length
  let counter  = 0
  for(let time of times) {
    let dtStr = time.attributes["datetime"].nodeValue
    let newTime = timeAgo.format(new Date(dtStr))
    if(time.innerHTML != newTime) {
      time.innerHTML = newTime
      counter++
    }
  }
}

/* * * * * * * * * * * 
 *  FETCH FUNCTIONS  *
 * * * * * * * * * * */


async function fetchLiveScanData() {
  let data = []
  //Get fake liveScan data from file...
  if(fakeDataMode) {
    if(liveScanModel.fakeDataIterator > fakeLiveScan.length) {
      liveScanModel.fakeDataIterator = 0
    }
    data = fakeLiveScan[liveScanModel.fakeDataIterator]
    liveScanModel.fakeDataIterator++
  //Or get real liveScan data from API
  } else {
    const myHeaders = new Headers({
      'Content-Type': 'application/json'
    });
    const response = await fetch(liveScanModel.fetchUrl,  {
      headers: myHeaders
    });
    if(response.status===200) {
      data = await response.json();
    }  
  }
  return data
}

async function updateLiveScanData() {
  //Get LiveScan data...
  let key, obj, dat, data, skip, i, vesselsArePass=[], vesselsAreWatched=[];
  data = await fetchLiveScanData()
  for(i=0; i<data.length; i++){
    dat = data[i];
    
    //Skip out-of-region data objects
    if(!liveScanModel.regionsWatched.includes(dat?.liveRegion)) {
        console.log("Skipping unwatched region", dat.liveRegion)
        continue;
    }


    if(!liveScans.length){
      key = -1;
    } else {
      key = getKeyOfId(liveScans, dat.liveVesselID);
    }
    
    // Create & push
    if(key==-1) {
      obj = await liveScanModel.mapper(new LiveScan(), dat, true);
      obj.key = liveScans.length;
      liveScans.push(obj);

    }
    // Find & Update
    else {
        //Remove object if no longer in region
        if(!liveScanModel.regionsWatched.includes(dat.liveRegion)) {
            liveScans.splice(key, 1)
        //Otherwise update the data
        } else {
            liveScans[key] = await liveScanModel.mapper(liveScans[key], dat, false);
            //Test for watched vessels (limit to moving vessels added 9/19/23)
            console.log("Test for watched vessels, on, speed ",liveScans[key].vesselWatchOn, liveScans[key].speed)
            if(liveScans[key].vesselWatchOn==true && liveScans[key].speed > 1) {
                vesselsAreWatched.push(liveScans[key]);
            }
            //If manualTracker on, update stored obj
            if(liveScanModel.manualTrackerIsOn && liveScans[key].id==liveScanModel.trackerStatus.obj.id) {
              liveScanModel.trackerStatus.obj = liveScans[key];
            }
        }
        //Has num of vessels changed?
        if(liveScans.length != liveScanModel.numVessels) {
            //Store new vessels quantity
            liveScanModel.numVessels = liveScans.length;
            //Reset rotating key to avoid desynch
            liveScanModel.rotatingKey = liveScanModel.numVessels;              
        }
    }
  }
  //liveScanModel.vesselsInCamera = vesselsInCamera;
  //liveScanModel.vesselsArePass = vesselsArePass;
  liveScanModel.vesselsAreWatched = vesselsAreWatched;
  if(!liveScanModel.promoIsOn && !liveScanModel.videoProgramIsOn) {
    outputVideoOverlay(); 
    outputPassengerTrackerOverlay();
    outputManualTrackerOverlay();
  } 
}



function fetchPassagesList() {
    return new Promise(async (resolve, reject )=>{
      if(liveScanModel.passagesList[0].type==="default") {
        const passagesAllRef = doc(db, liveScanModel.passagesCollection, 'All');
        let plObj, key, listArr = [], tmpArr = {},  nameArr = [], idx = 0, nKey, nObj, i;
        //const document;
        await getDoc(passagesAllRef).then(
          (document) => {
            if(document.exists()) {
              plObj = document.data();
              //console.log("plObj", plObj);
              for(key in plObj) {
                plObj[key].id = parseInt(plObj[key].id) //Correct data type
                nKey = plObj[key].name;
                nObj = plObj[key];
                if(nKey=="---") { continue; }
                nameArr.push(nKey);
                tmpArr[nKey] = nObj;
              }
              nameArr.sort();
              for(i=0; i<nameArr.length; i++) {
                nKey = nameArr[i];
                nObj = tmpArr[nKey];
                nObj.localIndex = i;
                listArr.push(nObj);
              }
              liveScanModel.passagesList = listArr; 
            }     
        });      
      }
      resolve(liveScanModel.passagesList.length)
      reject()
    })
  }

async function fetchPassengerAlerts() {
    console.log("fetchPassengerAlerts()");
    if (liveScanModel.alertsPassenger[0].apubID == "loading") {
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          doc(db, liveScanModel.alertpublishCollection, "passenger"),
          (querySnapshot) => {
            let tempAlertsPassenger = [];
            let dataSet = querySnapshot.data();
            let i = 0;
            for (var data in dataSet) {
              dataSet[data]['date'] = new Date(dataSet[data]['apubTS'] * 1000);
              tempAlertsPassenger.push(dataSet[data]);
              i++;
            }
            // Sort by apubTS descending
            tempAlertsPassenger.sort((a, b) => parseInt(a.apubTS) - parseInt(b.apubTS));
            // After building array replace liveScanModel version
            liveScanModel.alertsPassenger = [...tempAlertsPassenger];
            console.log("alertsPassenger dataset (post-sort)", liveScanModel.alertsPassenger);
            // Skip during watchedTracker mode otherwise update in the browser
            if (liveScanModel.watchedTrackerIsOn) {
              outputTrackerAlerts(true);
            } else if (liveScanModel.manualTrackerIsOn) {
              outputPassengerAlerts(false);
            }
            resolve(true); // Resolve the promise when finished
          }
        );
        // Return the unsubscribe function for cleanup if needed
        return () => unsubscribe();
      });
    }
  }
  
  async function fetchAllAlerts() {
    console.log("fetchAllAlerts()");
    if (liveScanModel.alertsAll[0].apubID == "loading") {
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(
          doc(db, liveScanModel.alertpublishCollection, "all"),
          (querySnapshot) => {
            let tempAlertsAll = [];
            let dataSet = querySnapshot.data();
            let i = 0;
            for (let data in dataSet) {
              dataSet[data]['date'] = new Date(dataSet[data]['apubTS'] * 1000);
              tempAlertsAll.push(dataSet[data]);
              i++;
            }
            // Sort by apubTS descending
            tempAlertsAll.sort((a, b) => parseInt(a.apubTS) - parseInt(b.apubTS));
            liveScanModel.alertsAll = [...tempAlertsAll];
            console.log("alertsAll dataset (post-sort)", liveScanModel.alertsAll);
            // Skip during watchedTracker mode otherwise update in the browser
            if (liveScanModel.watchedTrackerIsOn) {
              outputTrackerAlerts(true);
            } else if (liveScanModel.manualTrackerIsOn) {
              outputPassengerAlerts(false);
            }
            resolve(true); // Resolve the promise when finished
          }
        );
        // Return the unsubscribe function for cleanup if needed
        return () => unsubscribe();
      });
    }
  }
  

async function fetchWebcamSources() {
    console.log("running fetchWebcamSources()");
    const webcamSourcesSnapshot = onSnapshot(doc(db, "Controls", "webcamSources"), (querySnapshot) => {
        let dataSet = querySnapshot.data();
        console.log("webcamSources ",dataSet);
        liveScanModel.webcamSources = dataSet;

    })
}

async function fetchWebcamSites() { //Gets latest data on webcam activation and switching
    //console.log("running fetchWebcamSites() ");
    const webcamSitesSnapshot = onSnapshot(doc(db, "Controls", "webcamSites"), (qs) => {
        let dataSet = qs.data();
        //console.log("fetchWebcamSites dataset "+ dataSet + " webcamSitesID is " + liveScanModel.webcamSitesID);
        liveScanModel.cameraStatus.showVideo   = dataSet[liveScanModel.webcamSitesID].showVideo
        liveScanModel.cameraStatus.showVideoOn = dataSet[liveScanModel.webcamSitesID].showVideoOn
        liveScanModel.cameraStatus.webcamID   = dataSet[liveScanModel.webcamSitesID].srcID
        liveScanModel.cameraStatus.vesselsInRange = dataSet[liveScanModel.webcamSitesID].vesselsInRange
        liveScanModel.cameraStatus.webcamZoom  = dataSet[liveScanModel.webcamSitesID].zoom
        liveScanModel.cameraStatus.videoIsPassingCloseup = dataSet[liveScanModel.webcamSitesID].videoIsPassingCloseup;
        liveScanModel.cameraStatus.videoIsFull = dataSet[liveScanModel.webcamSitesID].videoIsFull;
        liveScanModel.resetTime = dataSet[liveScanModel.webcamSitesID].resetTime;
        liveScanModel.idTime    = dataSet[liveScanModel.webcamSitesID].idTime;
        /* DATA FORMAT
            idTime [
                {min:14 sec:50 videoIsFull:false },
                {min:44 sec:50 videoIsFull:false },
            ]
        */
        liveScanModel.promoSources  = dataSet[liveScanModel.webcamSitesID].promoSources;
        liveScanModel.videoProgram  = dataSet[liveScanModel.webcamSitesID].videoProgram;
        /* DATA FORMAT 
            videoProgram {
            date: 5,
            hour: 3,
            min : 0,
            month: 11,
            sec: 0
            source: "waypoint-notifications.m3u8",
            title: "Waypoint Notifications",
            videoIsFull: true
            }
            */
        console.log("fetchWebcamSites() cameraStatus ="+liveScanModel.cameraStatus);
         //Ensure view update for showVideo boolean changes
      outputWaypoint(
        liveScanModel.cameraStatus.showVideoOn, 
        liveScanModel.cameraStatus.showVideo, 
        liveScanModel.cameraStatus.webcamID,
        liveScanModel.cameraStatus.videoIsFull, 
        liveScanModel.promoIsOn,
        liveScanModel.videoProgramIsOn,
        liveScanModel.cameraStatus.videoIsPassingCloseup
      )
       
    })
}

async function fetchWaypoint() {
    
  const waypointSnapshot = onSnapshot(doc(db, "Passages", "Admin"), (querySnapshot) => {  
    let dataSet = querySnapshot.data()
    let apubID, vpubID, lsLen, apublishCollection, vpublishCollection, waypoint 
    let wasOutput = false; //Resets when screen updates

    //console.log("TRACER: Admin obj & liveScanModel.sitename ", dataSet, liveScanModel.sitename);
    //console.log("TracerB: showVideoField, showVideoOnField, webcamIDField, webcamZoomfield",liveScanModel.showVideoField, liveScanModel.showVideoOnField, liveScanModel.webcamIDField, liveScanModel.webcamZoomField);
    apubID = dataSet[liveScanModel.apubFieldName].toString()
    vpubID = dataSet[liveScanModel.vpubFieldName].toString()
    lsLen   = dataSet[liveScanModel.lsLenField]

    // if(!sitename.includes("dash")) {
    //     liveScanModel.webcamSources = dataSet.webcamSources;
    //     liveScanModel.cameraStatus.showVideo   = dataSet[liveScanModel.showVideoField]
    //     liveScanModel.cameraStatus.showVideoOn = dataSet[liveScanModel.showVideoOnField]
    //     liveScanModel.cameraStatus.webcamID   = dataSet[liveScanModel.webcamIDField].name
    //     liveScanModel.cameraStatus.vesselsInRange = dataSet[liveScanModel.webcamIDField].vesselsInRange
    //     liveScanModel.cameraStatus.webcamZoom  = dataSet[liveScanModel.webcamIDField].zoom
    //     liveScanModel.cameraStatus.videoIsPassingCloseup = dataSet[liveScanModel.webcamIDField].videoIsPassingCloseup;
    //     liveScanModel.cameraStatus.videoIsFull = dataSet[liveScanModel.webcamIDField].videoIsFull;
    // }

    apublishCollection = liveScanModel.alertpublishCollection;
    vpublishCollection = liveScanModel.voicepublishCollection;
                                        


    //Compare lsLen to liveScan array size
    if(lsLen < liveScans.length) {
      //Reset array and maps if update array size is less
      liveScans.forEach( o => {
        o.map1marker.setMap(null)
        o.map2marker.setMap(null)
        o.map3marker.setMap(null)
      })
      liveScans.splice(0, liveScans.length)
      liveScanModel.labelIndex = 0
    }
    //On 1st load initiate prevVpubID
    if(liveScanModel.prevVpubID == 0) {
      liveScanModel.prevVpubID = vpubID
    }

    //Check for new waypoint on each snapshot update
    getDoc(doc(db, apublishCollection,  apubID))
    .then( (document) => {
      if(document.exists()) {
        waypoint = document.data()
        let dt = new Date()
        let ts = Math.round(dt.getTime()/1000)
        let diff = ts - waypoint.apubTS
        //Is apubID (waypoint) new?
        if(apubID > liveScanModel.prevApubID) {
          //Is model 0 default?
          if(liveScanModel.prevApubID == 0) {
            //Yes. Update stored obj and save new apubID
            liveScanModel.waypoint   = waypoint
            liveScanModel.prevApubID = apubID
          }
          console.log("Is diff < 300? -> "+diff+" apubRegion is "+liveScanModel.waypoint.apubRegion)

          return true
        }       
      } else {
        outputWaypoint(
          liveScanModel.cameraStatus.showVideoOn, 
          liveScanModel.cameraStatus.showVideo, 
          liveScanModel.cameraStatus.webcamID,
          liveScanModel.cameraStatus.videoIsFull, 
          liveScanModel.promoIsOn,
          liveScanModel.videoProgramIsOn,
          liveScanModel.cameraStatus.videoIsPassingCloseup
        )
        wasOutput = true
        return false
      }
    })

    .then( (isNew) => {
      if(!isNew) return
      //Waypoint is new, so continue
      //   Calculate waypoint by event and direction data
      let dir = liveScanModel.waypoint.apubDir.includes('wn') ? "down" : "up"
      //Strip waypoint basename as event name
      let event = liveScanModel.waypoint.apubEvent.substr(0, liveScanModel.waypoint.apubEvent.length-2)
      let str = event + "-" + dir + "-map-v2.jpg"
      //let str = event + "-" + dir + "-map.png"
      liveScanModel.waypoint.bgMap = "https://storage.googleapis.com/www.clintonrivertraffic.com/images/"+str
      //Prevent audio play on reload
      if(liveScanModel.isReload) {
        liveScanModel.isReload = false 
        outputWaypoint(
          liveScanModel.cameraStatus.showVideoOn, 
          liveScanModel.cameraStatus.showVideo, 
          liveScanModel.cameraStatus.webcamID,
          liveScanModel.cameraStatus.videoIsFull, 
          liveScanModel.promoIsOn,
          liveScanModel.videoProgramIsOn,
          liveScanModel.cameraStatus.videoIsPassingCloseup
        );
        wasOutput = true
        console.log("waypoint output skipping audio play on browser reload.")
        return
      }
      //Change class of event with matching apubID
      //if(liveScanModel.regionsWatched.includes(liveScanModel.waypoint.apubRegion)) {
        if(liveScanModel.waypoint.apubID===liveScanModel.alertsPassenger[19].apubID) {
            const li = document.getElementById("pass19")
            li.classList.add('isNew')      
            console.log("waypoint match found to passenger event "+diff+" seconds ago -> playSound()")
            playSound()
        } else if(liveScanModel.waypoint.apubID===liveScanModel.alertsAll[19].apubID) {
            const li = document.getElementById("all19")
            li.classList.add('isNew')
            console.log("waypoint match found to 'any' event "+diff+" seconds ago -> playSound()")
            playSound()
        } else {
            console.log("no waypoint match to an event was found")
        }
      //}  
      outputWaypoint(
        liveScanModel.cameraStatus.showVideoOn, 
        liveScanModel.cameraStatus.showVideo, 
        liveScanModel.cameraStatus.webcamID,
        liveScanModel.cameraStatus.videoIsFull, 
        liveScanModel.promoIsOn,
        liveScanModel.videoProgramIsOn,
        liveScanModel.cameraStatus.videoIsPassingCloseup
      )
    })

    //Also check for new voice annoucement on each snapshot update
    getDoc(doc(db, vpublishCollection, vpubID))
    .then( (document) => {
      if(document.exists()) {
        //let announcement = document.data()
        liveScanModel.announcement = document.data()
        let dt = new Date()
        let ts = Math.round(dt.getTime()/1000)
        let diff = ts - liveScanModel.announcement.vpubTS
        
        if(liveScanModel.regionsWatched.includes(liveScanModel.announcement.vpubRegion) &&
        vpubID > liveScanModel.prevVpubID && diff < 300) {
          return true
        }
        return false
      } else {
        console.log("No announcements.", vpubID)
        liveScanModel.announcement = {
          vpubText: "No new announcements."
        }
        return false
      }
    })
    .then( (isNew) => {  
      if(isNew) {
        liveScanModel.prevVpubID = vpubID
        playAnnouncement()
      }
    })
    if(!wasOutput) {
      //Ensure view update for showVideo boolean changes
      outputWaypoint(
        liveScanModel.cameraStatus.showVideoOn, 
        liveScanModel.cameraStatus.showVideo, 
        liveScanModel.cameraStatus.webcamID,
        liveScanModel.cameraStatus.videoIsFull, 
        liveScanModel.promoIsOn,
        liveScanModel.videoProgramIsOn,
        liveScanModel.cameraStatus.videoIsPassingCloseup
      )
    }
  })

  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  })
}         


function fetchNews() {
  const dow = ["sunday", "monday", "tuesday", "wednesday","thursday","friday","saturday"]
  const keys = ["f01", "f02", "f03", "f04", "f05", "f06", "f07", "f08", "f09", "f10", "f11", "f12", "f13", "f14", "f15", "f16", "f17", "f18", "f19", "f20", "f21", "f22", "f23", "f24", "f25"]
  const newsSnapshot = onSnapshot(doc(db, liveScanModel.announcementsCollection, "dashboard"), (querySnapshot) => {
    var dataSet = querySnapshot.data()
    let ts      = new Date()
    let day     = ts.getDay()
    let item, news = [], i = 0, nkey, now = ts.getTime()    
    for(item in dataSet) {
      //Put in array if not date excluded
      let start = new Date(dataSet[item].startTS)
      let end   = new Date(dataSet[item].endTS)
      if(now < start.getTime() || now > end.getTime()) {
        //console.log("news outside date range", dataSet[item])
        i++
        continue
      }
      if(dataSet[item].hasOnlyDay==true && dataSet[item].onlyDay!=dow[day]) {
        //console.log("news onlyday fail", dataSet[item])
        i++
        continue
      }
      if(!dataSet[item].regions.some(region => liveScanModel.regionsWatched.includes(region))) {
        //console.log("news item not of watched region")
        i++
        continue
      }
      nkey = keys[i]
      news.push({key: nkey, text: dataSet[item].text })
      i++
    }
    //After building array replace liveScanModel version
    liveScanModel.news = [...news]
  })
  return new Promise((resolve, reject )=>{
    reject()
    resolve()
  })
}

function getKeyOfId(arr, id) {
  let key = -1;
  arr.forEach(function (currentVal, idx) {
    if(id == currentVal.id) {
      key = idx;
    }
  });
  return key;  
}

//Function used in initLiveScan()
function formatTime(ts) {
  var d, day, days, dh, h, m, merd, str;
  if(ts=="Not Yet Reached") { return ts; }
  ts = new Date(ts);
  h = ts.getHours();
  m = ts.getMinutes();
  if(m < 10) { m = "0" + m; }
  d = ts.getDay();
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  day  = days[d];
  merd = h>=12 ? 'pm':'am';
  if(h>12) { 
    dh = h-12; 
  } else if(h==0) {
    dh = 12;
  } else {
    dh = h;
  }
  str = dh +":"+m+merd+" "+day;
  return str;
}

function loadSavedTracker() {
  console.log("running loadSavedTracker 25 sec after a refresh");
  let loadItem  = window.localStorage.getItem('crtTrackerStatusEnabled');
  let isEnabled = loadItem=='true'? true : false;
  let followingId = parseInt(window.localStorage.getItem('crtTrackerStatusFollowingId'));
  let key = getKeyOfId(liveScans, followingId);
  if(isEnabled) {
    console.log("key match? ", key);
    if(key>-1) {
      liveScanModel.trackerStatus.enabled = true;
      liveScanModel.trackerStatus.followingId = followingId;
      liveScanModel.trackerStatus.obj = liveScans[key];
      outputPassengerAlerts(false);
    } else {
      liveScanModel.trackerStatus.enabled = false;
      liveScanModel.trackerStatus.followingId = null;
      liveScanModel.trackerStatus.obj = null;
    }
  }
  
}






function predictMovement() {
  //console.log('predictMovement()')
  var speed, distance, bearing, point, coords, icon;
  //Loop through live vessels
  liveScans.forEach( (o) => {
    //Skip if vessel not moving or bogus position data
    
    if( o.isMoving && (o.lat > 1) && (-o.lng > 1)) {
      //console.log(o.name+" moving->"+o.isMoving);
      //Remove 'kts' from speed & change to int 
      speed = parseInt(o.speed);
      //Multiply knots by 1.852 to get KPH
      speed = speed * 1.852;
      //Ignore unrealistic speed reports.
      if(speed > 50) {
        return;
      }
      //Divide KPH by 3600 to get kilometers traveled in one second
      distance = speed / 3600;
      //Clean course 
      bearing = parseInt(o.course);
      //Predict next point
      point = calculateNewPositionFromBearingDistance(o.lat, o.lng, bearing, distance);
  
      //Update map view & object lat/lng
      liveScans[o.key].map1marker.setPosition(new google.maps.LatLng(point[0], point[1]));
      if(liveScanModel.trackerStatus.enabled) {
        liveScans[o.key].map3marker.setPosition(new google.maps.LatLng(point[0], point[1]));
      } else {
        liveScans[o.key].map2marker.setPosition(new google.maps.LatLng(point[0], point[1]));
      }
      
      
      liveScans[o.key].lat = point[0];
      liveScans[o.key].lng = point[1];
      
    } 
    
  });  
}

function calculateNewPositionFromBearingDistance(lat, lng, bearing, distance) {
  var R = 6371; // Earth Radius in Km
  var lat2 = Math.asin(Math.sin(Math.PI / 180 * lat) * Math.cos(distance / R) + Math.cos(Math.PI / 180 * lat) * Math.sin(distance / R) * Math.cos(Math.PI / 180 * bearing));
  var lon2 = Math.PI / 180 * lng + Math.atan2(Math.sin( Math.PI / 180 * bearing) * Math.sin(distance / R) * Math.cos( Math.PI / 180 * lat ), Math.cos(distance / R) - Math.sin( Math.PI / 180 * lat) * Math.sin(lat2));
  var rLat = 180 / Math.PI * lat2;
  var rLng = 180 / Math.PI * lon2; 
  return [ parseFloat(rLat.toFixed(6)), parseFloat(rLng.toFixed(6)) ];
}


function testHeight() {
  if(window.innerHeight < 721) {
    liveScanModel.transponder.stepMax = 5;
    //console.log("A height is ", window.innerHeight," step max is ",liveScanModel.transponder.stepMax)
  } else if(window.innerHeight > 720 && window.innerHeight < 1081) {

    liveScanModel.transponder.stepMax = 6;
    //console.log("B height is ", window.innerHeight," step max is ",liveScanModel.transponder.stepMax)
  } else if(window.innerHeight > 1080) {
    liveScanModel.transponder.stepMax = 8;
    //console.log("C height is ", window.innerHeight," step max is ",liveScanModel.transponder.stepMax)
  }
}

function stepTransponderView() {
  let i   = liveScanModel.transponder.step
  let len = liveScans.length
  if(len < liveScanModel.transponder.stepMax) {
    //Do nothing when tranponder list fits on screen
    outputAllVessels()
    outputTrackerOptions();
    return
  }
  if(i >= len) {
    //reset step when source length reached
    liveScanModel.transponder.step = 0
  }
  //store source increment in array
  let s = []
  for(let v = 0; v<liveScanModel.transponder.stepMax; v++) {
    //s[v] = i>(len-v) ? i-len+v : i+v;
    if(i>= len-v) {
      s[v] = i-len+v
      //console.log("i>len-v is true", s[v])
    } else {
      s[v] = i+v
      //console.log("i+v", i, v)
    }
    liveScanModel.transponder.viewList[v] = liveScans[s[v]]
  }
  outputAllVessels()
  outputTrackerOptions()
  liveScanModel.transponder.step++
}


