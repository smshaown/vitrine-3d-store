import { renderProductDataURL } from './textures.js';

export const CATEGORY_LABELS = {
  clothing: 'Clothing',
  caps: 'Caps',
  bags: 'Bags',
  shoes: 'Shoes'
};

const RAW_PRODUCTS = [
  /* ───────── CLOTHING (10 garments on the brass rail) ───────── */
  {
    id: 'g1',
    cat: 'clothing',
    shape: 'hoodie',
    color: '#233d31',
    title: 'Heavyweight Hoodie',
    kind: '480gsm organic fleece',
    price: 98,
    swatches: [
      { label: 'Forest', hex: '#233d31', price: 98 },
      { label: 'Bone', hex: '#e7e1d5', price: 98 },
      { label: 'Burgundy', hex: '#5c1e28', price: 103, outSizes: ['XL'] }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'g2',
    cat: 'clothing',
    shape: 'hoodie',
    color: '#e5dfd3',
    title: 'Bone Hoodie',
    kind: 'Brushed organic cotton',
    price: 98,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    outSizes: ['XS']
  },
  {
    id: 'g3',
    cat: 'clothing',
    shape: 'puffer',
    color: '#243142',
    title: 'Navy Puffer',
    kind: 'Recycled down fill',
    price: 215,
    compareAt: 260,
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'g4',
    cat: 'clothing',
    shape: 'overshirt',
    color: '#232426',
    title: 'Black Overshirt',
    kind: 'Heavyweight wool twill',
    price: 165,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'g5',
    cat: 'clothing',
    shape: 'sherpa',
    color: '#efeae0',
    title: 'Sherpa Jacket',
    kind: 'Cream fleece / leather pocket',
    price: 185,
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'g6',
    cat: 'clothing',
    shape: 'cardigan',
    color: '#e7decb',
    accent: '#6e4c2e',
    title: 'Cable Cardigan',
    kind: 'Merino wool knit',
    price: 148,
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: 'g7',
    cat: 'clothing',
    shape: 'vest',
    color: '#1e2022',
    title: 'Puffer Vest',
    kind: 'Matte ripstop shell',
    price: 135,
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'g8',
    cat: 'clothing',
    shape: 'overshirt',
    color: '#8f9e81',
    title: 'Sage Linen Shirt',
    kind: 'Washed Belgian linen',
    price: 112,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'g9',
    cat: 'clothing',
    shape: 'overshirt',
    color: '#41668f',
    title: 'Denim Trucker',
    kind: '14oz selvedge denim',
    price: 175,
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 'g10',
    cat: 'clothing',
    shape: 'overcoat',
    color: '#a87544',
    accent: '#3b2412',
    title: 'Camel Overcoat',
    kind: 'Double-faced wool blend',
    price: 340,
    sizes: ['S', 'M', 'L', 'XL']
  },

  /* ───────── CAPS (6 items on the left pegboard wall) ───────── */
  {
    id: 'c1',
    cat: 'caps',
    shape: 'cap',
    color: '#22334a',
    title: 'Navy Cap',
    kind: 'Navy cotton twill',
    price: 34,
    single: true
  },
  {
    id: 'c2',
    cat: 'caps',
    shape: 'cap',
    color: '#8e2d32',
    title: 'Red Cap',
    kind: 'Washed crimson twill',
    price: 34,
    single: true
  },
  {
    id: 'c3',
    cat: 'caps',
    shape: 'cap',
    color: '#e4ddd0',
    title: 'Bone Cap',
    kind: 'Unbleached canvas',
    price: 36,
    single: true
  },
  {
    id: 'c4',
    cat: 'caps',
    shape: 'cap',
    color: '#2b4737',
    title: 'Forest Cap',
    kind: 'Brushed heavy cotton',
    price: 36,
    single: true
  },
  {
    id: 'c5',
    cat: 'caps',
    shape: 'bucket',
    color: '#202124',
    title: 'Black Bucket Hat',
    kind: 'Water-repellent nylon',
    price: 42,
    single: true
  },
  {
    id: 'c6',
    cat: 'caps',
    shape: 'cap',
    color: '#634632',
    title: 'Corduroy Cap',
    kind: 'Wide-wale espresso cord',
    price: 38,
    single: true
  },

  /* ───────── BAGS (4 items on floating oak shelves) ───────── */
  {
    id: 'b1',
    cat: 'bags',
    shape: 'backpack',
    color: '#1f2124',
    title: 'Day Pack',
    kind: 'Black ballistic nylon',
    price: 89,
    single: true,
    plans: [
      { id: 'once', name: 'One-time purchase' },
      { id: 'monthly', name: 'Care kit every month · save 10%' },
      { id: 'quarterly', name: 'Care kit every 3 months · save 5%' }
    ]
  },
  {
    id: 'b2',
    cat: 'bags',
    shape: 'tote',
    color: '#dfd5c3',
    title: 'Canvas Tote',
    kind: 'Heavyweight 18oz duck',
    price: 54,
    single: true
  },
  {
    id: 'b3',
    cat: 'bags',
    shape: 'sling',
    color: '#2b4436',
    title: 'Forest Sling',
    kind: 'Weatherproof ripstop',
    price: 68,
    single: true
  },
  {
    id: 'b4',
    cat: 'bags',
    shape: 'duffel',
    color: '#7c5638',
    title: 'Weekend Duffel',
    kind: 'Full-grain leather trim',
    price: 145,
    compareAt: 175,
    single: true
  },

  /* ───────── SHOES (6 items on the dark recessed shoe niche) ───────── */
  {
    id: 's1',
    cat: 'shoes',
    shape: 'sneaker',
    color: '#ece8e0',
    accent: '#c79b68',
    title: 'Court Sneaker',
    kind: 'White leather / gum',
    price: 118,
    sizes: ['40', '41', '42', '43', '44', '45'],
    outSizes: ['45']
  },
  {
    id: 's2',
    cat: 'shoes',
    shape: 'sneaker',
    color: '#5d6b7a',
    accent: '#edeae4',
    title: 'Pulse Runner',
    kind: 'Mesh & suede overlay',
    price: 132,
    sizes: ['40', '41', '42', '43', '44', '45']
  },
  {
    id: 's3',
    cat: 'shoes',
    shape: 'high',
    color: '#2a2c2e',
    accent: '#e5dfd3',
    title: 'Court High',
    kind: 'Tumbled calfskin',
    price: 145,
    sizes: ['40', '41', '42', '43', '44']
  },
  {
    id: 's4',
    cat: 'shoes',
    shape: 'sneaker',
    color: '#b82e5a',
    accent: '#c89b65',
    title: 'Retro Runner',
    kind: 'Berry suede / gum sole',
    price: 128,
    sizes: ['40', '41', '42', '43', '44', '45']
  },
  {
    id: 's5',
    cat: 'shoes',
    shape: 'sneaker',
    color: '#e6e0d4',
    accent: '#f5f2ec',
    title: 'Bone Court',
    kind: 'Bone leather low-top',
    price: 118,
    sizes: ['40', '41', '42', '43', '44']
  },
  {
    id: 's6',
    cat: 'shoes',
    shape: 'loafer',
    color: '#1b1a19',
    accent: '#2c241d',
    title: 'Penny Loafer',
    kind: 'Hand-sewn black leather',
    price: 168,
    sizes: ['40', '41', '42', '43', '44', '45'],
    outSizes: ['40']
  }
];

export function buildProducts() {
  return RAW_PRODUCTS.map((p) => {
    const baseImg = renderProductDataURL(p);
    const swatches = p.swatches
      ? p.swatches.map((sw) => ({
          ...sw,
          image: renderProductDataURL({ ...p, color: sw.hex })
        }))
      : null;

    const gallery = swatches ? swatches.map((sw) => sw.image) : [baseImg];
    return {
      ...p,
      image: baseImg,
      swatches,
      gallery
    };
  });
}
