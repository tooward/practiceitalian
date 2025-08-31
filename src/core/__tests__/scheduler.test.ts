import { Scheduler } from '../scheduler';
import type { Verb } from '../../types';
import { InMemoryProgressStore } from '../../test-helpers/inMemoryProgress';

const verbs: Verb[] = [
  { infinitive: 'parlare', translation: 'to speak', irregular: false, present: ['parlo','parli','parla','parliamo','parlate','parlano'] },
  { infinitive: 'andare', translation: 'to go', irregular: true, present: ['vado','vai','va','andiamo','andate','vanno'] },
  { infinitive: 'avere', translation: 'to have', irregular: true, present: ['ho','hai','ha','abbiamo','avete','hanno'] },
  // this one lacks present forms and should be excluded
  { infinitive: 'mancare', translation: 'to miss', irregular: false } as any,
];

describe('Scheduler', () => {
  test('filters by regular/irregular/all and excludes verbs without tense forms', () => {
    const p = new InMemoryProgressStore();
    const s = new Scheduler(p);

    const all = s.pickBatch(verbs, { tense: 'present', filter: 'all', batchSize: 10 });
    // excludes the one without present forms
    expect(all.every(v => Array.isArray((v as any).present) && (v as any).present.length >= 6)).toBe(true);

    const regs = s.pickBatch(verbs, { tense: 'present', filter: 'regular', batchSize: 10 });
    expect(regs.every(v => !v.irregular)).toBe(true);

    const irregs = s.pickBatch(verbs, { tense: 'present', filter: 'irregular', batchSize: 10 });
    expect(irregs.every(v => v.irregular)).toBe(true);
  });
});
