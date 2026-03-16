// pond.js — Main orchestrator
import { Fish } from './fish.js';
import { RippleManager } from './ripple.js';
import { FISH_COUNT, FEAR_RADIUS } from './config.js';

let canvas, ctx, w, h;
let fish = [];
let ripples;
let liquidApp = null;

function generatePondTexture() {
  const dpr = window.devicePixelRatio || 1;
  const off = document.createElement('canvas');
  off.width = w * dpr;
  off.height = h * dpr;
  const c = off.getContext('2d');
  c.scale(dpr, dpr);

  // Base pond color — misty blue-green palette
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#4A6E72');   // 青灰
  bg.addColorStop(0.5, '#2A4F52'); // 暗青绿
  bg.addColorStop(1, '#1B3A40');   // 深青
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  // Soft light patches (caustics feel)
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    const gr = w * (0.15 + Math.random() * 0.25);
    const g = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(122,155,165,${0.12 + Math.random() * 0.08})`); // #7A9BA5
    g.addColorStop(1, 'rgba(74,110,114,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  // Misty highlight center
  c.globalCompositeOperation = 'screen';
  const cg = c.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.45);
  cg.addColorStop(0, 'rgba(184,200,200,0.08)'); // #B8C8C8
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = cg;
  c.fillRect(0, 0, w, h);

  // Secondary light patch
  c.globalCompositeOperation = 'screen';
  const cg2 = c.createRadialGradient(w * 0.3, h * 0.7, 0, w * 0.3, h * 0.7, w * 0.3);
  cg2.addColorStop(0, 'rgba(92,128,133,0.1)'); // #5C8085
  cg2.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = cg2;
  c.fillRect(0, 0, w, h);

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
      app.liquidPlane.uniforms.displacementScale.value = 1.5;
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
}

function handleInteraction(px, py) {
  ripples.add(px, py);
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
  requestAnimationFrame(loop);
}

export function init() {
  canvas = document.getElementById('fish-canvas');
  ctx = canvas.getContext('2d');
  ripples = new RippleManager();
  w = window.innerWidth;
  h = window.innerHeight;

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

  loop();
}
