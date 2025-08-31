import { TranslationExercise } from '../exercises';
import type { Verb } from '../../types';
import { FakeUI } from '../../test-helpers/fakeUI';
import { InMemoryProgressStore } from '../../test-helpers/inMemoryProgress';

// We will control Math.random temporarily to force a specific branch

const verb: Verb = { infinitive: 'parlare', translation: 'to speak', irregular: false, present: ['parlo','parli','parla','parliamo','parlate','parlano'] };

describe('TranslationExercise', () => {
  test('it→en branch updates it2en and prints feedback', async () => {
    const ui = new FakeUI(['to speak']);
    const p = new InMemoryProgressStore();
    const ex = new TranslationExercise({ next: () => 0.1 });
    await ex.run(verb, { ui, progress: p as any, tense: 'present' });
    expect(p.lexicalCorrect('parlare', 'it2en')).toBe(1);
    expect(ui.out.join('\n')).toContain('Correct');
  });

  test('en→it branch updates en2it and prints feedback', async () => {
    const ui = new FakeUI(['parlare']);
    const p = new InMemoryProgressStore();
    const ex = new TranslationExercise({ next: () => 0.9 });
    await ex.run(verb, { ui, progress: p as any, tense: 'present' });
    expect(p.lexicalCorrect('parlare', 'en2it')).toBe(1);
    expect(ui.out.join('\n')).toContain('Correct');
  });
});
