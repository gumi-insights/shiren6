# Include a status

Status switches decide which of 通常, 祝福, and 呪い appear on each candidate. Turning every status off shows an empty list. 腕輪, 壺, and 杖 have no 祝福 switch.

## Sub-features

- `status-open` reveals the switches from the 状態 disclosure.
- `status-exclude-all` shows the empty copy when every switch is off.
- `status-cursed-only` prices 雑草 at the cursed buy and sell.
- `status-all-grass` lists 81 separate 草 cards, one per status.
- `status-no-blessed` is the 腕輪 switch list.

## How to get to it (user POV)

- Open 状態. The summary shows the included status names.
- Choose a switch. The name is `<status>、含める` or `<status>、含めない`.

## Driving it with the browser

Preconditions:

- Doctor printed `OK` for this run.
- Category `草` is pressed, which is the state after a fresh load.
- Identify marks are irrelevant. Do not assert `shiren6.identified` here.

- **Open.** Choose the summary whose name starts with `状態`. The group named `状態` appears. Pressed switches read `通常、含める` and `祝福、含める`. `呪い、含めない` is not pressed. The summary value reads `通常・祝福`.
- **Empty.** Turn off `通常、含める` and `祝福、含める`. `count` is `0件`. `[data-role="empty"]` is shown and its text is `一致する道具がありません`. `names` is empty.
- **Cursed only.** Turn on `呪い、含めない` while 通常 and 祝福 stay off. `count` is `27件`. The empty paragraph is hidden. `雑草` is in `names`. Its row shows 買値 `8` and 売値 `3`, and it does not show a `祝福` price.
- **All three.** Turn 通常 and 祝福 back on so every grass switch is `含める`. `count` is `81件`. 雑草 is three separate cards sorted by buy. 呪い is 買値 `8` and 売値 `3`, then 通常 is 買値 `10` and 売値 `4`, then 祝福 is 買値 `20` and 売値 `8`. The row icons are `grass-cursed.png`, `grass.png`, and `grass-blessed.png`. The price line has no status image and no text `呪い`, `通常`, or `祝福`.
- **No blessed on bracelets.** Choose `腕輪`, then open `状態`. The group contains `通常、含める` and `呪い、含めない` only.
- **Proof.** Capture the cursed-only 雑草 row. Save `action.yml`, `result.yml`, `result.png`, and `state.json` with `feature` `filter-status` and `entry` `状態`. `state.json` `count` is `27件` and `names` includes `雑草`.

## Gotchas

- The accessibility snapshot lists the status switches while `状態` is still closed (`open` is false). Click the summary before treating the panel as open.
- The accessible name uses an ideographic comma: `通常、含める`, not a halfwidth comma.
- The price line never shows a status image or the words `通常`, `祝福`, or `呪い`. The row icon file is the status picture.
- `呪い` uses `floor(base * 87 / 100)`. 雑草's cursed buy is `8`, not `9`.
- Turning statuses off does not change the category, the reels, or `shiren6.identified`.
- Default after choosing a category is 呪い off, and 祝福 on only for 草 and 巻物.
