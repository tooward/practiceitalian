// nounProgress.ts – progress tracking for noun practice
import fs from 'fs';
import path from 'path';

export type NounFormKey = 'sg' | 'pl';
export type LexDir = 'it2en' | 'en2it';

export interface CounterCell { attempts: number; correct: number }

export interface NounProgress {
  lex?: { it2en?: CounterCell; en2it?: CounterCell };
  forms?: { sg?: CounterCell; pl?: CounterCell };
  gender?: CounterCell;
}

export type NounProgressMap = Record<string, NounProgress>;

export interface NounProgressStore {
  load(): NounProgressMap;
  updateLexical(id: string, dir: LexDir, correct: boolean): void;
  lexicalCorrect(id: string, dir: LexDir): number;
  hasLexicalGate(id: string, required?: number): boolean;
  updateForm(id: string, form: NounFormKey, correct: boolean): void;
  formCorrect(id: string, form: NounFormKey): number;
  updateGender(id: string, correct: boolean): void;
  genderCorrect(id: string): number;
}

export class JsonNounProgressStore implements NounProgressStore {
  private filepath: string;
  private cache: { nouns?: NounProgressMap } | null = null;

  constructor(filePath?: string) {
    this.filepath = filePath || path.resolve(process.cwd(), 'progress.json');
  }

  private readAll(): { nouns?: NounProgressMap } {
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

  load(): NounProgressMap {
    const all = this.readAll();
    all.nouns ||= {};
    return all.nouns;
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
    const nouns = this.load();
    const cell = this.cell(nouns, [id, 'lex', dir]);
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.saveAll();
  }

  lexicalCorrect(id: string, dir: LexDir): number {
    const nouns = this.load();
    return nouns[id]?.lex?.[dir]?.correct ?? 0;
  }

  hasLexicalGate(id: string, required = 3): boolean {
    const nouns = this.load();
    const lex = nouns[id]?.lex;
    return (lex?.it2en?.correct ?? 0) >= required && (lex?.en2it?.correct ?? 0) >= required;
  }

  updateForm(id: string, form: NounFormKey, correct: boolean): void {
    const nouns = this.load();
    const cell = this.cell(nouns, [id, 'forms', form]);
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.saveAll();
  }

  formCorrect(id: string, form: NounFormKey): number {
    const nouns = this.load();
    return nouns[id]?.forms?.[form]?.correct ?? 0;
  }

  updateGender(id: string, correct: boolean): void {
    const nouns = this.load();
    const cell = this.cell(nouns, [id, 'gender']);
    cell.attempts += 1;
    if (correct) cell.correct += 1;
    this.saveAll();
  }

  genderCorrect(id: string): number {
    const nouns = this.load();
    return nouns[id]?.gender?.correct ?? 0;
  }
}
