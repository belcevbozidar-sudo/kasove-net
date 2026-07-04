import HeroSlider from "@/components/HeroSlider";
import BrandStrip from "@/components/BrandStrip";
import CategoryLinks from "@/components/CategoryLinks";
import BundlePromoBanner from "@/components/BundlePromoBanner";
import ProductRail from "@/components/ProductRail";
import TrustBadges from "@/components/TrustBadges";
import Testimonials from "@/components/Testimonials";
import { getBestSellers, getNewArrivals } from "@/lib/data";

export default function Home() {
  const bestSellers = getBestSellers(8);
  const newArrivals = getNewArrivals(8);

  return (
    <>
      <HeroSlider />
      <CategoryLinks />
      <BrandStrip />
      <ProductRail
        eyebrow="Топ продажби"
        title="Най-продавани продукти"
        subtitle="Любимците на клиентите ни — проверени калъфи, протектори и аксесоари."
        href="/shop"
        products={bestSellers}
      />
      <BundlePromoBanner />
      <ProductRail
        eyebrow="Ново"
        title="Нови пристигания"
        subtitle="Последно добавени продукти в каталога."
        href="/shop"
        products={newArrivals}
      />
      <TrustBadges />
      <Testimonials />
    </>
  );
}
