// Chạy: node scripts/render.mjs [đường-dẫn-notes.json] [đường-dẫn-ảnh-ra]
// Tạo wallpaper-today.png từ notes.json, chọn ngẫu nhiên theo ngày (giờ Việt Nam).
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { drawWallpaper, pickNotes, mulberry32, hashString, todayVN } from '../lib/wallpaper.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const notesPath = process.argv[2] || path.join(root, 'notes.json');
const outPath = process.argv[3] || path.join(root, 'wallpaper-today.png');

GlobalFonts.registerFromPath(path.join(root, 'fonts/patrick-hand-latin-400-normal.woff'), 'PH-latin');
GlobalFonts.registerFromPath(path.join(root, 'fonts/patrick-hand-latin-ext-400-normal.woff'), 'PH-latinext');
GlobalFonts.registerFromPath(path.join(root, 'fonts/patrick-hand-vietnamese-400-normal.woff'), 'PH-viet');

const data = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, 'utf8')) : { notes: [], settings: {} };
const s = { theme: 'dark', count: 3, width: 1206, height: 2622, tags: [], ...(data.settings || {}) };

const date = process.env.WALLPAPER_DATE || todayVN();
const seedStr = date + '|' + (data.notes || []).length;
const rng = mulberry32(hashString(seedStr));
const picks = pickNotes(data.notes || [], s.count, rng, s.tags);

const canvas = createCanvas(s.width, s.height);
const ctx = canvas.getContext('2d');
drawWallpaper(ctx, s.width, s.height, picks, {
  theme: s.theme,
  fontFamily: '"PH-viet", "PH-latin", "PH-latinext", sans-serif',
  seedStr,
});

writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`OK ${date}: ${picks.length} ghi chú -> ${outPath} (${s.width}x${s.height})`);
