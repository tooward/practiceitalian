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

export interface ProgressCell {
  correct: number;
  attempts: number;
}

export interface TenseStats extends Array<ProgressCell> {}

export interface VerbProgress {
  present?: TenseStats;
  past?: TenseStats;
  future?: TenseStats;
}

export type Progress = Record<string, VerbProgress>;

// Generic result of an exercise interaction
export interface ExerciseResult {
  correct: boolean;
  infinitive: string;
  tense?: Tense;
  person?: PersonIndex;
}

