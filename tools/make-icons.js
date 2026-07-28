// Генератор иконок для установки на телефон (PWA).
// Запуск: node tools/make-icons.js — перезаписывает pwa/icons/*.png.
// Без внешних зависимостей: PNG кодируется вручную (zlib из Node).
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/* ---------- минимальный PNG-энкодер (RGBA8) ---------- */
const CRC_TABLE = (function () {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- геометрия в нормальных координатах 0..1 ---------- */
function inRoundedSquare(u, v, r) {
  const cx = Math.min(Math.max(u, r), 1 - r);
  const cy = Math.min(Math.max(v, r), 1 - r);
  const dx = u - cx, dy = v - cy;
  return dx * dx + dy * dy <= r * r;
}
function inRect(u, v, x0, y0, x1, y1) {
  return u >= x0 && u <= x1 && v >= y0 && v <= y1;
}
function nearSegment(u, v, x0, y0, x1, y1, half) {
  const dx = x1 - x0, dy = y1 - y0;
  const t = Math.max(0, Math.min(1, ((u - x0) * dx + (v - y0) * dy) / (dx * dx + dy * dy)));
  const px = x0 + t * dx - u, py = y0 + t * dy - v;
  return px * px + py * py <= half * half;
}

// Буква «Н» — две стойки и перекладина. Держим в центральных 80% (safe zone маски).
function glyphN(u, v) {
  return inRect(u, v, 0.30, 0.28, 0.385, 0.72)
      || inRect(u, v, 0.615, 0.28, 0.70, 0.72)
      || inRect(u, v, 0.30, 0.457, 0.70, 0.543);
}
// Буква «А» — два ската и перекладина.
function glyphA(u, v) {
  return nearSegment(u, v, 0.50, 0.28, 0.295, 0.72, 0.043)
      || nearSegment(u, v, 0.50, 0.28, 0.705, 0.72, 0.043)
      || inRect(u, v, 0.375, 0.565, 0.625, 0.645);
}

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

function renderIcon(size, bgHex, glyph) {
  const SS = 3; // сглаживание: 3x3 сэмпла на пиксель
  const [br, bg, bb] = hex(bgHex);
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgHits = 0, fgHits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          if (inRoundedSquare(u, v, 0.12)) bgHits++;
          if (glyph(u, v)) fgHits++;
        }
      }
      const total = SS * SS;
      const alpha = bgHits / total;
      const f = Math.min(fgHits / total, alpha); // глиф не вылезает за фон
      const k = alpha > 0 ? f / alpha : 0;
      const i = (y * size + x) * 4;
      out[i]     = Math.round(br * (1 - k) + 255 * k);
      out[i + 1] = Math.round(bg * (1 - k) + 255 * k);
      out[i + 2] = Math.round(bb * (1 - k) + 255 * k);
      out[i + 3] = Math.round(255 * alpha);
    }
  }
  return out;
}

const DIR = path.join(__dirname, "..", "pwa", "icons");
fs.mkdirSync(DIR, { recursive: true });
const products = [
  { slug: "navar", color: "#22C55E", glyph: glyphN },
  { slug: "avto",  color: "#F59E0B", glyph: glyphA },
];
for (const p of products) {
  for (const size of [192, 512]) {
    const file = path.join(DIR, `${p.slug}-${size}.png`);
    fs.writeFileSync(file, encodePng(size, renderIcon(size, p.color, p.glyph)));
    console.log("icon " + path.basename(file) + " — " + fs.statSync(file).size + " байт");
  }
}
