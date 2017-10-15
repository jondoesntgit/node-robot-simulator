var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var socketIO = require('socket.io');


port = 8080;
var robots  = {};
var particles = {};

min_x = -100
max_x = 100

min_y = -100
max_y = 100

var app = express();
var server = require('http').createServer(app);
var io = socketIO(server);
io.on('connection', function(){console.log('Connection')});
server.listen(port)

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
//app.use(express.logger('dev'))

/*
setInterval( ()=>{
    io.emit('move', {
        id: 10,
        x: Math.random()*30,
        y: Math.random()*30,
        s: 1000
    })
}, 2000)
*/

app.use(bodyParser.json());
app.use(express.static('public'));

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });


app.get("/", function(req, res){
    res.status(200).json(robots);
})

app.get("/robots", function(req, res){
    res.status(200).json(robots);
})

app.get("/view", function (req, res){
    res.render('svg', {})
});

app.get("/svg", function(req, res){
   html = '<svg width="640" height="480">'
   for (id in robots) {
     robot = robots[id]
     color = robot.color || 'white'
     name = robot.name || id
     html += '<line x1="' + (robot.x) + '" y1="' + (robot.y) +'" x2="' + (robot.x + 20*Math.cos(robot.angle))+ '" y2="' + (robot.y + 20*Math.sin(robot.angle)) + '" stroke-width="2" stroke="black" />'
     html += '<circle cx="' + (robot.x) + '" cy="' + (robot.y) +'" r="3" stroke="green" stroke-width="1" fill="' + color + '" />'
     html += '<text text-anchor="middle" x="' + (robot.x) + '" y="' + (robot.y - 5) +'">' + name + '</text>'
   }
   html += '</svg>'
   res.send(html)
})



/* ROBOT ENDPOINTS */

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

rotate = (id, angle, res) => {
    old_angle = robots[id].angle
    robots[id].angle += angle

    io.emit('rotate', {
        id: id,
        angle: robots[id].angle,
        s: 250
    })

    setTimeout(()=>{
        res.status(200).json(robots[id])
    },250)
}

app.get("/:id/init", function(req, res){
    id = req.params.id
    init(id)
    res.status(200).json(robots[id])
})


app.get(["/:id/left", "/:id/left/:angle"], function(req, res) {

    id = req.params.id 
    if (!(id in robots)){
        init(id)
        res.status(200).json(robots[id])
        return
    }
    angle = req.params.angle || Math.PI/4
    angle = parseFloat(angle)
    rotate(id, -angle, res)
})

app.get(["/:id/right" || "/:id/right/:angle"], function(req, res) {
    id = req.params.id 
    if (!(id in robots)){
        init(id)
        res.status(200).json(robots[id])
        return
    }
    angle = req.params.angle || Math.PI/4
    angle = parseFloat(angle)
    rotate(id, angle, res)
})

app.get("/:id/pickup", function(req, res){
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

    res.status(200).json(robots[id])
})

app.get(["/:id/forward/:distance", "/:id/forward"], function(req, res) {
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





setInterval(()=>{
    x = Math.random() * (max_x - min_x) + min_x
    y = Math.random() * (max_y - min_y) + min_y
    id = Date.now()
    particles[id] = {x: x, y: y}
    io.emit('particle', particles)
}, 5000)
