"use server";

import { cookies, headers } from "next/headers";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto.scryptSync(process.env.ADMIN_PASSWORD || "default_secure_secret_key_1234567890", "salt", 32);
const IV_LENGTH = 16;

function encryptSession(data: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
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
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
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
  const lockout = await fetchQuery(api.products.getLockout, { ip });
  if (lockout.locked) {
    const timeLeft = Math.ceil(((lockout.lockoutUntil || 0) - Date.now()) / (60 * 1000));
    return {
      success: false,
      error: `Твърде много неуспешни опити. Системата е блокирана за 1 час. Оставащо време: ${timeLeft} минути.`,
    };
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "Kp7$mZ#9qL_v2xT";
  if (password === adminPassword) {
    // Reset login failures on success
    await fetchMutation(api.products.resetLoginAttempts, { ip });

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
    const failure = await fetchMutation(api.products.recordLoginFailure, { ip });
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
}) {
  const hasSession = await checkAdminSession();
  if (!hasSession) throw new Error("Unauthorized");

  if (!data.name || !data.brand || !data.category || data.price <= 0) {
    return { success: false, error: "Моля попълнете всички задължителни полета." };
  }

  try {
    if (data.id) {
      // Update
      await fetchMutation(api.products.adminUpdateProduct, {
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
      });
    } else {
      // Add
      await fetchMutation(api.products.adminAddProduct, {
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
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save product:", error);
    return { success: false, error: error.message || "Неуспешен запис на продукта." };
  }
}

export async function deleteProduct(id: string) {
  const hasSession = await checkAdminSession();
  if (!hasSession) throw new Error("Unauthorized");

  try {
    await fetchMutation(api.products.adminDeleteProduct, { id: id as any });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return { success: false, error: error.message || "Неуспешно изтриване на продукта." };
  }
}
