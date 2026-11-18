import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import OtpLogin from '../components/OtpLogin';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function RiderLogin() {
  const { saveLogin, isRider } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (isRider) return <Navigate to="/rider" replace />;

  function onVerified(data) {
    if (data?.user?.role !== 'rider') {
      setError(t('This number isn’t registered as a delivery partner. Ask the store to add you.'));
      return;
    }
    saveLogin('rider', data);
    navigate('/rider', { replace: true });
  }

  return (
    <div className="auth auth--admin">
      <div className="auth__panel">
        <Logo to="/rider/login" sub={t('Delivery partner')} />
        <h1>{t('Rider log in')}</h1>
        <p className="muted">{t('Log in with the mobile number the store registered for you.')}</p>
        <OtpLogin askName={false} onVerified={onVerified} />
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
}
