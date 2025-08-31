import type { ProgressStore } from '../core/progress';
import type { LexDir, PersonIndex, Tense } from '../types';

export class InMemoryProgressStore implements ProgressStore {
  private store: any = {};

  load(): any { return this.store; }
  update(infinitive: string, tense: Tense, person: PersonIndex, correct: boolean): void {
    const p = this.store;
    p[infinitive] ||= {};
    const arr = (p[infinitive][tense] ||= Array.from({ length: 6 }, () => ({ correct: 0, attempts: 0 })));
    const cell = arr[person];
    cell.attempts += 1;
    if (correct) cell.correct += 1;
  }
  mastery(infinitive: string, tense: Tense): number {
    const arr = this.store[infinitive]?.[tense];
    if (!Array.isArray(arr)) return 0;
    const { c, a } = arr.reduce((s: any, cell: any) => ({ c: s.c + cell.correct, a: s.a + cell.attempts }), { c: 0, a: 0 });
    return a ? c / a : 0;
  }
  getAttempts(infinitive: string, tense: Tense): number {
    const arr = this.store[infinitive]?.[tense];
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum: number, cell: any) => sum + cell.attempts, 0);
  }
  updateLexical(infinitive: string, dir: LexDir, correct: boolean): void {
    const lex = (this.store[infinitive] ||= {}).lex ||= {};
    const cell = (lex[dir] ||= { attempts: 0, correct: 0 });
    cell.attempts += 1;
    if (correct) cell.correct += 1;
  }
  lexicalCorrect(infinitive: string, dir: LexDir): number {
    return this.store[infinitive]?.lex?.[dir]?.correct ?? 0;
  }
  hasLexicalGate(infinitive: string, required = 3): boolean {
    const it2en = this.store[infinitive]?.lex?.it2en?.correct ?? 0;
    const en2it = this.store[infinitive]?.lex?.en2it?.correct ?? 0;
    return it2en >= required && en2it >= required;
  }
  lexicalAttempts(infinitive: string): number {
    const it = this.store[infinitive]?.lex?.it2en?.attempts ?? 0;
    const en = this.store[infinitive]?.lex?.en2it?.attempts ?? 0;
    return it + en;
  }
}
