"use server";

import { cookies, headers } from "next/headers";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// No hardcoded fallback: this repo is public, so a literal default password
// baked into source would be visible to anyone. Admin login simply doesn't
// work until ADMIN_PASSWORD is configured as a real environment variable.
function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not configured.");
  }
  return password;
}

function getSecretKey(): Buffer {
  return crypto.scryptSync(getAdminPassword(), "salt", 32);
}

// Shared secret that authorizes the admin/maintenance Convex functions (see
// convex/adminAuth.ts). Server-side only — it must never reach the browser,
// which is why every admin Convex call goes through a server action here
// rather than through useQuery/useMutation in the dashboard component.
function getConvexAdminSecret(): string {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    throw new Error("ADMIN_API_SECRET environment variable is not configured.");
  }
  return secret;
}


/** Runs an admin Convex call, keeping its raw error off the client.
 *  Convex echoes the whole argument object back in validation errors — which
 *  includes adminSecret — so the raw message must never be surfaced to the
 *  browser, even inside the authenticated admin panel. */
async function convexAdminCall<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`Admin Convex call failed (${label}):`, err);
    throw new Error(`Операцията не бе изпълнена (${label}). Виж сървърния лог за подробности.`);
  }
}

/** Every admin data operation must prove there's a valid session cookie
 *  before it is allowed to use the Convex admin secret. */
async function requireSession() {
  const hasSession = await checkAdminSession();
  if (!hasSession) throw new Error("Unauthorized");
  return getConvexAdminSecret();
}

function encryptSession(data: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptSession(token: string): string | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return null;
  }
}

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headersList.get("x-real-ip") || "127.0.0.1";
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie) return false;

  const decrypted = decryptSession(sessionCookie.value);
  if (!decrypted) return false;

  try {
    const session = JSON.parse(decrypted);
    if (session.auth === true && session.expires > Date.now()) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

export async function adminLogin(password: string, rememberMe: boolean) {
  const ip = await getClientIp();

  // Check lockout status in Convex
  const lockout = await convexAdminCall("getLockout", () => fetchQuery(api.products.getLockout, { ip, adminSecret: getConvexAdminSecret() }));
  if (lockout.locked) {
    const timeLeft = Math.ceil(((lockout.lockoutUntil || 0) - Date.now()) / (60 * 1000));
    return {
      success: false,
      error: `Твърде много неуспешни опити. Системата е блокирана за 1 час. Оставащо време: ${timeLeft} минути.`,
    };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return {
      success: false,
      error: "Административният панел не е конфигуриран — липсва ADMIN_PASSWORD.",
    };
  }
  if (password === adminPassword) {
    // Reset login failures on success
    await convexAdminCall("resetLoginAttempts", () => fetchMutation(api.products.resetLoginAttempts, { ip, adminSecret: getConvexAdminSecret() }));

    const sessionDuration = rememberMe ? 14 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 2 weeks vs 1 day
    const expires = Date.now() + sessionDuration;
    const sessionToken = encryptSession(JSON.stringify({ auth: true, expires }));

    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(expires),
      path: "/",
    });

    return { success: true };
  } else {
    // Record login failure
    const failure = await convexAdminCall("recordLoginFailure", () => fetchMutation(api.products.recordLoginFailure, { ip, adminSecret: getConvexAdminSecret() }));
    const remaining = Math.max(0, 3 - failure.attempts);

    if (failure.locked) {
      return {
        success: false,
        error: "Грешна парола. Твърде много неуспешни опити! Системата е блокирана за 1 час.",
      };
    }

    return {
      success: false,
      error: `Грешна парола. Оставащи опити: ${remaining}`,
    };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return { success: true };
}

export async function getGalleryImages(): Promise<string[]> {
  const hasSession = await checkAdminSession();
  if (!hasSession) throw new Error("Unauthorized");

  const imagesDir = path.join(process.cwd(), "public", "images");
  try {
    const files = await fs.promises.readdir(imagesDir);
    const imageFiles: string[] = [];
    for (const file of files) {
      const fullPath = path.join(imagesDir, file);
      const stat = await fs.promises.stat(fullPath);
      if (stat.isFile() && /\.(png|jpe?g|svg|webp|gif)$/i.test(file)) {
        imageFiles.push(`/images/${file}`);
      }
    }
    return imageFiles;
  } catch (error) {
    console.error("Error reading images directory:", error);
    return [];
  }
}

