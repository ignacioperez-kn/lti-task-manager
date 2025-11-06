
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

  const { answers, averageScore, totalScore } = output;

  const getInterpretation = (score: number) => {
    if (score > 4.6) {
      return {
        level: 'Korkea',
        text: 'Korkeat pisteet (yli 4,6) voivat viitata siihen, että kuntoutujalla on vahva usko omiin kykyihinsä palata työhön ja näin suurempi todennäköisyys onnistua työhönpaluussa.',
        className: 'bg-green-100 border-green-200 text-green-800'
      };
    }
    if (score >= 3.7 && score <= 4.6) {
      return {
        level: 'Keskitaso',
        text: 'Keskitason pisteet (3,7-4,6) voivat viitata vaihtelevaan uskoon omiin kykyihin ja mahdollisesti johtavat vaihtelevaan tarpeeseen lisätuelle.',
        className: 'bg-yellow-100 border-yellow-200 text-yellow-800'
      };
    }
    return {
      level: 'Matala',
      text: 'Matalat pisteet (alle 3,7) voivat viitata siihen, että kuntoutujalla on heikompi usko omiin kykyihinsä palata työhönsä ja hän saattaa tarvita enemmän tukea työhönpaluun onnistumiseksi.',
      className: 'bg-red-100 border-red-200 text-red-800'
    };
  };

  const interpretation = getInterpretation(parseFloat(averageScore));

  return (
    <div className="space-y-6 text-gray-800 text-left">
      
      {/* Yhteenveto */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-bold text-2xl mb-4 text-gray-900">Yhteenveto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg text-gray-700">Kokonaispistemäärä</h4>
            <p className="text-2xl font-bold text-blue-600">{totalScore ?? 'N/A'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg text-gray-700">Keskipistemäärä</h4>
            <p className="text-2xl font-bold text-blue-600">{averageScore ?? 'N/A'}</p>
          </div>
        </div>
        {averageScore && (
          <div className={`mt-6 p-4 border-l-4 rounded-r-lg ${interpretation.className}`}>
            <h4 className="font-bold text-lg">{`Taso: ${interpretation.level}`}</h4>
            <p className="mt-1">{interpretation.text}</p>
          </div>
        )}
      </div>

      {/* Vastaukset */}
      <div>
        <h3 className="font-bold text-2xl mb-4 text-gray-900">Vastaukset</h3>
        <ul className="space-y-3">
          {pystyvyysQuestions.map((question, index) => (
            <li key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <span className="font-medium text-gray-900">{index + 1}. {question}</span>
              <p className="text-md text-blue-700 font-semibold mt-2 ml-4 p-2 bg-blue-50 rounded-md inline-block">
                Vastaus: {answers?.[`q-${index}`] ?? 'N/A'} / 6
              </p>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default PystyvyydenItsearviointiIlmarinenRenderer;
