// caustics.js — Animated underwater light caustic patterns
export class CausticLayer {
  constructor(w, h) {
    this.time = 0;
    this.sources = [];
    this._init(w, h);
  }

  _init(w, h) {
    this.w = w;
    this.h = h;
    // 8 moving light sources on slow Lissajous paths
    this.sources = Array.from({ length: 8 }, () => ({
      cx: w * (0.15 + Math.random() * 0.7),
      cy: h * (0.15 + Math.random() * 0.7),
      rx: w * (0.12 + Math.random() * 0.18),
      ry: h * (0.10 + Math.random() * 0.16),
      fx: 0.00014 + Math.random() * 0.00012,
      fy: 0.00017 + Math.random() * 0.00014,
      phase:  Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      r: 70 + Math.random() * 90,
    }));
  }

  resize(w, h) { this._init(w, h); }

  update() { this.time++; }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.045;
    for (const s of this.sources) {
      const x = s.cx + Math.cos(this.time * s.fx + s.phase)  * s.rx;
      const y = s.cy + Math.sin(this.time * s.fy + s.phaseY) * s.ry;
      const g = ctx.createRadialGradient(x, y, 0, x, y, s.r);
      g.addColorStop(0,   'rgba(210,240,255,1)');
      g.addColorStop(0.35,'rgba(160,210,245,0.5)');
      g.addColorStop(1,   'rgba(100,170,230,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
