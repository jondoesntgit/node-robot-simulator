var socket = io('/');
var s = Snap("#svg", 800, 600)

var robots = {}

vectorLength = 30

var bigCircle = s.circle(150, 150, 10);

bigCircle.attr({
    fill: "#bada55",
    stroke: "#000",
    strokeWidth: 5
})

var head = s.circle(100, 150, 10);
var vector = s.line(100, 150, 180, 150);

robots[10] = {
    head: head,
    vector: vector,
    angle: 0
}

function moveRobot(id, x, y, s) {
    r = robots[id]
    r.x = x
    r.y = y
    angle = r.angle

    robots[id].head.animate({cx: x, cy: y}, s)
    robots[id].vector.animate({
        x1: x, 
        y1: y, 
        x2: x + vectorLength * Math.cos(angle), 
        y2: y + vectorLength * Math.sin(angle) 
    }, s)
}

function rotateRobot(id, angle) {
    r = robots[id]
    r.angle += angle
    angle = r.angle
    x = r.x
    y = r.y
    robots[id].vector.animate({
        x1: x, 
        y1: y, 
        x2: x + vectorLength * Math.cos(angle), 
        y2: y + vectorLength * Math.sin(angle) 
    }, 1000)
}

/*
socket.on('move', function (data) {
    id = data.id
    x = data.x
    y = data.y
    console.log(`Robot ${id} is moving to (${x}, ${y})`);
    smallCircle.animate({cx: x, cy: y}, 1000)
});
*/