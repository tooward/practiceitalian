// session.ts – orchestrate a practice session
import { Verb } from '../types';
import { UI } from './ui';
import { Exercise, ExerciseContext } from './exercises';
import { ProgressStore } from './progress';

export interface SessionOptions {
  title: string;
  batch: Verb[];
  exercises: Exercise[];
  context: Omit<ExerciseContext, 'ui' | 'progress'> & { ui: UI; progress: ProgressStore };
}

export class Session {
  constructor(private opts: SessionOptions) {}

  async run(): Promise<void> {
    const { ui, progress, tense } = this.opts.context;
    ui.clear();
    ui.println(`\n=== ${this.opts.title} (${this.opts.batch.length} verbs) ===`, 'magenta');
    ui.println();

    // Warm-up: list verbs
    this.opts.batch.forEach((v, i) => ui.println(`  ${i + 1}. ${v.infinitive} – ${v.translation || ''}`));
    await ui.pause('\nPress Enter to start…');

    for (const verb of this.opts.batch) {
      ui.clear();
      ui.println(`\nWord ${this.opts.batch.indexOf(verb) + 1} of ${this.opts.batch.length}`, 'magenta');
      // run each exercise once per verb
      for (const ex of this.opts.exercises) {
        await ex.run(verb, { ui, progress, tense });
        await ui.pause();
      }
    }

    ui.clear();
    ui.println('\n✅ Session finished!', 'green');
  }
}
