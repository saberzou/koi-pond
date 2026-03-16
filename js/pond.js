// pond.js — Main orchestrator
import { Fish } from './fish.js?v=11';
import { RippleManager } from './ripple.js';
import { LotusManager } from './lotus.js?v=8';
import { Dragonfly } from './dragonfly.js?v=9';
import { FISH_COUNT, FEAR_RADIUS } from './config.js';

let canvas, ctx, w, h;
let fish = [];
let ripples;
let lotus;
let dragonfly;
let liquidApp = null;
let weather = 'sunny';
let darknessAlpha = 0;

function generatePondTexture() {
  const dpr = window.devicePixelRatio || 1;
  const off = document.createElement('canvas');
  off.width = w * dpr;
  off.height = h * dpr;
  const c = off.getContext('2d');
  c.scale(dpr, dpr);

  // Base pond color — bright sky blue
  c.fillStyle = '#7DD4E8';
  c.fillRect(0, 0, w, h);

  // Soft light patches
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    const gr = w * (0.15 + Math.random() * 0.25);
    const g = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(160,220,235,${0.1 + Math.random() * 0.08})`);
    g.addColorStop(1, 'rgba(160,220,235,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  c.globalCompositeOperation = 'source-over';
  return off.toDataURL('image/png');
}

function initLiquid() {
  const liquidCanvas = document.getElementById('liquid-canvas');
  const dataUrl = generatePondTexture();

  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.30/build/backgrounds/liquid1.min.js';
    const canvas = document.getElementById('liquid-canvas');
    if (canvas) {
      const app = LiquidBackground(canvas);
      app.loadImage('${dataUrl}');
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
    const size = 20 + Math.random() * 12;
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

}

function handleInteraction(px, py) {
  ripples.add(px, py);
  for (const f of fish) {
    f.flee(px, py);
  }
  lotus.nudge(px, py, 1.5);
}

function handleDrag(px, py) {
  ripples.add(px, py);
  lotus.nudge(px, py, 0.8);
  for (const f of fish) {
    f.flee(px, py);
  }
}

function loop() {
  ctx.clearRect(0, 0, w, h);
  fish.forEach(f => f.update(w, h, fish));
  fish.forEach(f => f.draw(ctx));
  ripples.update();
  ripples.draw(ctx);
  lotus.update();
  lotus.draw(ctx);

  // Dragonfly only in sunny weather
  if (weather !== 'rainy') {
    dragonfly.update();
    dragonfly.draw(ctx);
  }

  // Rain splashes on lily pads
  if (weather === 'rainy') {
    lotus.drawRainDrops(ctx);
  }

  // Darkness overlay for rainy weather
  const targetAlpha = weather === 'rainy' ? 0.15 : 0;
  darknessAlpha += (targetAlpha - darknessAlpha) * 0.03;
  if (darknessAlpha > 0.005) {
    ctx.fillStyle = `rgba(0,0,0,${darknessAlpha})`;
    ctx.fillRect(0, 0, w, h);
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

  // Weather toggle — controls liquid displacement + rain ripples
  window.setWeather = (mode) => {
    weather = mode;
    const app = window.__liquidApp;
    if (app) {
      if (mode === 'rainy') {
        app.setRain(true);
        app.liquidPlane.uniforms.displacementScale.value = 1.5;
      } else {
        app.setRain(false);
        app.liquidPlane.uniforms.displacementScale.value = 0;
      }
    }
  };

  resize();
  initLiquid();
  initFish();

  window.addEventListener('resize', () => {
    resize();
    // Re-init liquid on resize for texture match
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
