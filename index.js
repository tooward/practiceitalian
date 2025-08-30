#!/usr/bin/env node
// verb‑practice.js  -----------------------------------------------
// No external dependencies – only the Node std‑lib.

const fs   = require('fs');
const readline = require('readline');

// -----------------------------------------------------------------
// 1️⃣  Colour helpers (ANSI escape codes) ------------------------
const COLORS = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  magenta:'\x1b[35m',
};
const col = (text, color) => `${COLORS[color]||COLORS.reset}${text}${COLORS.reset}`;

// -----------------------------------------------------------------
// 2️⃣  Simple “question” helper ----------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = (q) => new Promise(r => rl.question(q, r));

// -----------------------------------------------------------------
// 3️⃣  Load the verb list -----------------------------------------
const verbs = JSON.parse(fs.readFileSync('./verbs.json','utf8'));

// -----------------------------------------------------------------
// 4️⃣  Utility: shuffle an array ----------------------------------
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

// -----------------------------------------------------------------
// 5️⃣  Show a conjugation table ----------------------------------
function showConjTable(verb, mode){
  const tense = mode==='present'?'present':'past';
  const title = mode==='present'?'Present':'Past';
  console.log(
    col(`\n=== ${title} Tense: ${verb.infinitive} ===`, 'magenta'),
    col(`  io      : ${verb[tense][0]}`, 'cyan'),
    col(`  tu      : ${verb[tense][1]}`, 'cyan'),
    col(`  lui/lei : ${verb[tense][2]}`, 'cyan'),
    col(`  noi     : ${verb[tense][3]}`, 'cyan'),
    col(`  voi     : ${verb[tense][4]}`, 'cyan'),
    col(`  loro   : ${verb[tense][5]}\n`, 'cyan')
  );
}

// -----------------------------------------------------------------
// 6️⃣  The sprint / practice mode --------------------------------
async function practiceMode(mode){
  const tense = mode==='present'?'present':'past';
  const title = mode==='present'?'Present':'Past';

  // ----- 6.a  Choose verb set ------------------------------------
  console.log(
    col(`\n${title} Tense – choose verb set:`, 'cyan'),
    '1️⃣ Regular verbs',
    '2️⃣ Irregular verbs',
    '3️⃣ Mixed (all verbs)',
    '4️⃣ Show all tables',
    '5️⃣ Back to main menu'
  );
  const choice = await ask('Select an option (1‑5): ');
  const n = parseInt(choice.trim(),10);

  if(n===5) return;  // back to main menu

  let list;
  if(n===1) list = verbs.filter(v=>!v.irregular);
  if(n===2) list = verbs.filter(v=> v.irregular);
  if(n===3) list = verbs;
  if(n===4){
    verbs.forEach(v=>showConjTable(v,mode));
    await ask('\nPress any key to continue…');
    return practiceMode(mode);   // start a new sprint
  }

  // ----- 6.b  Pick 10 verbs for the sprint -----------------------
  const batch = shuffle([...list]).slice(0,10);

  // ----- 6.c  Show the 10 verbs + their English definition -------
  console.log(col(`\n=== 10‑word Sprint (${list.length} verbs total) ===`, 'magenta'));
  batch.forEach((v,i)=> {
    const trans = v.translation || '(no definition)';
    console.log(`  ${i+1}. ${col(v.infinitive,'yellow')} – ${trans}`);
  });
  console.log(col('\nLet’s begin the sprint!\n','cyan'));

  // ----- 6.d  Persons mapping ------------------------------------
  const persons = [
    {en:"I",          it:"io",          idx:0},
    {en:"you (sg)",   it:"tu",          idx:1},
    {en:"he/she/it",  it:"lui/lei/esso",idx:2},
    {en:"we",         it:"noi",         idx:3},
    {en:"you (pl)",   it:"voi",         idx:4},
    {en:"they",       it:"loro",        idx:5}
  ];

  // ----- 6.e  Iterate over the 10 verbs --------------------------
  for(const verb of batch){
    console.log(col(`\n\nVerb: ${verb.infinitive}`, 'yellow'));

    // ----- Translation ------------------------------------------------
    if(verb.translation){
      const userTr = await ask(`\nTranslate "${verb.infinitive}": `);
      if(userTr.trim().toLowerCase()===verb.translation.toLowerCase()){
        console.log(col('✔ Correct translation!', 'green'));
      }else{
        console.log(col(`✘ Wrong – the correct translation is "${verb.translation}"`,
                       'red'));
      }
    }else{
      console.log(col(`⚠ No translation data for "${verb.infinitive}". Skipping.`,
                      'yellow'));
    }

    // ----- Random conjugation ---------------------------------------
    const person = persons[Math.floor(Math.random()*persons.length)];
    const answer = await ask(
      `\nConjugate ${verb.infinitive} to / ${person.it} [${person.en}]: `
    );
    if(answer.trim()===verb[tense][person.idx]){
      console.log(col('✔ Correct!', 'green'));
    }else{
      console.log(col(`✘ Wrong – it is ${verb[tense][person.idx]}`,
                      'red'));
    }

    // Show the whole table (optional – keeps consistency)
    showConjTable(verb,mode);

    // ----- Option to continue the sprint? ------------------------
    const again = await ask('Next verb? (y/N): ');
    if(again.trim().toLowerCase()!=='y'){
      // User chose not to continue – go back to main menu
      return;
    }
  }

  // ----- 6.f  Sprint finished ------------------------------------
  console.log(col('\n✅ Sprint finished!','green'));
  const goBack = await ask('Return to main menu? (y/N): ');
  if(goBack.trim().toLowerCase()==='y' || goBack.trim()=== ''){
    // simply return – the caller (main menu) will show itself again
    return;
  }else{
    // If they said “no”, we just finish the sprint and stay in practiceMode
    // but according to your spec we’ll just return anyway.
    return;
  }
}

// -----------------------------------------------------------------
// 7️⃣  Main menu ---------------------------------------------------
async function mainMenu(){
  while(true){
    console.log(
      col('\n=== Italian Verb Practice ===', 'magenta'),
      '\n1️⃣ Present tense',
      '\n2️⃣ Past tense',
      '\n3️⃣ Quit'
    );
    const choice = await ask('Select an option (1‑3): ');
    const n = parseInt(choice.trim(),10);

    if(n===3){
      console.log(col('\nGood‑bye!', 'yellow'));
      rl.close();
      process.exit(0);
    }

    if(n===1 || n===2){
      const mode = n===1?'present':'past';
      await practiceMode(mode);
      // when practiceMode returns we’re back in the while‑loop
    }else{
      console.log(col('❌ Invalid option – try again', 'red'));
    }
  }
}

// -----------------------------------------------------------------
// 8️⃣  Start the program ------------------------------------------
mainMenu();