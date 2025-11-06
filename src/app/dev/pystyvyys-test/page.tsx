'use client';

import React from 'react';
import PystyvyydenItsearviointiIlmarinenRenderer from '@/app/dashboard/renderers/Pystyvyyden-itsearviointi-ilmarinen';

// This is the dummy data that simulates the output from the task
const dummyOutput = {
  answers: {
    'q-0': 5,
    'q-1': 2,
    'q-2': 6,
    'q-3': 5,
    'q-4': 4,
    'q-5': 1,
    'q-6': 5,
    'q-7': 6,
    'q-8': 2,
    'q-9': 5,
    'q-10': 4,
  },
  averageScore: '4.55', // Example average score
  totalScore: 50,      // Example total score
};

const TestPage = () => {
  return (
    <div className="container mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Renderer Test Page</h1>
        <p className="text-lg text-gray-600">
          This page displays a preview of the <code className="bg-gray-200 p-1 rounded">PystyvyydenItsearviointiIlmarinenRenderer</code> component using dummy data.
        </p>
      </header>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Component Preview</h2>
        <PystyvyydenItsearviointiIlmarinenRenderer output={dummyOutput} />
      </div>

      <div className="mt-8 bg-gray-50 p-4 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold mb-2">Dummy Data Used</h3>
        <pre className="bg-gray-900 text-white p-4 rounded-md overflow-x-auto">
          {JSON.stringify(dummyOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestPage;
