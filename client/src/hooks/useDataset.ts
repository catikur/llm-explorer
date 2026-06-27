import { useEffect, useState } from "react";
import { Dataset, loadDataset, computeBounds, MetricBounds } from "@/lib/models";

let _cache: Dataset | null = null;

export function useDataset() {
  const [data, setData] = useState<Dataset | null>(_cache);
  const [bounds, setBounds] = useState<MetricBounds | null>(
    _cache ? computeBounds(_cache.models) : null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache) return;
    let alive = true;
    loadDataset()
      .then((d) => {
        if (!alive) return;
        _cache = d;
        setData(d);
        setBounds(computeBounds(d.models));
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  return { data, bounds, error, loading: !data && !error };
}
