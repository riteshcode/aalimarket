import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/Logo';
import OtpLogin from '../components/OtpLogin';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { saveLogin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isAdmin) return <Navigate to="/admin" replace />;

  function onVerified(data) {
    const role = data?.user?.role;
    // If the backend sends a role, only let admins in
    if (role && !['admin', 'superadmin', 'staff'].includes(role)) {
      setError('This number isn’t an admin account. Use the seeded admin mobile (default 9999999999).');
      return;
    }
    saveLogin('admin', data);
    navigate('/admin', { replace: true });
  }

  return (
    <div className="auth auth--admin">
      <div className="auth__panel">
        <Logo to="/admin/login" sub="Store admin" />
        <h1>Admin log in</h1>
        <p className="muted">Manage products, prices, coupons and orders.</p>
        <OtpLogin askName={false} onVerified={onVerified} defaultMobile="9999999999" />
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}
