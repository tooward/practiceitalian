#!/usr/bin/env node
// ---------------------------------------------------------------
// practice.js –  The “sprint” logic used by the main program.
// ---------------------------------------------------------------

const COLORS = {
  reset:   '\x1b[0m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
};

const col = (txt, color) => `${COLORS[color] || COLORS.reset}${txt}${COLORS.reset}`;
const fs = require('fs');
const PROGRESS_PATH = './progress.json';
const MASTER_MIN_ATTEMPTS = 3;
const MASTER_ACCURACY = 0.9; // 90% accuracy required
const BATCH_SIZE = 10;

// ---------- Utilities -------------------------------------------------------

/** Clear the terminal (works on most consoles). */
const clearScreen = () => console.clear();

/** Fisher‑Yates shuffle – returns a new shuffled array. */
const shuffle = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Display a verb’s full conjugation table for the given tense. */
const showConjTable = (verb, mode) => {
  const tense = mode === 'present' ? 'present' : (mode === 'past' ? 'past' : 'future');
  const title = mode === 'present' ? 'Present' : (mode === 'past' ? 'Past' : 'Future');
  const conj = verb[tense] || [];
  console.log(
    col(`\n=== ${title} Tense: ${verb.infinitive} ===`, 'magenta'),
    col(`  io      : ${conj[0] || '(n/a)'}`, 'cyan'),
    col(`  tu      : ${conj[1] || '(n/a)'}`, 'cyan'),
    col(`  lui/lei : ${conj[2] || '(n/a)'}`, 'cyan'),
    col(`  noi     : ${conj[3] || '(n/a)'}`, 'cyan'),
    col(`  voi     : ${conj[4] || '(n/a)'}`, 'cyan'),
    col(`  loro   : ${conj[5] || '(n/a)'}\n`, 'cyan')
  );
};

// ---------- Progress persistence helpers ---------------------------------

const loadProgress = () => {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      const text = fs.readFileSync(PROGRESS_PATH, 'utf8');
      return JSON.parse(text || '{}');
    }
  } catch (err) {
    console.warn('Warning: could not read progress file, starting fresh.');
  }
  return {};
};

const saveProgress = (progress) => {
  try {
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing progress file:', err.message || err);
  }
};

const ensureProgressEntry = (progress, infinitive) => {
  if (!progress[infinitive]) progress[infinitive] = {};
};

const ensureTenseArray = (progress, infinitive, tense) => {
  ensureProgressEntry(progress, infinitive);
  if (!Array.isArray(progress[infinitive][tense])) {
    progress[infinitive][tense] = Array.from({ length: 6 }, () => ({ correct: 0, attempts: 0 }));
  }
};

const updateProgress = (progress, infinitive, tense, idx, correct) => {
  ensureTenseArray(progress, infinitive, tense);
  const cell = progress[infinitive][tense][idx];
  cell.attempts = (cell.attempts || 0) + 1;
  if (correct) cell.correct = (cell.correct || 0) + 1;
  saveProgress(progress);
};

const isPersonMastered = (progress, infinitive, tense, idx) => {
  if (!progress[infinitive] || !Array.isArray(progress[infinitive][tense])) return false;
  const cell = progress[infinitive][tense][idx] || { correct: 0, attempts: 0 };
  if ((cell.attempts || 0) < MASTER_MIN_ATTEMPTS) return false;
  const acc = (cell.correct || 0) / (cell.attempts || 1);
  return acc >= MASTER_ACCURACY;
};

const isVerbMastered = (progress, infinitive, tense) => {
  if (!progress[infinitive] || !Array.isArray(progress[infinitive][tense])) return false;
  return progress[infinitive][tense].every((cell, idx) => isPersonMastered(progress, infinitive, tense, idx));
};

const masteryPercent = (progress, infinitive, tense) => {
  if (!progress[infinitive] || !Array.isArray(progress[infinitive][tense])) return 0;
  const arr = progress[infinitive][tense];
  let totalCorrect = 0, totalAttempts = 0;
  arr.forEach(c => { totalCorrect += (c.correct || 0); totalAttempts += (c.attempts || 0); });
  if (totalAttempts === 0) return 0;
  return totalCorrect / totalAttempts;
};

