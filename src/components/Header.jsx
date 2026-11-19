import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import LocationPicker from './LocationPicker';
import { useShop } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { catalogApi } from '../api/endpoints';
import { money } from '../lib/format';
import ProductImage from './ProductImage';

export default function Header() {
  const navigate = useNavigate();
  const { cartCount } = useShop();
  const { lang, setLang, tr, t } = useLang();
  const { user, isLoggedIn } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  // Type-ahead: wait until the shopper pauses typing, then ask /products/suggest
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      catalogApi.suggest(q).then(({ data }) => setSuggestions(data || [])).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Phones: search is a small icon; tapping it turns the header into a search bar
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  function openSearch() {
    setSearching(true);
    // focus after the bar is shown so the phone keyboard opens
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeSearch() {
    setSearching(false);
    setOpen(false);
  }

  useEffect(() => {
    if (!searching) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeSearch();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searching]);

  function onSearch(e) {
    e.preventDefault();
    setOpen(false);
    setSearching(false);
    inputRef.current?.blur();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
  }

  function openProduct(slug) {
    setOpen(false);
    setSearching(false);
    setQuery('');
    navigate(`/product/${slug}`);
  }

  return (
    <header className={`header ${searching ? 'header--searching' : ''}`}>
      <div className="header__row container">
        <Logo />
        <LocationPicker />

        <form className="search" onSubmit={onSearch} role="search">
          <button type="button" className="search__back" onClick={closeSearch} aria-label={t('Close search')}>
            <ArrowLeft size={20} />
          </button>
          <Search size={18} aria-hidden="true" className="search__icon" />
          <input
            ref={inputRef}
            type="search"
            placeholder={t('Search rice, atta, oil…')}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            aria-label={t('Search products')}
            autoComplete="off"
          />
          {open && suggestions.length > 0 && (
            <ul className="suggest" role="listbox">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => openProduct(p.slug)}>
                    <span className="suggest__img"><ProductImage src={p.image} alt="" /></span>
                    <span className="suggest__title">{tr(p.title)}</span>
                    <strong>{money(p.price)}</strong>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="header__actions">
          <button className="search-toggle" onClick={openSearch} aria-label={t('Search products')}>
            <Search size={20} />
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label={t('Switch language')}
            title="English / हिंदी"
          >
            <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
            <span className={lang === 'hi' ? 'is-on' : ''}>हिं</span>
          </button>

          <nav className="header__links" aria-label="Main">
            <NavLink to="/products">{t('Shop')}</NavLink>
            <NavLink to="/orders">{t('Orders')}</NavLink>
            <NavLink to="/wishlist" aria-label="Wishlist"><Heart size={20} /></NavLink>
            <NavLink to={isLoggedIn ? '/account' : '/login'} aria-label="Account">
              <User size={20} />
              <span className="header__user">{isLoggedIn ? (user?.name?.split(' ')[0] || t('Account')) : t('Log in')}</span>
            </NavLink>
          </nav>

          <Link to="/cart" className="cart-btn" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-btn__count">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
