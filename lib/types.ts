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

export type Watch = {
  id: string;
  name: string;
  /** Either a path relative to `public/watches/<brand>/` or an absolute http(s) URL. */
  thumbnail: string;
  /** Same resolution rules as `thumbnail`. */
  images: string[];
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
};
