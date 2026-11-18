import { useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { ToastProvider } from './context/ToastContext';
import { ShopProvider } from './context/ShopContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import RequireAuth from './components/RequireAuth';
import { useShop } from './context/ShopContext';

import Home from './pages/Home';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminCoupons from './admin/AdminCoupons';
import AdminBanners from './admin/AdminBanners';
import AdminOrders from './admin/AdminOrders';
import AdminCustomers from './admin/AdminCustomers';
import AdminPincodes from './admin/AdminPincodes';
import AdminSettings from './admin/AdminSettings';

// Header + bottom tab bar around every shopper page
function StoreLayout() {
  const { pathname } = useLocation();
  const { settings } = useShop();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="store">
      <Header />
      {settings && !settings.storeOpen && (
        <p className="closed-strip">Store is closed right now. You can browse, and orders open again at {settings.storeTimings?.open}.</p>
      )}
      <main className="store__main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

const protect = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <ToastProvider>
          <ShopProvider>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={protect(<Checkout />)} />
                <Route path="/orders" element={protect(<Orders />)} />
                <Route path="/orders/:id" element={protect(<OrderDetail />)} />
                <Route path="/wishlist" element={protect(<Wishlist />)} />
                <Route path="/account" element={protect(<Account />)} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/login" element={<Login />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="areas" element={<AdminPincodes />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </ShopProvider>
        </ToastProvider>
      </LangProvider>
    </AuthProvider>
  );
}
