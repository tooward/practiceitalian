import { CategorySelectionScene, FilterScene, MainMenuScene, SessionScene } from '../scenes';
import type { UI } from '../ui';

class StubUI implements UI {
  constructor(private answers: string[]) {}
  clear(): void {}
  print(): void {}
  println(): void {}
  async prompt(__q: string): Promise<string> { return this.answers.shift() ?? ''; }
  async pause(): Promise<void> {}
  close(): void {}
}

class StubDataRepo {
  constructor(private cats: any[], private counts: Record<string, { verbs: number; nouns: number; adjs: number }>) {}
  listCategories() { return this.cats; }
  loadVerbs(__id: string) { return Array.from({ length: this.counts[__id]?.verbs || 0 }, (_i, i) => ({ infinitive: 'v'+i, present: ['a','b','c','d','e','f'], irregular: false })); }
  loadNouns(__id: string) { return []; }
  loadAdjectives(__id: string) { return []; }
}

class StubApp { called: any[] = []; async run(tense: any, filter: any, _ui?: any, categoryId?: string) { this.called.push({ tense, filter, categoryId }); } }

describe('Scenes', () => {
  test('CategorySelectionScene selects a category and proceeds to main', async () => {
    const ui = new StubUI(['1']);
    const data = new StubDataRepo([{ id: 'cook', label: 'Cooking' }], { cook: { verbs: 3, nouns: 0, adjs: 0 } });
    const scene = new CategorySelectionScene(ui as any, data as any);
    const res = await scene.run();
    expect(res?.next).toBe('main');
    expect((res as any).statePatch.categoryId).toBe('cook');
  });

  test('MainMenuScene routes to filter for verbs', async () => {
    const ui = new StubUI(['1']);
    const data = new StubDataRepo([{ id: 'cook', label: 'Cooking' }], { cook: { verbs: 2, nouns: 0, adjs: 0 } });
    const scene = new MainMenuScene(ui as any, data as any);
    const res = await scene.run({}, { categoryId: 'cook', categoryLabel: 'Cooking' });
    expect(res?.next).toBe('filter');
  });

  test('FilterScene sets tense and filter then proceeds to session', async () => {
    // choose tense: 1 (present), then filter: 3 (all)
    const ui = new StubUI(['1', '3']);
    const scene = new FilterScene(ui as any);
    const res = await scene.run({}, {});
    expect(res?.next).toBe('session');
    expect((res as any).statePatch.filter).toBe('all');
  });

  test('SessionScene invokes app.run with state values', async () => {
    const ui = new StubUI(['\n']); // accept default to return to main
    const app = new StubApp();
    const scene = new SessionScene(ui as any, app as any);
    const res = await scene.run({}, { tense: 'present', filter: 'regular', categoryId: 'cook' });
    expect(app.called[0]).toEqual({ tense: 'present', filter: 'regular', categoryId: 'cook' });
    expect(res?.next).toBe('main');
  });
});
