import sched, time, sys

print("This line will be printed.")
#file stuff
save_location = sys.argv[0]
f= open("media/guru99.txt","w+")
starttime=time.time()

#sched
while True:
    print "tick"
    f.write("tick")
    time.sleep(2.0 - ((time.time() - starttime) % 2.0))

#exit stuff
f.close()