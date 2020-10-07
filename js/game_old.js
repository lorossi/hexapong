let g;

function setup() {
  colorMode(HSB);
  var canvas = createCanvas(800, 800);
  canvas.parent('gamecontainer');

  g = new Game();
}

function draw() {
  push();
  translate(width / 2, height / 2);
  scale(0.75);
  translate(- width / 2, - height / 2);

  background(0);
  g.moveBall();
  g.checkCollision();

  g.drawBall();
  g.drawPaddles();

  push();
  translate(width/2, height/2);
  stroke(255);
  noFill();
  circle(0, 0, width);
  pop();


  pop();
}


class Game {
  constructor(){
    this.ballSize = width / 100;
    this.ballColor = "#fffffff";
    this.ballPosition = {
      x: 0,
      y: 0
    }
    this.ballHeading = 0;
    this.ballSpeed = 6;

    this.paddleSize = width / 5;
    this.paddleRadius = width / 2;
    this.centerAngle =  asin(this.paddleSize / (this.paddleRadius * 2)); //teorema della cords
    this.paddlePosition = {
      0: 0,
      1: 0
    }
    this.paddleColor = {
      0: "#ff0000", // red
      1: "#0000ff" // blue
    }
  }

  drawPaddles() {
    push();
    rectMode(CENTER);
    noStroke();
    translate(width / 2, height / 2);

    for (let i = 0; i < 6; i++) {
      let phi = TWO_PI / 6 * i + this.paddlePosition[i % 2];
      let x = this.paddleRadius * cos(phi);
      let y = this.paddleRadius * sin(phi);

      push();
      translate(x, y);
      fill(this.paddleColor[i % 2]);
      rotate(phi + PI / 2);
      rect(0, 0, this.paddleSize, this.paddleSize / 15);
      pop();

      let x1, y1;
      x1 = this.paddleRadius;
      y1 = 0;

      push();
      stroke(255);
      noFill();
      rotate(phi + this.centerAngle);
      line(0, 0, x1, y1);
      rotate(- 2 * this.centerAngle); // phi - this.centerAngle
      line(0, 0, x1, y1);
      pop();
    }
    pop();
  }

  movePaddle(player, dphi) {
    this.paddlePosition[player] = dphi;
  }

  drawBall() {
    push();
    translate(width/2, height/2);
    noStroke();
    fill(this.ballColor);
    translate(this.ballPosition.x, this.ballPosition.y);
    circle(0, 0, this.ballSize * 2);
    pop();
  }

  moveBall() {
    this.ballPosition.x += cos(this.ballHeading) * this.ballSpeed;
    this.ballPosition.y += sin(this.ballHeading) * this.ballSpeed;

    while (this.ballHeading > TWO_PI) this.ballHeading -= TWO_PI;
    while (this.ballHeading < 0) this.ballHeading += TWO_PI;
  }

  checkCollision() {
    let ballDist = dist(this.ballPosition.x + this.ballSize, this.ballPosition.y + this.ballSize, 0, 0);

    if (ballDist > width / 2 * sqrt(2) * 1.5){
      console.log("OVER");
      this.ballPosition = {
        x: 0,
        y: 0
      }
    } else if (ballDist >= this.paddleRadius) {
      console.log("FAR");
      let ballAngle = atan2(this.ballPosition.y, this.ballPosition.x);

      for (let i = 0; i < 6; i++) {
        // FUCK FUCK FUCK
      }
    }
  }


}

function mouseMoved() {
  let dphi;
  let maxDelta = g.centerAngle * 4;

  dphi = map(mouseX, 0, width, -maxDelta, maxDelta);
  g.movePaddle(0, dphi);

  dphi = map(mouseY, 0, width, -maxDelta, maxDelta);
  g.movePaddle(1, dphi);
}
