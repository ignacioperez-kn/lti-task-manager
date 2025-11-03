
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/hooks';
import { dbPromise } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import Link from 'next/link';

const questions = [
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

const negativeQuestionIndexes = [1, 5, 8];

interface Answers {
  [key: string]: number;
}

export default function PystyvyydenItsearviointiIlmarinen() {
  const taskId = 'Pystyvyyden-itsearviointi-ilmarinen';
  const { session, isLoading: isSessionLoading } = useSession();
  const [answers, setAnswers] = useState<Answers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const saveState = useCallback(async (currentAnswers: Answers) => {
    if (!session?.sub || !taskId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const db = await dbPromise;
      const docRef = doc(db, 'tasks', session.sub, 'tasks', taskId);
      await setDoc(docRef, {
        output: { answers: currentAnswers },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving task state:', error);
      setSaveError('Edistyksen automaattinen tallennus epäonnistui.');
    } finally {
      setIsSaving(false);
    }
  }, [session?.sub, taskId]);

  useEffect(() => {
    const loadState = async () => {
      if (!session?.sub || !taskId) return;
      setIsLoading(true);
      try {
        const db = await dbPromise;
        const docRef = doc(db, 'tasks', session.sub, 'tasks', taskId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const savedData = docSnap.data().output;
          if (savedData.answers) {
            setAnswers(savedData.answers);
          }
          if (docSnap.data().completed) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        console.error('Error loading task state:', error);
        setSaveError('Aiemman edistyksen lataaminen epäonnistui.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSessionLoading && session?.sub && taskId) {
      loadState();
    }
  }, [isSessionLoading, session?.sub, taskId]);

  const handleAnswerChange = (questionIndex: number, answer: number) => {
    const newAnswers = { ...answers, [`q-${questionIndex}`]: answer };
    setAnswers(newAnswers);
    saveState(newAnswers);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const unansweredQuestions = questions.filter((_, index) => answers[`q-${index}`] === undefined);

    if (unansweredQuestions.length > 0) {
      alert('Vastaathan kaikkiin kysymyksiin.');
      return;
    }

    let correctedTotalScore = 0;
    questions.forEach((_, index) => {
      let score = answers[`q-${index}`];
      if (negativeQuestionIndexes.includes(index)) {
        score = 6 - score;
      }
      correctedTotalScore += score;
    });

    const averageScore = correctedTotalScore / questions.length;

    try {
        const db = await dbPromise;
        const docRef = doc(db, 'tasks', session.sub, 'tasks', taskId);
        await setDoc(docRef, {
            output: {
                answers,
                averageScore: averageScore.toFixed(2),
            },
            completed: true,
            updatedAt: serverTimestamp(),
        });
        setIsCompleted(true);
    } catch (error) {
        console.error('Error submitting task:', error);
        alert('Tehtävän palautus epäonnistui.');
    }
  };

  if (isSessionLoading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-xl">Ladataan tehtävää...</div>;
  }

  if (!session?.sub) {
    return <div className="flex min-h-screen items-center justify-center text-xl text-red-600">Ei tunnistautunut. Ole hyvä ja käynnistä LTI-työkalun kautta.</div>;
  }

  if (isCompleted) {
    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-800">Kiitos vastauksistasi!</h2>
                <p className="mt-2 text-lg text-gray-600">Vastauksesi on tallennettu onnistuneesti ja suoritus on merkitty valmiiksi.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
      <header className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Työnpaluun pysyvyydentunteen arviointi</h1>
          {session?.isInstructor && (
            <Link href={`/dashboard/${taskId}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Näytä Palaukset
            </Link>
          )}
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-gray-700">Vastaa seuraaviin väittämiin asteikolla 0–6. Vastauksesi auttavat sinua pohtimaan omia voimavarojasi ja haasteitasi työhönpaluuseen liittyen.</p>
          <p className="text-sm text-gray-600 mt-2">Voit halutessasi jättää kesken ja jatkaa myöhemmin, sillä vastauksesi tallentuvat automaattisesti.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Vastausasteikko</h2>
          <p className="text-gray-600"><span className="font-semibold text-gray-900">0</span> = täysin eri mieltä</p>
          <p className="text-gray-600"><span className="font-semibold text-gray-900">6</span> = täysin samaa mieltä</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
          {questions.map((q, index) => {
            const questionId = `q-${index}`;
            return (
              <div key={questionId} className="question-container border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
                <p className="text-md text-gray-800 mb-3 font-medium">{index + 1}. {q}</p>
                <fieldset className="flex flex-wrap gap-x-2 gap-y-2 justify-center sm:justify-start">
                  <legend className="sr-only">Arvio asteikolla 0-6</legend>
                  {[0, 1, 2, 3, 4, 5, 6].map(val => {
                    const isSelected = answers[questionId] === val;
                    return (
                      <label key={val} htmlFor={`${questionId}-${val}`} className={`flex items-center justify-center w-10 h-10 cursor-pointer p-2 rounded-md hover:bg-gray-100 border-2 ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}>
                        <input
                          type="radio"
                          id={`${questionId}-${val}`}
                          name={questionId}
                          value={val}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(index, val)}
                          className="sr-only"
                        />
                        <span className="text-lg">{val}</span>
                      </label>
                    );
                  })}
                </fieldset>
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-8">
          <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-md hover:shadow-lg text-lg">
            Tallenna vastaukset
          </button>
        </div>
      </form>
    </div>
  );
}
