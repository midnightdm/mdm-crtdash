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

//Functions

app.get('/', async (req, res) => {
  const snapshot = await db.collection('LiveScan').get();
  let livescans = [];
  snapshot.forEach( doc => {
    let data = doc.data();
    livescans.push(data); //(or ...data?)
  });
  res.status(200).send(JSON.stringify(livescans));
});

exports.livescans = functions.https.onRequest(app);
  

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

