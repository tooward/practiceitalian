#!/usr/bin/env node
// practice.ts – The “sprint” logic used by the main program.
import fs from 'fs';
import { PersonIndex, Progress, Verb } from './types';
import { col } from './util';

const PROGRESS_PATH = './progress.json';
const MASTER_MIN_ATTEMPTS = 3;
const MASTER_ACCURACY = 0.9; // 90% accuracy required
const BATCH_SIZE = 10;

// ---------- Utilities -------------------------------------------------------

const clearScreen = () => console.clear();

const shuffle = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const showConjTable = (verb: Verb, mode: 'present' | 'past' | 'future') => {
  const title = mode === 'present' ? 'Present' : (mode === 'past' ? 'Past' : 'Future');
  const conj = (verb as any)[mode] as string[] | undefined;
  console.log(
    col(`\n=== ${title} Tense: ${verb.infinitive} ===`, 'magenta'),
    col(`  io      : ${conj?.[0] ?? '(n/a)'}`, 'cyan'),
    col(`  tu      : ${conj?.[1] ?? '(n/a)'}`, 'cyan'),
    col(`  lui/lei : ${conj?.[2] ?? '(n/a)'}`, 'cyan'),
    col(`  noi     : ${conj?.[3] ?? '(n/a)'}`, 'cyan'),
    col(`  voi     : ${conj?.[4] ?? '(n/a)'}`, 'cyan'),
    col(`  loro   : ${conj?.[5] ?? '(n/a)'}\n`, 'cyan')
  );
};

// ---------- Progress persistence helpers ---------------------------------

const loadProgress = (): Progress => {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      const text = fs.readFileSync(PROGRESS_PATH, 'utf8');
      return JSON.parse(text || '{}') as Progress;
    }
  } catch (err) {
    console.warn('Warning: could not read progress file, starting fresh.');
  }
  return {} as Progress;
};

const saveProgress = (progress: Progress): void => {
  try {
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing progress file:', (err as any)?.message || err);
  }
};

const ensureProgressEntry = (progress: Progress, infinitive: string): void => {
  if (!progress[infinitive]) progress[infinitive] = {};
};

const ensureTenseArray = (progress: Progress, infinitive: string, tense: 'present' | 'past' | 'future'): void => {
  ensureProgressEntry(progress, infinitive);
  const arr = (progress[infinitive] as any)[tense] as any[] | undefined;
  if (!Array.isArray(arr)) {
    (progress[infinitive] as any)[tense] = Array.from({ length: 6 }, () => ({ correct: 0, attempts: 0 }));
  }
};

const updateProgress = (progress: Progress, infinitive: string, tense: 'present' | 'past' | 'future', idx: PersonIndex, correct: boolean): void => {
  ensureTenseArray(progress, infinitive, tense);
  const cell = (progress[infinitive] as any)[tense][idx] as { correct: number; attempts: number };
  cell.attempts = (cell.attempts || 0) + 1;
  if (correct) cell.correct = (cell.correct || 0) + 1;
  saveProgress(progress);
};

const isPersonMastered = (progress: Progress, infinitive: string, tense: 'present' | 'past' | 'future', idx: PersonIndex): boolean => {
  const arr = (progress[infinitive] as any)?.[tense] as Array<{ correct: number; attempts: number }> | undefined;
  if (!Array.isArray(arr)) return false;
  const cell = arr[idx] || { correct: 0, attempts: 0 };
  if ((cell.attempts || 0) < MASTER_MIN_ATTEMPTS) return false;
  const acc = (cell.correct || 0) / (cell.attempts || 1);
  return acc >= MASTER_ACCURACY;
};

const isVerbMastered = (progress: Progress, infinitive: string, tense: 'present' | 'past' | 'future'): boolean => {
  const arr = (progress[infinitive] as any)?.[tense] as Array<{ correct: number; attempts: number }> | undefined;
  if (!Array.isArray(arr)) return false;
  return arr.every((_, idx) => isPersonMastered(progress, infinitive, tense, idx as PersonIndex));
};

const masteryPercent = (progress: Progress, infinitive: string, tense: 'present' | 'past' | 'future'): number => {
  const arr = (progress[infinitive] as any)?.[tense] as Array<{ correct: number; attempts: number }> | undefined;
  if (!Array.isArray(arr)) return 0;
  let totalCorrect = 0, totalAttempts = 0;
  arr.forEach(c => { totalCorrect += (c.correct || 0); totalAttempts += (c.attempts || 0); });
  if (totalAttempts === 0) return 0;
  return totalCorrect / totalAttempts;
};

// ---------- Core Practice Logic --------------------------------------------

