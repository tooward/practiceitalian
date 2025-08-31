#!/usr/bin/env node
// ---------------------------------------------------------------
// index.js – main menu & program bootstrap
// ---------------------------------------------------------------

const fs   = require('fs');
const readline = require('readline');

const { practiceMode } = require('./practice');

// ---------- colour helper ----------
const COLORS = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  magenta:'\x1b[35m',
};
const col = (text, color) => `${COLORS[color]||COLORS.reset}${text}${COLORS.reset}`;

// ---------- readline helper ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = (q) => new Promise(r => rl.question(q, r));

// ---------- load verbs ----------
const verbs = JSON.parse(fs.readFileSync('./verbs.json', 'utf8'));

// ---------- main loop ----------
async function mainMenu() {
  while (true) {
    console.log(
      col('\n=== Italian Verb Practice ===', 'magenta'),
      '\n1️⃣ Present tense',
      '\n2️⃣ Past tense',
      '\n3️⃣ Future tense',
      '\n4️⃣ Quit'
    );
    const choice = await ask('Select an option (1‑3): ');
    const n = parseInt(choice.trim(), 10);
  
      if (n === 4) {
      console.log(col('\nGood‑bye!', 'yellow'));
      rl.close();
      process.exit(0);
    }
      if (n === 1 || n === 2 || n === 3) {
        const mode = n === 1 ? 'present' : (n === 2 ? 'past' : 'future');
      await practiceMode(mode, rl, verbs);   // hand off to practice module
      // when practiceMode returns we’re back in the while‑loop
    } else {
      console.log(col('❌ Invalid option – try again', 'red'));
    }
  }
}

// start the program
mainMenu();