// breathing.js — Breathing Mode for Koi Pond (Box Breathing: 4-4-4-4)

const PHASE_DURATION = 4000; // ms per phase
const TRANSITION_DURATION = 2000; // ms for in/out transition
const PHASES = ['inhale', 'holdExpanded', 'exhale', 'holdContracted'];
const BREATHING_SPEED_FACTOR = 0.4;
const TAIL_SPEED_CONST = 0.08; // mirrors config.js TAIL_SPEED

export class BreathingMode {
  constructor() {
    this._active = false;
    this._deactivating = false;
    this._transitionProgress = 0; // 0 = off, 1 = fully active

    this._transitionStartTime = 0;
    this._deactivateStartTime = 0;

    this._phase = 'inhale';
    this._phaseProgress = 0;
    this._phaseStartTime = 0;

    this._circleRadius = 80;
    this._orbitAngle = 0;

    // Per-fish placement data (Map so WeakMap-style cleanup happens via clear())
    this._fishData = new Map();
  }

  activate() {
    if (this._active && !this._deactivating) return;
    this._active = true;
    this._deactivating = false;
    this._transitionProgress = 0;
    this._transitionStartTime = performance.now();
    this._phase = 'inhale';
    this._phaseProgress = 0;
    this._phaseStartTime = performance.now();
    this._orbitAngle = 0;
    this._fishData.clear();
  }

  deactivate(fish) {
    if (!this._active || this._deactivating) return;
    this._deactivating = true;
    this._deactivateStartTime = performance.now();
    // Give fish a direction to wander toward when released
    if (fish) {
      for (const f of fish) {
        f.targetAngle = Math.random() * Math.PI * 2;
        f.wanderTimer = 90;
      }
    }
  }

  isActive() {
    return this._active;
  }

  // ---- Easing ----
  _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Returns 0 (contracted) .. 1 (expanded) for current breath state
  getBreathProgress() {
    if (!this._active) return 0;
    switch (this._phase) {
      case 'inhale':         return this._easeInOut(this._phaseProgress);
      case 'holdExpanded':   return 1;
      case 'exhale':         return 1 - this._easeInOut(this._phaseProgress);
      case 'holdContracted': return 0;
      default:               return 0;
    }
  }

  getPhase()              { return this._phase; }
  getPhaseProgress()      { return this._phaseProgress; }
  getTransitionProgress() { return this._transitionProgress; }

  // ---- Per-fish init ----
  _initFish(f, index, total) {
    if (!this._fishData.has(f)) {
      const baseAngle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      this._fishData.set(f, {
        baseAngle,
        radiusOffset: (Math.random() - 0.5) * 18,  // natural wobble
        orbitSpeed:   0.0014 + Math.random() * 0.002,
        angleOffset:  0,
      });
    }
  }

