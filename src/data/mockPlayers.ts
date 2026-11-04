export interface TestResults {
  speed10m?: number; // sekundy
  speed30m?: number; // sekundy
  bevelTest?: number; // sekundy
  jumpCMJ?: number; // cm
  beepTestLevel?: string; // np. "8.5"
  date?: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  category: string; // np. Trampkarz, Młodzik, Orlik
  position: 'Bramkarz' | 'Obrońca' | 'Pomocnik' | 'Napastnik';
  leg: 'Prawa' | 'Lewa' | 'Obunożny';
  status: 'Aktywny' | 'Kontuzjowany' | 'Nieobecny';
  tests?: TestResults;
}

const FIRST_NAMES = [
  'Jan', 'Kacper', 'Filip', 'Jakub', 'Szymon', 'Michał', 'Antoni', 'Wojciech', 'Mateusz', 'Mikołaj',
  'Adam', 'Piotr', 'Oskar', 'Igor', 'Marcel', 'Nikodem', 'Tymon', 'Dawid', 'Wiktor', 'Maksymilian'
];

const LAST_NAMES = [
  'Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak',
  'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Wojciechowski', 'Kwiatkowski', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Nowakowski'
];

const POSITIONS: ('Bramkarz' | 'Obrońca' | 'Pomocnik' | 'Napastnik')[] = ['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik'];
const LEGS: ('Prawa' | 'Lewa' | 'Obunożny')[] = ['Prawa', 'Lewa', 'Obunożny'];

export const generateMockPlayers = (): Player[] => {
  const players: Player[] = [];
  let idCounter = 1;

  // Roczniki od 2010 do 2018 (po ok. 11-12 zawodników na rocznik = 100 zawodników)
  const years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018];

  years.forEach((year) => {
    let category = 'Żak';
    if (year <= 2011) category = 'Trampkarz (C1/C2)';
    else if (year <= 2013) category = 'Młodzik (D1/D2)';
    else if (year <= 2015) category = 'Orlik (E1/E2)';

    const countForYear = year === 2018 ? 12 : 11;

    for (let i = 0; i < countForYear; i++) {
      const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
      const leg = LEGS[Math.floor(Math.random() * LEGS.length)];

      players.push({
        id: `p-${idCounter++}`,
        firstName: fn,
        lastName: `${ln} (${year})`,
        birthYear: year,
        category: category,
        position: pos,
        leg: leg,
        status: Math.random() > 0.9 ? 'Kontuzjowany' : 'Aktywny',
        tests: {
          speed10m: parseFloat((1.7 + Math.random() * 0.5).toFixed(2)),
          speed30m: parseFloat((4.2 + Math.random() * 0.8).toFixed(2)),
          jumpCMJ: Math.floor(25 + Math.random() * 20),
          beepTestLevel: `${Math.floor(6 + Math.random() * 5)}.${Math.floor(1 + Math.random() * 8)}`,
          date: '2026-10-15',
        },
      });
    }
  });

  return players;
};

export const MOCK_100_PLAYERS = generateMockPlayers();