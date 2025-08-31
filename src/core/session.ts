// session.ts – orchestrate a practice session
import { Verb } from '../types';
import { UI } from './ui';
import { Exercise, ExerciseContext } from './exercises';
import { ProgressStore } from './progress';
import { Scheduler } from './scheduler';

export interface SessionOptions {
  title: string;
  batch: Verb[];
  exercises: Exercise[]; // order matters: warm-up exercises first
  context: Omit<ExerciseContext, 'ui' | 'progress'> & { ui: UI; progress: ProgressStore };
}

export class Session {
  constructor(private opts: SessionOptions) {}

  async run(): Promise<void> {
    const { ui, progress, tense } = this.opts.context;
    ui.clear();
    ui.println(`\n=== ${this.opts.title} (${this.opts.batch.length} verbs) ===`, 'magenta');
    ui.println();

    // Show initial list
    this.opts.batch.forEach((v, i) => ui.println(`  ${i + 1}. ${v.infinitive} – ${v.translation || ''}`));

  // Split exercises by name: any non-Conjugation are warm-ups; optional Conjugation phase if provided
  const warmups = this.opts.exercises.filter(ex => ex.name !== 'Conjugation');
  const conjugation = this.opts.exercises.find(ex => ex.name === 'Conjugation');

    // Warm-up loop: user can repeat until gated or choose to proceed/exit
    if (warmups.length > 0) {
      let proceed = false;
      while (!proceed) {
        const showGate = () => {
          const ready = this.opts.batch.filter(v => progress.hasLexicalGate(v.infinitive)).length;
          ui.println(`\nLexical ready: ${ready}/${this.opts.batch.length} (need 3 correct each way)`, 'cyan');
        };
        const showStatus = () => {
          ui.println('\n=== Warm-up Status ===', 'magenta');
          const header = ['Verb'.padEnd(18), 'it→en'.padEnd(8), 'en→it'.padEnd(8), 'Ready'];
          ui.println(header.join('  '), 'cyan');
          for (const v of this.opts.batch) {
            const it2 = progress.lexicalCorrect(v.infinitive, 'it2en');
            const en2 = progress.lexicalCorrect(v.infinitive, 'en2it');
            const ready = progress.hasLexicalGate(v.infinitive) ? '✅' : '—';
            ui.println([
              (v.infinitive + (v.translation ? ` (${v.translation})` : '')).slice(0, 28).padEnd(28),
              `${it2}/3`.padEnd(8),
              `${en2}/3`.padEnd(8),
              ready
            ].join('  '));
          }
        };
        ui.println('\nWarm-up: practice infinitives and translations.', 'yellow');
        ui.println('Press Enter to start, or type s=status, c=conjugation, q=quit to main menu.');
        const ans = await ui.prompt('> ');
        if (/^q$/i.test(ans)) { ui.println('\nExiting to main menu.'); return; }
        if (/^c$/i.test(ans)) { proceed = true; break; }
        if (/^s$/i.test(ans)) { showStatus(); continue; }
        // run a pass
        let breakRound = false;
        for (const verb of this.opts.batch) {
          if (breakRound) break;
          ui.clear();
          ui.println(`\nWarm-up – ${verb.infinitive} (${verb.translation || ''})`, 'magenta');
          for (const ex of warmups) {
            await ex.run(verb, { ui, progress, tense });
            const cont = await ui.prompt('\nEnter to continue, b to break warm-up, q to quit: ');
            if (/^q$/i.test(cont)) { ui.println('\nExiting to main menu.'); return; }
            if (/^b$/i.test(cont)) { breakRound = true; break; }
          }
        }
        showGate();
        const next = await ui.prompt('Another warm-up round? (Enter=yes, s=status, c=conjugation, q=quit): ');
        if (/^q$/i.test(next)) { ui.println('\nExiting to main menu.'); return; }
        if (/^c$/i.test(next)) { proceed = true; }
        if (/^s$/i.test(next)) { showStatus(); }
      }
    }

    // Conjugation phase: prefer lexically gated verbs; fill rest randomly
    if (conjugation) {
      ui.clear();
      const scheduler = new Scheduler(progress);
      // Build a prioritized list: gated first; then others
      const gated = this.opts.batch.filter(v => progress.hasLexicalGate(v.infinitive));
      let conjBatch: Verb[] = [];
      if (gated.length > 0) conjBatch = scheduler.pickBatch(gated, { tense, filter: 'all', batchSize: Math.min(gated.length, this.opts.batch.length), requireLexGate: true });
      if (conjBatch.length < this.opts.batch.length) {
        const remaining = this.opts.batch.filter(v => !conjBatch.includes(v));
        const filler = scheduler.pickBatch(remaining, { tense, filter: 'all', batchSize: this.opts.batch.length - conjBatch.length });
        conjBatch = [...conjBatch, ...filler];
      }

      ui.println(`\nConjugation – ${conjBatch.length} verbs (gated first).`, 'cyan');
      ui.println('Press Enter to start, or type q to quit to main menu.');
      const go = await ui.prompt('> ');
      if (/^q$/i.test(go)) { ui.println('\nExiting to main menu.'); return; }

      for (const verb of conjBatch) {
        ui.clear();
        ui.println(`\nConjugation – ${conjBatch.indexOf(verb) + 1} of ${conjBatch.length}`, 'magenta');
        await conjugation.run(verb, { ui, progress, tense });
        const cont = await ui.prompt('\nEnter to continue, q to quit: ');
        if (/^q$/i.test(cont)) { ui.println('\nExiting to main menu.'); return; }
      }
    }

    ui.clear();
    ui.println('\n✅ Session finished!', 'green');
  }
}
