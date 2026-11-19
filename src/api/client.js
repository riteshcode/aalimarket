// Small fetch wrapper for the Aali Market API.
// Every backend response looks like: { success, data, error, meta? }
// Customer and admin sessions are stored separately, just like in the Postman collection.

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const STORAGE_KEYS = {
  customer: 'aali.session.customer',
  admin: 'aali.session.admin',
  rider: 'aali.session.rider',
};

export function getSession(kind) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS[kind])) || null;
  } catch {
    return null;
  }
}

export function setSession(kind, session) {
  if (session) localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEYS[kind]);
  // Let the rest of the app know the session changed
  window.dispatchEvent(new CustomEvent('aali:session', { detail: { kind } }));
}

export class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Friendly messages for error codes mentioned in the collection
const ERROR_MESSAGES = {
  COUPON_NOT_FOUND: 'This coupon code doesn’t exist.',
  COUPON_INACTIVE: 'This coupon is no longer active.',
  COUPON_EXPIRED: 'This coupon has expired.',
  COUPON_NOT_STARTED: 'This coupon isn’t live yet.',
  COUPON_MIN_ORDER: 'Add more items to use this coupon.',
  COUPON_USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit.',
  COUPON_PER_USER_LIMIT_REACHED: 'You’ve already used this coupon.',
  CART_EMPTY: 'Your cart is empty.',
  ORDER_NOT_CANCELLABLE: 'This order can’t be cancelled any more — it has already left the store.',
  REVIEW_REQUIRES_DELIVERED_ORDER: 'You can review this product after it’s delivered to you.',
  MIN_ORDER_VALUE: 'Your cart is below the minimum order value.',
  STORE_CLOSED: 'The store is closed right now and isn’t taking orders.',
  NOT_SERVICEABLE: 'We don’t deliver to this pincode yet.',
  FORBIDDEN: 'This account doesn’t have access here.',
  PAYMENT_NOT_RETRYABLE: 'This order can’t be paid online any more.',
  INVALID_DELIVERY_OTP: 'Wrong OTP. Ask the customer to check the order page.',
  DELIVERY_OTP_LOCKED: 'Too many wrong OTPs. Ask the store to mark this order delivered.',
  PAYMENT_METHOD_NOT_CHANGEABLE: 'The payment method of this order can’t be changed any more.',
  PUSH_NOT_CONFIGURED: 'Notifications aren’t set up on the server yet.',
  ACCOUNT_DISABLED: 'This account has been turned off. Please contact the store.',
  FILE_TOO_LARGE: 'This image is too big. Use photos under 5 MB.',
  UPLOAD_FAILED: 'Image upload failed. Check the image storage settings on the server.',
  VARIANT_REQUIRED: 'Please choose an option first.',
  VARIANT_NOT_FOUND: 'This option isn’t available any more.',
  REVIEW_ALREADY_EXISTS: 'You’ve already reviewed this product.',
  MOBILE_ALREADY_REGISTERED: 'This mobile number already has an account. Use a different number for the rider.',
};

// One refresh request at a time per session
const refreshing = {};

async function refreshSession(kind) {
  if (refreshing[kind]) return refreshing[kind];

  refreshing[kind] = (async () => {
    const session = getSession(kind);
    if (!session?.refreshToken) return false;
    try {
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const json = await res.json();
      setSession(kind, {
        ...session,
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
      });
      return true;
    } catch {
      setSession(kind, null);
      return false;
    } finally {
      delete refreshing[kind];
    }
  })();

  return refreshing[kind];
}

function buildUrl(path, query) {
  let url = API_BASE + path;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, value);
    });
    const qs = params.toString();
    if (qs) url += '?' + qs;
  }
  return url;
}

// Adds the saved token; on 401 refreshes once and retries. Returns the raw Response.
async function authFetch(url, init, auth, retry = true) {
  const headers = { ...(init.headers || {}) };
  const session = auth ? getSession(auth) : null;
  if (session?.accessToken) headers.Authorization = 'Bearer ' + session.accessToken;
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && auth && retry && (await refreshSession(auth))) {
    return authFetch(url, init, auth, false);
  }
  return res;
}

/** Downloads a file endpoint (e.g. CSV export) and saves it with the server's file name. */
export async function downloadFile(path, { auth, fallbackName = 'download' } = {}) {
  const res = await authFetch(API_BASE + path, { method: 'GET' }, auth);
  if (!res.ok) throw new ApiError(`Download failed (${res.status})`, 'DOWNLOAD_FAILED', res.status);
  const blob = await res.blob();
  const match = /filename="?([^"]+)"?/.exec(res.headers.get('Content-Disposition') || '');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = match ? match[1] : fallbackName;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * request('/products', { query: { page: 1 } })
 * request('/cart/items', { method: 'POST', body: {...}, auth: 'customer' })
 * Returns { data, meta }
 */
export async function request(path, options = {}) {
  const { method = 'GET', body, query, auth = null, headers = {}, retry = true } = options;

  const finalHeaders = { ...headers };
  const isFormData = body instanceof FormData;
  if (body && !isFormData) finalHeaders['Content-Type'] = 'application/json';

  if (auth) {
    const session = getSession(auth);
    if (session?.accessToken) finalHeaders.Authorization = 'Bearer ' + session.accessToken;
  }

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError('Can’t reach the server. Check that the backend is running on port 4000.', 'NETWORK', 0);
  }

  // Access token expired → refresh once and try again
  if (res.status === 401 && auth && retry) {
    const ok = await refreshSession(auth);
    if (ok) return request(path, { ...options, retry: false });
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // empty body (e.g. 204)
  }

  if (!res.ok || json?.success === false) {
    const err = json?.error || {};
    const code = typeof err === 'string' ? err : err.code;
    const message =
      ERROR_MESSAGES[code] ||
      (typeof err === 'object' && err.message) ||
      (typeof err === 'string' && err) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, code, res.status, typeof err === 'object' ? err.details : null);
  }

  return { data: json?.data, meta: json?.meta };
}
