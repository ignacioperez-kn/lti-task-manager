
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function TaskPage() {
  const { taskId } = useParams();
  const [output, setOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, output }),
      });

      if (res.ok) {
        alert('Task saved!');
      } else {
        alert('Error saving task.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1>Task {taskId}</h1>
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        rows={10}
        cols={50}
      />
      <br />
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
