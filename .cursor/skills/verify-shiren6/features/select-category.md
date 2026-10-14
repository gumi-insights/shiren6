# Choose a category

Choosing a category shows that category's items, the statuses that category has, and the parameter control only for 壺 and 杖. The previous category's price and parameter selection is cleared.

## Sub-features

- `category-grass` shows 草, with 祝福 available and no parameter control.
- `category-scroll` shows 巻物.
- `category-bracelet` shows 腕輪 and hides 祝福.
- `category-pot` shows 壺 and the 容量 control.
- `category-staff` shows 杖 and the 残り回数 control.
- `category-reset` clears a selected price when the category changes.

## How to get to it (user POV)

- Choose one of `草`, `巻物`, `腕輪`, `壺`, `杖` under 種類. They are on the only page as soon as it loads.

## Driving it with the browser

Preconditions:

- Doctor printed `OK` for this run.
- `shiren6.identified` is `null` after the baseline clear and reload.
- The heading `風来のシレン６ 道具識別` is visible.

- **Grass baseline.** Load the page. The button `草` is pressed. `state.json` has `count` `54件`, `paramsHidden` true, `buySelected` `指定なし`, and `sellSelected` `指定なし`. Open `状態`. Switches `通常、含める`, `祝福、含める`, and `呪い、含めない` are present.
- **Scrolls.** Choose `巻物`. The button `巻物` is pressed and `草` is not. `count` is `72件`. `paramsHidden` stays true.
- **Bracelets.** Choose `腕輪`. `count` is `37件`. Open `状態`. Switches are `通常、含める` and `呪い、含めない`. There is no switch whose name starts with `祝福`.
- **Pots.** Choose `壺`. `count` is `20件`. `paramsHidden` is false and `paramsTitle` is `容量`. Open `状態` and confirm there is still no `祝福` switch.
- **Staves.** Choose `杖`. `count` is `20件`. `paramsTitle` is `残り回数`.
- **Price clears on category change.** From `草`, click the `買値` reel's `高い方へ` once so `buySelected` is `10`. Then choose `巻物`. `buySelected` and `sellSelected` are both `指定なし`, and `count` is `72件`.
- **Proof.** Capture `巻物` after that return. Save `action.yml`, `result.yml`, `result.png`, and `state.json` with `feature` `select-category` and `entry` `巻物`. `result.yml` contains the heading and a pressed `巻物` button.

## Gotchas

- Accessible names of the category buttons are `草`, `巻物`, `腕輪`, `壺`, and `杖`. The icon text is `aria-hidden`.
- `祝福` exists for `草` and `巻物` only. Its absence on `腕輪`, `壺`, and `杖` is the check, not a missing render.
- `容量` and `残り回数` use the `hidden` attribute on `[data-role="params"]` when the category is anything else. A closed-but-present disclosure is not the same as hidden.
- Choosing a category rebuilds the status defaults: `通常` and `祝福` on where `祝福` exists, `呪い` off. It does not clear `shiren6.identified`.
- Counts with `呪い` excluded are unpriced cards (54 草, 72 巻物, 37 腕輪, 20 壺, 20 杖). 草 and 巻物 are one card per included status.
