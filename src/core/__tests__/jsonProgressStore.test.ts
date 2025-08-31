import { JsonProgressStore } from '../progress';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmpFile(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return path.join(dir, 'progress.json');
}

describe('JsonProgressStore persistence and recovery', () => {
  test('saves and reloads updates across instances', () => {
    const file = tmpFile('jps-');
    const a = new JsonProgressStore(file);
    a.update('parlare', 'present', 0, true);
    a.updateLexical('parlare', 'it2en', true);

    // create a new instance pointed at the same file and verify persisted data
    const b = new JsonProgressStore(file);
    expect(b.getAttempts('parlare', 'present')).toBeGreaterThanOrEqual(1);
    expect(b.lexicalCorrect('parlare', 'it2en')).toBe(1);
  });

  test('recovers from malformed JSON by falling back to empty store', () => {
    const file = tmpFile('jps-');
    // write malformed JSON
    fs.writeFileSync(file, '{ this is : not json', 'utf8');
    const p = new JsonProgressStore(file);
    // should not throw and should act like empty
    expect(p.getAttempts('foo', 'present')).toBe(0);
    // can subsequently write and persist cleanly
    p.update('foo', 'present', 0, true);
    const p2 = new JsonProgressStore(file);
    expect(p2.getAttempts('foo', 'present')).toBeGreaterThanOrEqual(1);
  });
});
