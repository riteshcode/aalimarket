import { useState } from 'react';
import { ShoppingBasket } from 'lucide-react';
import { imageUrl } from '../lib/format';

// Shows the product photo, or a calm placeholder if there's none / it fails to load
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(src);

  if (!url || failed) {
    return (
      <div className={`img-placeholder ${className}`} aria-label={alt}>
        <ShoppingBasket size={36} strokeWidth={1.4} />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
