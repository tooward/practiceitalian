// exercises.ts – pluggable exercise types
import { PersonIndex, Tense, Verb } from '../types';
import { UI } from './ui';
import { ProgressStore } from './progress';
import { isCorrect as fuzzy } from '../util';

export interface ExerciseContext {
  ui: UI;
  progress: ProgressStore;
  tense: Tense;
}

export interface Exercise {
  name: string;
  run(verb: Verb, ctx: ExerciseContext): Promise<void>;
}

export class InfinitiveTypingExercise implements Exercise {
  name = 'InfinitiveTyping';
  async run(verb: Verb, ctx: ExerciseContext): Promise<void> {
    ctx.ui.println(`Italian: ${verb.infinitive}`, 'yellow');
    const ans = await ctx.ui.prompt('Type the Italian infinitive: ');
    const ok = fuzzy(ans, verb.infinitive);
    ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – "${verb.infinitive}"`, ok ? 'green' : 'red');
  }
}

export class TranslationExercise implements Exercise {
  name = 'Translation';
  async run(verb: Verb, ctx: ExerciseContext): Promise<void> {
    const flip = Math.random() < 0.5;
    if (flip) {
      ctx.ui.println(`Italian word: ${verb.infinitive}`, 'yellow');
      const ans = await ctx.ui.prompt('Translate to English: ');
  const ok = fuzzy(ans, verb.translation || '');
      if (verb.translation) {
        ctx.progress.updateLexical(verb.infinitive, 'it2en', ok);
      }
      ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – "${verb.translation}"`, ok ? 'green' : 'red');
    } else {
      ctx.ui.println(`English: ${verb.translation || '(no translation)'}`, 'cyan');
      const ans = await ctx.ui.prompt('Italian infinitive: ');
  const ok = fuzzy(ans, verb.infinitive);
      ctx.progress.updateLexical(verb.infinitive, 'en2it', ok);
      ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – "${verb.infinitive}"`, ok ? 'green' : 'red');
    }
  }
}

export class ConjugationExercise implements Exercise {
  name = 'Conjugation';
  async run(verb: Verb, ctx: ExerciseContext): Promise<void> {
    const people: Array<{ en: string; it: string; idx: PersonIndex }> = [
      { en: 'I',          it: 'io',           idx: 0 },
      { en: 'you (sg)',   it: 'tu',           idx: 1 },
      { en: 'he/she/it',  it: 'lui/lei/esso', idx: 2 },
      { en: 'we',         it: 'noi',          idx: 3 },
      { en: 'you (pl)',   it: 'voi',          idx: 4 },
      { en: 'they',       it: 'loro',         idx: 5 }
    ];
    const person = people[Math.floor(Math.random() * people.length)];
    const forms = (verb as any)[ctx.tense] as string[] | undefined;
    const correct = forms?.[person.idx] || '';
    const prompt = `${person.it} (${person.en}) form of ${verb.infinitive} in ${ctx.tense}: `;
    const ans = await ctx.ui.prompt(prompt);
    const ok = fuzzy(ans, correct);
    ctx.progress.update(verb.infinitive, ctx.tense, person.idx, ok);
    ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – "${correct || '(n/a)'}"`, ok ? 'green' : 'red');
  }
}
