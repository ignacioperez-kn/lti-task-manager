
'use client';

import { useState, useEffect } from 'react';

// Define keys for localStorage
const USER_ID_KEY = 'dev_user_id';
const USER_EMAIL_KEY = 'dev_user_email';

export function DevNavbar() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  // On component mount, load saved values from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem(USER_ID_KEY);
    const savedEmail = localStorage.getItem(USER_EMAIL_KEY);
    if (savedUserId) setUserId(savedUserId);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserId(value);
    localStorage.setItem(USER_ID_KEY, value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    localStorage.setItem(USER_EMAIL_KEY, value);
  };

  return (
    <nav style={{
      background: '#222',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
        Dev Session Overrides
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="dev-user-id">User ID:</label>
        <input
          id="dev-user-id"
          type="text"
          value={userId}
          onChange={handleUserIdChange}
          placeholder="Default: dev-role-timestamp"
          style={{ padding: '0.3rem', minWidth: '200px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="dev-user-email">Email:</label>
        <input
          id="dev-user-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Default: role@example.com"
          style={{ padding: '0.3rem', minWidth: '200px' }}
        />
      </div>
      <div style={{ fontStyle: 'italic', color: '#aaa', fontSize: '0.9rem' }}>
        (Values are saved as you type)
      </div>
    </nav>
  );
}
