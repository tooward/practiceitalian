import { ConjugationExercise } from '../exercises';
import type { Verb } from '../../types';
import { FakeUI } from '../../test-helpers/fakeUI';

const verb: Verb = { infinitive: 'andare', translation: 'to go', irregular: true, present: ['vado','vai','va','andiamo','andate','vanno'] };

describe('ConjugationExercise', () => {
  test('prompts for a person and updates progress for that person', async () => {
    // pick person index 2 (he/she) by providing deterministic Random
    // user will type the correct form
    const ui = new FakeUI(['va']);
    let updated: any = null;
    const progress = {
      update: (inf: string, tense: any, person: number, ok: boolean) => { updated = { inf, tense, person, ok }; },
    } as any;
    const ex = new ConjugationExercise({ next: () => 0.35 });
    await ex.run(verb, { ui: ui as any, progress, tense: 'present' });
    expect(updated).not.toBeNull();
    expect(updated.inf).toBe('andare');
    expect(updated.person).toBeGreaterThanOrEqual(0);
    expect(updated.ok).toBe(true);
  });
});
