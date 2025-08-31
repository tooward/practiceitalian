// scenes.ts – concrete scenes for category selection and practice menus
import { Scene, SceneResult } from './flow';
import { UI } from './ui';
import { App } from './app';
import { Tense } from '../types';
import { DataRepository, ThemesRepository } from './repository';
import { Adjective, Noun } from '../types';
import { NounSession } from './nouns.session';
import { AdjectiveSession } from './adjectives.session';

function parseNumber(input: string): number | undefined {
  const n = parseInt(input.trim(), 10);
  return Number.isNaN(n) ? undefined : n;
}

export class CategorySelectionScene implements Scene {
  key = 'category';
  constructor(private ui: UI, private data: DataRepository = new DataRepository(new ThemesRepository())) {}

  async run(): Promise<SceneResult> {
    this.ui.clear();
    this.ui.println('\n=== Choose a Category ===\n', 'magenta');
    const cats = this.data.listCategories();
    cats.forEach((c, i) => this.ui.println(`${i + 1}) ${c.label} (${c.id})`));
    this.ui.println(`${cats.length + 1}) Quit`);
    const ans = await this.ui.prompt(`\nSelect (1–${cats.length + 1}): `);
    const n = parseNumber(ans);
    if (!n || n === cats.length + 1) return { next: undefined };
    const selected = cats[n - 1];
    if (!selected) return { next: 'category' };
    return { next: 'main', statePatch: { categoryId: selected.id, categoryLabel: selected.label } };
  }
}

export class MainMenuScene implements Scene {
  key = 'main';
  constructor(private ui: UI, private data: DataRepository = new DataRepository(new ThemesRepository())) {}

  async run(_ctx: any, state: Record<string, any>): Promise<SceneResult> {
    const categoryId = state.categoryId as string | undefined;
    if (!categoryId) return { next: 'category' };
    this.ui.clear();
    this.ui.println(`\n=== Practice – ${state.categoryLabel || categoryId} ===\n`, 'magenta');
    // Show availability hints
    const verbsCount = this.data.loadVerbs(categoryId).length;
    const nounsCount = this.data.loadNouns(categoryId).length;
    const adjsCount = this.data.loadAdjectives(categoryId).length;
    const mk = (label: string, count: number) => `${label}${count ? ` (${count})` : ' – no data'}`;
    this.ui.println('1) ' + mk('Practice verbs', verbsCount));
    this.ui.println('2) ' + mk('Practice nouns', nounsCount));
    this.ui.println('3) ' + mk('Practice adjectives', adjsCount));
    this.ui.println('4) Change category');
    this.ui.println('5) Quit');
    const ans = await this.ui.prompt('\nSelect an option (1–5): ');
    const n = parseNumber(ans);
    if (!n || n === 5) return { next: undefined };
    if (n === 4) return { next: 'category' };
    if (n === 1) return { next: 'filter' };
    if (n === 2) return { next: 'nouns' };
    if (n === 3) return { next: 'adjectives' };
    return { next: 'main' };
  }
}

export class FilterScene implements Scene {
  key = 'filter';
  constructor(private ui: UI) {}

  async run(_ctx: any, state: Record<string, any>): Promise<SceneResult> {
    this.ui.clear();
    let tense: Tense | undefined = state.tense as Tense | undefined;
    if (!tense) {
      this.ui.println(`\nChoose tense:`, 'cyan');
      this.ui.println('1) Present');
      this.ui.println('2) Past');
      this.ui.println('3) Future');
      this.ui.println('4) Back');
      const tAns = await this.ui.prompt('Select an option (1–4): ');
      const t = parseNumber(tAns);
      if (!t || t === 4) return { next: 'main' };
      tense = t === 1 ? 'present' : t === 2 ? 'past' : 'future';
      state.tense = tense; // persist for session scene
      this.ui.clear();
    }
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
  await this.app.run(tense, filter, this.ui, state.categoryId);
    // After a session, ask to go back or quit
    const back = await this.ui.prompt('Return to main menu? (Y/n): ');
    if (back.trim() === '' || /^(y|yes)$/i.test(back)) return { next: 'main' };
    return { next: undefined };
  }
}

export class WarmupOnlyScene implements Scene {
  key = 'warmup';
  constructor(private ui: UI, private app: App) {}

  async run(): Promise<SceneResult> {
    // Use default tense 'present' for warm-up; app will run warm-up-only session
    await this.app.runWarmupOnly(this.ui);
    const back = await this.ui.prompt('Return to main menu? (Y/n): ');
    if (back.trim() === '' || /^(y|yes)$/i.test(back)) return { next: 'main' };
    return { next: undefined };
  }
}

// Placeholder scenes for nouns/adjectives practice – to be implemented next
export class NounsPracticeScene implements Scene {
  key = 'nouns';
  private data = new DataRepository(new ThemesRepository());
  constructor(private ui: UI) {}
  async run(_ctx: any, state: Record<string, any>): Promise<SceneResult> {
    const categoryId = state.categoryId as string | undefined;
    if (!categoryId) return { next: 'category' };
    const nouns = this.data.loadNouns(categoryId);
    if (!nouns.length) {
      this.ui.println('\nNo noun data for this category.');
      await this.ui.pause();
      return { next: 'main' };
    }
    const batch: Noun[] = nouns.slice(0, Math.min(10, nouns.length));
    const session = new NounSession({ title: `Nouns – ${state.categoryLabel || categoryId}`, batch }, this.ui);
    await session.run();
    const back = await this.ui.prompt('Return to main menu? (Y/n): ');
    if (back.trim() === '' || /^(y|yes)$/i.test(back)) return { next: 'main' };
    return { next: undefined };
  }
}

export class AdjectivesPracticeScene implements Scene {
  key = 'adjectives';
  private data = new DataRepository(new ThemesRepository());
  constructor(private ui: UI) {}
  async run(_ctx: any, state: Record<string, any>): Promise<SceneResult> {
    const categoryId = state.categoryId as string | undefined;
    if (!categoryId) return { next: 'category' };
    const adjs = this.data.loadAdjectives(categoryId);
    if (!adjs.length) {
      this.ui.println('\nNo adjective data for this category.');
      await this.ui.pause();
      return { next: 'main' };
    }
    const batch: Adjective[] = adjs.slice(0, Math.min(10, adjs.length));
    const session = new AdjectiveSession({ title: `Adjectives – ${state.categoryLabel || categoryId}`, batch }, this.ui);
    await session.run();
    const back = await this.ui.prompt('Return to main menu? (Y/n): ');
    if (back.trim() === '' || /^(y|yes)$/i.test(back)) return { next: 'main' };
    return { next: undefined };
  }
}
