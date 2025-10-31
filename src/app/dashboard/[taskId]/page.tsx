
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// --- Helper component to display task output ---
const TaskOutputDisplay: React.FC<{ output: any }> = ({ output }) => {
  if (!output) return <p>Ei tuloksia saatavilla.</p>;

  const { selected, top5, details, openQs, ratings } = output;

  return (
    <div className="space-y-4 text-gray-700 text-left">
      {top5?.length > 0 && (
        <div>
          <h3 className="font-semibold text-xl mb-2">Top 5 Osaamista</h3>
          <ul className="list-disc list-inside ml-4 space-y-2">
            {top5.map((skill: string) => (
              <li key={skill}>
                <span className="font-medium">{skill}</span> (Arvio: {ratings?.[skill] || 'N/A'}/5)
                {details?.[skill] && (
                  <p className="text-sm text-gray-600 mt-1 ml-4 p-2 bg-gray-50 rounded-md italic">"{details[skill]}"</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {openQs && Object.values(openQs).some(v => v) && (
        <div>
          <h3 className="font-semibold text-xl mb-2 mt-4">Avoimet kysymykset</h3>
          <div className="space-y-2">
            {openQs.q1 && <p><strong>1. Osaamiset, joita et käytä:</strong> {openQs.q1}</p>}
            {openQs.q2 && <p><strong>2. Kehitettävät osaamiset:</strong> {openQs.q2}</p>}
            {openQs.q3 && <p><strong>3. Tyytyväisyys osaamisiin:</strong> {openQs.q3}</p>}
            {openQs.q4 && <p><strong>4. Voitko edetä:</strong> {openQs.q4}</p>}
          </div>
        </div>
      )}

      {selected && (
        <details className="mt-4">
          <summary className="font-semibold text-lg cursor-pointer">Näytä kaikki valitut osaamiset</summary>
          <div className="space-y-2 mt-2 p-2 border-t">
            {selected.vahvuudet?.length > 0 && (
              <div>
                <p className="font-medium">Henkilökohtaiset vahvuudet:</p>
                <p className="text-sm text-gray-600">{selected.vahvuudet.join(', ')}</p>
              </div>
            )}
            {selected.kovat?.length > 0 && (
              <div>
                <p className="font-medium">Kovat taidot:</p>
                <p className="text-sm text-gray-600">{selected.kovat.join(', ')}</p>
              </div>
            )}
            {selected.pehmeat?.length > 0 && (
              <div>
                <p className="font-medium">Pehmeät taidot:</p>
                <p className="text-sm text-gray-600">{selected.pehmeat.join(', ')}</p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

// --- Modal Component ---
const TaskOutputModal: React.FC<{ response: any; onClose: () => void }> = ({ response, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold">Käyttäjän palautus: {response.userName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        <TaskOutputDisplay output={response.output} />
        <div className="text-right mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Sulje
          </button>
        </div>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const { taskId } = useParams();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await fetch(`/api/responses?taskId=${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setResponses(data);
        } else {
          alert('Virhe haettaessa vastauksia.');
        }
      } catch (error) {
        console.error('Virhe haettaessa vastauksia:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchResponses();
    }
  }, [taskId]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Ladataan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans text-gray-900">
      <div className="mb-4">
        <Link href={`/task/${taskId}`} className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
          &larr; Takaisin tehtävään
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Tehtävän "{taskId}" koontinäyttö</h1>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Käyttäjän nimi</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Viimeksi päivitetty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toiminnot</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {responses.map((response) => (
              <tr key={response.userId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{response.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.updatedAt?.seconds ? new Date(response.updatedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedResponse(response)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Näytä tehtävä
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedResponse && (
        <TaskOutputModal response={selectedResponse} onClose={() => setSelectedResponse(null)} />
      )}
    </div>
  );
}
