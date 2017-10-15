var socket = io('/');
var s = Snap("#svg")


vectorLength = 30
robot_radius = 5
pickup_radius = 30
var robots = {}
var particles = {}
particleRadius = 2
textOffset = -10


createRobot = (id, robot) => {
    robots[id] = robot
    robots[id].head = s.circle(robot.x, robot.y, robot_radius);
    robots[id].vector = s.line(robot.x, robot.y, robot.x + vectorLength * Math.cos(robot.angle), robot.y + vectorLength * Math.sin(robot.angle));   
    robots[id].label = s.text(robot.x, robot.y + textOffset, `${id}: ${robot.score}`).attr({"text-anchor": "middle"})
}


moveRobot = (id, x, y, ms) => {
    r = robots[id]
    r.x = x
    r.y = y
    angle = r.angle

    robots[id].head.animate({cx: x, cy: y}, ms)
    robots[id].label.animate({x: x, y: y + textOffset}, ms)
    robots[id].vector.animate({
        x1: x, 
        y1: y, 
        x2: x + vectorLength * Math.cos(angle), 
        y2: y + vectorLength * Math.sin(angle) 
    }, ms)
}

rotateRobot = (id, angle, ms) => {
    r = robots[id]
    r.angle = angle
    x = r.x
    y = r.y
    robots[id].vector.animate({
        x1: x, 
        y1: y, 
        x2: x + vectorLength * Math.cos(angle), 
        y2: y + vectorLength * Math.sin(angle) 
    }, ms)
}

createParticle = (id, data) => {
    x = data.x
    y = data.y
    particles[id]= s.circle(x, y, particleRadius)
}

removeParticle = (id) => {
    particles[id].remove()
    delete particles[id]
}

// Start by loading all robots

$.get('/robots', (robots_data) => {
    for (id in robots_data) {
        createRobot(id, robots_data[id])
        robot = robots_data[id]   
    }
})

/*************************
  * Define Socket Events *
  *************************/

// When we hear that a robot is being initiated
socket.on('init', (data) => {
    createRobot(data.id, data)
})

// When we hear that a robot is moving...
socket.on('move', function (data) {
    id = data.id
    x = data.x
    y = data.y
    ms = data.s
    console.log(`Robot ${id} is moving to (${x}, ${y})`);
    moveRobot(id, x, y, ms)
});

// When we hear that a robot is rotating...
socket.on('rotate', function (data) {
    id = data.id
    angle = data.angle
    ms = data.s
    console.log(`Robot ${id} is rotating to (${angle})`);
    rotateRobot(id, angle, ms)
});

// When we hear that a robot is picking up stuff near it...
socket.on('pickup', function(data){
    robot = robots[data.id]
    x = robot.x
    y = robot.y
    pickupCircle = s.circle(x, y, 0).attr({
        color: '#F00'
    })
    pickupCircle.animate({r: pickup_radius}, 400)
    setTimeout(() => {
        pickupCircle.animate({r: 0}, 400)
        robot.score = data.newScore
        robot.label.attr({text: `${robot.id}: ${robot.score}`})
    }, 1000)
    setTimeout(() => {
        pickupCircle.remove()
    }, 1400)
})

// When we hear that a new particle is being added
socket.on('particle', (data) => {
    for (id in data) {
        if (id in particles) {continue}
        createParticle(id, data[id])
    }

    for (id in particles) {
        if (id in data) {continue}
        removeParticle(id)
    }
})