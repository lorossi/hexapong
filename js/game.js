let g;
let font;
let y_offset, scl;
let paddle_delta;

// FSM to control the current game status
let status = ["mainmenu", "countdown", "game", "drawingwinner", "ending", "paused"]; // list of available statuses
let current_status;
let next_status = "mainmenu";

function setup() {
  let canvas = createCanvas(800, 800);
  canvas.parent('gamecontainer');

  font = loadFont('js/FFFFORWA.ttf');
  y_offset = 0.6; // vertical game offset
  scl = 0.7; // game drawing scale
  paddle_delta = PI / 100; // paddle movement when the button is pressed

  g = new Game();
}

function draw() {
  if (current_status != next_status) {
    current_status = next_status; // update status
    g.resetTicks();
    g.resetAnimations();
    g.resetButtons();
  }

  if (current_status == "mainmenu") {
    g.drawMenu();
    g.drawVersion();
  } else if (current_status == "countdown") {
    background(0);

    g.drawScore();

    push();
    translate(width / 2, height * y_offset);
    scale(scl);
    translate(-width / 2, -height * y_offset);

    g.drawBall();
    g.drawPaddles();
    g.drawCountdown();
    pop();
  } else if (current_status == "game") {
    // SCALING
    push();
    translate(width / 2, height * y_offset);
    scale(scl);
    translate(-width / 2, -height * y_offset);
    background(0);

    g.drawBall();
    g.drawPaddles();
    pop();

    // check if paddle keys are pressed
    g.checkKeys();
    g.moveBall();

    // check ball collision with paddles
    g.checkCollision();
    g.accelerateBall();

    // shrink paddles
    g.updatePaddles();

    // draw player scores
    g.drawScore();

  } else if (current_status == "drawingwinner") {
    g.drawWinner();
  } else if (current_status == "ending") {
    // ...
  }

  // tick at every frame to keep track of time
  g.tick();
}


