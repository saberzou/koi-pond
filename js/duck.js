// duck.js — White duck swimming on the pond surface
import { FEAR_FORCE, DUCK_SPEED, DUCK_WAKE_INTERVAL_MS, DUCK_AVOID_RADIUS, DUCK_NUDGE_RADIUS } from './config.js';

const DUCK_MAX_SPEED = 2.5;
const DUCK_TURN_RATE = 0.015;
// Real proportions: a duck body ~50-55cm vs koi ~60cm, but from above
// the duck's feather spread makes it appear ~2.5x wider than a fish.
// Fish are 16-20px. Duck body length should be similar (~18px effective)
// but total visual footprint much rounder/wider → 40px gives the right
// oval silhouette that reads as "duck, not fish" at zen scale.
const DUCK_SIZE = 55;
const DUCK_AVOIDANCE_FORCE = FEAR_FORCE * 0.35;
const CURIOSITY_BOOST = 1.8;

export class Duck {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = DUCK_SIZE;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = DUCK_SPEED;
    this.baseSpeed = DUCK_SPEED;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.targetAngle = this.angle;
    this.wanderTimer = 0;
    this.lastWakeTime = 0;

    // Head bob animation
    this.bobPhase = 0;
    this.bobActive = false;
    this.bobTimer = 0;

    // Paddle animation
    this.paddlePhase = Math.random() * Math.PI * 2;

