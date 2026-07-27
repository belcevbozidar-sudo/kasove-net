import type { CartLine } from "./cart-context";

export interface SoloEntry {
  type: "solo";
  line: CartLine;
}

export interface BundleEntry {
  type: "bundle";
  caseLine: CartLine;
  protectorLine: CartLine;
}

export type CartEntry = SoloEntry | BundleEntry;

// Groups raw cart lines into display entries: a protector line with
// `bundleProductId` is paired with its anchor (case) line so the UI can
// render the whole bundle as a single card instead of two separate rows.
//
// Two passes on purpose: the case line usually appears earlier in `lines`
// than its protector, so a single forward pass would mark the case as
// "solo" before ever seeing the protector that claims it. We first resolve
// every pair by index, then walk the array once more emitting bundles and
// skipping any case index that a pair already claimed.
export function groupCartLines(lines: CartLine[]): CartEntry[] {
  const caseIndexForProtector = new Map<number, number>();
  lines.forEach((line, i) => {
    if (!line.bundleProductId) return;
    const caseIndex = lines.findIndex((l) => l.productId === line.bundleProductId && !l.bundleProductId);
    if (caseIndex !== -1) caseIndexForProtector.set(i, caseIndex);
  });
  const claimedCaseIndexes = new Set(caseIndexForProtector.values());

  const entries: CartEntry[] = [];
  lines.forEach((line, i) => {
    if (caseIndexForProtector.has(i)) {
      const caseLine = lines[caseIndexForProtector.get(i)!];
      entries.push({ type: "bundle", caseLine, protectorLine: line });
      return;
    }
    if (claimedCaseIndexes.has(i)) return; // rendered as part of a bundle above
    entries.push({ type: "solo", line });
  });

  return entries;
}
