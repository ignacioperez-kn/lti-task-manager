
'use client';

import { useEffect, useState } from 'react';

export default function DeepLinkPage() {
  const [deepLink, setDeepLink] = useState<any>(null);
  const [idToken, setIdToken] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deepLinkParam = params.get('deepLink');
    const idTokenParam = params.get('idToken');

    if (deepLinkParam) {
      setDeepLink(JSON.parse(decodeURIComponent(deepLinkParam)));
    }
    if (idTokenParam) {
      setIdToken(JSON.parse(decodeURIComponent(idTokenParam)));
    }
  }, []);

  if (!deepLink || !idToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading deep linking information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Select a Task</h1>
      <form action="/api/deep-link" method="POST">
        <input type="hidden" name="deepLink" value={JSON.stringify(deepLink)} />
        <input type="hidden" name="idToken" value={JSON.stringify(idToken)} />
        <input type="hidden" name="taskId" value="kuvaa-itsesi" />
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
        >
          Select Kuvaa-Itsesi Task
        </button>
      </form>
    </div>
  );
}
