import brandsJson from "@/data/brands.json";
import rolexWatches from "@/data/rolex/watches.json";
import omegaWatches from "@/data/omega/watches.json";
import patekWatches from "@/data/patek-philippe/watches.json";
import apWatches from "@/data/audemars-piguet/watches.json";
import jlcWatches from "@/data/jaeger-lecoultre/watches.json";
import cartierWatches from "@/data/cartier/watches.json";
import grandSeikoWatches from "@/data/grand-seiko/watches.json";
import type { Brand, BrandView, Watch, WatchView } from "./types";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const brands: BrandView[] = (brandsJson as Brand[]).map((brand) => ({
  ...brand,
  logoSrc: brand.logo ? `/brands/${brand.id}/${brand.logo}` : null,
  countryName: regionNames.of(brand.country) ?? brand.country,
  countryCode: brand.country.toLowerCase(),
}));

const brandsById = new Map(brands.map((b) => [b.id, b]));

const watchesByBrand: Record<string, Watch[]> = {
  rolex: rolexWatches as Watch[],
  omega: omegaWatches as Watch[],
  "patek-philippe": patekWatches as Watch[],
  "audemars-piguet": apWatches as Watch[],
  "jaeger-lecoultre": jlcWatches as Watch[],
  cartier: cartierWatches as Watch[],
  "grand-seiko": grandSeikoWatches as Watch[],
};

function resolveAsset(brandId: string, p: string): string {
  return /^https?:\/\//.test(p) ? p : `/watches/${brandId}/${p}`;
}

const watchViewsByBrand: Record<string, WatchView[]> = Object.fromEntries(
  Object.entries(watchesByBrand).map(([brandId, watches]) => [
    brandId,
    watches.map((w) => ({
      ...w,
      thumbnailSrc: resolveAsset(brandId, w.thumbnail),
      imageSrcs: w.images.map((img) => resolveAsset(brandId, img)),
    })),
  ]),
);

export function getBrands(): BrandView[] {
  return brands;
}

export function getBrand(id: string): BrandView | undefined {
  return brandsById.get(id);
}

export function getWatches(brandId: string): WatchView[] {
  return watchViewsByBrand[brandId] ?? [];
}
