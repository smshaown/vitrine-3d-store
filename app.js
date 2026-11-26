import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import { buildProducts, CATEGORY_LABELS, IMG_DIR } from './data.js';

const ROOM = { x: 4.6, z0: -4.6, z1: 4.2, h: 3.9 };
const RAIL = { y: 2.02, z: -4.22, gap: 0.62 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

/* ==========================================================================
   Procedural Canvas Textures (Plaster, Concrete, Oak, Wall Logo, Cones)
   ========================================================================== */

function makeCanvasTex(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawFn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function createPlasterTexture(baseHex, strength = 1) {
  return makeCanvasTex(512, 256, (g, w, h) => {
    g.fillStyle = baseHex;
    g.fillRect(0, 0, w, h);

    // Subtle tonal mottled plaster clouds
    let seed = 17;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i += 1) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 18 + rnd() * 68;
      const bright = rnd() > 0.5 ? 255 : 0;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${bright},${bright},${bright},${0.025 * strength})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Corner/floor ambient occlusion gradient
    const aoTop = g.createLinearGradient(0, 0, 0, h * 0.25);
    aoTop.addColorStop(0, `rgba(0,0,0,${0.18 * strength})`);
    aoTop.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = aoTop;
    g.fillRect(0, 0, w, h * 0.25);

    const aoBot = g.createLinearGradient(0, h * 0.8, 0, h);
    aoBot.addColorStop(0, 'rgba(0,0,0,0)');
    aoBot.addColorStop(1, `rgba(0,0,0,${0.22 * strength})`);
    g.fillStyle = aoBot;
    g.fillRect(0, h * 0.8, w, h * 0.2);
  });
}

function createWoodTexture(baseHex) {
  return makeCanvasTex(512, 128, (g, w, h) => {
    g.fillStyle = baseHex;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70, 42, 18, 0.14)';
    for (let y = 0; y < h; y += 3) {
      g.lineWidth = 1 + (y % 2);
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.33, y + Math.sin(y) * 2, w * 0.66, y - Math.cos(y) * 2, w, y);
      g.stroke();
    }
  });
}

function createWallSignTexture(text, inkHex) {
  return makeCanvasTex(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = 'italic 900 132px "Archivo", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(255, 212, 154, 0.55)';
    g.shadowBlur = 24;
    g.fillStyle = inkHex;
    g.fillText(text.toUpperCase(), w / 2, h / 2);
  });
}

function createLabelTexture(title, subtitle, darkBg = true) {
  return makeCanvasTex(384, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center';
    g.fillStyle = darkBg ? 'rgba(255, 255, 255, 0.92)' : 'rgba(17, 17, 17, 0.88)';
    g.font = '600 26px "Inter", sans-serif';
    g.fillText(title, w / 2, 38);
    g.fillStyle = darkBg ? 'rgba(255, 255, 255, 0.55)' : 'rgba(17, 17, 17, 0.55)';
    g.font = '400 17px "Inter", sans-serif';
    g.fillText(subtitle.toUpperCase(), w / 2, 70);
  });
}

