// Gate for every Convex function that isn't part of the public storefront.
//
// The Convex deployment URL ships inside the client bundle (it has to — the
// storefront queries Convex directly from the browser), so a "public" Convex
// function is callable by anyone who opens devtools. That is fine for reading
// the catalog, but not for the admin/migration surface: without this gate,
// anyone could dump every customer order, delete the catalog or wipe the
// image storage.
//
// This shop has no Convex-side user auth (admin is a cookie session in
// Next.js), so the gate is a shared secret that lives only where the browser
// can't see it:
//   - Convex:  npx convex env set ADMIN_API_SECRET <value>
//   - Vercel:  ADMIN_API_SECRET environment variable (server-side only)
//   - locally: ADMIN_API_SECRET in .env.local (gitignored), for maintenance
//              scripts under scripts/
//
// Never expose it through a NEXT_PUBLIC_* variable — that would put it in the
// client bundle and defeat the whole thing.

export function assertAdmin(secret: string) {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected) {
    throw new Error("ADMIN_API_SECRET is not configured on this Convex deployment");
  }
  // Constant-time comparison: a plain !== would leak, through response
  // timing, how many leading characters of a guess were correct.
  if (secret.length !== expected.length) {
    throw new Error("Unauthorized");
  }
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    throw new Error("Unauthorized");
  }
}
