---
name: verify-shiren6
description: "Drive the 風来のシレン６ 道具識別 page in a browser and prove category, status, price, capacity, and identified-mark behavior. Use when verifying shiren6 UI or filter changes, or when asked to prove the item identifier."
---

# Verify 風来のシレン６ 道具識別

The user surface is one static page, `index.html`. It fetches `data/shiren6_prices.json` and renders into `#app`. There is no build, no auth, and no second route. `tests/identify.test.mjs` covers the filter functions; it is not a substitute for driving the page.

`file://` cannot load the catalog. Serve the repo root over HTTP.

Two instances can run at once on different ports. `localStorage` key `shiren6.identified` is per origin, so a different port is a different store. Do not drive a tab or port this run did not start.

## Launch

From the repo root:

```bash
node .cursor/skills/verify-shiren6/scripts/serve.mjs --port 4173
```

`--port` defaults to `4173`, or `SHIREN6_VERIFY_PORT` when `--port` is omitted. If the port is in use the process exits 1. Pick another port. Do not attach to a server already listening.

Ready when stdout prints one line:

```text
READY http://127.0.0.1:4173/ pid=<pid> token=<token>
```

Keep that pid and token. The page is ready when Doctor prints `OK` for that same token. The heading `風来のシレン６ 道具識別` is the in-page ready signal after navigation.

Teardown is in Cleanup. A failed launch still needs Cleanup if a pid was printed.

## Doctor

Read-only. Run it before the first drive, and again after a failed drive or a restart.

```bash
node .cursor/skills/verify-shiren6/scripts/doctor.mjs --url http://127.0.0.1:4173/ --token <token>
```

Exit 0 prints `OK http://127.0.0.1:4173/`. It checks the verify header, the page title `風来のシレン６ 道具識別`, and catalog title `シレン6 値段一覧表` with categories `草`, `巻物`, `腕輪`, `壺`, `杖`. A token mismatch means this is not the process Launch started. Do not drive it.

A missing Google Font does not fail Doctor. The page falls back to `Yu Gothic UI`.

## Drive

Read `features/README.md`, then the feature file. Drive the browser on the READY url in a new tab. Lock the tab while driving. Do not reuse a tab already open on this app. If `newTab: true` stops on `about:blank`, navigate that tab's viewId to the READY url.

1. `browser_snapshot` before every click. Click the ref whose role and accessible name match the recipe. Pass that name as the element description.
2. `安い方へ` and `高い方へ` each appear twice. The `買値` reel is the first pair. The `売値` reel is the second pair, marked `nth: 1` in the snapshot. Click the button in the reel the recipe names.
3. `状態` starts closed (`open` is false) even though its switches are already in the accessibility snapshot. Click the summary named `状態 …` before clicking a switch. `容量` / `残り回数` are absent from the snapshot until the category is `壺` or `杖`, and they start closed too.
4. Focus a reel by clicking the widget named `買値` or `売値`, then `browser_press_key` with `ArrowDown` or `ArrowUp`. `Escape` applies only while the reset confirm is open (focus starts on `やめる`).
5. Read resulting state with `browser_cdp` method `Runtime.evaluate`, `returnByValue: true`. Do not call CDP `Input.*` or `Storage.*`.

```javascript
(() => ({
  identified: localStorage.getItem('shiren6.identified'),
  count: document.querySelector('[data-role="count"]')?.textContent ?? null,
  emptyHidden: document.querySelector('[data-role="empty"]')?.hidden ?? null,
  buySelected: document.querySelector('[data-role="buy-reel"] .reel-item.is-selected')?.textContent ?? null,
  sellSelected: document.querySelector('[data-role="sell-reel"] .reel-item.is-selected')?.textContent ?? null,
  names: [...document.querySelectorAll('.result-name')].map((el) => el.textContent),
  paramsHidden: document.querySelector('[data-role="params"]')?.hidden ?? null,
  paramsTitle: document.querySelector('[data-role="params-title"]')?.textContent ?? null,
  paramsValue: document.querySelector('[data-role="params-value"]')?.textContent ?? null,
}))()
```

Reload by navigating to the same READY url. That is how persistence is proven.

Clear the identify store only as fixture setup, before a recipe that requires an empty store:

```javascript
localStorage.removeItem('shiren6.identified')
```

Then reload. Proving the reset button still requires clicking `識別済みを初期化` and `初期化する`.

## Evidence

Write proof under `.cursor/skills/verify-shiren6/artifacts/<feature-id>/`. Cleanup must not delete that directory.

For the step you are proving, save:

- `action.yml` — accessibility snapshot of the control you used (the button, switch, chip, or reel), taken before or at the click.
- `result.yml` — accessibility snapshot after the page has updated. The heading `風来のシレン６ 道具識別` must be in it.
- `result.png` — `browser_take_screenshot` with `fullPage: true` and `filename` `result.png`. The tool reports a saved path outside the repo. Copy that file into this directory. The heading must be visible. The count next to `候補` is painted text, not its own accessibility name, so the screenshot is what shows `54件` and `54件（識別済み 1）`.
- `state.json` — the `Runtime.evaluate` object, plus `feature` (the feature id) and `entry` (which user entry point you used).

Assert the resulting control state and the side effect. A filter proof is the count plus the names in `state.json`, not only the screenshot. An identify proof is `aria-pressed` on the toggle and the `shiren6.identified` value after a reload.

The page must load `data/shiren6_prices.json` from this server. Do not stub the catalog, call `reduceFilter`, or set `localStorage` to fake a result you are proving.

## Cleanup

Do this after a pass, and after every failed attempt.

1. Copy any screenshot or snapshot still sitting outside the artifacts directory into `.cursor/skills/verify-shiren6/artifacts/<feature-id>/`.
2. Close only the verification tab (`browser_tabs` list, then `close` on that tab's index). Leave the user's other tabs alone.
3. Stop the server by the READY pid. On Windows: `Stop-Process -Id <pid>`. Do not kill `node` by process name.
4. Confirm that pid is gone.

Artifacts stay. Clearing `shiren6.identified` in the verification origin is optional scratch cleanup and happens before the tab is closed, never by deleting files under `artifacts/`.

## Helpers

Both scripts are run with `node` from the repo root. They take no other input than the flags in Launch and Doctor.

- `scripts/serve.mjs` — static server for the repo root, bound to `127.0.0.1`, header `X-Shiren6-Verify`.
- `scripts/doctor.mjs` — read-only check that the URL is the server this run started and that the page and catalog loaded.
