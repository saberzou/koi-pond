// rain.js — Raindrop ripples on water surface

class RainRipple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = 50 + Math.random() * 30;
    this.maxR = 18 + Math.random() * 25;
  }

  get alive() { return this.age < this.maxAge; }

  update() { this.age++; }

  draw(ctx) {
    const t = this.age / this.maxAge;

    // 3 concentric rings expanding outward
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.1;
      const rt = Math.max(0, t - delay) / (1 - delay);
      if (rt <= 0 || rt >= 1) continue;

      const r = rt * this.maxR * (0.5 + i * 0.3);
      const alpha = (1 - rt) * (1 - rt) * 0.55; // brighter rings

      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(210,230,240,${alpha})`;
      ctx.lineWidth = 1.5 - i * 0.3;
      ctx.stroke();
    }

    // Initial splash dot
    if (t < 0.15) {
      const dotAlpha = (1 - t / 0.15) * 0.7;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,240,245,${dotAlpha})`;
      ctx.fill();
    }
  }
}

export class RainManager {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.ripples = [];
    this.active = false;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }

  start() { this.active = true; }
  stop() { this.active = false; }

  update() {
    if (this.active) {
      // Denser rain — ~8-12 drops per second at 60fps
      if (Math.random() < 0.18) {
        this.ripples.push(new RainRipple(
          Math.random() * this.w,
          Math.random() * this.h
        ));
      }
    }
    this.ripples.forEach(r => r.update());
    this.ripples = this.ripples.filter(r => r.alive);
  }

  draw(ctx) {
    this.ripples.forEach(r => r.draw(ctx));
  }
}
