
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/lib/hooks'; // We will create this hook
import { dbPromise } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- Custom Colors ---
const PRIMARY_COLOR = '#1f2b42';

// --- Data (from original HTML) ---

const vahvuudet = [
  "Ahkera", "Aloitekykyinen", "Analyyttinen", "Antelias", "Avoin",
  "Avulias", "Diplomaattinen", "Eloisa", "Energinen", "Epäitsekäs",
  "Eteenpäin pyrkivä", "Empaattinen", "Harkitseva", "Herkkä",
  "Hienotunteinen", "Hillitty", "Huolellinen", "Huomaavainen",
  "Huumorintajuinen", "Hyväntahtoinen",
  "Iloinen", "Innokas", "Itseensä luottava", "Itsenäinen",
  "Järjestelmällinen", "Johdonmukainen", "Kekseliäs", "Kohtelias",
  "Kypsä", "Kärsivällinen",
  "Käytännöllinen", "Kyky oppia uutta", "Luova", "Luotettava",
  "Mahdollisuuksiin tarttuva", "Maltillinen", "Mielikuvituksellinen",
  "Miellyttävä", "Määrätietoinen", "Neuvokas",
  "Nopea", "Nöyrä", "Oikeudenmukainen", "Oma-aloitteinen",
  "Oppimishaluinen", "Optimistinen", "Organisointikykyinen",
  "Paineensietokykyinen", "Perusteellinen", "Pitkäjänteinen",
  "Pohdiskeleva", "Päättäväinen", "Rauhallinen", "Realistinen",
  "Rehellinen", "Riskinottokykyinen", "Sinnikäs", "Sopeutuva",
  "Sosiaalinen", "Suunnitelmallinen",
  "Tasapainoinen", "Tehokas", "Tiedonhaluinen", "Tunnollinen",
  "Täsmällinen", "Uskalias", "Uskollinen", "Vastuunottokykyinen",
  "Vahva", "Vilpitön",
  "Ystävällinen", "Yritteliäs", "Ratkaisukeskeinen"
];

const kovat = [
  "Asiakashankinta ja asiakassuhteiden ylläpito",
  "Avaruudellinen hahmotuskyky", "Budjetointi", "Brändiosaaminen",
  "Digitaalinen lukutaito",
  "Hakukoneiden käyttö", "Lainsäädännön tuntemus", "Kirjanpito",
  "Kielitaito", "Kokeilun halu", "Laatuosaaminen", "Laskutaidot",
  "Logistinen osaaminen",
  "Matemaattinen hahmotuskyky", "Markkinaosaaminen",
  "Markkinointiosaaminen", "Myyntitaidot",
  "Myyntiprosessien hallinta", "Office-työkalut", "Ohjelmointitaidot",
  "Opettaminen", "Osakekauppa", "Palveluosaaminen",
  "Päässälaskutaito", "Projektien johtaminen", "Projektiosaaminen",
  "Prosessien johtaminen", "Rakentamistaidot",
  "Riskinhallinta", "Raportointi", "Strateginen ajattelu",
  "Some-osaaminen", "Taloushallinta/taloussuunnittelu",
  "Tuotekehitysosaaminen", "Tutkimusosaaminen",
  "Tiedon hallinta ja hyödyntäminen", "Tiedonhankintataidot",
  "Tietotekniset taidot", "Ulkomaankaupan osaaminen",
  "Useiden ohjelmistojen käyttötaito",
  "Vaikuttamistaito", "Verkostoitumistaidot", "Yrittäjyystaidot"
];

const pehmeat = [
  "Ajan hallinta", "Esiintymistaito", "Ennakointiosaaminen",
  "Ideoiden kehitys", "Ihmisten arviointitaito", "Improvisointi",
  "Joukkuehengen luominen",
  "Kirjallinen viestintätaito", "Kulttuurinen herkkyys",
  "Kyky hahmottaa ja hallita kokonaisuuksia",
  "Kyky johtaa omaa työtä", "Kokeilun halu",
  "Luottamuksen rakentaminen", "Looginen päättelykyky", "Motivointi",
  "Muutosvalmius", "Muutoksen johtaminen", "Neuvottelutaito",
  "Ongelmanratkaisutaito",
  "Osaamisen johtaminen", "Palautteen antaminen ja vastaanottaminen",
  "Päätöksentekotaito", "Priorisointi", "Resilienssi",
  "Riskienhallinta- ja turvallisuusosaaminen", "Sosiaalinen älykkyys",
  "Sovittelu", "Sopeutumiskyky", "Strateginen johtaminen", "Tunneäly",
  "Tehtävien loppuun saattaminen", "Tulevaisuuskatseisuus",
  "Vuorovaikutustaidot", "Yhteistyötaidot"
];

