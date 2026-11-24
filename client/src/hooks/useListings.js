import { useEffect, useState } from 'react';
import { endpoints, http } from '../lib/http.js';

// Loads ads for the given filters. An old request is cancelled when the filters change.
export function useListings({ category, q, sort }) {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const filters = {};
    if (category) filters.category = category;
    if (q) filters.q = q;
    if (sort) filters.sort = sort;

    setStatus('loading');
    http
      .get(endpoints.listings(filters), controller.signal)
      .then((data) => {
        setListings(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setStatus('error');
      });

    return () => controller.abort();
  }, [category, q, sort]);

  return { listings, setListings, status, error };
}
