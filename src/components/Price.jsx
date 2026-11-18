import { money, discountPercent } from '../lib/format';

// The price block is the hero of every product: big selling price, struck MRP, and the saving.
export default function Price({ price, mrp, size = 'md' }) {
  const off = discountPercent(mrp, price);
  const saving = mrp > price ? mrp - price : 0;

  return (
    <div className={`price price--${size}`}>
      <span className="price__now">{money(price)}</span>
      {off > 0 && (
        <>
          <s className="price__mrp" aria-label={`MRP ${money(mrp)}`}>{money(mrp)}</s>
          <span className="price__save">Save {money(saving)}</span>
        </>
      )}
    </div>
  );
}
