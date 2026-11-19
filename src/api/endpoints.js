// All API calls in one place, grouped the same way as the Postman collection.
import { request, downloadFile } from './client';

const C = 'customer';
const A = 'admin';
const R = 'rider';

export const authApi = {
  sendOtp: (mobile) => request('/auth/otp/send', { method: 'POST', body: { mobile, purpose: 'login' } }),
  verifyOtp: (mobile, code, name) =>
    request('/auth/otp/verify', { method: 'POST', body: { mobile, code, purpose: 'login', ...(name ? { name } : {}) } }),
  logout: (refreshToken) => request('/auth/logout', { method: 'POST', body: { refreshToken } }),
  me: () => request('/me', { auth: C }),
  updateMe: (body) => request('/me', { method: 'PATCH', body, auth: C }),
};

export const catalogApi = {
  categories: () => request('/categories'),
  banners: () => request('/banners'),
  settings: () => request('/settings'),
  // Type-ahead: prefix match, top 8 → [{ id, slug, title, price, image }]
  suggest: (q) => request('/products/suggest', { query: { q } }),
  // sort: popular | price_asc | price_desc | newest | discount
  products: (query) => request('/products', { query }),
  product: (slug) => request(`/products/${slug}`),
  related: (productId, limit = 10) => request(`/products/${productId}/related`, { query: { limit } }),
  reviews: (productId, page = 1) => request(`/products/${productId}/reviews`, { query: { page, limit: 20 } }),
  addReview: (productId, body) => request(`/products/${productId}/reviews`, { method: 'POST', body, auth: C }),
  // The shopper's own review in any status (pending / approved / rejected), or null
  myReview: (productId) => request(`/products/${productId}/reviews/mine`, { auth: C }),
};

export const cartApi = {
  // pincode (optional) previews that area's delivery fee
  get: (pincode) => request('/cart', { query: { pincode }, auth: C }),
  // A cart line = product + variant. variantId is required for products that have variants.
  addItem: (productId, qty, variantId) =>
    request('/cart/items', { method: 'POST', body: { productId, qty, ...(variantId ? { variantId } : {}) }, auth: C }),
  updateItem: (productId, qty, variantId) =>
    request(`/cart/items/${productId}`, { method: 'PATCH', body: { qty }, query: { variantId }, auth: C }),
  removeItem: (productId, variantId) =>
    request(`/cart/items/${productId}`, { method: 'DELETE', query: { variantId }, auth: C }),
  applyCoupon: (code) => request('/cart/coupon', { method: 'POST', body: { code }, auth: C }),
  removeCoupon: () => request('/cart/coupon', { method: 'DELETE', auth: C }),
  clear: () => request('/cart', { method: 'DELETE', auth: C }),
};

export const addressApi = {
  list: () => request('/addresses', { auth: C }),
  create: (body) => request('/addresses', { method: 'POST', body, auth: C }),
  update: (id, body) => request(`/addresses/${id}`, { method: 'PATCH', body, auth: C }),
  setDefault: (id) => request(`/addresses/${id}/default`, { method: 'POST', auth: C }),
  remove: (id) => request(`/addresses/${id}`, { method: 'DELETE', auth: C }),
  serviceability: (pincode) => request('/serviceability', { query: { pincode } }),
};

export const orderApi = {
  // paymentMethod: cod | upi | card | netbanking
  create: (addressId, paymentMethod, idempotencyKey, deliveryNote) =>
    request('/orders', {
      method: 'POST',
      body: { addressId, paymentMethod, ...(deliveryNote ? { deliveryNote } : {}) },
      headers: { 'Idempotency-Key': idempotencyKey },
      auth: C,
    }),
  list: (page = 1) => request('/orders', { query: { page, limit: 20 }, auth: C }),
  get: (id) => request(`/orders/${id}`, { auth: C }),
  cancel: (id, reason) => request(`/orders/${id}/cancel`, { method: 'POST', body: { reason }, auth: C }),
  // Online payment failed/cancelled → try again (returns { payment }) or switch to cash
  retryPayment: (id) => request(`/orders/${id}/payment`, { method: 'POST', auth: C }),
  switchToCod: (id) => request(`/orders/${id}/payment-method`, { method: 'PATCH', body: { paymentMethod: 'cod' }, auth: C }),
  // "Buy again" → { cart, skipped: [{ productId, title, reason, requested, added }] }
  reorder: (id) => request(`/orders/${id}/reorder`, { method: 'POST', auth: C }),
};

export const paymentApi = {
  // orderId = our order id; the rest comes from Razorpay's checkout callback
  verify: (body) => request('/payments/verify', { method: 'POST', body, auth: C }),
};

// kind = 'customer' (order updates) or 'rider' (new deliveries)
export const pushApi = {
  publicKey: () => request('/push/vapid-public-key'),
  subscribe: (subscription, kind = C) => request('/me/push-subscriptions', { method: 'POST', body: subscription, auth: kind }),
  unsubscribe: (endpoint, kind = C) => request('/me/push-subscriptions', { method: 'DELETE', body: { endpoint }, auth: kind }),
};

