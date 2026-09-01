# MiniSearch — Frontend

The web UI for MiniSearch, a small search engine built to learn how crawling, indexing, and ranking actually work under the hood. This is the Next.js frontend; it talks to a separate Express + MongoDB backend ([`search-engine-api`](../search-engine-api)) for everything — search results, crawler control, and stats.

## Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS**

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — centered search box |
| `/search?q=...` | Search results (server-rendered, calls the backend directly) |
| `/admin` | Admin overview — indexed pages, domains, search terms, recent crawls |
| `/admin/crawler` | Start/stop the crawler, seed URLs, live status polling |
| `/admin/analytics` | Placeholder for query analytics (top queries, zero-result queries) |

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend must be running (see the `search-engine-api` repo) for search and admin pages to return real data — without it, pages render with an empty/fallback state instead of crashing.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:4000/api` |

Restart `npm run dev` after changing `.env.local` — Next.js only reads env vars at boot.

## Project structure

```
app/
├── page.tsx                  # Homepage
├── search/page.tsx           # Search results
└── admin/
    ├── page.tsx               # Overview + stats
    ├── crawler/page.tsx       # Crawler controls
    └── analytics/page.tsx     # Analytics placeholder

components/
├── SearchBar.tsx
├── Header.tsx
├── ResultCard.tsx
├── SearchResults.tsx
├── AdminNav.tsx
└── AdminStatCard.tsx

lib/
├── types.ts    # Shared types, mirror the backend's response shapes
└── api.ts      # fetch wrapper for the backend API
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the project |

## Notes

- The search page is a **server component** — it calls the backend during SSR, so there's no loading spinner or client-side fetch for the main results.
- The admin crawler page **is** a client component, since it needs to poll `/api/crawler/status` every few seconds.
- If you see `TypeError: Failed to fetch`, check that the backend is running, `.env.local` exists, and `NEXT_PUBLIC_API_URL` matches the backend's actual port.
