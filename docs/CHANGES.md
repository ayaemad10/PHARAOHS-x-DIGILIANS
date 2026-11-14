# Flame in Freefall · what changed in the final version

One project, one navigation.

## What changed from v3
- **Opening scene.** Home opens on a view through a hull porthole: a fuel droplet burning as a blue
  sphere inside the module (illustration based on FLEX droplet tests). After about four seconds the
  camera glides through the window by itself and the dashboard takes its place. A click, a key or
  the mouse wheel skips it. It plays once per browser session.
- **The model is shown whole.** The 3D cabin has its own frame; sensors sit beside it, the timeline
  below it, and nothing is laid over it.
- The first Home view is named **Dashboard**, with the key figures (records, sensors, first-to-last
  gap) always visible.
- **Home is one screen.** The 3D cabin fills the page and nothing scrolls. The detection replay
  (sensors, cabin conditions, camera frame, timeline) floats over it. The other Home content opens
  in place from the row at the top right: Flame behaviour, Results, Records, Findings & gaps,
  Demo & media. Every figure, sentence and control from the old stacked Home is still there.
- **The 3D model appears once** on Home.
- **No separate landing site.** Home is the first page in the navigation ("/").
- **No repeated page list.** The "Continue" cards at the bottom of Home are gone; pages are reached
  from the top bar only.
- **Top bar navigation** with the same page names and routes as before.
- **Type:** Noto Serif KR for all text; a monospace face for figures so columns stay aligned.
- **Colour:** two colours only, flame blue and ember orange, on a calm dark ground (and a light theme).
  Gold stays only in the team name and logo.
- Background stars and the 3D Earth were removed.

## Added after the challenge review
- **Fire Response** (Home, second view). Same cabin and same recorded burn as the Dashboard, but
  the replay stops at the alarm and asks what to do, one step at a time: Detect (which sensor
  and rule the alarm uses, run on the SAFFIRE-III recording), Decide (cut ventilation or not,
  answered with published BASS findings), Suppress (CO2 or helium, answered with FLEX test counts),
  then a debrief with the head start over a CO2-sensor-only alarm, an evidence meter and the
  investigations ranked for the chosen habitat (space station, Moon Base, pressurized rover).
  What the 3D flame does after a choice is an illustration and is labelled as one.
- **Prediction.** The Dashboard asks which sensor will notice first; detection times are now
  revealed only as the replay reaches them.
- **Sound.** Synthesised in the browser (no audio files): cabin hum, ignition, one tone per sensor,
  alarm, fan and gas. (Changed in the final round: on by default, starting at the first click or
  key press; the Sound button turns it off and the choice is remembered.)
- **Data notes.** LUCI records are labelled "published paper, not in PSI". A new gap (GAP-06)
  lists the PSI investigations that are not loaded (SAME, SAME-R, ACME incl. CFI-G and BRE,
  SPICE, SLICE, FLEX-2).
- **Team page.** Titles, LinkedIn and GitHub links from the members' CVs. No emails or phones.
- **One launcher.** `RUN-APP.bat` builds and starts the fast version. To edit with live reload:
  `npx next dev -p 3005`.
- The floating Firewise panel is hidden on Home (Firewise AI is in the top bar).

## Final round
- **Evidence library** (bottom of Insights): the team's data-ingest package, shown in five tabs:
  objectives, recommendations (with sample size and "not for"), the FLEX extinction model (which
  does not beat the majority guess, and says so), the dataset list and the verification log.
  Only the JSON summaries are in `data/ingest/`; the raw tables are not shipped because their
  reuse rights are still marked to be confirmed.
- **Sound** is on by default and starts at the first click or key press; levels raised.
- **Team cards** are identical for everyone: photo, name, Team Leader or Member. Title, LinkedIn
  and GitHub are on each profile. Skills and personal websites removed.
- **Light theme** fixes on the Home sheets (captions on the flame drawings, dark frame).

## Data merge
- 1,058 tests from the team's PSI tables are merged into the catalog: 1,412 records from 12
  programmes (ACME 333, FLEX 274, CFI 227, BASS-II 181 + BASS 4, SAME-R 109, SPICE 105,
  counterflow extinction 95, SAME 45, SAFFIRE 22, cool flames 15, LUCI 2).
- `scripts/merge_psi.py` rebuilds `data/real/catalog.json` from `data/real/catalog_core.json`
  (the original 354) and `data/psi/*.csv`, and writes `data/real/merge_report.json`.
- Subsets, the FLEX duplicate (PSI-69), simulation tables and the unidentified Saffire 2017
  workbook are not added. PSI-99 values were added to the nine Saffire-II records.
- Explore type and topic filters now cover smoke detection, cool flames, gas flames, soot and
  1 g extinction limits. Each programme has an objective line on its records.
