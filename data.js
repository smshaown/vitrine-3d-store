export const IMG_DIR = './img/';

export const CATEGORY_LABELS = {
  clothing: 'Clothing',
  caps: 'Caps',
  bags: 'Bags',
  shoes: 'Shoes'
};

export function buildProducts() {
  return [
    /* ───────── CLOTHING (10 garments on the brass rail) ───────── */
    {
      id: 'g1',
      cat: 'clothing',
      title: 'Heavyweight Hoodie',
      kind: '480gsm organic fleece',
      image: `${IMG_DIR}g1-front.webp`,
      price: 98,
      swatches: [
        { label: 'Forest', hex: '#233d31', image: `${IMG_DIR}g1-front.webp`, price: 98 },
        { label: 'Bone', hex: '#e7e1d5', image: `${IMG_DIR}g2-front.webp`, price: 98 },
        { label: 'Burgundy', hex: '#5c1e28', image: `${IMG_DIR}g15-front.webp`, price: 103, outSizes: ['XL'] }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      gallery: [
        `${IMG_DIR}g1-front.webp`,
        `${IMG_DIR}g2-front.webp`,
        `${IMG_DIR}g15-front.webp`,
        `${IMG_DIR}poster-1.webp`,
        `${IMG_DIR}poster-2.webp`
      ]
    },
    {
      id: 'g2',
      cat: 'clothing',
      title: 'Bone Hoodie',
      kind: 'Brushed organic cotton',
      image: `${IMG_DIR}g2-front.webp`,
      price: 98,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      outSizes: ['XS']
    },
    {
      id: 'g3',
      cat: 'clothing',
      title: 'Navy Puffer',
      kind: 'Recycled down fill',
      image: `${IMG_DIR}g3-front.webp`,
      price: 215,
      compareAt: 260,
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: 'g4',
      cat: 'clothing',
      title: 'Black Overshirt',
      kind: 'Heavyweight wool twill',
      image: `${IMG_DIR}g8-front.webp`,
      price: 165,
      sizes: ['XS', 'S', 'M', 'L', 'XL']
    },
    {
      id: 'g5',
      cat: 'clothing',
      title: 'Sherpa Jacket',
      kind: 'Cream fleece / leather pocket',
      image: `${IMG_DIR}g9-front.webp`,
      price: 185,
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: 'g6',
      cat: 'clothing',
      title: 'Cable Cardigan',
      kind: 'Merino wool knit',
      image: `${IMG_DIR}g10-front.webp`,
      price: 148,
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 'g7',
      cat: 'clothing',
      title: 'Puffer Vest',
      kind: 'Matte ripstop shell',
      image: `${IMG_DIR}g12-front.webp`,
      price: 135,
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: 'g8',
      cat: 'clothing',
      title: 'Sage Linen Shirt',
      kind: 'Washed Belgian linen',
      image: `${IMG_DIR}g13-front.webp`,
      price: 112,
      sizes: ['XS', 'S', 'M', 'L', 'XL']
    },
    {
      id: 'g9',
      cat: 'clothing',
      title: 'Denim Trucker',
      kind: '14oz selvedge denim',
      image: `${IMG_DIR}g16-front.webp`,
      price: 175,
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: 'g10',
      cat: 'clothing',
      title: 'Camel Overcoat',
      kind: 'Double-faced wool blend',
      image: `${IMG_DIR}g19-front.webp`,
      price: 340,
      sizes: ['S', 'M', 'L', 'XL']
    },

    /* ───────── CAPS (6 items on the left pegboard wall) ───────── */
    {
      id: 'c1',
      cat: 'caps',
      title: 'Navy Cap',
      kind: 'Navy cotton twill',
      image: `${IMG_DIR}cap-1.webp`,
      price: 34,
      single: true
    },
    {
      id: 'c2',
      cat: 'caps',
      title: 'Red Cap',
      kind: 'Washed crimson twill',
      image: `${IMG_DIR}cap-2.webp`,
      price: 34,
      single: true
    },
    {
      id: 'c3',
      cat: 'caps',
      title: 'Bone Cap',
      kind: 'Unbleached canvas',
      image: `${IMG_DIR}cap-3.webp`,
      price: 36,
      single: true
    },
    {
      id: 'c4',
      cat: 'caps',
      title: 'Forest Cap',
      kind: 'Brushed heavy cotton',
      image: `${IMG_DIR}cap-4.webp`,
      price: 36,
      single: true
    },
    {
      id: 'c5',
      cat: 'caps',
      title: 'Black Bucket Hat',
      kind: 'Water-repellent nylon',
      image: `${IMG_DIR}cap-5.webp`,
      price: 42,
      single: true
    },
    {
      id: 'c6',
      cat: 'caps',
      title: 'Corduroy Cap',
      kind: 'Wide-wale espresso cord',
      image: `${IMG_DIR}cap-6.webp`,
      price: 38,
      single: true
    },

    /* ───────── BAGS (4 items on floating oak shelves) ───────── */
    {
      id: 'b1',
      cat: 'bags',
      title: 'Day Pack',
      kind: 'Black ballistic nylon',
      image: `${IMG_DIR}bag-4.webp`,
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
      title: 'Canvas Tote',
      kind: 'Heavyweight 18oz duck',
      image: `${IMG_DIR}bag-5.webp`,
      price: 54,
      single: true
    },
    {
      id: 'b3',
      cat: 'bags',
      title: 'Forest Sling',
      kind: 'Weatherproof ripstop',
      image: `${IMG_DIR}bag-6.webp`,
      price: 68,
      single: true
    },
    {
      id: 'b4',
      cat: 'bags',
      title: 'Weekend Duffel',
      kind: 'Full-grain leather trim',
      image: `${IMG_DIR}bag-7.webp`,
      price: 145,
      compareAt: 175,
      single: true
    },

    /* ───────── SHOES (6 items on the dark recessed shoe niche) ───────── */
    {
      id: 's1',
      cat: 'shoes',
      title: 'Court Sneaker',
      kind: 'White leather / gum',
      image: `${IMG_DIR}shoe-1.webp`,
      price: 118,
      sizes: ['40', '41', '42', '43', '44', '45'],
      outSizes: ['45']
    },
    {
      id: 's2',
      cat: 'shoes',
      title: 'Pulse Runner',
      kind: 'Mesh & suede overlay',
      image: `${IMG_DIR}shoe-2.webp`,
      price: 132,
      sizes: ['40', '41', '42', '43', '44', '45']
    },
    {
      id: 's3',
      cat: 'shoes',
      title: 'Court High',
      kind: 'Tumbled calfskin',
      image: `${IMG_DIR}shoe-3.webp`,
      price: 145,
      sizes: ['40', '41', '42', '43', '44']
    },
    {
      id: 's4',
      cat: 'shoes',
      title: 'Retro Runner',
      kind: 'Berry suede / gum sole',
      image: `${IMG_DIR}shoe-5.webp`,
      price: 128,
      sizes: ['40', '41', '42', '43', '44', '45']
    },
    {
      id: 's5',
      cat: 'shoes',
      title: 'Bone Court',
      kind: 'Bone leather low-top',
      image: `${IMG_DIR}shoe-10.webp`,
      price: 118,
      sizes: ['40', '41', '42', '43', '44']
    },
    {
      id: 's6',
      cat: 'shoes',
      title: 'Penny Loafer',
      kind: 'Hand-sewn black leather',
      image: `${IMG_DIR}shoe-12.webp`,
      price: 168,
      sizes: ['40', '41', '42', '43', '44', '45'],
      outSizes: ['40']
    }
  ];
}
