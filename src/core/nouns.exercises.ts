// nouns.exercises.ts – drills for nouns: translation, forms, gender
import { UI } from './ui';
import { Noun } from '../types';
import { NounProgressStore } from './nounProgress';
import { isCorrect as fuzzy } from '../util';

function normalizeTranslations(t: Noun['translation']): string[] {
  if (Array.isArray(t)) return t;
  if (!t) return [];
  return [t];
}

export interface NounExerciseContext {
  ui: UI;
  progress: NounProgressStore;
}

export interface NounExercise {
  name: string;
  run(noun: Noun, ctx: NounExerciseContext): Promise<void>;
}

export class NounTranslationExercise implements NounExercise {
  name = 'NounTranslation';
  async run(noun: Noun, ctx: NounExerciseContext): Promise<void> {
    const trans = normalizeTranslations(noun.translation);
    const flip = Math.random() < 0.5 && trans.length > 0;
    if (flip) {
      ctx.ui.println(`Italian: ${noun.lemma}`, 'yellow');
      const ans = await ctx.ui.prompt('Translate to English: ');
      const ok = trans.some(t => fuzzy(ans, t));
      ctx.progress.updateLexical(noun.id, 'it2en', ok);
      ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${trans.join(' / ') || '(n/a)'}`, ok ? 'green' : 'red');
    } else {
      const en = trans[0] || '(no translation)';
      ctx.ui.println(`English: ${en}`, 'cyan');
      const ans = await ctx.ui.prompt('Italian: ');
      const ok = fuzzy(ans, noun.lemma);
      ctx.progress.updateLexical(noun.id, 'en2it', ok);
      ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${noun.lemma}`, ok ? 'green' : 'red');
    }
  }
}

export class NounFormsExercise implements NounExercise {
  name = 'NounForms';
  async run(noun: Noun, ctx: NounExerciseContext): Promise<void> {
    const askPl = Math.random() < 0.5;
    const target = askPl ? noun.forms.pl : noun.forms.sg;
    const label = askPl ? 'plural' : 'singular';
    ctx.ui.println(`Base: ${noun.lemma}`, 'yellow');
    const ans = await ctx.ui.prompt(`Italian ${label} form: `);
    const ok = fuzzy(ans, target);
    ctx.progress.updateForm(noun.id, askPl ? 'pl' : 'sg', ok);
    ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${target}`, ok ? 'green' : 'red');
  }
}

export class NounGenderExercise implements NounExercise {
  name = 'NounGender';
  async run(noun: Noun, ctx: NounExerciseContext): Promise<void> {
    const ans = await ctx.ui.prompt(`Gender of ${noun.lemma} (m/f): `);
    const norm = ans.trim().toLowerCase();
    const mset = new Set(['m', 'masc', 'masculine']);
    const fset = new Set(['f', 'fem', 'feminine']);
    const ok = (noun.gender === 'm' && mset.has(norm)) || (noun.gender === 'f' && fset.has(norm));
    ctx.progress.updateGender(noun.id, ok);
    ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${noun.gender.toUpperCase()}`, ok ? 'green' : 'red');
  }
}