- Fire Response ranks ACME, CFI and SAME as well; ACME adds 18 gas-flame tests at Moon-base air.

## Demo and team
- The 30-second demo video plays in Home → Demo & media (compressed to 3 MB).
- Shahd Najeh's GitHub added.

## Folder clean-up
- Removed files nothing imported any more (old shell, starfield, Earth globe, unused scenes,
  prototype data) and the stale copy of the old catalog in `public/data/catalog/`.

## Challenge coverage (Discover · Compare · Predict · Interpret)
- **Firewise AI writes real answers.** `POST /api/firewise` finds the matching records, then an AI
  model (Llama 3.3 70B via Groq) answers from those records only and cites each one in [brackets].
  The key is read from the `GROQ_API_KEY` environment variable and never sent to the browser.
  Without a key, or if the model cannot be reached, Firewise falls back to the matching records
  with no generated text. Emergency questions are still refused before anything is sent.
- **Explore: rank by habitat and download.** "Closest to: Space station / Moon Base / Pressurized
  rover" puts the tests nearest that air and gravity first, with a points score shown on every
  card (same air 3, gravity up to 2, sensor data 1, measured 1). "Download CSV" saves the records
  that match the current filters, with the fit score when a habitat is chosen.
- **Compare: programme against programme.** Up to three of ten investigations side by side: where
  they ran, hardware, fuels, oxygen, pressure and air-flow ranges, gravity, sensors, how the tests
  ended, and the fire-safety question each one answers. Ranges and counts are computed from the catalog.
- **Flame Lab: "What the data says".** For a droplet flame in the chosen oxygen, fuel, added gas and
  pressure, the share of FLEX tests that went out next to the model's probability, on one chart.
  The panel states that the model does not beat always guessing "it goes out" (0.875 vs 0.873).
- **Home: Recommendations.** A new view with recommendations per habitat (detect, contain,
  suppress, plan for, gap), each with the tests behind it and what it must not be used for, and
  "Back on Earth": inert-gas extinguishers, smoke detectors, fire-resistant fabrics, cleaner engines.
- **Experiment pages in PSI layout**: Description, Hardware, This test (with the record's own
  measurements), Data files and the PSI number with a link to psi.nasa.gov.
- **New finding from the SAME data:** the ISS scatter smoke detector read a median 0.84 V for Kapton
  and 0.95 V for Teflon smoke against about 6.2 V for lampwick and silicone (134 samples).

## Model fix
- The FLEX model file stored its intercept on the standardised scale next to coefficients in raw
  units, so the two could not be used together. `intercept_raw_units` (5.6376) is now added and the
  script writes it. Refitting reproduces every reported number (P = 0.962 at the median test).

## Team
- Portraits on one shared background. Music on the Team pages with play / pause and volume; it
  remembers if you turned it off.

No measurement or dataset was changed.


## Release round (hosting, speed, cleanup)

### Lighter, for a free host (Vercel Hobby)
- **List pages send a slim record list.** Explore, Compare, Flame Lab and Mission Lab no longer pass all
  1,412 full records to the browser: they get a compact list (id, title, programme, PSI, fuel, O₂, pressure,
  flow, gravity, outcome, evidence, date, type, topic) from `lib/records/encode.js`, decoded by
  `lib/records/decode.js`. The full record loads only on `/experiments/[id]`. Page HTML went from about
  2.4 MB to 210–360 KB.
- **The catalog is no longer in the browser.** Firewise search moved to the server
  (`lib/server/firewiseIndex.js`, server-only). That removed a 925 KB chunk that every page loaded.
  First-visit JavaScript went from about 1.5 MB to about 0.65 MB per page.
- **Charts load only where they are drawn** (dynamic import on Insights; three.js was already dynamic).
- **The 3D cabin stops drawing** while a sheet covers it (Recommendations, Evidence, Flame behaviour,
  Demo & media) and while the browser tab is hidden. The cabin hum stops with it.
- **No blur on large surfaces.** `backdrop-filter` is gone from panels, sheets, the top bar and Home
  blocks; it stays only on small chips and buttons.
- **Media:** `demo.mp4` re-encoded to 720p H.264, 470 kbps, a keyframe every second, faststart
  (3.0 → 2.0 MB); `saffire-v.mp4` to 30 fps (it was 120 fps), 160 kbps, keyframe every second
  (2.8 → 1.6 MB); `team-theme.mp3` to 48 kbps mono (1.7 MB → 640 KB, see the note below);
  the 418 SAFFIRE camera frames to WebP (1.9 MB → 420 KB); logo, icon, hero logo, team photos and
  video posters to WebP; sensor series rounded to the precision the app shows (1.35 MB → 0.86 MB)
  and loaded only after the opening scene. JSON data files are written compact (same values).
