import { initializeApp } from 'firebase/app'
import {
  getFirestore, onSnapshot, doc, getDoc
} from 'firebase/firestore'
import { LiveScanModel } from './LiveScanModel'
import { Environment } from './environment'
import LiveScan from './LiveScan'
import Hls from './hls.min.js'
//UNCOMMENT BELOW FOR TEST DATA (& Set line 365 to true)
//import { fakeLiveScan } from './fakeLiveScan.js'
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

const privateMode = true;
const firebaseConfig = env.firebaseConfig
initializeApp(firebaseConfig)
//const hls = new Hls()
//window.hls = hls

const db = getFirestore();
const liveScanModel = LiveScanModel;
liveScanModel.initRegion();
const liveScans     = [];
const siteLabel     = document.getElementById("site-label");
siteLabel.innerText = region;
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
const news          = document.getElementById("newstext");
const videoTag         = document.getElementById('video');
const videoSource  = document.getElementById("video-source");


function initMap() {
  liveScanModel.initalizeMap();
}
window.initMap = initMap;
window.initLiveScan = initLiveScan;
testHeight()
//hls.attachMedia(videoTag)

/* * * * * * * * *
* Functions  
*/
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

function outputWaypoint(showVideoOn, showVideo, webcamNum) {  
  if(privateMode==true) { 
    showVideoOn=false;
  }
  console.log("outputWaypoint(showVideoOn, showVideo, webcamNum), videoSource", showVideoOn, showVideo, webcamNum, liveScanModel.videoSource);
  if(showVideoOn==true && showVideo==true) {
    waypointDiv.style = `display: none`;
    videoTag.style = `display: block; z-index: 0`;
    waypointLabel.innerHTML = "3 Miles South of Drawbridge";
    console.log("webcamNum is", webcamNum);
    if(webcamNum != liveScanModel.prevWebcamNum) {
      liveScanModel.videoSource = location.protocol +'//' + location.host + '/'+ region + 'Webcam' + webcamNum + '.m3u8';
      console.log("video source", liveScanModel.videoSource);
      //hls.loadSource(liveScanModel.videoSource);
      videoSource.setAttribute("src", liveScanModel.videoSource);
      liveScanModel.prevWebcamNum = webcamNum;
      console.log("outputWaypoint(showVideoOn, showVideo, webcamNum), videoSource", showVideoOn, showVideo, webcamNum, liveScanModel.videoSource);
    } 
    waypointLabel.style = `z-index: 1`;
  } else {
    videoTag.style = `display: none`;
    waypoint.style = `background-image: url(${liveScanModel.waypoint.bgMap})`;
    waypointLabel.innerHTML = "WAYPOINT";
    waypointDiv.innerHTML = `<h3>${liveScanModel.waypoint.apubText}</h3>`;
    waypointDiv.style.display = "block";
    console.log("outputWaypoint(showVideoOn, showVideo, webcamNum)", showVideoOn, showVideo, webcamNum);
  } 
}


