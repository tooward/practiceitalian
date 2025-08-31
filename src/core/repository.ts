// repository.ts – data access for themed datasets (verbs now, nouns/adjectives soon)
import fs from 'fs';
import path from 'path';
import { Adjective, CategoryRef, Noun, Verb } from '../types';
import Ajv from 'ajv';
// ajv-formats has no ESM default types in some TS setups; require and cast to any is safe here
const addFormats = require('ajv-formats') as any;

export interface VerbRepository {
  getAll(): Verb[];
}

export class FileVerbRepository implements VerbRepository {
  private verbs: Verb[];

  constructor(filePath?: string) {
    const p = filePath || path.resolve(__dirname, '../../verbs.json');
  const text = fs.readFileSync(p, 'utf8');
  const parsed = parseFileAsArray(text, p);
  if (Array.isArray(parsed)) {
    parsed.forEach((it, i) => validateWithSchema(it, 'verb', `${p}:${i + 1}`));
    this.verbs = parsed as Verb[];
  } else {
    validateWithSchema(parsed, 'verb', p);
    this.verbs = [parsed as Verb];
  }
  }

  getAll(): Verb[] { return this.verbs; }
}

// ---------- Themes and category-aware repository ----------------------------

export interface ThemesCatalog { themes: CategoryRef[] }

export class ThemesRepository {
  private catalogPath: string;
  private catalog: ThemesCatalog;

  constructor(catalogPath?: string) {
    this.catalogPath = catalogPath || path.resolve(__dirname, '../../data/themes.json');
    const raw = fs.readFileSync(this.catalogPath, 'utf8');
    this.catalog = JSON.parse(raw) as ThemesCatalog;
  }

  listCategories(): CategoryRef[] { return this.catalog.themes; }

  getCategory(id: string): CategoryRef | undefined {
    return this.catalog.themes.find(t => t.id === id);
  }
}

export class DataRepository {
  constructor(private themes: ThemesRepository = new ThemesRepository()) {}

  listCategories(): CategoryRef[] { return this.themes.listCategories(); }

  loadVerbs(categoryId: string): Verb[] {
    const cat = this.themes.getCategory(categoryId);
    const files = cat?.files?.verbs ?? [];
    const resolved: string[] = files.map(f => path.resolve(__dirname, '../../', f));
    const merged: Verb[] = [];
    for (const f of resolved) {
      if (!fs.existsSync(f)) continue;
      try {
        const text = fs.readFileSync(f, 'utf8');
        const arr = parseFileAsArray(text, f) as Verb[];
        if (Array.isArray(arr)) {
          arr.forEach((it, i) => validateWithSchema(it, 'verb', `${f}:${i + 1}`));
          merged.push(...arr);
        }
      } catch {
        // ignore file-level errors for now
      }
    }
    return merged;
  }

  loadNouns(categoryId: string): Noun[] {
    const cat = this.themes.getCategory(categoryId);
    const files = cat?.files?.nouns ?? [];
    const resolved: string[] = files.map(f => path.resolve(__dirname, '../../', f));
    const merged: Noun[] = [];
    for (const f of resolved) {
      if (!fs.existsSync(f)) continue;
      try {
        const text = fs.readFileSync(f, 'utf8');
        const arr = parseFileAsArray(text, f) as Noun[];
        if (Array.isArray(arr)) {
          arr.forEach((it, i) => validateWithSchema(it, 'noun', `${f}:${i + 1}`));
          merged.push(...arr);
        }
      } catch (e) {
        // ignore errors for now
      }
    }
    return merged;
  }

  loadAdjectives(categoryId: string): Adjective[] {
    const cat = this.themes.getCategory(categoryId);
    const files = cat?.files?.adjectives ?? [];
    const resolved: string[] = files.map(f => path.resolve(__dirname, '../../', f));
    const merged: Adjective[] = [];
    for (const f of resolved) {
      if (!fs.existsSync(f)) continue;
      try {
        const text = fs.readFileSync(f, 'utf8');
        const arr = parseFileAsArray(text, f) as Adjective[];
        if (Array.isArray(arr)) {
          arr.forEach((it, i) => validateWithSchema(it, 'adj', `${f}:${i + 1}`));
          merged.push(...arr);
        }
      } catch (e) {
        // ignore errors for now
      }
    }
    return merged;
  }
}

// ---------- Schema validation setup ---------------------------------------
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load noun/adjective schemas if present in data/
let nounSchema: object | null = null;
let adjectiveSchema: object | null = null;
try {
  const nounRaw = fs.readFileSync(path.resolve(__dirname, '../../data/noun.schema.json'), 'utf8');
  nounSchema = JSON.parse(nounRaw);
} catch { /* ignore */ }
try {
  const adjRaw = fs.readFileSync(path.resolve(__dirname, '../../data/adjective.schema.json'), 'utf8');
  adjectiveSchema = JSON.parse(adjRaw);
} catch { /* ignore */ }

// Minimal verb schema inline
const verbSchema = {
  type: 'object',
  required: ['infinitive'],
  properties: {
    infinitive: { type: 'string' },
    translation: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    irregular: { type: 'boolean' },
    present: { type: 'array' },
    past: { type: 'array' },
    future: { type: 'array' }
  }
};

function validateWithSchema(obj: any, kind: 'verb'|'noun'|'adj', source?: string): void {
  let schema: any = null;
  if (kind === 'verb') schema = verbSchema;
  if (kind === 'noun') schema = nounSchema;
  if (kind === 'adj') schema = adjectiveSchema;
  if (!schema) return; // no schema available => skip

  const validator = ajv.compile(schema as any);
  const ok = validator(obj) as boolean;
  if (!ok) {
    const errs = (validator.errors || []) as any[];
    const msg = errs.map(e => `${e.instancePath ?? e.dataPath ?? '<path>'} ${e.message ?? ''}`).join('; ');
    throw new Error(`Schema validation failed for ${kind} in ${source || '<buffer>'}: ${msg}`);
  }
}

/**
 * Try to parse a file that may be either a JSON array or a JSONL (one JSON object per line).
 * Returns an array when possible, or the parsed value from JSON.parse as a fallback.
 */
function parseFileAsArray(text: string, filePath?: string): any {
  // Fast-path: empty file
  if (!text || !text.trim()) return [];

  try {
    const parsed = JSON.parse(text);
    // If it's an array, return directly. If it's an object, wrap in array.
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch (err) {
    // Fallback to JSONL: parse each non-empty line as JSON
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out: any[] = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line));
      } catch (e) {
        // If a line fails to parse, throw with some context
        throw new Error(`Failed to parse JSONL line in ${filePath || '<buffer>'}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return out;
  }
}
