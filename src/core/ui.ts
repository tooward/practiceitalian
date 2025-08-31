// ui.ts – Console UI abstraction and implementation
import readline from 'readline';
import { ColorKey, col } from '../util';

export interface UI {
  clear(): void;
  print(text: string, color?: ColorKey): void;
  println(text?: string, color?: ColorKey): void;
  prompt(question: string): Promise<string>;
  pause(message?: string): Promise<void>;
  close(): void;
}

export class ConsoleUI implements UI {
  private rl: readline.Interface;

  constructor(rl?: readline.Interface) {
    this.rl = rl || readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  clear(): void { console.clear(); }

  print(text: string, color?: ColorKey): void {
    process.stdout.write(color ? col(text, color) : text);
  }

  println(text = '', color?: ColorKey): void {
    this.print(text + '\n', color);
  }

  prompt(question: string): Promise<string> {
    return new Promise(resolve => this.rl.question(question, ans => resolve(ans.trim())));
  }

  async pause(message = '\nPress Enter to continue…'): Promise<void> {
    await this.prompt(message);
  }

  close(): void { this.rl.close(); }
}
