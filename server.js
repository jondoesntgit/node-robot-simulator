var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var mustacheExpress = require('mustache-express');

port = 8080;

var app = express();

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());
app.use(express.static('public'));

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });


var robots  = {}


var server = app.listen(port, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

app.get("/", function(req, res){
    res.status(200).json(robots);
})

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

app.get("/id/left", function(req, res) {
    id = req.params.id
    robots[id].angle += Math.pi/4
    res.status(200).json(robots[id])
})

app.get("/:id/right", function(req, res) {
    id = req.params.id 
    robots[id].angle -= Math.pi/4
    res.status(200).json(robots[id])
})

app.get("/:id/forward/:distance", function(req, res) {
    id = req.params.id
    distance = req.params.distance || 10
    angle = robots[id].angle
    robots[id].x += Math.cos(angle) * distance
    robots[id].y += Math.sin(angle) * distance
    if (robots[id].x > 620) {
        robots[id].x = 620
    }

    if (robots[id].x < 20) {
        robots[id].x = 20
    }

    if (robots[id].y > 460) {
        robots[id].y = 460
    }

    if (robots[id].y < 20) {
        robots[id].y = 20
    }

    res.status(200).json(robots[id])
})

app.get("/:id/init", function(req, res){
    id = req.params.id
    robots[id] = {
        x: 0,
        y: 0,
        angle: 0
    }
    res.status(200).json(robots[id])
})