export async function practiceMode(mode: 'present' | 'past' | 'future', rl: import('readline').Interface, verbs: Verb[]): Promise<void> {
  console.clear();

  const tense = mode;
  const title = mode === 'present' ? 'Present' : (mode === 'past' ? 'Past' : 'Future');

  console.log(
    col(`\n${title} Tense – choose verb set:`, 'cyan'),
    '\n1️⃣ Regular verbs',
    '\n2️⃣ Irregular verbs',
    '\n3️⃣ Mixed (all verbs)',
    '\n4️⃣ Show all tables',
    '\n5️⃣ Back to main menu'
  );
  const choice = await new Promise<string>(r => rl.question('Select an option (1–5): ', r));
  const n = parseInt(choice.trim(), 10);

  if (n === 5) return; // back to main menu

  let list: Verb[] | undefined;
  if (n === 1) list = verbs.filter(v => !v.irregular);
  if (n === 2) list = verbs.filter(v =>  v.irregular);
  if (n === 3) list = verbs;

  const progress = loadProgress();
  list = (list || []).filter(v => Array.isArray((v as any)[tense]) && (v as any)[tense].length >= 6);

  const nonMastered = list.filter(v => !isVerbMastered(progress, v.infinitive, tense));
  const mastered = list.filter(v => isVerbMastered(progress, v.infinitive, tense));
  void mastered; // not used directly yet

  let candidates = nonMastered.slice();
  if (candidates.length < BATCH_SIZE) {
    const partially = list
      .filter(v => !nonMastered.includes(v))
      .sort((a, b) => masteryPercent(progress, a.infinitive, tense) - masteryPercent(progress, b.infinitive, tense));
    candidates = candidates.concat(partially);
  }

  if (candidates.length === 0) candidates = list.slice();
  if (n === 4) {
    verbs.forEach(v => showConjTable(v, mode));
    await new Promise<void>(r => rl.question('\nPress any key to continue…', () => r()));
    return practiceMode(mode, rl, verbs);
  }

  const batch = shuffle([...candidates]).slice(0, BATCH_SIZE);

  clearScreen();
  console.log(col(`\n=== 10-word Sprint (${list.length} verbs total) ===`, 'magenta'));
  batch.forEach((v, i) => {
    const trans = v.translation || '(no definition)';
    console.log(`  ${i + 1}. ${col(v.infinitive, 'yellow')} – ${trans}`);
  });
  console.log(col('\nPress any key to start typing exercise…', 'cyan'));
  await new Promise<void>(r => rl.question('', () => r()));

  for (const verb of batch) {
    clearScreen();
    console.log(col(`\nWord ${batch.indexOf(verb) + 1} of ${batch.length}`, 'magenta'));
    console.log(col(`Italian: ${verb.infinitive}`, 'yellow'));
    console.log(`Translation: ${verb.translation || '(no translation)'}`);
    const ans = await new Promise<string>(r => rl.question('\nType the Italian infinitive: ', r));
    if (ans.trim().toLowerCase() === (verb.infinitive || '').toLowerCase()) {
      console.log(col('✔ Correct!', 'green'));
    } else {
      console.log(col(`✘ Wrong – "${verb.infinitive}"`, 'red'));
    }
    await new Promise<void>(r => rl.question('\nPress any key for next word…', () => r()));
  }

  const persons: Array<{ en: string; it: string; idx: PersonIndex }> = [
    { en: 'I',          it: 'io',           idx: 0 },
    { en: 'you (sg)',   it: 'tu',           idx: 1 },
    { en: 'he/she/it',  it: 'lui/lei/esso', idx: 2 },
    { en: 'we',         it: 'noi',          idx: 3 },
    { en: 'you (pl)',   it: 'voi',          idx: 4 },
    { en: 'they',       it: 'loro',         idx: 5 }
  ];

  for (const verb of batch) {
    clearScreen();
    console.log(col(`\nWord ${batch.indexOf(verb) + 1} of ${batch.length}`, 'magenta'));

    const dir = Math.random() < 0.5; // true → Italian → English
    const person = persons[Math.floor(Math.random() * persons.length)];

    if (dir) {
      console.log(col(`Italian word: ${verb.infinitive}`, 'yellow'));
      const ans = await new Promise<string>(r => rl.question('Translate to English: ', r));
      if (ans.trim().toLowerCase() === (verb.translation || '').toLowerCase()) {
        console.log(col('✔ Correct!', 'green'));
      } else {
        console.log(col(`✘ Wrong – "${verb.translation}"`, 'red'));
      }
    } else {
      if (Math.random() < 0.5) {
        console.log(col(`English word: ${verb.translation || '(no translation)'}`, 'cyan'));
        const ans = await new Promise<string>(r => rl.question('Write the Italian infinitive: ', r));
        if (ans.trim().toLowerCase() === verb.infinitive.toLowerCase()) {
          console.log(col('✔ Correct!', 'green'));
        } else {
          console.log(col(`✘ Wrong – "${verb.infinitive}"`, 'red'));
        }
      } else {
        const personIdx = person.idx;
        const personIt = person.it;
        const prompt = `${personIt} (${person.en}) form of ${verb.infinitive} in ${title}: `;
        const forms = (verb as any)[tense] as string[] | undefined;
        const correctForm = forms?.[personIdx] || '';
        const ans = await new Promise<string>(r => rl.question(prompt, r));
        const ok = ans.trim().toLowerCase() === (correctForm || '').toLowerCase();
        if (ok) {
          console.log(col('✔ Correct!', 'green'));
        } else {
          console.log(col(`✘ Wrong – "${correctForm || '(n/a)'}"`, 'red'));
        }
        try {
          updateProgress(progress, verb.infinitive, tense, personIdx, ok);
        } catch (err) {
          console.warn('Could not update progress:', (err as any)?.message ?? err);
        }
      }
    }

    await new Promise<void>(r => rl.question('\nPress any key for next word…', () => r()));
  }

  clearScreen();
  console.log(col('\n✅ Sprint finished!', 'green'));
  const back = await new Promise<string>(r => rl.question('Return to main menu? (y/N): ', r));
  if (back.trim().toLowerCase() === 'y' || back.trim() === '') return;
}

export default { practiceMode };
