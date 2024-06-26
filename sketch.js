let handPose;
let video;
let hands = [];

let particles = [];

function preload() {
    // Load the handPose model
    handPose = ml5.handPose();
}

var canvas; // Declare canvas variable

function setup() {
    // Create a canvas with 70% of the window width and 100% of the window height
    canvas = createCanvas(windowWidth * 0.7, windowHeight);
    canvas.parent('canvasContainer'); // Attach the canvas to the left div

    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
    // start detecting hands from the webcam video
    handPose.detectStart(video, gotHands);

    // Initialize particles
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle(random(width), random(height)));
    }
}

function draw() {
    background(0);
    push();
    scale(-1, 1);
    pop();

    // Draw particles
    for (let particle of particles) {
        particle.applyBehaviors(particles);
        particle.update();
        particle.show();
    }

    // Draw red triangle at hand position
    if (hands.length > 0) {
        let hand = hands[0];
        let controlX = hand.middle_finger_pip.x;
        let controlY = hand.middle_finger_pip.y;
        // drawHandIndicator(width - controlX, controlY);
    }
}

// Callback function for when handPose outputs data
function gotHands(results) {
    // save the output to the hands variable
    hands = results;
}

// Adjust the canvas size when the window is resized
function windowResized() {
    resizeCanvas(windowWidth * 0.7, windowHeight);
}

// Draw a red triangle at the specified position
function drawHandIndicator(x, y) {
    push();
    translate(x, y);
    fill('red');
    stroke('red');
    beginShape();
    vertex(0, -10);
    vertex(-10, 10);
    vertex(10, 10);
    endShape(CLOSE);
    pop();
}

// Particle class
class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector();
        this.maxSpeed = 2;
        this.maxForce = 0.1;
        this.r = 6; // radius for the triangle
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading() + PI / 2);
        fill(255);
        stroke(255);
        beginShape();
        vertex(0, -this.r * 2);
        vertex(-this.r, this.r * 2);
        vertex(this.r, this.r * 2);
        endShape(CLOSE);
        pop();
    }

    applyBehaviors(particles) {
        let separateForce = this.separate(particles);
        this.applyForce(separateForce);

        if (hands.length > 0) {
            let hand = hands[0];
            let controlX = hand.middle_finger_pip.x;
            let controlY = hand.middle_finger_pip.y;
            let handPos = createVector(width - controlX, controlY);
            let steerForce = this.steer(handPos);
            this.applyForce(steerForce);
        }
    }

    steer(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    separate(particles) {
        let desiredSeparation = 40;
        let steer = createVector();
        let count = 0;

        for (let other of particles) {
            let d = p5.Vector.dist(this.pos, other.pos);
            if ((d > 0) && (d < desiredSeparation)) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.div(count);
        }

        if (steer.mag() > 0) {
            steer.setMag(this.maxSpeed);
            steer.sub(this.vel);
            steer.limit(this.maxForce);
        }

        return steer;
    }

    applyForce(force) {
        this.acc.add(force);
    }
}
