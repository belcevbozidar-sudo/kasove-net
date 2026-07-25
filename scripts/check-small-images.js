// Read-only: downloads the smallest storage files and verifies they are real,
// decodable WebP images with sane dimensions (catches truncated/placeholder blobs).
const { ConvexClient } = require("convex/browser");
const fs = require("fs");

try {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const p = line.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
} catch {}

const client = new ConvexClient(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL);

// Minimal WebP header parser: RIFF....WEBP + VP8 / VP8L / VP8X chunk
function parseWebp(buf) {
  if (buf.length < 16) return { ok: false, why: "твърде малък" };
  if (buf.toString("ascii", 0, 4) !== "RIFF") return { ok: false, why: "няма RIFF" };
  if (buf.toString("ascii", 8, 12) !== "WEBP") return { ok: false, why: "няма WEBP" };
  const riffSize = buf.readUInt32LE(4);
  if (riffSize + 8 > buf.length) return { ok: false, why: `отрязан (RIFF ${riffSize + 8} > ${buf.length})` };
  const chunk = buf.toString("ascii", 12, 16);
  let w = 0, h = 0;
  try {
    if (chunk === "VP8 ") {
      w = buf.readUInt16LE(26) & 0x3fff;
      h = buf.readUInt16LE(28) & 0x3fff;
    } else if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      w = (b & 0x3fff) + 1;
      h = ((b >> 14) & 0x3fff) + 1;
    } else if (chunk === "VP8X") {
      w = (buf.readUIntLE(24, 3) & 0xffffff) + 1;
      h = (buf.readUIntLE(27, 3) & 0xffffff) + 1;
    } else return { ok: false, why: "непознат chunk " + chunk };
  } catch {
    return { ok: false, why: "грешка при четене на размери" };
  }
  if (!w || !h) return { ok: false, why: "нулеви размери" };
  return { ok: true, w, h, chunk };
}

async function pool(items, worker, n) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await worker(items[k]); }
  }));
  return out;
}

async function main() {
  console.log("Изтеглям списъка на файловете...");
  const files = [];
  let cursor = null, done = false;
  while (!done) {
    const res = await client.query("products:getStorageAuditPage", { cursor, limit: 500 });
    files.push(...res.items);
    cursor = res.continueCursor; done = res.isDone;
  }
  const small = files.filter((f) => f.size < 5120).sort((a, b) => a.size - b.size);
  console.log(`Файлове под 5 KB: ${small.length}. Проверявам всичките...\n`);

  const results = await pool(small, async (f) => {
    try {
      const res = await fetch(f.url);
      if (!res.ok) return { f, ok: false, why: "HTTP " + res.status };
      const buf = Buffer.from(await res.arrayBuffer());
      const p = parseWebp(buf);
      return { f, ...p };
    } catch (e) {
      return { f, ok: false, why: String(e.message || e) };
    }
  }, 30);

  const bad = results.filter((r) => !r.ok);
  const good = results.filter((r) => r.ok);
  const tiny = good.filter((r) => r.w < 50 || r.h < 50);

  console.log(`Валидни WebP изображения : ${good.length}/${results.length}`);
  console.log(`Повредени / нечетими     : ${bad.length}`);
  for (const b of bad.slice(0, 20)) console.log(`   ${b.f.url}  (${b.f.size} B) -> ${b.why}`);
  console.log(`С размери под 50x50 px   : ${tiny.length}`);
  for (const t of tiny.slice(0, 10)) console.log(`   ${t.f.url}  ${t.w}x${t.h}`);
  if (good.length) {
    const dims = good.map((r) => `${r.w}x${r.h}`);
    const counts = {};
    for (const d of dims) counts[d] = (counts[d] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`Най-чести размери        : ${top.map(([d, n]) => `${d} (${n})`).join(", ")}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
