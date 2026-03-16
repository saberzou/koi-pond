// ripple.js — Click ripple effects
import { RIPPLE_MAX_RADIUS, RIPPLE_DURATION } from './config.js';

export class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = RIPPLE_DURATION;
  }

  get alive() { return this.age < this.maxAge; }

  update() { this.age++; }

  draw(ctx) {
    const t = this.age / this.maxAge;
    const alpha = (1 - t) * 0.35;
    for (let i = 0; i < 3; i++) {
      const r = t * RIPPLE_MAX_RADIUS * (0.4 + i * 0.3);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * (1 - i * 0.3)})`;
      ctx.lineWidth = 1.5 - i * 0.4;
      ctx.stroke();
    }
  }
}

export class RippleManager {
  constructor() { this.ripples = []; }

  add(x, y) { this.ripples.push(new Ripple(x, y)); }

  update() {
    this.ripples.forEach(r => r.update());
    this.ripples = this.ripples.filter(r => r.alive);
  }

  draw(ctx) { this.ripples.forEach(r => r.draw(ctx)); }
}
