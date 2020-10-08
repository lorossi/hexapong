let g;
let font;
let y_offset, scl;
let paddle_delta;

// FSM to control the current game status
let status = ["mainmenu", "game", "drawingwinner", "ending", "paused"]; // list of available statuses
let current_status;
let next_status = "mainmenu";

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent('gamecontainer');

  g = new Game();

  font = loadFont('js/FFFFORWA.ttf');

  y_offset = 0.6; // vertical game offset
  scl = 0.7; // game drawing scale
  paddle_delta = PI / 100; // paddle movement when the button is pressed
}

function draw() {
  current_status = next_status; // update status

  if (current_status == "mainmenu") {
    g.drawMenu();
  } else if (current_status == "game") {
    // SCALING
    push();
    translate(width / 2, height * y_offset);
    scale(scl);
    translate(-width / 2, -height * y_offset);

    // check if paddle keys are pressed
    g.checkKeys();

    background(0);
    g.moveBall();

    // check ball collision with paddles
    g.checkCollision();

    g.drawBall();
    g.drawPaddles();

    g.accelerateBall();
    pop();

    // draw player scores
    g.drawScore();
    // tick to keep track of time
    g.tick();

  } else if (current_status == "drawingwinner") {
    g.drawWinner();
  } else if (current_status == "ending") {
    g.resetTicks();
  }
}


class Game {
  constructor() {
    this.paddles = [];
    this.players = [];

    this.paddleNumber = 3; // number of paddles for each players
    this.ticks = 0; // keeps time
    this.maxScore = 5; // max score before game over
    this.speed = 3; // ball speed
    this.acceleration = 0.7; // ball acceleration

    this.ball = new Ball(width / 100, "#ffffff", this.speed, this.acceleration);

    let colors = ["#ff0000", "#0000ff"]; // red and blue
    for (let i = 0; i < 2; i++) {
      this.players.push(
        new Player(i, colors[i], i == 0, this.paddleNumber)
      );
    }

    for (let i = 0; i < this.paddleNumber * 2; i++) {
      let player = this.players[i % 2]; // either 0 or 1
      let phi = (i % 2) * PI; // either 0 or PI
      let displacement = TWO_PI / (this.paddleNumber) * Math.floor(i / 2); // paddles angular spacing
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
    translate(width / 2, height / 2); // relative to the center of the canvas

    this.paddles.forEach((p, i) => {
      let alpha = p.player.active ? "ff" : "40"; // if player is active, the color is more opaque

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

        // angle periodicity
        if (p.dphi > TWO_PI) p.pdhi -= TWO_PI;
        if (p.dphi < 0) p.pdhi += TWO_PI;
      }
    });
  }

  drawBall() {
    let fill_color;

    this.players.forEach((p) => {
      if (p.active) {
        fill_color = p.color; // ball color is the same as the active player
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
              p.active = !p.active; // switch active players
            });

            found = true; // the ball has bounced
            return;
          }
      }
      });
    }

    if (!found && distance  > sqrt(2) * this.paddles[0].distance) {
      // the ball is now too far
      this.ball.resetPosition(); // reset ball position
      this.ball.resetVelocity(); // reset ball velocity

      this.players.forEach((p) => {
        if (!p.active) { // if the player is not active, he has scored
          p.score++;

          if (p.score >= this.maxScore) { // if his score is higher than the threshold, he won
            current_status = "drawingwinner"; // chang status to score screen
          }
        }
        p.active = !p.active; //switch activity status
      });

    }
  }

  drawMenu() {
    current_status = "mainmenu";
    let font_size = 64;

    push();
    background(0);
    rectMode(CORNER);
    noStroke();

    textFont(font);
    textSize(font_size);
    fill(255);
    rectMode(CENTER);
    textAlign(CENTER);
    text("HEXAPONG", width/2, height/2, width, 200);

    textSize(font_size / 3);
    text("click to start", width/2, height/2 + 250, width, 200);
    pop();
  }

  drawScore() {
    let font_size = 48;
    let tx = width / 2 - font_size / 2 * 2.5 + font_size / 4;
    let ty = height / 10;

    push();
    noStroke();
    textFont(font);
    textSize(font_size);

    fill(this.players[0].color);
    text(this.players[0].score, tx, ty);

    fill(255);
    text(":", tx + font_size, ty);

    fill(this.players[1].color);
    text(this.players[1].score, tx + font_size * 1.5, ty);

    pop();
  }

  drawWinner() {
    current_status = "drawingwinner";

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
    current_status = "ending";
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
    this.pheight = size; // paddle height
    this.pwidth = size / 20; // paddle width
    this.distance = distance;
    this.phi = phi;

    this.centerAngle = asin(this.pheight / (this.distance * 2)); // teorema della corda
    this.dphi = 0; // angle determined by player movement
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

function mousePressed() {
  if (current_status == "mainmenu") {
    next_status = "game";
  }
  else if (current_status == "ending") {
    next_status = "game";
  }
}
