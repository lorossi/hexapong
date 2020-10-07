let g;
let font;
let y_offset, scl;
let paddle_delta;

let status = ["mainmenu", "game", "drawingwinner", "ending", "paused"];
let currentstatus = "game";

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent('gamecontainer');

  g = new Game();

  font = loadFont('js/FFFFORWA.ttf');

  y_offset = 0.6;
  scl = 0.7;
  paddle_delta = PI / 100;
}

function draw() {
  if (currentstatus == "game") {
    push();
    translate(width / 2, height * y_offset);
    scale(scl);
    translate(-width / 2, -height * y_offset);

    g.checkKeys();

    background(0);
    g.moveBall();
    g.checkCollision();

    g.drawBall();
    g.drawPaddles();

    g.accelerateBall();
    pop();

    g.drawScore();
    g.tick();

  } else if (currentstatus == "drawingwinner") {
    g.drawWinner();
  } else if (currentstatus == "ending") {
    g.resetTicks();
  }
}


class Game {
  constructor() {
    this.paddles = [];
    this.players = [];

    this.paddleNumber = 3;
    this.ticks = 0;
    this.maxScore = 5;
    this.speed = 3;
    this.acceleration = 0.7;

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

  checkKeys() {
      if (keyIsDown(65)) { // a
        this.movePaddle(0, -paddle_delta);
      } else if (keyIsDown(68)) { // d
        this.movePaddle(0, paddle_delta);
      }

      if (keyIsDown(74)) { // j
        this.movePaddle(1, -paddle_delta);
      } else if (keyIsDown(76)) { // l
        this.movePaddle(1, paddle_delta);
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
        p.dphi += dphi;

        if (p.dphi > TWO_PI) p.pdhi -= TWO_PI;
        if (p.dphi < 0) p.pdhi += TWO_PI;
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
        let paddle_angle = p.phi + p.dphi;
        while (paddle_angle > TWO_PI) paddle_angle -= TWO_PI;
        while (paddle_angle < 0) paddle_angle += TWO_PI;

        let ball_angle = this.ball.position.heading();
        while (ball_angle > TWO_PI) ball_angle -= TWO_PI;
        while (ball_angle < 0) ball_angle += TWO_PI;

        let delta = abs(paddle_angle - ball_angle);
        while (delta > TWO_PI) delta -= TWO_PI;
        while (delta < 0) delta += TWO_PI;

        if (delta < p.centerAngle) {
          let bounce_angle = PI - ball_angle + paddle_angle;
          this.ball.velocity.rotate(bounce_angle);

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

          if (p.score >= this.maxScore) {
            currentstatus = "drawingwinner";
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
    currentstatus = "drawingwinner";

    let winner;
    if (this.players[0].score > this.players[1].score) winner = this.players[0];
    else winner = this.players[1];

    this.players.forEach((p, i) => {
      p.resetScore();
    });

    let font_size = 48;

    push();

    rectMode(CORNER);
    noStroke();
    fill(0, 0, 0, 127);
    rect(0, 0, width, height);

    let winner_text = `Player ${winner.id + 1} wins!`
    textFont(font);
    textSize(font_size);
    fill(255);
    rectMode(CENTER);
    textAlign(CENTER);
    text(winner_text, width/2, height/2, width, 200);
    textSize(font_size / 2);
    text("click to continue", width/2, height/2 + 200, width, 200);
    pop();
    currentstatus = "ending";
  }

  tick() {
    this.ticks++;
  }

  resetTicks() {
    this.ticks = 0;
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
  if (currentstatus == "game") {
    /// REMOVE
  }
}

function mousePressed() {
  if (currentstatus == "ending") {
    currentstatus = "game";
  }
}
