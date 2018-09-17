const spawn = require('child_process').spawn;
const firebase = require("firebase");
const googleStorage = require('@google-cloud/storage');
const admin = require('firebase-admin');

const chokidar = require('chokidar');
const rimraf = require('rimraf');

let child = null;
const serviceAccount = require('./key/serviceAccount.json');

const camera_id = process.env.CAM || 'scoopcamx'
console.log('setup - cameraname',camera_id)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const storage = new googleStorage({
    projectId: 'yetigo-3b1de',
    keyFilename: './key/serviceAccount.json'
});

const db = admin.firestore();
const doc = db.collection('camera').doc(camera_id); // todo: should the collections be exported from the firebase module
const doc_hb = db.collection('camera').doc(`${camera_id}_heartbeat`); // todo: should the collections be exported from the firebase module

const root = {
    isCameraOn: false,
    currRideId: null,
    bucket : null,
    tickLimit: 0,
}

const rideCleanUp = () => {
    rimraf('media/*', function() {console.log('...clean, ready.')})
}
const handleCurrentCameraUpdate = (docSnapshot) => {
    //console.log(docSnapshot.id, '=>', docSnapshot.data());

    const data = docSnapshot.data();

    root.isOnRide = data ? data.onRide : false;
    root.currRideId = data ? data.currRide : null; //todo - if isOnRide == true; and data.currRide is falsey - lets default to a unkownRideDateTime ride ID
    root.bucket = storage.bucket(`yetigo-3b1de.appspot.com`);

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
    if(!path.includes('h264') || !root.isOnRide){return}

    const path_splits = path.split('/')
    const filename = path_splits[path_splits.length - 1]
    //upload to bucket
    const uploadOpts = {
        metadata : { contentType: 'video/h264'},
        destination: `live_ride_videos/${root.currRideId}/${filename}`
    };

    console.log('^ ',path, ' -> ', root.currRideId);
    root.bucket.upload(`${path}`,uploadOpts, function(err, file) {
        if (err) {
            console.log('errr', err)
            return
        }
        console.log('.',file.name)

    });
}

const sendHeartbeat = () => {
    root.tickLimit = root.tickLimit + 1;
    doc_hb.set({heartbeat: + new Date()},{merge: true})

    if(root.tickLimit >= 5) {
        console.log(',')
        root.tickLimit = 0
    }
}

const setupListeners = () => {
    //firestore camera doc changes
    doc.onSnapshot(handleCurrentCameraUpdate,
        (error) => { console.log("Error getting documents: ", error);})

    //media directory changes
    chokidar.watch('media/', {
        ignored: /(^|[\/\\])\../,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 3000,
            pollInterval: 1000
            }
        })
    .on('add', onNewMediaFile);

    //setup heartbeat
    sendHeartbeat()
    setInterval(sendHeartbeat, 300000); //5min
}

rideCleanUp();
//loadCUrrentFirestoreData();
setupListeners();
