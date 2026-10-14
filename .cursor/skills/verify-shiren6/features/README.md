# 道具識別 verification map

This directory is the maintained source for verifying the user-facing behavior of 風来のシレン６ 道具識別. Read the index before driving the page, then use the matching feature file as the recipe.

## Baseline preconditions

- Serve the repo root with `node .cursor/skills/verify-shiren6/scripts/serve.mjs`. Keep the `READY` pid and token.
- Run `node .cursor/skills/verify-shiren6/scripts/doctor.mjs --url <ready-url> --token <token>` and require `OK`.
- Open `<ready-url>` in a new browser tab. Do not drive a tab or port this run did not start.
- A second run uses another `--port`. Origins do not share `localStorage`.
- Recipes that need an empty identify store start after `localStorage.removeItem('shiren6.identified')` and a reload.
- The only page is `/`. The heading is `風来のシレン６ 道具識別`.

## Driving conventions

- Start every recipe from the baseline unless its preconditions say otherwise.
- Snapshot, then click the ref whose role and accessible name match the bullet. Keep those names exact.
- `安い方へ` and `高い方へ` are duplicated. The `買値` reel's pair comes first. The `売値` reel's pair comes second.
- Open a closed disclosure before expecting its switches or chips in the snapshot.
- Read count, names, reel selection, and `shiren6.identified` with the `Runtime.evaluate` expression in the skill. Do not infer them from pixels alone.
- Reload to prove identify marks. Reloading is navigation to the same READY url.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof is an accessibility snapshot plus a full-page screenshot that shows `風来のシレン６ 道具識別`.
- Filter proof includes `state.json` `count` and `names`. Identify proof includes `aria-pressed` and `shiren6.identified` after reload.
- Record `feature` and `entry` in `state.json`. Write files under `.cursor/skills/verify-shiren6/artifacts/<feature-id>/`.
- Report an unreachable path with the attempted control and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph of user-visible behavior, then exactly these H2 sections in order:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with the browser`
4. `Gotchas`

## Features

- [Choose a category](./select-category.md) switches 草, 巻物, 腕輪, 壺, and 杖, and resets price and parameter.
- [Include a status](./filter-status.md) turns 通常, 祝福, and 呪い on or off, including the empty list.
- [Pick a price](./filter-price.md) sets 買値 or 売値 from the reels. One side clears the other.
- [Set capacity or uses](./filter-parameter.md) filters 壺 by 容量 and 杖 by 残り回数.
- [Mark identified](./mark-identified.md) records ✔ per item in `localStorage`, keeps it across reload, and clears it from the confirm step.
