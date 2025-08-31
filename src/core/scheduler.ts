// scheduler.ts – choose what to practice next
import { Verb } from '../types';
import { ProgressStore } from './progress';
import type { Random } from './random';
import { defaultRandom } from './random';

export interface ScheduleOptions {
  batchSize?: number;
  tense: 'present' | 'past' | 'future';
  filter?: 'regular' | 'irregular' | 'all';
  requireLexGate?: boolean; // only pick verbs that passed lexical gate (for conjugation)
  preferLexicalAttempts?: boolean; // bias towards verbs with some lexical practice history
}

export class Scheduler {
  constructor(private progress: ProgressStore, private rand: Random = defaultRandom) {}

  pickBatch(verbs: Verb[], opts: ScheduleOptions): Verb[] {
    const size = opts.batchSize ?? 10;
    // base filtered list
    let list = this.filter(verbs, opts.filter ?? 'all').filter(v => Array.isArray((v as any)[opts.tense]) && (v as any)[opts.tense].length >= 6);
    // optionally require lexical gate
    if (opts.requireLexGate) {
      const gated = list.filter(v => this.progress.hasLexicalGate(v.infinitive));
      // If not enough, keep gated ones and append non-gated to fill up later
      if (gated.length >= size) list = gated;
      else list = [...gated, ...list.filter(v => !gated.includes(v))];
    }

    // Prioritize practiced-but-not-mastered: prefer items with some attempts but low mastery;
    // secondarily, if requiring lex gate, prefer higher lexical attempts to finish the gate.
    const score = (v: Verb) => {
      const mastery = this.progress.mastery(v.infinitive, opts.tense);
      const attempts = this.progress.getAttempts(v.infinitive, opts.tense);
      const base = 1 - mastery; // 0..1 where 1 is least mastered
      const hasSome = attempts > 0 ? 0.25 : 0; // small boost if already practiced
      const lexGateBoost = opts.requireLexGate ? Math.min(0.25, this.progress.lexicalAttempts(v.infinitive) / 20) : 0;
      const lexPrefBoost = opts.preferLexicalAttempts ? Math.min(0.5, this.progress.lexicalAttempts(v.infinitive) / 10) : 0;
      return base + hasSome + Math.max(lexGateBoost, lexPrefBoost);
    };

    // Partition into practiced-but-not-mastered and others
    const practiced: Verb[] = [];
    const fresh: Verb[] = [];
    for (const v of list) {
      const m = this.progress.mastery(v.infinitive, opts.tense);
      const a = this.progress.getAttempts(v.infinitive, opts.tense);
      if (a > 0 && m < 0.9) practiced.push(v); else fresh.push(v);
    }
    const order = (arr: Verb[]) => arr.map(v => ({ v, s: score(v) })).sort((a, b) => b.s - a.s).map(x => x.v);
    const prioritized = [...order(practiced), ...order(fresh)];
    const top = prioritized.slice(0, Math.max(size * 2, size + 1));
    return this.shuffle(top).slice(0, size);
  }

  private filter(verbs: Verb[], f: 'regular' | 'irregular' | 'all'): Verb[] {
    if (f === 'regular') return verbs.filter(v => !v.irregular);
    if (f === 'irregular') return verbs.filter(v => v.irregular);
    return verbs;
  }

  private shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
