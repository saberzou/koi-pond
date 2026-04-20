// pond.js — Main orchestrator
import { Fish } from './fish.js?v=17';
import { RippleManager } from './ripple.js';
import { LotusManager } from './lotus.js?v=15';
import { Dragonfly } from './dragonfly.js?v=10';
import { FISH_COUNT, FEAR_RADIUS } from './config.js';
import { BreathingMode } from './breathing.js?v=2';
import { RainManager } from './rain.js';
import { Duck } from './duck.js?v=4';

let canvas, ctx, w, h;
let fish = [];
let ripples;
let lotus;
let dragonfly;
let breathing;
let rainManager;
let duck;
let liquidApp = null;
let weather = 'sunny';
let darknessAlpha = 0;
let lastDragRippleTime = 0;

function generatePondTexture() {
  const dpr = window.devicePixelRatio || 1;
  const off = document.createElement('canvas');
  off.width = w * dpr;
  off.height = h * dpr;
  const c = off.getContext('2d');
  c.scale(dpr, dpr);

  // Base pond color — simple blue-green
  c.fillStyle = '#78A8B8';
  c.fillRect(0, 0, w, h);

  // Soft light patches
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    const gr = w * (0.15 + Math.random() * 0.25);
    const g = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(120,168,184,${0.1 + Math.random() * 0.08})`);
    g.addColorStop(1, 'rgba(120,168,184,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  c.globalCompositeOperation = 'source-over';
  return off.toDataURL('image/png');
}

function initLiquid() {
  window.__pondTextureUrl = generatePondTexture();

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.30/build/backgrounds/liquid1.min.js';
    const canvas = document.getElementById('liquid-canvas');
    if (canvas) {
      const app = LiquidBackground(canvas);
      app.loadImage(window.__pondTextureUrl);
      app.liquidPlane.material.metalness = 0.3;
      app.liquidPlane.material.roughness = 0.5;
      app.liquidPlane.uniforms.displacementScale.value = 0;
      app.setRain(false);
      window.__liquidApp = app;
    }
  `;
  document.body.appendChild(script);
}

function initFish() {
  fish = [];
  for (let i = 0; i < FISH_COUNT; i++) {
    const size = 16 + Math.random() * 4;
    fish.push(new Fish(
      80 + Math.random() * (w - 160),
      80 + Math.random() * (h - 160),
      size, i
    ));
  }
}

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * (window.devicePixelRatio || 1);
  canvas.height = h * (window.devicePixelRatio || 1);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
  if (dragonfly) dragonfly.resize(w, h);
  if (lotus) lotus.generate(w, h);
  if (rainManager) rainManager.resize(w, h);
  if (duck) duck.resize(w, h);
}

function handleInteraction(px, py) {
  if (breathing.isActive()) return; // ignore taps during breathing
  ripples.add(px, py);
  for (const f of fish) {
    f.flee(px, py);
  }
  if (duck) duck.poke(px, py);
  lotus.nudge(px, py, 1.5);
}

function handleDrag(px, py) {
  if (breathing.isActive()) return;
  const now = performance.now();
  if (now - lastDragRippleTime > 50) {
    ripples.add(px, py);
    lastDragRippleTime = now;
  }
  lotus.nudge(px, py, 0.8);
  for (const f of fish) {
    f.flee(px, py);
  }
}

