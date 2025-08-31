// adjectives.session.ts – orchestrate adjective practice
import { Adjective } from '../types';
import { UI } from './ui';
import { AdjExercise, AdjFormsExercise, AdjTranslationExercise } from './adjectives.exercises';
import { AdjectiveProgressStore, JsonAdjectiveProgressStore } from './adjProgress';

export interface AdjectiveSessionOptions {
  title: string;
  batch: Adjective[];
}

export class AdjectiveSession {
  private progress: AdjectiveProgressStore;
  private ui: UI;
  private translations: AdjExercise;
  private forms: AdjExercise;

  constructor(private opts: AdjectiveSessionOptions, ui: UI, progress?: AdjectiveProgressStore) {
    this.ui = ui;
    this.progress = progress || new JsonAdjectiveProgressStore();
    this.translations = new AdjTranslationExercise();
    this.forms = new AdjFormsExercise();
  }

  async run(): Promise<void> {
    const ui = this.ui;
    ui.clear();
    ui.println(`\n=== ${this.opts.title} (${this.opts.batch.length} adjectives) ===`, 'magenta');
    ui.println();
    this.opts.batch.forEach((a, i) => ui.println(`  ${i + 1}. ${a.lemma}`));

    // Warm-up: translations with a gate
    let proceed = false;
    while (!proceed) {
      ui.println('\nWarm-up: adjective translations (it↔en).', 'yellow');
      ui.println('Enter to start, s=status, f=forms, q=quit');
      const ans = await ui.prompt('> ');
      if (/^q$/i.test(ans)) { ui.println('\nExiting to main menu.'); return; }
      if (/^f$/i.test(ans)) { proceed = true; break; }
      if (/^s$/i.test(ans)) { this.showStatus(); continue; }
      let breakRound = false;
      for (const adj of this.opts.batch) {
        if (breakRound) break;
        ui.clear();
        ui.println(`\nWarm-up – ${adj.lemma}`, 'magenta');
        await this.translations.run(adj, { ui, progress: this.progress });
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
    ui.println(`\nForms – ${this.opts.batch.length} adjectives.`, 'cyan');
    ui.println('Enter to start, or q to finish.');
    const goForms = await ui.prompt('> ');
    if (!/^q$/i.test(goForms)) {
      for (const adj of this.opts.batch) {
        ui.clear();
        ui.println(`\nForms – ${adj.lemma}`, 'magenta');
        await this.forms.run(adj, { ui, progress: this.progress });
        const cont = await ui.prompt('\nEnter to continue, q=finish: ');
        if (/^q$/i.test(cont)) break;
      }
    }

    ui.clear();
    ui.println('\n✅ Adjective session finished!', 'green');
  }

  private showGate(): void {
    const ready = this.opts.batch.filter(a => this.progress.hasLexicalGate(a.id)).length;
    this.ui.println(`\nLexical ready: ${ready}/${this.opts.batch.length} (need 3 correct each way)`, 'cyan');
  }

  private showStatus(): void {
    this.ui.println('\n=== Warm-up Status ===', 'magenta');
    const header = ['Adj'.padEnd(20), 'it→en'.padEnd(8), 'en→it'.padEnd(8), 'Ready'];
    this.ui.println(header.join('  '), 'cyan');
    for (const a of this.opts.batch) {
      const it2 = this.progress.lexicalCorrect(a.id, 'it2en');
      const en2 = this.progress.lexicalCorrect(a.id, 'en2it');
      const ready = this.progress.hasLexicalGate(a.id) ? '✅' : '—';
      this.ui.println([
        a.lemma.slice(0, 20).padEnd(20),
        `${it2}/3`.padEnd(8),
        `${en2}/3`.padEnd(8),
        ready
      ].join('  '));
    }
  }
}