const detailsHelper = [
  "Missä tilanteissa tai ympäristöissä olet käyttänyt tätä taitoa?", "Missä olet oppinut tämän taidon?", "Miten tämä taito on auttanut sinua saavuttamaan tavoitteita tai ratkaisemaan ongelmia?", "Miten muut ovat arvioineet tai kommentoineet tätä taitoa sinussa?", "Miten reagoisit, jos tämä taito ei toimisi toivotulla tavalla?", "Miten haluaisit kehittää tätä taitoa tulevaisuudessa?", "Miten tämä taito liittyy muihin taitoihisi? Täydentävätkö ne toisiaan?", "Mikä tekee tästä taidosta erityisen sinulle?", "Miten tämä taito näkyy eri elämänalueilla?"
];

const openQs = [
  { k: "q1", t: "1. Onko jokin näistä taidoista sellainen, jonka hallitset hyvin, mutta et halua sitä jatkossa hyödyntää?" },
  { k: "q2", t: "2. Onko jokin näistä taidoista sellainen, jota haluat jatkossa käyttää ja edelleen kehittää sitä?" },
  { k: "q3", t: "3. Oletko tyytyväinen olemassa olevaan osaamiseesi? Miksi olet tai miksi et ole? Perustele!" },
  { k: "q4", t: "4. Koetko, että voit päästä eteenpäin olemassa olevalla osaamisellasi? Perustele miksi ja jos koet, että tarvitset jotain muuta osaamista, pohdi, mitä se voisi olla." }
];

interface TaskState {
  stage: number;
  substep: number;
  selected: {
    vahvuudet: string[];
    kovat: string[];
    pehmeat: string[];
  };
  ratings: { [key: string]: number };
  top5: string[];
  details: { [key: string]: string };
  openQs: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };
}

// Initial state structure
const INITIAL_STATE: TaskState = {
  stage: 1,
  substep: 1, // For stage 1, which has 3 substeps
  selected: {
    vahvuudet: [],
    kovat: [],
    pehmeat: []
  },
  ratings: {}, // { skill: number }
  top5: [],
  details: {}, // { skill: text }
  openQs: {
    q1: "",
    q2: "",
    q3: "",
    q4: ""
  }
};

const TOTAL_STAGES = 7;