function loop() {
  ctx.clearRect(0, 0, w, h);

  // Breathing mode overrides normal fish movement
  if (breathing.isActive()) {
    breathing.update(fish, w, h);
    if (duck) {
      duck.setBreathingSlowdown(0.3);
      duck.update(w, h, ripples, fish, lotus);
    }
  } else {
    fish.forEach(f => f.update(w, h, fish));
    if (duck) {
      duck.setBreathingSlowdown(1);
      duck.update(w, h, ripples, fish, lotus);
    }
  }

  // Progress ring (drawn behind fish)
  breathing.drawRing(ctx, w, h);

  fish.forEach(f => f.draw(ctx));
  ripples.update();
  ripples.draw(ctx);
  lotus.update();
  lotus.draw(ctx);
  // Duck drawn AFTER lotus — it's on the water surface, never under lily pads
  if (duck) duck.draw(ctx);

  // Dragonfly only in sunny weather, paused during breathing
  if (weather !== 'rainy' && !breathing.isActive()) {
    dragonfly.update();
    dragonfly.draw(ctx);
  }

  // Rain: surface ripples + splashes on lily pads
  if (weather === 'rainy') {
    rainManager.update();
    rainManager.draw(ctx);
    lotus.drawRainDrops(ctx);
  }

  // Darkness overlay for rainy weather
  const targetAlpha = weather === 'rainy' ? 0.25 : 0;
  darknessAlpha += (targetAlpha - darknessAlpha) * 0.03;
  if (darknessAlpha > 0.005) {
    ctx.fillStyle = `rgba(0,0,0,${darknessAlpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Vignette drawn last (top layer)
  breathing.drawVignette(ctx, w, h);

  // Expose current phase for HTML UI label
  if (breathing.isActive()) {
    window.__breathingPhase = breathing.getPhase();
  } else {
    window.__breathingPhase = null;
  }

  // Pulse liquid displacement with breath
  const app = window.__liquidApp;
  if (app) {
    const weatherDisp = weather === 'rainy' ? 1.5 : 0;
    if (breathing.isActive()) {
      const tp = breathing.getTransitionProgress();
      const bp = breathing.getBreathProgress();
      const breathDisp = 0.18 + bp * 0.22;
      app.liquidPlane.uniforms.displacementScale.value = weatherDisp + breathDisp * tp;
    } else {
      const cur = app.liquidPlane.uniforms.displacementScale.value;
      if (Math.abs(cur - weatherDisp) > 0.01) {
        app.liquidPlane.uniforms.displacementScale.value += (weatherDisp - cur) * 0.05;
      }
    }
  }

  requestAnimationFrame(loop);
}

export function init() {
  canvas = document.getElementById('fish-canvas');
  ctx = canvas.getContext('2d');
  ripples = new RippleManager();
  w = window.innerWidth;
  h = window.innerHeight;
  lotus = new LotusManager(w, h);
  dragonfly = new Dragonfly(w, h);
  breathing = new BreathingMode();
  rainManager = new RainManager(w, h);
  duck = new Duck(w * 0.3 + Math.random() * w * 0.4, h * 0.3 + Math.random() * h * 0.4);

  // Weather toggle — controls liquid displacement + rain ripples
  window.setWeather = (mode) => {
    weather = mode;
    if (mode === 'rainy') {
      rainManager.start();
    } else {
      rainManager.stop();
    }
    const app = window.__liquidApp;
    if (app && !breathing.isActive()) {
      if (mode === 'rainy') {
        app.setRain(true);
        app.liquidPlane.uniforms.displacementScale.value = 1.5;
      } else {
        app.setRain(false);
        app.liquidPlane.uniforms.displacementScale.value = 0;
      }
    } else if (app && mode === 'rainy') {
      app.setRain(true);
    } else if (app) {
      app.setRain(false);
    }
  };

  // Breathing toggle — called from HTML button
  window.toggleBreathing = () => {
    if (breathing.isActive()) {
      breathing.deactivate(fish);
      return false;
    } else {
      breathing.activate();
      return true;
    }
  };

  window.isBreathingActive = () => breathing.isActive();

  resize();
  initLiquid();
  initFish();

  window.addEventListener('resize', () => {
    resize();
  });

  canvas.addEventListener('click', e => {
    handleInteraction(e.clientX, e.clientY);
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.touches) {
      handleInteraction(t.clientX, t.clientY);
    }
  }, { passive: false });

  canvas.addEventListener('mousemove', e => {
    if (e.buttons === 1) handleDrag(e.clientX, e.clientY);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.touches) {
      handleDrag(t.clientX, t.clientY);
    }
  }, { passive: false });

  loop();
}

export function addFish(variety) {
  // Only one of each variety allowed
  if (fish.some(f => f.varietyId === variety.nameEn)) return false;
  const margin = 80;
  const x = margin + Math.random() * (w - margin * 2);
  const y = margin + Math.random() * (h - margin * 2);
  const size = 16 + Math.random() * 4;
  const f = Fish.fromVariety(x, y, size, variety);
  f.varietyId = variety.nameEn;
  fish.push(f);
  return true;
}

export function removeFish(varietyNameEn) {
  const idx = fish.findIndex(f => f.varietyId === varietyNameEn);
  if (idx === -1) return false;
  fish.splice(idx, 1);
  return true;
}

export function hasFish(varietyNameEn) {
  return fish.some(f => f.varietyId === varietyNameEn);
}

// Expose globally for HTML button use
if (typeof window !== 'undefined') {
  window.addFish = addFish;
  window.removeFish = removeFish;
  window.hasFish = hasFish;
}
