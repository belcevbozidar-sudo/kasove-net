import { getBrand } from "./data";

// Brands where prefixing the model with the brand display name doesn't make
// sense (they aren't phone-model brands, or the "model" is a generic label).
const SKIP_PREFIX_BRANDS = new Set(["universal", "other", "diecast-cars"]);

// Generic, non-model labels. Products carrying these (toys, cables, chargers)
// often have an arbitrary brand attached in the source data, so prefixing it
// would print nonsense like "Motorola Универсален".
const GENERIC_MODELS = new Set(["универсален", "универсална", "универсално"]);

/**
 * Formats a raw, scraped `model` string for display: strips a redundant
 * leading brand-slug prefix and any "Galaxy" occurrence, then re-prefixes
 * with the brand's display name (e.g. "Galaxy S24 Ultra" -> "Samsung S24
 * Ultra", bare "Note 12 Pro" for Xiaomi -> "Xiaomi Note 12 Pro").
 */
export function formatModelDisplay(brandSlug: string, model: string): string {
  const raw = (model ?? "").trim();
  if (!raw) return raw;

  const brandRegex = new RegExp(`^${brandSlug}\\s+`, "i");
  let cleaned = raw.replace(brandRegex, "").replace(/\bgalaxy\b\s*/gi, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (!cleaned) cleaned = raw;

  if (SKIP_PREFIX_BRANDS.has(brandSlug)) return cleaned;
  if (GENERIC_MODELS.has(cleaned.toLowerCase())) return cleaned;

  const brandName = getBrand(brandSlug)?.name;
  if (!brandName) return cleaned;

  const lower = cleaned.toLowerCase();
  // "Redmi" is Xiaomi's own recognizable sub-brand name, so a model already
  // starting with it satisfies "Xiaomi or Redmi should show" without also
  // needing a "Xiaomi" prefix. Bare "Mi"/"Poco" aren't unambiguous enough on
  // their own, so those still get the "Xiaomi" prefix added.
  const alreadyPrefixed =
    lower.startsWith(brandName.toLowerCase()) || (brandSlug === "xiaomi" && lower.startsWith("redmi"));

  return alreadyPrefixed ? cleaned : `${brandName} ${cleaned}`;
}
