import { v } from "convex/values";
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const submitContactMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contactMessages", { ...args, createdAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.contact.notifyNtfy, args);
  },
});

// Same ntfy topic as orders — see convex/orders.ts's notifyNtfy for why this
// has to be a separate action instead of running inline in the mutation.
export const notifyNtfy = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, { name, email, subject, message }) => {
    const topic = process.env.NTFY_TOPIC;
    if (!topic) {
      console.error("NTFY_TOPIC is not configured — skipping contact notification.");
      return;
    }

    const body = [
      "Ново съобщение от контактната форма",
      `${name} · ${email}`,
      subject ? `Тема: ${subject}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const headers: Record<string, string> = {
      Title: "New contact form message",
      Priority: "default",
      Tags: "envelope",
    };

    try {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers,
        body,
      });
    } catch (err) {
      console.error("Failed to send ntfy notification:", err);
    }
  },
});
