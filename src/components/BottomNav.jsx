import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, Package, User } from 'lucide-react';
import { useShop } from '../context/ShopContext';

// Mobile-only tab bar (hidden on wide screens via CSS)
export default function BottomNav() {
  const { cartCount } = useShop();
  const tabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/categories', label: 'Categories', icon: LayoutGrid },
    { to: '/cart', label: 'Cart', icon: ShoppingBag, badge: cartCount },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/account', label: 'Account', icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map(({ to, label, icon: Icon, end, badge }) => (
        <NavLink key={to} to={to} end={end} className="bottom-nav__item">
          <span className="bottom-nav__icon">
            <Icon size={22} />
            {badge > 0 && <span className="bottom-nav__badge">{badge}</span>}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
