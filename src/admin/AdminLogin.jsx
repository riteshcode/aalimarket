import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import StaffLogin from '../components/StaffLogin';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { saveLogin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isAdmin) return <Navigate to="/admin" replace />;

  function onVerified(data) {
    // Riders also use username login — keep them out of the admin panel
    if (data?.user?.role !== 'admin') {
      setError('This is a rider account. Riders log in at /rider.');
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
        <StaffLogin onVerified={onVerified} />
        {error && <p className="form-error">{error}</p>}
        <p className="muted small">Forgot the password? Run <code>npm run admin:set-password -- &lt;username&gt;</code> on the server.</p>
      </div>
    </div>
  );
}
