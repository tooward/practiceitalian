// adjProgress.ts – progress tracking for adjective practice
import fs from 'fs';
import path from 'path';

export type LexDir = 'it2en' | 'en2it';
export type AdjFormKey = 'ms' | 'mp' | 'fs' | 'fp';

export interface CounterCell { attempts: number; correct: number }

export interface AdjectiveProgress {
  lex?: { it2en?: CounterCell; en2it?: CounterCell };
  forms?: Partial<Record<AdjFormKey, CounterCell>>;
}

export type AdjectiveProgressMap = Record<string, AdjectiveProgress>;

export interface AdjectiveProgressStore {
  load(): AdjectiveProgressMap;
  updateLexical(id: string, dir: LexDir, correct: boolean): void;
  lexicalCorrect(id: string, dir: LexDir): number;
  hasLexicalGate(id: string, required?: number): boolean;
  updateForm(id: string, form: AdjFormKey, correct: boolean): void;
  formCorrect(id: string, form: AdjFormKey): number;
}

export class JsonAdjectiveProgressStore implements AdjectiveProgressStore {
  private filepath: string;
  private cache: { adjectives?: AdjectiveProgressMap } | null = null;

  constructor(filePath?: string) {
    this.filepath = filePath || path.resolve(process.cwd(), 'progress.json');
  }

  private readAll(): { adjectives?: AdjectiveProgressMap } {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(this.filepath)) {
        const text = fs.readFileSync(this.filepath, 'utf8') || '{}';
        this.cache = JSON.parse(text);
      } else {
        this.cache = {};
      }
    } catch {
      this.cache = {};
    }
    return this.cache!;
  }

  private saveAll(): void {
    fs.writeFileSync(this.filepath, JSON.stringify(this.cache ?? {}, null, 2), 'utf8');
  }

  load(): AdjectiveProgressMap {
    const all = this.readAll();
    all.adjectives ||= {};
    return all.adjectives;
  }

  private cell(obj: any, pathKeys: string[]): CounterCell {
    let cur = obj;
    for (const k of pathKeys.slice(0, -1)) {
      cur[k] ||= {};
      cur = cur[k];
    }
    const leaf = pathKeys[pathKeys.length - 1];
    cur[leaf] ||= { attempts: 0, correct: 0 } as CounterCell;
    return cur[leaf];
  }

  updateLexical(id: string, dir: LexDir, correct: boolean): void {
    const map = this.load();
    const cell = this.cell(map, [id, 'lex', dir]);
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.saveAll();
  }

  lexicalCorrect(id: string, dir: LexDir): number {
    const map = this.load();
    return map[id]?.lex?.[dir]?.correct ?? 0;
  }

  hasLexicalGate(id: string, required = 3): boolean {
    const map = this.load();
    const lex = map[id]?.lex;
    return (lex?.it2en?.correct ?? 0) >= required && (lex?.en2it?.correct ?? 0) >= required;
  }

  updateForm(id: string, form: AdjFormKey, correct: boolean): void {
    const map = this.load();
    const cell = this.cell(map, [id, 'forms', form]);
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.saveAll();
  }

  formCorrect(id: string, form: AdjFormKey): number {
    const map = this.load();
    return map[id]?.forms?.[form]?.correct ?? 0;
  }
}
