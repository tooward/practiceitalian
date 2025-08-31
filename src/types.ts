export type PersonIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type Tense = 'present' | 'past' | 'future';

export interface Verb {
  infinitive: string;
  irregular?: boolean;
  translation?: string;
  present?: string[];   // length 6
  past?: string[];      // length 6
  future?: string[];    // length 6
  imperative?: [string, string]; // [tu, voi]
}

// Shared/meta types for themed practice
export type Pos = 'verb' | 'noun' | 'adjective';
export type Translation = string | string[]; // normalize at load time to string[]

export interface CategoryRef {
  id: string;
  label: string;
  files: Partial<Record<'verbs' | 'nouns' | 'adjectives', string[]>>;
}

// Noun based on noun.schema.json
export interface Noun {
  id: string;
  pos: 'noun';
  lemma: string;
  translation: Translation;
  gender: 'm' | 'f';
  countability?: 'count' | 'mass' | 'both';
  forms: {
    sg: string;
    pl: string;
    bare: { sg: string; pl: string };
  };
  invariable?: boolean;
  irregular_plural?: string | null;
  initial_sound_class?: 'vowel' | 's+cons' | 'z' | 'ps' | 'gn' | 'x' | 'other';
  themes?: string[];
}

// Adjective based on adjective.schema.json
export interface Adjective {
  id: string;
  pos: 'adj';
  lemma: string;
  translation: Translation;
  type: 'variable' | 'invariable' | 'irregular';
  forms?: { ms?: string; mp?: string; fs?: string; fp?: string };
  apocopated?: Record<string, unknown>;
  position: 'pre' | 'post' | 'variable';
  comparatives?: Record<string, unknown>;
  adverbial?: string;
  themes?: string[];
}

export interface ProgressCell {
  correct: number;
  attempts: number;
}

export interface TenseStats extends Array<ProgressCell> {}

export interface VerbProgress {
  present?: TenseStats;
  past?: TenseStats;
  future?: TenseStats;
  // lexical mastery for infinitive translations (directional)
  lex?: {
    it2en?: ProgressCell; // given Italian, translate to English
    en2it?: ProgressCell; // given English, produce Italian infinitive
  };
}

export type Progress = Record<string, VerbProgress>;

export type LexDir = 'it2en' | 'en2it';

// Generic result of an exercise interaction
export interface ExerciseResult {
  correct: boolean;
  infinitive: string;
  tense?: Tense;
  person?: PersonIndex;
}

