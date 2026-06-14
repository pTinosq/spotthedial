import brandsJson from "@/data/brands.json";
import type { Brand, BrandView } from "./types";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const brands: BrandView[] = (brandsJson as Brand[]).map((brand) => ({
  ...brand,
  logoSrc: brand.logo ? `/brands/${brand.id}/${brand.logo}` : null,
  countryName: regionNames.of(brand.country) ?? brand.country,
  countryCode: brand.country.toLowerCase(),
}));

export function getBrands(): BrandView[] {
  return brands;
}
