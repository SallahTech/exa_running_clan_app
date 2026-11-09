# Data model & API — Exa Running Clan

Companion to `README.md`. This is the shape the designs imply, written so an implementer doesn't have to invent it. Field names are snake_case for a Postgres/Supabase target; rename to suit.

Reference stack assumed below: **Expo (React Native) + Supabase** (Postgres, Auth, Storage, Realtime). Everything here maps cleanly to Firebase or a custom API if you prefer — the entities and rules are the point, not the vendor.

---

## 1. Entities

### member
The clan roster. One row per person, 1:1 with an auth user.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | = auth user id |
| member_number | int unique | displayed as "MEMBER #147"; assign sequentially on join |
| full_name | text | |
| email | text unique | from auth |
| avatar_url | text null | initials square is the fallback (first letters of first + last name) |
| pace_group | text | one of `4:30 5:00 5:30 6:00 6:30` |
| home_city | text | default 'Limassol' |
| joined_at | timestamptz | "SINCE MAR 2024" |
| kit_size | text null | "Vest — size S" |
| emergency_contact_name | text null | |
| emergency_contact_phone | text null | |
| membership_status | enum `active/lapsed/trial` | |
| membership_renews_on | date null | "renews Mar 2027" |
| notify_run_day | bool | default true |
| notify_chat | bool | default true |
| strava_athlete_id | text null | presence ⇒ "Strava sync · Connected" |
| default_days | text[] | `{tue,thu,sat}` — chosen in registration step 3 |
| role | enum `member/leader/admin` | leaders appear as pace-group leads |
| deleted_at | timestamptz null | soft delete |

### run_series
The three standing weekly sessions. Editing a series changes all future occurrences.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| slug | text unique | `tue` `thu` `sat` |
| title | text | "Track Repeats" |
| weekday | int | 0–6, ISO |
| start_time | time | 19:30 |
| timezone | text | 'Asia/Nicosia' |
| meet_point_name | text | "GSO Track, Limassol" |
| meet_lat / meet_lng | numeric | for the map view |
| distance_label | text | "6 × 800m", "16 / 20 / 24 km" |
| surface | text | "Tartan track" |
| after_label | text | "Coffee at Karma" |
| description | text | the sheet's paragraph |
| pace_groups | text[] | which groups this session runs |
| active | bool | |

### run_occurrence
One dated instance. Generate a rolling window (e.g. next 8 weeks) from each series; a row is created on demand if it doesn't exist yet.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| series_id | uuid fk → run_series | |
| starts_at | timestamptz | drives the Home countdown |
| status | enum `scheduled/cancelled/moved` | cancellations need a banner treatment (not yet designed) |
| override_meet_point_name / lat / lng | nullable | one-off route change |
| override_notes | text null | "North gate closed — park at the main entrance" |
| weather_temp_c | int null | cached, shown in early designs |

Unique on `(series_id, starts_at)`.

### rsvp
Powers every "GOING / IN / YOU'RE IN" state and all going counts.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| occurrence_id | uuid fk | |
| member_id | uuid fk | |
| pace_group | text | snapshot at RSVP time — may differ from the member's default |
| state | enum `going/out` | keep the row on cancel so counts and history stay honest |
| created_at / updated_at | timestamptz | |

Unique on `(occurrence_id, member_id)`.

### activity
A logged run — manual or imported. Feeds the week strip, the bar chart, totals, streak and the leaderboard.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| member_id | uuid fk | |
| occurrence_id | uuid fk null | null ⇒ solo run ("Solo easy · Germasogeia") |
| started_at | timestamptz | |
| distance_m | int | store metres; format km in the UI |
| moving_seconds | int | |
| avg_pace_s_per_km | int generated | `moving_seconds / (distance_m/1000)` |
| source | enum `manual/strava/import` | |
| external_id | text null unique | Strava dedupe |
| is_pb | bool | drives the "· PB 800m" flag in the logbook |
| note | text null | |

### post
Feed items. A post may be attached to an activity (then it shows the distance/pace strip).

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| author_id | uuid fk → member | |
| activity_id | uuid fk null | supplies distance + pace |
| occurrence_id | uuid fk null | "· Track repeats" label |
| body | text | |
| created_at | timestamptz | "2h", "Yesterday" |
| deleted_at | timestamptz null | |

