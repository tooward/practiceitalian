// intro.js – basic Italian conjugation cheat‑sheet
const { col } = require('./util');

function introPresent(ending = null) {
  // --- The usual explanation -----------------------------------------
  let intro = col('\n=== Present Tense Basics ===', 'cyan') + '\n\n' +
              col('- All regular verbs end in \'are\', \'ere\', or \'ire\'.', 'yellow') +
              col('\n- To conjugate, drop the _-are_/*-ere*/*-ire* and add:', 'yellow');

  // --- If a suffix is supplied, show the demo table -------------------
  if (ending) {
    intro += showEndingTable(ending);      // prints the table
  }
  else {
    intro += '\n' + showPresentEndingTable();
  }

  console.log(intro);
}


/**
 * Build and return a neatly‑aligned table of the present‑tense suffixes
 * for the three standard verb endings (‑are, ‑ere, ‑ire).
 *
 * @returns {string}  The table ready to be printed.
 */
function showPresentEndingTable() {
  // People in the standard order
  const people = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];

  // Suffixes for the three conjugation groups
  const suffixes = {
    are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
    ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
    ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono']
  };

  /* ────────────────────────────────────────────────────────────────
   *  Build a header row and a helper that keeps columns nicely
   *  padded (you can adjust the widths if you wish).
   * ──────────────────────────────────────────────────────────────── */
  const header = [' ', 'are', 'ere', 'ire'];
  const widths = [8, 6, 6, 6];                     // minimal widths
  const pad = (txt, w) => txt.padEnd(w, ' ');

  /* ────────────────────────────────────────────────────────────────
   *  Compose the final string
   * ──────────────────────────────────────────────────────────────── */
  let out = col('\n=== Present Tense Endings ===\n', 'magenta');

  // header
  out += header.map((h, i) => pad(h, widths[i])).join(' ') + '\n';

  // rows – one per person
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

function introImperative() {
  console.log(
    col('\n=== Imperative Basics ===', 'cyan') +
    '\n\n' +
    col('The imperative is the “do it!” form, used with *tu* (singular informal)', 'yellow') +
    col('and *voi* (plural informal).', 'yellow') +
    col('\n\n' +
      '- For regular verbs, drop the infinitive ending and add:\n' +
      '  • tu: ‑a  (e.g. *parla!*)\n' +
      '  • voi: ‑ate (e.g. *parlate!*).\n\n' +
      '  For irregular verbs, the forms are often listed as a pair, e.g. *andare* → *va!* (tu), *andate!* (voi).', 'magenta')
  );
}

module.exports = { introPresent, introImperative };