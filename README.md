# Calculator PWA — iOS 26 tuned build

This build is tuned against the supplied iOS 26 Calculator screenshot and keeps the reveal format fixed as **DDMMYYHHMM**.

## Changes in this build
- iOS 26-style geometry tuned for a 440 CSS-pixel wide iPhone screen.
- Solid native-like key colors and revised spacing/button sizes.
- Ongoing calculation is shown as an expression, e.g. `123,456+654,321+`.
- Thousands separators are added automatically to every number as it is entered.
- After `=`, the previous expression appears in a smaller gray line above the result.
- C/AC now behaves more like the current iPhone Calculator: C clears the current entry; AC clears the whole expression.
- Reveal digits remain DDMMYYHHMM internally; the visual display applies normal calculator thousands separators.

## Hidden performance setup
Long-press the C/AC key for about 1.5 seconds.

Recommended setup:
- Force method: Result Force
- First participant: 6 digits
- Second participant: 6 digits
- Reveal format: DDMMYYHHMM (fixed)

## Routine
1. Enter participant 1's six-digit number.
2. Press +. The + remains visible in the expression.
3. Enter participant 2's six-digit number.
4. Press + again.
5. Participant 3 enters random digits.
6. Press =.
7. The result becomes the current DDMMYYHHMM value. Like the real calculator, thousands separators are shown visually.

## Updating an existing GitHub Pages install
Replace all old repository files with the files from this folder, commit, wait for GitHub Pages to redeploy, then fully close/reopen the Home Screen web app. If an older cached version remains, delete the Home Screen app and add it again from Safari.
