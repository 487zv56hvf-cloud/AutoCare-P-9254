# AutoCare — design

## Approved navy / teal redesign (2026-10-05)
- Both native phone UI and a separate responsive React website. Same accounts, catalog, maintenance calculations and cloud backup API; no database replacement.
- Colors: ink navy #152C3E, muted teal #087F83, pale teal #E8F3F2, warm neutral #F5F6F4, white surfaces, slate text #607383 and subtle borders #DCE5E8. Status colors retain readable darker amber/red/green. No bright gradients on reading surfaces.
- Web typography: self-hosted Poppins (headings and body); Arabic uses self-hosted Noto Sans Arabic. Mobile system font with explicit family for native Arabic coverage. 48px minimum primary buttons, 12px radii, generous spacing, visible focus/pressed/loading states. Teal main action, pale secondary action, restrained destructive actions.
- Web login: navy editorial panel with geometric road/speedometer motif, compact white sign-in area, Apple → Google → email. No guest route. Authenticated website: navy desktop sidebar and adaptive phone nav, light workspace, vehicle cards → focused dashboard; separate Account, Settings, Help and Feedback pages.
- Mobile login: navy branded introduction, language switch, existing auth form. Authenticated landing is My cars; car dashboard has back-to-cars navigation. Persistent Cars / Account / Settings tabs. Help and Feedback remain reachable from Settings.
- Dashboard hierarchy: navy vehicle/mileage summary, service priorities, oil/brake/tire progress, update mileage and service history. Never invent dates for older last-service readings: they show as "saved reading — date not recorded" and stay in history after a newer dated service (`serviceHistory` / `recordService` in maintenance.ts, shared by phone and web).
- Recording a service ("I just did this") opens a form, not a confirm: service date (defaults to today, 1980-01-01..today), odometer at service (defaults to current, 0..current) and an optional description (max 200 chars). Phone: bottom sheet `ServiceSheet` with `DateField` (native picker on iOS/Android, browser date input on web preview). Website: native `<dialog>` `ServiceDialog`. Stored as `services[]` `{item, date, km, note?}` in vehicle JSON (no migration). A backdated lower-km record never lowers the item's last-service km and is not added to the odometer log. History sorts newest date first, then undated readings, and shows the formatted date and note.
- App icon: see App icon and splash. Native notification delivery and physical OAuth remain device-dependent and unverified until device tests.

- Shared detail: light theme only, Ionicons/Lucide icons, no emoji. Arabic is default; RTL flips rows and aligns text right. Readable text minimum 11px on web (labels/captions), 12px+ for supporting copy. Status colors stay darker for contrast.
- Login on web remembers a signed-out deep link and returns there after sign-in.

