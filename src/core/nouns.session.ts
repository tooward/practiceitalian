// nouns.session.ts – orchestrate a noun practice session
import { Noun } from '../types';
import { UI } from './ui';
import { JsonNounProgressStore, NounProgressStore } from './nounProgress';
import { NounExercise, NounFormsExercise, NounGenderExercise, NounTranslationExercise } from './nouns.exercises';

export interface NounSessionOptions {
  title: string;
  batch: Noun[];
}

export class NounSession {
  private progress: NounProgressStore;
  private ui: UI;
  private translations: NounExercise;
  private forms: NounExercise;
  private gender: NounExercise;

  constructor(private opts: NounSessionOptions, ui: UI, progress?: NounProgressStore) {
    this.ui = ui;
    this.progress = progress || new JsonNounProgressStore();
    this.translations = new NounTranslationExercise();
    this.forms = new NounFormsExercise();
    this.gender = new NounGenderExercise();
  }

  async run(): Promise<void> {
    const ui = this.ui;
    ui.clear();
    ui.println(`\n=== ${this.opts.title} (${this.opts.batch.length} nouns) ===`, 'magenta');
    ui.println();
    this.opts.batch.forEach((n, i) => ui.println(`  ${i + 1}. ${n.lemma}`));

    // Warm-up: translations with a gate
    let proceed = false;
    while (!proceed) {
      ui.println('\nWarm-up: noun translations (it↔en).', 'yellow');
      ui.println('Enter to start, s=status, f=forms, q=quit');
      const ans = await ui.prompt('> ');
      if (/^q$/i.test(ans)) { ui.println('\nExiting to main menu.'); return; }
      if (/^f$/i.test(ans)) { proceed = true; break; }
      if (/^s$/i.test(ans)) { this.showStatus(); continue; }
      let breakRound = false;
      for (const noun of this.opts.batch) {
        if (breakRound) break;
        ui.clear();
        ui.println(`\nWarm-up – ${noun.lemma}`, 'magenta');
        await this.translations.run(noun, { ui, progress: this.progress });
        const cont = await ui.prompt('\nEnter to continue, b=break, q=quit: ');
        if (/^q$/i.test(cont)) { ui.println('\nExiting to main menu.'); return; }
        if (/^b$/i.test(cont)) { breakRound = true; break; }
      }
      this.showGate();
      const next = await ui.prompt('Another warm-up round? (Enter=yes, s=status, f=forms, q=quit): ');
      if (/^q$/i.test(next)) { ui.println('\nExiting to main menu.'); return; }
      if (/^f$/i.test(next)) { proceed = true; }
      if (/^s$/i.test(next)) { this.showStatus(); }
    }

    // Forms phase
    ui.clear();
    ui.println(`\nForms – ${this.opts.batch.length} nouns.`, 'cyan');
    ui.println('Enter to start, or q to skip to gender.');
    const goForms = await ui.prompt('> ');
    if (!/^q$/i.test(goForms)) {
      for (const noun of this.opts.batch) {
        ui.clear();
        ui.println(`\nForms – ${noun.lemma}`, 'magenta');
        await this.forms.run(noun, { ui, progress: this.progress });
        const cont = await ui.prompt('\nEnter to continue, q=skip: ');
        if (/^q$/i.test(cont)) break;
      }
    }

    // Gender phase
    ui.clear();
    ui.println(`\nGender – ${this.opts.batch.length} nouns.`, 'cyan');
    ui.println('Enter to start, or q to finish.');
    const goGender = await ui.prompt('> ');
    if (!/^q$/i.test(goGender)) {
      for (const noun of this.opts.batch) {
        ui.clear();
        ui.println(`\nGender – ${noun.lemma}`, 'magenta');
        await this.gender.run(noun, { ui, progress: this.progress });
        const cont = await ui.prompt('\nEnter to continue, q=finish: ');
        if (/^q$/i.test(cont)) break;
      }
    }

    ui.clear();
    ui.println('\n✅ Noun session finished!', 'green');
  }

  private showGate(): void {
    const ready = this.opts.batch.filter(n => this.progress.hasLexicalGate(n.id)).length;
    this.ui.println(`\nLexical ready: ${ready}/${this.opts.batch.length} (need 3 correct each way)`, 'cyan');
  }

  private showStatus(): void {
    this.ui.println('\n=== Warm-up Status ===', 'magenta');
    const header = ['Noun'.padEnd(20), 'it→en'.padEnd(8), 'en→it'.padEnd(8), 'Ready'];
    this.ui.println(header.join('  '), 'cyan');
    for (const n of this.opts.batch) {
      const it2 = this.progress.lexicalCorrect(n.id, 'it2en');
      const en2 = this.progress.lexicalCorrect(n.id, 'en2it');
      const ready = this.progress.hasLexicalGate(n.id) ? '✅' : '—';
      this.ui.println([
        n.lemma.slice(0, 20).padEnd(20),
        `${it2}/3`.padEnd(8),
        `${en2}/3`.padEnd(8),
        ready
      ].join('  '));
    }
  }
}
