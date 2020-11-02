class Animation {
  constructor(params) { //type, duration, seed, x, y, color, transform
    this.running = true;
    this.type = params.type;
    this.duration = params.duration;
    this.seed = params.seed;

    if (!params.x) {
      this.position = createVector(random(width), random(height));
    } else {
      this.position = createVector(params.x, params.y);
    }

    if (!params.color) {
      this.color = "#ffffff64"; // 255, 100
    } else {
      this.color = params.color;
    }

    if (!params.transform) {
      this.transform = false;
    } else {
      this.transform = true;
    }

    if (params.type == "ball") {
      this.z = random(0, 100);
      this.size = map(this.z, 0, 100, width / 200, width / 100);
      this.speed = map(this.z, 0, 100, 0.5, 5);
      this.velocity = createVector(this.speed, 0).rotate(this.seed);
    } else if (params.type == "circle") {
      this.size = 0;
      this.final_size = width * .75;
      this.velocity = (this.final_size - this.size) / params.duration;
    }
  }

  show() {
    if (!this.running) return;

    push();

    if (this.transform) { // transform relative to game container
      push();
      translate(width / 2, height * y_offset);
      scale(scl);
      translate(-width / 2, -height * y_offset);
      translate(width / 2, height / 2);
    }

    if (this.type == "ball") {
      translate(this.position.x, this.position.y);
      noStroke();
      fill(this.color);
      circle(0, 0, this.size);
    } else if (this.type == "circle") {
      let stroke_alpha = Math.floor(map(this.size, 0, this.final_size, 64, 0));
      let fill_alpha = Math.floor(map(this.size, 0, this.final_size, 64, 0));
      let hex_alpha;

      translate(this.position.x, this.position.y);
      hex_alpha = hex(stroke_alpha).slice(6, 8);
      stroke(`${this.color}${hex_alpha}`);
      strokeWeight(3);
      hex_alpha = hex(fill_alpha).slice(6, 8);
      fill(`${this.color}${hex_alpha}`);
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

    } else if (this.type == "circle") {
      this.size += this.velocity;
      if (this.size > this.final_size) {
        this.running = false;
      }
    }
  }
}
