/**
 * Procedural Studio Product Cutout Renderer (HTML5 Canvas -> DataURL / Three.js Texture)
 * Produces crisp, transparent-background editorial fashion silhouettes with lighting,
 * seams, pockets, ribbing, and hardware — zero external CORS dependencies.
 */

const cache = new Map();

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + percent));
  const b = Math.min(255, Math.max(0, (num & 255) + percent));
  return `rgb(${r},${g},${b})`;
}

function drawNoise(g, w, h, alpha = 0.04) {
  g.save();
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let i = 0; i < 420; i += 1) {
    const x = ((i * 73) % w);
    const y = ((i * 137) % h);
    g.fillRect(x, y, 2, 2);
  }
  g.restore();
}

function drawGarment(g, w, h, shape, color, accent = '#1a1a1a') {
  const cx = w / 2;
  const grad = g.createLinearGradient(w * 0.2, h * 0.1, w * 0.85, h * 0.9);
  grad.addColorStop(0, shade(color, 18));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, shade(color, -26));

  g.save();
  g.fillStyle = grad;
  g.strokeStyle = shade(color, -38);
  g.lineWidth = 3;
  g.lineJoin = 'round';

  const isVest = shape === 'vest';
  const isCoat = shape === 'overcoat';
  const hemY = isCoat ? h * 0.93 : h * 0.84;

  // Main torso + sleeves silhouette
  g.beginPath();
  if (isVest) {
    g.moveTo(cx - 72, h * 0.16);
    g.lineTo(cx - 125, h * 0.22);
    g.quadraticCurveTo(cx - 115, h * 0.36, cx - 120, h * 0.44);
    g.lineTo(cx - 118, hemY);
    g.lineTo(cx + 118, hemY);
    g.lineTo(cx + 120, h * 0.44);
    g.quadraticCurveTo(cx + 115, h * 0.36, cx + 125, h * 0.22);
    g.lineTo(cx + 72, h * 0.16);
  } else {
    g.moveTo(cx - 64, h * 0.16);
    g.lineTo(cx - 148, h * 0.22);
    g.lineTo(cx - 210, h * 0.68);
    g.lineTo(cx - 156, h * 0.71);
    g.lineTo(cx - 118, h * 0.44);
    g.lineTo(cx - 118, hemY);
    g.lineTo(cx + 118, hemY);
    g.lineTo(cx + 118, h * 0.44);
    g.lineTo(cx + 156, h * 0.71);
    g.lineTo(cx + 210, h * 0.68);
    g.lineTo(cx + 148, h * 0.22);
    g.lineTo(cx + 64, h * 0.16);
  }
  g.closePath();
  g.fill();
  g.stroke();

  // Inner subtle vertical drape fold highlights
  const foldGrad = g.createLinearGradient(cx - 100, 0, cx + 100, 0);
  foldGrad.addColorStop(0, 'rgba(0,0,0,0.12)');
  foldGrad.addColorStop(0.28, 'rgba(255,255,255,0.08)');
  foldGrad.addColorStop(0.55, 'rgba(0,0,0,0.05)');
  foldGrad.addColorStop(0.8, 'rgba(255,255,255,0.06)');
  foldGrad.addColorStop(1, 'rgba(0,0,0,0.14)');
  g.save();
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = foldGrad;
  g.fillRect(0, 0, w, h);
  g.restore();

  // Shape-specific architectural details
  if (shape === 'hoodie') {
    // Hood
    g.beginPath();
    g.moveTo(cx - 68, h * 0.17);
    g.quadraticCurveTo(cx - 90, h * 0.06, cx, h * 0.05);
    g.quadraticCurveTo(cx + 90, h * 0.06, cx + 68, h * 0.17);
    g.quadraticCurveTo(cx, h * 0.26, cx - 68, h * 0.17);
    g.fillStyle = shade(color, -10);
    g.fill();
    g.stroke();

    // Inner hood shadow
    g.beginPath();
    g.ellipse(cx, h * 0.15, 42, 22, 0, 0, Math.PI * 2);
    g.fillStyle = shade(color, -40);
    g.fill();

    // Kangaroo pocket
    g.beginPath();
    g.moveTo(cx - 64, h * 0.56);
    g.lineTo(cx + 64, h * 0.56);
    g.lineTo(cx + 82, h * 0.72);
    g.lineTo(cx - 82, h * 0.72);
    g.closePath();
    g.fillStyle = shade(color, -6);
    g.fill();
    g.stroke();

    // Ribbed hem
    g.fillStyle = shade(color, -14);
    g.fillRect(cx - 118, hemY - 26, 236, 26);
  } else if (shape === 'puffer' || shape === 'vest') {
    // Horizontal quilted baffles
    g.strokeStyle = shade(color, -32);
    g.lineWidth = 3;
    for (let y = h * 0.28; y < hemY - 20; y += 54) {
      g.beginPath();
      g.moveTo(cx - 118, y);
      g.lineTo(cx + 118, y);
      g.stroke();
    }
    // Stand collar + center zip
    g.fillStyle = shade(color, -18);
    g.fillRect(cx - 56, h * 0.11, 112, 42);
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx, h * 0.12);
    g.lineTo(cx, hemY);
    g.stroke();
  } else if (shape === 'overcoat' || shape === 'cardigan') {
    // V-neck lapel / placket
    g.fillStyle = shade(color, -45);
    g.beginPath();
    g.moveTo(cx - 46, h * 0.15);
    g.lineTo(cx + 46, h * 0.15);
    g.lineTo(cx, h * 0.38);
    g.closePath();
    g.fill();

    // Center placket line + buttons
    g.strokeStyle = shade(color, -30);
    g.beginPath();
    g.moveTo(cx, h * 0.36);
    g.lineTo(cx, hemY);
    g.stroke();

    g.fillStyle = accent;
    for (let by = h * 0.42; by < hemY - 40; by += 56) {
      g.beginPath();
      g.arc(cx - 14, by, 6, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // Shirt / Overshirt / Sherpa / Trucker collar & pockets
    g.fillStyle = shade(color, 10);
    g.beginPath();
    g.moveTo(cx - 54, h * 0.15);
    g.lineTo(cx - 12, h * 0.24);
    g.lineTo(cx, h * 0.18);
    g.lineTo(cx + 12, h * 0.24);
    g.lineTo(cx + 54, h * 0.15);
    g.closePath();
    g.fill();
    g.stroke();

    // Placket
    g.beginPath();
    g.moveTo(cx, h * 0.19);
    g.lineTo(cx, hemY);
    g.stroke();

    // Chest pockets
    g.fillStyle = shape === 'sherpa' ? '#915730' : shade(color, -8);
    g.fillRect(cx + 24, h * 0.32, 56, 62);
    g.strokeRect(cx + 24, h * 0.32, 56, 62);
    if (shape !== 'sherpa') {
      g.fillRect(cx - 80, h * 0.32, 56, 62);
      g.strokeRect(cx - 80, h * 0.32, 56, 62);
    }
  }

  drawNoise(g, w, h, 0.045);
  g.restore();
}

function drawCap(g, w, h, shape, color) {
  const cx = w / 2;
  const cy = h * 0.56;
  const grad = g.createRadialGradient(cx - 40, cy - 50, 20, cx, cy, 200);
  grad.addColorStop(0, shade(color, 26));
  grad.addColorStop(0.65, color);
  grad.addColorStop(1, shade(color, -32));

  g.save();
  g.fillStyle = grad;
  g.strokeStyle = shade(color, -45);
  g.lineWidth = 3;

  if (shape === 'bucket') {
    // Crown
    g.beginPath();
    g.moveTo(cx - 105, cy - 75);
    g.quadraticCurveTo(cx, cy - 95, cx + 105, cy - 75);
    g.lineTo(cx + 125, cy + 20);
    g.lineTo(cx - 125, cy + 20);
    g.closePath();
    g.fill();
    g.stroke();
    // Sloped brim
    g.beginPath();
    g.moveTo(cx - 125, cy + 16);
    g.lineTo(cx - 185, cy + 80);
    g.quadraticCurveTo(cx, cy + 115, cx + 185, cy + 80);
    g.lineTo(cx + 125, cy + 16);
    g.closePath();
    g.fillStyle = shade(color, -12);
    g.fill();
    g.stroke();
  } else {
    // 6-panel baseball cap crown
    g.beginPath();
    g.arc(cx - 10, cy, 138, Math.PI, 0);
    g.lineTo(cx + 128, cy + 22);
    g.lineTo(cx - 148, cy + 22);
    g.closePath();
    g.fill();
    g.stroke();

    // Top button
    g.beginPath();
    g.arc(cx - 10, cy - 138, 10, 0, Math.PI * 2);
    g.fillStyle = shade(color, -20);
    g.fill();

    // Panel seam
    g.beginPath();
    g.moveTo(cx - 10, cy - 138);
    g.quadraticCurveTo(cx + 35, cy - 60, cx + 45, cy + 20);
    g.stroke();

    // Curved brim
    g.beginPath();
    g.moveTo(cx - 20, cy + 14);
    g.quadraticCurveTo(cx + 135, cy - 5, cx + 210, cy + 56);
    g.quadraticCurveTo(cx + 110, cy + 88, cx - 45, cy + 36);
    g.closePath();
    g.fillStyle = shade(color, -14);
    g.fill();
    g.stroke();
  }
  drawNoise(g, w, h, 0.04);
  g.restore();
}

function drawBag(g, w, h, shape, color) {
  const cx = w / 2;
  const grad = g.createLinearGradient(cx - 140, h * 0.2, cx + 140, h * 0.85);
  grad.addColorStop(0, shade(color, 20));
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, shade(color, -30));

  g.save();
  g.fillStyle = grad;
  g.strokeStyle = shade(color, -45);
  g.lineWidth = 4;

  if (shape === 'tote') {
    // Dual handles
    g.strokeStyle = shade(color, -25);
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(cx - 62, h * 0.35);
    g.quadraticCurveTo(cx - 62, h * 0.1, cx, h * 0.1);
    g.quadraticCurveTo(cx + 62, h * 0.1, cx + 62, h * 0.35);
    g.stroke();

    g.lineWidth = 3;
    g.strokeStyle = shade(color, -42);
    g.beginPath();
    g.roundRect(cx - 132, h * 0.34, 264, 300, 16);
    g.fill();
    g.stroke();
  } else if (shape === 'duffel') {
    g.beginPath();
    g.roundRect(cx - 190, h * 0.38, 380, 210, 68);
    g.fill();
    g.stroke();
    // Straps
    g.fillStyle = '#5a3a22';
    g.fillRect(cx - 95, h * 0.38, 22, 210);
    g.fillRect(cx + 73, h * 0.38, 22, 210);
  } else if (shape === 'sling') {
    g.beginPath();
    g.moveTo(cx - 175, h * 0.42);
    g.quadraticCurveTo(cx, h * 0.52, cx + 175, h * 0.42);
    g.quadraticCurveTo(cx + 150, h * 0.78, cx, h * 0.78);
    g.quadraticCurveTo(cx - 150, h * 0.78, cx - 175, h * 0.42);
    g.closePath();
    g.fill();
    g.stroke();
  } else {
    // Backpack
    g.beginPath();
    g.roundRect(cx - 132, h * 0.18, 264, 380, [110, 110, 28, 28]);
    g.fill();
    g.stroke();
    // Front pocket
    g.fillStyle = shade(color, -10);
    g.beginPath();
    g.roundRect(cx - 102, h * 0.46, 204, 155, 22);
    g.fill();
    g.stroke();
  }
  drawNoise(g, w, h, 0.04);
  g.restore();
}

