var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var app = express();
app.use(bodyParser.json());

var robots  = {}


var server = app.listen( 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

app.get("/", function(req, res){
    res.status(200).json(robots);
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

app.get("/:id/forward", function(req, res) {
    id = req.params.id
    angle = robots[id].angle
    robots[id].x += Math.cos(angle)
    robots[id].y += Math.sin(angle)
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

