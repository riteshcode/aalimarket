import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, TicketPercent, Image, Truck, LogOut, Store, Users, MapPin, Settings } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Truck },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/areas', label: 'Delivery areas', icon: MapPin },
  { to: '/admin/settings', label: 'Store settings', icon: Settings },
];

export default function AdminLayout() {
  const { isAdmin, admin, logout } = useAuth();
  const navigate = useNavigate();

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
            <NavLink key={to} to={to} end={end}><Icon size={18} /> <span>{label}</span></NavLink>
          ))}
        </nav>
        <div className="admin__foot">
          <NavLink to="/"><Store size={18} /> <span>View store</span></NavLink>
          <button onClick={onLogout}><LogOut size={18} /> <span>Log out</span></button>
          {admin?.user?.mobile && <p className="muted small">+91 {admin.user.mobile}</p>}
        </div>
      </aside>
      <main className="admin__main">
        <Outlet />
      </main>
    </div>
  );
}
