# danielzan.com.ar

Personal website for Daniel Zanzotti ("Danielzan"), Argentine Sport Prototipo racing driver. Built with Astro and Sanity CMS, deployed on Vercel.

## Tech Stack

- **Framework:** [Astro](https://astro.build/) (static site generation, no UI framework)
- **CMS:** [Sanity](https://www.sanity.io/) v6 (content management + Studio)
- **Hosting:** [Vercel](https://vercel.com/) (static HTML output)
- **Package Manager:** pnpm (workspace with `studio/`)
- **Node:** 24.x

## Project Structure

```
├── src/
│   ├── pages/            # 4 Astro pages (home, about, media, results)
│   ├── components/       # ResultsSection, Pagination, Player, Gallery, etc.
│   ├── layouts/          # BaseLayout (header, nav, footer, view transitions)
│   ├── lib/              # GROQ queries, image URL builder, utilities
│   ├── scripts/          # Client-side JS (pagination)
│   └── styles/           # Single global.css (dark racing theme)
├── studio/               # Standalone Sanity Studio (pnpm workspace package)
│   ├── schemaTypes/      # 11 document types (post, season, raceResult, etc.)
│   └── components/       # Custom Studio inputs (DocumentTable, GalleryPhotosInput)
├── scripts/              # One-time HTML-to-Sanity migration script
├── public/               # Static assets (favicons, OG image, trophy SVGs)
└── dist/                 # Built output (gitignored)
```

## Getting Started

```bash
# Install dependencies (includes studio/ workspace)
pnpm install

# Start the Astro dev server
pnpm dev

# In a separate terminal, start Sanity Studio
pnpm studio:dev
```

- Site: `http://localhost:4321`
- Studio: `http://localhost:3333`

## Pages

| Path          | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `/`           | Home — blog posts with pagination, seasons, race results, sponsors, playlist |
| `/about`      | Biography (Sanity `about` singleton)                                         |
| `/media`      | Photo galleries + YouTube videos with filterable grid and lightbox           |
| `/resultados` | Race results and championship history with category filtering                |

## Sanity CMS

Studio URL: [danielzan.sanity.studio](https://danielzan.sanity.studio/)

### Content Types

| Type           | Description                                        |
| -------------- | -------------------------------------------------- |
| `post`         | Blog/news entries with Portable Text body          |
| `season`       | Championship seasons (year, position, category)    |
| `raceResult`   | Individual race results (date, position, category) |
| `photoGallery` | Photo galleries with image upload                  |
| `video`        | YouTube video embeds                               |
| `song`         | Audio tracks for the homepage playlist (orderable) |
| `sponsor`      | Sponsor logos and links (orderable)                |
| `team`         | Racing team logos and links (orderable)            |
| `about`        | Biography singleton                                |
| `category`     | Shared category tags for posts, results, media     |

### Schema Deploy

Schema changes are made in `studio/schemaTypes/` and deployed via:

```bash
pnpm studio:schema:deploy
```

The Studio itself is deployed separately:

```bash
pnpm studio:deploy
```

## Deployment

The site deploys to Vercel as static HTML. A Sanity webhook triggers a Vercel Deploy Hook whenever content is published in the Studio, so edits go live automatically.

### Environment Variables

| Variable       | Where               | Purpose                                             |
| -------------- | ------------------- | --------------------------------------------------- |
| `SANITY_TOKEN` | `.env` (local only) | Used by the migration script. Not needed on Vercel. |

The Sanity project ID and dataset are hardcoded in `astro.config.mjs`.

## Migrating Content

One-time migration from the old HTML site to Sanity:

1. Get a Sanity token from https://www.sanity.io/manage/project/6iq5dy0j/api#tokens
2. Run: `SANITY_TOKEN=sk_your_token pnpm migrate`

## Commands

```bash
pnpm dev                 # Start Astro dev server
pnpm build               # Build static site to dist/
pnpm preview             # Preview built site
pnpm migrate             # Import old HTML content to Sanity
pnpm studio:dev          # Run Sanity Studio locally
pnpm studio:build        # Build Sanity Studio
pnpm studio:deploy       # Deploy Studio to sanity.studio
pnpm studio:schema:deploy # Deploy schema changes only
```
