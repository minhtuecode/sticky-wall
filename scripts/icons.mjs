import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
for (const size of [192, 512]) {
  const c = createCanvas(size, size), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#12151c'); g.addColorStop(1, '#1e2433');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  const cols = ['#cde5ff', '#fff1a6', '#ffd3df'];
  cols.forEach((col, i) => {
    x.save();
    x.translate(size / 2, size * (0.3 + i * 0.2));
    x.rotate(((i % 2 ? 1 : -1) * 5) * Math.PI / 180);
    x.fillStyle = col; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = size * 0.04; x.shadowOffsetY = size * 0.015;
    x.fillRect(-size * 0.32, -size * 0.09, size * 0.64, size * 0.18);
    x.restore();
  });
  writeFileSync(`icons/icon-${size}.png`, c.toBuffer('image/png'));
}
console.log('icons ok');
