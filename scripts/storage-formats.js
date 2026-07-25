// Read-only breakdown of Convex storage by content type and file size.
const { ConvexClient } = require("convex/browser");
const fs = require("fs");

try {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const p = line.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
} catch {}

const client = new ConvexClient(process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL);
const fmt = (b) => (b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB" : (b / 1048576).toFixed(1) + " MB");

async function main() {
  const byType = new Map();
  const sizes = [];
  let cursor = null, done = false, total = 0, bytes = 0;
  while (!done) {
    const res = await client.query("products:getStorageAuditPage", { cursor, limit: 500 });
    for (const f of res.items) {
      total++;
      bytes += f.size;
      sizes.push(f.size);
      const t = f.contentType || "(няма)";
      const e = byType.get(t) || { n: 0, b: 0 };
      e.n++; e.b += f.size;
      byType.set(t, e);
    }
    cursor = res.continueCursor;
    done = res.isDone;
  }
  sizes.sort((a, b) => a - b);
  const pct = (p) => sizes[Math.floor(sizes.length * p)];

  console.log(`\nОБЩО: ${total} файла, ${fmt(bytes)}\n`);
  console.log("По формат:");
  for (const [t, e] of [...byType.entries()].sort((a, b) => b[1].b - a[1].b)) {
    console.log(`  ${t.padEnd(18)} ${String(e.n).padStart(7)} файла  ${fmt(e.b).padStart(10)}  (${((e.b / bytes) * 100).toFixed(1)}%)`);
  }
  console.log("\nРазмер на файл:");
  console.log(`  най-малък ${(sizes[0] / 1024).toFixed(1)} KB   медиана ${(pct(0.5) / 1024).toFixed(1)} KB   p90 ${(pct(0.9) / 1024).toFixed(1)} KB   p99 ${(pct(0.99) / 1024).toFixed(1)} KB   най-голям ${(sizes[sizes.length - 1] / 1048576).toFixed(2)} MB`);
  console.log(`  над 1 MB: ${sizes.filter((s) => s > 1048576).length} файла`);
  console.log(`  под 5 KB (подозрително малки): ${sizes.filter((s) => s < 5120).length} файла`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
