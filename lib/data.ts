import brandsJson from "@/data/brands.json";
import type { Brand } from "./types";

export function getBrands(): Brand[] {
  return brandsJson as Brand[];
}
