export type EditorialEntry = {
  slug: string
  title: string
  subtitle?: string
  description?: string
  author: string
  cover?: string
  pdf: string
  tier: "public" | "member" | "inner_circle" | "architect"
  readingTime?: string
}

export const EDITORIAL_CATALOGUE: EditorialEntry[] = [
  {
    slug: "ultimate-purpose-of-man",
    title: "The Ultimate Purpose of Man",
    subtitle: "Strategic Editorial — The Mandate of Alignment",
    description:
      "A flagship editorial on human purpose, from Eden’s design to modern civilisation.",
    author: "Abraham of London",
    cover: "/assets/images/books/ultimate-purpose-cover.jpg",
    pdf: "/assets/downloads/ultimate-purpose-of-man-editorial.pdf",
    tier: "public",
    readingTime: "30 minutes",
  },
]