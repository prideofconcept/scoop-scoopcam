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

const root = {
    isCameraOn: false,
    currRideId: null
}
const rideCleanUp = () => {
    rimraf('.media/*', function() {console.log('...clean, ready.')})
}
const handleCurrentCameraUpdate = (docSnapshot) => {
    //console.log(docSnapshot.id, '=>', docSnapshot.data());

    const data = docSnapshot.data();
    root.isOnRide = data.onRide;
    root.currRideId = data.currRide;

    if(root.isOnRide) {
        console.log('we are on ride', root.currRideId);
        if(!root.isCameraOn){
            console.log('turning camera ON!');
            child = spawn('python', ['cam_record.py', root.currRideId]);
            root.isCameraOn = true;
        }
    } else {
        console.log('we are NOT riding');
        if(child && root.isCameraOn){
            console.log('turning off camera');
            rideCleanUp();
            child.kill();
            root.isCameraOn = false;
        }
    }
}

const loadCUrrentFirestoreData = () => {
    doc.get()
        .then(handleCurrentCameraUpdate)
}

const onNewMediaFile = (path) => {
    if(path.includes('.log')){
        console.log('just a log file ... skipping')
        return
    }

    //upload to bucket
    console.log('uploading ',path, 'to', root.currRideId);
    //console.log()
}

const setupListeners = () => {
    //firestore camera doc changes
    doc.onSnapshot(handleCurrentCameraUpdate,
        (error) => { console.log("Error getting documents: ", error);})

    //media directory changes
    chokidar.watch('media/', {ignored: /(^|[\/\\])\../}).on('add', onNewMediaFile);
}

rideCleanUp();
loadCUrrentFirestoreData();
setupListeners();
