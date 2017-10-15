var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var socketIO = require('socket.io');


port = 8080;
var robots  = {};
var particles = {};

// Screen size
min_x = -100
max_x = 100
min_y = -100
max_y = 100

// Initialize the server
var app = express();
var server = require('http').createServer(app);
var io = socketIO(server);
io.on('connection', function(){console.log('Connection')});
server.listen(port)

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.use(bodyParser.json());
app.use(express.static('public'));

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.get("/view", function (req, res){
    res.render('svg', {})
});

/********************
  * ROBOT ENDPOINTS *
  ********************/

// Create a new robot
init = (id) => {
    if (id in robots) {
        return
    }

    robot = {
        id: id,
        x: 0,
        y: 0,
        angle: 0,
        score: 0
    }
    robots[id] = robot
    io.emit('init', robot)
}

// Rotate an existing robot
rotate = (id, angle, res) => {
    old_angle = robots[id].angle
    robots[id].angle += angle
    ms = 250

    io.emit('rotate', {
        id: id,
        angle: robots[id].angle,
        s: ms
    })

    setTimeout(()=>{
        res.status(200).json(robots[id])
    }, ms)
}

// Return all existing robots
app.get("/robots", function(req, res){
    res.status(200).json(robots);
})

// Initiate a robot
app.get("/robots/:id/init", function(req, res){
    id = req.params.id
    init(id)
    res.status(200).json(robots[id])
})

// Rotate the robot left
app.get(["/robots/:id/left", "/robots/:id/left/:angle"], function(req, res) {
    id = req.params.id 
    if (!(id in robots)){
        init(id)
        res.status(200).json(robots[id])
        return
    }
    angle = req.params.angle || 90
    angle = parseFloat(angle) * Math.PI / 180
    rotate(id, -angle, res)
})

// Rotate the robot right
app.get(["/robots/:id/right", "/robots/:id/right/:angle"], function(req, res) {
    id = req.params.id 
    if (!(id in robots)){
        init(id)
        res.status(200).json(robots[id])
        return
    }
    angle = req.params.angle || 90
    angle = parseFloat(angle) * Math.PI / 180
    rotate(id, angle, res)
})

// Move an existing robot forward by :distance pixels
app.get(["/robots/:id/forward/:distance", "/robots/:id/forward"], function(req, res) {
    id = req.params.id
    if (!(id in robots)){
        init(id)
        res.status(200).json(robots[id])
        return
    }
    distance = req.params.distance || 10
    angle = robots[id].angle

    old_x = robots[id].x
    old_y = robots[id].y

    robots[id].x += Math.cos(angle) * distance
    robots[id].y += Math.sin(angle) * distance
    if (robots[id].x > 90) {
        robots[id].x = 90
    }

    if (robots[id].x < -90) {
        robots[id].x = -90
    }

    if (robots[id].y > 90) {
        robots[id].y = 90
    }

    if (robots[id].y < -90) {
        robots[id].y = -90
    }

    pixels_per_second = 100
    dx = old_x - robots[id].x
    dy = old_y - robots[id].y
    duration = 1000*Math.sqrt(dx**2 + dy**2)/pixels_per_second

    io.emit('move', {
        id : id,
        x: robots[id].x,
        y: robots[id].y,
        s: duration
    })

    setTimeout(()=>{
        res.status(200).json(robots[id])
    },duration)
})

// Pickup any nearby particles
app.get("/robots/:id/pickup", function(req, res){
    robot_id = req.params.id
    if (!(robot_id in robots)){
        init(robot_id)
        res.status(200).json(robots[robot_id])
        return
    }
    pickup_radius = 30

    function is_reachable(robot, particle){
        if (!particle) return (false)
        console.log('Removing particles')
        console.log(robot)
        console.log(particle)
        dx = robot.x - particle.x
        dy = robot.y - particle.y

        in_reach = (Math.sqrt(dx**2 + dy**2) < pickup_radius)
        console.log(in_reach)
        return in_reach
    }

    particles_to_remove = []
    for (id in particles){
        if (is_reachable(robots[robot_id], particles[id])){
            particles_to_remove.push(id)
        }
    }

    particlesAcquired = particles_to_remove.length

    particles_to_remove.forEach((id) => {
        console.log('Removing' + id)
        delete particles[id]
    })

    oldScore = robots[robot_id].score
    newScore = oldScore + particlesAcquired
    robots[robot_id].score = newScore


    io.emit('pickup', {
        id: robot_id,
        newScore: newScore
    })

    setTimeout(()=>{
        for (particle_id in particles){
            if (is_reachable(particles[particle_id], robots[id])){
                delete particles[particle_id]
            }
        }
        io.emit('particle', particles)
    },1000)

    setTimeout(()=>{
        res.status(200).json(robots[id])
    }, 1500)
})


// Every few seconds, create a new particle
setInterval(()=>{
    x = Math.random() * (max_x - min_x) + min_x
    y = Math.random() * (max_y - min_y) + min_y
    id = Date.now()
    particles[id] = {x: x, y: y}
    io.emit('particle', particles)
}, 5000)
