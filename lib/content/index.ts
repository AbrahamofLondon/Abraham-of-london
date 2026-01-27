// lib/content/index.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/index.ts
 * -----------------------------------------------------------------------------
 * Contentlayer “facade” for server-side usage (Pages Router safe).
 * - Always returns arrays (never undefined)
 * - Caches the snapshot per process to avoid repeated work during builds
 * - Exposes both:
 *   1) raw collections (allPosts, allBooks, ...)
 *   2) convenience getters (getAllPosts, getAllBooks, ...)
 *
 * IMPORTANT:
 * - Keep this file SERVER-ONLY in practice. Do not import it from client components.
 */

import { getContentlayerData } from "@/lib/content/server";

type AnyDoc = Record<string, any>;
type CollectionKey =
  | "allPosts"
  | "allBooks"
  | "allDownloads"
  | "allEvents"
  | "allPrints"
  | "allResources"
  | "allStrategies"
  | "allCanons"
  | "allShorts"
  // optional / extended vault types (safe to be empty)
  | "allArticles"
  | "allGuides"
  | "allTutorials"
  | "allCaseStudies"
  | "allWhitepapers"
  | "allReports"
  | "allNewsletters"
  | "allSermons"
  | "allDevotionals"
  | "allPrayers"
  | "allTestimonies"
  | "allPodcasts"
  | "allVideos"
  | "allCourses"
  | "allLessons";

type Snapshot = Record<CollectionKey, AnyDoc[]>;

let _snapshot: Snapshot | null = null;

function asArray(x: any): AnyDoc[] {
  return Array.isArray(x) ? x : [];
}

function buildSnapshot(): Snapshot {
  const data = getContentlayerData() as any;

  return {
    // canonical contentlayer keys you already use
    allPosts: asArray(data?.allPosts),
    allBooks: asArray(data?.allBooks),
    allDownloads: asArray(data?.allDownloads),
    allEvents: asArray(data?.allEvents),
    allPrints: asArray(data?.allPrints),
    allResources: asArray(data?.allResources),
    allStrategies: asArray(data?.allStrategies),
    allCanons: asArray(data?.allCanons),
    allShorts: asArray(data?.allShorts),

    // optional “vault expansion” keys — safe fallback to []
    allArticles: asArray(data?.allArticles),
    allGuides: asArray(data?.allGuides),
    allTutorials: asArray(data?.allTutorials),
    allCaseStudies: asArray(data?.allCaseStudies),
    allWhitepapers: asArray(data?.allWhitepapers),
    allReports: asArray(data?.allReports),
    allNewsletters: asArray(data?.allNewsletters),
    allSermons: asArray(data?.allSermons),
    allDevotionals: asArray(data?.allDevotionals),
    allPrayers: asArray(data?.allPrayers),
    allTestimonies: asArray(data?.allTestimonies),
    allPodcasts: asArray(data?.allPodcasts),
    allVideos: asArray(data?.allVideos),
    allCourses: asArray(data?.allCourses),
    allLessons: asArray(data?.allLessons),
  };
}

function getSnapshot(): Snapshot {
  if (_snapshot) return _snapshot;
  _snapshot = buildSnapshot();
  return _snapshot;
}

function isDraft(doc: any): boolean {
  return Boolean(doc?.draft);
}

function isPublished(doc: any): boolean {
  // if published flag exists and is false → not published
  if (typeof doc?.published === "boolean") return doc.published !== false;
  // otherwise draft drives publication
  return !isDraft(doc);
}

function publishedOnly<T extends AnyDoc>(docs: T[]): T[] {
  return docs.filter(isPublished);
}

function getCollection(key: CollectionKey): AnyDoc[] {
  const snap = getSnapshot();
  return asArray(snap[key]);
}

/* -------------------------------------------------------------------------- */
/* Raw exports (arrays)                                                       */
/* -------------------------------------------------------------------------- */

export const allPosts = getCollection("allPosts");
export const allBooks = getCollection("allBooks");
export const allDownloads = getCollection("allDownloads");
export const allEvents = getCollection("allEvents");
export const allPrints = getCollection("allPrints");
export const allResources = getCollection("allResources");
export const allStrategies = getCollection("allStrategies");
export const allCanons = getCollection("allCanons");
export const allShorts = getCollection("allShorts");