export async function saveProduct(data: {
  id?: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  gallery: string[];
  features: string[];
  badge?: string;
  inStock?: boolean;
  sku?: string;
}) {
  const adminSecret = await requireSession();

  if (!data.name || !data.brand || !data.category || data.price <= 0) {
    return { success: false, error: "Моля попълнете всички задължителни полета." };
  }

  try {
    if (data.id) {
      // Update
      await convexAdminCall("updateProduct", () => fetchMutation(api.products.adminUpdateProduct, {
        adminSecret,
        id: data.id as any,
        name: data.name,
        brand: data.brand,
        model: data.model,
        category: data.category,
        price: data.price,
        oldPrice: data.oldPrice || undefined,
        description: data.description,
        gallery: data.gallery,
        features: data.features,
        badge: data.badge || undefined,
        inStock: data.inStock,
        sku: data.sku,
      }));
    } else {
      // Add
      await convexAdminCall("addProduct", () => fetchMutation(api.products.adminAddProduct, {
        adminSecret,
        name: data.name,
        brand: data.brand,
        model: data.model,
        category: data.category,
        price: data.price,
        oldPrice: data.oldPrice || undefined,
        description: data.description,
        gallery: data.gallery,
        features: data.features,
        badge: data.badge || undefined,
        inStock: data.inStock,
        sku: data.sku,
      }));
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save product:", error);
    return { success: false, error: error.message || "Неуспешен запис на продукта." };
  }
}

export async function deleteProduct(id: string) {
  const adminSecret = await requireSession();

  try {
    await convexAdminCall("deleteProduct", () => fetchMutation(api.products.adminDeleteProduct, { adminSecret, id: id as any }));
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return { success: false, error: error.message || "Неуспешно изтриване на продукта." };
  }
}

// --- orders -----------------------------------------------------------------
// These used to be called straight from the dashboard with useQuery/useMutation,
// which meant the underlying Convex functions had to be public — and a public
// `getOrders` let anyone on the internet dump every customer's name, phone and
// address. They now run server-side behind the session check.

export async function fetchOrders() {
  const adminSecret = await requireSession();
  return await convexAdminCall("getOrders", () => fetchQuery(api.orders.getOrders, { adminSecret }));
}

export async function setOrderStatus(orderId: string, status: string) {
  const adminSecret = await requireSession();
  await convexAdminCall("updateOrderStatus", () => fetchMutation(api.orders.updateOrderStatus, { adminSecret, orderId: orderId as any, status }));
  return { success: true };
}

export async function removeOrder(orderId: string) {
  const adminSecret = await requireSession();
  await convexAdminCall("deleteOrder", () => fetchMutation(api.orders.deleteOrder, { adminSecret, orderId: orderId as any }));
  return { success: true };
}

// --- product helpers --------------------------------------------------------

export async function fetchNextSku() {
  const adminSecret = await requireSession();
  return await convexAdminCall("getNextSku", () => fetchQuery(api.products.getNextSku, { adminSecret }));
}

// --- hero slides ------------------------------------------------------------

type SlideInput = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  order: number;
};

export async function addSlide(data: SlideInput) {
  const adminSecret = await requireSession();
  await convexAdminCall("addSlide", () => fetchMutation(api.slides.add, { adminSecret, ...data }));
  return { success: true };
}

export async function updateSlide(id: string, data: SlideInput) {
  const adminSecret = await requireSession();
  await convexAdminCall("updateSlide", () => fetchMutation(api.slides.update, { adminSecret, id: id as any, ...data }));
  return { success: true };
}

export async function removeSlide(id: string) {
  const adminSecret = await requireSession();
  await convexAdminCall("removeSlide", () => fetchMutation(api.slides.deleteSlide, { adminSecret, id: id as any }));
  return { success: true };
}

export async function seedSlides() {
  const adminSecret = await requireSession();
  await convexAdminCall("seedSlides", () => fetchMutation(api.slides.seed, { adminSecret }));
  return { success: true };
}
