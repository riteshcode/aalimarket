// Helpers shared across the app.

// All money in the API is integer paise. 8500 → "₹85", 8550 → "₹85.50"
export function money(paise) {
  const rupees = (Number(paise) || 0) / 100;
  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export const toPaise = (rupees) => Math.round(Number(rupees || 0) * 100);
export const toRupees = (paise) => (Number(paise || 0) / 100).toString();

export const getId = (obj) => (obj && typeof obj === 'object' ? obj.id || obj._id : obj);

// Bilingual fields come as { en, hi } — pick the right one, fall back to English
export function pickLang(field, lang = 'en') {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.hi || '';
}

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE || '';

export function imageUrl(img) {
  const src = typeof img === 'string' ? img : img?.url || img?.path || '';
  if (!src) return '';
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  return ASSET_BASE + (src.startsWith('/') ? src : '/' + src);
}

export function discountPercent(mrp, price) {
  if (!mrp || !price || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatDate(value, withTime = false) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export const STATUS_LABELS = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const CANCELLABLE = ['placed', 'confirmed', 'packed'];

export const PAYMENT_LABELS = { cod: 'Cash on delivery', upi: 'UPI', card: 'Card', netbanking: 'Net banking' };

// Lists may come back as an array or wrapped like { items: [...] }
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return data.items || data.results || data.docs || data.rows || data.products || data.orders || [];
}

// GET /cart response:
// { items: [{ productId, title, slug, image, unit, price, mrp, qty, stock, inStock, lineTotal }],
//   pricing: { subtotal, discount, deliveryFee, handlingFee, total }, couponCode, couponError }
export function normalizeCart(data) {
  const items = data?.items || [];
  const pricing = data?.pricing || {};
  const mrpTotal = items.reduce((sum, i) => sum + i.mrp * i.qty, 0);

  return {
    items,
    subtotal: pricing.subtotal || 0,
    discount: pricing.discount || 0,
    deliveryFee: pricing.deliveryFee || 0,
    handlingFee: pricing.handlingFee || 0,
    total: pricing.total || 0,
    mrpTotal,
    coupon: data?.couponCode || null,
    couponError: data?.couponError || null,
  };
}
