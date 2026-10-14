# Set capacity or uses

壺 shows a 容量 chip row. 杖 shows a 残り回数 chip row. Other categories hide that block. A chosen number keeps items whose natural range contains it, and clears any selected price.

## Sub-features

- `param-hidden` leaves the block hidden for 草, 巻物, and 腕輪.
- `param-pot` filters 壺 to 容量 5.
- `param-staff` filters 杖 to 残り回数 7.
- `param-clear` restores 指定なし and clears a selected price.

## How to get to it (user POV)

- Choose `壺`, then open 容量. Chips are `指定なし`, `2`, `3`, `4`, and `5`.
- Choose `杖`, then open 残り回数. Chips are `指定なし`, `2`, `3`, `4`, `5`, `6`, and `7`.

## Driving it with the browser

Preconditions:

- Doctor printed `OK` for this run.
- Identify marks are irrelevant.

- **Hidden on grass.** Load the page on `草`. `paramsHidden` is true. The snapshot has no summary named `容量` or `残り回数`.
- **Pot capacity 5.** Choose `壺`. `paramsHidden` is false, `paramsTitle` is `容量`, `paramsValue` is `指定なし`, and `count` is `20件`. Open 容量. The chip `指定なし` is pressed. Choose `5`. That chip is pressed, `paramsValue` is `5`, and `count` is `13件`. `names` includes `保存の壺` and `倉庫の壺`. `names` does not include `底抜けの壺`, `おはらいの壺`, `呪いの壺`, `笑いの壺`, `合成の壺`, `強化の壺`, or `弱化の壺`. Each shown row includes `容量 5`.
- **Staff uses 7.** Choose `杖`. Open 残り回数 and choose `7`. `paramsTitle` is `残り回数`, `paramsValue` is `7`, and `count` is `8件`. `names` is `ガイコツまどうの杖`, `ただの杖`, `場所がえの杖`, `吹き飛ばしの杖`, `痛み分けの杖`, `転ばぬ先の杖`, `飛びつきの杖`, and `魔道の杖`. Each shown row includes `残り回数 7`.
- **Clear.** On that 杖 list, choose `指定なし`. `paramsValue` is `指定なし` and `count` is `20件`.
- **Clears price.** On `壺`, click the `買値` reel's `高い方へ` once so `buySelected` is not `指定なし`. Open 容量 and choose `5`. `buySelected` and `sellSelected` are both `指定なし`, and `count` is `13件`.
- **Proof.** Capture 壺 at 容量 5. Save `action.yml`, `result.yml`, `result.png`, and `state.json` with `feature` `filter-parameter` and `entry` `容量 5`. `state.json` `count` is `13件` and `names` includes `保存の壺`.

## Gotchas

- The disclosure stays closed after the category change. `paramsHidden: false` only means the summary exists. Open it before the chips are in the snapshot.
- Chip names are the digits `2` through `5` or `7`, not `容量 5`. The fold value and the result line carry the word 容量 or 残り回数.
- Chips are the union of natural ranges. 壺 has no `0` or `1` chip. 杖 has no `0` or `1` chip. Do not look for those buttons.
- With 指定なし, a row shows `容量設定値 3-5` (or the item's own range) and does not list every capacity. One selected chip shows a single `容量 N` or `残り回数 N` line.
- 底抜けの壺 is in the unfiltered 壺 list and drops out at 容量 5 because its range is `2-4`.
