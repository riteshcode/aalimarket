import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import OtpLogin from '../components/OtpLogin';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { saveLogin, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  if (isLoggedIn) return <Navigate to={next} replace />;

  function onVerified(data) {
    saveLogin('customer', data);
    navigate(next, { replace: true });
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <Logo />
        <h1>Log in or sign up</h1>
        <p className="muted">We’ll send a one-time code to your mobile. No password needed.</p>
        <OtpLogin onVerified={onVerified} />
      </div>
      <div className="auth__side" aria-hidden="true">
        <div className="auth__price"><span>₹</span>42<s>₹55</s></div>
        <p>Every price shows what you save on MRP.</p>
      </div>
    </div>
  );
}
