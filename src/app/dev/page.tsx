
'use client';

import { useRouter } from 'next/navigation';
import { logEnv } from './actions';

export default function DevPage() {
  const router = useRouter();

  const handleRoleSelect = (role: 'learner' | 'instructor') => {
    // Navigate to the new task selection page, passing the role
    router.push(`/dev/tasks?role=${role}`);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dev/Test Mode - Step 1: Select a Role</h1>
      <p>
        Click a button below to begin simulating an LTI launch with a specific
        role.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={() => handleRoleSelect('learner')}
          style={{
            marginRight: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Launch as Learner
        </button>
        <button
          onClick={() => handleRoleSelect('instructor')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Launch as Instructor
        </button>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <form action={logEnv}>
          <button 
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              cursor: 'pointer',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
            }}
          >
            Log Environment Variables
          </button>
        </form>
      </div>
      <div style={{ marginTop: '3rem', fontStyle: 'italic', color: '#666' }}>
        <p>
          <strong>Note:</strong> This page is only available for testing in the
          development environment.
        </p>
      </div>
    </div>
  );
}
