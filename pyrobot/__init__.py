# A simple library wrapper for the robots API

import requests
import random
import json

port = 8080
url = 'http://localhost'
base = "%s:%s" % (url, port)

robot_id = random.randint(1, 1000)
print("Robot ID: %i" % robot_id)


def init():
    """Initiate a robot"""
    global robot_id
    if not robot_id:
        robot_id = random.randint(1, 1000)
    r = requests.get(base + '/robots/%i/init' % robot_id)
    return json.loads(r.text)


def forward(distance=10):
    """Move the robot forward a small distance"""
    requests.get(base + '/robots/%i/forward/%f' % (robot_id, distance))


def right(angle=90):
    """Rotate the robot right"""
    requests.get(base + '/robots/%i/right/%f' % (robot_id, angle))


def left(angle=90):
    """Rotate the robot left"""
    requests.get(base + '/robots/%i/left/%f' % (robot_id, angle))


def pickup():
    """Picks up any objects nearby"""
    requests.get(base + '/robots/%i/pickup' % (robot_id))


def name(name):
    """Renames the robot"""
    requests.get(base + '/robots/%i/name/%s' % (robot_id, name))


def color(color):
    """Gives the robot a color"""
    requests.get(base + '/robots/%i/color/%s' % (robot_id, color))


def particles():
    """Gets a list of all of the particles"""
    r = requests.get(base + '/particles')
    return json.loads(r.text)
