// food.js — Floating food pellets for koi feeding
export const EAT_RADIUS = 14;
export const ATTRACT_RADIUS = 200;

class FoodPellet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.life = 540; // ~9s at 60fps
    this.bobPhase = Math.random() * Math.PI * 2;
    this.eaten = false;
  }

  update() {
    this.bobPhase += 0.045;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.life--;
  }

  draw(ctx) {
    const r = 3.5;
    const bob = Math.sin(this.bobPhase) * 0.6;
    const x = this.x;
    const y = this.y + bob;
    const alpha = Math.min(1, this.life / 60);

    ctx.globalAlpha = alpha * 0.3;
    ctx.beginPath();
    ctx.arc(x + 1.5, y + 2, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#B8600A';
    ctx.fill();

    // Warm highlight
    ctx.beginPath();
    ctx.arc(x - 1, y - 1.2, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,210,100,0.75)';
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  isAlive() { return this.life > 0 && !this.eaten; }
}

export class FoodManager {
  constructor() {
    this.pellets = [];
  }

  add(x, y) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.pellets.push(new FoodPellet(
        x + (Math.random() - 0.5) * 24,
        y + (Math.random() - 0.5) * 24
      ));
    }
  }

  getPellets() { return this.pellets; }

  update() {
    for (const p of this.pellets) p.update();
    this.pellets = this.pellets.filter(p => p.isAlive());
  }

  draw(ctx) {
    for (const p of this.pellets) p.draw(ctx);
  }
}
