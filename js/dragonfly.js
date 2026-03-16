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
    // Shadow offset — light from top-right, shadow bottom-left
    this.shadowOffX = -(18 + Math.random() * 12);
    this.shadowOffY = 22 + Math.random() * 12;
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
    const tilt = wingBeat * 0.06; // very subtle flutter

    // --- Wings (4 elongated leaf shapes, spread outward) ---
    const wingColor = shadowColor || 'rgba(100,180,220,0.55)';
    const veinColor = shadowColor || 'rgba(30,80,130,0.3)';
    ctx.globalAlpha = shadowColor ? ctx.globalAlpha : 0.7;

    const wings = [
      { ox: s * 0.0, angle: -1.4 + tilt, len: s * 2.2, w: s * 0.45 },    // front-top
      { ox: s * 0.0, angle: 1.4 - tilt, len: s * 2.2, w: s * 0.45 },     // front-bottom
      { ox: -s * 0.35, angle: -1.75 + tilt, len: s * 1.9, w: s * 0.4 },  // rear-top
      { ox: -s * 0.35, angle: 1.75 - tilt, len: s * 1.9, w: s * 0.4 },   // rear-bottom
    ];

    for (const wing of wings) {
      ctx.save();
      ctx.translate(wing.ox, 0);
      ctx.rotate(wing.angle);
      // Wing shape — elongated leaf
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(wing.len * 0.25, -wing.w * 0.5, wing.len * 0.6, -wing.w * 0.45, wing.len, 0);
      ctx.bezierCurveTo(wing.len * 0.6, wing.w * 0.45, wing.len * 0.25, wing.w * 0.5, 0, 0);
      ctx.fillStyle = wingColor;
      ctx.fill();

      // Wing veins
      if (!shadowColor) {
        ctx.strokeStyle = veinColor;
        ctx.lineWidth = 0.4;
        // Center vein
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(wing.len * 0.95, 0);
        ctx.stroke();
        // Side veins
        for (let v = 0.25; v < 0.9; v += 0.2) {
          ctx.beginPath();
          ctx.moveTo(wing.len * v, 0);
          ctx.lineTo(wing.len * (v + 0.12), -wing.w * 0.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(wing.len * v, 0);
          ctx.lineTo(wing.len * (v + 0.12), wing.w * 0.35);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // --- Body (golden/yellow with stripes) ---
    ctx.globalAlpha = shadowColor ? ctx.globalAlpha : 0.9;

    // Thorax (wider segment)
    ctx.beginPath();
    ctx.ellipse(s * 0.1, 0, s * 0.45, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowColor || '#E8B830';
    ctx.fill();

    // Abdomen / tail (long tapered)
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.18);
    ctx.bezierCurveTo(-s * 0.8, -s * 0.14, -s * 1.8, -s * 0.06, -s * 2.2, 0);
    ctx.bezierCurveTo(-s * 1.8, s * 0.06, -s * 0.8, s * 0.14, -s * 0.2, s * 0.18);
    ctx.fillStyle = shadowColor || '#D4960B';
    ctx.fill();

    // Tail stripes
    if (!shadowColor) {
      ctx.strokeStyle = 'rgba(180,80,20,0.4)';
      ctx.lineWidth = s * 0.06;
      for (let i = 1; i <= 5; i++) {
        const tx = -s * 0.3 - i * s * 0.32;
        const tw = s * 0.16 - i * 0.015 * s;
        ctx.beginPath();
        ctx.moveTo(tx, -tw);
        ctx.lineTo(tx, tw);
        ctx.stroke();
      }
    }

    // Head
    ctx.beginPath();
    ctx.ellipse(s * 0.55, 0, s * 0.25, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowColor || '#E8B830';
    ctx.fill();

    // Eyes
    if (!shadowColor) {
      ctx.beginPath();
      ctx.arc(s * 0.7, -s * 0.1, s * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#3A8C3A';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.7, s * 0.1, s * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#3A8C3A';
      ctx.fill();
      // Eye highlights
      ctx.beginPath();
      ctx.arc(s * 0.72, -s * 0.08, s * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.72, s * 0.12, s * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }
}

export { Dragonfly };