## App icon and splash (reverted 2026-10-06 to the oil-drop logo)
- Icon: glossy amber-gold oil drop with a white sedan inside, on dark navy #030D27 with a soft blue glow.
- Android adaptive icon uses `adaptive-icon.png` (mark on transparent) over #030D27. Splash: mark only, no text, navy #030D27, resizeMode cover.
- Same artwork on the website (favicon 64, apple-touch 180, og 512) and the phone web preview (apple-touch-v3, manifest 192/512; theme colour #030D27).
- Feras's green speedometer design (used 2026-10-05..06) is backed up in /home/user/icon-new/speedometer-backup/.

## Sign-in
- Order: Continue with Apple (black, logo-apple) > Continue with Google (white, outlined) > email/password.
- Mandatory first screen whenever signed out, with brand name and Arabic/English switch; no close, guest or skip action. Reuses the existing sign-in/sign-up form in the navy/teal palette.
- Wait for the session and local ownership check before showing any cars. Signed-in users open their cars directly; sign-out/session loss returns to login and cancels car reminders while signed out. Legacy guest cars remain hidden until an account claims them.

## Name
- App name: **AutoCare** (English) / **أوتو كير** (Arabic). The in-app name follows the language switch. Expo slug, bundle id and storage keys keep the old `carcare` ids on purpose (changing them breaks Expo Go / wipes saved cars).
- Each account sees only its own car: the phone remembers which account owns the car (`owner` in local state). Sign-out removes the car from the phone (it stays backed up); signing in to another account clears it and loads that account's newest backup. A car made while signed out joins the account that signs in.
- Backup retries 3 times automatically (3s/8s/20s), retries when the app comes back to the foreground, and shows a Try again button if it still fails.

## Multiple cars (2026-10-05)
- Each account can keep any number of cars. My cars lists them; "Add car" opens a blank form; the dashboard has Edit and Delete.
- Phone storage key is still `carcare.egypt.v1`. New shape: `{lang, vehicles, activeId, owner, removed}`. Old single-car saves (`vehicle`) are migrated on load.
- Signed in: every changed car is backed up (debounced, 3 retries, retry on foreground, "Try again"). Deletes are queued in `removed` and sent to `backup.remove` when online. Every boot/sign-in/foreground pulls the account's cars: clean phone copies take the latest cloud version, cars deleted on the website disappear, unsynced phone edits and queued deletes are kept (`synced` signatures in local state). Sign-out first tries to finish backup; if that fails the phone keeps its data. A different account starts empty.
- One plate = one car: the form refuses a plate already used by another car.

## VIN guide (replaces photo identify)
- Photo identification is removed (`expo-image-picker`, `expo-image-manipulator`, the camera/photos permissions and the server `vehicle` route are gone).
- Setup shows the VIN field plus a "Where do I find the VIN?" step-by-step guide (updated 2026-10-05):
  - "How to find your VIN" box: 17 characters, same number everywhere, easiest at the windshield corner; tips (no I/O/Q, no spaces, check two places).
  - One full-width card per place, easiest first: windshield (driver side), driver door frame, engine bay. The licence card picture was removed (Feras: the VIN is not on the Egyptian licence). Each has its picture plus 3 numbered steps. Tap a picture to enlarge (zoom shows the steps too). Images in `packages/mobile/assets/vin/`.

## VIN lookup (2026-11-05)
- "Look up vehicle" (web car form + phone Setup) calls the server `vin.decode` (oRPC, signed-in only). Server: auto.dev (`AUTODEV_API_KEY`, free plan 1,000/month) first, NHTSA vPIC fills gaps only when it names the same make. 30-day memory cache, 40 lookups/user/hour. Key stays on the server.
- App side (`carcare/vin.ts`): model codes read from the VIN beat the decoder's guess (Hyundai/Kia/GM Korea, Skoda/VW/Seat/Audi, Toyota Turkey, Dacia, Mitsubishi); Dacia shows as Renault; Renault/Dacia VINs give no year. If the server fails it falls back to vPIC directly, then offline tables.
- Found note lists what was found and what to choose (EN + Egyptian Arabic). All fields stay editable. A year filled by an earlier lookup is cleared when the next VIN has no year.
- Typical results: Korean/Japanese/European/US cars → year, make, model (engine sometimes). Chinese makes (Chery etc.) → year + make only. Renault/Dacia → make + model, no year.

## Feedback
- Settings (phone) and the Feedback page (web) open the Feedback form (idea / problem / other, optional 1-5 stars, message, optional contact). Rate limit 8 per 10 minutes. Sending requires sign-in.
- Every message is saved in the `feedback` table and shown to the owner in Account > Owner inbox > Feedback (new/read/all, mark read, new-count badge).
- Email to the owner is configured; the latest test was accepted by the provider for the owner's Gmail. Inbox delivery is not confirmed. Messages are saved even if email fails.
- Owner inbox view not yet tested (needs the owner's Google sign-in on the phone).

## Local service notifications (2026-10-05)
- Opt-in Service reminders card on dashboard; per-phone setting covers all saved cars.
- 14 days before, 3 days before and on the estimated due date at 9 AM local time. History-derived daily km, fallback 30 km/day. Dates anchor to latest odometer reading.
- Skip unknown service mileage and EV oil. Reconcile when mileage/services/intervals/language change. Cancel deleted/sign-out cars. One overdue alert per cycle, no daily spam.
- Local phone notifications, no email or automatic mileage sensing. Browser explanation only; native test button. Earliest 60 pending alerts within iOS limits. Phone delivery unverified.

## Phone header and safe area
- Compact header: brand mark + name and language button. Navigation lives in the Cars / Account / Settings tab bar.
- On actual mobile browsers only, override the simulated preview Dynamic Island and 54px top gap with the device's CSS safe-area inset. Desktop Runable preview keeps its simulated status bar. Native safe areas stay unchanged. Do not edit managed safe-area plumbing.

## Safari Home Screen metadata (2026-10-05)
- Expo's supported `packages/mobile/public/index.html` template includes a real 180px apple-touch-icon, web app title, manifest with 192/512px icons and viewport-fit=cover. Metro injects the React app bundle as usual. Native icons unchanged.
- Versioned Apple icon URL avoids the old Safari icon cache; existing shortcuts may need re-adding. Icon retrieval/metadata can be tested, but actual Add to Home Screen sheet needs an iPhone.
- Persistent generic Safari “Script error.” not reproduced in WebKit or Chrome; do not claim resolved or suppress unknown errors.
- Safari error follow-up: user reports opaque error immediately on native Share. iOS WebKit-only capture listener leaves console diagnostics for source-less `Script error.` but prevents managed global boundary from replacing working UI. Errors with actual exception/source/line remain visible. This is containment, not a confirmed fix of Safari's underlying cause; real Share sheet untested.

## DS / BMW catalog expansion
- DS make with DS3, DS4, DS5, DS7. Named BMW 3 Series petrol and diesel variants alongside existing Series entries (backwards compatible).
- Options cover multiple years and imports; user must confirm engine for their year. These are not guarantees of current Egyptian dealer availability. Maintenance intervals remain estimates, not model-certified schedules.
- Research notes recorded in task.md; no changes to users' existing saved vehicles.
- BMW hybrid follow-up: Hybrid filter includes older ActiveHybrid 3/5/7; Plug-in hybrid filter includes named 330e/530e/545e/550e/740e/745e/750e and X1/X3/X5 e variants. Imported/older variants, not confirmed current Egyptian dealer stock. Mild hybrids are not relabelled as full hybrids.

## Startup performance (2026-10-06)
- Phone: no spinner on open for returning users; saved cars render first, cloud refresh follows. Native splash stays until local data is read (max 3s).
- Website: fonts are Arabic+Latin (Noto Sans Arabic) and Latin (Poppins) WOFF2 subsets in public/fonts; add glyph ranges there if new scripts are needed. Keep production builds on NODE_ENV=production (handled in vite.config.ts).

## App Store requirements (2026-10-12)
- Public pages, no sign-in: website `/privacy` (policy text in `packages/mobile/carcare/legal.ts`, EN/AR, contact email from `legal.contact` = OWNER_EMAIL) and `/support` (contact, FAQ, how to delete account). Same public frame: white top bar with brand + language button, 820px column, footer links.
- Links to both: website login, Settings, Account; phone Login, Settings, Account (opens in-app browser via `carcare/links.ts`).
- Delete account: red-bordered "danger" card at the bottom of Account (web + phone), confirm dialog, then server deletes all rows (`account.delete`) and the device is cleared. Website shows "Your account and its data were deleted" on the sign-in page.
- AI chat consent (5.1.2(i)): consent card before the first chat message on web + phone; stored per device (`carcare.egypt.aiConsent.v1` / `autocare.web.aiConsent.<uid>`); server refuses chat without `aiConsent: true`.
- app.json: iOS bundle id is `com.AutoCare-oasl.runable` (Apple forbids "_"; Android package unchanged), buildNumber, ITSAppUsesNonExemptEncryption=false, privacy manifest with required-reason APIs. If the policy changes, update `PRIVACY_UPDATED`.
- Sign-in stays required (owner's choice; 5.1.1(v) rejection risk). No Sign in with Apple token revocation (managed auth has no helper).

## Website as installable app (Home Screen)
- `packages/web/public/manifest.webmanifest`: name AutoCare, start_url `/cars`, display standalone, background/theme `#f5f6f4` (page background), icons `/images/autocare-icon-192.png` + `-512.png` (same logo as the phone app).
- `index.html`: manifest link, `theme-color`, `apple-mobile-web-app-capable`, title, status-bar `default`, `viewport-fit=cover` (bottom nav already pads `env(safe-area-inset-bottom)`).
- `src/web/lib/install.ts` captures `beforeinstallprompt`; Settings shows an "Add to Home Screen" panel first: Install button (Chrome/Android), Safari Share steps (iOS), "installed" when standalone, generic steps otherwise. No service worker on purpose (no stale caches).
- Website reminders text: the site sends no notifications; due/overdue items sit at the top of each car's page.
- Home Screen popup (`components/install-hint.tsx`, mounted in the signed-in shell): phones only (iOS / Android / coarse pointer ≤900px), never when already installed or on desktop. Appears 1.5 s after load. iOS = 3 Safari steps; Android = Chrome menu steps, or a one-tap Install button when `beforeinstallprompt` fired. "Got it" hides it for good, "Later"/X/Esc snooze 7 days (localStorage `autocare.web.installHint.v1`). Bottom sheet ≤480px, app icon in header.

## Odometer reminders
- Shared logic: `packages/mobile/carcare/odometer-reminders.ts` (choices off / monthly 30d / biweekly 14d / weekly 7d / twice 3.5d→4/3 alternating; default **every 2 weeks**). Counting restarts from each car's latest dated log reading; opening the app never postpones.
- Phone: Settings → Reminders card → "Odometer reminders" chips (AsyncStorage `autocare.reminders.odometer.v1`). Local notifications at 9 AM, scheduled with service reminders (service first, odometer fills to 60 slots, ≥8). Needs the main reminders toggle on. Not shown in the Expo web preview.
- Website: Settings → "Odometer reminders" pill choices (localStorage `autocare.web.odoFreq.v1`). Amber banner on My cars (per due car → "Update now" opens the car page with the odometer field focused via `#update`) and on the car's page (focuses field). "Later" hides it until the next reminder day (`autocare.web.odoLater.v1`). Car name wrapped in `<bdi>`.
- Setting is per device/browser, not per account.