async function outputSelVessel() {
  let selVesselOutput = "";
  let live   = liveScanModel.rotatingKey; 
  if(liveScans[live]===undefined) { 
    if(liveScanModel.rotatingKey > liveScans.length) {
      console.log("Rotating Key updated from "+liveScanModel.rotatingKey+" to 0 by outputSelVessel()")
      liveScanModel.rotatingKey = 0
    }  
    return new Promise((resolve, reject )=>{
      resolve()
      reject()
    })
  }
  if(typeof liveScans[live].lat != 'number') {
    let to = typeof liveScans[live].lat
    console.log("outputSelVessel() "+liveScans[live].name+" failed because lat "+liveScans[live].lat+" is NaN.  Instead it was typeof", to);
    return new Promise((resolve, reject )=>{
      resolve()
      reject()
    })
  }
  if(typeof liveScans[live].lng != 'number') {
    let to = typeof liveScans[live].lng
    console.log("outputSelVessel() "+liveScans[live].name+" failed because lng "+liveScans[live].lng+" is NaN.   Instead it was typeof ", to);
    return new Promise((resolve, reject )=>{
      resolve()
      reject()
    })
  }
  liveScanModel.map2.setCenter(  
      new google.maps.LatLng(liveScans[live].lat, liveScans[live].lng)
  );
  let vesselID = liveScans[live].id
  let passageIdx = liveScanModel.passagesList.findIndex( o=> o.id === vesselID)
  //let passageDate = liveScanModel.passagesList[passageIdx].date
  let passageDate = liveScans[live].lastPassageTS
  
  //Build output for selected vessel
  selVesselOutput += 
    `<li class="dataPoint"><span class="th">TYPE:</span> <span class="td">
    ${liveScans[live].type}</span></li>
    <li class="dataPoint"><span class="th">MMSI #:</span> <span class="td">
    ${liveScans[live].id}</span></li>
    <li class="dataPoint"><span class="th">LABEL:</span> <span class="td"><h4 class="map-label">
    ${liveScans[live].mapLabel}</h4></span></li>
    <li class="dataPoint"><span class="th">COURSE:</span> <span class="td">
  ${liveScans[live].course}°</span></li>
  <li class=dataPoint><span class=th>SPEED:</span> <span class=td>
  ${liveScans[live].speed} Knots</span></li>
  <li class="dataPoint"><span class="th">DIRECTION:</span> <span class="td dir">
  ${liveScans[live].dir}</span>  </li>
  <li class="dataPoint"><span class="th">COORDINATES:</span> <span class="td dir">
  ${liveScans[live].lat.toFixed(7)}, ${liveScans[live].lng.toFixed(7)}</span>  </li>
  <li class="dataPoint"><span class="th">LOCATION:</span> <span class="td">
  ${liveScans[live].liveLocation}</span></li>
  <li class="dataPoint"><span class="th">LAST PASSAGE:</span> <span class="td">
  ${passageDate.toDateString()}
  </span></li>`;
  selVessel.innerHTML  = selVesselOutput;      //Selected Vessel's Data
  dataTitle.innerHTML  = liveScans[live].name;
  dataImage.setAttribute('src', liveScans[live].imageUrl);
  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  }) 
}

