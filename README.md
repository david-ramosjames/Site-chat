# RJL-Chat

Multi-tenant embeddable chat intake widget + admin built for Ramos James Law and any
additional businesses managed from the same dashboard.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Zod.
Railway-ready.

---

## What's in here

- **`/`** — redirects straight to `/admin` (no public marketing page).
- **`/admin`** — list of all businesses, "+ Add business" CTA.
- **`/admin/new`** — create-business form.
- **`/admin/[clientId]`** — per-business sections:
  - Overview (lead stats + recent leads + widget status)
  - Widget settings (with live preview)
  - Install script (copyable snippet, preview link)
  - Flow builder (reorderable steps, all 8 input types, optional image/video media)
  - Feature toggles (16 toggles across 4 groups)
  - Notifications (email, SMS, Slack, CRM, Google Sheet)
  - Leads list + Lead detail (transcript, answers, source, internal notes, status)
- **`/demo`** — preview the widget against any client (defaults to the first one) so you can
  test the chat without leaving the dashboard. `?clientId=…` to switch.
- **`/widget.js`** — the embeddable script (Shadow DOM, no dependencies).
- **API routes** under `src/app/api`:
  - `GET /api/widget-config?clientId=…`
  - `POST /api/leads`
  - `GET /api/admin/leads?clientId=…`, `GET|PATCH /api/admin/leads/:id`
  - `GET|POST /api/admin/clients`
  - `PUT /api/admin/clients/:id/{settings,features,flow,notifications}`
- **Prisma schema** in `prisma/schema.prisma` with an initial SQL migration.
- **Seed** in `prisma/seed.ts` creates **Ramos James Law** and **Trucking Chicas**.

The schema is multi-tenant by row (`clientId` on every table); the admin UI is now a true
multi-tenant dashboard. Add real auth before exposing the admin publicly.

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

- `http://localhost:3000` → redirects to `/admin`
- `http://localhost:3000/admin` — pick Ramos James Law or Trucking Chicas
- `http://localhost:3000/admin/new` — add another business
- `http://localhost:3000/demo?clientId=ramos-james-law` — test the widget

---

## Install script (what each business pastes on their site)

The Install screen for a business renders something like:

```html
<script
  src="https://YOUR-RJL-CHAT-DOMAIN/widget.js"
  data-client-id="ramos-james-law"
  async>
</script>
```

Paste before `</body>`, or use a WordPress/Webflow/Squarespace/Shopify header/footer
plugin. The widget loads asynchronously, renders inside a Shadow DOM, and won't affect
host-site styles.

`data-client-id` is what scopes the widget to that business — every flow, color, lead, and
notification setting is keyed off it.

---

## Adding a new business

Two ways:

1. **Admin UI** (preferred): `/admin → + Add business`. Fills in name + industry + website,
   then drops you into the new business's Settings page so you can brand the widget and
   build the flow.
2. **Seed it**: edit `prisma/seed.ts`, add another entry to the `clients` array, and run
   `npm run db:seed`. Idempotent — re-running is safe.

---

## Deploying to Railway

1. Project → New → Database → Add **PostgreSQL**.
2. Site-chat service → **Variables** → reference `Postgres.DATABASE_URL`, and add
   `NEXT_PUBLIC_APP_URL=https://your-railway-domain` (no trailing slash).
3. `railway.json` / `nixpacks.toml` handle the build (`npm run build`) and the start
   (`npx prisma migrate deploy && npm run start`).
4. After first deploy run the seed once via the Railway CLI (`railway run npm run db:seed`)
   or the start-command trick described in the README history.

---

## Media handling

URLs only — nothing is uploaded to the app server. In the flow builder, paste hosted URLs
from Cloudflare R2, S3, Supabase Storage, YouTube/Vimeo, etc.

---

## Security & reliability basics

- `clientId` validated on every widget request.
- CORS allowlisted for `/widget.js`, `/api/widget-config`, `/api/leads`.
- Zod validation on every request body.
- In-memory rate limiter (`src/lib/rate-limit.ts`) — swap for Redis when you scale beyond
  a single replica.
- Simple spam heuristics (`src/lib/spam.ts`) — replace with Turnstile/hCaptcha later.
- Notification dispatch (`src/lib/notifications.ts`) is stubbed with `console.log` for
  email/SMS and a generic POST for Slack/CRM/Sheet webhooks.

---

## Next steps

- Real admin auth (NextAuth, Clerk, or simple password gate using `ADMIN_PASSWORD`).
- Per-user → per-client membership table (so different staff can be scoped to one or many
  businesses).
- AI lead summary + lead scoring via Claude API (toggles already exist).
- File uploads to R2/S3.
- Custom domains per client (via Cloudflare CNAME → Railway).
