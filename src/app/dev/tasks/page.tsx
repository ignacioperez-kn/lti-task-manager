
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

// Mock task data. In a real app, this might come from a database.
const MOCK_TASKS = [
  { id: 'kuvaa-itsesi', title: 'Kuvaa Itsesi (Skills Wizard)' },
];

function TaskSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'learner' | 'instructor' | null;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    MOCK_TASKS[0]?.id || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    if (!role || !selectedTaskId) {
      setError('A role and a task must be selected.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const sub = localStorage.getItem('dev_user_id');
    const email = localStorage.getItem('dev_user_email');

    const payload: {
      role: 'learner' | 'instructor';
      taskId: string;
      sub?: string | null;
      email?: string | null;
    } = { role, taskId: selectedTaskId, sub, email };

    try {
      const res = await fetch('/api/dev/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const errorText = await res.text();
        setError(`Failed to set mock session: ${errorText}`);
      }
    } catch (e: any) {
      setError(`An unexpected error occurred: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div style={{ color: 'red' }}>
        Error: Role not specified. Please{' '}
        <a href="/dev" style={{ textDecoration: 'underline' }}>
          go back and select a role
        </a>
        .
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Step 2: Select a Task</h1>
      <p>
        You are launching as a{' '}
        <strong style={{ textTransform: 'capitalize' }}>{role}</strong>.
      </p>
      <div style={{ margin: '1.5rem 0' }}>
        <label htmlFor="task-select" style={{ marginRight: '1rem' }}>
          Choose a task:
        </label>
        <select
          id="task-select"
          value={selectedTaskId || ''}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        >
          {MOCK_TASKS.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title} (ID: {task.id})
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleLaunch}
        disabled={isLoading || !selectedTaskId}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: isLoading ? 'wait' : 'pointer',
        }}
      >
        {isLoading ? 'Launching...' : 'Launch Tool'}
      </button>
      {error && (
        <div style={{ marginTop: '1rem', color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

// Use Suspense to handle client-side rendering of search params
export default function DevTasksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskSelector />
    </Suspense>
  );
}
