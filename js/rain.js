// rain.js — Rain system with random ripples

export class RainDrop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = 40 + Math.random() * 30;
    this.maxR = 8 + Math.random() * 12;
  }

  get alive() { return this.age < this.maxAge; }

  update() { this.age++; }

  draw(ctx) {
    const t = this.age / this.maxAge;
    const alpha = (1 - t) * 0.18;
    for (let i = 0; i < 2; i++) {
      const r = t * this.maxR * (0.5 + i * 0.5);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,210,220,${alpha * (1 - i * 0.4)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
}

export class RainManager {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.drops = [];
    this.active = false;
    this.intensity = 0.35; // drops per frame
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }

  start() { this.active = true; }
  stop() { this.active = false; }

  update() {
    if (this.active) {
      // Spawn rain drops randomly
      if (Math.random() < this.intensity) {
        this.drops.push(new RainDrop(
          Math.random() * this.w,
          Math.random() * this.h
        ));
      }
    }
    this.drops.forEach(d => d.update());
    this.drops = this.drops.filter(d => d.alive);
  }

  draw(ctx) {
    this.drops.forEach(d => d.draw(ctx));
  }
}
