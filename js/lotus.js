// lotus.js — Pixel-art lotus flowers and lily pads

const PAD_COLORS = ['#2D6B3F', '#3A7D4E', '#2A5E38'];
const FLOWER_COLORS = [
  { petals: '#F5C6D0', center: '#F0E68C' }, // pink
  { petals: '#FFFFFF', center: '#F5E6A3' },  // white
  { petals: '#F0B8C8', center: '#FFD700' },  // rose
];

class LilyPad {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.vx = 0;
    this.vy = 0;
    this.size = size; // radius in px
    this.color = PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)];
    this.rotation = Math.random() * Math.PI * 2;
    this.rotVel = 0;
    this.notchAngle = Math.random() * Math.PI * 2; // gap in the pad
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.008 + Math.random() * 0.006;
  }

  nudge(px, py, force) {
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = this.size + 80;
    if (dist < radius && dist > 0) {
      const strength = (1 - dist / radius) * force;
      this.vx += (dx / dist) * strength;
      this.vy += (dy / dist) * strength;
      this.rotVel += (Math.random() - 0.5) * strength * 0.02;
    }
  }

  update() {
    this.bobPhase += this.bobSpeed;
    // Drift physics
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotVel;
    // Friction
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.rotVel *= 0.95;
    // Spring back to home
    this.vx += (this.homeX - this.x) * 0.003;
    this.vy += (this.homeY - this.y) * 0.003;
  }

  draw(ctx) {
    const bob = Math.sin(this.bobPhase) * 1.2;
    const x = this.x;
    const y = this.y + bob;
    const r = this.size;

    ctx.save();
    ctx.translate(x, y);

    // Drop shadow on pond floor (fixed direction, before rotation)
    ctx.save();
    ctx.translate(8, 10);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    const notchSize = 0.35;
    for (let a = this.notchAngle + notchSize; a < this.notchAngle + Math.PI * 2; a += 0.1) {
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === this.notchAngle + notchSize) ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.filter = 'blur(6px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    ctx.rotate(this.rotation);

    // Draw pad with notch
    ctx.beginPath();
    for (let a = this.notchAngle + notchSize; a < this.notchAngle + Math.PI * 2; a += 0.1) {
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === this.notchAngle + notchSize) ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();

    // Vein lines
    ctx.strokeStyle = 'rgba(20,60,30,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const a = this.notchAngle + notchSize + (i / 5) * (Math.PI * 2 - notchSize * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class LotusFlower {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.vx = 0;
    this.vy = 0;
    this.size = size;
    this.palette = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    this.petalCount = 6 + Math.floor(Math.random() * 3);
    this.openness = 0.6 + Math.random() * 0.4;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.006 + Math.random() * 0.004;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotVel = 0;
  }

  nudge(px, py, force) {
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = this.size + 80;
    if (dist < radius && dist > 0) {
      const strength = (1 - dist / radius) * force;
      this.vx += (dx / dist) * strength;
      this.vy += (dy / dist) * strength;
      this.rotVel += (Math.random() - 0.5) * strength * 0.015;
    }
  }

  update() {
    this.bobPhase += this.bobSpeed;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotVel;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.rotVel *= 0.95;
    this.vx += (this.homeX - this.x) * 0.003;
    this.vy += (this.homeY - this.y) * 0.003;
  }

  draw(ctx) {
    const bob = Math.sin(this.bobPhase) * 1.0;
    const x = this.x;
    const y = this.y + bob;
    const s = this.size;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    // Outer petals
    for (let i = 0; i < this.petalCount; i++) {
      const angle = (i / this.petalCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.5 * this.openness, s * 0.28, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.palette.petals;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.restore();
    }

    // Inner petals (smaller, slightly rotated)
    for (let i = 0; i < this.petalCount; i++) {
      const angle = (i / this.petalCount) * Math.PI * 2 + Math.PI / this.petalCount;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.3 * this.openness, s * 0.18, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.palette.petals;
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = this.palette.center;
    ctx.globalAlpha = 1;
    ctx.fill();

    // Center dots
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const dr = s * 0.08;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * dr, Math.sin(a) * dr, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#C8A800';
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export class LotusManager {
  constructor(w, h) {
    this.pads = [];
    this.flowers = [];
    this.generate(w, h);
  }

  generate(w, h) {
    this.pads = [];
    this.flowers = [];

    // Fixed positions from Saber's markup (percentage-based)
    const spots = [
      { x: 0.30, y: 0.33, pad: true, flower: true },   // upper-left circle
      { x: 0.25, y: 0.74, pad: true, flower: true },   // lower-left circle
      { x: 0.82, y: 0.87, pad: true, flower: true },   // lower-right circle
      // Edge pads
      { x: 0.08, y: 0.12, pad: true, flower: false },  // top-left corner
      { x: 0.92, y: 0.18, pad: true, flower: false },  // top-right edge
      { x: 0.06, y: 0.55, pad: true, flower: true },   // left edge
      { x: 0.90, y: 0.52, pad: true, flower: false },  // right edge
      { x: 0.15, y: 0.92, pad: true, flower: false },  // bottom-left
    ];

    for (const spot of spots) {
      const sx = spot.x * w + (Math.random() - 0.5) * 20;
      const sy = spot.y * h + (Math.random() - 0.5) * 20;
      const size = 45 + Math.random() * 35;

      this.pads.push(new LilyPad(sx, sy, size));

      if (spot.flower) {
        const fx = sx + (Math.random() - 0.5) * size * 0.4;
        const fy = sy + (Math.random() - 0.5) * size * 0.4;
        this.flowers.push(new LotusFlower(fx, fy, 18 + Math.random() * 10));
      }
    }
  }

  nudge(px, py, force) {
    this.pads.forEach(p => p.nudge(px, py, force));
    this.flowers.forEach(f => f.nudge(px, py, force));
  }

  update() {
    this.pads.forEach(p => p.update());
    this.flowers.forEach(f => f.update());
  }

  draw(ctx) {
    // Pads first, then flowers on top
    this.pads.forEach(p => p.draw(ctx));
    this.flowers.forEach(f => f.draw(ctx));
  }

  drawRainDrops(ctx) {
    // Small splash circles on lily pads
    for (const pad of this.pads) {
      // ~15% chance per frame per pad to spawn a visible splash
      if (Math.random() > 0.15) continue;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * pad.size * 0.75;
      const sx = pad.x + Math.cos(angle) * dist;
      const sy = pad.y + Math.sin(pad.bobPhase) * 1.2 + Math.sin(angle) * dist;
      const r = 1.5 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Tiny center dot
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    }
  }
}