### post_photo
| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| post_id | uuid fk | |
| storage_path | text | Supabase Storage; serve a ~1080px derivative |
| width / height | int | |
| position | int | ordering |

### kudos
| field | type | notes |
| --- | --- | --- |
| post_id | uuid fk | composite pk with member_id |
| member_id | uuid fk | |
| created_at | timestamptz | |

Count is `count(*)`; the button's on/off state is "does a row exist for me".

### comment
| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| post_id | uuid fk | |
| author_id | uuid fk | |
| body | text | |
| created_at | timestamptz | |
| deleted_at | timestamptz null | |

### run_message
Per-occurrence chat shown in the run sheet. Separate from comments — different lifecycle, different notification rules.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| occurrence_id | uuid fk | |
| author_id | uuid fk | |
| body | text | |
| created_at | timestamptz | |
| pinned | bool | for "park at the main entrance" notices |

### race
| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| name | text | "Limassol Marathon" |
| race_date | date | |
| location | text null | |
| note | text null | "Clan tent at km 30" |
| signup_url | text null | |

### race_entry
| field | type | notes |
| --- | --- | --- |
| race_id / member_id | uuid fk | composite pk |
| distance_label | text null | if the race has options |
| created_at | timestamptz | |

Count gives "22 signed up".

### challenge
The "COAST 500K · TOGETHER" bar.

| field | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| title | text | "Cyprus Coast 500K" |
| short_label | text | "COAST 500K · TOGETHER" |
| target_m | bigint | 500_000 |
| starts_on / ends_on | date | "9 days left" |
| counts_solo_runs | bool | true — the caption promises it |
| active | bool | |

Progress = sum of `activity.distance_m` for members in window. Store no denormalised total unless it gets slow; if it does, cache on `challenge.progress_m` and refresh on activity write.

---

## 2. Derived values (don't store these; compute or cache)

