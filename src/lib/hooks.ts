'use client';

import { useState, useEffect } from 'react';

export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          setError('Failed to fetch session');
        }
      } catch (err) {
        setError('An error occurred while fetching the session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { session, isLoading, error };
}