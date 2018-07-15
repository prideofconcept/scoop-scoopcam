const spawn = require('child_process').spawn;

const child = spawn('python', ['cam_record.py', 'media/']);

setTimeout(function(){
    console.log('kill');
    child.kill();
}, 3000);
