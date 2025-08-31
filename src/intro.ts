// intro.ts – basic Italian conjugation cheat-sheet
import { col } from './util';

export function introPresent(ending: 'are' | 'ere' | 'ire' | null = null): void {
  let intro = col('\n=== Present Tense Basics ===', 'cyan') + '\n\n' +
              col("- All regular verbs end in 'are', 'ere', or 'ire'.", 'yellow') +
              col('\n- To conjugate, drop the _-are_/*-ere*/*-ire* and add:', 'yellow');

  if (ending) {
    intro += showEndingTable(ending);
  } else {
    intro += '\n' + showPresentEndingTable();
  }
  console.log(intro);
}

function showEndingTable(_ending: 'are' | 'ere' | 'ire'): string {
  // For now we reuse the full table output
  return showPresentEndingTable();
}

export function showPresentEndingTable(): string {
  const people = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];
  const suffixes = {
    are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
    ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
    ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono']
  } as const;

  const header = [' ', 'are', 'ere', 'ire'];
  const widths = [8, 6, 6, 6];
  const pad = (txt: string, w: number) => txt.padEnd(w, ' ');

  let out = col('\n=== Present Tense Endings ===\n', 'magenta');
  out += header.map((h, i) => pad(h, widths[i])).join(' ') + '\n';

  people.forEach((p, i) => {
    out += [
      pad(p, widths[0]),
      pad(suffixes.are[i], widths[1]),
      pad(suffixes.ere[i], widths[2]),
      pad(suffixes.ire[i], widths[3])
    ].join(' ') + '\n';
  });

  return out + '\n';
}

export function introImperative(): void {
  console.log(
    col('\n=== Imperative Basics ===', 'cyan') +
    '\n\n' +
    col('The imperative is the “do it!” form, used with tu (singular informal)', 'yellow') +
    col('and voi (plural informal).', 'yellow') +
    col('\n\n' +
      '- For regular verbs, drop the infinitive ending and add:\n' +
      '  • tu: -a  (e.g. parla!)\n' +
      '  • voi: -ate (e.g. parlate!).\n\n' +
      '  For irregular verbs, the forms are often listed as a pair, e.g. andare → va! (tu), andate! (voi).', 'magenta')
  );
}