function drawShoe(g, w, h, shape, color, soleColor = '#efe8db') {
  const cy = h * 0.64;
  const grad = g.createLinearGradient(w * 0.15, cy - 130, w * 0.85, cy + 60);
  grad.addColorStop(0, shade(color, 22));
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, shade(color, -26));

  g.save();
  const ankleTop = shape === 'high' ? cy - 165 : cy - 100;

  // Upper shoe body
  g.fillStyle = grad;
  g.strokeStyle = shade(color, -42);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(w * 0.14, cy + 12);
  g.lineTo(w * 0.16, ankleTop);
  g.quadraticCurveTo(w * 0.28, ankleTop + 18, w * 0.36, cy - 68);
  g.lineTo(w * 0.62, cy - 28);
  g.quadraticCurveTo(w * 0.86, cy - 18, w * 0.88, cy + 16);
  g.closePath();
  g.fill();
  g.stroke();

  // Midsole / Outsole
  g.fillStyle = soleColor;
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.beginPath();
  g.roundRect(w * 0.12, cy + 8, w * 0.78, 42, [8, 14, 16, 10]);
  g.fill();
  g.stroke();

  // Laces / Penny strap
  g.strokeStyle = shape === 'loafer' ? shade(color, -35) : 'rgba(255,255,255,0.75)';
  g.lineWidth = shape === 'loafer' ? 14 : 4;
  if (shape === 'loafer') {
    g.beginPath();
    g.moveTo(w * 0.44, cy - 42);
    g.lineTo(w * 0.56, cy + 8);
    g.stroke();
  } else {
    for (let i = 0; i < 4; i += 1) {
      const lx = w * 0.38 + i * 24;
      const ly = cy - 62 + i * 11;
      g.beginPath();
      g.moveTo(lx, ly);
      g.lineTo(lx + 16, ly + 8);
      g.stroke();
    }
  }
  drawNoise(g, w, h, 0.035);
  g.restore();
}

