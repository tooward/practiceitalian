// app.ts – OO bootstrap example that mirrors current flow
import { ConsoleUI, UI } from './ui';
import { FileVerbRepository } from './repository';
import { JsonProgressStore } from './progress';
import { Scheduler } from './scheduler';
import { ConjugationExercise, InfinitiveTypingExercise, TranslationExercise } from './exercises';
import { Session } from './session';
import { Tense } from '../types';

export class App {
  async run(
    tense: Tense = 'present',
    filter: 'regular'|'irregular'|'all' = 'all',
    ui?: UI
  ): Promise<void> {
    const ownUI = !ui;
    ui = ui || new ConsoleUI();
    const repo = new FileVerbRepository();
    const progress = new JsonProgressStore();
    const scheduler = new Scheduler(progress);

    const verbs = repo.getAll();
    const batch = scheduler.pickBatch(verbs, { tense, filter, batchSize: 10 });

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
}

// Optional CLI entry for testing via ts-node: ts-node src/core/app.ts
if (require.main === module) {
  const argTense = (process.argv[2] as Tense) || 'present';
  const argFilter = (process.argv[3] as 'regular'|'irregular'|'all') || 'all';
  new App().run(argTense, argFilter);
}
