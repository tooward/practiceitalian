import { Session } from '../session';
import { InfinitiveTypingExercise, TranslationExercise } from '../exercises';
import type { Verb } from '../../types';
import { FakeUI } from '../../test-helpers/fakeUI';
import { InMemoryProgressStore } from '../../test-helpers/inMemoryProgress';

const verb: Verb = {
  infinitive: 'parlare',
  translation: 'to speak',
  irregular: false,
  present: ['parlo','parli','parla','parliamo','parlate','parlano']
};

describe('Session (warm-up only)', () => {
  test('runs one warm-up pass, then proceeds to finish without conjugation', async () => {
    // Force TranslationExercise branch it->en via injected random
    // Answers in order:
    // 1) start warm-up: ''
    // 2) InfinitiveTyping prompt: 'parlare'
    // 3) continue prompt: ''
    // 4) TranslationExercise prompt: 'to speak'
    // 5) continue prompt: ''
    // 6) Another warm-up round? 'c' to proceed (no conjugation configured)
    const ui = new FakeUI(['', 'parlare', '', 'to speak', '', 'c']);
    const progress = new InMemoryProgressStore();
    const session = new Session({
      title: 'Test',
      batch: [verb],
      exercises: [new InfinitiveTypingExercise(), new TranslationExercise({ next: () => 0.1 })],
      context: { ui: ui as any, progress: progress as any, tense: 'present' }
    });

    await session.run();
    const out = ui.out.join('\n');
    expect(out).toContain('Session finished');
    expect(progress.lexicalCorrect('parlare', 'it2en')).toBe(1);
    expect(progress.lexicalCorrect('parlare', 'en2it')).toBe(0);
  });
});
