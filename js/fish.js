// fish.js — Pixel-art Koi fish
import { WANDER_SPEED, MAX_SPEED, TURN_RATE, TAIL_SPEED, FEAR_RADIUS, FEAR_FORCE, FEAR_DECAY, FISH_COLORS } from './config.js';

export class Fish {
  constructor(x, y, size, colorIndex) {
    this.x = x;
    this.y = y;
    this.size = size; // 20-32
    this.color = FISH_COLORS[colorIndex % FISH_COLORS.length];
    this.angle = Math.random() * Math.PI * 2;
    this.speed = WANDER_SPEED * (0.6 + Math.random() * 0.8);
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.targetAngle = this.angle;
    this.wanderTimer = 0;
    this.tailPhase = Math.random() * Math.PI * 2;
    this.fleeing = false;
    this.px = Math.round(size / 6); // pixel size
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
    // Wander
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

    // Soft separation
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

    // Speed cap
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > MAX_SPEED) {
      this.vx = (this.vx / spd) * MAX_SPEED;
      this.vy = (this.vy / spd) * MAX_SPEED;
    }

    // Decay flee
    if (this.fleeing) {
      this.vx *= FEAR_DECAY;
      this.vy *= FEAR_DECAY;
      if (spd < this.baseSpeed * 1.2) this.fleeing = false;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);
    this.tailPhase += TAIL_SPEED * (1 + spd * 0.5);

    // Allow fish to swim off-screen, but gently steer back
    const margin = 200;
    const softEdge = 0.02;
    const outLeft = this.x < -margin, outRight = this.x > w + margin;
    const outTop = this.y < -margin, outBot = this.y > h + margin;
    const nearLeft = this.x < 60, nearRight = this.x > w - 60;
    const nearTop = this.y < 60, nearBot = this.y > h - 60;

    // Corner: pick a single diagonal angle toward center
    if ((outLeft || nearLeft) && (outTop || nearTop)) {
      this.targetAngle = Math.PI * 0.25;  // down-right
    } else if ((outRight || nearRight) && (outTop || nearTop)) {
      this.targetAngle = Math.PI * 0.75;  // down-left
    } else if ((outLeft || nearLeft) && (outBot || nearBot)) {
      this.targetAngle = -Math.PI * 0.25; // up-right
    } else if ((outRight || nearRight) && (outBot || nearBot)) {
      this.targetAngle = -Math.PI * 0.75; // up-left
    } else {
      // Edge: single-axis steering
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

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = 0.85;

    const p = this.px;
    const s = this.size;
    const tailSwing = Math.sin(this.tailPhase) * p * 1.5;

    // Tail (3 segments, wagging)
    ctx.fillStyle = this.color.body;
    const tailX = -s * 0.5;
    ctx.fillRect(tailX - p, tailSwing - p, p * 2, p * 2);
    ctx.fillRect(tailX - p * 2.5, tailSwing * 1.3 - p * 1.5, p * 2, p * 3);
    ctx.fillStyle = this.color.spots;
    ctx.fillRect(tailX - p * 2.5, tailSwing * 1.3 - p * 0.5, p, p);

    // Body (elliptical pixel blob)
    ctx.fillStyle = this.color.body;
    for (let bx = -3; bx <= 3; bx++) {
      const colH = bx === 0 ? 3 : Math.abs(bx) <= 1 ? 2.5 : Math.abs(bx) <= 2 ? 2 : 1;
      for (let by = -Math.floor(colH); by <= Math.floor(colH); by++) {
        ctx.fillRect(bx * p, by * p, p, p);
      }
    }

    // Belly highlight
    ctx.fillStyle = this.color.belly;
    ctx.fillRect(-p, 0, p * 2, p);
    ctx.fillRect(0, p, p, p);

    // Spots / pattern
    ctx.fillStyle = this.color.spots;
    ctx.fillRect(p, -p, p, p);
    ctx.fillRect(-p * 2, p, p, p);
    ctx.fillRect(p * 2, 0, p, p);

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(s * 0.25, -p, p, p);
    ctx.fillStyle = '#111111';
    ctx.fillRect(s * 0.25 + 1, -p + 1, p - 2, p - 2);

    // Dorsal fin
    ctx.fillStyle = this.color.body;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-p, -p * 2.5, p * 3, p);

    // Pectoral fins
    const finSwing = Math.sin(this.tailPhase * 0.7) * p * 0.5;
    ctx.fillRect(p, p * 1.5 + finSwing, p * 2, p);
    ctx.fillRect(p, -p * 2 - finSwing, p * 2, p);

    ctx.restore();
  }
}
