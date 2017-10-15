# A simple library wrapper for the robots API

import requests
import random
import json

port = 8080
url = 'http://localhost'
base = "%s:%s" % (url, port)

robot_id = random.randint(1, 1000)
print("Robot ID: %i" % robot_id)


def init(my_id=None):
    """Initiate a robot"""
    global robot_id
    if not my_id:
        my_id = random.randint(1, 1000)


    robot_id = my_id
    r = requests.get(base + '/robots/%i/init' % robot_id)
    return json.loads(r.text)


def forward(distance=10):
    """Move the robot forward a small distance"""
    global robot_id
    r = requests.get(base + '/robots/%i/forward/%f' % (robot_id, distance))
    return json.loads(r.text)


def right(angle=90):
    """Rotate the robot right"""
    global robot_id
    r = requests.get(base + '/robots/%i/right/%f' % (robot_id, angle))
    return json.loads(r.text)


def left(angle=90):
    """Rotate the robot left"""
    global robot_id
    r = requests.get(base + '/robots/%i/left/%f' % (robot_id, angle))
    return json.loads(r.text)


def pickup():
    """Picks up any objects nearby"""
    global robot_id
    r = requests.get(base + '/robots/%i/pickup' % (robot_id))
    print(r.text)
    return json.loads(r.text)


def particles():
    """Gets a list of all of the particles"""
    r = requests.get(base + '/particles')
    return json.loads(r.particles)
