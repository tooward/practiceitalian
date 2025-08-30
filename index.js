#!/usr/bin/env node
// index.js – Offline Italian conjugation CLI

const { introPresent, introImperative } = require('./intro');
const { load, save } = require('./verbs');
const { present, imperative } = require('./conjugator');
const { ask, confirm, colors, col } = require('./util');

const PEOPLE = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];
const IMPERATIVES = ['tu', 'voi'];

// ---------- Main menu -----------------------------------

async function mainMenu(verbs) {
  console.log(col('\n=== Conjugator Offline ===', 'cyan'));
  console.log(col('1  Practice Present Tense (regular)', 'yellow'));
  console.log(col('2  Practice Present Tense (irregular)', 'yellow'));
  console.log(col('3  Imperative',   'yellow'));
  console.log(col('5  Show present standard conjugation table', 'yellow'));
  console.log(col('0️  Exit', 'yellow'));

  const choice = await ask('Scegli (1‑4): ');
  return parseInt(choice, 10);
}

// ---------- Present‑tense practice ---------------------

async function practicePresent(verbs) {

  let stats = { c: 0, w: 0 };

  console.log(col('\n🛠️  Practice Present Tense – type “quit” to exit\n', 'magenta'));

  while (true) {
    // Pick a random verb & person
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const person = Math.floor(Math.random() * 6);
    const correct = present(v, person);

    // Ask user
    const ans = await ask(`Coniuga <${v.infinitive}> per ${PEOPLE[person]}: `);

    // User wants to quit
    if (ans.toLowerCase() === 'quit') {
      console.log(col(`\nStatistiche – corrette: ${stats.c}, sbagliate: ${stats.w}\n`, 'magenta'));
      break;
    }

    // Compare
    if (ans.trim().toLowerCase() === correct.toLowerCase()) {
      console.log(col('Corretto ✅', 'green'));
      stats.c++;
    } else {
      console.log(col(`Errato ❌  – La forma corretta è: ${correct}`, 'red'));
      stats.w++;
    }
  }
}

async function practicePresentIrregular(verbs) {

  let stats = { c: 0, w: 0 };

  console.log(col('\n🛠️  Practice Present Tense Irregular – type “quit” to exit\n', 'magenta'));

  while (true) {
    // Pick a random verb & person
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const person = Math.floor(Math.random() * 6);
    const correct = present(v, person);

    // Ask user
    const ans = await ask(`Coniuga <${v.infinitive}> per ${PEOPLE[person]}: `);

    // User wants to quit
    if (ans.toLowerCase() === 'quit') {
      console.log(col(`\nStatistiche – corrette: ${stats.c}, sbagliate: ${stats.w}\n`, 'magenta'));
      break;
    }

    // Compare
    if (ans.trim().toLowerCase() === correct.toLowerCase()) {
      console.log(col('Corretto ✅', 'green'));
      stats.c++;
    } else {
      console.log(col(`Errato ❌  – La forma corretta è: ${correct}`, 'red'));
      stats.w++;
    }
  }
}

// Conjugation Table
async function presentStandardConjugation(){
    introPresent(null);
    const ans = await ask(`Hit any key to go back.`);
    if (ans){
        return
    }
}

// ---------- App loop -----------------------------------

async function run() {
  const verbs = load();

  while (true) {
    const mode = await mainMenu(verbs);

    if (mode === 1) await practicePresent(verbs);
    else if (mode === 2) await practiceImperative(verbs);
    else if (mode === 4) await presentStandardConjugation();
    else if (mode === 0) { console.log(col('Arrivederci!', 'cyan')); break; }
  }
}

run();