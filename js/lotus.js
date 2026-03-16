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
    this.size = size; // radius in px
    this.color = PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)];
    this.rotation = Math.random() * Math.PI * 2;
    this.notchAngle = Math.random() * Math.PI * 2; // gap in the pad
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.008 + Math.random() * 0.006;
  }

  update() {
    this.bobPhase += this.bobSpeed;
  }

  draw(ctx) {
    const bob = Math.sin(this.bobPhase) * 1.2;
    const x = this.x;
    const y = this.y + bob;
    const r = this.size;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    // Draw pad with notch
    ctx.beginPath();
    const notchSize = 0.35; // radians
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
    this.size = size;
    this.palette = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    this.petalCount = 6 + Math.floor(Math.random() * 3);
    this.openness = 0.6 + Math.random() * 0.4; // how open
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.006 + Math.random() * 0.004;
    this.rotation = Math.random() * Math.PI * 2;
  }

  update() {
    this.bobPhase += this.bobSpeed;
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

    // Place 5-7 lily pads, spread across the pond
    const padCount = 5 + Math.floor(Math.random() * 3);
    const placed = [];

    for (let i = 0; i < padCount; i++) {
      let x, y, tries = 0;
      do {
        x = w * 0.1 + Math.random() * w * 0.8;
        y = h * 0.1 + Math.random() * h * 0.8;
        tries++;
      } while (
        tries < 50 &&
        placed.some(p => Math.hypot(p.x - x, p.y - y) < 90)
      );

      const size = 25 + Math.random() * 20;
      this.pads.push(new LilyPad(x, y, size));
      placed.push({ x, y });

      // 50% chance to put a flower on this pad
      if (Math.random() < 0.5) {
        const fx = x + (Math.random() - 0.5) * size * 0.5;
        const fy = y + (Math.random() - 0.5) * size * 0.5;
        this.flowers.push(new LotusFlower(fx, fy, 12 + Math.random() * 8));
      }
    }

    // 1-2 standalone flowers in central area
    for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
      let x = w * 0.3 + Math.random() * w * 0.4;
      let y = h * 0.3 + Math.random() * h * 0.4;
      this.flowers.push(new LotusFlower(x, y, 10 + Math.random() * 8));
    }
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
}
