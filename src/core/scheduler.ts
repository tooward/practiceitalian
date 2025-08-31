// scheduler.ts – choose what to practice next
import { Verb } from '../types';
import { ProgressStore } from './progress';

export interface ScheduleOptions {
  batchSize?: number;
  tense: 'present' | 'past' | 'future';
  filter?: 'regular' | 'irregular' | 'all';
}

export class Scheduler {
  constructor(private progress: ProgressStore) {}

  pickBatch(verbs: Verb[], opts: ScheduleOptions): Verb[] {
    const size = opts.batchSize ?? 10;
    const list = this.filter(verbs, opts.filter ?? 'all').filter(v => Array.isArray((v as any)[opts.tense]) && (v as any)[opts.tense].length >= 6);
    const scored = list.map(v => ({ v, s: 1 - this.progress.mastery(v.infinitive, opts.tense) }));
    scored.sort((a, b) => b.s - a.s);
    const top = scored.slice(0, Math.max(size * 2, size + 1)).map(x => x.v);
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
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
