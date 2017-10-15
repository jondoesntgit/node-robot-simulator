var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var socketIO = require('socket.io');


port = 8080;
var robots  = {};
var particles = {};

// Screen size
min_x = -320
max_x = 320
min_y = -240
max_y = 240
margin = 20

max_particles = 100

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

app.get("/robots/:id/remove", function(req, res){
    id = req.params.id
    delete robots[id]
    io.emit('remove', {
        id: id
    })
    res.status(200).json(robots)
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
    if (robots[id].x > max_x - margin) {
        robots[id].x = max_x - margin
    }

    if (robots[id].x < min_x + margin) {
        robots[id].x = min_x + margin
    }

    if (robots[id].y > max_y - margin) {
        robots[id].y = max_y - margin
    }

    if (robots[id].y < min_y + margin) {
        robots[id].y = min_y + margin
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
        dx = robot.x - particle.x
        dy = robot.y - particle.y

        in_reach = (Math.sqrt(dx**2 + dy**2) < pickup_radius)
        console.log(in_reach)
        return in_reach
    }

    particles_to_remove = []
    points = 0
    for (id in particles){
        if (is_reachable(robots[robot_id], particles[id])){
            particles_to_remove.push(id)
            points += particles[id].score
        }
    }

    particlesAcquired = particles_to_remove.length

    particles_to_remove.forEach((id) => {
        delete particles[id]
    })

    oldScore = robots[robot_id].score
    newScore = oldScore + points
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
        res.status(200).json(robots[robot_id])
    }, 1500)
})

app.get("/robots/:id/color/:color", function(req, res){
    console.log('COLOR' + req.params.color)
    id = req.params.id
    color = req.params.color
    robots[id].color = color
    io.emit('color', {id: id, color: color})
    res.status(200).json(robots[id])
})

app.get("/robots/:id/name/:name", function(req, res){
    id = req.params.id
    name = req.params.name
    robots[id].name = name

    io.emit('name', {id: id, name: name})
    res.status(200).json(robots[id])
})

/***********************
  * PARTICLE ENDPOINTS *
  **********************/

// Return all existing particles
app.get("/particles", function(req, res){
    res.status(200).json(particles);
})



// Every few seconds, create a new particle
setInterval(()=>{
    if (Object.keys(particles).length >= max_particles){
        return
    }

    x = Math.random() * (max_x - min_x - 2*margin) + min_x + margin
    y = Math.random() * (max_y - min_y - 2*margin) + min_y + margin
    id = Date.now()
    rand = Math.random()
    if (rand < .4){
        color = 'black'
        score = 1
        radius = 1
    } else if (rand < .7) {
        color = 'green'
        score = 3
        radius = 2
    } else if (rand < .9) {
        color = 'blue'
        score = 5
        radius = 3
    } else {
        color = 'red'
        score = 10
        radius = 4
    }
    particles[id] = {x: x, y: y, color: color, score: score, radius: radius}
    io.emit('particle', particles)
}, 1000)
