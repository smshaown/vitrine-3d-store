# Vitrine 3D Virtual Boutique Store

An interactive walk-in 3D boutique storefront built with **HTML5**, **CSS3 Glassmorphism**, **Three.js**, and **GSAP 3**. Shoppers explore a warmly lit architectural room featuring a brass clothing rail, caps pegboard, floating oak bag shelves, a dark recessed shoe niche, volumetric spotlight cones, and a potted olive tree.

---

## Key Features

- **Walk-in 3D Boutique Room (`Three.js`):**
  - Procedural plaster walls, forest-green feature wall (`#26342d`), polished concrete floor, warm oak plinth, illuminated `VITRINE` signage, and volumetric additive spotlight cones.
  - Four interactive spatial zones: **Clothing** (brass rail with wooden hangers), **Caps** (wooden pegboard), **Bags** (floating oak shelves), and **Shoes** (recessed dark niche).
- **Smooth Camera Choreography & Hover Physics:**
  - Floating frosted-glass bottom menu (`Store`, `Clothing`, `Caps`, `Bags`, `Shoes`) smoothly glides the camera to each wall.
  - Pointer drag orbits the room or pans along shelves; hovering any item steps it forward off the rail with a 3D-projected floating caption pill.
- **Glassmorphic Product Drawer & Live 3D Color Swapping:**
  - Frosted glass side panel (`backdrop-filter: blur(22px) saturate(1.5)`) on desktop and pull-down bottom sheet (`≤760px`) on mobile.
  - Selecting a color swatch swaps the 3D garment's texture live inside the room.
  - Gallery thumbnail strip with full-screen zoom lightbox, size availability matrix, subscription option support, quantity stepper, and **GSAP fly-to-cart arc animation**.
- **Resilient & Accessible:**
  - Automatic WebGL2 / context-loss fallback to a clean 2D product grid (`.is-flat`).
  - Focus-revealed keyboard product list, `Escape` / Arrow key shortcuts, and `prefers-reduced-motion` support.

---

## Project Structure

```text
vitrine-3d-store/
├── index.html    # Semantic HTML5, SEO/OpenGraph/JSON-LD, GSAP 3 CDN
├── styles.css    # Design tokens, glassmorphic drawer, mobile sheet & fallback grid
├── data.js       # 26 curated products across Clothing, Caps, Bags & Shoes
├── app.js        # Three.js 3D room, raycasting, camera damping & GSAP fly-to-cart
└── README.md
```

---

## Quick Start

Because `app.js` uses native ES Modules (`type="module"`), serve the folder over HTTP:

```bash
git clone https://github.com/smshaown/vitrine-3d-store.git
cd vitrine-3d-store
python -m http.server 8765
```

Then open `http://localhost:8765` in your browser.

---

## Author

- GitHub: [@smshaown](https://github.com/smshaown)
