export const siteConfig = {
  name: "Dawai",
  tagline: "An AI learning companion for documents, webpages, and video.",
  description:
    "Dawai turns documents, webpages, and educational video into source-grounded explanations, audio lessons, interactive tutoring, and practice.",
  nav: [
    { href: "/", label: "Overview" },
    { href: "/design-system", label: "Design system" },
  ],
} as const;

export type SiteNavItem = (typeof siteConfig.nav)[number];
