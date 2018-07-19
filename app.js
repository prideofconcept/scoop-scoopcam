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

//loadCUrrentFirestoreData()
setupListeners();

function loadCUrrentFirestoreData() {
    doc.get()
        .then(handleCameraUpdate)
}

function setupListeners(){
    doc.onSnapshot(handleCameraUpdate,
            (error) => { console.log("Error getting documents: ", error);})
}

function handleCameraUpdate(docSnapshot){
    //console.log(docSnapshot.id, '=>', docSnapshot.data());
    const data = docSnapshot.data()
    if(data.onRide) {
        console.log('we are on ride')
        child = spawn('python', ['cam_record.py', 'media/']);
    } else {
        console.log('turning off camera')
        if(child){
            child.kill();
        }
    }
}
/*
setTimeout(function(){
    console.log('kill');

}, 3000);*/
