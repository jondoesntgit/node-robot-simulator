# A simple library wrapper for the robots API

import requests
import random
import json

port = 8080
url = 'http://localhost'
base = "%s:%s" % (url, port)

id = random.randint(1, 1000)
print("Robot ID: %i" % id)


def init(my_id=None):
    """Initiate a robot"""
    if not my_id:
        my_id = random.randint(1, 1000)

    id = my_id
    r = requests.get(base + '/robots/%i/init' % id)
    return json.loads(r.text)


def forward(distance=10):
    """Move the robot forward a small distance"""
    r = requests.get(base + '/robots/%i/forward/%f' % (id, distance))
    return json.loads(r.text)


def right(angle=90):
    """Rotate the robot right"""
    r = requests.get(base + '/robots/%i/right/%f' % (id, angle))
    return json.loads(r.text)


def left(angle=90):
    """Rotate the robot left"""
    r = requests.get(base + '/robots/%i/left/%f' % (id, angle))
    return json.loads(r.text)


def pickup():
    """Picks up any objects nearby"""
    r = requests.get(base + '/robots/%i/pickup' % (id))
    return json.loads(r.text)
