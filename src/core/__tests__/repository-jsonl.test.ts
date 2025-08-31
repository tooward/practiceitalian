import path from 'path';
import { FileVerbRepository } from '../repository';

describe('FileVerbRepository JSONL support', () => {
  test('loads JSONL file', () => {
    const p = path.resolve(__dirname, '../../../data/verbs_sample.jsonl');
    const repo = new FileVerbRepository(p);
    const verbs = repo.getAll();
    expect(Array.isArray(verbs)).toBe(true);
    expect(verbs.length).toBe(2);
    expect(verbs[0].infinitive).toBe('parlare');
    expect(verbs[1].infinitive).toBe('andare');
  });
});
