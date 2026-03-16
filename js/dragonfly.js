// dragonfly.js — Occasional dragonfly flyby with shadow

class Dragonfly {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.active = false;
    this.timer = 300 + Math.random() * 600; // frames until next flyby
    this.wingPhase = 0;
    this.reset();
  }

  reset() {
    const w = this.w, h = this.h;
    // Pick a random edge to enter from
    const side = Math.floor(Math.random() * 4);
    const margin = 80;
    switch (side) {
      case 0: this.x = -margin; this.y = Math.random() * h; break; // left
      case 1: this.x = w + margin; this.y = Math.random() * h; break; // right
      case 2: this.x = Math.random() * w; this.y = -margin; break; // top
      case 3: this.x = Math.random() * w; this.y = h + margin; break; // bottom
    }
    // Aim roughly toward the opposite side with some randomness
    const tx = w * (0.2 + Math.random() * 0.6);
    const ty = h * (0.2 + Math.random() * 0.6);
    const angle = Math.atan2(ty - this.y, tx - this.x);
    this.speed = 2.5 + Math.random() * 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.angle = angle;
    // Slight wobble
    this.wobbleAmp = 0.3 + Math.random() * 0.5;
    this.wobbleFreq = 0.02 + Math.random() * 0.02;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.size = 12 + Math.random() * 8;
    // Shadow offset (dragonfly is high above the water)
    this.shadowOffX = 20 + Math.random() * 15;
    this.shadowOffY = 25 + Math.random() * 15;
  }

  update() {
    if (!this.active) {
      this.timer--;
      if (this.timer <= 0) {
        this.active = true;
        this.reset();
      }
      return;
    }

    this.wobblePhase += this.wobbleFreq;
    const wobble = Math.sin(this.wobblePhase) * this.wobbleAmp;
    this.x += this.vx + Math.cos(this.angle + Math.PI / 2) * wobble;
    this.y += this.vy + Math.sin(this.angle + Math.PI / 2) * wobble;
    this.wingPhase += 0.4;

    // Off-screen? Deactivate
    const m = 120;
    if (this.x < -m || this.x > this.w + m || this.y < -m || this.y > this.h + m) {
      this.active = false;
      this.timer = 400 + Math.random() * 800;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    const s = this.size;
    const wingBeat = Math.sin(this.wingPhase);

    // --- Shadow first ---
    ctx.save();
    ctx.translate(this.x + this.shadowOffX, this.y + this.shadowOffY);
    ctx.rotate(this.angle);
    ctx.globalAlpha = 0.15;
    this._drawShape(ctx, s, wingBeat, 'rgba(0,0,0,1)');
    ctx.restore();

    // --- Dragonfly ---
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = 0.7;
    this._drawShape(ctx, s, wingBeat, null);
    ctx.restore();
  }

  _drawShape(ctx, s, wingBeat, shadowColor) {
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.2, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowColor || '#1A3A3A';
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(-s * 2, 0);
    ctx.strokeStyle = shadowColor || '#1A3A3A';
    ctx.lineWidth = s * 0.08;
    ctx.stroke();

    // Wings (4 wings, always extended with subtle tilt)
    const wingLen = s * 1.8;
    const wingW = s * 0.7;
    const tilt = wingBeat * 0.12; // subtle flutter, not collapse
    const wingAlpha = shadowColor ? 1 : 0.35;

    ctx.globalAlpha = ctx.globalAlpha * wingAlpha;
    // Top-right wing (front)
    ctx.beginPath();
    ctx.ellipse(s * 0.2, -wingW * 0.6, wingLen * 0.65, wingW * 0.35, -0.2 + tilt, 0, Math.PI * 2);
    ctx.fillStyle = shadowColor || 'rgba(180,220,230,0.7)';
    ctx.fill();
    // Bottom-right wing (front)
    ctx.beginPath();
    ctx.ellipse(s * 0.2, wingW * 0.6, wingLen * 0.65, wingW * 0.35, 0.2 - tilt, 0, Math.PI * 2);
    ctx.fill();
    // Top-left wing (rear)
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, -wingW * 0.55, wingLen * 0.55, wingW * 0.3, -0.15 + tilt, 0, Math.PI * 2);
    ctx.fill();
    // Bottom-left wing (rear)
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, wingW * 0.55, wingLen * 0.55, wingW * 0.3, 0.15 - tilt, 0, Math.PI * 2);
    ctx.fill();
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }
}

export { Dragonfly };