// ---------- Core Practice Logic --------------------------------------------

/**
 * Run a sprint of 10 verbs.
 *
 * @param {string} mode    Either 'present' or 'past'.
 * @param {readline.Interface} rl  Readline interface created in the main file.
 * @param {Array<Object>} verbs  List of all verbs (from index.json).
 */
async function practiceMode(mode, rl, verbs) {
  console.clear()

  const tense = mode === 'present' ? 'present' : (mode === 'past' ? 'past' : 'future');
  const title = mode === 'present' ? 'Present' : (mode === 'past' ? 'Past' : 'Future');

  /* -------------------------------------------------------------
     1️⃣  Choose a verb set (regular / irregular / mixed)
  ------------------------------------------------------------- */
  console.log(
    col(`\n${title} Tense – choose verb set:`, 'cyan'),
    '\n1️⃣ Regular verbs',
    '\n2️⃣ Irregular verbs',
    '\n3️⃣ Mixed (all verbs)',
    '\n4️⃣ Show all tables',
    '\n5️⃣ Back to main menu'
  );
  const choice = await new Promise(r => rl.question('Select an option (1‑5): ', r));
  const n = parseInt(choice.trim(), 10);

  if (n === 5) return; // back to main menu

  let list;
  if (n === 1) list = verbs.filter(v => !v.irregular);
  if (n === 2) list = verbs.filter(v =>  v.irregular);
  if (n === 3) list = verbs;

  // load progress and exclude verbs that are fully mastered for this tense
  const progress = loadProgress();
  // start with verbs that have the tense available
  list = list.filter(v => Array.isArray(v[tense]) && v[tense].length >= 6);

  // partition into non-mastered and mastered
  const nonMastered = list.filter(v => !isVerbMastered(progress, v.infinitive, tense));
  const mastered = list.filter(v => isVerbMastered(progress, v.infinitive, tense));

  // If we have fewer than BATCH_SIZE non-mastered verbs, we'll include some
  // partially-mastered verbs ordered by least mastery to fill the batch.
  let candidates = nonMastered.slice();
  if (candidates.length < BATCH_SIZE) {
    const partially = list
      .filter(v => !nonMastered.includes(v))
      .sort((a, b) => masteryPercent(progress, a.infinitive, tense) - masteryPercent(progress, b.infinitive, tense));
    candidates = candidates.concat(partially);
  }

  // final guard: if still empty, fall back to original list
  if (candidates.length === 0) candidates = list.slice();
  if (n === 4) {                    // show every table and return
    verbs.forEach(v => showConjTable(v, mode));
    await new Promise(r => rl.question('\nPress any key to continue…', r));
    return practiceMode(mode, rl, verbs);
  }

  /* -------------------------------------------------------------
     2️⃣  Pick 10 verbs for the sprint
  ------------------------------------------------------------- */
  const batch = shuffle([...candidates]).slice(0, BATCH_SIZE);

  /* -------------------------------------------------------------
     3️⃣  Show the 10‑word table
  ------------------------------------------------------------- */
  clearScreen();
  console.log(col(`\n=== 10‑word Sprint (${list.length} verbs total) ===`, 'magenta'));
  batch.forEach((v, i) => {
    const trans = v.translation || '(no definition)';
    console.log(`  ${i + 1}. ${col(v.infinitive, 'yellow')} – ${trans}`);
  });
  console.log(col('\nPress any key to start typing exercise…', 'cyan'));
  await new Promise(r => rl.question('', r));

  /* -------------------------------------------------------------
     4️⃣  Typing exercise – show each word, ask user to type the English word
  ------------------------------------------------------------- */
  for (const verb of batch) {
    clearScreen();
    console.log(col(`\nWord ${batch.indexOf(verb) + 1} of ${batch.length}`, 'magenta'));
    console.log(col(`Italian: ${verb.infinitive}`, 'yellow'));
    console.log(`Translation: ${verb.translation || '(no translation)'}`);
    const ans = await new Promise(r => rl.question('\nType the Italian infinitive: ', r));
    if (ans.trim().toLowerCase() === (verb.infinitive || '').toLowerCase()) {
      console.log(col('✔ Correct!', 'green'));
    } else {
      console.log(col(`✘ Wrong – correct: "${verb.infinitive}"`, 'red'));
    }
    await new Promise(r => rl.question('\nPress any key for next word…', r));
  }

  /* -------------------------------------------------------------
     5️⃣  Mixed‑direction quiz (Italian ↔ English + conjugation)
  ------------------------------------------------------------- */
  const persons = [
    { en: 'I',          it: 'io',          idx: 0 },
    { en: 'you (sg)',   it: 'tu',          idx: 1 },
    { en: 'he/she/it',  it: 'lui/lei/esso',idx: 2 },
    { en: 'we',         it: 'noi',         idx: 3 },
    { en: 'you (pl)',   it: 'voi',         idx: 4 },
    { en: 'they',       it: 'loro',        idx: 5 }
  ];

  for (const verb of batch) {
    clearScreen();
    console.log(col(`\nWord ${batch.indexOf(verb) + 1} of ${batch.length}`, 'magenta'));

    /* Randomly decide which direction to quiz the user in */
    const dir = Math.random() < 0.5; // true → Italian → English, false → English → Italian
    const person = persons[Math.floor(Math.random() * persons.length)];

    // We'll use the mixed-direction to sometimes ask for a conjugation form
    if (dir) { // Italian → English
      console.log(col(`Italian word: ${verb.infinitive}`, 'yellow'));
      const ans = await new Promise(r => rl.question('Translate to English: ', r));
      if (ans.trim().toLowerCase() === (verb.translation || '').toLowerCase()) {
        console.log(col('✔ Correct!', 'green'));
      } else {
        console.log(col(`✘ Wrong – "${verb.translation}"`, 'red'));
      }
    } else {
      // English → Italian or conjugation prompt
      // 50% chance to ask infinitive, 50% to ask for a conjugated person in the selected tense
      if (Math.random() < 0.5) {
        console.log(col(`English word: ${verb.translation || '(no translation)'}`, 'cyan'));
        const ans = await new Promise(r => rl.question('Write the Italian infinitive: ', r));
        if (ans.trim().toLowerCase() === verb.infinitive.toLowerCase()) {
          console.log(col('✔ Correct!', 'green'));
        } else {
          console.log(col(`✘ Wrong – "${verb.infinitive}"`, 'red'));
        }
      } else {
        // Ask for a conjugation in the chosen tense and person
        const personIdx = person.idx;
        const personIt = person.it;
        const prompt = `${personIt} (${person.en}) form of ${verb.infinitive} in ${title}: `;
        const correctForm = (verb[tense] && verb[tense][personIdx]) || '';
        const ans = await new Promise(r => rl.question(prompt, r));
        const ok = ans.trim().toLowerCase() === (correctForm || '').toLowerCase();
        if (ok) {
          console.log(col('✔ Correct!', 'green'));
        } else {
          console.log(col(`✘ Wrong – "${correctForm || '(n/a)'}"`, 'red'));
        }
        // update progress for this conjugation
        try {
          updateProgress(progress, verb.infinitive, tense, personIdx, ok);
        } catch (err) {
          console.warn('Could not update progress:', err && err.message ? err.message : err);
        }
      }
    }

    await new Promise(r => rl.question('\nPress any key for next word…', r));
  }

  /* -------------------------------------------------------------
     6️⃣  Sprint finished – ask to return to main menu
  ------------------------------------------------------------- */
  clearScreen();
  console.log(col('\n✅ Sprint finished!', 'green'));
  const back = await new Promise(r => rl.question('Return to main menu? (y/N): ', r));
  if (back.trim().toLowerCase() === 'y' || back.trim() === '') return;
  // If the user typed anything else we simply stay in practiceMode,
  // but according to the spec we’ll just return here.
}

module.exports = { practiceMode };