import { v } from "convex/values";
import { mutation, query, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertAdmin } from "./adminAuth";

const orderItemValidator = v.object({
  productId: v.string(),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
  image: v.string(),
  bundleProductId: v.optional(v.string()),
});

export const createOrder = mutation({
  args: {
    type: v.union(v.literal("standard"), v.literal("quick")),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    deliveryMethod: v.optional(v.string()),
    city: v.optional(v.string()),
    addressOrOffice: v.optional(v.string()),
    note: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    items: v.array(orderItemValidator),
    subtotal: v.number(),
    bundleSavings: v.optional(v.number()),
    shipping: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const last = await ctx.db.query("orders").withIndex("by_seq").order("desc").first();
    const seq = (last?.seq ?? 100000) + 1;
    const orderNumber = `KN-${seq}`;

    const orderId = await ctx.db.insert("orders", {
      ...args,
      seq,
      orderNumber,
      status: "нова",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.orders.notifyNtfy, { orderId });

    return { orderId, orderNumber };
  },
});

export const getOrders = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, { adminSecret }) => {
    assertAdmin(adminSecret);
    return await ctx.db.query("orders").withIndex("by_seq").order("desc").collect();
  },
});

export const deleteOrder = mutation({
  args: { adminSecret: v.string(), orderId: v.id("orders") },
  handler: async (ctx, { adminSecret, orderId }) => {
    assertAdmin(adminSecret);
    await ctx.db.delete(orderId);
  },
});

export const updateOrderStatus = mutation({
  args: { adminSecret: v.string(), orderId: v.id("orders"), status: v.string() },
  handler: async (ctx, { adminSecret, orderId, status }) => {
    assertAdmin(adminSecret);
    await ctx.db.patch(orderId, { status });
  },
});

export const getOrderInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    return await ctx.db.get(orderId);
  },
});

// The only function in the project that makes an outbound HTTP call —
// Convex actions are the sole function type allowed to `fetch()`, which is
// why this is split out from the `createOrder` mutation and invoked async
// via the scheduler instead of being awaited inline.
export const notifyNtfy = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const topic = process.env.NTFY_TOPIC;
    if (!topic) {
      console.error("NTFY_TOPIC is not configured — skipping order notification.");
      return;
    }

    const order = await ctx.runQuery(internal.orders.getOrderInternal, { orderId });
    if (!order) return;

    const itemsText = order.items.map((i) => `${i.quantity}x ${i.name}`).join("\n");
    const kindLabel = order.type === "quick" ? "Бърза поръчка" : "Поръчка";
    const body = [
      `${kindLabel} ${order.orderNumber}`,
      `${order.firstName} ${order.lastName} · ${order.phone}`,
      order.email ? `Имейл: ${order.email}` : null,
      order.city ? `Град: ${order.city}` : null,
      order.addressOrOffice ? `Адрес/офис: ${order.addressOrOffice}` : null,
      order.note ? `Бележка: ${order.note}` : null,
      "",
      itemsText,
      "",
      // Totals are stored in EUR; show the BGN equivalent alongside so the
      // figure matches what the customer saw on the site.
      `Общо: ${order.total.toFixed(2)} EUR (${(order.total * 1.95583).toFixed(2)} лв.)`,
    ]
      .filter(Boolean)
      .join("\n");

    // Header values must stay ASCII — all the Cyrillic detail lives in the
    // plain-text UTF-8 body instead, which has no such restriction.
    // Note: ntfy.sh's anonymous (unauthenticated) publishing does not allow
    // the X-Email forwarding header — see notifyNtfy's doc comment above.
    const headers: Record<string, string> = {
      Title: `New order ${order.orderNumber} (${order.type})`,
      Priority: "high",
      Tags: "shopping_cart",
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
