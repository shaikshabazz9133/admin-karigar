/**
 * Uploads the homes the website used to hard-code (scripts/seed-data.json) into the backend, through the same API the
 * admin panel uses: sign in → POST /projects → POST /projects/{id}/images for every photograph (with its room) →
 * PATCH the cover. After this the website reads them from GET /public/projects like any home added in the admin.
 *
 *   ADMIN_EMAIL=admin@homekarigar.in ADMIN_PASSWORD=… npm run seed
 *   npm run seed -- --replace          # delete and re-upload homes that already exist (same slug)
 *   npm run seed -- --dry-run          # check the data and files, upload nothing
 *
 * Env: API_URL (default from .env.local, else http://localhost:8000/api/v1), ADMIN_EMAIL / ADMIN_PASSWORD (prompted
 * when missing), IMAGES_DIR (default ../redesign-home-karigar/public — where the photos' /images/... paths live).
 *
 * Homes that already exist are skipped, so it is safe to run again. A home whose upload fails part-way is removed so
 * the next run starts it cleanly.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const args = new Set(process.argv.slice(2));
const REPLACE = args.has("--replace");
const DRY_RUN = args.has("--dry-run");

/* ── Config ─────────────────────────────────────────────── */
function envLocal(key) {
  const file = join(root, ".env.local");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${key}=`));
  return line?.split("=").slice(1).join("=").trim() || undefined;
}

const API_URL = (process.env.API_URL ?? envLocal("API_URL") ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
const IMAGES_DIR = resolve(process.env.IMAGES_DIR ?? join(root, "../redesign-home-karigar/public"));
const homes = JSON.parse(readFileSync(join(here, "seed-data.json"), "utf8"));
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/* ── Helpers ────────────────────────────────────────────── */
function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : "");
  return new Promise((ok) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      ok(answer.trim());
    }),
  );
}

let token;
async function call(path, init = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(typeof init.body === "string" && { "Content-Type": "application/json" }),
      },
    });
  } catch {
    throw new Error(`Can't reach the API at ${API_URL}. Is the backend running?`);
  }
  if (res.status === 204) return undefined;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${body.detail ?? res.statusText}`);
  return body;
}

const fileFor = (src) => join(IMAGES_DIR, decodeURI(src));

/* ── Check the data before touching the API ─────────────── */
const missing = homes.flatMap((h) => [h.cover, ...h.images.map((i) => i.src)]).filter((src) => !existsSync(fileFor(src)));
if (missing.length) {
  console.error(`✗ ${missing.length} photo(s) not found under ${IMAGES_DIR}:\n  ${[...new Set(missing)].join("\n  ")}`);
  process.exit(1);
}
const total = homes.reduce((n, h) => n + h.images.length, 0);
console.log(`${homes.length} homes, ${total} photographs, from ${IMAGES_DIR}`);
if (DRY_RUN) {
  console.log("✓ All files present (dry run — nothing uploaded).");
  process.exit(0);
}

/* ── Sign in ────────────────────────────────────────────── */
const email = process.env.ADMIN_EMAIL ?? (await ask("Admin email: "));
const password = process.env.ADMIN_PASSWORD ?? (await ask("Password: ", { hidden: true }));
token = (await call("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })).accessToken;
console.log(`✓ Signed in to ${API_URL}`);

/* ── Upload ─────────────────────────────────────────────── */
const existing = new Map((await call("/projects")).map((p) => [p.slug, p]));
let created = 0;
let uploaded = 0;

// The API puts each new home first on the website, so create them last-to-first to keep the seed order.
for (const home of [...homes].reverse()) {
  const label = `Flat ${home.flatNo} · ${home.name}`;
  const found = existing.get(home.slug);
  if (found && !REPLACE) {
    console.log(`– ${label}: already in the admin (${found.photoCount} photos), skipped`);
    continue;
  }
  if (found) {
    await call(`/projects/${found.id}`, { method: "DELETE" });
    console.log(`– ${label}: deleted the existing copy`);
  }

  const { name, flatNo, configuration, development, community, area } = home;
  const project = await call("/projects", {
    method: "POST",
    body: JSON.stringify({ name, flatNo, configuration, development, community, area }),
  });
  if (project.slug !== home.slug) console.warn(`  ! slug is ${project.slug}, expected ${home.slug}`);

  try {
    const ids = new Map();
    // The cover is normally one of the photos; if not, upload it too (as Interiors).
    const photos = home.images.some((i) => i.src === home.cover)
      ? home.images
      : [...home.images, { src: home.cover, room: "Interiors" }];
    for (const [n, img] of photos.entries()) {
      const file = fileFor(img.src);
      const form = new FormData();
      form.append("room", img.room);
      form.append("files", new Blob([readFileSync(file)], { type: MIME[extname(file).toLowerCase()] }), basename(file));
      const { images, errors } = await call(`/projects/${project.id}/images`, { method: "POST", body: form });
      if (!images.length) throw new Error(`${img.src}: ${errors[0]?.error ?? "rejected"}`);
      ids.set(img.src, images[0].id);
      uploaded++;
      if (process.stdout.isTTY) process.stdout.write(`\r  ${label}: ${n + 1}/${photos.length} photos`);
    }
    await call(`/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ coverImageId: ids.get(home.cover) }) });
    process.stdout.write(`${process.stdout.isTTY ? "\r" : ""}✓ ${label}: ${photos.length} photos, cover set\n`);
    created++;
  } catch (e) {
    process.stdout.write("\n");
    await call(`/projects/${project.id}`, { method: "DELETE" }).catch(() => {});
    throw new Error(`${label} failed and was removed — run again to retry.\n  ${e.message}`);
  }
}

console.log(`\nDone: ${created} home(s) and ${uploaded} photo(s) uploaded.`);
