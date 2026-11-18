// Online payment after POST /orders returns data.payment = { provider, keyId, providerOrderId, amount, currency }.
// Resolves with the fields POST /payments/verify needs, or throws if the shopper cancels.

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function collectPayment(payment, user) {
  // PAYMENT_PROVIDER=mock (backend default): no real gateway, so confirm a test payment
  if (payment.provider === 'mock') {
    const ok = window.confirm('Test mode: no real payment is taken. Mark this order as paid?');
    if (!ok) throw new Error('Payment cancelled');
    return {
      razorpay_payment_id: 'pay_mock_' + Date.now(),
      razorpay_signature: 'mock_signature',
      razorpay_order_id: payment.providerOrderId,
    };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Couldn’t load the payment page. Check your internet connection.');

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.providerOrderId,
      amount: payment.amount,
      currency: payment.currency,
      name: 'Aali Market',
      prefill: { name: user?.name || '', contact: user?.mobile || '' },
      theme: { color: '#1E2A78' },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    checkout.on('payment.failed', (res) => reject(new Error(res.error?.description || 'Payment failed')));
    checkout.open();
  });
}
