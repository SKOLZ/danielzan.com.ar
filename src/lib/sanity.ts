import { sanityClient } from "sanity:client";
import { defineQuery } from "groq";
import { createImageUrlBuilder } from "@sanity/image-url";

const builder = createImageUrlBuilder(sanityClient.config());

export function urlFor(source: unknown) {
  return builder.image(source);
}

export const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    year,
    "category": category->title,
    body,
    mainImage {
      asset->{ _id, url, metadata { lqip, dimensions } }
    }
  }
`);

export const POSTS_COUNT_QUERY = defineQuery(`
  count(*[_type == "post" && defined(slug.current)])
`);

export const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    publishedAt,
    body,
    excerpt,
    year,
    "category": category->title,
    mainImage {
      asset->{ _id, url, metadata { lqip, dimensions } }
    }
  }
`);

export const SEASONS_QUERY = defineQuery(`
  *[_type == "season"] | order(year desc) {
    _id,
    year,
    finalPosition,
    "category": category->title
  }
`);

export const ALL_RESULTS_QUERY = defineQuery(`
  *[_type == "raceResult"] | order(date desc) {
    _id,
    date,
    position,
    "category": category->title
  }
`);

export const RECENT_RESULTS_QUERY = defineQuery(`
  *[_type == "raceResult"] | order(date desc) [0...20] {
    _id,
    date,
    position,
    "category": category->title
  }
`);

export const PHOTO_GALLERIES_QUERY = defineQuery(`
  *[_type == "photoGallery"] {
    _id,
    title,
    "category": category->title,
    photos[] {
      _key,
      asset
    }
  }
`);

export const VIDEOS_QUERY = defineQuery(`
  *[_type == "video"] | order(_createdAt desc) {
    _id,
    title,
    youtubeId,
    description,
    "category": category->title
  }
`);

export const SONGS_QUERY = defineQuery(`
  *[_type == "song"] | order(coalesce(orderRank, "zzzzz") asc) {
    _id,
    title,
    audio {
      asset->{ _id, url }
    }
  }
`);

export const ABOUT_QUERY = defineQuery(`
  *[_type == "about"][0] {
    _id,
    title,
    body
  }
`);

export const TEAM_QUERY = defineQuery(`
  *[_type == "team"] | order(coalesce(orderRank, "zzzzz") asc) {
    _id,
    name,
    logo {
      asset->{ _id, url }
    },
    url
  }
`);

export const SPONSORS_QUERY = defineQuery(`
  *[_type == "sponsor"] | order(coalesce(orderRank, "zzzzz") asc) {
    _id,
    name,
    logo {
      asset->{ _id, url }
    },
    url
  }
`);
