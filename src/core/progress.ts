// progress.ts – progress persistence service
import fs from 'fs';
import path from 'path';
import { LexDir, PersonIndex, Progress, Tense } from '../types';

export interface ProgressStore {
  load(): Progress;
  update(infinitive: string, tense: Tense, person: PersonIndex, correct: boolean): void;
  mastery(infinitive: string, tense: Tense): number; // 0..1 average accuracy
  // lexical tracking for infinitive translations
  updateLexical(infinitive: string, dir: LexDir, correct: boolean): void;
  lexicalCorrect(infinitive: string, dir: LexDir): number;
  hasLexicalGate(infinitive: string, required?: number): boolean;
  getAttempts(infinitive: string, tense: Tense): number; // total attempts across persons
  lexicalAttempts(infinitive: string): number; // total lexical attempts across both dirs
}

const MASTER_MIN_ATTEMPTS = 3;

export class JsonProgressStore implements ProgressStore {
  private filepath: string;
  private cache: Progress | null = null;

  constructor(filePath?: string) {
    this.filepath = filePath || path.resolve(process.cwd(), 'progress.json');
  }

  load(): Progress {
    if (this.cache) return this.cache as Progress;
    let parsed: Progress = {} as Progress;
    try {
      if (fs.existsSync(this.filepath)) {
        const text = fs.readFileSync(this.filepath, 'utf8');
        parsed = JSON.parse(text || '{}') as Progress;
      }
    } catch {
      // ignore and fall back to empty
    }
    this.cache = parsed;
    return parsed;
  }

  private save(): void {
    fs.writeFileSync(this.filepath, JSON.stringify(this.cache ?? {}, null, 2), 'utf8');
  }

  update(infinitive: string, tense: Tense, person: PersonIndex, correct: boolean): void {
    const p = this.load();
    p[infinitive] ||= {};
    const arr = (p[infinitive] as any)[tense] as Array<{correct:number;attempts:number}> | undefined;
    if (!Array.isArray(arr)) {
      (p[infinitive] as any)[tense] = Array.from({ length: 6 }, () => ({ correct: 0, attempts: 0 }));
    }
    const cell = ((p[infinitive] as any)[tense] as Array<{correct:number;attempts:number}>)[person];
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.save();
  }

  mastery(infinitive: string, tense: Tense): number {
    const p = this.load();
    const arr = (p[infinitive] as any)?.[tense] as Array<{correct:number;attempts:number}> | undefined;
    if (!Array.isArray(arr)) return 0;
    let c = 0, a = 0;
    for (const cell of arr) { c += cell.correct; a += cell.attempts; }
    if (a < MASTER_MIN_ATTEMPTS) return 0; // require a few attempts to count
    return a ? c / a : 0;
  }

  getAttempts(infinitive: string, tense: Tense): number {
    const p = this.load();
    const arr = (p[infinitive] as any)?.[tense] as Array<{correct:number;attempts:number}> | undefined;
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum, c) => sum + (c.attempts || 0), 0);
  }

  updateLexical(infinitive: string, dir: LexDir, correct: boolean): void {
    const p = this.load();
    p[infinitive] ||= {} as any;
    const lex = ((p[infinitive] as any).lex ||= {}) as any;
    const cell = (lex[dir] ||= { attempts: 0, correct: 0 }) as { attempts: number; correct: number };
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.save();
  }

  lexicalCorrect(infinitive: string, dir: LexDir): number {
    const p = this.load();
    const cell = (p[infinitive] as any)?.lex?.[dir] as { attempts: number; correct: number } | undefined;
    return cell?.correct ?? 0;
  }

  hasLexicalGate(infinitive: string, required = 3): boolean {
    const p = this.load();
    const lex = (p[infinitive] as any)?.lex as { it2en?: {correct:number;attempts:number}; en2it?: {correct:number;attempts:number} } | undefined;
    const it2en = lex?.it2en?.correct ?? 0;
    const en2it = lex?.en2it?.correct ?? 0;
    return it2en >= required && en2it >= required;
  }

  lexicalAttempts(infinitive: string): number {
    const p = this.load();
    const lex = (p[infinitive] as any)?.lex as { it2en?: {correct:number;attempts:number}; en2it?: {correct:number;attempts:number} } | undefined;
    return (lex?.it2en?.attempts ?? 0) + (lex?.en2it?.attempts ?? 0);
  }
}
