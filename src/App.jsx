import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { LangProvider, useLang } from './context/LangContext';
import { ToastProvider } from './context/ToastContext';
import { ShopProvider, useShop } from './context/ShopContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import InstallBanner from './components/InstallBanner';
import RequireAuth from './components/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';
import { Spinner } from './components/States';
import { useOnline } from './lib/useOnline';

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
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import RefundPolicy from './pages/legal/RefundPolicy';
import Contact from './pages/legal/Contact';
import About from './pages/legal/About';

// Admin screens load only when someone opens /admin, so shoppers don't download them
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AdminProducts = lazy(() => import('./admin/AdminProducts'));
const AdminCategories = lazy(() => import('./admin/AdminCategories'));
const AdminCoupons = lazy(() => import('./admin/AdminCoupons'));
const AdminBanners = lazy(() => import('./admin/AdminBanners'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers'));
const AdminPincodes = lazy(() => import('./admin/AdminPincodes'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));
const PrintBill = lazy(() => import('./admin/PrintBill'));
const AdminRiders = lazy(() => import('./admin/AdminRiders'));
const AdminReports = lazy(() => import('./admin/AdminReports'));
const AdminReviews = lazy(() => import('./admin/AdminReviews'));
// Rider screens are their own small app at /rider
const RiderLogin = lazy(() => import('./rider/RiderLogin'));
const RiderApp = lazy(() => import('./rider/RiderApp'));

// Header + bottom tab bar around every shopper page
function StoreLayout() {
  const { pathname } = useLocation();
  const { settings } = useShop();
  const { t } = useLang();
  const online = useOnline();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="store">
      <Header />
      {!online && (
        <p className="offline-strip">
          <WifiOff size={16} /> {t('You’re offline. Showing saved items; cart and orders need internet.')}
        </p>
      )}
      {settings && !settings.storeOpen && (
        <p className="closed-strip">
          {t('Store is closed right now. You can browse, and orders open again at {time}.', { time: settings.storeTimings?.open })}
        </p>
      )}
      <main className="store__main">
        {/* key resets the boundary when the page changes, so one broken page doesn't stick */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
        <Footer />
      </main>
      <InstallBanner />
      <BottomNav />
    </div>
  );
}

const protect = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LangProvider>
          <ToastProvider>
            <ShopProvider>
              <Suspense fallback={<Spinner />}>
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
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/about" element={<About />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  <Route path="/login" element={<Login />} />

                  <Route path="/rider/login" element={<RiderLogin />} />
                  <Route path="/rider" element={<RiderApp />} />

                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/print/:id" element={<PrintBill />} />
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
                    <Route path="riders" element={<AdminRiders />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="reviews" element={<AdminReviews />} />
                  </Route>
                </Routes>
              </Suspense>
            </ShopProvider>
          </ToastProvider>
        </LangProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