- **CSS:** rules for components that no longer exist were removed (155 KB → 139 KB with the new rules).
- **Cache headers** for `/media`, `/data`, `/team` and `/brand` (30 days, then revalidated).
- **Hosting:** `GROQ_API_KEY` is read only in `app/api/firewise/route.js`; `.env*` is in `.gitignore`
  except `.env.example`; no file is over 5 MB; no Windows path or port in the code (port 3005 is only
  in `RUN-APP.bat`). Deployment steps are in `READ-ME-FIRST.md`.
- Music note: 96 kbps for a 106 s track is about 1.3 MB, so it could not also be under 700 KB. The size
  limit was kept (48 kbps mono). For background music played at 15 % volume the difference is small.

### Demo video
- While Demo & media is open the cabin does not render and does not hum, the sheet behind the player is
  opaque (no blur), the video downloads in full once the view opens (`preload="auto"`), and it pauses
  when the view closes or the tab is hidden. Same for the NASA media clip. `/demo` opens this view
  directly (title "Demo").

### Team music
- Starts at 0.15 volume with a 1.5 s fade-in; the slider stops at 0.6; pausing fades out.
- One 28 px round button (gold) with a small equaliser while playing; name and volume appear on hover or
  keyboard focus. Bottom-left; it slides out of the way while a member photo passes under it.
- Nothing downloads until play is pressed. A visitor who pressed play before gets it back at their first
  click; one who paused stays paused.

### Insights is the interpretation page
- Four key findings with numbers and record links: oxygen vs extinction (FLEX), the ISS scatter detector
  vs Kapton/Teflon smoke (SAME, SAME-R), ventilation (BASS), and sensor order (SAFFIRE-III).
- Charts: "Ambient O₂ vs extinction diameter (FLEX)" with readable axes, and a new chart: the median ISS
  smoke-detector reading per material from the 134 SAME / SAME-R samples. The oxygen-share chart and the
  3-point flow chart are gone (the oxygen share is in Flame Lab); "Coverage by research programme" and
  "Key risk factors" are gone.
- Cross-experiment insights unchanged, except that ids which are publications (not test records) now open
  the publication instead of a missing record page.
- Mission-specific findings have readable titles; the empty Earth and Mars columns are gone.
- Evidence library: Objectives, Datasets, Verification, plus one line each pointing to Home ›
  Recommendations and Flame Lab.
- Axis titles no longer sit on the tick labels; chart legends moved to the top.

### Wording and consistency
- Evidence level defined once (`data/real/programMeta.js`): PSI experimental tables and the SAFFIRE-III
  workbook = Measured; figures digitised from papers (PSI-117, PSI-142) and paper-only records (LUCI,
  BASS reports, SAFFIRE summary tables) = Published. Used by Explore, habitat fit, CSV and Recommendations.
- Prototype wording removed where the data is real; honest labels kept for the Flame Lab flame model,
  Mission Lab scoring and the 3D cabin. Settings now says that Firewise sends the question and the matched
  records to Groq.
- One programme count everywhere: 10 investigation families (Home › Records is grouped the same way as
  Compare).
- Mission Lab uses the habitat air from `lib/response.js` (Moon: 30%+ O₂ at 10.2 psi) and explains how its
  0–100 ranking differs from Explore's 0–7 "Closest to" points.
- Team hero describes the whole project (1,412 records, 10 investigations).
- Explore cards show "Microgravity"; the full gravity note stays on the record page. Dates: one display
  format (26 Aug 2009); ISO dates in the CSV.
- 404 page titled "Page not found · Flame in Freefall" with a link back to Home.

### Firewise AI
- One endpoint returns an "AI answer" (cites only real record ids) or a "Search result" (short list:
  title, outcome, conditions, link). The fallback arrives within about 6 s if Groq is slow.
- Questions limited to 500 characters; 8 questions per minute per visitor; a friendly message when Groq
  answers 429. Arabic questions find evidence through a small Arabic-to-English keyword map.
- `scripts/test-firewise.mjs` runs the seven checks (five topics, Arabic, emergency) against the real key.

### Layout
- Home view tabs: Results, Records and Findings & gaps are grouped under **Evidence**, so the row fits at
  1280 px. Sideways rows (top bar, Home tabs) fade at the edge that has more and scroll the active item
  into view on a phone.
- Cabin labels never overlap: a label that would cover another is hidden; part labels are hidden on phones.
- The floating Firewise button is gone (Firewise AI is in the top bar).
- Light theme contrast fixed on Recommendations and the Insights cards (checked with axe: 0 issues on the
  listed panels in both themes).
- The SaffireLab lint warning is fixed.
