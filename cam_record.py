import sched, time, sys
import platform

def isPiCamera(): #todo https://stackoverflow.com/questions/14050281/how-to-check-if-a-python-module-exists-without-importing-it
    return  platform.machine().find("arm") >= 0

if isPiCamera():
    import picamera

print( "startup: " + str(platform.machine()) )

f = None
ride = None

try:
    #todo: integrate this ride id into save routine
    ride = sys.argv[1]

except:
    print("an error occuried getting arg")
    ride = "unkown_ride"

f = open("media/" + ride + ".log","w+") #todo try/catch here

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
else:
    fm = open("media/test.h264","w+")
    time.sleep(10)
    fm.write("test data")
    fm.close()

#exit stuff
print("closing down")
if f != None:
    f.close()