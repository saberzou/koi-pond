// rain.js — Raindrop ripples on water surface

class RainRipple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = 60 + Math.random() * 40;
    this.maxR = 15 + Math.random() * 20;
  }

  get alive() { return this.age < this.maxAge; }

  update() { this.age++; }

  draw(ctx) {
    const t = this.age / this.maxAge;

    // 3 concentric rings expanding outward
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.12;
      const rt = Math.max(0, t - delay) / (1 - delay);
      if (rt <= 0 || rt >= 1) continue;

      const r = rt * this.maxR * (0.5 + i * 0.3);
      const alpha = (1 - rt) * (1 - rt) * 0.25; // fade out quadratically

      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,220,230,${alpha})`;
      ctx.lineWidth = 1.2 - i * 0.3;
      ctx.stroke();
    }

    // Initial splash dot
    if (t < 0.1) {
      const dotAlpha = (1 - t / 0.1) * 0.4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,235,240,${dotAlpha})`;
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
      // Sparse raindrops — ~2-4 per second at 60fps
      if (Math.random() < 0.06) {
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
