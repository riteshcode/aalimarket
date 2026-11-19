# Aali Market — PWA Frontend

React + Vite PWA for the Aali Market Node.js API (customer store + admin panel).

## Run locally

```bash
# 1. Backend pehle chalao (port 4000)
cd your-backend && npm run seed && npm run dev

# 2. Frontend
cd aali-market-pwa
cp .env.example .env        # backend port alag ho to VITE_BACKEND_URL badlo
npm install
npm run dev
```

- Store: http://localhost:5173
- Admin: http://localhost:5173/admin  (username + password: backend `.env` me `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`)
- OTP backend ke console me print hota hai (SMS_PROVIDER=console).
- Same WiFi par mobile se kholne ke liye terminal me dikhne wala `Network:` URL use karo.

Vite dev server `/api` aur `/health` ko backend par proxy karta hai, isliye CORS setup ki zarurat nahi.

Image upload ke liye backend `.env` me S3 credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`) chahiye — uploads S3 par jaate hain, backend khud files serve nahi karta.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # ESLint (hooks ki galtiyan pakadta hai)
npm run format   # Prettier se code format
npm test         # Vitest — format helpers + Hindi translation coverage
```

## Hindi UI

Saare shopper-facing texts `t('English text')` se likhe hain, Hindi `src/lib/hi.js` me hai. Naya text add karo to `hi.js` me uska Hindi bhi daalo — `npm test` bata dega agar koi chhoot gaya. Admin panel English me hi rehta hai.

## PWA install test

Service worker dev mode me bhi on hai. Proper test ke liye:

```bash
npm run build && npm run preview   # http://localhost:4173
```

Chrome me address bar ke install icon se app install karo. Note: phone par "Install" sirf HTTPS ya localhost par aata hai — LAN IP (http://192.168.x.x) par install prompt nahi aayega.

## Folder structure

```
src/
  api/client.js       fetch wrapper: tokens, auto refresh on 401, error messages
  api/endpoints.js    saare API calls (Postman collection ke folders ke hisaab se)
  lib/format.js       money (paise → ₹), {en,hi} picker, response normalizers
  context/            Auth (customer + admin sessions), Shop (cart + wishlist), Lang, Toast
  components/         Header, BottomNav, ProductCard, Price, QtyStepper, OtpLogin...
  pages/              customer screens
  admin/              admin screens
  styles/             global.css (design tokens) + admin.css
```

## Backend setup tips

1. Backend `.env` me `RATE_LIMIT_MAX=5000` rakho local par — 300 wala default dev frontend jaldi khatam kar deta hai aur 429 aane lagta hai.
2. Image upload ke liye S3 credentials chahiye. Tab tak `public/banners/` jaisi local images ka full URL (`http://localhost:5173/...`) use kar sakte ho.
3. Online payment: `PAYMENT_PROVIDER=mock` (default) par checkout ek test-payment confirm dikhata hai. Real Razorpay ke liye backend me `PAYMENT_PROVIDER=razorpay` aur `RAZORPAY_KEY_ID/SECRET` set karo — frontend khud Razorpay checkout khol lega.
4. Delivery areas: jab tak ek bhi pincode add nahi hota, har pincode se order aata hai. Pehla area add karte hi sirf listed pincodes serve honge.

## Rider app

Delivery partners open `/rider` on their phone and log in with the username + password the store sets in Admin → Riders (customers still use OTP).
They see their assigned orders, call the customer, open Google Maps (exact pin if the customer shared location),
tap **Start delivery**, and finish with the customer's 4-digit OTP + cash collected (COD). 5 wrong OTPs lock the
order — admin can then mark it delivered from the Orders page.

## Push notifications

1. Backend: `npm run vapid:generate`, keys `.env` me daalo, server restart.
2. Customer Account → "Order notifications" on karta hai (ya order place hone ke baad prompt aata hai).
3. Push sirf `localhost` ya HTTPS par chalta hai. iPhone par app pehle Home Screen par add karna padta hai (iOS 16.4+).
4. Notification handler `public/push-sw.js` me hai (service worker me import hota hai).

## Notes

- Product ka `slug` aur coupon ka `code` create ke baad edit nahi hota (backend update schema accept nahi karta), isliye edit form me locked hain.
- Banner `link` me `/category/<slug>` ya `/products/<slug>` daalo — frontend inhe sahi page par map karta hai.
- Role/user management backend me nahi hai — naye admin `npm run seed` ya DB se banenge.