export const riderApi = {
  orders: (status) => request('/rider/orders', { query: { status, limit: 50 }, auth: R }),
  outForDelivery: (id) => request(`/rider/orders/${id}/out-for-delivery`, { method: 'PATCH', auth: R }),
  // otp is a string ("0042"); cashCollected in paise, only for COD
  deliver: (id, otp, cashCollected) =>
    request(`/rider/orders/${id}/deliver`, {
      method: 'POST',
      body: { otp, ...(cashCollected !== undefined ? { cashCollected } : {}) },
      auth: R,
    }),
};

export const wishlistApi = {
  get: () => request('/wishlist', { auth: C }),
  add: (productId) => request(`/wishlist/${productId}`, { method: 'POST', auth: C }),
  remove: (productId) => request(`/wishlist/${productId}`, { method: 'DELETE', auth: C }),
};

export const adminApi = {
  // Dashboard + customers
  stats: () => request('/admin/stats', { auth: A }),
  users: (query) => request('/admin/users', { query, auth: A }),
  // Store settings
  settings: () => request('/admin/settings', { auth: A }),
  updateSettings: (body) => request('/admin/settings', { method: 'PATCH', body, auth: A }),
  // Delivery areas
  pincodes: (query) => request('/admin/pincodes', { query, auth: A }),
  createPincode: (body) => request('/admin/pincodes', { method: 'POST', body, auth: A }),
  updatePincode: (id, body) => request(`/admin/pincodes/${id}`, { method: 'PATCH', body, auth: A }),
  deletePincode: (id) => request(`/admin/pincodes/${id}`, { method: 'DELETE', auth: A }),
  // Products (admin list includes inactive)
  products: (query) => request('/admin/products', { query, auth: A }),
  // rows: [{ id, price?, mrp?, stock?, isActive? }] → { updated, failed: [{ id, error }] }
  bulkUpdateProducts: (rows) => request('/admin/products/bulk', { method: 'PATCH', body: rows, auth: A }),
  exportProducts: () => downloadFile('/admin/products/export', { auth: A, fallbackName: 'products.csv' }),
  importProducts: (file, dryRun) => {
    const form = new FormData();
    form.append('file', file);
    return request('/admin/products/import', { method: 'POST', body: form, query: { dryRun: String(dryRun) }, auth: A });
  },
  createProduct: (body) => request('/admin/products', { method: 'POST', body, auth: A }),
  updateProduct: (id, body) => request(`/admin/products/${id}`, { method: 'PATCH', body, auth: A }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE', auth: A }),
  // Categories (admin list includes inactive)
  categories: () => request('/admin/categories', { auth: A }),
  createCategory: (body) => request('/admin/categories', { method: 'POST', body, auth: A }),
  updateCategory: (id, body) => request(`/admin/categories/${id}`, { method: 'PATCH', body, auth: A }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE', auth: A }),
  // Coupons
  coupons: () => request('/admin/coupons', { auth: A }),
  createCoupon: (body) => request('/admin/coupons', { method: 'POST', body, auth: A }),
  updateCoupon: (id, body) => request(`/admin/coupons/${id}`, { method: 'PATCH', body, auth: A }),
  deleteCoupon: (id) => request(`/admin/coupons/${id}`, { method: 'DELETE', auth: A }),
  // Banners (admin list includes inactive)
  banners: () => request('/admin/banners', { auth: A }),
  createBanner: (body) => request('/admin/banners', { method: 'POST', body, auth: A }),
  updateBanner: (id, body) => request(`/admin/banners/${id}`, { method: 'PATCH', body, auth: A }),
  deleteBanner: (id) => request(`/admin/banners/${id}`, { method: 'DELETE', auth: A }),
  // Orders — query: { page, limit, status, from, to, q }
  orders: (query) => request('/admin/orders', { query, auth: A }),
  order: (id) => request(`/admin/orders/${id}`, { auth: A }),
  latestOrders: (since) => request('/admin/orders/latest', { query: { since }, auth: A }),
  assignRider: (id, riderId) => request(`/admin/orders/${id}/assign`, { method: 'PATCH', body: { riderId }, auth: A }),
  // Riders
  riders: (query) => request('/admin/riders', { query, auth: A }),
  createRider: (body) => request('/admin/riders', { method: 'POST', body, auth: A }),
  updateRider: (id, body) => request(`/admin/riders/${id}`, { method: 'PATCH', body, auth: A }),
  // Reports (IST days; periods with no orders are left out)
  salesReport: (query) => request('/admin/reports/sales', { query, auth: A }),
  topProducts: (query) => request('/admin/reports/top-products', { query, auth: A }),
  codReport: (date) => request('/admin/reports/cod', { query: { date }, auth: A }),
  // Reviews
  reviews: (query) => request('/admin/reviews', { query, auth: A }),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE', auth: A }),
  // status: 'approved' | 'rejected' → { review, product: { id, ratingAvg, ratingCount } }
  moderateReview: (id, status, note) =>
    request(`/admin/reviews/${id}/status`, { method: 'PATCH', body: { status, ...(note ? { note } : {}) }, auth: A }),
  updateOrderStatus: (id, status, note) =>
    request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note }, auth: A }),
  // Uploads — field name "images" (max 6). Returns { urls: [...] } (absolute S3 URLs)
  upload: (files) => {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('images', file));
    return request('/admin/uploads', { method: 'POST', body: form, auth: A });
  },
};
