// Module dùng chung cho trình duyệt (xem trước) và Node (render hằng ngày).
// Chỉ cần một CanvasRenderingContext2D tương thích.

export const PALETTE = ['#fff1a6', '#ffd3df', '#c8efd3', '#cde5ff', '#ffdfb5', '#e4d3ff'];

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ngày theo múi giờ Việt Nam, dạng YYYY-MM-DD
export function todayVN(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Chọn ngẫu nhiên có seed: cùng seed thì cùng kết quả
export function pickNotes(notes, count, rng, tagFilter = [], maxChars = 280) {
  let pool = notes.filter((n) => n && n.text && n.text.trim());
  if (tagFilter && tagFilter.length) {
    const want = new Set(tagFilter.map((t) => t.toLowerCase()));
    const filtered = pool.filter((n) => (n.tags || []).some((t) => want.has(String(t).toLowerCase())));
    if (filtered.length) pool = filtered;
  }
  // ưu tiên ghi chú không quá dài, nhưng vẫn dùng ghi chú dài nếu không đủ
  const short = pool.filter((n) => n.text.length <= maxChars);
  const long = pool.filter((n) => n.text.length > maxChars);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const ordered = shuffle(short).concat(shuffle(long));
  return ordered.slice(0, Math.max(1, count));
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  const paragraphs = text.replace(/\r/g, '').split('\n');
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function truncateLines(ctx, lines, maxLines, maxWidth) {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
    last = last.slice(0, -1).trimEnd();
  }
  kept[maxLines - 1] = last + '…';
  return kept;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx, W, H, theme, rng) {
  if (theme === 'light') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f6f1e7');
    g.addColorStop(1, '#e9e2d3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(120,100,70,0.10)';
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#12151c');
    g.addColorStop(1, '#1e2433');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
  }
  // lưới chấm nhẹ
  const step = Math.round(W / 24);
  const r = Math.max(1.5, W / 520);
  for (let y = step; y < H; y += step) {
    for (let x = step; x < W; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Vẽ ảnh nền.
 * opts: { theme: 'dark'|'light', fontFamily, seedStr, safeTop (0..1), safeBottom (0..1) }
 */
export function drawWallpaper(ctx, W, H, picks, opts = {}) {
  const theme = opts.theme || 'dark';
  const family = opts.fontFamily || '"Patrick Hand", cursive';
  const rng = mulberry32(hashString((opts.seedStr || 'x') + '|layout'));

  drawBackground(ctx, W, H, theme, rng);

  // Vùng an toàn: tránh đồng hồ (trên) và nút/widget (dưới) của màn hình khóa
  const top = H * (opts.safeTop ?? 0.31);
  const bottom = H * (1 - (opts.safeBottom ?? 0.17));
  const availH = bottom - top;
  const noteW = W * 0.76;
  const pad = W * 0.05;
  const gap = W * 0.035;
  const lineH = 1.28;

  const items = picks.length
    ? picks
    : [{ text: 'Chưa có ghi chú nào. Hãy thêm ghi chú trong app.', tags: [] }];

  // Tìm cỡ chữ lớn nhất sao cho tất cả note vừa vùng an toàn
  let fs = W * (items.length === 1 ? 0.068 : items.length === 2 ? 0.056 : 0.048);
  const minFs = W * 0.028;
  let laid = [];
  for (let iter = 0; iter < 40; iter++) {
    ctx.font = `${fs}px ${family}`;
    laid = items.map((n) => {
      const lines = wrapLines(ctx, n.text.trim(), noteW - pad * 2);
      const tagText = n.tags && n.tags.length ? n.tags.map((t) => '#' + t).join(' ') : '';
      const who = [n.author, n.source].filter(Boolean).join(', ');
      const srcText = who ? '— ' + who : '';
      const footer = [srcText, tagText].filter(Boolean).join('   ');
      // dòng chân (nguồn + thẻ) cũng phải tự xuống dòng để không tràn mép note
      ctx.font = `${fs * 0.8}px ${family}`;
      const footLines = footer ? wrapLines(ctx, footer, noteW - pad * 2) : [];
      ctx.font = `${fs}px ${family}`;
      return { n, lines, footer, footLines };
    });
    const total = laid.reduce((s, l) => {
      const body = l.lines.length * fs * lineH;
      const foot = l.footLines.length ? l.footLines.length * fs * 0.8 * lineH + fs * 0.25 : 0;
      return s + body + foot + pad * 2;
    }, 0) + gap * (laid.length - 1);
    if (total <= availH || fs <= minFs) break;
    fs *= 0.94;
  }

  // Nếu ở cỡ nhỏ nhất vẫn tràn, cắt bớt dòng từng note
  ctx.font = `${fs}px ${family}`;
  const footFs = fs * 0.8;
  const footBlock = (l) => (l.footLines.length ? l.footLines.length * footFs * lineH + fs * 0.25 : 0);
  let total = laid.reduce((s, l) => s + l.lines.length * fs * lineH + footBlock(l) + pad * 2, 0) + gap * (laid.length - 1);
  if (total > availH) {
    const perNoteMax = (availH - gap * (laid.length - 1)) / laid.length;
    laid.forEach((l) => {
      const maxLines = Math.max(2, Math.floor((perNoteMax - pad * 2 - footBlock(l)) / (fs * lineH)));
      l.lines = truncateLines(ctx, l.lines, maxLines, noteW - pad * 2);
    });
    total = laid.reduce((s, l) => s + l.lines.length * fs * lineH + footBlock(l) + pad * 2, 0) + gap * (laid.length - 1);
  }

  const colorStart = Math.floor(rng() * PALETTE.length);
  let y = top + Math.max(0, (availH - total) / 2);

  laid.forEach((l, i) => {
    const bodyH = l.lines.length * fs * lineH;
    const h = bodyH + footBlock(l) + pad * 2;
    const sign = i % 2 === 0 ? -1 : 1;
    const dx = sign * W * (0.015 + rng() * 0.03);
    const rot = ((rng() * 4 + 1.5) * sign * Math.PI) / 180;
    const x = (W - noteW) / 2 + dx;
    const color = PALETTE[(colorStart + i * 2) % PALETTE.length];

    ctx.save();
    ctx.translate(x + noteW / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.translate(-noteW / 2, -h / 2);

    // bóng
    ctx.shadowColor = theme === 'light' ? 'rgba(60,40,10,0.28)' : 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = W * 0.03;
    ctx.shadowOffsetY = W * 0.012;
    ctx.fillStyle = color;
    roundRect(ctx, 0, 0, noteW, h, W * 0.012);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // nếp gấp góc dưới phải
    const fold = W * 0.045;
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    ctx.moveTo(noteW - fold, h);
    ctx.lineTo(noteW, h - fold);
    ctx.lineTo(noteW, h);
    ctx.closePath();
    ctx.fill();

    // băng dính
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    const tw = noteW * 0.22;
    const th = W * 0.04;
    ctx.save();
    ctx.translate(noteW / 2, 0);
    ctx.rotate(((rng() - 0.5) * 8 * Math.PI) / 180);
    ctx.fillRect(-tw / 2, -th / 2, tw, th);
    ctx.restore();

    // chữ
    ctx.fillStyle = '#2d2a26';
    ctx.textBaseline = 'top';
    ctx.font = `${fs}px ${family}`;
    l.lines.forEach((line, k) => {
      ctx.fillText(line, pad, pad + k * fs * lineH);
    });
    if (l.footLines.length) {
      ctx.fillStyle = 'rgba(45,42,38,0.55)';
      ctx.font = `${footFs}px ${family}`;
      l.footLines.forEach((fl, k) => {
        ctx.fillText(fl, pad, pad + bodyH + fs * 0.25 + k * footFs * lineH);
      });
    }
    ctx.restore();

    y += h + gap;
  });
}
