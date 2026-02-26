#!/usr/bin/env node
/**
 * Audit: ensures only the external Supabase host appears in source code.
 * Usage: npx tsx scripts/audit-supabase-host.ts
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const EXPECTED_HOST = 'qbwmsarqewxjuwgkdfmg.supabase.co';
const EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'supabase', 'scripts'];

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (IGNORE_DIRS.includes(entry)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walkDir(full));
    else if (EXTENSIONS.some(ext => full.endsWith(ext))) files.push(full);
  }
  return files;
}

const rootDir = join(__dirname, '..');
const srcFiles = walkDir(join(rootDir, 'src'));

const supabaseRefs: { file: string; line: number; text: string }[] = [];
const foreignHosts: typeof supabaseRefs = [];

const SUPABASE_PATTERN = /supabase\.co/gi;
const CREATE_CLIENT = /createClient\s*\(/gi;

for (const filePath of srcFiles) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SUPABASE_PATTERN.test(line)) {
      SUPABASE_PATTERN.lastIndex = 0;
      const ref = { file: relative(rootDir, filePath), line: i + 1, text: line.trim().slice(0, 100) };
      if (line.includes(EXPECTED_HOST)) supabaseRefs.push(ref);
      else foreignHosts.push(ref);
    }
    if (CREATE_CLIENT.test(line)) {
      CREATE_CLIENT.lastIndex = 0;
      const rel = relative(rootDir, filePath);
      if (!rel.includes('integrations/supabase/client.ts')) {
        foreignHosts.push({ file: rel, line: i + 1, text: `⚠️ Extra createClient: ${line.trim().slice(0, 80)}` });
      }
    }
  }
}

console.log(`\n🔍 Supabase Host Audit\n`);
console.log(`✅ References to ${EXPECTED_HOST}: ${supabaseRefs.length}`);
for (const r of supabaseRefs) console.log(`   ${r.file}:${r.line}`);

if (foreignHosts.length === 0) {
  console.log(`\n✅ No foreign Supabase hosts or extra createClient calls found.`);
} else {
  console.log(`\n❌ ${foreignHosts.length} ISSUES FOUND:`);
  for (const r of foreignHosts) {
    console.log(`   ${r.file}:${r.line}`);
    console.log(`   → ${r.text}\n`);
  }
}
