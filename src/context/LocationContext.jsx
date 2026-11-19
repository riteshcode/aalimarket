import { createContext, useContext, useEffect, useState } from 'react';
import { addressApi } from '../api/endpoints';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);
const STORAGE_KEY = 'aali.location';

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

/**
 * Where the shopper wants delivery (Zepto/Blinkit-style "Delivering to ..." in the header).
 * location = { pincode, label, addressId?, serviceable, etaDays, etaMinutes?, areaName? }
 * Saved in localStorage. For a logged-in shopper with no choice yet, their default address is used.
 */
export function LocationProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [location, setLocationState] = useState(readSaved);

  function save(next) {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    setLocationState(next);
  }

  // Check a pincode with GET /serviceability and remember it with a display label
  async function choosePincode(pincode, label, addressId) {
    const { data } = await addressApi.serviceability(pincode);
    const next = {
      pincode,
      label: label || data.areaName?.en || pincode,
      areaName: data.areaName || null,
      addressId: addressId || null,
      serviceable: data.serviceable,
      etaDays: data.etaDays,
      etaMinutes: data.etaMinutes ?? null, // once the backend adds minute-level ETAs
    };
    save(next);
    return next;
  }

  // First visit after login: start from the default saved address
  useEffect(() => {
    if (!isLoggedIn || location) return;
    addressApi.list()
      .then(({ data }) => {
        const list = data || [];
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) return choosePincode(def.pincode, def.line2 || def.line1, def.id);
        return null;
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <LocationContext.Provider value={{ location, choosePincode, clearLocation: () => save(null) }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocationPref = () => useContext(LocationContext);
