# Home Karigar — Studio admin

Admin panel for the Home Karigar website: sign in, add homes with all their photographs room by room, choose
the cover and the order, and browse every photograph. Everything is saved through the backend API
(`~/Desktop/home_karigar_backend`, FastAPI + PostgreSQL); this app keeps no data of its own.

```bash
# 1. start the API (see its README)  →  http://localhost:8000
# 2. then:
npm install
cp .env.example .env.local      # API_URL, SITE_ORIGIN
npm run dev                     # http://localhost:3200
```

Sign in with the admin account the API created (default `admin@homekarigar.in` / `Karigar@2026`).

## How it talks to the API

| Admin | API |
| --- | --- |
| Sign in (`src/app/login/actions.ts`) | `POST /auth/login` — the token is kept in an httpOnly cookie |
| Homes, gallery, stats | `GET /projects` |
| Edit page | `GET /projects/{id}` |
| Create / save details | `POST /projects`, `PATCH /projects/{id}` |
| Order of homes | `PATCH /projects/{id}` with `position` |
| Cover, room, move, remove photo | `PATCH /projects/{id}` with `coverImageId` / `images` |
| Delete home | `DELETE /projects/{id}` |
| Upload (`src/app/api/projects/[id]/images`) | `POST /projects/{id}/images` — one file per request, for progress bars |

All calls go through `src/lib/api.ts` on the server. When the API rejects the token, the admin is sent to
`/session-expired`, which clears the cookie and returns to sign-in.

Photos are absolute URLs: uploads from the API's `/media`, existing photos from the website's `/images`
(both allowed in `next.config.ts`).

## Seeding the website's original homes

`npm run seed` uploads the homes the website used to hard-code (`scripts/seed-data.json`: the 8 showcased homes, their
names, areas, rooms and covers — 131 photographs) through the same API: it signs in, creates each home, uploads every
photo to its room and sets the cover. The files are read from `../redesign-home-karigar/public` (override with
`IMAGES_DIR`). After this the website shows them from `GET /public/projects`, and they are edited here like any other home.

```bash
ADMIN_EMAIL=admin@homekarigar.in ADMIN_PASSWORD=… npm run seed   # prompts for whichever is missing
npm run seed -- --dry-run      # only check the data and that every photo file exists
npm run seed -- --replace      # delete and re-upload homes that already exist (matched by slug)
```

Homes already in the admin are skipped, so running it twice is harmless.
