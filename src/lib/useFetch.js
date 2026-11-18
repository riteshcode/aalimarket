import { useCallback, useEffect, useState } from 'react';

// Simple data-loading hook: const { data, loading, error, reload } = useFetch(() => api.call(), [deps])
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fn();
      setState({ data: res?.data ?? null, meta: res?.meta ?? null, loading: false, error: null });
    } catch (err) {
      setState({ data: null, meta: null, loading: false, error: err });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