// Optional / extended vault exports
export const allArticles = getCollection("allArticles");
export const allGuides = getCollection("allGuides");
export const allTutorials = getCollection("allTutorials");
export const allCaseStudies = getCollection("allCaseStudies");
export const allWhitepapers = getCollection("allWhitepapers");
export const allReports = getCollection("allReports");
export const allNewsletters = getCollection("allNewsletters");
export const allSermons = getCollection("allSermons");
export const allDevotionals = getCollection("allDevotionals");
export const allPrayers = getCollection("allPrayers");
export const allTestimonies = getCollection("allTestimonies");
export const allPodcasts = getCollection("allPodcasts");
export const allVideos = getCollection("allVideos");
export const allCourses = getCollection("allCourses");
export const allLessons = getCollection("allLessons");

/* -------------------------------------------------------------------------- */
/* Getter exports (functions)                                                 */
/* -------------------------------------------------------------------------- */

export const getAllPosts = () => publishedOnly(getCollection("allPosts"));
export const getAllBooks = () => publishedOnly(getCollection("allBooks"));
export const getAllDownloads = () => publishedOnly(getCollection("allDownloads"));
export const getAllEvents = () => publishedOnly(getCollection("allEvents"));
export const getAllPrints = () => publishedOnly(getCollection("allPrints"));
export const getAllResources = () => publishedOnly(getCollection("allResources"));
export const getAllStrategies = () => publishedOnly(getCollection("allStrategies"));
export const getAllCanons = () => publishedOnly(getCollection("allCanons"));
export const getAllShorts = () => publishedOnly(getCollection("allShorts"));

// Optional / extended vault getters
export const getAllArticles = () => publishedOnly(getCollection("allArticles"));
export const getAllGuides = () => publishedOnly(getCollection("allGuides"));
export const getAllTutorials = () => publishedOnly(getCollection("allTutorials"));
export const getAllCaseStudies = () => publishedOnly(getCollection("allCaseStudies"));
export const getAllWhitepapers = () => publishedOnly(getCollection("allWhitepapers"));
export const getAllReports = () => publishedOnly(getCollection("allReports"));
export const getAllNewsletters = () => publishedOnly(getCollection("allNewsletters"));
export const getAllSermons = () => publishedOnly(getCollection("allSermons"));
export const getAllDevotionals = () => publishedOnly(getCollection("allDevotionals"));
export const getAllPrayers = () => publishedOnly(getCollection("allPrayers"));
export const getAllTestimonies = () => publishedOnly(getCollection("allTestimonies"));
export const getAllPodcasts = () => publishedOnly(getCollection("allPodcasts"));
export const getAllVideos = () => publishedOnly(getCollection("allVideos"));
export const getAllCourses = () => publishedOnly(getCollection("allCourses"));
export const getAllLessons = () => publishedOnly(getCollection("allLessons"));

/* -------------------------------------------------------------------------- */
/* Simple utility: flatten everything                                          */
/* -------------------------------------------------------------------------- */

export function getAllContent(): AnyDoc[] {
  const snap = getSnapshot();
  const all = Object.values(snap).flat();
  return publishedOnly(all);
}

/* Default export (handy for server utilities) */
const Content = {
  // raw
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allShorts,
  allArticles,
  allGuides,
  allTutorials,
  allCaseStudies,
  allWhitepapers,
  allReports,
  allNewsletters,
  allSermons,
  allDevotionals,
  allPrayers,
  allTestimonies,
  allPodcasts,
  allVideos,
  allCourses,
  allLessons,

  // getters
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  getAllCanons,
  getAllShorts,
  getAllArticles,
  getAllGuides,
  getAllTutorials,
  getAllCaseStudies,
  getAllWhitepapers,
  getAllReports,
  getAllNewsletters,
  getAllSermons,
  getAllDevotionals,
  getAllPrayers,
  getAllTestimonies,
  getAllPodcasts,
  getAllVideos,
  getAllCourses,
  getAllLessons,

  getAllContent,
};

export default Content;