// ripple.js — Click ripple effects
import { RIPPLE_MAX_RADIUS, RIPPLE_DURATION } from './config.js';

export class Ripple {
  constructor(x, y, scale = 1.0) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = RIPPLE_DURATION;
    this.scale = scale;
  }

  get alive() { return this.age < this.maxAge; }

  update() { this.age++; }

  draw(ctx) {
    const t = this.age / this.maxAge;
    const alpha = (1 - t) * 0.12;
    const maxR = RIPPLE_MAX_RADIUS * this.scale;
    for (let i = 0; i < 3; i++) {
      const r = t * maxR * (0.4 + i * 0.3);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,225,220,${alpha * (1 - i * 0.3)})`;
      ctx.lineWidth = 1 - i * 0.25;
      ctx.stroke();
    }
  }
}

export class RippleManager {
  constructor() { this.ripples = []; }

  add(x, y, scale = 1.0) { this.ripples.push(new Ripple(x, y, scale)); }

  update() {
    this.ripples.forEach(r => r.update());
    this.ripples = this.ripples.filter(r => r.alive);
  }

  draw(ctx) { this.ripples.forEach(r => r.draw(ctx)); }
}
