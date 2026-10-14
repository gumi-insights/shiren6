# Pick a price

The 買値 and 売値 reels narrow the list to items with that price. The center row is the selection. Choosing a price on one reel resets the other reel to 指定なし.

## Sub-features

- `price-buy-nudge` selects the cheapest 草 buy price from the 買値 reel's 高い方へ button.
- `price-buy-key` selects that same price with ArrowDown on the 買値 reel.
- `price-sell-nudge` selects the cheapest 草 sell price and clears 買値.
- `price-exclusive` keeps only one side selected.

## How to get to it (user POV)

- Press `高い方へ` or `安い方へ` on the 買値 reel or the 売値 reel.
- Focus the reel named `買値` or `売値` and press ArrowDown or ArrowUp.
- Drag or use the wheel on a reel. Those are the same control. Drive it with the buttons or the arrow keys.

## Driving it with the browser

Preconditions:

- Doctor printed `OK` for this run.
- Category `草` is pressed. 通常 and 祝福 are included. 呪い is excluded. Both reels show `指定なし`.
- `shiren6.identified` is `null`.

- **Buy nudge.** Choose `高い方へ` on the 買値 reel (the first button with that name). `buySelected` is `10`. `sellSelected` stays `指定なし`. `count` is `1件`. `names` is `["雑草"]`. The row shows 買値 `10` and 売値 `4`. The row icon src ends in `grass.png`. The price line has no status image and no text `通常`. The listitem name is `雑草 買値 10 売値 4`.
- **Buy key.** Click `安い方へ` on the 買値 reel until `buySelected` is `指定なし`. Click the reel named `買値` to focus it, then press `ArrowDown`. `buySelected` is `10` and `names` is `["雑草"]` again.
- **Sell replaces buy.** With 買値 still at `10`, choose `高い方へ` on the 売値 reel (the button with `nth: 1`). `sellSelected` is `4`. `buySelected` returns to `指定なし`. `count` is `1件` and `names` is `["雑草"]`.
- **Step back.** Choose `安い方へ` on the 売値 reel. `sellSelected` is `指定なし` and `count` is `54件`.
- **Proof.** Capture the buy-nudge result, before the sell step replaces it. Save `action.yml`, `result.yml`, `result.png`, and `state.json` with `feature` `filter-price` and `entry` `買値 高い方へ`. `state.json` has `buySelected` `10`, `sellSelected` `指定なし`, and `names` `["雑草"]`.

## Gotchas

- Reel rows are not buttons. The selected row is `[data-role="buy-reel"] .reel-item.is-selected` or the sell equivalent. Read it from `state.json`.
- A click on the reel window also starts a drag. Use the nudge buttons or arrow keys for a one-step move. Do not drag unless the recipe says to.
- `ArrowDown` moves toward higher prices only when that reel has focus. Arrow keys with focus elsewhere scroll the page and do not change the filter.
- Only one side stays active. Assert the other side's selected text, not just the side you clicked.
- Prices render with `ja-JP` grouping. `1000` is the string `1,000`.
- The first 草 step is `10` only while 呪い is excluded. Cursed 雑草 buy `8` is not on the reel in the default status set.
- Choosing a category, or a 容量 / 残り回数 chip, sets both reels back to `指定なし`.
