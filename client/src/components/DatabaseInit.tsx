import { useEffect } from 'react';
import { useInitDatabase } from '@/hooks/use-api';

export function DatabaseInit({ children }: { children: React.ReactNode }) {
  const initDb = useInitDatabase();

  useEffect(() => {
    // Initialize database on app load
    initDb.mutate();
  }, []);

  return <>{children}</>;
}
