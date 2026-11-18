import { catalogApi } from '../api/endpoints';
import { useFetch } from '../lib/useFetch';
import { asList, getId } from '../lib/format';
import CategoryChip from '../components/CategoryChip';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import { LayoutGrid } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function Categories() {
  const { t } = useLang();
  const { data, loading, error, reload } = useFetch(() => catalogApi.categories(), []);
  const list = asList(data);

  return (
    <div className="page container">
      <h1 className="page-title">{t('Categories')}</h1>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && list.length === 0 && (
        <EmptyState icon={LayoutGrid} title={t('No categories yet')} text={t('New categories will show up here soon.')} />
      )}
      <div className="cat-grid">
        {list.map((c) => <CategoryChip key={getId(c)} category={c} large />)}
      </div>
    </div>
  );
}