// Debounce utility (to prevent excessive saves)
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export default function KuvaaItsesiTask() {
  const taskId = 'kuvaa-itsesi'; // This is a static page for a specific task
  const { session, isLoading: isSessionLoading } = useSession();

  const [state, setState] = useState<TaskState>(INITIAL_STATE);
  const [isStageValid, setIsStageValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- Auto-save logic ---
  const saveState = useCallback(async (currentState: TaskState) => {
    if (!session?.sub || !taskId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const db = await dbPromise;
      const docRef = doc(db, 'tasks', session.sub, 'tasks', taskId);
      await setDoc(docRef, {
        output: currentState, // Save the entire state object
        updatedAt: serverTimestamp(),
      });
      // console.log('State saved!');
    } catch (error) {
      console.error('Error saving task state:', error);
      setSaveError('Edistyksen automaattinen tallennus epäonnistui.');
    } finally {
      setIsSaving(false);
    }
  }, [session?.sub, taskId]);

  const debouncedSave = useCallback(debounce(saveState, 5000), [saveState]);

  // Effect to load state on mount
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
          setState(prev => ({ ...prev, ...savedData }));
          // console.log('State loaded!', savedData);
        } else {
          // console.log('No saved state found, using initial.');
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

  // Effect to trigger auto-save on state changes
  useEffect(() => {
    if (!isLoading && !isSessionLoading && !session?.isInstructor) {
      debouncedSave(state);
    }
  }, [state, isLoading, isSessionLoading, session?.isInstructor, debouncedSave]);

  useEffect(() => {
    // Reset validation when stage or substep changes
    if (state.stage === 1 || state.stage === 2 || state.stage === 3) {
      setIsStageValid(false);
    } else {
      setIsStageValid(true);
    }
  }, [state.stage, state.substep]);

  // --- Handlers for navigation and state updates ---
  const goToNextStage = () => {
    setState(prev => {
      if (prev.stage === 1 && prev.substep < 3) {
        return { ...prev, substep: prev.substep + 1 };
      } else if (prev.stage < TOTAL_STAGES) {
        return { ...prev, stage: prev.stage + 1, substep: 1 }; // Reset substep for new stages
      }
      return prev;
    });
  };

  const goToPreviousStage = () => {
    setState(prev => {
      if (prev.stage === 1 && prev.substep > 1) {
        return { ...prev, substep: prev.substep - 1 };
      } else if (prev.stage > 1) {
        return { ...prev, stage: prev.stage - 1, substep: 3 }; // Go to last substep of previous stage if applicable
      }
      return prev;
    });
  };

  const resetCurrentStage = () => {
    setState(prev => {
      const newState = { ...prev };
      switch (prev.stage) {
        case 1:
          const key = ["vahvuudet", "kovat", "pehmeat"][prev.substep - 1] as keyof TaskState['selected'];
          newState.selected = { ...prev.selected, [key]: [] };
          break;
        case 2:
          newState.ratings = {};
          break;
        case 3:
          newState.top5 = [];
          break;
        case 4:
          newState.details = {};
          break;
        case 5:
          newState.openQs = { q1: "", q2: "", q3: "", q4: "" };
          break;
        // Stage 6 has no reset
      }
      return newState;
    });
  };

  // --- UI Components (will be defined below) ---
  const renderStageContent = () => {
    // This will contain the JSX for each stage
    switch (state.stage) {
      case 1: return <Stage1 state={state} setState={setState} onValidationChange={setIsStageValid} />;
      case 2: return <Stage2 state={state} setState={setState} onValidationChange={setIsStageValid} />;
      case 3: return <Stage3 state={state} setState={setState} onValidationChange={setIsStageValid} />;
      case 4: return <Stage4 state={state} setState={setState} />;
      case 5: return <Stage5 state={state} setState={setState} />;
      case 6: return <Stage6 state={state} setState={setState} />;
      case 7: return <Stage7 state={state} setState={setState} />;
      default: return <Stage1 state={state} setState={setState} onValidationChange={setIsStageValid} />;
    }
  };

  if (isSessionLoading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-xl">Ladataan tehtävää...</div>;
  }

  if (!session?.sub) {
    return <div className="flex min-h-screen items-center justify-center text-xl text-red-600">Ei tunnistautunut. Ole hyvä ja käynnistä LTI-työkalun kautta.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 font-sans text-gray-900">
      {/* Header / Progress */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight m-0">Taitojen tunnistaminen</h1>
        <div className="flex items-center gap-4">
          {session?.isInstructor && (
            <Link href={`/dashboard/${taskId}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Näytä Palaukset
            </Link>
          )}
          <div className="font-semibold text-gray-600">Vaihe {state.stage} / {TOTAL_STAGES}</div>
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-5" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-250 ease-in-out"
          style={{ width: `${(state.stage / TOTAL_STAGES) * 100}%`, backgroundColor: PRIMARY_COLOR }}
        ></div>
      </div>

      {/* Save Status */}
      <div className="text-right text-sm mb-4">
        {isSaving && <span className="text-[${PRIMARY_COLOR}]">Tallennetaan...</span>}
        {!isSaving && saveError && <span className="text-red-600">{saveError}</span>}
        {!isSaving && !saveError && <span className="text-gray-500">Tallennettu</span>}
      </div>

      {/* Dynamic content */}
      <div id="stage-container">
        {renderStageContent()}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2 justify-between items-center mt-5">
        <div>
          {state.stage < 6 && (
            <button
              onClick={resetCurrentStage}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
              type="button"
            >
              Nollaa tämä vaihe
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(state.stage > 1 || (state.stage === 1 && state.substep > 1)) && state.stage < 7 && (
            <button
              onClick={goToPreviousStage}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
              type="button"
            >
              Takaisin
            </button>
          )}
          {state.stage < 6 && (
            <button
              onClick={goToNextStage}
              disabled={!isStageValid}
              className="px-4 py-2 border-none bg-[#1f2b42] text-white rounded-lg font-bold cursor-pointer opacity-100 hover:bg-[#1f2b42]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Seuraava
            </button>
          )}
          {state.stage === 6 && (
            <button
              onClick={goToNextStage}
              className="px-4 py-2 border-none bg-green-600 text-white rounded-lg font-bold cursor-pointer opacity-100 hover:bg-green-700 transition-colors"
              type="button"
            >
              Viimeistele tehtävä
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Stage 1 Component ---
interface Stage1Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
  onValidationChange: (isValid: boolean) => void;
}

const Stage1: React.FC<Stage1Props> = ({ state, setState, onValidationChange }) => {
  const subTitles = [
    ["Henkilökohtaiset vahvuudet",
      "Henkilökohtaiset vahvuudet ovat yksilön ominaisuuksia, kykyjä ja taitoja, jotka auttavat menestymään sekä työssä että henkilökohtaisessa elämässä. Nämä vahvuudet voivat liittyä persoonallisuuteen, käyttäytymiseen, vuorovaikutustaitoihin ja ongelmanratkaisutaitoihin. Ne ovat usein luonnollisia taipumuksia tai kehitettyjä kykyjä, jotka tukevat yksilön tavoitteiden saavuttamista ja hyvinvointia."
    ],
    ["Kovat taidot",
      "Kovat taidot (engl. hard skills) ovat konkreettisia, teknisiä ja mitattavia taitoja, joita tarvitaan tietyssä työtehtävässä tai ammatissa. Ne ovat usein spesifisiä osaamisalueita, jotka voidaan oppia koulutuksen, kurssien tai käytännön kokemuksen kautta. Kovat taidot ovat selkeästi mitattavissa ja arvioitavissa, esimerkiksi testeillä, sertifikaateilla tai työnäytteillä."
    ],
    ["Pehmeät taidot",
      "Pehmeät taidot (engl. “soft skills”) ovat henkilökohtaisia, vuorovaikutus- ja sosiaalisia taitoja, jotka vaikuttavat siihen, miten ihmiset ovat vuorovaikutuksessa toistensa kanssa, toimivat työpaikalla tai muissa sosiaalisissa ympäristöissä. Nämä taidot eivät yleensä liity suoraan teknisiin tai ammatillisiin tietotaitoihin, vaan ne keskittyvät enemmän ihmisten välisiin suhteisiin ja käyttäytymiseen."
    ]
  ];
  const lists = [vahvuudet, kovat, pehmeat];
  const keys: (keyof TaskState['selected'])[] = ["vahvuudet", "kovat", "pehmeat"];

  const [title, subtitle] = subTitles[state.substep - 1];
  const selectedList = state.selected[keys[state.substep - 1]];
  const remain = 5 - selectedList.length;

  const handleChipClick = (item: string) => {
    setState(prev => {
      const currentKey = keys[prev.substep - 1];
      const currentSelections = prev.selected[currentKey];
      const newSelections = [...currentSelections];
      const index = newSelections.indexOf(item);

      if (index >= 0) {
        newSelections.splice(index, 1);
      } else {
        if (newSelections.length < 5) {
          newSelections.push(item);
        }
      }
      return {
        ...prev,
        selected: {
          ...prev.selected,
          [currentKey]: newSelections,
        },
      };
    });
  };

  const isNextEnabled = selectedList.length === 5;

  useEffect(() => {
    onValidationChange(isNextEnabled);
  }, [isNextEnabled, onValidationChange]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{state.substep}/3 — {title}</h2>
      {subtitle && <p className="text-gray-600 mb-4">{subtitle}</p>}

      <div className="my-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm font-semibold">
        Valitse 5 tästä osiosta. Valittuna: {selectedList.length} / 5
      </div>

      <div className="flex flex-wrap gap-2 mt-3 items-start">
        {lists[state.substep - 1].map(item => {
          const isSelected = selectedList.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleChipClick(item)}
              className={`inline-flex items-center justify-center px-3 py-2 rounded-full border transition-transform duration-75 ease-out select-none
                ${isSelected
                  ? 'border-green-300 bg-green-200 text-gray-900 shadow-sm transform -translate-y-px'
                  : 'border-gray-300 bg-[#1f2b42] text-white hover:bg-[#1f2b42]/90'
                }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-gray-600 text-sm">
        Valitse vielä {remain}
      </div>
      {!isNextEnabled && (
        <div className="mt-2 text-red-500 font-semibold" id="error-note">
          Valitse tasan 5 ennen siirtymistä.
        </div>
      )}
    </div>
  );
};

// --- Stage 2 Component ---
interface Stage2Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
  onValidationChange: (isValid: boolean) => void;
}

const Stage2: React.FC<Stage2Props> = ({ state, setState, onValidationChange }) => {
  const allSkills = [
    { label: "Henkilökohtaiset vahvuudet", items: state.selected.vahvuudet },
    { label: "Kovat taidot", items: state.selected.kovat },
    { label: "Pehmeät taidot", items: state.selected.pehmeat }
  ].flatMap(group => group.items);

  const handleRatingChange = (skill: string, value: number) => {
    setState(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [skill]: value,
      },
    }));
  };

  const ratedCount = Object.keys(state.ratings).filter(skill =>
    allSkills.includes(skill) && typeof state.ratings[skill] === 'number'
  ).length;
  const totalToRate = allSkills.length;
  const isNextEnabled = ratedCount === totalToRate && totalToRate > 0;

  useEffect(() => {
    onValidationChange(isNextEnabled);
  }, [isNextEnabled, onValidationChange]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Taitojen arviointi (1–5)</h2>
      <p className="text-gray-600 mb-4">
        Arvioi taitosi 1–5 välillä osaamisen mukaan. Klikkaa ympyröitä – mitä
        korkeampi luku, sitä useampi ympyrä täyttyy.
      </p>

      {[
        { label: "Henkilökohtaiset vahvuudet", items: state.selected.vahvuudet },
        { label: "Kovat taidot", items: state.selected.kovat },
        { label: "Pehmeät taidot", items: state.selected.pehmeat }
      ].map(group => {
        if (!group.items.length) return null;
        return (
          <div key={group.label} className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-3">{group.label}</h3>
            {group.items.map(skill => (
              <div key={skill} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center py-2 border-b border-gray-200 last:border-b-0">
                <div className="min-w-0 text-gray-800">{skill}</div>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(value => {
                    const currentRating = state.ratings[skill] || 0;
                    const filled = value <= currentRating;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value}/5`}
                        onClick={() => handleRatingChange(skill, value)}
                        className={`w-7 h-7 rounded-full mx-0.5 border-2 transition-all duration-150 ease-in-out
                          ${filled
                            ? 'border-green-400 bg-green-300'
                            : 'border-gray-300 bg-white hover:bg-gray-100'
                          }`}
                      />
                    );
                  })}
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-200 rounded-full text-gray-900 font-bold">
                    {state.ratings[skill] || "–"}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="mt-4 text-gray-600 text-sm">
        Arvioimatta: {Math.max(0, totalToRate - ratedCount)} / {totalToRate}
      </div>
      {!isNextEnabled && totalToRate > 0 && (
        <div className="mt-2 text-red-500 font-semibold">
          Arvioi kaikki taidot ennen siirtymistä.
        </div>
      )}
    </div>
  );
};

// --- Stage 3 Component ---
interface Stage3Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
  onValidationChange: (isValid: boolean) => void;
}

const Stage3: React.FC<Stage3Props> = ({ state, setState, onValidationChange }) => {
  const allSkills = [
    ...state.selected.vahvuudet,
    ...state.selected.kovat,
    ...state.selected.pehmeat,
  ].sort((a, b) => {
    const ra = state.ratings[a] ?? 0;
    const rb = state.ratings[b] ?? 0;
    if (rb !== ra) return rb - ra; // Sort by rating descending
    return a.localeCompare(b); // Then alphabetically
  });

  const handleChipClick = (skill: string) => {
    setState(prev => {
      const newTop5 = [...prev.top5];
      const index = newTop5.indexOf(skill);

      if (index >= 0) {
        newTop5.splice(index, 1);
      } else {
        if (newTop5.length < 5) {
          newTop5.push(skill);
        }
      }
      return { ...prev, top5: newTop5 };
    });
  };

  const isNextEnabled = state.top5.length === 5;

  useEffect(() => {
    onValidationChange(isNextEnabled);
  }, [isNextEnabled, onValidationChange]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Valitse 5 tärkeintä taitoa</h2>
      <p className="text-gray-600 mb-4">
        Alla ovat aiemmin valitsemasi taidot sekä niille antamasi arviot (1–5).
        Valitse 5 tärkeintä.
      </p>

      <div className="flex flex-wrap gap-2 mt-3 items-start">
        {allSkills.map(skill => {
          const isSelected = state.top5.includes(skill);
          const rating = state.ratings[skill] ?? 0;
          return (
            <button
              key={skill}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleChipClick(skill)}
              className={`inline-flex items-center justify-center px-3 py-2 rounded-full border transition-transform duration-75 ease-out select-none
                ${isSelected
                  ? 'border-green-300 bg-green-200 text-gray-900 shadow-sm transform -translate-y-px'
                  : 'border-gray-300 bg-[#1f2b42] text-white hover:bg-[#1f2b42]/90'
                }`}
            >
              {skill}
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-200 rounded-full text-gray-900 font-bold">
                {rating}/5
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-gray-600 text-sm">
        Valitse vielä {Math.max(0, 5 - state.top5.length)}
      </div>
      {!isNextEnabled && (
        <div className="mt-2 text-red-500 font-semibold">
          Valitse tasan 5 taitoa ennen siirtymistä.
        </div>
      )}
    </div>
  );
};

// --- Stage 4 Component ---
interface Stage4Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
}

const Stage4: React.FC<Stage4Props> = ({ state, setState }) => {
  const handleDetailChange = (skill: string, value: string) => {
    setState(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [skill]: value,
      },
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Lisätietoja taidoista</h2>
      <p className="text-gray-600 mb-4">
        Kirjoita jokaisesta valitsemastasi taidosta tarkennuksia. Voit käyttää
        apunasi alla olevia kysymyksiä. (Ei minimipituutta.)
      </p>

      <details className="my-2">
        <summary className="cursor-pointer font-bold text-primary">Apu-kysymykset (avaa/sulje)</summary>
        <ol className="mt-2 list-decimal list-inside pl-4 text-gray-700">
          {detailsHelper.map((q, i) => (
            <li key={i} className="my-1">
              {q}
            </li>
          ))}
        </ol>
      </details>

      {state.top5.map(skill => (
        <div key={skill} className="border border-gray-200 rounded-lg p-3 my-3 bg-white shadow-sm">
          <div className="font-bold mb-2 text-primary">{skill}</div>
          <textarea
            rows={5}
            placeholder="Kirjoita tähän tarkennuksia..."
            className="w-full p-2 border border-gray-300 rounded-lg resize-y focus:ring-primary focus:border-primary outline-none"
            value={state.details[skill] || ''}
            onChange={(e) => handleDetailChange(skill, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};

// --- Stage 5 Component ---
interface Stage5Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
}

const Stage5: React.FC<Stage5Props> = ({ state, setState }) => {
  const handleOpenQChange = (key: string, value: string) => {
    setState(prev => ({
      ...prev,
      openQs: {
        ...prev.openQs,
        [key]: value,
      },
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Avoimet kysymykset</h2>
      <p className="text-gray-600 mb-4">
        Vastaathan vielä alla oleviin kysymyksiin. (Ei minimipituutta.)
      </p>

      <details className="my-2">
        <summary className="cursor-pointer font-bold text-primary">Apu-kysymykset (avaa/sulje)</summary>
        <ol className="mt-2 list-decimal list-inside pl-4 text-gray-700">
          {detailsHelper.map((q, i) => (
            <li key={i} className="my-1">
              {q}
            </li>
          ))}
        </ol>
      </details>

      {openQs.map(({ k, t }) => (
        <div key={k} className="border border-gray-200 rounded-lg p-3 my-3 bg-white shadow-sm">
          <div className="font-bold mb-2 text-primary">{t}</div>
          <textarea
            rows={5}
            placeholder="Kirjoita vastauksesi tähän..."
            className="w-full p-2 border border-gray-300 rounded-lg resize-y focus:ring-primary focus:border-primary outline-none"
            value={state.openQs[k as keyof typeof state.openQs] || ''}
            onChange={(e) => handleOpenQChange(k, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};

// --- Stage 6 Component (Summary) ---
interface Stage6Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
}

const Stage6: React.FC<Stage6Props> = ({ state, setState }) => {
  // Generate summary text
  let summaryText = "Tärkeimmät 5 taitoa\n";
  (state.top5 || []).forEach(s => { summaryText += `- ${s} · ${state.ratings[s] || "-"} / 5\n  ${(state.details[s] || "—").trim()}\n`; });
  summaryText += "\nKaikki valitut taidot ja arvosanat\n";
  [{ label: "Henkilökohtaiset vahvuudet", items: state.selected.vahvuudet || [] }, { label: "Kovat taidot", items: state.selected.kovat || [] }, { label: "Pehmeät taidot", items: state.selected.pehmeat || [] }].forEach(g => { summaryText += `${g.label}\n`; g.items.forEach(s => summaryText += `- ${s} · ${state.ratings[s] || "-"} / 5\n`); });
  summaryText += "\nAvoimet vastaukset\n";
  summaryText += `1) ${state.openQs?.q1 || "—"}\n2) ${state.openQs?.q2 || "—"}\n3) ${state.openQs?.q3 || "—"}\n4) ${state.openQs?.q4 || "—"}\n`;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Melkein valmis! Ohjeet palautukseen</h2>
      <p className="text-gray-600 mb-4">
        Tämä työkalu on nyt suoritettu. Viimeistele tehtävä seuraamalla alla olevia ohjeita.
      </p>

      <ol className="list-decimal list-inside pl-4 my-5 border border-gray-300 rounded-lg bg-gray-50 p-4">
        <li className="my-3 p-2 rounded-md bg-white shadow-sm">
          <strong className="text-primary">Tarkista yhteenvetosi. </strong>
          Alla on kooste vastauksistasi. Voit tarkistaa sen ennen tehtävän viimeistelyä.
        </li>
        <li className="my-3 p-2 rounded-md bg-white shadow-sm">
          <strong className="text-primary">Viimeistele tehtävä. </strong>
          Kun olet tarkistanut yhteenvedon, paina vihreää 'Viimeistele tehtävä' -nappia.
          Tämä tallentaa vastauksesi lopullisesti.
        </li>
      </ol>

      <div className="mt-4 p-4 border border-blue-300 bg-blue-50 rounded-lg whitespace-pre-wrap font-mono text-sm text-gray-800">
        {summaryText}
      </div>

      <p className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg text-center font-semibold text-gray-700">
        Kun olet tarkistanut yhteenvedon, paina 'Viimeistele tehtävä' -nappia.
      </p>
    </div>
  );
};

// --- Stage 7 Component (Completion) ---
interface Stage7Props {
  state: TaskState;
  setState: React.Dispatch<React.SetStateAction<TaskState>>;
}

const Stage7: React.FC<Stage7Props> = ({ state, setState }) => {
  // Generate summary text
  let summaryText = "Tärkeimmät 5 taitoa\n";
  (state.top5 || []).forEach(s => { summaryText += `- ${s} · ${state.ratings[s] || "-"} / 5\n  ${(state.details[s] || "—").trim()}\n`; });
  summaryText += "\nKaikki valitut taidot ja arvosanat\n";
  [{ label: "Henkilökohtaiset vahvuudet", items: state.selected.vahvuudet || [] }, { label: "Kovat taidot", items: state.selected.kovat || [] }, { label: "Pehmeät taidot", items: state.selected.pehmeat || [] }].forEach(g => { summaryText += `${g.label}\n`; g.items.forEach(s => summaryText += `- ${s} · ${state.ratings[s] || "-"} / 5\n`); });
  summaryText += "\nAvoimet vastaukset\n";
  summaryText += `1) ${state.openQs?.q1 || "—"}\n2) ${state.openQs?.q2 || "—"}\n3) ${state.openQs?.q3 || "—"}\n4) ${state.openQs?.q4 || "—"}\n`;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Tehtävä suoritettu!</h2>
      <p className="text-gray-600 mb-4">
        Hienoa työtä! Olet suorittanut tehtävän onnistuneesti. Alla on yhteenveto vastauksistasi.
      </p>

      <div className="mt-4 p-4 border border-green-300 bg-green-50 rounded-lg whitespace-pre-wrap font-mono text-sm text-gray-800">
        {summaryText}
      </div>

      <div className="mt-4">
        <button
          onClick={() => setState(prev => ({ ...prev, stage: 6 }))}
          className="px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
          type="button"
        >
          Muokkaa tehtävää
        </button>
      </div>
    </div>
  );
};
