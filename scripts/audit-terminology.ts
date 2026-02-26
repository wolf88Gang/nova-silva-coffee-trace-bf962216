#!/usr/bin/env node
/**
 * Terminology Audit Script
 * Scans frontend source files for coop-centric terminology that should be replaced.
 *
 * Usage: npx tsx scripts/audit-terminology.ts
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SEARCH_TERMS = [
  // Strings that should NOT appear in visible UI (OK in comments, routes, table names)
  { pattern: /['"`]Dashboard Cooperativa['"`]/gi, label: 'Hardcoded "Dashboard Cooperativa"' },
  { pattern: /['"`]Panel Cooperativa['"`]/gi, label: 'Hardcoded "Panel Cooperativa"' },
  { pattern: /['"`]Config(?:uración)? Cooperativa['"`]/gi, label: 'Hardcoded "Config Cooperativa"' },
  { pattern: /['"`]Gestión de cooperativa['"`]/gi, label: 'Hardcoded "Gestión de cooperativa"' },
  { pattern: /['"`]Socios de la cooperativa['"`]/gi, label: 'Hardcoded "Socios de la cooperativa"' },
  { pattern: /['"`]Entregas de socios['"`]/gi, label: 'Hardcoded "Entregas de socios"' },
  { pattern: /['"`]Nuevo productor['"`]/gi, label: 'Hardcoded "Nuevo productor" (should be dynamic)' },
  { pattern: /['"`]Registrar productor['"`]/gi, label: 'Hardcoded "Registrar productor"' },
  { pattern: /['"`]Productores['"`]/gi, label: 'Hardcoded "Productores" label (should use getActorsLabel)' },
  { pattern: /['"`]Mis Parcelas['"`]/gi, label: 'Hardcoded "Mis Parcelas"' },
  { pattern: /['"`]Mi Finca['"`]/gi, label: 'Hardcoded "Mi Finca"' },
];

const EXTENSIONS = ['.tsx', '.ts'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'supabase', 'scripts'];
const IGNORE_FILES = ['terminology.ts', 'org-terminology.ts', 'audit-terminology.ts', 'demo-data.ts'];

interface Match {
  file: string;
  line: number;
  label: string;
  text: string;
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (IGNORE_DIRS.includes(entry)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walkDir(full));
    else if (EXTENSIONS.some(ext => full.endsWith(ext)) && !IGNORE_FILES.some(f => full.endsWith(f))) {
      files.push(full);
    }
  }
  return files;
}

const rootDir = join(__dirname, '..');
const srcFiles = walkDir(join(rootDir, 'src'));
const matches: Match[] = [];

for (const filePath of srcFiles) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const term of SEARCH_TERMS) {
      if (term.pattern.test(lines[i])) {
        matches.push({
          file: relative(rootDir, filePath),
          line: i + 1,
          label: term.label,
          text: lines[i].trim().slice(0, 80),
        });
      }
      // Reset lastIndex for global regex
      term.pattern.lastIndex = 0;
    }
  }
}

console.log(`\n🔍 Terminology Audit — ${matches.length} potential issues found\n`);

if (matches.length === 0) {
  console.log('✅ No coop-centric hardcoded strings detected!');
} else {
  for (const m of matches) {
    console.log(`  ${m.file}:${m.line}`);
    console.log(`    ⚠️  ${m.label}`);
    console.log(`    → ${m.text}\n`);
  }
}
