#!/usr/bin/env node
// index.ts – main menu & program bootstrap (now delegates to OO App)
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { practiceMode } from './practice';
import { Verb, Tense } from './types';
import { ConsoleUI } from './core/ui';
import { App } from './core/app';
import { col } from './util';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = (q: string) => new Promise<string>(r => rl.question(q, r));

const verbsPath = path.resolve(__dirname, '../verbs.json');
const verbs: Verb[] = JSON.parse(fs.readFileSync(verbsPath, 'utf8'));

async function mainMenu(): Promise<void> {
  while (true) {
    console.clear();
    console.log(
      col('\n=== Italian Verb Practice ===\n', 'magenta'),
      '\n1️⃣\tPresent tense',
      '\n2️⃣\tPast tense',
      '\n3️⃣\tFuture tense',
      '\n4️⃣\tQuit'
    );
    const choice = await ask('\nSelect an option (1–4): ');
    const n = parseInt(choice.trim(), 10);

    if (n === 4) {
      console.log(col('\nGood-bye!', 'yellow'));
      rl.close();
      process.exit(0);
    }
    if (n === 1 || n === 2 || n === 3) {
      const mode: Tense = n === 1 ? 'present' : (n === 2 ? 'past' : 'future');
      // New: sub-menu to select regular/irregular/all using OO App
      console.clear();
      console.log(
        col(`\n${mode.toUpperCase()} – choose verb set:`, 'cyan'),
        '\n1️⃣\tRegular verbs',
        '\n2️⃣\tIrregular verbs',
        '\n3️⃣\tMixed (all verbs)',
        '\n4️⃣\tBack'
      );
      const choice2 = await ask('Select an option (1–4): ');
      const m = parseInt(choice2.trim(), 10);
      if (m === 4 || Number.isNaN(m)) continue;
      const filter = m === 1 ? 'regular' : m === 2 ? 'irregular' : 'all';

      // Use a ConsoleUI bound to the existing readline to avoid conflicts
      const ui = new ConsoleUI(rl);
      const app = new App();
      await app.run(mode, filter as any, ui);
    } else {
      console.log(col('✖ Invalid option – try again', 'red'));
    }
  }
}

mainMenu();
