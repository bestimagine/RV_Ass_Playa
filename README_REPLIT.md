# Deploying RV AI Assistant — Playa on Replit

This is a plain static site with no build step, no server and no dependencies. Deploy it as a **Static Deployment**.

Suggested deployment slug: `rv-ai-assistant-playa`

## Static Deployment settings

| Setting | Value |
| --- | --- |
| Deployment type | **Static** |
| Build command | *(leave empty)* |
| Public directory | `public` |
| Entry / index page | `index.html` |
| 404 / fallback page | `index.html` |

That is the whole configuration. There is nothing to install and nothing to compile.

### Why `public` and not the repository root

`public/` contains exactly the files that should be on the internet. Keeping the publish directory narrow means `tests/`, `tools/`, `development/` and — most importantly — the Git-ignored `source_materials/` can never be served by accident.

### Why the fallback page matters

The app routes with the URL hash (`#/answer/propane-smell`), so the server only ever needs to return `index.html`. Setting the fallback to `index.html` means a shared or refreshed deep link resolves instead of 404ing.

## Before you deploy

1. Run the tests: `npm test` — everything should pass.
2. Preview locally: `npm start`, then open <http://localhost:8000>.
3. Confirm `public/data/answers.json`, `public/data/checklists.json` and `public/data/synonyms.json` are present.
4. Confirm `source_materials/` is still ignored by Git and is not inside `public/`.

## After you deploy

Replit serves static deployments over HTTPS, which the service worker requires.

1. Open the deployed URL on a phone.
2. Go to **Offline** and wait for "Ready to use offline — all N files cached."
3. Go to **Install** and follow the instructions for the device.
4. Run the airplane-mode test listed on the Offline screen.

If the Offline screen reports missing files, tap **Re-download for offline**. It lists exactly which files failed, which is usually a path or case mismatch on the host.

## Service worker requirements

- **HTTPS or `localhost`.** A service worker will not register over plain HTTP or from `file://`.
- **Same-origin scope.** The service worker is registered with scope `./`, and all paths in `asset-manifest.json` are relative, so the app works from a subdirectory as well as a domain root.
- **`service-worker.js` must be served from `public/`,** not from a CDN path outside the app scope.

## Custom domain

A custom domain works without changes. Everything is relative, so no absolute origin is baked into the app. After moving to a new domain, users who installed from the old one should reinstall, because the service worker registration is per-origin.

## Shipping an update

1. Change the code or the data.
2. Bump `APP_VERSION` in `public/js/version.js`, `public/service-worker.js` and `public/asset-manifest.json`. If the data changed, bump `KB_VERSION` there and `kbVersion` / `checklistsVersion` inside the data files.
3. Run `npm test` — the suite fails if the versions disagree.
4. Redeploy.

Installed users get a banner offering the update the next time they open the app with a connection. It is never applied silently, because a page reloading itself under someone standing in the dust next to a running generator is not acceptable.

## What is intentionally absent

- No backend, database or API.
- No analytics, telemetry or third-party scripts.
- No remote AI or model calls — search runs entirely in the browser.
- No environment variables or secrets.
- No account or login.

Nothing leaves the device. The optional My RV profile, including the On Road Care number if the user chooses to save it, is stored only in that browser's local storage.
