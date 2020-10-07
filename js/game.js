let g;
let font;
let yOffset, scl;

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent('gamecontainer');

  g = new Game();

  font = loadFont('../assets/FFFFORWA.TTF');

  yOffset = 0.6;
  scl = 0.7;
}

function draw() {
  push();
  translate(width / 2, height * yOffset);
  scale(scl);
  translate(-width / 2, -height * yOffset);

  background(0);
  g.moveBall();
  g.checkCollision();

  g.drawBall();
  g.drawPaddles();

  g.accelerateBall();

  pop();

  g.drawScore();

  g.tick();
}


class Game {
  constructor() {
    this.paddles = [];
    this.players = [];

    this.paddleNumber = 3;
    this.ticks = 0;
    this.maxScore = 3;
    this.speed = 3;
    this.acceleration = 0.3;

    this.ball = new Ball(width / 100, "#ffffff", this.speed, this.acceleration);

    let colors = ["#ff0000", "#0000ff"];
    for (let i = 0; i < 2; i++) {
      this.players.push(
        new Player(i, colors[i], i == 0, this.paddleNumber)
      );
    }

    for (let i = 0; i < this.paddleNumber * 2; i++) {
      let player = this.players[i % 2];
      let phi = (i % 2) * PI;
      let displacement = TWO_PI / (this.paddleNumber) * Math.floor(i / 2);
      this.paddles.push(
        new Paddle(player, width / 5, width / 2, phi + displacement)
      );
    }

  }

  drawPaddles() {
    push();
    translate(width / 2, height / 2);

    this.paddles.forEach((p, i) => {
      let alpha = p.player.active ? "ff" : "40";
      push();
      rectMode(CENTER);
      rotate(p.phi + p.dphi);
      translate(p.distance, 0);
      fill(p.player.color + alpha);
      noStroke();
      rect(0, 0, p.pwidth, p.pheight);
      pop();
    });

    pop();

  }

  movePaddle(player, dphi) {
    this.paddles.forEach((p, i) => {
      if (p.player.id == player) {
        p.dphi = dphi;
      }
    });
  }

  drawBall() {
    let fill_color;

    this.players.forEach((p) => {
      if (p.active) {
        fill_color = p.color;
        return;
      }
    });

    push();
    translate(width / 2, height / 2);
    noStroke();
    fill(fill_color);
    translate(this.ball.position.x, this.ball.position.y);
    circle(0, 0, this.ball.size * 2);
    pop();
  }

  moveBall() {
    this.ball.position.add(this.ball.velocity);
    //this.ball.velocity.mult(this.speedMult);
  }

  accelerateBall() {
    this.ball.accelerate();
  }

  checkCollision() {
    let found = false;
    let distance = this.ball.position.mag() + this.ball.speed + this.ball.size / 2;
    if (distance > this.paddles[0].distance && distance < this.paddles[0].distance + this.paddles[0].pwidth * 2) {

      this.paddles.forEach((p) => {
        if (p.player.active) {
        let paddleAngle = p.phi + p.dphi;
        while (paddleAngle > TWO_PI) paddleAngle -= TWO_PI;
        while (paddleAngle < 0) paddleAngle += TWO_PI;

        let ballAngle = this.ball.position.heading();
        while (ballAngle > TWO_PI) ballAngle -= TWO_PI;
        while (ballAngle < 0) ballAngle += TWO_PI;

        let delta = abs(paddleAngle - ballAngle);
        while (delta > TWO_PI) delta -= TWO_PI;
        while (delta < 0) delta += TWO_PI;


        if (delta < p.centerAngle) {
          let bounceAngle = PI - (ballAngle - paddleAngle);
          this.ball.velocity.rotate(bounceAngle);

          this.players.forEach((p, i) => {
            p.active = !p.active;
          });

          found = true;
          return;
        }
      }
      });
    }

    if (!found && distance  > sqrt(2) * this.paddles[0].distance) {
      this.ball.resetPosition();
      this.ball.resetVelocity();

      this.players.forEach((p) => {
        if (!p.active) {
          p.score++;

          if (p.score > this.maxScore) {
            this.drawWinner();
          }
        }
        p.active = !p.active;
      });

    }
  }

  drawScore() {
    let fontSize = 48;
    let tx = width / 2 - fontSize / 2 * 2.5 + fontSize / 4;
    let ty = height / 10;

    push();
    noStroke();
    textFont(font);
    textSize(fontSize);

    fill(this.players[0].color);
    text(this.players[0].score, tx, ty);

    fill(255);
    text(":", tx + fontSize, ty);

    fill(this.players[1].color);
    text(this.players[1].score, tx + fontSize * 1.5, ty);

    pop();
  }

  drawWinner() {
    let higher_score;
    if (this.players[0].score > this.players[1].score) higher_score = this.players[0].score;
    else higher_score = this.players[1].score;

    this.players.forEach((p, i) => {
      p.resetScore();
    });
  }

  tick() {
    this.ticks++;
  }
}

class Ball {
  constructor(size, color, speed, acceleration) {
    this.size = size;
    this.color = color;
    this.speed = speed;

    this.position = createVector(0, 0);
    this.velocity = createVector(this.speed, 0).rotate(random(TWO_PI));
    this.acceleration = createVector(acceleration, 0);
  }

  resetVelocity() {
    this.velocity = createVector(this.speed, 0).rotate(random(TWO_PI));
  }

  resetPosition() {
    this.position.mult(0);
  }

  accelerate() {
    this.acceleration.rotate(this.velocity.heading());
    this.velocity.add(this.acceleration);
  }
}

class Paddle {
  constructor(player, size, distance, phi) {
    this.player = player;
    this.pheight = size; //paddle height
    this.pwidth = size / 20;
    this.distance = distance;
    this.phi = phi;

    this.centerAngle = asin(this.pheight / (this.distance * 2)); //teorema della corda
    this.dphi = 0;
  }
}

class Player {
  constructor(id, color, active, paddles) {
    this.id = id;
    this.color = color;
    this.active = active;
    this.paddleNumber = paddles;

    this.score = 0;
  }

  resetScore() {
    this.score = 0;
  }
}


function mouseMoved() {
  let dphi;
  let maxDelta = PI / 4;

  let x, y;

  x = mouseX;
  if (x < 0) x = 0;
  else if (x > width) x = width;

  y = mouseY;
  if (y < 0) y = 0;
  else if (y > width) y = width;

  dphi = map(x, 0, width, -maxDelta, maxDelta);
  g.movePaddle(0, dphi);

  dphi = map(y, 0, width, -maxDelta, maxDelta);
  g.movePaddle(1, dphi);
}
