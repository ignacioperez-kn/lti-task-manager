'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          console.log('SESSION DATA RECEIVED BY FRONTEND:', data);
          setSession(data);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    if (!isLoading && session) {
      const { taskId } = session;

      if (!taskId) {
        setRedirectError('Error: Task ID is missing from the LTI session.');
        return;
      }

      // Redirect all users to the task page
      router.push(`/task/${taskId}`);
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (redirectError) {
    return <div style={{ color: 'red' }}>{redirectError}</div>;
  }

  if (!session) {
    return <div>Not in an LTI session.</div>;
  }

  return <div>Redirecting...</div>;
}