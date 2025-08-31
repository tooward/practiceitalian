// repository.ts – data access for verbs
import fs from 'fs';
import path from 'path';
import { Verb } from '../types';

export interface VerbRepository {
  getAll(): Verb[];
}

export class FileVerbRepository implements VerbRepository {
  private verbs: Verb[];

  constructor(filePath?: string) {
    const p = filePath || path.resolve(__dirname, '../../verbs.json');
    const text = fs.readFileSync(p, 'utf8');
    this.verbs = JSON.parse(text) as Verb[];
  }

  getAll(): Verb[] { return this.verbs; }
}
