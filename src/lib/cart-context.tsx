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

export interface CartLine {
  productId: string;
  quantity: number;
  bundleProductId?: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  model: string;
  slug: string;
  isBundleDiscounted?: boolean;
  bundleDiscountPct?: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (product: any, quantity?: number, bundleAnchorProduct?: any) => void;
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
const STORAGE_KEY = "kasove-cart-v2"; // upgraded storage version for breaking data type change

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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
    (product: any, quantity = 1, bundleAnchorProduct?: any) => {
      setLines((prev) => {
        const productId = product.id;
        const bundleProductId = bundleAnchorProduct?.id;
        const existingIndex = prev.findIndex(
          (l) => l.productId === productId && l.bundleProductId === bundleProductId
        );
        
        let isBundleDiscounted = false;
        let bundleDiscountPct = 0;
        let finalPrice = product.price;
        
        if (bundleAnchorProduct && bundleAnchorProduct.bundleDiscountPct && bundleAnchorProduct.bundleWith === product.id) {
          isBundleDiscounted = true;
          bundleDiscountPct = bundleAnchorProduct.bundleDiscountPct;
          finalPrice = product.price * (1 - bundleDiscountPct / 100);
        }

        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + quantity,
          };
          return next;
        }

        return [
          ...prev,
          {
            productId,
            quantity,
            bundleProductId,
            name: product.name,
            price: finalPrice,
            originalPrice: product.price,
            image: product.image,
            model: product.model,
            slug: product.slug,
            isBundleDiscounted,
            bundleDiscountPct
          },
        ];
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
      count += line.quantity;
      sub += line.price * line.quantity;
      if (line.isBundleDiscounted && line.bundleDiscountPct) {
        const discountAmount = line.originalPrice - line.price;
        savings += discountAmount * line.quantity;
      }
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
