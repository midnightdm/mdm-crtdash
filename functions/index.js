const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
var serviceAccount = require('./credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mdm-qcrt-demo-1-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

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

