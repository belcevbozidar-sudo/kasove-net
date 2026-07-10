import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DiscountBanner from "@/components/DiscountBanner";
import ConvexClientProvider from "@/components/ConvexClientProvider";


const heading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Кейсове.нет — Калъфи и аксесоари за телефони",
  description:
    "Кейсове.нет — оригинални калъфи, протектори и GSM аксесоари за Apple, Samsung, Xiaomi, Huawei, Google и OnePlus. Купи калъф + протектор в бъндел и спести до 25%.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      className={`${heading.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <ConvexClientProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <DiscountBanner />
          </CartProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

