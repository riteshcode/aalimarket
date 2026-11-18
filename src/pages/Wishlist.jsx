import { Heart } from 'lucide-react';
import { wishlistApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { useShop } from '../context/ShopContext';
import { asList, getId } from '../lib/format';
import ProductCard from '../components/ProductCard';
import { Spinner, ErrorState, EmptyState } from '../components/States';

export default function Wishlist() {
  const { wishlistIds, wishlistReady } = useShop();
  const { data, loading, error, reload } = useFetch(() => wishlistApi.get(), []);
  // Items may be products or { product } wrappers; hide ones removed in this session
  const products = asList(data)
    .map((x) => (typeof x.product === 'object' && x.product ? x.product : x))
    .filter((p) => !wishlistReady || wishlistIds.has(getId(p)));

  return (
    <div className="page container">
      <h1 className="page-title">Wishlist</h1>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && products.length === 0 && (
        <EmptyState icon={Heart} title="Nothing saved yet" text="Tap the heart on any product to keep it here for later." action="Browse products" to="/products" />
      )}
      <div className="pgrid">
        {products.map((p) => <ProductCard key={getId(p)} product={p} />)}
      </div>
    </div>
  );
}
