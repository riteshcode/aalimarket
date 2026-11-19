import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useShop } from '../context/ShopContext';
import { getId, money, variantImage } from '../lib/format';
import ProductImage from './ProductImage';
import QtyStepper from './QtyStepper';

// Bottom sheet listing a product's options, each with its own price and add/stepper
export default function VariantSheet({ product, onClose }) {
  const { tr, t } = useLang();
  const { qtyInCart, addToCart, setQty, busyId, lineKey } = useShop();
  const id = getId(product);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portal to <body> so a parent's overflow / transform can't clip the sheet
  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label={tr(product.title)}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__panel variant-sheet">
        <span className="sheet__handle" aria-hidden="true" />
        <div className="variant-sheet__head">
          <div>
            <h2>{tr(product.title)}</h2>
            <span className="muted small">{t('Choose {option}', { option: tr(product.optionName) || t('an option') })}</span>
          </div>
          <button className="icon-btn icon-btn--sm" onClick={onClose} aria-label={t('Close')}><X size={16} /></button>
        </div>

        <ul className="variant-list">
          {product.variants.map((v) => {
            const qty = qtyInCart(id, v.id);
            const busy = busyId === lineKey(id, v.id);
            return (
              <li key={v.id} className={v.inStock ? '' : 'is-oos'}>
                <span className="variant-list__img"><ProductImage src={variantImage(product, v)} alt="" /></span>
                <div className="variant-list__info">
                  <strong>{tr(v.label)}</strong>
                  <span className="variant-list__price">
                    {money(v.price)}
                    {v.mrp > v.price && <s>{money(v.mrp)}</s>}
                    {v.discountPercent > 0 && <em>{t('{off}% off', { off: v.discountPercent })}</em>}
                  </span>
                </div>
                <div className="variant-list__action">
                  {!v.inStock ? (
                    <span className="pcard__oos">{t('Out of stock')}</span>
                  ) : qty > 0 ? (
                    <QtyStepper qty={qty} busy={busy} max={v.stock} onChange={(n) => setQty(id, n, v.id)} size="sm" />
                  ) : (
                    <button className="btn btn--add" disabled={busy} onClick={() => addToCart(id, 1, v.id)}>{t('Add')}</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button className="btn btn--primary btn--block" onClick={onClose}>{t('Done')}</button>
      </div>
    </div>,
    document.body
  );
}
