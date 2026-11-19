import { describe, it, expect } from 'vitest';
import { money, toPaise, toRupees, discountPercent, pickLang, asList, normalizeCart, getId, hasVariants, defaultVariant, variantImage } from './format';

describe('money (paise → ₹)', () => {
  it('shows whole rupees without decimals', () => {
    expect(money(8500)).toBe('₹85');
  });
  it('shows paise when there are any', () => {
    expect(money(8550)).toBe('₹85.50');
  });
  it('uses Indian digit grouping', () => {
    expect(money(12345600)).toBe('₹1,23,456');
  });
  it('treats missing values as zero', () => {
    expect(money(undefined)).toBe('₹0');
  });
});

describe('toPaise / toRupees', () => {
  it('converts rupees to integer paise', () => {
    expect(toPaise('249')).toBe(24900);
    expect(toPaise('19.99')).toBe(1999); // no floating point leftovers
  });
  it('converts paise back to a rupee string for form inputs', () => {
    expect(toRupees(24900)).toBe('249');
    expect(toRupees(1999)).toBe('19.99');
  });
});

describe('discountPercent', () => {
  it('rounds the saving percentage', () => {
    expect(discountPercent(27500, 24900)).toBe(9);
  });
  it('is 0 when there is no saving', () => {
    expect(discountPercent(2000, 2000)).toBe(0);
    expect(discountPercent(0, 100)).toBe(0);
  });
});

describe('pickLang', () => {
  const title = { en: 'Tomato', hi: 'टमाटर' };
  it('picks the requested language', () => {
    expect(pickLang(title, 'hi')).toBe('टमाटर');
  });
  it('falls back to English', () => {
    expect(pickLang({ en: 'Tomato' }, 'hi')).toBe('Tomato');
  });
  it('passes plain strings through', () => {
    expect(pickLang('Tomato', 'hi')).toBe('Tomato');
  });
});

describe('asList / getId', () => {
  it('reads arrays and wrapped lists (wishlist sends { products })', () => {
    expect(asList([1, 2])).toEqual([1, 2]);
    expect(asList({ products: [{ id: 'a' }] })).toEqual([{ id: 'a' }]);
    expect(asList(null)).toEqual([]);
  });
  it('gets the id from an object or a plain id', () => {
    expect(getId({ id: 'x' })).toBe('x');
    expect(getId('y')).toBe('y');
  });
});

describe('normalizeCart (GET /cart shape)', () => {
  // Copied from SAMPLE_RESPONSES.md
  const sample = {
    items: [
      { productId: 'p1', title: { en: 'Aata', hi: 'आटा' }, slug: 'aata', image: '', unit: '5 kg', price: 24900, mrp: 27500, qty: 2, stock: 80, lineTotal: 49800 },
    ],
    pricing: { subtotal: 49800, discount: 5000, deliveryFee: 0, handlingFee: 500, total: 45300 },
    couponCode: 'AALI50',
    couponError: null,
  };

  it('copies totals from pricing', () => {
    const cart = normalizeCart(sample);
    expect(cart.subtotal).toBe(49800);
    expect(cart.discount).toBe(5000);
    expect(cart.handlingFee).toBe(500);
    expect(cart.total).toBe(45300);
    expect(cart.coupon).toBe('AALI50');
  });

  it('works out the MRP total for the "you save" line', () => {
    expect(normalizeCart(sample).mrpTotal).toBe(55000);
  });

  it('handles an empty or missing cart', () => {
    const cart = normalizeCart(null);
    expect(cart.items).toEqual([]);
    expect(cart.total).toBe(0);
  });
});

describe('product variants', () => {
  // Shape from SAMPLE_RESPONSES.md (GET /products/:slug with variants)
  const atta = {
    images: ['atta.jpg'],
    variants: [
      { id: 'v1', label: { en: '1 kg', hi: '1 किलो' }, price: 5200, images: [], isDefault: true },
      { id: 'v10', label: { en: '10 kg', hi: '10 किलो' }, price: 47000, images: ['atta-10kg.jpg'], isDefault: false },
    ],
  };

  it('knows when a product has options', () => {
    expect(hasVariants(atta)).toBe(true);
    expect(hasVariants({ variants: [] })).toBe(false);
    expect(hasVariants({})).toBe(false);
  });

  it('picks the default option', () => {
    expect(defaultVariant(atta).id).toBe('v1');
    expect(defaultVariant({ variants: [] })).toBe(null);
  });

  it('uses the option photo, else the product photo', () => {
    expect(variantImage(atta, atta.variants[1])).toBe('atta-10kg.jpg');
    expect(variantImage(atta, atta.variants[0])).toBe('atta.jpg');
  });
});
