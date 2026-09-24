# iPhone-style Private Performance Calculator

A private installable web app (PWA) designed for a three-participant date/time reveal.

## Default performance setup

- Participant 1: 6 digits, then `+`
- Participant 2: 6 digits, then `+`
- Participant 3: random digits, then `=`
- Fixed reveal format: `DDMMYYHHMM`
- The app automatically disarms after one successful reveal.

## Hidden setup

Long-press **AC for about 1.5 seconds**.

In the hidden panel you can choose:

- **Result Force** — recommended. Participant 3 sees the exact random digits they type. Pressing `=` reveals the live date/time.
- **Complement Force** — participant 3 can touch arbitrary digit buttons, but the displayed digits are secretly replaced with the exact mathematical remainder required to reach the date/time target. Best when the screen is face-down or not watched closely.
- First and second participant digit counts.
- Minute rollover safety for Complement Force.
- **Arm Next Performance**.

## Recommended routine

1. Long-press `AC`.
2. Keep **Result Force** selected.
3. The reveal format is fixed to `DDMMYYHHMM`.
4. Set first digits = 6 and second digits = 6.
5. Tap **Arm Next Performance**.
6. Tap **Save & Close**.
7. Clear the display with a normal short tap on `AC` if needed.
8. Participant 1 enters/says a 6-digit number. Enter it, then press `+`.
9. Participant 2 enters/says another 6-digit number. Enter it, then press `+`.
10. Participant 3 taps any random digits they want. Their digits appear normally.
11. Press `=`. The result becomes the current date and time as `DDMMYYHHMM`.
12. The app automatically returns to normal mode after the reveal.

### Reading DDMMYYHHMM

Example: `2409261717`

- `24` = day
- `09` = month
- `26` = year
- `17:17` = time

Note: on days 1–9 the logical format begins with `0` (for example `0309261717`). The app displays the complete 10-digit string for the reveal.

## Complement Force routine

This mode more closely matches a mathematical "remainder" force.

1. Long-press `AC` and choose **Complement Force**.
2. Arm the next performance.
3. Enter the first 6-digit number + second 6-digit number exactly as above.
4. After the second `+`, participant 3 may tap arbitrary digit keys.
5. The calculator ignores which digit they touched and displays the next digit of the required remainder.
6. Press `=` after the full remainder is entered. The final result is the date/time target.

Important: because the displayed digit may not match the physical key touched, this mode is best when the display is face-down or the participant is not watching each individual key press. Result Force is safer for a face-up phone.

## Install using GitHub Pages

1. Create a new GitHub repository, for example `private-calculator`.
2. Unzip this project on your computer.
3. Upload **the files inside the folder** to the root of the repository. Do not upload only the ZIP file.
4. Commit the files.
5. Open the repository's **Settings**.
6. Select **Pages**.
7. Under **Build and deployment**, choose **Deploy from a branch**.
8. Choose branch **main** and folder **/(root)**, then Save.
9. Wait a minute or two for GitHub Pages to publish it.
10. GitHub will show an HTTPS address similar to `https://YOURNAME.github.io/private-calculator/`.
11. Open that address in **Safari on the iPhone**.
12. Tap Safari's **Share** button.
13. Choose **Add to Home Screen**.
14. If iOS offers **Open as Web App**, keep it enabled.
15. Name it `Calculator` (or any name you prefer) and tap **Add**.
16. Launch it from the new Home Screen icon once while online. The service worker will cache the files for offline use.
17. Test Airplane Mode before performing to confirm your iPhone has cached it.

## Updating later

Upload replacement files to the same GitHub repository. GitHub Pages will republish automatically. Because the app caches files for offline use, fully close and reopen the Home Screen app after an update. If an old version persists, remove the Home Screen app, open the web URL in Safari again, and add it back.

## Notes

- This project uses original CSS/SVG artwork; it does not contain Apple Calculator assets.
- It is tuned visually from the supplied iPhone screenshot, but a PWA cannot reproduce every native iOS material/animation exactly.
- The real iOS status bar remains provided by iOS when launched from the Home Screen.
