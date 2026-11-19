import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, TicketPercent, Image, Truck, LogOut, Store, Users, MapPin, Settings, Bell, Bike, BarChart3, MessageSquare, KeyRound } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNewOrderAlert } from './useNewOrderAlert';
import { Drawer } from './AdminUi';
import ChangePasswordForm from '../components/ChangePasswordForm';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Truck },
  { to: '/admin/riders', label: 'Riders', icon: Bike },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/areas', label: 'Delivery areas', icon: MapPin },
  { to: '/admin/settings', label: 'Store settings', icon: Settings },
];

export default function AdminLayout() {
  const { isAdmin, admin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [changingPassword, setChangingPassword] = useState(false);
  const [alertsOn, setAlertsOn] = useState(() => 'Notification' in window && Notification.permission === 'granted');

  const { unseen, clearUnseen } = useNewOrderAlert(isAdmin, (order, count) => {
    toast.success(count > 1 ? `${count} new orders` : `New order #${order.orderNumber}`);
  });

  // Opening the Orders page counts as seeing the new orders
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) clearUnseen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, unseen]);

  // Browsers only allow sound + notifications after the admin clicks something, so ask with a button
  async function enableAlerts() {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setAlertsOn(result === 'granted');
      if (result !== 'granted') toast.error('Notifications are blocked. You’ll still hear a sound and see a badge.');
    }
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  async function onLogout() {
    await logout('admin');
    navigate('/admin/login');
  }

  return (
    <div className="admin">
      <aside className="admin__side">
        <Logo to="/admin" sub="Store admin" />
        <nav className="admin__nav">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} /> <span>{label}</span>
              {to === '/admin/orders' && unseen > 0 && <span className="nav-badge">{unseen}</span>}
            </NavLink>
          ))}
        </nav>
        {!alertsOn && (
          <button className="alert-btn" onClick={enableAlerts}>
            <Bell size={16} /> Turn on new-order alerts
          </button>
        )}
        <div className="admin__foot">
          <NavLink to="/"><Store size={18} /> <span>View store</span></NavLink>
          <button onClick={() => setChangingPassword(true)}><KeyRound size={18} /> <span>Change password</span></button>
          <button onClick={onLogout}><LogOut size={18} /> <span>Log out</span></button>
          {admin?.user && <p className="muted small">{admin.user.username || admin.user.mobile}</p>}
        </div>
      </aside>
      <main className="admin__main">
        <Outlet />
      </main>
      {changingPassword && (
        <Drawer title="Change password" onClose={() => setChangingPassword(false)}>
          <p className="muted small">You’ll stay logged in here. Every other device using this account will be logged out.</p>
          <ChangePasswordForm
            kind="admin"
            onDone={() => {
              setChangingPassword(false);
              toast.success('Password changed');
            }}
          />
        </Drawer>
      )}
    </div>
  );
}
