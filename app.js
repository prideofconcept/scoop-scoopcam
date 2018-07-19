const spawn = require('child_process').spawn;
var firebase = require("firebase");
const admin = require('firebase-admin');

let child = null //spawn('python', ['cam_record.py', 'media/']);

var serviceAccount = require('./key/serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
const doc = db.collection('camera').doc('scoopcam1') // todo: s houdl the collections be exported from the firebase module

let isCameraOn = false;

const handleCurrentCameraUpdate = (docSnapshot) => {
    //console.log(docSnapshot.id, '=>', docSnapshot.data());
    const data = docSnapshot.data()
    if(data.onRide) {
        console.log('we are on ride')
        if(!isCameraOn){
            console.log('turning camera ON!')
            //child = spawn('python', ['cam_record.py', 'media/']);
            isCameraOn = true;
        }
    } else {
        console.log('we are NOT riding')
        if(child && isCameraOn){
            console.log('turning off camera')
            child.kill();
            isCameraOn = false;
        }
    }
}

const loadCUrrentFirestoreData = () => {
    doc.get()
        .then(handleCurrentCameraUpdate)
}

const setupListeners = () => {
    doc.onSnapshot(handleCurrentCameraUpdate,
        (error) => { console.log("Error getting documents: ", error);})
}

loadCUrrentFirestoreData()
setupListeners();
