# Mark identified

Each candidate has a ✔ control that records the item as identified. The record stays after reload and after switching category. 識別済みを初期化 asks for confirmation, then clears every category's marks.

## Sub-features

- `identify-toggle` marks 雑草 and updates the count.
- `identify-persist` shows the same mark after reload.
- `identify-other-category` keeps the stored id while 巻物 is showing.
- `identify-cancel` leaves the mark in place when the user chooses やめる or presses Escape.
- `identify-reset` clears the store from 初期化する.

## How to get to it (user POV)

- Choose the button on a candidate row. Its name is `<item>を識別済みにする`, and after it is on, `<item>の識別済みを外す`.
- Choose `識別済みを初期化` in the 候補 heading, then `やめる` or `初期化する`.

## Driving it with the browser

Preconditions:

- Doctor printed `OK` for this run.
- After a reload, `localStorage.getItem('shiren6.identified')` is `null`.
- Category `草` is pressed and `count` is `54件`.
- `識別済みを初期化` is disabled.

- **Mark.** Choose `雑草を識別済みにする`. Both 雑草 rows share the mark. Each button is pressed and its name is `雑草の識別済みを外す`. `count` is `54件（識別済み 1）`. `identified` is `["草:雑草"]`. `識別済みを初期化` is enabled.
- **Reload.** Navigate to the same READY url. The heading returns. Both `雑草の識別済みを外す` buttons are pressed. `identified` is still `["草:雑草"]`. `count` is `54件（識別済み 1）`.
- **Other category.** Choose `巻物`. `count` is `72件` and does not contain `識別済み`. `identified` is still `["草:雑草"]`. Choose `草` again. Both `雑草の識別済みを外す` buttons are pressed.
- **Cancel.** Choose `識別済みを初期化`. The text `識別済みの ✔ をすべて外します。別の種類で付けたものも含み、元には戻せません。` is visible, with `やめる` and `初期化する`. The reset button's `aria-expanded` is `true`. Choose `やめる`. The confirm block is gone, `aria-expanded` is `false`, and `identified` is still `["草:雑草"]`.
- **Escape.** Choose `識別済みを初期化` again. Focus is on `やめる`. Press `Escape`. The confirm block is gone and `identified` is unchanged.
- **Reset.** Choose `識別済みを初期化`, then `初期化する`. `identified` is `[]`. Both 雑草 button names are `雑草を識別済みにする` and neither is pressed. `count` is `54件`. `識別済みを初期化` is disabled.
- **Proof.** Capture the reloaded page with 雑草 still marked, before cancel. Save `action.yml` from the mark click, `result.yml` and `result.png` after reload, and `state.json` with `feature` `mark-identified` and `entry` `雑草を識別済みにする`. `state.json` `identified` is `["草:雑草"]` and the snapshot names `雑草の識別済みを外す`.

## Gotchas

- The ✔ glyph is `aria-hidden`. Proof is `aria-pressed` and the button name, plus `shiren6.identified` after reload. The screenshot shows the glyph. The glyph alone is not the proof.
- The stored id is `草:雑草` (`category:name`), not the display name by itself.
- `識別済みを初期化` is `disabled` while the store is empty, and `collapsed` while the confirm is closed. The warning sentence can appear in the snapshot even when the confirm is hidden. `やめる` and `初期化する` appear only after that button is clicked. A disabled button is not a successful reset.
- The count is the text of `[data-role="count"]`, painted beside `候補`. It has no accessibility name. Read `54件（識別済み 1）` from `state.json` or the screenshot.
- Reset clears every category, including marks that are not on screen. The confirm sentence is the user's warning for that.
- Switching category does not clear marks. A 巻物 list with no ✔ on screen can still have `["草:雑草"]` stored.
- Writing `localStorage` from the harness is fixture setup only. The mark and the reset in this recipe are button clicks.