    // Breathing mode
    this.breathingSlowdown = 1;
  }

  // Duck doesn't flee — it gets curious
  poke(px, py) {
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < DUCK_NUDGE_RADIUS && dist > 0) {
      // Brief speed boost + head bob
      this.speed = this.baseSpeed * CURIOSITY_BOOST;
      this.bobActive = true;
      this.bobTimer = 30; // frames of bobbing
      this.bobPhase = 0;
    }
  }

  update(w, h, ripples, fish, lotusManager) {
    // Wander steering
    this.wanderTimer -= 1;
    if (this.wanderTimer <= 0) {
      this.targetAngle += (Math.random() - 0.5) * 1.0;
      this.wanderTimer = 100 + Math.random() * 200;
    }

    const ta = this.targetAngle;
    const ax = Math.cos(ta) * this.baseSpeed * this.breathingSlowdown;
    const ay = Math.sin(ta) * this.baseSpeed * this.breathingSlowdown;
    this.vx += (ax - this.vx) * DUCK_TURN_RATE;
    this.vy += (ay - this.vy) * DUCK_TURN_RATE;

    // Speed decay back to base
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > this.baseSpeed * this.breathingSlowdown * 1.1) {
      this.vx *= 0.98;
      this.vy *= 0.98;
    }

    // Clamp
    const spdNow = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spdNow > DUCK_MAX_SPEED) {
      this.vx = (this.vx / spdNow) * DUCK_MAX_SPEED;
      this.vy = (this.vy / spdNow) * DUCK_MAX_SPEED;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Smooth angle
    if (spdNow > 0.1) {
      const target = Math.atan2(this.vy, this.vx);
      let diff = target - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * 0.06;
    }

    // Edge avoidance — larger margin for bigger duck
    const margin = 100;
    const softEdge = 0.015;
    if (this.x < margin) { this.vx += softEdge; this.targetAngle = 0; }
    if (this.x > w - margin) { this.vx -= softEdge; this.targetAngle = Math.PI; }
    if (this.y < margin) { this.vy += softEdge; this.targetAngle = Math.PI / 2; }
    if (this.y > h - margin) { this.vy -= softEdge; this.targetAngle = -Math.PI / 2; }

    // Lotus avoidance — duck swims around lily pads, never under them
    if (lotusManager && lotusManager.pads) {
      for (const pad of lotusManager.pads) {
        const dx = this.x - pad.x;
        const dy = this.y - pad.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const avoidDist = pad.size + this.size * 0.6;
        if (dist < avoidDist && dist > 0) {
          const strength = (1 - dist / avoidDist) * 0.04;
          this.vx += (dx / dist) * strength;
          this.vy += (dy / dist) * strength;
        }
      }
    }

    // Paddle phase
    this.paddlePhase += 0.06 * (1 + spdNow * 0.5);

    // Head bob
    if (this.bobActive) {
      this.bobPhase += 0.4;
      this.bobTimer--;
      if (this.bobTimer <= 0) this.bobActive = false;
    }

    // Wake ripples — subtle trail while moving
    const now = performance.now();
    if (ripples && spdNow > 0.2 && now - this.lastWakeTime > DUCK_WAKE_INTERVAL_MS) {
      // Place ripple slightly behind the duck
      const rx = this.x - Math.cos(this.angle) * this.size * 0.6;
      const ry = this.y - Math.sin(this.angle) * this.size * 0.6;
      ripples.add(rx, ry, 0.5); // smaller wake ripples
      this.lastWakeTime = now;
    }

    // Push fish gently away
    if (fish) {
      for (const f of fish) {
        const dx = f.x - this.x;
        const dy = f.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DUCK_AVOID_RADIUS && dist > 0) {
          const strength = (1 - dist / DUCK_AVOID_RADIUS) * DUCK_AVOIDANCE_FORCE;
          f.vx += (dx / dist) * strength * 0.3;
          f.vy += (dy / dist) * strength * 0.3;
        }
      }
    }
  }

  setBreathingSlowdown(factor) {
    this.breathingSlowdown = factor;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const s = this.size;
    const bob = this.bobActive ? Math.sin(this.bobPhase) * 1.5 : 0;

    // --- Shadow ---
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.save();
    ctx.translate(-3, 4);
    ctx.scale(1.05, 1.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Wake V-pattern (subtle water disturbance behind duck) ---
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 1;
    const wakeLen = s * 1.2;
    // Left wake line
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, 0);
    ctx.lineTo(-wakeLen, -s * 0.5);
    ctx.stroke();
    // Right wake line
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, 0);
    ctx.lineTo(-wakeLen, s * 0.5);
    ctx.stroke();

    // --- Body (white oval) ---
    ctx.globalAlpha = 1;
    const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
    bodyGrad.addColorStop(0, '#F0E4D0');
    bodyGrad.addColorStop(0.6, '#E8DCC8');
    bodyGrad.addColorStop(1, '#DED4C0');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle body edge
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#C8B8A4';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    // --- Wing lines (subtle feather texture) ---
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#A09080';
    ctx.lineWidth = 0.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(-s * 0.05, side * s * 0.08, s * 0.35, s * 0.15, side * 0.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- Tail feathers (small tuft at the back) ---
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#DED4C0';
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, 0);
    ctx.lineTo(-s * 0.68, -s * 0.08);
    ctx.quadraticCurveTo(-s * 0.72, 0, -s * 0.68, s * 0.08);
    ctx.closePath();
    ctx.fill();

    // Tail tip highlight
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#E8DCC8';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(-s * 0.65, -s * 0.04);
    ctx.quadraticCurveTo(-s * 0.68, 0, -s * 0.65, s * 0.04);
    ctx.closePath();
    ctx.fill();

    // --- Neck + Head (small circle extending forward) ---
    ctx.globalAlpha = 1;
    const headX = s * 0.42 + bob;
    const headY = 0;
    const headR = s * 0.17;

    // Neck connection
    ctx.fillStyle = '#E8DCC8';
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.1);
    ctx.quadraticCurveTo(headX - headR * 0.3, -headR * 0.6, headX, headY - headR * 0.5);
    ctx.lineTo(headX, headY + headR * 0.5);
    ctx.quadraticCurveTo(headX - headR * 0.3, headR * 0.6, s * 0.35, s * 0.1);
    ctx.closePath();
    ctx.fill();

    // Head circle
    ctx.fillStyle = '#F0E4D0';
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // --- Beak (small orange triangle) ---
    ctx.globalAlpha = 1;
    const beakX = headX + headR * 0.8 + bob * 0.5;
    ctx.fillStyle = '#D4722A';
    ctx.beginPath();
    ctx.moveTo(beakX + s * 0.12, 0);
    ctx.lineTo(beakX - s * 0.02, -s * 0.05);
    ctx.lineTo(beakX - s * 0.02, s * 0.05);
    ctx.closePath();
    ctx.fill();

    // --- Eyes ---
    ctx.globalAlpha = 1;
    const eyeR = s * 0.025;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(headX + headR * 0.25, headY + side * headR * 0.45, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();
    }

    // --- Paddle feet (subtle, visible below body) ---
    ctx.globalAlpha = 0.2;
    const paddleSwing = Math.sin(this.paddlePhase) * 0.3;
    ctx.fillStyle = '#D4722A';
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-s * 0.15, side * s * 0.38);
      ctx.rotate(paddleSwing * side);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  resize(w, h) {
    // Keep duck in bounds after resize
    if (this.x > w - 40) this.x = w - 80;
    if (this.y > h - 40) this.y = h - 80;
  }
}
