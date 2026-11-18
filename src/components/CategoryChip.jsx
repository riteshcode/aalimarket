import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getId, imageUrl } from '../lib/format';

export default function CategoryChip({ category, large }) {
  const { tr } = useLang();
  const name = tr(category.name);
  const img = imageUrl(category.image || category.icon);

  return (
    <Link to={`/products?category=${getId(category)}`} className={`cat ${large ? 'cat--large' : ''}`}>
      <span className="cat__img">
        {img ? <img src={img} alt="" loading="lazy" /> : <span className="cat__initial">{name.charAt(0)}</span>}
      </span>
      <span className="cat__name">{name}</span>
    </Link>
  );
}
