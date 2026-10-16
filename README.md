# Mossy Hop

A side-scrolling hopper: guide Mossy, one very bouncy, fluffy friend, through ten
increasingly wild worlds, from Mossy Meadow to the Cosmic Garden. Your best score
for each level is saved in your browser.

**Play it:** https://alexbaillie.github.io/mossy-hop/

## Controls

| Action | Keys |
| --- | --- |
| Move | ← → or A / D |
| Jump | Space, ↑ or W |

## Development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # production build + render check
npm run lint
```

The game is built with [vinext](https://github.com/cloudflare/vinext) (Next.js on
Vite), React 19 and Tailwind 4. Almost all of it lives in `app/page.tsx` and
`app/globals.css`; the art is in `public/`.

## Deployment

**GitHub Pages** is deployed automatically by `.github/workflows/pages.yml` on every
push to `main`. It builds a static export with `GITHUB_PAGES=true`, which sets the
`/mossy-hop` base path. To try that build locally:

```bash
GITHUB_PAGES=true npm run build   # output in dist/client/
```

**Cloudflare Workers** hosts it at https://mossy-hop.alexbaillie.workers.dev
(`worker/index.ts`, `wrangler.jsonc`). Log in once with `npx wrangler login`, then:

```bash
npm run deploy:cloudflare
```

That builds the game and publishes it. The script sets `NEXT_PUBLIC_SITE_URL` so the
social preview image points at the Cloudflare address.

Every push to `main` also deploys to Cloudflare automatically through
`.github/workflows/cloudflare.yml`. It needs two repository secrets,
`CLOUDFLARE_API_TOKEN` (an API token with the "Edit Cloudflare Workers" permission)
and `CLOUDFLARE_ACCOUNT_ID`; until they are set the workflow skips with a warning.
