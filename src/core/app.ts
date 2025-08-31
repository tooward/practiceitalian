// app.ts – OO bootstrap example that mirrors current flow
import { ConsoleUI, UI } from './ui';
import { FileVerbRepository } from './repository';
import { JsonProgressStore } from './progress';
import { Scheduler } from './scheduler';
import { ConjugationExercise, InfinitiveTypingExercise, TranslationExercise } from './exercises';
import { Session } from './session';
import { Tense } from '../types';
import { FlowRunner } from './flow';
import { AdjectivesPracticeScene, CategorySelectionScene, FilterScene, MainMenuScene, NounsPracticeScene, SessionScene, WarmupOnlyScene } from './scenes';
import { DataRepository, ThemesRepository } from './repository';

export class App {
  async run(
    tense: Tense = 'present',
    filter: 'regular'|'irregular'|'all' = 'all',
  ui?: UI,
  categoryId?: string
  ): Promise<void> {
    const ownUI = !ui;
    ui = ui || new ConsoleUI();
  const dataRepo = new DataRepository(new ThemesRepository());
  const themedVerbs = categoryId ? dataRepo.loadVerbs(categoryId) : [];
  const repo = themedVerbs.length ? { getAll: () => themedVerbs } as FileVerbRepository : new FileVerbRepository();
    const progress = new JsonProgressStore();
    const scheduler = new Scheduler(progress);

    const verbs = repo.getAll();
  const batch = scheduler.pickBatch(verbs, { tense, filter, batchSize: 10, preferLexicalAttempts: true });

    const exercises = [
      new InfinitiveTypingExercise(),
      new TranslationExercise(),
      new ConjugationExercise(),
    ];

  const session = new Session({
      title: `${tense.toUpperCase()} Tense – ${filter}`,
      batch,
      exercises,
      context: { ui, progress, tense },
    });

  await session.run();

  if (ownUI) ui.close();
  }

  // Optional: run a full Flow/Scene driven app
  async runFlow(ui?: UI): Promise<void> {
    const ownUI = !ui;
    ui = ui || new ConsoleUI();
    const runner = new FlowRunner({ ui });
    runner
      .register('category', () => new CategorySelectionScene(ui as UI))
      .register('main', () => new MainMenuScene(ui as UI))
      .register('filter', () => new FilterScene(ui as UI))
      .register('session', () => new SessionScene(ui as UI, this))
      .register('warmup', () => new WarmupOnlyScene(ui as UI, this))
      .register('nouns', () => new NounsPracticeScene(ui as UI))
      .register('adjectives', () => new AdjectivesPracticeScene(ui as UI));
    await runner.start('category');
    if (ownUI) ui.close();
  }

  async runWarmupOnly(ui?: UI): Promise<void> {
    const ownUI = !ui;
    ui = ui || new ConsoleUI();
  const repo = new FileVerbRepository();
    const progress = new JsonProgressStore();
    const scheduler = new Scheduler(progress);

    const verbs = repo.getAll();
  const batch = scheduler.pickBatch(verbs, { tense: 'present', filter: 'all', batchSize: 10, preferLexicalAttempts: true });

    const exercises = [
      new InfinitiveTypingExercise(),
      new TranslationExercise(),
      // No ConjugationExercise here
    ];

    const session = new Session({
      title: `Infinitive Warm-up` ,
      batch,
      exercises,
      context: { ui, progress, tense: 'present' },
    });

    await session.run();
    if (ownUI) ui.close();
  }
}

// Optional CLI entry for testing via ts-node: ts-node src/core/app.ts
if (require.main === module) {
  const mode = process.argv[2];
  if (mode === 'flow') {
    new App().runFlow();
  } else {
    const argTense = (process.argv[2] as Tense) || 'present';
    const argFilter = (process.argv[3] as 'regular'|'irregular'|'all') || 'all';
    new App().run(argTense, argFilter);
  }
}
