import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cartApi, wishlistApi, catalogApi } from '../api/endpoints';
import { asList, getId, normalizeCart } from '../lib/format';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLang } from './LangContext';

const ShopContext = createContext(null);

const EMPTY_CART = normalizeCart({ items: [] });

// Cart + wishlist. Both live on the server, so the shopper must be logged in.
export function ShopProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState(EMPTY_CART);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistReady, setWishlistReady] = useState(false);
  const [busyId, setBusyId] = useState(null); // product currently being updated
  // Store settings: { deliveryFee, freeDeliveryThreshold, handlingFee, minOrderValue, storeOpen, storeTimings }
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    catalogApi.settings().then(({ data }) => setSettings(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadCart();
      loadWishlist();
    } else {
      setCart(EMPTY_CART);
      setWishlistIds(new Set());
      setWishlistReady(false);
    }
  }, [isLoggedIn]);

  async function loadCart() {
    try {
      const { data } = await cartApi.get();
      setCart(normalizeCart(data));
    } catch {
      setCart(EMPTY_CART);
    }
  }

  async function loadWishlist() {
    try {
      const { data } = await wishlistApi.get();
      const ids = asList(data).map((x) => getId(x.product) || x.productId || getId(x));
      setWishlistIds(new Set(ids));
    } catch {
      // not critical
    } finally {
      setWishlistReady(true);
    }
  }

  function requireLogin() {
    if (isLoggedIn) return true;
    navigate('/login?next=' + encodeURIComponent(location.pathname));
    return false;
  }

  // Runs a cart call, then reloads the cart so totals always come from the server
  async function cartAction(productId, fn, successMsg) {
    if (!requireLogin()) return false;
    setBusyId(productId);
    try {
      await fn();
      await loadCart();
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusyId(null);
    }
  }

  const qtyInCart = (productId) => cart.items.find((i) => i.productId === productId)?.qty || 0;

  const addToCart = (productId, qty = 1) =>
    cartAction(productId, () => cartApi.addItem(productId, qty), t('Added to cart'));

  const setQty = (productId, qty) =>
    cartAction(productId, () => (qty <= 0 ? cartApi.removeItem(productId) : cartApi.updateItem(productId, qty)));

  const removeFromCart = (productId) =>
    cartAction(productId, () => cartApi.removeItem(productId), t('Removed from cart'));

  const applyCoupon = (code) =>
    cartAction('coupon', () => cartApi.applyCoupon(code.trim().toUpperCase()), t('Coupon applied'));

  const removeCoupon = () => cartAction('coupon', () => cartApi.removeCoupon(), t('Coupon removed'));

  async function toggleWishlist(productId) {
    if (!requireLogin()) return;
    const saved = wishlistIds.has(productId);
    // update UI first, undo if the request fails
    const next = new Set(wishlistIds);
    saved ? next.delete(productId) : next.add(productId);
    setWishlistIds(next);
    try {
      saved ? await wishlistApi.remove(productId) : await wishlistApi.add(productId);
      toast.success(saved ? t('Removed from wishlist') : t('Saved to wishlist'));
    } catch (err) {
      setWishlistIds(wishlistIds);
      toast.error(err.message);
    }
  }

  const cartCount = cart.items.reduce((sum, i) => sum + i.qty, 0);

  const value = {
    settings,
    cart,
    cartCount,
    busyId,
    loadCart,
    qtyInCart,
    addToCart,
    setQty,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    wishlistIds,
    wishlistReady,
    toggleWishlist,
    loadWishlist,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