class Game {
  constructor() {
    this.version = "alpha-1.0.5"
    this.seed = random(1000000); // used for randomization
    this.paddles = [];
    this.players = [];
    this.animations = [];
    this.buttons = [];
    this.colorpalette = ["#ff0000", "#0000ff"]; // red and blue

    this.paddleNumber = 3; // number of paddles for each players
    this.ticks = 0; // keeps time
    this.maxScore = 5; // max score before game over
    this.speed = 1.5; // ball speed
    this.acceleration = 0.02; // ball acceleration

    this.ball = new Ball(width / 100, "#ffffff", this.speed, this.acceleration);

    for (let i = 0; i < 2; i++) {
      this.players.push(
        new Player(i, this.colorpalette[i], i == 0, this.paddleNumber)
      );
    }

    for (let i = 0; i < this.paddleNumber * 2; i++) {
      let player = this.players[i % 2]; // either 0 or 1
      let phi = (i % 2) * PI; // either 0 or PI
      let displacement = TWO_PI / (this.paddleNumber) * Math.floor(i / 2); // paddles angular spacing
      let distance = width / 2 * (1 - .05 * (i % 2)); // either .5 or .4
      this.paddles.push(
        new Paddle(player, width * .4, width * .013, distance, phi + displacement)
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

  updatePaddles() {
    this.paddles.forEach((p, i) => {
      p.updatePaddle();
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
    this.ball.accelerate(this.ticks);
  }

  checkCollision() {
    let found = false;
    let distance = this.ball.position.mag() + this.ball.speed + this.ball.size / 2;

    let paddle_distance; // find active paddle distance
    this.paddles.forEach((p, i) => {
      if (p.player.active) {
          paddle_distance = p.distance;
      }
      return;
    });

    if (distance > paddle_distance && distance < paddle_distance + this.paddles[0].pwidth * 2) {
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

          let next_position = this.ball.position.copy().add(this.ball.velocity); // used to check that the ball is moving away from the target

          if (delta < p.centerAngle && this.ball.position.mag() < next_position.mag()) {
            // the ball is inside the paddle
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

    if (!found && distance  > sqrt(2) * paddle_distance * (1 / scl)) {
      // the ball is now too far
      this.ball.resetPosition(); // reset ball position
      this.ball.resetVelocity(); // reset ball velocity

      this.players.forEach((p) => {
        if (!p.active) { // if the player is not active, he has scored
          p.score++;

          if (p.score >= this.maxScore) { // if his score is higher than the threshold, he won
            next_status = "drawingwinner"; // chang status to score screen
          }
        }
        p.active = !p.active; //switch activity status
      });

      this.paddles.forEach((p) => {
        p.resetPaddles();
      });

      if (next_status != "drawingwinner") { // if the winner has not been chosen
        next_status = "countdown"; // ball countdown
      }
    }
  }

  drawVersion() {
    let text_size = 16;

    push();
    textFont(font);
    textSize(text_size);
    fill(255, 50);
    rectMode(CORNER);
    textAlign(LEFT);
    text(this.version, text_size, text_size, 40, 40);
    pop();
  }

  drawMenu() {
    next_status = "mainmenu";
    let text_size = 64;
    let button_size = 32;

    if (this.animations.length == 0) { // no animations, it's the first iteration of the menu
      for (let i = 0; i < 50; i++) {
        this.animations.push(
          new Animation("ball", 20 * 60, this.seed)
        );
      }
    }

    if (this.buttons.length == 0) {
      let text, id;
      text = "1 player";
      id = "1player"
      this.buttons.push(
        new Button(width * 2/7, 3/4 * height, button_size * 6, button_size * 2.5, text, id, "#ffffffc8", button_size, this.colorpalette[0], this.colorpalette[1], true)
      );

      text = "2 players";
      id = "2players"
      this.buttons.push(
        new Button(width * 5/7, 3/4 * height, button_size * 7, button_size * 2.5, text, id, "#ffffffc8", button_size, this.colorpalette[0], this.colorpalette[1], false)
      );
    }

    let text_rotation = sin(2 * PI * 0.005 * this.ticks + this.seed) * PI / 20;
    let text_zoom = map(sin(2 * PI * 0.007 * this.ticks + this.seed * 4), -1, 1, 0.7, 1.3);

    push();
    background(0);
    noStroke();
    textFont(font);
    fill(255, 200);
    rectMode(CENTER);
    textAlign(CENTER);

    push();
    textSize(text_size);
    translate(width/2, height/2 * .85);
    rotate(text_rotation);
    scale(text_zoom);
    text("HEXAPONG", 0, 0, width, 200);
    pop();

    // run animations
    this.animations.forEach((a, i) => {
      a.show();
      a.update();
    });

    // show buttons
    this.buttons.forEach((b, i) => {
      b.show();
      b.animate();
    });

    pop();
  }

  drawCountdown() {
    let seconds = 3 - Math.floor(g.ticks / 30);
    let text_size = 96;

    if (seconds == 0) {
      next_status = "game";
      return;
    }

    push();
    noStroke();
    textFont(font);
    textSize(text_size);
    fill(255, 200);
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    translate(width/2, height/2);
    text(seconds, 0, 0);
    pop();
  }

  drawScore() {
    let text_size = 48;
    let tx = width / 2 - text_size / 2 * 2.5 + text_size / 4;
    let ty = height / 10;

    push();
    noStroke();
    textFont(font);
    textSize(text_size);
    textAlign(CENTER);

    fill(this.players[0].color);
    text(this.players[0].score, tx, ty);

    fill(255);
    text(":", tx + text_size * 3 / 4, ty);

    textSize(text_size);
    fill(this.players[1].color);
    text(this.players[1].score, tx + text_size * 1.5, ty);

    pop();
  }

  drawWinner() {
    let winner;
    if (this.players[0].score > this.players[1].score) winner = this.players[0];
    else winner = this.players[1];

    let text_size = 64;
    let button_size = 32;

    this.players.forEach((p, i) => {
      p.resetScore();
    });

    if (this.animations.length == 0) { // no animations, it's the first iteration of the menu
      for (let i = 0; i < 50; i++) {
        this.animations.push(
          new Animation("ball", 20 * 60, this.seed)
        );
      }
    }

    if (this.buttons.length == 0) {
      let text, id;
      text = "play again";
      id = "game";
      this.buttons.push(
        new Button(width * 2/7, 3/4 * height, button_size * 8, button_size * 2.5, text, id, "#ffffffc8", button_size, this.colorpalette[0], this.colorpalette[1], true)
      );

      text = "main menu";
      id = "mainmenu";
      this.buttons.push(
        new Button(width * 5/7, 3/4 * height, button_size * 8, button_size * 2.5, text, id, "#ffffffc8", button_size, this.colorpalette[0], this.colorpalette[1], true)
      );
    }

    push();

    rectMode(CORNER);
    noStroke();
    fill(0, 0, 0, 127);
    rect(0, 0, width, height);

    let winner_text = `Player ${winner.id + 1} wins!`
    textFont(font);
    textSize(text_size);
    fill(255);
    rectMode(CENTER);
    textAlign(CENTER);
    text(winner_text, width/2, height/2, width, 200);

    pop();

    // run animations
    this.animations.forEach((a, i) => {
      a.show();
      a.update();
    });

    // show buttons
    this.buttons.forEach((b, i) => {
      b.show();
      b.animate();
    });
  }

  tick() {
    this.ticks++;
  }

  resetTicks() {
    this.ticks = 0;
  }

  resetAnimations() {
    this.animations = [];
  }

  resetButtons() {
    this.buttons = [];
  }
}

class Ball {
  constructor(size, color, speed, acceleration) {
    this.size = size;
    this.color = color;
    this.speed = speed;

    this.position = createVector(0, 0);
    this.velocity = createVector(this.speed, 0).rotate(random(TWO_PI));
    this.acceleration = acceleration;
  }

  resetVelocity() {
    this.velocity = createVector(this.speed, 0).rotate(random(TWO_PI));
  }

  resetPosition() {
    this.position.mult(0);
  }

  accelerate(ticks) {
    this.velocity.setMag(this.speed + this.acceleration * ticks);
  }
}

class Paddle {
  constructor(player, height, width, distance, phi) {
    this.player = player;
    this.originalheight = height;
    this.minheight = height / 15;
    this.pheight = height; // paddle height
    this.pwidth = width; // paddle width
    this.distance = distance;
    this.phi = phi;


    this.dphi = 0; // angle determined by player movement
    this.centerAngle = this.calculateCenterAngle();
    this.dheight = this.pheight / (60 * 30);
  }

  updatePaddle() {
    this.pheight -= this.dheight;
    if (this.pheight < this.minheight) this.pheight = this.minheight;
    this.centerAngle = this.calculateCenterAngle();
  }

  resetPaddles() {
    this.pheight = this.originalheight;
    this.centerAngle = this.calculateCenterAngle();
  }

  calculateCenterAngle() {
    return asin(this.pheight / (this.distance * 2)); // teorema della corda
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

class Animation {
  constructor(type, duration, seed, color, x, y) {
    this.type = type;
    this.duration = duration;
    this.seed = seed;

    if (!x) {
      this.position = createVector(random(width), random(height))
    } else {
      this.position = createVector(x, y);
    }

    if (!color) {
      this.color = "#ffffff64"; // 255, 100
    } else {
      this.color = color;
    }

    if (type = "ball") {
      this.z = random(0, 100);
      this.size = map(this.z, 0, 100, width / 200, width / 100);
      this.speed = map(this.z, 0, 100, 0.5, 5);
      this.velocity = createVector(this.speed, 0).rotate(this.seed);
    }
  }

  show() {
    push();
    if (this.type == "ball") {
        translate(this.position.x, this.position.y);
        noStroke();
        fill(this.color);
        circle(0, 0, this.size);
    }
    pop();
  }

  update() {
    if (this.type == "ball") {
      this.position.add(this.velocity);

      if (this.position.x > width) this.position.x -= width;
      else if (this.position.x < 0) this.position.x += width;

      if (this.position.y > height) this.position.y -= height;
      else if (this.position.y < 0) this.position.y += height;
    }
  }
}


class Button {
  constructor(x, y, w, h, text_string, id, text_color, text_size, background_color, hover_color, active) {
    this.position = createVector(x, y); // the position is relative to the center
    this.bwidth = w;
    this.bheight = h;
    this.id = id;
    this.text_string = " " + text_string;
    this.text_color = text_color;
    this.text_size = text_size;
    this.background_color = background_color;
    this.hover_color = hover_color;
    this.active = active;

    this.current_color = background_color;
    this.inactive_color = "#808080";
    this.pressed = false;
  }

  show() {
    push();
    translate(this.position.x, this.position.y);
    noStroke();

    if (this.active) {
      fill(this.current_color);
    } else {
      fill(this.inactive_color);
    }

    rectMode(CENTER);
    rect(0, 0, this.bwidth, this.bheight);

    textSize(this.text_size);
    textAlign(CENTER, CENTER);
    textFont(font);
    fill(this.text_color);
    text(this.text_string, 0, 0, this.bwidth, this.bheight);
    pop();
  }

  animate() {
    if (!this.active) return;

    if (mouseX > this.position.x - this.bwidth / 2 && mouseX < this.position.x + this.bwidth / 2 && mouseY > this.position.y - this.bheight / 2 && mouseY < this.position.y + this.bheight / 2) {
      this.current_color = this.hover_color;
    } else {
      this.current_color = this.background_color;
    }
  }

  checkClicks(x, y) {
    if (!this.active) return;

    if (x > this.position.x - this.bwidth / 2 && x < this.position.x + this.bwidth / 2 && y > this.position.y - this.bheight / 2 && y < this.position.y + this.bheight / 2) {
      this.pressed = true;
    }

  }


}


function mousePressed() {
  if (g.buttons.length > 0) { // check all the buttons
    g.buttons.forEach((b, i) => {
      b.checkClicks(mouseX, mouseY);
    });
  }

  if (current_status == "mainmenu") {
    g.buttons.forEach((b, i) => {
      if (b.pressed) {
        if (b.id == "1player") {
          next_status = "countdown";
        }
      }
    });
  }
  else if (current_status == "drawingwinner") {
    g.buttons.forEach((b, i) => {
      if (b.pressed) {
        if (b.id == "game") {
          next_status = "game";
        } else if (b.id == "mainmenu") {
          next_status = "mainmenu";
        }
      }
    });
  }

}
