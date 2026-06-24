export type Brand = {
  id: string;
  name: string;
  founded: number;
  /** ISO 3166-1 alpha-2 country code, uppercase (e.g. "CH", "FR", "JP"). */
  country: string;
  /** Logo filename inside `public/brands/<id>/` (e.g. "logo.svg", "logo.png"). Omit for typographic fallback. */
  logo?: string;
  /** Marks the brand as not yet built — disables the home link and shows a placeholder on its page. */
  comingSoon?: boolean;
};

export type BrandView = Brand & {
  /** Resolved public URL for the logo, or null if none. */
  logoSrc: string | null;
  countryName: string;
  /** Lowercased ISO code, for `react-circle-flags`. */
  countryCode: string;
};

/**
 * A real-world variant of a model — a specific dial/bezel/bracelet combination —
 * shown in the "Variants" section of the watch page and filterable by `tags`.
 * Authored via `just variant-prepare`.
 */
export type Variant = {
  /** Either a path relative to `public/watches/<brand>/` or an absolute http(s) URL. */
  image: string;
  /** Free-form descriptive tags, e.g. ["Black Dial", "Jubilee Bracelet"]. */
  tags: string[];
};

export type Watch = {
  id: string;
  name: string;
  /** Plain-text prose on the model's distinctive features. Optional. */
  description?: string;
  /** Either a path relative to `public/watches/<brand>/` or an absolute http(s) URL. */
  thumbnail: string;
  /** Same resolution rules as `thumbnail`. */
  images: string[];
  /** Tagged variant images for this model. Optional. */
  variants?: Variant[];
};

export type VariantView = Variant & {
  /** Resolved public URL for the variant image. */
  imageSrc: string;
};

export type WatchView = Watch & {
  thumbnailSrc: string;
  /**
   * Resolved URL for the quiz variant — a `<name>-quiz.webp` sibling of the
   * thumbnail (identifying text/logos blurred), detected on disk by convention
   * and produced via `just quiz-prepare`. Equals `thumbnailSrc` when none exists.
   */
  thumbnailTestSrc: string;
  imageSrcs: string[];
  /** Resolved variant images. Empty array when the model has no variants. */
  variants: VariantView[];
};
