import { useSyncExternalStore } from 'react';
import { getPendingCount, subscribePending } from '../api/client';

// Thin striped bar across the top of the viewport while any API request is in flight
export default function NetworkProgress() {
  const pending = useSyncExternalStore(subscribePending, getPendingCount);
  if (pending === 0) return null;
  return <div className="net-progress" role="progressbar" aria-label="Memuat data dari server" />;
}
