/**
 * Uploads the sample photography into Supabase Storage and points the seeded
 * rows at it.
 *
 *   node scripts/generate-photos.mjs     # draw the placeholder scenes first
 *   node scripts/seed-photos.mjs
 *
 * To use the clan's real photographs instead, drop files with the same names
 * into a folder and pass it:
 *
 *   node scripts/seed-photos.mjs --from ./my-photos
 *
 * Nothing here uses a service-role key. It signs in as each author and each
 * leader with the seed password and writes only what that member is allowed to
 * write, so this doubles as a live test of the storage policies: a wrong path is
 * refused rather than silently succeeding.
 *
 * Plain fetch rather than supabase-js — the client pulls in a realtime
 * connection that wants a WebSocket Node 20 doesn't have, and a script that
 * uploads six files has no use for it.
 *
 * Requires migration 0004 (the photos bucket) to be applied.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const fromArg = process.argv.indexOf('--from');
const PHOTO_DIR = fromArg > -1 ? process.argv[fromArg + 1] : join(HERE, 'photos');

const PASSWORD = 'exaclan2026';

// ---------------------------------------------------------------- env

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !ANON) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY in .env');
  process.exit(1);
}

// ---------------------------------------------------------------- plan
//
// Each feed post keeps the author who wrote it: storage policy only lets a
// member write inside posts/<their own id>/.

const FEED = [
  { email: 'elena@exaclan.cy', file: 'feed-molos.png' },
  { email: 'stelios@exaclan.cy', file: 'feed-track.png' },
  { email: 'maria@exaclan.cy', file: 'feed-salt-lake.png' },
];

// Run heroes are club photography — the runs/ folder is leaders only.
const HEROES = [
  { slug: 'tue', file: 'hero-tue.png' },
  { slug: 'thu', file: 'hero-thu.png' },
  { slug: 'sat', file: 'hero-sat.png' },
];

const LEADER = 'yiannis@exaclan.cy';

// ---------------------------------------------------------------- helpers

async function signIn(email) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    throw new Error(`sign in ${email}: ${body.msg ?? body.error_description ?? res.status}`);
  }
  return { token: body.access_token, userId: body.user.id };
}

const auth = (token) => ({ apikey: ANON, Authorization: `Bearer ${token}` });

function read(file) {
  try {
    return readFileSync(join(PHOTO_DIR, file));
  } catch {
    throw new Error(
      `Missing ${file} in ${PHOTO_DIR}. Run "node scripts/generate-photos.mjs" first, ` +
        'or pass --from <dir> with your own photographs.',
    );
  }
}

const contentType = (file) =>
  file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

async function upload(token, path, file) {
  const res = await fetch(`${URL}/storage/v1/object/${encodeURI(path)}`, {
    method: 'POST',
    headers: {
      ...auth(token),
      'Content-Type': contentType(file),
      'x-upsert': 'true',
    },
    body: read(file),
  });
  if (!res.ok) {
    throw new Error(`upload ${path}: ${res.status} ${await res.text()}`);
  }
  return path;
}

async function rest(token, path, init = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...auth(token), 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------- feed photos

let count = 0;

for (const item of FEED) {
  const { token, userId } = await signIn(item.email);

  const rows = await rest(
    token,
    `post_photo?select=id,storage_path,post!inner(author_id)&post.author_id=eq.${userId}`,
  );

  if (!rows || rows.length === 0) {
    console.log(`· ${item.email}: no seeded photo row, skipping`);
    continue;
  }

  const path = await upload(token, `photos/posts/${userId}/${item.file}`, item.file);
  // The row stores the path inside the bucket, not including the bucket name.
  const stored = path.replace(/^photos\//, '');

  await rest(token, `post_photo?id=eq.${rows[0].id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ storage_path: stored, width: 1080, height: 720 }),
  });

  console.log(`✓ ${item.email.padEnd(24)} → ${stored}`);
  count += 1;
}

// ---------------------------------------------------------------- run heroes

const { token: leaderToken } = await signIn(LEADER);

for (const hero of HEROES) {
  const path = await upload(leaderToken, `photos/runs/${hero.slug}/${hero.file}`, hero.file);
  const stored = path.replace(/^photos\//, '');

  await rest(leaderToken, `run_series?slug=eq.${hero.slug}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ hero_photo_path: stored }),
  });

  console.log(`✓ hero ${hero.slug.padEnd(19)} → ${stored}`);
  count += 1;
}

console.log(`\n${count} images uploaded and linked.`);
