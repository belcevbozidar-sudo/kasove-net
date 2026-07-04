"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProductById } from "./data";

export interface CartLine {
  productId: string;
  quantity: number;
  bundleProductId?: string;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number, bundleProductId?: string) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  bundleSavings: number;
  total: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "kasove-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage after mount, to keep server/client initial render in sync.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback(
    (productId: string, quantity = 1, bundleProductId?: string) => {
      setLines((prev) => {
        const existingIndex = prev.findIndex(
          (l) => l.productId === productId && l.bundleProductId === bundleProductId
        );
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
          };
          return next;
        }
        return [...prev, { productId, quantity, bundleProductId }];
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const { itemCount, subtotal, bundleSavings } = useMemo(() => {
    let count = 0;
    let sub = 0;
    let savings = 0;
    for (const line of lines) {
      const product = getProductById(line.productId);
      if (!product) continue;
      count += line.quantity;
      let unitPrice = product.price;
      if (line.bundleProductId) {
        const anchor = getProductById(line.bundleProductId);
        if (anchor && anchor.bundleWith === product.id && anchor.bundleDiscountPct) {
          const discount = product.price * (anchor.bundleDiscountPct / 100);
          unitPrice -= discount;
          savings += discount * line.quantity;
        }
      }
      sub += unitPrice * line.quantity;
    }
    return { itemCount: count, subtotal: sub, bundleSavings: savings };
  }, [lines]);

  const total = subtotal;

  const value: CartContextValue = {
    lines,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    itemCount,
    subtotal,
    bundleSavings,
    total,
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
