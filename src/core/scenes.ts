// scenes.ts – concrete scenes for main menu, filter, and session
import { Scene, SceneResult } from './flow';
import { UI } from './ui';
import { App } from './app';
import { Tense } from '../types';

function parseNumber(input: string): number | undefined {
  const n = parseInt(input.trim(), 10);
  return Number.isNaN(n) ? undefined : n;
}

export class MainMenuScene implements Scene {
  key = 'main';
  constructor(private ui: UI) {}

  async run(): Promise<SceneResult> {
    this.ui.clear();
    this.ui.println('\n=== Italian Verb Practice ===\n', 'magenta');
    this.ui.println('1) Present tense');
    this.ui.println('2) Past tense');
    this.ui.println('3) Future tense');
    this.ui.println('4) Quit');
    const ans = await this.ui.prompt('\nSelect an option (1–4): ');
    const n = parseNumber(ans);
    if (!n || n === 4) return { next: undefined };
    const tense: Tense = n === 1 ? 'present' : n === 2 ? 'past' : 'future';
    return { next: 'filter', statePatch: { tense } };
  }
}

export class FilterScene implements Scene {
  key = 'filter';
  constructor(private ui: UI) {}

  async run(_ctx: any, state: Record<string, any>): Promise<SceneResult> {
    this.ui.clear();
    const tense: Tense = state.tense as Tense;
    this.ui.println(`\n${tense.toUpperCase()} – choose verb set:`, 'cyan');
    this.ui.println('1) Regular verbs');
    this.ui.println('2) Irregular verbs');
    this.ui.println('3) Mixed (all verbs)');
    this.ui.println('4) Back');
    const ans = await this.ui.prompt('Select an option (1–4): ');
    const n = parseNumber(ans);
    if (!n || n === 4) return { next: 'main' };
    const filter = n === 1 ? 'regular' : n === 2 ? 'irregular' : 'all';
    return { next: 'session', statePatch: { filter } };
  }
}

export class SessionScene implements Scene {
  key = 'session';
  constructor(private ui: UI, private app: App) {}

  async run(_ctx: any, state: Record<string, any>): Promise<SceneResult> {
    const tense: Tense = state.tense as Tense;
    const filter = (state.filter as 'regular'|'irregular'|'all') || 'all';
    await this.app.run(tense, filter, this.ui);
    // After a session, ask to go back or quit
    const back = await this.ui.prompt('Return to main menu? (Y/n): ');
    if (back.trim() === '' || /^(y|yes)$/i.test(back)) return { next: 'main' };
    return { next: undefined };
  }
}
