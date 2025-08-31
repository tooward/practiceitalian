// conjugator.ts – only string manipulation
import { PersonIndex, Verb } from './types';

export const PEOPLE: ReadonlyArray<string> = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'] as const;
export const IMPERATIVES: ReadonlyArray<string> = ['tu', 'voi'] as const;

/**
 * Return the correct present-tense form for a verb and a person index.
 */
export function present(verb: Verb, person: PersonIndex): string | null {
  if (verb.present && Array.isArray(verb.present) && verb.present.length === 6) {
    return verb.present[person] ?? null;
  }
  const isRegular = verb.irregular === false || verb.irregular === undefined;
  if (isRegular) {
    const stem = verb.infinitive.slice(0, -3);
    const endings = ['o', 'i', 'a', 'iamo', 'ate', 'ano'] as const;
    return stem + endings[person];
  }
  return null;
}

export function past(verb: Verb, person: PersonIndex): string {
  if (verb.irregular && verb.past) return verb.past[person] ?? '';
  return 'ho/sono ...';
}

export function imperative(verb: Verb, person: 0 | 1): string {
  if (verb.irregular && verb.imperative) return verb.imperative[person] ?? '';
  const stem = verb.infinitive.slice(0, -4);
  return stem + ['a', 'ate'][person];
}