async function outputAllVessels() {
  let allVesselsOutput = "";
  //Build output for transponder list (from viewList if used)
  if(liveScanModel.transponder.viewList.length> 0){
    let c = 0;
    for(let vessel in liveScanModel.transponder.viewList) {
      let obj = liveScanModel.transponder.viewList[vessel]
      allVesselsOutput+= c==liveScanModel.transponder.stepMax-1 ? `<li class="animate__animated animate__slideInLeft">` : `<li class="animate__animated animate__slideInUp">`;
      allVesselsOutput+=
        `<div class="list-wrap">
          <h4 class="map-label">${obj.mapLabel}</h4>
          <h4 class="tile-title">${obj.name}</h4> 
          <div class="dir-container">
            <img class="dir-img" src="${obj.dirImg}"/>          
            <span class="speed">${Math.round(obj.speed)}</span>
          </div>            
        </div>
        <h5>${obj.liveLocation}</h5>
      </li>`;
      c++;
    }
  } else {
    for(let vessel in liveScans) {
      let obj = liveScans[vessel];
      let spd = "";
      if(obj.dir !=="undetermined") {
        spd = Math.round(obj.speed);
      }
      allVesselsOutput+= 
      `<li>
        <div class="list-wrap">
          <h4 class="map-label">${obj.mapLabel}</h4>
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
  totVessels.innerHTML = liveScans.length+" Vessels"; //Total Vessels Title
  allVessels.innerHTML = allVesselsOutput;     //List of All transponders in range
}

function outputNews() {
  //News section
  animateCSS('#newstext', 'fadeIn');
  news.innerHTML = liveScanModel.news[liveScanModel.newsKey].text;
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

function outputPassengerAlerts() {
  //Build output for passenger alerts
  if(!liveScanModel.alertsPassenger.length) return;
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
    ulPass.innerHTML     = alertsOutputPassenger;
}

function outputOtherAlerts() {
  //Build output for other alerts
  if(!liveScanModel.alertsAll.length) return;
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


async function initLiveScan(rotateTransponders=true) {  
  /*   *   *   *   *   *   *   *   *   *   *  *  *   *
   * Begin a 60 sec master clock for loop control    */
  setInterval( async ()=> {

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
      await outputSelVessel();
      liveScanModel.rotatingKey++;       
      if(liveScanModel.rotatingKey > liveScans.length) {
        console.log("Rotating key updated from "+liveScanModel.rotatingKey+" to 0 by loop controller.")
        liveScanModel.rotatingKey = 0;
      }
    }
    
    //Every 20 sec --> 
    if(liveScanModel.tock%20==0) {
      //Change news text...
      if(liveScanModel.news.length) {
        if(liveScanModel.newsKey >= liveScanModel.news.length) {
          liveScanModel.newsKey = 0;
        }
        //console.log("outputNews", liveScanModel.newsKey)
        outputNews();
        liveScanModel.newsKey++
      }
      
      //...and fetch livescan data from API
      const myHeaders = new Headers({
        'Content-Type': 'application/json'
      });
      
      const response = await fetch(liveScanModel.fetchUrl,  {
        headers: myHeaders
      });
      if(response.status===200) {
        const data = await response.json();
        let key, obj, len, dat, i;
        
        for(i=0; i<data.length; i++){
          dat = data[i];
          //Skip out-of-region data objects
          if(dat.liveRegion != region) {
            console.log("Skipping out-of-region vessel",dat.liveName);
            continue;
          }
          if(!liveScans.length){
            key = -1;
          } else {
            key = getKeyOfId(liveScans, dat.liveVesselID);
          }
          
          //Create & push
          if(key==-1) {
            obj = await liveScanModel.mapper(new LiveScan(), dat, true);
            obj.key = liveScans.length;
            liveScans.push(obj);
          }
          //Find & Update
          else {
            liveScans[key] = await liveScanModel.mapper(liveScans[key], dat, false);
            //Has num of vessels changed?
            if(liveScans.length != liveScanModel.numVessels) {
              //Store new vessels quantity
              liveScanModel.numVessels = liveScans.length;
              //Reset rotating key to avoid desynch
              liveScanModel.rotatingKey = liveScanModel.numVessels;              
            }
          }  
        };
      }  
    }
    //Every 1 sec advance clock 
    liveScanModel.tock++;
    //Advance moving vessel icons predictively
    predictMovement() 
  }, 1000);
  /*  END OF CLOCK LOOP   */

  if(false) {
    //Load test liveScan data
    fakeLiveScan.forEach( async (dat) => {
      let obj = await liveScanModel.mapper(new LiveScan(liveScanModel), dat, true)
      liveScans.push(obj)
      let len = await fetchPassagesList()
      //outputVessels()
    })
    
  } else {
    //Initiate liveScans db snapshot
    //  initLiveScanSnapshot() DISABLED
    //And its deletion manager
    //initDeleteSnapshot()
  }

  await fetchAllAlerts();
  await fetchPassengerAlerts();
  await fetchWaypoint();
  await fetchNews();
  await fetchPassagesList()
  //Do first outputs
  outputOtherAlerts();
  outputPassengerAlerts();
  outputSelVessel();  
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

async function fetchAllAlerts() {
  if(liveScanModel.alertsAll[0].apubID == "loading") {
    const apubSnapshot = onSnapshot(doc(db, liveScanModel.alertpublishCollection, "all"), (querySnapshot) => {
      let tempAlertsAll = []
      let dataSet = querySnapshot.data()
      let i = 0
      for(let data in dataSet) {
        dataSet[data]['date'] = new Date(dataSet[data]['apubTS']*1000)
        tempAlertsAll.push(dataSet[data])
        i++
      }
      //Sort by apubTS decending
      tempAlertsAll.sort( (a,b) => parseInt(a.apubTS) - parseInt(b.apubTS))
      liveScanModel.alertsAll = [...tempAlertsAll]
      //Update in browser
      outputOtherAlerts();
      //playSound();  MOVED TO fetchWaypoint()
    })
  }
  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  })
}

async function fetchPassengerAlerts() {
  if(liveScanModel.alertsPassenger[0].apubID == "loading") {
    const apubSnapshot = onSnapshot(doc(db, liveScanModel.alertpublishCollection, "passenger"), (querySnapshot) => {
      let tempAlertsPassenger = []
      let dataSet = querySnapshot.data()
      let i = 0
      for(var data in dataSet) {
        dataSet[data]['date'] = new Date(dataSet[data]['apubTS']*1000)
        tempAlertsPassenger.push(dataSet[data])
        i++
      }
      //Sort by apubTS decending
      tempAlertsPassenger.sort( (a,b) => parseInt(a.apubTS) - parseInt(b.apubTS))
      //After building array replace liveScanModel version
      liveScanModel.alertsPassenger = [...tempAlertsPassenger]
      //Update in broswer
      outputPassengerAlerts();
      //playSound(); MOVED TO fetchWaypoint()
    })
  }
  return new Promise((resolve, reject )=>{
    resolve()
    reject()
  })
}

async function fetchWaypoint() {
  const adminSnapshot = onSnapshot(doc(db, "Passages", "Admin"), (querySnapshot) => {  
    let dataSet = querySnapshot.data();
    let apubID, vpubID, lsLen, showVideo, showVideoOn, webcamNum, apublishCollection, vpublishCollection, waypoint; 
    let wasOutput = false; //Resets when screen updates
    
    console.log("snapshotUpdate", liveScanModel.waypoint.bgMap);


    apubID = dataSet[liveScanModel.apubFieldName].toString();
    vpubID = dataSet[liveScanModel.vpubFieldName].toString();
    lsLen   = dataSet[liveScanModel.lsLenField]
    showVideo   = dataSet[liveScanModel.showVideoField]
    showVideoOn = dataSet[liveScanModel.showVideoOnField]
    webcamNum   = dataSet[liveScanModel.webcamNumField]   
    apublishCollection = liveScanModel.alertpublishCollection;
    vpublishCollection = liveScanModel.voicepublishCollection;

    //Compare lsLen to liveScan array size
    if(lsLen < liveScans.length) {
      //Reset array and maps if update array size is less
      liveScans.forEach( o => {
        o.map1marker.setMap(null)
        o.map2marker.setMap(null)
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
        if(apubID > liveScanModel.prevApubID ) {
          //Is model 0 default?
          if(liveScanModel.prevApubID == 0) {
            //Yes. Update stored obj and save new apubID
            liveScanModel.waypoint   = waypoint
            liveScanModel.prevApubID = apubID
          }
          //Yes. Output true to report it.
          return true
        }       
      } else {
        outputWaypoint(showVideoOn, showVideo, webcamNum)
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
        outputWaypoint(showVideoOn, showVideo, webcamNum);
        wasOutput = true
        console.log("waypoint output skipping audio play on browser reload.")
        return
      }
      //Change class of event with matching apubID
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
      outputWaypoint(showVideoOn, showVideo, webcamNum)
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
        
        if(vpubID > liveScanModel.prevVpubID && diff < 300) {
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
      outputWaypoint(showVideoOn, showVideo, webcamNum)
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
        console.log("news outside date range", dataSet[item])
        i++
        continue
      }
      if(dataSet[item].hasOnlyDay==true && dataSet[item].onlyDay!=dow[day]) {
        console.log("news onlyday fail", dataSet[item])
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
    resolve()
    reject()
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
      liveScans[o.key].map2marker.setPosition(new google.maps.LatLng(point[0], point[1]));
      liveScans[o.key].lat = point[0];
      liveScans[o.key].lng = point[1];
      
      //o.map2marker.setPosition(new google.maps.LatLng(point[0], point[1]));
      // coords = liveScanModel.getShipSpriteCoords(bearing);
      // if(o.type=="Passenger") {
      //   icon = {
      //     url: "https://storage.googleapis.com/www.clintonrivertraffic.com/images/ship-icon-sprite-yellow.png",
      //     origin: { x: coords[0], y: coords[1] }, 
      //     size: {width: 55, height: 55 }
      //   };
      // } else {
      //   icon = {
      //     url: "https://storage.googleapis.com/www.clintonrivertraffic.com/images/ship-icon-sprite-cyan.png",
      //     origin: { x: coords[0], y: coords[1] }, 
      //     size: {width: 55, height: 55 }
      //   };
      // }
      // o.map1marker.setIcon(icon); 
      // o.map2marker.setIcon(icon);
      //console.log(o.name+' predicted='+o.map1marker.getPosition(), point[0], point[1]); 
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

    liveScanModel.transponder.stepMax = 7;
    //console.log("B height is ", window.innerHeight," step max is ",liveScanModel.transponder.stepMax)
  } else if(window.innerHeight > 1080) {
    liveScanModel.transponder.stepMax = 9;
    //console.log("C height is ", window.innerHeight," step max is ",liveScanModel.transponder.stepMax)
  }
}

function stepTransponderView() {
  let i   = liveScanModel.transponder.step
  let len = liveScans.length
  if(len < liveScanModel.transponder.stepMax) {
    //Do nothing when tranponder list fits on screen
    outputAllVessels()
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
  liveScanModel.transponder.step++
}