function createConeTexture() {
  return makeCanvasTex(128, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255, 232, 196, 0.9)');
    grad.addColorStop(0.55, 'rgba(255, 212, 154, 0.22)');
    grad.addColorStop(1, 'rgba(255, 212, 154, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

/* ==========================================================================
   Vitrine 3D Virtual Store Controller
   ========================================================================== */

class VitrineStore {
  constructor(root, products) {
    this.root = root;
    this.items = products;

    this.canvas = root.querySelector('[data-canvas]');
    this.captionEl = root.querySelector('[data-caption]');
    this.bagBtn = root.querySelector('[data-bag-btn]');
    this.bagCountEl = root.querySelector('[data-bag-count]');
    this.menuBtns = Array.from(root.querySelectorAll('[data-go]'));
    this.listEl = root.querySelector('[data-list]');
    this.flatEl = root.querySelector('[data-flat]');

    this.panelEl = root.querySelector('[data-panel]');
    this.grabEl = root.querySelector('[data-grab]');
    this.pagerEl = root.querySelector('[data-pager]');
    this.pagerTextEl = root.querySelector('[data-pager-text]');
    this.prevBtn = root.querySelector('[data-prev]');
    this.nextBtn = root.querySelector('[data-next]');
    this.closeBtn = root.querySelector('[data-close]');
    this.pCatEl = root.querySelector('[data-p-cat]');
    this.pNameEl = root.querySelector('[data-p-name]');
    this.pPriceEl = root.querySelector('[data-p-price]');
    this.pKindEl = root.querySelector('[data-p-kind]');
    this.galEl = root.querySelector('[data-gal]');
    this.optsEl = root.querySelector('[data-opts]');
    this.planWrapEl = root.querySelector('[data-plan-wrap]');
    this.planSelectEl = root.querySelector('[data-plan-select]');
    this.qtyMinusBtn = root.querySelector('[data-qty-minus]');
    this.qtyPlusBtn = root.querySelector('[data-qty-plus]');
    this.qtyInput = root.querySelector('[data-qty-input]');
    this.addBtn = root.querySelector('[data-add]');
    this.viewCartEl = root.querySelector('[data-view-cart]');

    this.zoomEl = root.querySelector('[data-zoom]');
    this.zoomImg = root.querySelector('[data-zoom-img]');
    this.zoomCountEl = root.querySelector('[data-zoom-count]');
    this.zoomCloseBtn = root.querySelector('[data-zoom-close]');
    this.zoomPrevBtn = root.querySelector('[data-zoom-prev]');
    this.zoomNextBtn = root.querySelector('[data-zoom-next]');
    this.toastEl = root.querySelector('[data-toast]');

    this.st = {
      mode: 'store',
      open: -1,
      hover: -1,
      yaw: 0,
      yawTo: 0,
      pitch: 0,
      pitchTo: 0,
      pan: 0,
      panTo: 0,
      drag: null
    };

    this.selectedSwatch = 0;
    this.selectedSize = '';
    this.zoomImages = [];
    this.zoomIdx = 0;
    this.cartCount = 0;
    this.pieces = [];
    this.pickMeshes = [];
    this.disposables = [];
    this.toastTimer = null;
    this.lastFocused = null;
    this.swappedPiece = null;

    this.populateAccessibleAndFallback();

    // WebGL2 capability check -> graceful 2D grid fallback
    if (!this.hasWebGL2()) {
      this.root.classList.add('is-flat');
      return;
    }

    try {
      this.buildScene();
      this.wireEvents();
      this.startLoop();
    } catch (err) {
      console.warn('[Vitrine] Falling back to 2D grid:', err);
      this.root.classList.add('is-flat');
    }
  }

  hasWebGL2() {
    try {
      const c = document.createElement('canvas');
      return Boolean(window.WebGL2RenderingContext && c.getContext('webgl2'));
    } catch {
      return false;
    }
  }

  populateAccessibleAndFallback() {
    const listFrag = document.createDocumentFragment();
    const gridFrag = document.createDocumentFragment();

    this.items.forEach((item, index) => {
      // Accessible keyboard list button
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.pick = String(index);
      btn.textContent = item.title;
      btn.addEventListener('click', () => this.openProduct(index, btn));
      li.appendChild(btn);
      listFrag.appendChild(li);

      // Fallback 2D grid card
      const a = document.createElement('a');
      a.className = 'vs-card';
      a.href = '#demo';
      a.innerHTML = `
        <span class="vs-card-pic"><img src="${item.image}" alt="${item.title}" loading="lazy"></span>
        <span class="vs-card-name">${item.title}</span>
        <span class="vs-card-price">${formatMoney(item.price)}</span>
      `;
      gridFrag.appendChild(a);
    });

    this.listEl.appendChild(listFrag);
    this.flatEl.appendChild(gridFrag);
  }

  /* ========================================================================
     Three.js 3D Boutique Construction
     ======================================================================== */

  buildScene() {
    const css = getComputedStyle(this.root);
    const getCol = (name, fallback) => css.getPropertyValue(name).trim() || fallback;

    const WALL_HEX = getCol('--vs-wall', '#e8e1d6');
    const FEATURE_HEX = getCol('--vs-feature', '#26342d');
    const FLOOR_HEX = getCol('--vs-floor', '#a89e91');
    const WOOD_HEX = getCol('--vs-wood', '#bc9f7c');
    const METAL_HEX = getCol('--vs-metal', '#b8955a');
    const GLOW_HEX = getCol('--vs-glow', '#ffd49a');
    const LOGO_HEX = getCol('--vs-logo-ink', '#efe5cf');

    const isLightDevice =
      window.matchMedia('(max-width: 760px)').matches ||
      (navigator.hardwareConcurrency || 8) <= 4;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLightDevice ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !isLightDevice;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(WALL_HEX).multiplyScalar(0.55);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.05, 60);
    this.camPos = new THREE.Vector3(0, 1.62, 1.3);
    this.camLook = new THREE.Vector3(0, 1.55, -4.3);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2(-10, -10);
    this.texLoader = new THREE.TextureLoader();
    this.texLoader.setCrossOrigin('anonymous');

    // Textures
    const wallTex = createPlasterTexture(WALL_HEX, 1);
    const featureTex = createPlasterTexture(FEATURE_HEX, 0.9);
    const floorTex = createPlasterTexture(FLOOR_HEX, 0.65);
    const woodTex = createWoodTexture(WOOD_HEX);
    const coneTex = createConeTexture();
    const logoTex = createWallSignTexture('VITRINE', LOGO_HEX);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88, metalness: 0.02 });
    const featureMat = new THREE.MeshStandardMaterial({ map: featureTex, roughness: 0.84, metalness: 0.05 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.45, metalness: 0.08 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: '#d8d1c6', roughness: 0.95 });
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.04 });
    const brassMat = new THREE.MeshStandardMaterial({ color: METAL_HEX, roughness: 0.28, metalness: 0.86 });
    const darkNicheMat = new THREE.MeshStandardMaterial({ color: '#242b26', roughness: 0.82 });
    const coneMat = new THREE.MeshBasicMaterial({
      map: coneTex,
      color: GLOW_HEX,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const W = ROOM.x * 2;
    const D = ROOM.z1 - ROOM.z0;
    const H = ROOM.h;
    const midZ = (ROOM.z0 + ROOM.z1) / 2;

    // Floor & Ceiling
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, midZ);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, H, midZ);
    this.scene.add(ceiling);

    // 4 Room Walls
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), featureMat);
    backWall.position.set(0, H / 2, ROOM.z0);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM.x, H / 2, midZ);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(ROOM.x, H / 2, midZ);
    this.scene.add(rightWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, H / 2, ROOM.z1);
    this.scene.add(frontWall);

    // Ceiling Linear LED Strip
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(W - 0.6, 0.03, 0.05),
      new THREE.MeshBasicMaterial({ color: '#fff8ee' })
    );
    ledStrip.position.set(0, H - 0.02, -1.4);
    this.scene.add(ledStrip);

    // Illuminated VITRINE Wall Logo
    const logoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.7),
      new THREE.MeshBasicMaterial({ map: logoTex, transparent: true })
    );
    logoPlane.position.set(-1.35, 3.05, ROOM.z0 + 0.02);
    this.scene.add(logoPlane);

    // Warm Oak Floor Plinth & Brass Rail (Clothing Wall)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 0.56), woodMat);
    plinth.position.set(0, 0.07, ROOM.z0 + 0.34);
    this.scene.add(plinth);

    const railRod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 7.0, 20), brassMat);
    railRod.rotation.z = Math.PI / 2;
    railRod.position.set(0, RAIL.y, RAIL.z);
    this.scene.add(railRod);

    // Rail End Brackets
    [-3.45, 3.45].forEach((bx) => {
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 12), brassMat);
      bracket.rotation.x = Math.PI / 2;
      bracket.position.set(bx, RAIL.y, ROOM.z0 + 0.21);
      this.scene.add(bracket);
    });

    // Potted Olive Tree in Front-Left Corner
    this.buildOliveTree(-3.95, ROOM.z0 + 0.72);

    // Lighting + Volumetric Spotlight Cones
    const hemi = new THREE.HemisphereLight('#fff6ea', '#706356', 1.15);
    this.scene.add(hemi);

    const addSpot = (x, y, z, tx, ty, tz, power, angle = 0.45, withCone = true) => {
      const s = new THREE.SpotLight(GLOW_HEX, power, 10, angle, 0.85, 1.8);
      s.position.set(x, y, z);
      s.target.position.set(tx, ty, tz);
      this.scene.add(s, s.target);

      if (withCone) {
        const from = new THREE.Vector3(x, H - 0.15, z);
        const target = new THREE.Vector3(tx, ty, tz);
        const dir = target.clone().sub(from);
        const len = dir.length() * 0.88;
        dir.normalize();
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(Math.tan(angle) * len * 0.68, len, 32, 1, true),
          coneMat
        );
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
        cone.position.copy(from).addScaledVector(dir, len / 2);
        this.scene.add(cone);
      }
    };

    addSpot(-2.2, H - 0.1, -2.5, -2.1, 1.5, ROOM.z0, 14, 0.44, true);
    addSpot(0.1, H - 0.1, -2.5, 0.1, 1.5, ROOM.z0, 16, 0.44, true);
    addSpot(2.3, H - 0.1, -2.5, 2.3, 1.5, ROOM.z0, 14, 0.44, true);
    addSpot(-2.6, H - 0.1, -0.4, -ROOM.x, 1.7, -0.4, 12, 0.5, false);
    addSpot(2.6, H - 0.1, -0.6, ROOM.x, 1.6, -0.6, 13, 0.5, false);

    // Build All 4 Product Displays
    this.buildClothingWall(woodMat, brassMat);
    this.buildCapsWall(woodMat, brassMat);
    this.buildBagsWall(woodMat);
    this.buildShoesWall(darkNicheMat, brassMat);
    this.buildPosters();

    this.resize();
    requestAnimationFrame(() => this.root.classList.add('is-ready'));
  }

  buildOliveTree(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.24, 0.55, 24),
      new THREE.MeshStandardMaterial({ color: '#e3dcd0', roughness: 0.9 })
    );
    pot.position.y = 0.275;
    group.add(pot);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.048, 1.35, 10),
      new THREE.MeshStandardMaterial({ color: '#5c4430', roughness: 0.92 })
    );
    trunk.position.y = 1.15;
    trunk.rotation.z = 0.06;
    group.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({
      color: '#5c6e46',
      roughness: 0.78,
      side: THREE.DoubleSide
    });
    const leafGeo = new THREE.PlaneGeometry(0.11, 0.045);
    let seed = 42;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    for (let i = 0; i < 160; i += 1) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const a = rnd() * Math.PI * 2;
      const r = 0.12 + rnd() * 0.45;
      const y = 1.55 + (rnd() - 0.35) * 0.92;
      leaf.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      leaf.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
      group.add(leaf);
    }

    this.scene.add(group);
  }

  loadProductTexture(url, onReady) {
    this.texLoader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        onReady(tex);
      },
      undefined,
      () => {
        // Fallback neutral swatch texture if offline
        const fallback = makeCanvasTex(256, 256, (g, w, h) => {
          g.fillStyle = '#d4ccc0';
          g.fillRect(24, 24, w - 48, h - 48);
        });
        onReady(fallback);
      }
    );
  }

  registerPiece(index, group, mesh, mat, basePos, stepDir) {
    mesh.userData.itemIndex = index;
    this.pickMeshes.push(mesh);
    this.pieces[index] = {
      index,
      group,
      mesh,
      mat,
      basePos: basePos.clone(),
      stepDir: stepDir.clone(),
      stepAmount: 0,
      origMap: null,
      wantUrl: null
    };
  }

  buildClothingWall(woodMat, brassMat) {
    const indices = this.items
      .map((it, idx) => (it.cat === 'clothing' ? idx : -1))
      .filter((i) => i >= 0);

    const totalW = (indices.length - 1) * RAIL.gap;
    indices.forEach((itemIdx, posIdx) => {
      const item = this.items[itemIdx];
      const x = -totalW / 2 + posIdx * RAIL.gap;
      const basePos = new THREE.Vector3(x, RAIL.y - 0.56, RAIL.z + 0.04);

      const group = new THREE.Group();
      group.position.copy(basePos);

      // Wooden hanger & brass hook
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.005, 8, 16, Math.PI * 1.4), brassMat);
      hook.position.set(0, 0.54, 0);
      group.add(hook);

      const hangerL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.018, 0.015), woodMat);
      hangerL.position.set(-0.09, 0.48, 0);
      hangerL.rotation.z = 0.28;
      const hangerR = hangerL.clone();
      hangerR.position.x = 0.09;
      hangerR.rotation.z = -0.28;
      group.add(hangerL, hangerR);

      // Garment Cutout Plane
      const mat = new THREE.MeshStandardMaterial({
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.78,
        metalness: 0.02,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.94), mat);
      mesh.position.set(0, -0.02, 0.01);
      group.add(mesh);

      this.loadProductTexture(item.image, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      });

      this.scene.add(group);
      this.registerPiece(itemIdx, group, mesh, mat, basePos, new THREE.Vector3(0, 0, 0.36));
    });
  }

  buildCapsWall(woodMat, brassMat) {
    const indices = this.items
      .map((it, idx) => (it.cat === 'caps' ? idx : -1))
      .filter((i) => i >= 0);

    // Pegboard panel on Left Wall (-X)
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.55, 2.55), woodMat);
    board.position.set(-ROOM.x + 0.04, 1.72, -1.5);
    this.scene.add(board);

    indices.forEach((itemIdx, k) => {
      const item = this.items[itemIdx];
      const col = k % 3;
      const row = Math.floor(k / 3);
      const z = -2.25 + col * 0.75;
      const y = 2.02 - row * 0.62;
      const basePos = new THREE.Vector3(-ROOM.x + 0.14, y, z);

      const group = new THREE.Group();
      group.position.copy(basePos);
      group.rotation.y = Math.PI / 2;

      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12), brassMat);
      peg.rotation.x = Math.PI / 2;
      peg.position.set(0, -0.08, -0.06);
      group.add(peg);

      const mat = new THREE.MeshStandardMaterial({
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.75,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), mat);
      group.add(mesh);

      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.46, 0.115),
        new THREE.MeshBasicMaterial({
          map: createLabelTexture(item.title, formatMoney(item.price), false),
          transparent: true
        })
      );
      label.position.set(0, -0.25, -0.02);
      group.add(label);

      this.loadProductTexture(item.image, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      });

      this.scene.add(group);
      this.registerPiece(itemIdx, group, mesh, mat, basePos, new THREE.Vector3(0.22, 0, 0));
    });
  }

  buildBagsWall(woodMat) {
    const indices = this.items
      .map((it, idx) => (it.cat === 'bags' ? idx : -1))
      .filter((i) => i >= 0);

    // Floating oak shelves on Left Wall (rear-left section, z = 1.1..2.9)
    [1.15, 2.05].forEach((sy) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 2.2), woodMat);
      shelf.position.set(-ROOM.x + 0.18, sy, 1.55);
      this.scene.add(shelf);
    });

    indices.forEach((itemIdx, k) => {
      const item = this.items[itemIdx];
      const col = k % 2;
      const row = Math.floor(k / 2);
      const z = 1.0 + col * 1.1;
      const y = (row === 0 ? 2.05 : 1.15) + 0.32;
      const basePos = new THREE.Vector3(-ROOM.x + 0.24, y, z);

      const group = new THREE.Group();
      group.position.copy(basePos);
      group.rotation.y = Math.PI / 2;

      const mat = new THREE.MeshStandardMaterial({
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.72,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.56), mat);
      group.add(mesh);

      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.56, 0.14),
        new THREE.MeshBasicMaterial({
          map: createLabelTexture(item.title, formatMoney(item.price), false),
          transparent: true
        })
      );
      label.position.set(0, -0.37, 0.01);
      group.add(label);

      this.loadProductTexture(item.image, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      });

      this.scene.add(group);
      this.registerPiece(itemIdx, group, mesh, mat, basePos, new THREE.Vector3(0.24, 0, 0));
    });
  }

  buildShoesWall(darkNicheMat, brassMat) {
    const indices = this.items
      .map((it, idx) => (it.cat === 'shoes' ? idx : -1))
      .filter((i) => i >= 0);

    // Dark recessed showcase panel on Right Wall (+X)
    const niche = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.35, 3.4), darkNicheMat);
    niche.position.set(ROOM.x - 0.03, 1.65, -0.95);
    this.scene.add(niche);

    // Floating shelves inside shoe wall
    [1.1, 1.95].forEach((sy) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 3.0), brassMat);
      shelf.position.set(ROOM.x - 0.18, sy, -0.95);
      this.scene.add(shelf);
    });

    indices.forEach((itemIdx, k) => {
      const item = this.items[itemIdx];
      const col = k % 3;
      const row = Math.floor(k / 3);
      const z = -1.95 + col * 1.0;
      const y = (row === 0 ? 1.95 : 1.1) + 0.18;
      const basePos = new THREE.Vector3(ROOM.x - 0.24, y, z);

      const group = new THREE.Group();
      group.position.copy(basePos);
      group.rotation.y = -Math.PI / 2;

      const mat = new THREE.MeshStandardMaterial({
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.65,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), mat);
      group.add(mesh);

      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.64, 0.16),
        new THREE.MeshBasicMaterial({
          map: createLabelTexture(item.title, `${item.kind} · ${formatMoney(item.price)}`, true),
          transparent: true
        })
      );
      label.position.set(0, -0.26, 0.01);
      group.add(label);

      this.loadProductTexture(item.image, (tex) => {
        mat.map = tex;
        mat.needsUpdate = true;
      });

      this.scene.add(group);
      this.registerPiece(itemIdx, group, mesh, mat, basePos, new THREE.Vector3(-0.24, 0, 0));
    });
  }

  buildPosters() {
    const posterConfigs = [
      { url: `${IMG_DIR}poster-1.webp`, pos: [ROOM.x - 0.04, 1.85, 2.05], rotY: -Math.PI / 2 },
      { url: `${IMG_DIR}poster-2.webp`, pos: [0, 1.85, ROOM.z1 - 0.04], rotY: Math.PI }
    ];

    posterConfigs.forEach((cfg) => {
      const mat = new THREE.MeshStandardMaterial({ color: '#ddd5c8', roughness: 0.7 });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.55), mat);
      plane.position.set(...cfg.pos);
      plane.rotation.y = cfg.rotY;
      this.scene.add(plane);

      this.loadProductTexture(cfg.url, (tex) => {
        mat.map = tex;
        mat.color.set('#ffffff');
        mat.needsUpdate = true;
      });
    });
  }

  /* ========================================================================
     Camera Targets & Render Loop
     ======================================================================== */

  getCameraGoal() {
    const st = this.st;
    const isMobile = this.root.clientWidth <= 760;

    // Product close-up framing (offset left on desktop so right glass panel is clear; lifted on mobile)
    if (st.open >= 0 && this.pieces[st.open]) {
      const item = this.items[st.open];
      const pc = this.pieces[st.open];
      const p = pc.basePos;

      if (item.cat === 'clothing') {
        return {
          pos: new THREE.Vector3(p.x + (isMobile ? 0 : 0.45), p.y + (isMobile ? -0.2 : 0.06), p.z + (isMobile ? 1.85 : 1.55)),
          look: new THREE.Vector3(p.x + (isMobile ? 0 : 0.35), p.y + (isMobile ? -0.25 : 0.02), p.z)
        };
      }
      if (item.cat === 'caps' || item.cat === 'bags') {
        return {
          pos: new THREE.Vector3(p.x + (isMobile ? 1.55 : 1.3), p.y + (isMobile ? -0.15 : 0.02), p.z + (isMobile ? 0 : -0.35)),
          look: new THREE.Vector3(p.x, p.y + (isMobile ? -0.2 : 0), p.z + (isMobile ? 0 : -0.28))
        };
      }
      if (item.cat === 'shoes') {
        return {
          pos: new THREE.Vector3(p.x - (isMobile ? 1.55 : 1.35), p.y + (isMobile ? -0.15 : 0.02), p.z + (isMobile ? 0 : 0.35)),
          look: new THREE.Vector3(p.x, p.y + (isMobile ? -0.2 : 0), p.z + (isMobile ? 0 : 0.28))
        };
      }
    }

    // Section views
    switch (st.mode) {
      case 'clothing':
        return {
          pos: new THREE.Vector3(st.pan, 1.52, -1.55),
          look: new THREE.Vector3(st.pan, 1.48, ROOM.z0)
        };
      case 'caps':
        return {
          pos: new THREE.Vector3(-1.9, 1.72, -1.5 + st.pan * 0.4),
          look: new THREE.Vector3(-ROOM.x, 1.72, -1.5 + st.pan * 0.4)
        };
      case 'bags':
        return {
          pos: new THREE.Vector3(-1.8, 1.65, 1.55 + st.pan * 0.3),
          look: new THREE.Vector3(-ROOM.x, 1.62, 1.55 + st.pan * 0.3)
        };
      case 'shoes':
        return {
          pos: new THREE.Vector3(1.85, 1.58, -0.95 + st.pan * 0.4),
          look: new THREE.Vector3(ROOM.x, 1.55, -0.95 + st.pan * 0.4)
        };
      case 'store':
      default: {
        const yaw = st.yaw;
        const pitch = st.pitch;
        const pos = new THREE.Vector3(0, 1.62, 1.25);
        const look = new THREE.Vector3(
          Math.sin(yaw) * 4.5,
          1.58 + Math.sin(pitch) * 2.2,
          1.25 - Math.cos(yaw) * 4.5
        );
        return { pos, look };
      }
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const tick = (now) => {
      this.rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const st = this.st;
      const k = prefersReducedMotion() ? 40 : 6.5;
      const alpha = damp(k, dt);

      st.yaw += (st.yawTo - st.yaw) * alpha;
      st.pitch += (st.pitchTo - st.pitch) * alpha;
      st.pan += (st.panTo - st.pan) * alpha;

      const goal = this.getCameraGoal();
      this.camPos.lerp(goal.pos, alpha);
      this.camLook.lerp(goal.look, alpha);
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);

      // Animate piece step-off-rail on hover or open
      this.pieces.forEach((pc) => {
        if (!pc) return;
        const active = pc.index === st.hover || pc.index === st.open ? 1 : 0;
        pc.stepAmount += (active - pc.stepAmount) * damp(10, dt);
        pc.group.position.copy(pc.basePos).addScaledVector(pc.stepDir, pc.stepAmount);
      });

      // Update floating hover caption position
      if (st.hover >= 0 && st.open < 0 && this.pieces[st.hover]) {
        const pc = this.pieces[st.hover];
        const worldPos = pc.group.position.clone();
        worldPos.y -= 0.48;
        worldPos.project(this.camera);
        const sx = (worldPos.x * 0.5 + 0.5) * this.root.clientWidth;
        const sy = (-worldPos.y * 0.5 + 0.5) * this.root.clientHeight;
        this.captionEl.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
        this.captionEl.classList.add('is-on');
      } else {
        this.captionEl.classList.remove('is-on');
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  resize() {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    if (!w || !h || !this.renderer) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ========================================================================
     Navigation, Product Panel, Swatch Swap, Lightbox & Fly-to-Cart
     ======================================================================== */

  go(mode) {
    if (this.st.open >= 0) this.closePanel();
    this.st.mode = mode;
    this.st.hover = -1;
    this.st.panTo = 0;

    if (mode === 'store') {
      this.st.yawTo = 0;
      this.st.pitchTo = 0;
    }

    this.root.classList.toggle('is-store', mode === 'store');
    this.menuBtns.forEach((b) => {
      b.setAttribute('aria-current', b.dataset.go === mode ? 'true' : 'false');
    });
  }

  openProduct(index, triggerEl = null) {
    const item = this.items[index];
    if (!item) return;

    this.restorePieceTexture();
    this.lastFocused = triggerEl || document.activeElement;

    if (this.st.mode !== item.cat) {
      this.st.mode = item.cat;
      this.root.classList.remove('is-store');
      this.menuBtns.forEach((b) => {
        b.setAttribute('aria-current', b.dataset.go === item.cat ? 'true' : 'false');
      });
    }

    this.st.open = index;
    this.st.hover = -1;
    this.root.classList.add('is-product');
    this.paintPanel(index);

    this.panelEl.removeAttribute('inert');
    this.panelEl.setAttribute('aria-hidden', 'false');
    this.pNameEl.focus({ preventScroll: true });
  }

  closePanel() {
    if (this.st.open < 0) return;
    this.restorePieceTexture();
    this.closeZoom();
    this.st.open = -1;
    this.root.classList.remove('is-product');
    this.panelEl.setAttribute('inert', '');
    this.panelEl.setAttribute('aria-hidden', 'true');

    if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
      this.lastFocused.focus({ preventScroll: true });
    }
  }

  stepProduct(delta) {
    if (this.st.open < 0) return;
    const cat = this.items[this.st.open].cat;
    const catIndices = this.items
      .map((it, idx) => (it.cat === cat ? idx : -1))
      .filter((i) => i >= 0);
    const pos = catIndices.indexOf(this.st.open);
    const nextIdx = catIndices[(pos + delta + catIndices.length) % catIndices.length];
    this.openProduct(nextIdx);
  }

  swapPieceTexture(index, url) {
    const pc = this.pieces[index];
    if (!pc) return;
    if (!pc.origMap) pc.origMap = pc.mat.map;
    pc.wantUrl = url;
    this.swappedPiece = pc;

    this.loadProductTexture(url, (tex) => {
      if (pc.wantUrl !== url) {
        tex.dispose();
        return;
      }
      pc.mat.map = tex;
      pc.mat.needsUpdate = true;
    });
  }

  restorePieceTexture() {
    if (!this.swappedPiece) return;
    const pc = this.swappedPiece;
    pc.wantUrl = null;
    if (pc.origMap) {
      pc.mat.map = pc.origMap;
      pc.mat.needsUpdate = true;
      pc.origMap = null;
    }
    this.swappedPiece = null;
  }

  paintPanel(index) {
    const item = this.items[index];
    const catIndices = this.items
      .map((it, idx) => (it.cat === item.cat ? idx : -1))
      .filter((i) => i >= 0);

    this.pagerTextEl.textContent = `${catIndices.indexOf(index) + 1} / ${catIndices.length}`;
    this.pCatEl.textContent = CATEGORY_LABELS[item.cat] || item.cat;
    this.pNameEl.textContent = item.title;
    this.pKindEl.textContent = item.kind;

    this.selectedSwatch = 0;
    this.selectedSize = (item.sizes || []).find((s) => !(item.outSizes || []).includes(s)) || '';
    this.qtyInput.value = '1';
    this.addBtn.classList.remove('is-done');
    this.viewCartEl.classList.remove('is-on');

    // Gallery thumbnails
    const gallery = item.gallery || [item.image];
    this.zoomImages = gallery;
    this.galEl.innerHTML = '';
    if (gallery.length > 1) {
      gallery.forEach((src, k) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `vs-th${k === 0 ? ' is-on' : ''}`;
        btn.setAttribute('aria-label', `Zoom image ${k + 1} of ${gallery.length}`);
        btn.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
        btn.addEventListener('click', () => this.openZoom(k));
        this.galEl.appendChild(btn);
      });
    }

    // Optional subscription plan
    if (item.plans && item.plans.length) {
      this.planWrapEl.hidden = false;
      this.planSelectEl.innerHTML = item.plans
        .map((pl) => `<option value="${pl.id}">${pl.name}</option>`)
        .join('');
    } else {
      this.planWrapEl.hidden = true;
    }

    this.renderVariantControls(index);
  }

  renderVariantControls(index) {
    const item = this.items[index];
    this.optsEl.innerHTML = '';

    const activeSwatch = item.swatches ? item.swatches[this.selectedSwatch] : null;
    const activePrice = activeSwatch?.price ?? item.price;
    const outSizes = activeSwatch?.outSizes ?? item.outSizes ?? [];

    // Price display
    this.pPriceEl.innerHTML = item.compareAt
      ? `<span>${formatMoney(activePrice)}</span><s>${formatMoney(item.compareAt)}</s>`
      : `<span>${formatMoney(activePrice)}</span>`;

    // Swatches row
    if (item.swatches && item.swatches.length) {
      const wrap = document.createElement('div');
      wrap.className = 'vs-opt';
      wrap.innerHTML = `
        <div class="vs-opt-top">
          <span>Color</span>
          <b>${activeSwatch.label}</b>
        </div>
      `;
      const row = document.createElement('div');
      row.className = 'vs-vals is-sw';
      item.swatches.forEach((sw, swIdx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.style.setProperty('--sw', sw.hex);
        b.setAttribute('aria-label', `Color: ${sw.label}`);
        if (swIdx === this.selectedSwatch) b.classList.add('is-on');
        b.addEventListener('click', () => {
          this.selectedSwatch = swIdx;
          this.swapPieceTexture(index, sw.image);
          this.renderVariantControls(index);
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      this.optsEl.appendChild(wrap);
    }

    // Sizes row
    if (item.sizes && item.sizes.length) {
      const wrap = document.createElement('div');
      wrap.className = 'vs-opt';
      wrap.innerHTML = `<div class="vs-opt-top"><span>Select size</span></div>`;
      const row = document.createElement('div');
      row.className = 'vs-vals';

      item.sizes.forEach((sz) => {
        const isOut = outSizes.includes(sz);
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = sz;
        if (sz === this.selectedSize) b.classList.add('is-on');
        if (isOut) b.classList.add('is-out');
        b.addEventListener('click', () => {
          this.selectedSize = sz;
          this.renderVariantControls(index);
        });
        row.appendChild(b);
      });

      wrap.appendChild(row);
      this.optsEl.appendChild(wrap);
    }

    const isSoldOut = this.selectedSize && outSizes.includes(this.selectedSize);
    this.addBtn.disabled = Boolean(isSoldOut);
    this.addBtn.textContent = isSoldOut ? 'Sold out' : 'Add to Cart';
  }

  openZoom(k) {
    if (!this.zoomImages.length) return;
    this.zoomIdx = (k + this.zoomImages.length) % this.zoomImages.length;
    this.zoomImg.src = this.zoomImages[this.zoomIdx];
    this.zoomCountEl.textContent = `${this.zoomIdx + 1} / ${this.zoomImages.length}`;
    this.zoomEl.hidden = false;
  }

  closeZoom() {
    this.zoomEl.hidden = true;
  }

  async addToCart() {
    if (this.st.open < 0 || this.addBtn.disabled) return;
    const item = this.items[this.st.open];
    const qty = clamp(parseInt(this.qtyInput.value, 10) || 1, 1, 99);
    this.qtyInput.value = String(qty);

    this.addBtn.classList.add('is-busy');
    await new Promise((r) => setTimeout(r, 200));
    this.addBtn.classList.remove('is-busy');

    this.cartCount += qty;
    this.bagCountEl.textContent = String(this.cartCount);
    this.addBtn.classList.add('is-done');
    this.addBtn.textContent = 'Added to Cart ✓';
    this.viewCartEl.classList.add('is-on');

    this.flyToCart(item.swatches ? item.swatches[this.selectedSwatch].image : item.image);
    this.showToast(`${item.title} (${qty}) added to your bag`);

    setTimeout(() => {
      if (this.st.open >= 0) {
        this.addBtn.classList.remove('is-done');
        this.addBtn.textContent = 'Add to Cart';
      }
    }, 1800);
  }

  flyToCart(imgUrl) {
    if (prefersReducedMotion() || !window.gsap) return;
    const startRect = this.addBtn.getBoundingClientRect();
    const endRect = this.bagBtn.getBoundingClientRect();

    const sprite = document.createElement('img');
    sprite.src = imgUrl;
    sprite.className = 'vs-fly';
    sprite.style.width = '76px';
    sprite.style.height = '92px';
    sprite.style.objectFit = 'contain';
    document.body.appendChild(sprite);

    window.gsap.fromTo(
      sprite,
      {
        x: startRect.left + startRect.width / 2 - 38,
        y: startRect.top - 40,
        scale: 1,
        opacity: 1
      },
      {
        x: endRect.left + endRect.width / 2 - 20,
        y: endRect.top + endRect.height / 2 - 20,
        scale: 0.22,
        opacity: 0.2,
        duration: 0.72,
        ease: 'power3.inOut',
        onComplete: () => {
          sprite.remove();
          this.bagBtn.classList.remove('vs-landed');
          void this.bagBtn.offsetWidth;
          this.bagBtn.classList.add('vs-landed');
        }
      }
    );
  }

  showToast(text) {
    this.toastEl.innerHTML = `<p>${text}</p>`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.innerHTML = '';
    }, 3200);
  }

  /* ========================================================================
     Pointer, Drag, Raycasting & Keyboard Wiring
     ======================================================================== */

  wireEvents() {
    this.menuBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.go(btn.dataset.go));
    });

    this.prevBtn.addEventListener('click', () => this.stepProduct(-1));
    this.nextBtn.addEventListener('click', () => this.stepProduct(1));
    this.closeBtn.addEventListener('click', () => this.closePanel());
    this.addBtn.addEventListener('click', () => this.addToCart());

    this.qtyMinusBtn.addEventListener('click', () => {
      this.qtyInput.value = String(clamp((parseInt(this.qtyInput.value, 10) || 1) - 1, 1, 99));
    });
    this.qtyPlusBtn.addEventListener('click', () => {
      this.qtyInput.value = String(clamp((parseInt(this.qtyInput.value, 10) || 1) + 1, 1, 99));
    });

    this.bagBtn.addEventListener('click', () => {
      this.showToast(
        this.cartCount > 0 ? `You have ${this.cartCount} item(s) in your bag` : 'Your bag is currently empty'
      );
    });

    // Lightbox controls
    this.zoomCloseBtn.addEventListener('click', () => this.closeZoom());
    this.zoomPrevBtn.addEventListener('click', () => this.openZoom(this.zoomIdx - 1));
    this.zoomNextBtn.addEventListener('click', () => this.openZoom(this.zoomIdx + 1));
    this.zoomEl.addEventListener('click', (e) => {
      if (e.target === this.zoomEl) this.closeZoom();
    });

    // Prevent demo links
    this.root.addEventListener('click', (e) => {
      if (e.target.closest('a[href="#demo"]')) e.preventDefault();
    });

    // Mobile pull-down sheet swipe-to-dismiss
    let sheetStartY = 0;
    this.panelEl.addEventListener('pointerdown', (e) => {
      if (this.root.clientWidth > 760) return;
      if (e.target.closest('button, select, input, a')) return;
      sheetStartY = e.clientY;
    });
    this.panelEl.addEventListener('pointerup', (e) => {
      if (sheetStartY && e.clientY - sheetStartY > 75) {
        this.closePanel();
      }
      sheetStartY = 0;
    });

    // Canvas drag + raycast hover & click
    const updateNDC = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const raycastHit = () => {
      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.pickMeshes, false);
      return hits.length ? hits[0].object.userData.itemIndex : -1;
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.st.drag = { x: e.clientX, y: e.clientY, moved: 0 };
      updateNDC(e);
    });

    window.addEventListener('pointermove', (e) => {
      const st = this.st;
      if (st.drag) {
        const dx = e.clientX - st.drag.x;
        const dy = e.clientY - st.drag.y;
        st.drag.x = e.clientX;
        st.drag.y = e.clientY;
        st.drag.moved += Math.hypot(dx, dy);

        if (st.drag.moved > 5) {
          this.root.classList.add('is-drag');
          if (st.open >= 0) this.closePanel();
          if (st.mode === 'store') {
            st.yawTo -= dx * 0.0042;
            st.pitchTo = clamp(st.pitchTo - dy * 0.0022, -0.22, 0.25);
          } else {
            st.panTo = clamp(st.panTo - dx * 0.0045, -2.5, 2.5);
          }
        }
        return;
      }

      if (st.open >= 0) return;
      updateNDC(e);
      const hitIdx = raycastHit();
      if (hitIdx !== st.hover) {
        st.hover = hitIdx;
        this.root.classList.toggle('is-point', hitIdx >= 0);
        if (hitIdx >= 0) {
          const it = this.items[hitIdx];
          this.captionEl.innerHTML = `<b>${it.title}</b> · ${formatMoney(it.price)}`;
        }
      }
    });

    const endDrag = (e) => {
      const drag = this.st.drag;
      if (!drag) return;
      this.st.drag = null;
      this.root.classList.remove('is-drag');

      if (drag.moved < 6 && e && e.target === this.canvas) {
        updateNDC(e);
        const hitIdx = raycastHit();
        if (hitIdx >= 0) {
          this.openProduct(hitIdx, this.canvas);
        } else if (this.st.open >= 0) {
          this.closePanel();
        }
      }
    };

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Horizontal wheel panning along clothing rail
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        if (this.st.mode === 'store' || this.st.open >= 0) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        this.st.panTo = clamp(this.st.panTo + delta * 0.002, -2.5, 2.5);
      },
      { passive: true }
    );

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.zoomEl.hidden) this.closeZoom();
        else if (this.st.open >= 0) this.closePanel();
      } else if (!this.zoomEl.hidden) {
        if (e.key === 'ArrowRight') this.openZoom(this.zoomIdx + 1);
        if (e.key === 'ArrowLeft') this.openZoom(this.zoomIdx - 1);
      } else if (this.st.open >= 0) {
        if (e.key === 'ArrowRight') this.stepProduct(1);
        if (e.key === 'ArrowLeft') this.stepProduct(-1);
      }
    });

    // Resize & WebGL context loss guard
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.root);

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cancelAnimationFrame(this.rafId);
      this.root.classList.add('is-flat');
    });
  }
}

/* ==========================================================================
   Bootstrap
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('vitrine-store');
  if (root) {
    new VitrineStore(root, buildProducts());
  }
});
