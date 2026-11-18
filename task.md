# AutoCare tasks
## Active: approved phone + responsive website redesign
- Mandatory auth first: Apple, Google, email; no guest or close bypass.
- Navy / muted teal, soft neutrals; documented in design.md before implementation.
- Mobile: extract app controller from route, Cars landing, dashboard detail, Account and Settings tabs; preserve setup, reminders, support, feedback, owner inbox.
- Website: new independent responsive interface with same protected backup API and shared pure business modules; login, cars, setup/edit, dashboard, account/settings, help/feedback.
- Preserve existing data/storage and account boundaries; append service history to vehicle JSON without a database migration.
- Verify: lint/build/mobile types, signed-out deep links, email sign-up/sign-in, refresh, logout, account switch, CRUD + calculations, Arabic/English, phone/desktop widths. Physical notification and OAuth tests remain unverified.
- Status: implemented and tested (2026-10-05).
- Service date + optional description: form on both surfaces; validation for future date, km above odometer, 200-char note; syncs phone<->web. Native iOS/Android date picker untested (only browser date input testable here).
- Verified: 27 unit tests (catalog, reminders, sync reconcile, service history); lint, web typecheck+build, mobile typecheck.
- Chrome: web signup/login/wrong password, deep-link return after login, add/edit/delete EV, BMW diesel + DS filters, duplicate plate refused, VIN zoom, help/feedback/settings/account pages, unknown route → cars, no overflow 320–1440, EN/AR, logout gate.
- Chrome phone app: sign-in (wrong password refused), loads website car, phone edit → website, website edit → phone reload and foreground refresh, no stale overwrite, logout gate, second account sees 0 cars.
- WebKit iPhone 13 on public HTTPS previews: web and phone sign-in + dashboard, no overflow, no page errors.
- API: feedback/support/backup/owner return 401 without auth.
- Unverified: physical Apple/Google OAuth, native notification delivery, feedback email inbox delivery.

## Faster open (2026-10-06)
- Website: production build forced to NODE_ENV=production in vite.config (root .env has NODE_ENV=development, which shipped React dev build). Main JS 703KB→444KB (gzip 222→150KB).
- Website fonts: 8 TTFs (1.38MB) → subset WOFF2 (256KB), @font-face inlined in autocare.css, brand-0 preloaded. Originals in /home/user/font-src/. Small 64/180px icons for favicon/apple-touch.
- Website: returning user (token + remembered uid) prefetches cars and page chunks in parallel with the session check; early copy dropped if the session is a different account; uid cleared on logout.
- Phone: storage reads in parallel; returning user sees saved cars immediately while the session is checked (also offline); Login without waiting when no token on native; native splash held until saved cars are read (3s cap); no spinner flash.
- Phone Account tab when session can't be checked: "Could not check your session" + Try again (not the sign-in form).
- Verified Chrome: returning open shows garage with no login/spinner flash (~0.5s local), session-error open shows cached cars, delete while unconfirmed reaches cloud after reconnect, sign-out→Login, other account sees 0 cars, stale uid hint never shows other account's cars, deep link /cars/:id, EN/AR fonts. Regression scripts pass. Test car odometer now 90,800.
- Unverified: real-device startup time and native splash hold.

## Previous catalog work
- User approved: add DS3/4/5/7, BMW named petrol/diesel variants and researched additions.
- Keep legacy BMW Series entries so saved cars still load.
- Sources: BMW PressClub new 3 Series 2015 (T0214827EN), 2010 spec (T0076762EN); DS Egypt DS7 technical page; ContactCars DS4 1.6; Hatla2ee DS3 Egypt.
- Implement F30/F31-era variant engines; 318i also includes older 2.0 non-turbo. Labels/year note make cross-generation choices explicit.
- Add premium DS classification and VIN aliases; tests cover filters and existing saved catalog compatibility.
- Completed: DS/BMW catalog, premium DS class, DS Automobiles VIN alias, import/year disclaimer.
- Verified: 4 unit tests / 48 assertions, mobile typecheck, lint and root build; WebKit DS models picker and BMW diesel 318d engine picker.

## Apple requirements (2026-10-12) — done
- Verified: account.delete removes user/session/account/cars/support/feedback rows (API test), 401 without auth, old token 401, can't sign in again; web + phone delete flows clear device; /privacy and /support signed out EN/AR, 320px no overflow; consent flow web + phone; links open /privacy. Regression scripts pass (mobile-sync values now 92,2/5/800 — bump above 92,800 next time). Tests: /home/user/tests/apple-{api,web,mobile}.py.
- Unverified: real iOS build/EAS, App Store review outcome.

## Website-first / installable (done)
- Manifest + iOS/Android meta, Settings install panel (EN/AR), web reminder text no longer refers to "this phone".
- Verified: manifest 200, Chrome installability errors = none (persistent profile), settings at 1280/390(iOS UA)/320 EN+AR no overflow, lint/build/tsc/27 tests, web-extended, perf-web-verify, apple-web pass. Test: /home/user/tests/pwa-web.py, pwa-install.py.
- Phone app kept untouched.
- Home Screen popup added + verified (tests/pwa-hint.py: iOS 390 / Android 320, EN+AR, snooze + done, desktop hidden).
- Odometer reminders (phone notifications + website banner) added. Verified: tests/odometer-reminders.test.ts (9), odo-web.py (1280/390/320 EN+AR, focus, Later, Off), odo-mobile-shot.py (temporary web-preview override, reverted), regressions pass. Test BMW odometer now 93,200 (edit-mobile.py).

## VIN lookup (2026-11-05) — done
- Files: api/routes/vin.ts, api/services/vin-decoders.ts, carcare/vin.ts, egypt-models.ts (matchModel ignores make prefix), i18n.ts (vinFound*), web car-form, mobile Setup, queries/cars.ts.
- Verified: tests/vin.test.ts (11) + all unit tests (47), lint/build/tsc, vin-live.ts (15 real VINs), vin-web.py (1280/390/320 EN+AR, no overflow, fields editable), vin-mobile.py, all regression scripts (pwa-hint.py now scopes "Later" to the popup). mobile-sync values now 95,2/5/800; test BMW odometer now 96,200.
- Unverified: real-device phone lookup. Cache/rate limit reset on server restart.

## Owner overview v2 (2026-11-18)
- /overview rewritten: car picker dropdown, KPIs, next-up list, car info, maintenance status, owner manual card (bundled PDFs + search links + saved links), all-cars table.
- Saved manual links live in the vehicle JSON as `manuals` (backup.save passthrough, no migration).
- Neon Postgres change from the website zip NOT applied — kept the managed DB (editing __client.ts breaks lint).
- Tests: src/web/lib/manuals.test.ts (bun test), /home/user/tests/overview-e2e.py (Playwright, system Chrome).
- tsconfig.app.json excludes *.test.ts so `bun run build` passes.
