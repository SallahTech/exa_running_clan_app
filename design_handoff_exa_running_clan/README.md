# Handoff: Exa Running Clan — mobile app

## Overview
A mobile app for Exa Running Clan, a ~312-member running group in Limassol, Cyprus with three fixed weekly runs. The app covers: finding and RSVPing to those runs, pace-group sign-up, personal mileage tracking, a clan leaderboard and challenge, a social feed, per-run chat, membership/profile, and account creation + sign-in.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show intended look, copy and behaviour. They are **not production code to copy**. The task is to **recreate these designs in the target codebase's existing environment** (React Native, Expo, Swift/SwiftUI, Kotlin/Compose, Flutter, or a React web PWA) using its established patterns, component library and navigation. If no codebase exists yet, pick the framework that fits the team and rebuild the designs there.

The prototype is a single HTML file using a small in-house component runtime. Do not attempt to port that runtime — read it as a spec.

## Fidelity
**High fidelity.** Final colors, typography, spacing, copy, states and motion are all specified. Recreate pixel-close, substituting the codebase's own primitives (buttons, sheets, lists) where they exist.

Screens were designed at **390 × 844** (iPhone 14/15 logical size). All values below are in CSS px at that width — treat them as points/dp.

## Brand & Design Tokens

Palette (derived from the clan logo: black ground, red type):

| Token | Value | Use |
| --- | --- | --- |
| accent | `#ee1c2a` | primary actions, active states, kickers, emphasis |
| accent-deep | `#a70d18` | gradient end, pressed state |
| accent-warm | `#ff7a4d` | gradient end on the clan-challenge bar only |
| accent-tint-light | `#ffe3e5` | "You" row highlight (light theme) |
| accent-tint-dark | `rgba(238,28,42,.24)` | "You" row highlight (dark theme) |
| accent-on-dark | `#ff8a90` | small accent labels on near-black fields |
| ink | `#0b0b0d` | primary text, rules, dark fields (light theme) |
| paper | `#fafafa` | screen background (light theme) |
| surface | `#f0efed` | tinted panels, unselected chips (light theme) |
| muted | `#7a7a80` | secondary text (light theme) |
| hairline | `rgba(11,11,13,.14–.22)` | dividers (light theme) |
| black | `#000000` | screen background (dark theme) |
| surface-dark | `#0d0d10` | sheet / panel background (dark theme) |
| surface-dark-2 | `#17171b` | unselected chips, empty day cells (dark theme) |
| text-dark | `#f2f2f4` | primary text (dark theme) |
| muted-dark | `#8d8d92` | secondary text (dark theme) |
| hairline-dark | `rgba(255,255,255,.13–.30)` | dividers (dark theme) |

