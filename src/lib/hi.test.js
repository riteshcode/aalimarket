import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import HI from './hi';

// Collect every t('...') used in shopper-facing code (admin stays in English)
function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'admin' ? [] : sourceFiles(path);
    return /\.jsx?$/.test(name) && !name.endsWith('.test.js') ? [path] : [];
  });
}

const srcDir = join(__dirname, '..');
const usedKeys = new Set();
sourceFiles(srcDir).forEach((file) => {
  const code = readFileSync(file, 'utf8');
  for (const match of code.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
    if (match[1] !== '...') usedKeys.add(match[1]);
  }
});

describe('Hindi translations', () => {
  it('has a Hindi version of every UI text used in the store', () => {
    const missing = [...usedKeys].filter((key) => !HI[key]);
    expect(missing).toEqual([]);
  });

  it('keeps every {placeholder} from the English text', () => {
    const broken = Object.entries(HI).filter(([en, hi]) => {
      const placeholders = en.match(/\{\w+\}/g) || [];
      return placeholders.some((p) => !hi.includes(p));
    });
    expect(broken).toEqual([]);
  });
});
