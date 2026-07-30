// One-off: generates missing category banner photos via OpenRouter's
// image-generation-capable model, matching the existing dark/premium
// aesthetic used by public/images/categories/*.webp (see car-stands.webp,
// chargers-220v.webp, etc — moody product photography, shallow depth of
// field, on a dark surface).
//
// Requires OPENROUTER_API_KEY in .env.local (not committed).
//
// Usage: node scripts/generate-category-images.js

const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(".env.local", "utf8");
let apiKey;
for (const line of envContent.split("\n")) {
  const parts = line.split("=");
  if (parts.length >= 2 && parts[0].trim() === "OPENROUTER_API_KEY") {
    apiKey = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}
if (!apiKey) {
  console.error("Error: OPENROUTER_API_KEY is not set in .env.local");
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, "..", "public", "images", "categories");

const jobs = [
  {
    slug: "bluetooth-headphones",
    prompt:
      "Professional product photography of a pair of black wireless bluetooth headphones resting on a dark reflective surface, dramatic side lighting with a soft blue rim light, shallow depth of field, moody dark background, premium e-commerce banner style, photorealistic, 3:2 aspect ratio",
  },
  {
    slug: "toys",
    prompt:
      "Professional product photography of a detailed die-cast metal toy sports car model on a dark reflective studio surface, dramatic dramatic rim lighting, shallow depth of field, moody dark background, premium e-commerce banner style, photorealistic, 3:2 aspect ratio",
  },
];

async function generateImage(prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const images = data.choices?.[0]?.message?.images;
  if (!images || images.length === 0) {
    throw new Error(`No image returned. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }
  const dataUrl = images[0].image_url?.url;
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new Error(`Unexpected image format: ${JSON.stringify(images[0]).slice(0, 300)}`);
  }
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const job of jobs) {
    console.log(`Generating: ${job.slug}...`);
    try {
      const buffer = await generateImage(job.prompt);
      const tmpPath = path.join(OUT_DIR, `${job.slug}.png`);
      fs.writeFileSync(tmpPath, buffer);
      console.log(`  Saved ${tmpPath} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }
  console.log("\nDone. Convert the .png files to .webp next (sips/cwebp).");
}

run();
