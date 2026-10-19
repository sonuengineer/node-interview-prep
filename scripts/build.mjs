// Builds the static site: copies content/*.md into docs/md and writes docs/parts.json
// (file, title, line count, "##" section titles outside code fences).
// Run: node scripts/build.mjs
import { readFile, readdir, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'docs');

await rm(path.join(OUT, 'md'), { recursive: true, force: true });
await mkdir(path.join(OUT, 'md'), { recursive: true });

const names = (await readdir(SRC)).filter((n) => /^\d\d_.+\.md$/.test(n)).sort();
const parts = [];
for (const file of names) {
  const text = await readFile(path.join(SRC, file), 'utf8');
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let title = file;
  const sections = [];
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (title === file && /^# /.test(line)) title = line.replace(/^#\s+/, '').trim();
    if (/^## /.test(line)) sections.push(line.replace(/^##\s+/, '').trim());
  }
  parts.push({ file, title, lines: lines.length, sections });
  await copyFile(path.join(SRC, file), path.join(OUT, 'md', file));
}
await writeFile(path.join(OUT, 'parts.json'), JSON.stringify(parts));
console.log(`Built ${parts.length} parts into docs/`);
