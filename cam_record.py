import sched, time, sys
import picamera

print("This line will be printed.")
f= open("media/log.txt","w+")
starttime=time.time()

#todo: integrate this ride id into save routine
ride = sys.argv[1]

#init
with picamera.PiCamera() as camera:
    camera.resolution = (800, 600)
    camera.framerate = 24
    i = 1
    camera.start_recording('media/%d.h264' % i)

    #sched
    while True:
        print "tick"
        i = i+1
        camera.wait_recording(10)
        camera.split_recording('media/%d.h264' % i)

#exit stuff
f.close()