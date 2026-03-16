// fish.js — Smooth Koi fish with spine-based animation
import { WANDER_SPEED, MAX_SPEED, TURN_RATE, TAIL_SPEED, FEAR_RADIUS, FEAR_FORCE, FEAR_DECAY, FISH_COLORS } from './config.js';

const SPINE_SEGMENTS = 12;

export class Fish {
  constructor(x, y, size, colorIndexOrObject) {
    this.x = x;
    this.y = y;
    this.size = size;
    // Accept either a colorIndex (number) or a direct color object
    if (typeof colorIndexOrObject === 'object' && colorIndexOrObject !== null) {
      this.color = colorIndexOrObject;
    } else {
      this.color = FISH_COLORS[(colorIndexOrObject || 0) % FISH_COLORS.length];
    }
    this.angle = Math.random() * Math.PI * 2;
    this.speed = WANDER_SPEED * (0.6 + Math.random() * 0.8);
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.targetAngle = this.angle;
    this.wanderTimer = 0;
    this.tailPhase = Math.random() * Math.PI * 2;
    this.fleeing = false;

    // Individual variation
    this.bodyWidth = 0.28 + Math.random() * 0.08; // width ratio
    this.tailWidth = 0.6 + Math.random() * 0.2;
    this.finSize = 0.7 + Math.random() * 0.4;
    this.waveAmp = 0.12 + Math.random() * 0.06; // spine wave amplitude (subtle)
    this.waveFreq = 1.8 + Math.random() * 0.4;

    // Spots - random placement along body
    this.spots = [];
    const spotCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < spotCount; i++) {
      this.spots.push({
        t: 0.15 + Math.random() * 0.55, // position along body (0=head, 1=tail)
        side: Math.random() > 0.5 ? 1 : -1,
        size: 0.15 + Math.random() * 0.2,
        offset: (Math.random() - 0.5) * 0.6,
      });
    }
  }

  flee(fx, fy) {
    const dx = this.x - fx;
    const dy = this.y - fy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FEAR_RADIUS && dist > 0) {
      const strength = (1 - dist / FEAR_RADIUS) * FEAR_FORCE;
      this.vx += (dx / dist) * strength;
      this.vy += (dy / dist) * strength;
      this.fleeing = true;
    }
  }

  update(w, h, allFish) {
    this.wanderTimer -= 1;
    if (this.wanderTimer <= 0) {
      this.targetAngle += (Math.random() - 0.5) * 1.2;
      this.wanderTimer = 60 + Math.random() * 120;
    }

    if (!this.fleeing) {
      const ta = this.targetAngle;
      const ax = Math.cos(ta) * this.baseSpeed;
      const ay = Math.sin(ta) * this.baseSpeed;
      this.vx += (ax - this.vx) * TURN_RATE;
      this.vy += (ay - this.vy) * TURN_RATE;
    }

    for (const other of allFish) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50 && dist > 0) {
        this.vx += (dx / dist) * 0.15;
        this.vy += (dy / dist) * 0.15;
      }
    }

    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > MAX_SPEED) {
      this.vx = (this.vx / spd) * MAX_SPEED;
      this.vy = (this.vy / spd) * MAX_SPEED;
    }

    if (this.fleeing) {
      this.vx *= FEAR_DECAY;
      this.vy *= FEAR_DECAY;
      if (spd < this.baseSpeed * 1.2) this.fleeing = false;
    }

    this.x += this.vx;
    this.y += this.vy;
    // Only update angle when moving fast enough to avoid jitter
    if (spd > 0.15) {
      const target = Math.atan2(this.vy, this.vx);
      // Smooth angle interpolation (never snap)
      let diff = target - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * 0.08;
    }
    this.tailPhase += TAIL_SPEED * (1 + spd * 0.5);

    // Edge steering
    const margin = 200;
    const softEdge = 0.02;
    const outLeft = this.x < -margin, outRight = this.x > w + margin;
    const outTop = this.y < -margin, outBot = this.y > h + margin;
    const nearLeft = this.x < 60, nearRight = this.x > w - 60;
    const nearTop = this.y < 60, nearBot = this.y > h - 60;

    if ((outLeft || nearLeft) && (outTop || nearTop)) {
      this.targetAngle = Math.PI * 0.25;
    } else if ((outRight || nearRight) && (outTop || nearTop)) {
      this.targetAngle = Math.PI * 0.75;
    } else if ((outLeft || nearLeft) && (outBot || nearBot)) {
      this.targetAngle = -Math.PI * 0.25;
    } else if ((outRight || nearRight) && (outBot || nearBot)) {
      this.targetAngle = -Math.PI * 0.75;
    } else {
      if (outLeft) this.targetAngle = 0;
      else if (outRight) this.targetAngle = Math.PI;
      else if (nearLeft) this.vx += softEdge;
      else if (nearRight) this.vx -= softEdge;

      if (outTop) this.targetAngle = Math.PI / 2;
      else if (outBot) this.targetAngle = -Math.PI / 2;
      else if (nearTop) this.vy += softEdge;
      else if (nearBot) this.vy -= softEdge;
    }
  }

  // Build spine points with sinusoidal wave
  _buildSpine() {
    const len = this.size * 2.2;
    const pts = [];
    for (let i = 0; i <= SPINE_SEGMENTS; i++) {
      const t = i / SPINE_SEGMENTS;
      // Wave increases toward tail
      const wave = Math.sin(this.tailPhase - t * Math.PI * this.waveFreq) * t * t * this.waveAmp * this.size;
      pts.push({ x: -t * len + len * 0.3, y: wave }); // head at +x, tail at -x
    }
    return pts;
  }

  // Width profile: fat in front, tapers to tail
  _bodyHalfWidth(t) {
    const s = this.size;
    const w = this.bodyWidth * s;
    // Koi head: smooth round nose using sine curve
    if (t < 0.15) {
      // sine ease-out: 0 → w, creates a nice round bulge
      return w * Math.sin((t / 0.15) * Math.PI * 0.5);
    }
    if (t < 0.45) return w; // wide body plateau
    // Taper to tail
    const tailT = (t - 0.45) / 0.55;
    return w * (1 - tailT * 0.75);
  }

  // Create a fish from a KOI_VARIETIES entry
  static fromVariety(x, y, size, variety) {
    return new Fish(x, y, size, variety);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const spine = this._buildSpine();
    const s = this.size;

    // Build body outline (top + bottom)
    const topPts = [];
    const botPts = [];
    for (let i = 0; i <= SPINE_SEGMENTS; i++) {
      const t = i / SPINE_SEGMENTS;
      const hw = this._bodyHalfWidth(t);
      const sp = spine[i];
      // Normal perpendicular to spine
      let nx = 0, ny = -1;
      if (i < SPINE_SEGMENTS) {
        const dx = spine[i + 1].x - sp.x;
        const dy = spine[i + 1].y - sp.y;
        const nl = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / nl;
        ny = dx / nl;
      }
      topPts.push({ x: sp.x + nx * hw, y: sp.y + ny * hw });
      botPts.push({ x: sp.x - nx * hw, y: sp.y - ny * hw });
    }

    // --- Shadow under fish ---
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#000';
    this._drawBodyPath(ctx, topPts, botPts);
    ctx.save();
    ctx.translate(-4, 5);
    ctx.scale(1.03, 1.03);
    this._drawBodyPath(ctx, topPts, botPts);
    ctx.fill();
    ctx.restore();

    // --- Main body gradient ---
    ctx.globalAlpha = 0.88;
    const grad = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    grad.addColorStop(0, this.color.body);
    grad.addColorStop(0.6, this.color.belly);
    grad.addColorStop(1, this.color.body);
    ctx.fillStyle = grad;
    this._drawBodyPath(ctx, topPts, botPts);
    ctx.fill();

    // --- Spots ---
    ctx.globalAlpha = 0.75;
    for (const spot of this.spots) {
      const idx = Math.floor(spot.t * SPINE_SEGMENTS);
      const sp = spine[Math.min(idx, SPINE_SEGMENTS)];
      const hw = this._bodyHalfWidth(spot.t);
      const sx = sp.x + spot.offset * hw * 0.5;
      const sy = sp.y + spot.side * hw * 0.3;
      const sr = spot.size * s * 0.4;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr * 1.3, sr, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color.spots;
      ctx.fill();
    }

    // --- Dorsal fin ---
    ctx.globalAlpha = 0.35;
    const dStart = spine[2];
    const dEnd = spine[5];
    const dMid = spine[3];
    ctx.beginPath();
    ctx.moveTo(dStart.x, dStart.y - this._bodyHalfWidth(2 / SPINE_SEGMENTS));
    ctx.quadraticCurveTo(
      dMid.x, dMid.y - this._bodyHalfWidth(3 / SPINE_SEGMENTS) - s * 0.25 * this.finSize,
      dEnd.x, dEnd.y - this._bodyHalfWidth(5 / SPINE_SEGMENTS)
    );
    ctx.fillStyle = this.color.body;
    ctx.fill();

    // --- Pectoral fins (pair) ---
    ctx.globalAlpha = 0.3;
    const finSwing = Math.sin(this.tailPhase * 0.6) * 0.3;
    const pBase = spine[3];
    const pHw = this._bodyHalfWidth(3 / SPINE_SEGMENTS);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(pBase.x, pBase.y + side * pHw);
      ctx.quadraticCurveTo(
        pBase.x - s * 0.4, pBase.y + side * (pHw + s * 0.3 * this.finSize + finSwing * s * side),
        pBase.x - s * 0.6, pBase.y + side * (pHw + s * 0.1)
      );
      ctx.fillStyle = this.color.body;
      ctx.fill();
    }

    // --- Tail fin ---
    ctx.globalAlpha = 0.55;
    const tailPt = spine[SPINE_SEGMENTS];
    const preTail = spine[SPINE_SEGMENTS - 1];
    const tailAng = Math.atan2(tailPt.y - preTail.y, tailPt.x - preTail.x);
    const tw = s * 0.5 * this.tailWidth;
    ctx.beginPath();
    ctx.moveTo(tailPt.x, tailPt.y);
    ctx.quadraticCurveTo(
      tailPt.x - s * 0.35, tailPt.y - tw,
      tailPt.x - s * 0.55, tailPt.y - tw * 1.1
    );
    ctx.moveTo(tailPt.x, tailPt.y);
    ctx.quadraticCurveTo(
      tailPt.x - s * 0.35, tailPt.y + tw,
      tailPt.x - s * 0.55, tailPt.y + tw * 1.1
    );
    ctx.fillStyle = this.color.body;
    ctx.fill();

    // Tail fill (fork shape)
    ctx.beginPath();
    ctx.moveTo(tailPt.x, tailPt.y);
    ctx.bezierCurveTo(
      tailPt.x - s * 0.2, tailPt.y - tw * 0.3,
      tailPt.x - s * 0.4, tailPt.y - tw * 0.9,
      tailPt.x - s * 0.55, tailPt.y - tw * 1.1
    );
    ctx.bezierCurveTo(
      tailPt.x - s * 0.3, tailPt.y,
      tailPt.x - s * 0.3, tailPt.y,
      tailPt.x - s * 0.55, tailPt.y + tw * 1.1
    );
    ctx.bezierCurveTo(
      tailPt.x - s * 0.4, tailPt.y + tw * 0.9,
      tailPt.x - s * 0.2, tailPt.y + tw * 0.3,
      tailPt.x, tailPt.y
    );
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.color.body;
    ctx.fill();

    // --- Eye ---
    ctx.globalAlpha = 1;
    const eyePt = spine[1];
    const eyeHw = this._bodyHalfWidth(1 / SPINE_SEGMENTS);
    const eyeR = s * 0.06;
    for (const side of [-1, 1]) {
      const ex = eyePt.x - s * 0.08;
      const ey = eyePt.y + side * eyeHw * 0.7;
      // White
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      // Pupil
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.3, ey, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
    }

    ctx.restore();
  }

  _drawBodyPath(ctx, topPts, botPts) {
    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    for (let i = 1; i < topPts.length; i++) {
      const prev = topPts[i - 1];
      const curr = topPts[i];
      ctx.quadraticCurveTo(
        (prev.x + curr.x) / 2, (prev.y + curr.y) / 2,
        curr.x, curr.y
      );
    }
    // Connect to bottom in reverse
    const last = botPts[botPts.length - 1];
    ctx.lineTo(last.x, last.y);
    for (let i = botPts.length - 2; i >= 0; i--) {
      const prev = botPts[i + 1];
      const curr = botPts[i];
      ctx.quadraticCurveTo(
        (prev.x + curr.x) / 2, (prev.y + curr.y) / 2,
        curr.x, curr.y
      );
    }
    ctx.closePath();
  }
}