| UI value | Rule |
| --- | --- |
| Home countdown | next `run_occurrence` with `starts_at > now()` and `status='scheduled'`, minus now, in the club timezone |
| "42 GOING" | `count(rsvp where occurrence_id = ? and state='going')` |
| Your week (24.6 KM / 3 RUNS / 2:11) | activities in the current ISO week, Monday-start |
| Week strip (M–S) | boolean per weekday: any activity that day |
| Bar chart | 8 weekly sums of `distance_m`, oldest → current |
| Streak (11) | consecutive ISO weeks with ≥1 activity, ending this week or last |
| Km this year (312) | activities in current calendar year |
| Ring (74%) | monthly distance ÷ member's monthly target — **add a `monthly_target_m` field to member; the design shows this number but nothing sets it** |
| Leaderboard | per-member monthly sums, desc, ties broken by activity count then name; bar width = km ÷ top km |
| Your rank (#7) | position in the above |
| "N running" per pace group | RSVP counts for that occurrence grouped by `pace_group` |
| "N clan runs" (64) | activities with a non-null `occurrence_id` |

Timezone note: everything user-facing is Cyprus local (`Asia/Nicosia`, EET/EEST). Store UTC, format local, and compute week/day boundaries in the club timezone — not the device's — or a member travelling abroad sees the wrong week.

---

## 3. API surface

With Supabase most of this is generated: use views + RPC for the aggregates and RLS for permissions. If you build a REST layer, this is the contract.

### Auth
- `POST /auth/signup` → `{email, password, full_name}` → session. Creates `member` with the next `member_number`, `membership_status='trial'`.
- `POST /auth/login` → `{email, password, remember}` → session.
- `POST /auth/password-reset` → `{email}`.
- `POST /auth/strava/connect` → OAuth handoff; stores `strava_athlete_id` + tokens server-side (never on device).
- `PATCH /me` → registration steps 2 and 3 write `pace_group` and `default_days` here.

### Runs
- `GET /runs/upcoming?limit=8` → occurrences with: series fields, `going_count`, `my_rsvp`, `pace_group_counts`, and a 4-avatar `crew` preview. **One call feeds Home and Schedule.**
- `GET /runs/:occurrenceId` → the above plus full roster (`[{member_id, initials, pace_group, is_me}]`), `override_notes`, and the last N chat messages.
- `PUT /runs/:occurrenceId/rsvp` → `{state, pace_group}` → `{going_count, my_rsvp}`. Idempotent; returns the new count so the client can reconcile its optimistic update.
- `GET /runs/:occurrenceId/messages?after=` / `POST /runs/:occurrenceId/messages`.

### Activities & stats
- `POST /activities` → manual log (`started_at, distance_m, moving_seconds, occurrence_id?, note?`).
- `GET /activities?from=&to=` → the logbook list.
- `GET /me/stats` → `{week: {distance_m, runs, moving_seconds, days[7]}, weeks8: [...], year_distance_m, streak_weeks, avg_pace_s, clan_runs, rank, month_progress_pct}` — **one call feeds the whole Stats screen.**
- `GET /leaderboard?period=month` → ranked rows with `distance_m` and `is_me`.
- `POST /integrations/strava/sync` → pulls new activities; dedupe on `external_id`.

### Feed
- `GET /feed?cursor=` → posts with author, photos, `kudos_count`, `i_gave_kudos`, `comment_count`. Keyset pagination on `created_at`.
- `POST /posts` (multipart or pre-signed upload + `POST /posts` with paths).
- `PUT /posts/:id/kudos` → `{on: bool}` → `{kudos_count}`.
- `GET /posts/:id/comments` / `POST /posts/:id/comments`.

### Races, challenge, profile
- `GET /races?upcoming=true` → with `entry_count` and `i_am_entered`.
- `PUT /races/:id/entry` → `{on, distance_label?}`.
- `GET /challenges/active` → `{title, short_label, progress_m, target_m, days_left}`.
- `GET /me` / `PATCH /me` → profile + settings rows.
- `POST /me/membership/checkout` → payment session for the €25/year (Stripe; out of scope for the designs).

### Realtime / push
- Subscribe to `run_message` per open occurrence (chat), and optionally to `rsvp` for live going counts.
- Push notifications: run-day reminder the evening before for each `default_day` (respects `notify_run_day`); new pinned run message; kudos and comments on your own posts (respects `notify_chat`).

---

## 4. Permissions (RLS sketch)

- Anyone signed in reads: members (name, initials, pace group, member number — **not** email, phone or emergency contact), run series/occurrences, RSVPs, feed, races, challenge.
- A member writes only their own `member` row, RSVPs, activities, posts, kudos, comments and messages.
- `role in (leader, admin)` can edit `run_series`, create occurrences, set `override_*` and pin messages.
- `admin` can edit membership status and other members' roles.
- Emergency contact is readable only by the member themselves and admins.
- Soft-deletes everywhere (`deleted_at`) — never hard-delete a post someone commented on.

---

## 5. Seed data

The prototype's content is realistic and worth seeding for development:

- **Series**: `tue` Track Repeats (19:30, GSO Track, 6 × 800m, tartan, coffee at Karma), `thu` Seaside Tempo (06:15, Molos Promenade, 8 km tempo, flat promenade, swim at Dasoudi), `sat` Akrotiri Long Run (07:00, Akrotiri Salt Lake, 16/20/24 km, gravel + road, breakfast at Lady's Mile).
- **Pace groups** with typical turnout: 4:30 (8), 5:00 (13), 5:30 (19), 6:00 (11), 6:30 (7 — beginners, led by Stelios).
- **Members**: ~312 total; name the visible ones — Yiannis M., Elena D., Stelios C., Maria K., Andreas P., Christina L., Petros A., Sofia N., Kyriakos T., and the signed-in Anna Christodoulou (#147, 5:30).
- **Races**: Limassol Marathon 15 Mar, Petra tou Romiou 10K 4 Oct, Troodos Trail Half 9 Nov.
- **Challenge**: Cyprus Coast 500K, 310/500 km, ends in 9 days.

---

## 6. Gaps the designs don't cover

Flag these to whoever builds it — each needs a decision, and two need new screens:

1. **Monthly target** behind the 74% ring — no screen sets it.
2. **Cancelled / moved run** state (weather is a real factor in Cyprus summer) — needs a banner and a push.
3. **Log a run** form — the Home panel has a "LOG A RUN +" affordance but no screen behind it.
4. **Comments view** — the feed shows a count; there's no thread screen.
5. **Post composer** — no screen.
6. **Payment flow** for the €25 membership.
7. **Onboarding for a run's first-timer** (the 6:30 group promise) — worth a "new here?" state on the run sheet.
8. **Empty states** — new member with no activities, no posts, no upcoming run.
9. **Error and offline states** — RSVP while offline is the common one; the optimistic toggle needs a rollback + toast.
