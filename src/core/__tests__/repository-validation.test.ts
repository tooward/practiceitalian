import path from 'path';
import { FileVerbRepository } from '../repository';

describe('FileVerbRepository schema validation', () => {
  test('throws on invalid verb object', () => {
    const p = path.resolve(__dirname, '../../../data/verbs_invalid.jsonl');
    expect(() => new FileVerbRepository(p)).toThrow(/Schema validation failed/);
  });
});