Primary fill gradient: `linear-gradient(135deg, #ee1c2a, #a70d18)`.
Challenge-progress gradient: `linear-gradient(90deg, #ee1c2a, #ff7a4d)`.
Hero photo scrim: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(120,12,20,.4) 45%, rgba(0,0,0,.96) 100%)`.
Profile header field: `linear-gradient(150deg, #0b0b0d 0%, #2a0508 60%, #6b0d15 100%)`.

**Radius: 0 everywhere.** No rounded corners anywhere in the app. Shadow is used only to lift the device frame in the design canvas — not in the UI itself.

**Typography — Archivo** (Google Fonts), weights 400 / 800 only. All numerals use tabular figures (`font-variant-numeric: tabular-nums`).

| Role | Spec |
| --- | --- |
| Screen title | 800, 30–32px, line-height 1.0, letter-spacing -.01em, uppercase |
| Hero title | 800, 34px, line-height .98, letter-spacing -.02em, uppercase |
| Big stat | 800, 20–30px, line-height 1 |
| Card title | 800, 18–24px |
| List title | 800, 14–15px |
| Kicker / label | 800, 9–10px, letter-spacing .14–.16em, uppercase |
| Body | 400, 12–13.5px, line-height 1.5 |
| Micro / meta | 400, 11–11.5px |
| Button label | 800, 12–13px, letter-spacing .06–.08em, uppercase, **left-aligned** with the trailing glyph pushed right (`space-between`) |

Spacing: screen gutter **16px** (20px on auth screens), section padding 16px, list row vertical 12–16px, gaps 6/8/10/12px. Section boundaries are 1px hairlines; the header and tab bar use a 2px rule.

## Screens / Views

Tab bar (persistent, 5 tabs): HOME · RUNS · STATS · FEED · YOU. Height ~48px + 18px bottom inset; labels 800/10px, letter-spacing .1em; the active tab is accent-colored with a 3px top border in the accent; inactive labels are muted with a transparent top border. Transitions on color/border 180ms ease.

App header (persistent, above content): 40px status row, then a row with the logo mark (34×34, `assets/exa-logo.png`), the lockup "RUNNING CLAN / LIMASSOL · CY" (800/9px, .14em, muted, two lines) and a 34px square avatar with the member's initials (2px border). Bottom edge: 2px rule.

### 1. Home
Purpose: know what the next run is and commit to it in one tap.
- **Hero, 290px full-bleed**: run photograph (grayscale), the scrim above, and bottom-anchored overlay at 16px: kicker "NEXT CLAN RUN · TUESDAY 19:30" in `#ff8a90`; title "TRACK / REPEATS"; then a 4-column countdown (DAYS / HRS / MIN / SEC) above a 1px light rule, values 800/26px tabular, labels 800/8px .14em at 65% opacity. **The countdown is live** — it ticks every second toward the next Tuesday 19:30 local time.
- **RSVP row** (14px/16px, hairline below): primary button, flex:1, accent gradient fill, 13px label + trailing `→`; when the user is going it becomes `linear-gradient(135deg,#0b0b0d,#3a0a0f)` with label "YOU'RE IN · 5:30 GROUP" and a trailing `✓`. To its right, the going count (800/20px tabular) over the label "GOING". Toggling the RSVP increments/decrements the count immediately.
- **"THIS WEEK — 3 CLAN RUNS"** list, one row per run: left column day + time kicker, title 800/18px, subtitle muted 12px, then an overlapping avatar stack (24px squares, 1px border, -6px margin) followed by "N GOING"; right column a state chip — "RSVP" (1px hairline border, muted label) or "IN" (accent gradient, white label, no border). Row is tappable → opens the run detail sheet.
- **"YOUR WEEK"** panel on `surface`: 7-cell day strip (aspect 1:1, gap 4px) — days run show the accent gradient with white letters, days not run use `surface-dark-2`/muted in dark and `surface`/muted in light; then three stats: 24.6 KM / 3 RUNS / 2:11 MOVING (800/26px tabular over 800/8px .12em labels).
- **Clan challenge**: kicker "COAST 500K · TOGETHER", right-aligned "310 / 500" in accent-warm; a 12px track with the warm gradient filled to 62%; caption "9 days left · every logged kilometre counts, solo runs included".

### 2. Runs / Schedule
- Title "SCHEDULE" + one-line subtitle.
- Segmented control (WEEKLY / RACES): 2px ink container, 2px inner gap; active segment = accent gradient with white label, inactive = transparent with muted label (800/11px, .08em). Never ink-on-ink.
- **Weekly**: one block per run separated by 1px rules — day/time kicker in accent, going count right; title 800/24px; "place · distance · surface"; footer row "After: <social>" with the state chip.
- **Races**: rows of race name (800/18px) + note, with the date right-aligned in accent (800/13px tabular). Content: Limassol Marathon (15 MAR, clan tent at km 30), Petra tou Romiou 10K (04 OCT, 22 signed up), Troodos Trail Half (09 NOV, bus from Limassol 05:30).

### 3. Stats
- Header row: "AUGUST" + "148 km logged · 11 week streak", and a 78px **progress ring** — 7px stroke, track `surface`, progress stroked with a diagonal accent→accent-deep gradient, value centered (800/15px). Animates from 0 to 74% on mount (1s `cubic-bezier(.2,.8,.2,1)`).
- **WEEKLY KM · LAST 8** bar chart: 118px tall, 6px gaps, bars fill from the bottom over 700ms with a 45ms stagger; the current week uses the accent gradient, prior weeks a dark vertical gradient. Values 18/24/12/31/27/9/29/34 printed under each bar (800/9px tabular, muted). Baseline is a 2px ink rule.
- **CLAN LEADERBOARD**: rows of rank (2-digit, tabular, muted) · 26px initials square · name (800/14px) · km (800/14px tabular), each with a 3px proportional bar underneath filled with the accent gradient (animated width, 800ms). The signed-in user's row is tinted (`#ffe3e5` light / `rgba(238,28,42,.24)` dark).

### 4. Feed
Per post, separated by 1px rules:
- Header: 32px initials square (2px border), name 800/14px, "time · run name".
- 190px grayscale photograph, full-bleed.
- Two-up stat strip: distance and average pace (800/18px tabular over 800/8px .12em labels), divided by a 1px rule.
- Body copy 13px/1.5, `text-wrap: pretty`.
- Action row: kudos button — outlined + muted when off, accent gradient + white when on, label toggles "KUDOS" → "KUDOS ✓" (180ms transition); beside it "N KUDOS · N COMMENTS" (800/11px tabular, muted). Toggling increments the count.

### 5. You / Profile
- Header field with the profile gradient: kicker "MEMBER #147 · SINCE MAR 2024" in `#ff8a90`, name 800/32px on two lines, then a 3-up stat row above a 1px light rule (pace group / clan runs / km this year).
- **PACE GROUP · MIN/KM** segmented row of five options (4:30, 5:00, 5:30, 6:00, 6:30): 2px container, 2px gaps; selected = accent gradient + white, unselected = paper (light) / `#17171b` (dark). Helper copy: "Switch any time. Every group has a leader and nobody finishes alone."
- Settings rows (label 800/14px left, value muted 13px right, 1px rules): Membership · Active, renews Mar 2027 / Emergency contact · Added / Clan kit · Vest — size S / Notifications · Run day + chat / Strava sync · Connected.

### 6. Run detail (bottom sheet)
Opens from any run row; 80% of screen height, `surface`, 2px top rule, 46×4px grab handle (tap to dismiss), scrim `rgba(0,0,0,.5)` (tap to dismiss). Slides in with `transform: translateY(104% → 0)` over 360ms `cubic-bezier(.2,.85,.25,1)`; scrim fades 300ms.
- Kicker day · time, title 800/28px, description 13px muted.
- 130px grayscale map placeholder of the meet point.
- 2×2 fact grid (1px gaps over a hairline field): MEET / DISTANCE / SURFACE / AFTER, each label 800/8px .14em + value 800/14px.
- **PICK YOUR PACE GROUP**: same five-option control, each showing the pace (800/13px tabular) over "N running".
- **"N GOING"** roster: 34px initials squares, wrapped, 6px gaps; the signed-in user's chip carries the accent gradient and reads "YOU".
- **RUN CHAT**: rows of author (800/12px) + message (12px muted), 1px rules.
- Sticky footer: full-width primary button — accent gradient "COUNT ME IN" / dark gradient "YOU'RE IN — TAP TO CANCEL", with the user's pace group right-aligned in the button.

### 7. Auth — Welcome
Black screen. Logo centered, ~300px. Kicker "LIMASSOL · CYPRUS · EST. 2023" in accent; headline "THREE RUNS / A WEEK. / NOBODY ALONE." 800/30px; body copy muted 13px/1.5; then a primary "CREATE ACCOUNT →" (accent gradient) and a secondary "I ALREADY HAVE ONE" (1px `rgba(255,255,255,.28)` border, transparent). 20px gutters, 24px bottom inset.

### 8. Auth — Sign in
Black. Small logo (52px) + "EXA RUNNING CLAN" lockup at the top. Headline "WELCOME / BACK." with the sub "Tuesday track starts in 12h 48m." Fields EMAIL and PASSWORD: label 800/9px .16em muted above an input with `#0d0d10` fill, 1px `rgba(255,255,255,.18)` border, 13px/12px padding, 14px text, no radius. Row with an 18px checkbox "Keep me signed in" and "FORGOT?" in accent. Primary "SIGN IN →". "OR" divider (1px hairlines either side). Secondary "CONTINUE WITH STRAVA". Footer above a 1px rule: "New here? **Create an account**".

### 9. Auth — Register (3 steps)
Black. Header: 40px logo, "STEP n OF 3" in accent, "Join the clan" 800/14px, "BACK" on the right. Below it a 3px progress track filled to n/3 in accent (300ms ease). Footer button reads "CONTINUE →" on steps 1–2 and "JOIN THE CLAN →" on step 3. Each step fades/rises in (`scin`, 300ms).
1. **Who are you?** — FULL NAME, EMAIL, PASSWORD ("At least 8 characters"); helper "We only use your email for run reminders and the Saturday route."
2. **Pick your pace group.** — five stacked options showing pace (800/17px) and "N runners"; selected = accent fill + white, unselected = 1px `rgba(255,255,255,.22)` border + muted; helper "Not sure? Start at 6:30 — Stelios leads that group and nobody finishes alone."
3. **Which runs are yours?** — three toggles (TUE Track repeats · 19:30 / THU Seaside tempo · 06:15 / SAT Long run · 07:00) with a `✓` when on; then a membership panel (1px border): "MEMBERSHIP", "€25 / year", "Covers insurance, the clan vest and race entries at group rates. Pay after your first run."

### 10. Auth — You're in
Black. Logo ~210px centered. Kicker "MEMBER #313 · YOU'RE IN"; headline "SEE YOU / TUESDAY, / ANNA."; body naming the session, place and pace group; a two-up bordered panel (5:30 PACE GROUP · 42 GOING TUESDAY); primary "OPEN THE APP →" and the note "Add Tuesday, Thursday and Saturday to your calendar".

## Interactions & Behavior
- **Tabs**: switch the content region; opening a run sheet does not change tabs; changing tabs closes the sheet. Content enters with `scin` — `opacity 0→1, translateY(10px→0)`, 300ms ease.
- **RSVP toggle**: optimistic. Flips label, fill and the going count on Home, in the list chip and in the sheet footer simultaneously (single source of truth per run id).
- **Pace group**: one selection, shared between the profile screen and the run sheet.
- **Kudos**: per-post boolean, increments the displayed count.
- **Run detail**: bottom sheet as described; dismiss on scrim tap, handle tap or back gesture.
- **Countdown**: recomputed every second from the next Tuesday 19:30; format `DD HH MM SS`, zero-padded.
- **Charts/ring**: animate once on mount from zero.
- **Registration**: step state 1–3, forward/back, no validation implemented in the prototype — production needs email format, password length ≥ 8, and a required pace group before continuing past step 2.
- **Light and dark**: both skins are specified. Neutral paper + ink for light, true black + `#0d0d10` surfaces for dark, accent unchanged in both.

## State Management
Prototype state, all client-side:
- `tab`: 'home' | 'runs' | 'stats' | 'feed' | 'you'
- `openRun`: run id | null (drives the sheet)
- `rsvp`: `{ [runId]: boolean }`
- `pace`: '4:30' | '5:00' | '5:30' | '6:00' | '6:30'
- `kudos`: `{ [postId]: boolean }`
- `runTab`: 'weekly' | 'races'
- `now`: ticking timestamp for the countdown
- `auth`: `{ step, name, email, pace, days: {tue,thu,sat}, remember }`

Production will need, at minimum: auth session; member profile (name, member number, join date, pace group, kit size, emergency contact, membership status); the recurring run schedule with per-occurrence RSVPs and pace-group assignment; activity logging (own runs, with optional Strava import) feeding weekly/annual totals, streak and the leaderboard; feed posts with photos, kudos and comments; per-run chat; race calendar; and the clan challenge aggregate.

## Assets
- `assets/exa-logo.png` — the clan logo supplied by the user (black ground, red type, snake ring). Used at 300px (welcome), 210px (confirmation), 52/40px (auth headers) and 34px (app header mark). Ship a transparent-background vector/PNG set for production; the supplied file is a raster with a black field.
- All photographs and the meet-point map are **placeholders** (diagonal-stripe blocks labelled with what belongs there): run photos on Home and in the feed, and a map of the meet point in the run sheet. Real photography should be treated grayscale as in the design; the map should be a real map view centered on the meet point.
- Icons: none drawn — use [Lucide](https://lucide.dev) if icons are added.
- Font: Archivo (Google Fonts), 400 + 800.

## Files
- `DATA_MODEL_AND_API.md` — entities, derived values, API surface, permissions, seed data and the gaps the designs don't cover. **Read this second.**
- `Exa Running Clan.dc.html` — the full prototype. It is organised as stacked review sections, newest first:
  - `#t6` 6a–6d — auth screens (welcome, sign in, register, confirmation)
  - `#t5` 5a–5f — all six app screens, dark skin
  - `#t4` 4a–4f — all six app screens, light skin
  - `#t3` 3a — dark tabbed prototype (interactive)
  - `#t2` 2a — light tabbed prototype (interactive) ← **the reference build**
  - `#t1` 1a–1e — earlier explorations, superseded; ignore
- `support.js` — the prototype runtime. Reference only; do not port.
- `assets/exa-logo.png` — logo.

Open the file in a browser and interact with **2a** (light) or **3a** (dark) to see the real behaviour before implementing.
