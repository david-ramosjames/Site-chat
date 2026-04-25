# ChatToConvert

Intaker-style embeddable lead qualification chat widget + admin dashboard, built for
home services & high-value service businesses (HVAC, plumbing, roofing, electricians,
restoration, pest control, contractors).

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Zod.
Railway-ready.

---

## What's in here

- **`/`** — public marketing page.
- **`/admin`** — admin dashboard (overview, widget settings, install script, flow builder,
  feature toggles, notifications, leads list, lead detail).
- **`/demo`** — a page that embeds `widget.js` so you can preview the end-user widget.
- **`/widget.js`** — the embeddable script (Shadow DOM, no external dependencies).
- **API routes** under `src/app/api`:
  - `GET /api/widget-config?clientId=…`
  - `POST /api/leads`
  - `GET /api/admin/leads`, `GET|PATCH /api/admin/leads/:id`
  - `GET|POST /api/admin/clients`
  - `PUT /api/admin/clients/:id/settings`
  - `PUT /api/admin/clients/:id/features`
  - `PUT /api/admin/clients/:id/flow`
  - `PUT /api/admin/clients/:id/notifications`
- **Prisma schema** in `prisma/schema.prisma` with an initial SQL migration.
- **Seed** in `prisma/seed.ts` creates one demo client — *Austin HVAC Pros*.

Multi-tenant from day one: every row belongs to a `Client`. The admin UI is scoped to a
single demo tenant (`demo-austin-hvac`) for MVP; swap for real auth when you're ready.

---

## Local setup

```bash
cp .env.example .env
# Set DATABASE_URL to your Postgres instance

npm install
npx prisma migrate deploy   # or: npx prisma db push  for a quick start
npm run db:seed
npm run dev
```

Then visit:

- `http://localhost:3000` — marketing page
- `http://localhost:3000/admin` — admin dashboard
- `http://localhost:3000/demo` — widget preview

---

## Install script (what customers paste)

```html
<script
  src="https://YOUR-DOMAIN/widget.js"
  data-client-id="YOUR_CLIENT_ID"
  async>
</script>
```

Paste this before `</body>`, or use a WordPress/Webflow/Squarespace/Shopify header/footer
plugin. The widget loads asynchronously, renders inside a Shadow DOM, and won't affect
host-site styles.

---

## Deploying to Railway

1. Create a Railway project with a **PostgreSQL** plugin and a **web service** pointed at
   this repo.
2. Set env vars:
   - `DATABASE_URL` (from the Postgres plugin)
   - `NEXT_PUBLIC_APP_URL` (e.g. `https://chatto-convert.com`)
3. Railway reads `railway.json` / `nixpacks.toml`:
   - **Build:** `npm ci && npx prisma generate && npm run build`
   - **Start:** `npx prisma migrate deploy && npm run start`
4. After first deploy, run `npm run db:seed` once (Railway shell) to load the demo client.

---

## Media handling

The MVP stores media as URLs — nothing is uploaded to the app server. Paste hosted URLs
in the flow builder:

- Images: Cloudflare R2, S3, Supabase Storage, or any CDN.
- Videos: YouTube/Vimeo embed URLs, or `.mp4` hosted on a CDN.

---

## Security & reliability basics

- `clientId` validated on every widget request.
- CORS allowlisted for `/widget.js`, `/api/widget-config`, `/api/leads`.
- Zod validation on every request body.
- In-memory rate limiter (`src/lib/rate-limit.ts`) — swap for Redis in production.
- Simple spam heuristics (`src/lib/spam.ts`) — replace with Turnstile/hCaptcha.
- Notification dispatch (`src/lib/notifications.ts`) is stubbed with `console.log` for
  email/SMS and a generic POST for Slack/CRM/Sheet webhooks.

---

## Next steps

- Real admin auth (NextAuth, Clerk, or simple password gate using `ADMIN_PASSWORD`).
- Per-client dashboards (route: `/admin/[clientId]`).
- AI lead summary + lead scoring via Claude API (see the feature toggles).
- File uploads to R2/S3.
- Custom domains per client.