export function renderProductDataURL(spec) {
  const key = `${spec.cat}|${spec.shape}|${spec.color}|${spec.accent || ''}`;
  if (cache.has(key)) return cache.get(key);

  const isWide = spec.cat === 'shoes' || spec.cat === 'caps';
  const w = 512;
  const h = isWide ? 360 : 640;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');

  if (spec.cat === 'clothing') {
    drawGarment(g, w, h, spec.shape, spec.color, spec.accent);
  } else if (spec.cat === 'caps') {
    drawCap(g, w, h, spec.shape, spec.color);
  } else if (spec.cat === 'bags') {
    drawBag(g, w, h, spec.shape, spec.color);
  } else if (spec.cat === 'shoes') {
    drawShoe(g, w, h, spec.shape, spec.color, spec.accent || '#efe8db');
  }

  const url = canvas.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export function renderEditorialPosterCanvas(title, subtitle, palette) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 680;
  const g = c.getContext('2d');

  // Warm linen paper frame
  g.fillStyle = palette.bg;
  g.fillRect(0, 0, c.width, c.height);

  // Abstract architectural arch + color block
  g.fillStyle = palette.block;
  g.beginPath();
  g.roundRect(56, 64, 400, 440, [200, 200, 0, 0]);
  g.fill();

  g.fillStyle = palette.accent;
  g.beginPath();
  g.arc(256, 290, 96, 0, Math.PI * 2);
  g.fill();

  // Editorial typography
  g.fillStyle = '#1d1a17';
  g.textAlign = 'center';
  g.font = 'italic 900 34px "Archivo", sans-serif';
  g.fillText(title.toUpperCase(), 256, 566);

  g.fillStyle = 'rgba(29,26,23,0.62)';
  g.font = '500 15px "Inter", sans-serif';
  g.fillText(subtitle.toUpperCase(), 256, 602);

  return c;
}
