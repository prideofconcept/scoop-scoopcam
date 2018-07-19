const spawn = require('child_process').spawn;
const firebase = require("firebase");
const admin = require('firebase-admin');

const chokidar = require('chokidar');
const rimraf = require('rimraf');

let child = null;
const serviceAccount = require('./key/serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const doc = db.collection('camera').doc('scoopcam1'); // todo: should the collections be exported from the firebase module

let isCameraOn = false;
const rideCleanUp = () => {
    //todo : clear media dir?
    rimraf('.media/*', function() {console.log('...clean, ready.')})
}
const handleCurrentCameraUpdate = (docSnapshot) => {
    //console.log(docSnapshot.id, '=>', docSnapshot.data());
    const data = docSnapshot.data();
    if(data.onRide) {
        console.log('we are on ride');
        if(!isCameraOn){
            console.log('turning camera ON!');
            child = spawn('python', ['cam_record.py', 'media/']);
            isCameraOn = true;
        }
    } else {
        console.log('we are NOT riding');
        if(child && isCameraOn){
            console.log('turning off camera');
            rideCleanUp()
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
    //firestore camera doc changes
    doc.onSnapshot(handleCurrentCameraUpdate,
        (error) => { console.log("Error getting documents: ", error);})

    //media directory changes
    chokidar.watch('media/', {ignored: /(^|[\/\\])\../}).on('add', (path, event) => {
        console.log(path);
    });
}

rideCleanUp();
loadCUrrentFirestoreData();
setupListeners();
