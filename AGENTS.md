# danielzan.com.ar

Website for Daniel Zanzotti ("Danielzan"), Argentine Sport Prototipo racing driver.

## Tech Stack

- **Framework:** Astro (static site generation, no UI framework)
- **CMS:** Sanity (Studio lives in `studio/`, deployed to https://danielzan.sanity.studio/)
- **Hosting:** Vercel (SSG, auto-rebuild via webhook)

## Sanity Schema

Document types deployed to project `6iq5dy0j`, dataset `production`:

| `name` (English) | `title` (Studio, Spanish) |
|---|---|
| `post` | Entrada |
| `season` | Temporada |
| `raceResult` | Resultado |
| `photoGallery` | Galería |
| `video` | Video |
| `song` | Canción |
| `sponsor` | Auspiciante |
| `team` | Equipo (singleton) |
| `about` | Sobre mí (singleton) |

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Build static site (outputs to dist/)
npm run preview   # Preview built site
npm run migrate   # Import old HTML content to Sanity (set SANITY_TOKEN first)
```

## Studio (local, in `studio/`)

```bash
npm run studio:dev        # Run Studio locally (http://localhost:3333)
npm run studio:build      # Build Studio (outputs to studio/dist/)
npm run studio:deploy     # Deploy Studio to https://danielzan.sanity.studio (requires `sanity login`)
```

The Studio is a standalone Sanity v6 project in `studio/`. Schema changes are
made in `studio/schemaTypes/` and deployed with `npm run studio:deploy` (or
`sanity schema deploy` for the deployed schema doc). The Sanity webhook
triggers a Vercel rebuild on publish, so Studio edits go live automatically.

## Migrating content

1. Get a Sanity token from https://www.sanity.io/manage/project/6iq5dy0j/api#tokens
2. Run: `SANITY_TOKEN=sk_your_token npm run migrate`

## Deployment

The site deploys to Vercel as static HTML. A Sanity webhook triggers a Vercel Deploy Hook whenever content is published, auto-rebuilding the site.

## Studio

Studio URL: https://danielzan.sanity.studio/
