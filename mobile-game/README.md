# Star Dodge – Android game

One-thumb arcade game: drag to steer, collect stars, dodge red blocks. HTML5 canvas game (`www/`) wrapped as a native Android app with Capacitor 8 (target SDK 36, min SDK 24, package `com.mo7mdsalah.stardodge`). No ads, no tracking, works offline.

## Try it
Open `www/index.html` in a browser (or `npx serve www`). `npm test` runs the game-rule tests.

## Build
Needs JDK 21 and the Android SDK (Android Studio installs both).
```
npm ci
npm run build:debug      # android/app/build/outputs/apk/debug/app-debug.apk
```
Open `android/` in Android Studio to run on a device/emulator.

## Release to Google Play
1. Create a Google Play developer account (one-time US$25) and a new app in Play Console.
2. Create an upload key once and keep it safe:
   `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
3. Add GitHub repo secrets: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 upload.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. Actions › "Android release (Star Dodge)" › Run workflow. Download the `.aab` artifact (version code = run number). Local alternative: export the same four variables as `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, then `npm run build:release`.
5. Play Console: upload the `.aab` to Internal testing, then Production. Accept Play App Signing.
6. Store listing: icon `store/icon-512.png`, feature graphic `store/feature-graphic-1024x500.png`, at least 2 phone screenshots (take them from an emulator), short/long description, category Games › Arcade, host `PRIVACY.md` at a public URL (e.g. GitHub Pages) for the privacy-policy field.
7. Complete the Data safety form (no data collected), content rating questionnaire, and target audience. New personal accounts must run a closed test with 12+ testers for 14 days before production access.

Regenerate icons/graphics: `CHROME_PATH=/path/to/chrome node store-assets-gen.cjs` (needs `npm i` at the repo root for Playwright).
