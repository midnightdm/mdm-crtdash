// Create and Deploy Your First Cloud Functions
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
var serviceAccount = require('./credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mdm-qcrt-demo-1-default-rtdb.firebaseio.com"
});
const db = admin.firestore();

//Load express framework for API calls
const express = require('express');
const cors    = require('cors');
const app = express();
app.use(cors({origin:true}));


//html strings
const bodytop = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" href="https://dashboard.clintonrivertraffic.com/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" type="text/css" href="https://dashboard.clintonrivertraffic.com/small.css">
  <title>Clinton River Traffic</title>
</head>
<body>`;
const bodybot = `</body></html>`;

//Returns json backend
app.get('/json', async (req, res) => {
  const snapshot = await db.collection('LiveScan').get();
  let livescans = [];
  snapshot.forEach( doc => {
    let data = doc.data();
    livescans.push(data); 
  });
  res.status(200).send(JSON.stringify(livescans));
});

//Returns html output listing vessels
app.get('/list', async (req, res) => {
  const snapshot = await db.collection('LiveScan').get();
  let livescans = [];
  snapshot.forEach( doc => {
    let data = doc.data();
    livescans.push(data); 
  });
  let allvessels = outputAllVessels(livescans);
  res.status(200).send(bodytop+allvessels+bodybot);
});

//Returns html output of specific vessel
app.get('/detail/:vessID', async (req, res) => {
  const vessID = req.params.vessID;
  const doc = await db.collection('LiveScan').doc(vessID).get();
  if (!doc.exists) {
    let detail = `<h2>Vessel Not Found</h2>`;
    res.status(404).send(bodytop+detail+bodybot);
  } else {
    let data = doc.data();
    let detail = outputDetail(data);  
    res.status(200).send(bodytop+detail+bodybot);
  }
});

app.post('/comment', async (req, res) => {
  const json = req.body
  //If comment not set, create new
  if(json.msgID=="newcomment") {
    const doc = db.collection('Comments').doc();
    const ret = await doc.set(json);
    await doc.update({
      ts: FieldValue.serverTimestamp()
    });
    res.end("Comment "+ret.id+" posted.");
  } else {
    const doc =  db.collection('Comments').doc(json.msgID);
    const ret = await doc.set(json, {merge: true });
    await doc.update({
      ts: FieldValue.serverTimestamp()
    });
    res.end("Comment "+ret.id+" updated.")
  }   
})

exports.livescans = functions.https.onRequest(app);

//Functions used by above
function outputAllVessels(livescans) {
  let i, j, allVesselsOutput =  
  `<div id="vess-list" class="active">
    <h2 id="total-vessels">${livescans.length} Vessels</h2>
    <section class="listMode">
    <ul id="all-vessels">`;
    
    //Order vessels by river segment
    let segments = [ [], [], [], [], [] ];
    for(let vessel in livescans) {
      let obj = livescans[vessel];
      obj.spd = "";
      if(obj.liveDirection !=="undetermined") {
        obj.spd = Math.round(obj.liveSpeed);
      }
      obj.dirImg = getDirImg(obj.liveDirection);
      switch(obj.liveSegment) {
        case 0: { segments[0].push(obj); break; }
        case 1: { segments[1].push(obj); break; }
        case 2: { segments[2].push(obj); break; }
        case 3: { segments[3].push(obj); break; }
        case 4: { segments[4].push(obj); break; }
      }
    }
    //Build output string for each segment
    const maplines = [
      ``,
      `<li><span class="waypoint">3 SOUTH</span></li>`,
      `<li><span class="waypoint">RR  BRIDGE</span></li>`,
      `<li><span class="waypoint">LOCK 13</span></li>`,
      `<li><span class="waypoint">3 NORTH</span></li>`
    ];
    for(i=4; i>-1; i--) {
      if(segments[i].length) {
        segments[i] = segments[i].sort(compareSeg);
        for(j=0; j<segments[i].length; j++) {
          obj = segments[i][j];
          allVesselsOutput+= 
                  `<li>
                    <div class="list-wrap">
                      <a class="btn" href="detail/mmsi${obj.liveVesselID}">DATA</a> 
                      <h4 class="tile-title">${obj.liveName}</h4> 
                      <div class="dir-container">
                        <img class="dir-img" src="${obj.dirImg}"/>
                        <span class="speed">${obj.spd}</span>
                      </div>               
                    </div>
                    <h5>${obj.liveLocation}</h5>
                  </li>`;
        }
      }
      allVesselsOutput+= maplines[i];
    }
    allVesselsOutput+= 
          `</ul>
        </section>  
      </div>`;
    return allVesselsOutput;
}

function outputDetail(data) {
  let obj = data;
  obj.spd = "";
  obj.dirImg = getDirImg(obj.liveDirection);
  if(obj.liveDirection !=="undetermined") {
    obj.spd = Math.round(obj.liveSpeed);
  }
  let lat = obj.liveLastLat ==="" ? "" : obj.liveLastLat.toFixed(7);
  let lng = obj.liveLastLon ==="" ? "" : obj.liveLastLon.toFixed(7);
  //console.log("detail index:", index);
  let detailOutput =  
  `<div id="page-insert" class="listMode">
    <ul>
      <li>
      <div class="list-wrap">
        <a class="btn" href="../list"">LIST</a>
        <h4 class="tile-title">${obj.liveName}</h4> 
        <div class="dir-container">
          <img class="dir-img" src="${obj.dirImg}"/>
          <span class="speed">${obj.spd}</span>
        </div>               
      </div>
      <div class="data-cont grid2-container">
        <div id="data-table">
          <ul id="selected-vessel">
            <li class="dataPoint"><span class="th">TYPE:</span> <span class="td">${obj.type}</span></li>
            <li class="dataPoint"><span class="th">MMSI #:</span> <span class="td">${obj.liveVesselID}</span></li>
            <li class="dataPoint"><span class="th">COURSE:</span> <span class="td">${obj.liveCourse}°</span></li>
            <li class=dataPoint><span class=th>SPEED:</span> <span class=td>${obj.liveSpeed} Knots</span></li>
            <li class="dataPoint"><span class="th">DIRECTION:</span> <span class="td dir">${obj.liveDirection}</span>  </li>
            <li class="dataPoint"><span class="th">COORDINATES:</span> <span class="td dir">${lat}, ${lng}</span>  
            </li>
          </ul>
        </div>
        <div id="img-frame"><img id="data-image" src="${obj.imageUrl}"></div><br>
      </div>
      <h5>${obj.liveLocation}</h5>
      </li>
  </ul>
  </div>`;
  return detailOutput;  
}

function getDirImg(dir) {
  switch(dir) {
    case "undetermined": return "https://storage.googleapis.com/www.clintonrivertraffic.com/images/qmark.png"; break;
    case "upriver"     : return "https://storage.googleapis.com/www.clintonrivertraffic.com/images/uparr.png"; break;
    case "downriver"   : return "https://storage.googleapis.com/www.clintonrivertraffic.com/images/dwnarr.png"; break;
  }
}

function compareSeg(a, b) {
  return b.lat - a.lat;
}

// exports.onDelete = functions.firestore
//     .document('LiveScan/{documentID}')
//     .onDelete((snap, context) => {
//       const deletedID = snap.data().liveVesselID;
//       const now = new Date();
//       const when = now.toLocaleString('en-US', { timeZone: 'America/Chicago'});
//       functions.logger.log('Deleted id was ', deletedID, now.toString(), when);      
//       const res = null;
//       db.collection('Deletes')
//         .doc()
//         .set({ 
//           day: now.getDay(),
//           date: when,
//           ts: Math.round(now.getTime()/1000),
//           id: deletedID,
//           source: "cloud function"
//         }
//       );
//       return res;
//     });

