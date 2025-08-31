import { JsonProgressStore } from '../progress';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmpFile(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return path.join(dir, 'progress.json');
}

describe('JsonProgressStore', () => {
  test('updates and computes mastery with attempt guard', () => {
    const file = tmpFile('prog-');
    const p = new JsonProgressStore(file);
    p.update('parlare', 'present', 0, true);
    p.update('parlare', 'present', 1, false);
    expect(p.getAttempts('parlare', 'present')).toBe(2);
    // mastery requires >= 3 attempts, so 0 until then
    expect(p.mastery('parlare', 'present')).toBe(0);
    p.update('parlare', 'present', 2, true);
    expect(p.mastery('parlare', 'present')).toBeCloseTo(2 / 3);
  });

  test('lexical gate requires 3 correct each direction', () => {
    const file = tmpFile('prog-');
    const p = new JsonProgressStore(file);
    p.updateLexical('andare', 'it2en', true);
    p.updateLexical('andare', 'it2en', true);
  p.updateLexical('andare', 'it2en', true);
    p.updateLexical('andare', 'en2it', true);
    expect(p.hasLexicalGate('andare')).toBe(false);
    p.updateLexical('andare', 'en2it', true);
    p.updateLexical('andare', 'en2it', true);
    expect(p.hasLexicalGate('andare')).toBe(true);
  });
});
