import { Minus, Plus, Loader2 } from 'lucide-react';

export default function QtyStepper({ qty, onChange, busy, max, size = 'md' }) {
  return (
    <div className={`stepper stepper--${size}`} aria-busy={busy}>
      <button onClick={() => onChange(qty - 1)} disabled={busy} aria-label="Decrease quantity">
        <Minus size={16} />
      </button>
      <span className="stepper__qty">{busy ? <Loader2 size={16} className="spin" /> : qty}</span>
      <button onClick={() => onChange(qty + 1)} disabled={busy || (max && qty >= max)} aria-label="Increase quantity">
        <Plus size={16} />
      </button>
    </div>
  );
}
