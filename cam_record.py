import sched, time, sys
import platform

def isPiCamera():
    return  platform.system().find("Darwin") <= -1

if isPiCamera():
    import picamera

print("startup." + str(platform.system()))
f = None
try:
    #todo: integrate this ride id into save routine
    ride = sys.argv[1]
    f = open("media/" + ride + ".log","w+")
except:
    print("an error occuried getting arg or opening file")

starttime=time.time()

def start_record():
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

#init
if isPiCamera():
    start_record()

#exit stuff
print("closing down")
if f != None:
    f.close()