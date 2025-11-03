
import React from 'react';

const KuvaaItsesiRenderer: React.FC<{ output: any }> = ({ output }) => {
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

export default KuvaaItsesiRenderer;
