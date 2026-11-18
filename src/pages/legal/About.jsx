import LegalPage from './LegalPage';
import { useStoreInfo } from './useStoreInfo';

export default function About() {
  const store = useStoreInfo();
  return (
    <LegalPage title={`About ${store.name}`}>
      <p>
        {store.name} is a local store in {store.city} delivering groceries and daily needs to your door. Every price
        shows the MRP and how much you save, so you always know you’re getting a fair deal.
      </p>
      <h2>Business details</h2>
      <p>
        {store.name}<br />
        {store.address}<br />
        FSSAI Lic. No.: {store.fssai}
        {store.gstin && <><br />GSTIN: {store.gstin}</>}
      </p>
    </LegalPage>
  );
}
