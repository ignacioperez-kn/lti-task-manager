
import React from 'react';

const pystyvyysQuestions = [
  'Selviydyn vastoinkäymisistä',
  'En suoriudu tehtävistäni tunteitteni ja/tai mielialahaasteiden vuoksi',
  'Pystyn asettamaan omat rajat työssä',
  'Pystyn suoriutumaan tehtävistäni',
  'Selviydyn tunteiden kannalta vaativista tilanteista',
  'Minulla ei jää voimavaroja mihinkään muuhun kuin työpäivästä selviämiseen',
  'Pystyn keskittymään riittävästi työhöni',
  'Tulen kestämään työpaineita',
  'En pysty ratkaisemaan mahdollisia ongelmia työssäni',
  'Saan motivoitua itseäni riittävästi tehdakseni työni',
  'Selviydyn työn fyysisistä vaatimuksista'
];

const PystyvyydenItsearviointiIlmarinenRenderer: React.FC<{ output: any }> = ({ output }) => {
  if (!output) return <p>Ei tuloksia saatavilla.</p>;

  const { answers, averageScore } = output;

  return (
    <div className="space-y-4 text-gray-700 text-left">
      <div>
        <h3 className="font-semibold text-xl mb-2">Vastaukset</h3>
        <ul className="list-decimal list-inside ml-4 space-y-2">
          {pystyvyysQuestions.map((question, index) => (
            <li key={index}>
              <span className="font-medium">{question}</span>
              <p className="text-sm text-gray-600 mt-1 ml-4 p-2 bg-gray-50 rounded-md">
                Vastaus: {answers?.[`q-${index}`] ?? 'N/A'}/6
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-xl mb-2 mt-4">Keskipistemäärä</h3>
        <p>{averageScore}</p>
      </div>
    </div>
  );
};

export default PystyvyydenItsearviointiIlmarinenRenderer;