  // ---- Update (call instead of fish.update() when active) ----
  update(fish, w, h) {
    if (!this._active) return;

    const now = performance.now();

    // --- Transition progress ---
    if (this._deactivating) {
      const elapsed = now - this._deactivateStartTime;
      this._transitionProgress = Math.max(0, 1 - elapsed / TRANSITION_DURATION);

      if (this._transitionProgress <= 0) {
        // Fully deactivated
        this._active = false;
        this._deactivating = false;
        this._fishData.clear();
        for (const f of fish) {
          if (f._breathOrigSpeed !== undefined) {
            f.baseSpeed = f._breathOrigSpeed;
            delete f._breathOrigSpeed;
          }
          f.fleeing = false;
        }
        return;
      }
    } else {
      const elapsed = now - this._transitionStartTime;
      this._transitionProgress = Math.min(1, elapsed / TRANSITION_DURATION);
    }

    // --- Save original speeds on first frame ---
    for (const f of fish) {
      if (f._breathOrigSpeed === undefined) {
        f._breathOrigSpeed = f.baseSpeed;
      }
    }

    // --- Phase timer ---
    if (!this._deactivating) {
      const phaseElapsed = now - this._phaseStartTime;
      this._phaseProgress = Math.min(1, phaseElapsed / PHASE_DURATION);
      if (this._phaseProgress >= 1) {
        const idx = PHASES.indexOf(this._phase);
        this._phase = PHASES[(idx + 1) % PHASES.length];
        this._phaseProgress = 0;
        this._phaseStartTime = now;
      }
    }

    // --- Circle radius ---
    const breathProgress = this.getBreathProgress();
    const minR = Math.min(w, h) * 0.115;
    const maxR = Math.min(w, h) * 0.225;
    const targetRadius = minR + (maxR - minR) * breathProgress;
    this._circleRadius += (targetRadius - this._circleRadius) * 0.05;

    // --- Global slow orbit ---
    const tp = this._transitionProgress;
    this._orbitAngle += 0.0018 * tp;

    const cx = w / 2;
    const cy = h / 2;

    // --- Position fish ---
    fish.forEach((f, i) => {
      this._initFish(f, i, fish.length);
      const data = this._fishData.get(f);

      // Speed blend: normal → 40% of normal
      const origSpeed = f._breathOrigSpeed || f.baseSpeed;
      f.baseSpeed = origSpeed * (1 - tp) + origSpeed * BREATHING_SPEED_FACTOR * tp;

      // Individual orbit offset
      data.angleOffset += data.orbitSpeed * tp;
      const angle = data.baseAngle + this._orbitAngle + data.angleOffset;
      const r     = this._circleRadius + data.radiusOffset;

      const tx = cx + Math.cos(angle) * r;
      const ty = cy + Math.sin(angle) * r;

      const dx = tx - f.x;
      const dy = ty - f.y;

      // Lerp force toward formation (weakens during deactivation)
      const lerpForce = 0.025 * tp;

      if (this._deactivating) {
        // Blend controlled → natural wandering
        const naturalVx = Math.cos(f.targetAngle) * f.baseSpeed;
        const naturalVy = Math.sin(f.targetAngle) * f.baseSpeed;
        f.vx = dx * lerpForce + naturalVx * (1 - tp) * 0.5;
        f.vy = dy * lerpForce + naturalVy * (1 - tp) * 0.5;
      } else {
        f.vx = dx * lerpForce;
        f.vy = dy * lerpForce;
      }

      f.x += f.vx;
      f.y += f.vy;

      // Smooth angle toward movement direction
      const spd = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      if (spd > 0.1) {
        const faceAngle = Math.atan2(f.vy, f.vx);
        let diff = faceAngle - f.angle;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * 0.08;
      }

      // Tail animation (still animates, but slower)
      f.tailPhase += TAIL_SPEED_CONST * (1 + spd * 0.5) * (0.35 + 0.65 * (1 - tp * 0.45));
    });
  }

  // ---- Draw: progress ring (call BEFORE fish draw) ----
  drawRing(ctx, w, h) {
    if (!this._active) return;
    const t = this._transitionProgress;
    if (t < 0.01) return;

    const cx = w / 2;
    const cy = h / 2;
    const ringR = this._circleRadius + 26;

    // Track (faint circle)
    ctx.save();
    ctx.globalAlpha = 0.3 * t;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Progress arc
    if (!this._deactivating && this._phaseProgress > 0.002) {
      ctx.save();
      ctx.globalAlpha = 0.72 * t;
      ctx.beginPath();
      const sa = -Math.PI / 2;
      const ea = sa + this._phaseProgress * Math.PI * 2;
      ctx.arc(cx, cy, ringR, sa, ea);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---- Draw: vignette (call AFTER fish draw) ----
  drawVignette(ctx, w, h) {
    if (!this._active) return;
    const t = this._transitionProgress;
    if (t < 0.01) return;

    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    const vg = ctx.createRadialGradient(
      cx, cy, Math.min(w, h) * 0.2,
      cx, cy, Math.max(w, h) * 0.78
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${0.28 * t})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
