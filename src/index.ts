#!/usr/bin/env node
// index.ts – boots Flow/Scene driven app with shared readline UI
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

async function main(): Promise<void> {
  const ui = new ConsoleUI(rl);
  const app = new App();
  await app.runFlow(ui);
  rl.close();
}

main();
