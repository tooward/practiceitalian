// adjectives.exercises.ts – drills for adjectives
import { UI } from './ui';
import { Adjective } from '../types';
import { isCorrect as fuzzy } from '../util';
import { AdjFormKey, AdjectiveProgressStore, JsonAdjectiveProgressStore } from './adjProgress';

function normalizeTranslations(t: Adjective['translation']): string[] {
  if (Array.isArray(t)) return t;
  if (!t) return [];
  return [t];
}

export interface AdjExerciseContext {
  ui: UI;
  progress: AdjectiveProgressStore;
}

export interface AdjExercise {
  name: string;
  run(adj: Adjective, ctx: AdjExerciseContext): Promise<void>;
}

export class AdjTranslationExercise implements AdjExercise {
  name = 'AdjTranslation';
  async run(adj: Adjective, ctx: AdjExerciseContext): Promise<void> {
    const trans = normalizeTranslations(adj.translation);
    const flip = Math.random() < 0.5 && trans.length > 0;
    if (flip) {
      ctx.ui.println(`Italian: ${adj.lemma}`, 'yellow');
      const ans = await ctx.ui.prompt('Translate to English: ');
      const ok = trans.some(t => fuzzy(ans, t));
      ctx.progress.updateLexical(adj.id, 'it2en', ok);
      ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${trans.join(' / ') || '(n/a)'}`, ok ? 'green' : 'red');
    } else {
      const en = trans[0] || '(no translation)';
      ctx.ui.println(`English: ${en}`, 'cyan');
      const ans = await ctx.ui.prompt('Italian lemma: ');
      const ok = fuzzy(ans, adj.lemma);
      ctx.progress.updateLexical(adj.id, 'en2it', ok);
      ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${adj.lemma}`, ok ? 'green' : 'red');
    }
  }
}

export class AdjFormsExercise implements AdjExercise {
  name = 'AdjForms';
  async run(adj: Adjective, ctx: AdjExerciseContext): Promise<void> {
  const keys = ['ms','mp','fs','fp'] as const;
  const forms: AdjFormKey[] = keys.filter((k): k is AdjFormKey => Boolean((adj.forms as any)?.[k]));
    if (!forms.length) { ctx.ui.println('(no forms available)'); return; }
    const which = forms[Math.floor(Math.random() * forms.length)];
    const label = { ms: 'masc sing', mp: 'masc plur', fs: 'fem sing', fp: 'fem plur' }[which];
    ctx.ui.println(`Lemma: ${adj.lemma}`, 'yellow');
    const ans = await ctx.ui.prompt(`Italian form (${label}): `);
    const correct = (adj.forms as any)[which] as string;
    const ok = fuzzy(ans, correct);
    ctx.progress.updateForm(adj.id, which, ok);
    ctx.ui.println(ok ? '✔ Correct!' : `✘ Wrong – ${correct}`, ok ? 'green' : 'red');
  }
}
