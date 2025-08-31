// repository.ts – data access for themed datasets (verbs now, nouns/adjectives soon)
import fs from 'fs';
import path from 'path';
import { Adjective, CategoryRef, Noun, Verb } from '../types';

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
        const arr = JSON.parse(text) as Verb[];
        merged.push(...arr);
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
        const arr = JSON.parse(text) as Noun[];
        merged.push(...arr);
      } catch {
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
        const arr = JSON.parse(text) as Adjective[];
        merged.push(...arr);
      } catch {
        // ignore errors for now
      }
    }
    return merged;
  }
}
