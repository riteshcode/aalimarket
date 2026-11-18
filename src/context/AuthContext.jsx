import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, setSession } from '../api/client';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

// Holds both sessions: the shopper (customer) and the store admin.
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => getSession('customer'));
  const [admin, setAdmin] = useState(() => getSession('admin'));
  const [rider, setRider] = useState(() => getSession('rider'));

  // Keep state in sync when the API client refreshes or clears a token
  useEffect(() => {
    const sync = () => {
      setCustomer(getSession('customer'));
      setAdmin(getSession('admin'));
      setRider(getSession('rider'));
    };
    window.addEventListener('aali:session', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('aali:session', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Called after a successful OTP verify
  function saveLogin(kind, data) {
    setSession(kind, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user || null,
    });
  }

  function updateUser(user) {
    const s = getSession('customer');
    if (s) setSession('customer', { ...s, user: { ...s.user, ...user } });
  }

  async function logout(kind = 'customer') {
    const s = getSession(kind);
    try {
      if (s?.refreshToken) await authApi.logout(s.refreshToken);
    } catch {
      // ignore — we clear locally anyway
    }
    setSession(kind, null);
  }

  const value = {
    customer,
    admin,
    user: customer?.user || null,
    isLoggedIn: Boolean(customer?.accessToken),
    isAdmin: Boolean(admin?.accessToken),
    rider,
    isRider: Boolean(rider?.accessToken),
    saveLogin,
    updateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
