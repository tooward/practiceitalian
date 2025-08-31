#!/usr/bin/env node
// index.ts – boots Flow/Scene driven app with shared readline UI
import readline from 'readline';
// lightweight CLI entry – most logic is exercised via App and tests
import { ConsoleUI } from './core/ui';
import { App } from './core/app';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// Keep a reference to verbs file for possible manual runs; not used in tests.
// const ask = (q: string) => new Promise<string>(r => rl.question(q, r));

// const verbsPath = path.resolve(__dirname, '../verbs.json');
// const verbs: Verb[] = JSON.parse(fs.readFileSync(verbsPath, 'utf8'));

async function main(): Promise<void> {
  const ui = new ConsoleUI(rl);
  const app = new App();
  await app.runFlow(ui);
  rl.close();
}

main();
