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
