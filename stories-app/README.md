# حواديت / Hawadeet – kids' story book app

21 well-known tales (Arabian Nights, Egyptian/Arab folk tales, Kalila wa Dimna fables and classics) with illustrated scenes, told in **simple, fully vocalised (mushakkal) Modern Standard Arabic**. The vocalisation makes the text readable for children and makes text-to-speech voices pronounce every word correctly. Every story ends with a moral and an end screen.

- **Auto-narration**: the device reads the story aloud with its Arabic text-to-speech voice (prefers `ar-SA`/`ar-XA`), highlights the word being read and turns the pages by itself. Speed: slow / normal / fast; voice picker; pauses when the app goes to the background.
- **Read-it-yourself**: large written text so a parent can tell the story; a "listen to this page" button is optional.
- Library with filters (Arabian Nights / folk tales / Kalila wa Dimna fables / world tales), progress badges and resume, text-size control, swipe or buttons to turn pages. Fully offline, no ads, no tracking.

Stories: Ali Baba, Aladdin, Sindbad, El-Shater Hassan, Goha and the donkey, Goha and the pot, the Fisherman and the Jinni, the Lion and the Mouse, the Hare and the Tortoise, the Crow and the Fox, the Fox and the Grapes, Little Red Riding Hood, Cinderella, the Ugly Duckling, the Ant and the Grasshopper, the Three Little Pigs, Goldilocks, the Monkey and the Crocodile, the Ringed Dove, the Lion and the Clever Hare, the Boy Who Cried Wolf.

New stories only need text and a scene list in `www/stories.js`.

Run: open `www/index.html`. Tests: `node --test tests/data.test.cjs` (content checks) and `NODE_PATH=../node_modules node tests/e2e.cjs` (headless run with a fake speech engine).
Note: speech quality depends on the voices installed on the device (Android: Settings > Text-to-speech > install Arabic).

## Android APK
**Languages:** Arabic (vocalised MSA) and English; switch with the العربية / English buttons on the library screen or in the reader. Layout direction, voices and narration follow the chosen language (English texts live in `www/stories-en.js`).

**Full screen:** from a story's start sheet choose «شاشة كاملة» (or tap ⛶ in the reader): only the picture is shown, with an always-visible mute button (🔇). Muted, the pages still turn on a timer so a parent can tell the story aloud; tap the screen sides (or swipe) to turn pages yourself. The phone's back button leaves full screen first.

**Arabic voice quality** depends on the phone's text-to-speech engine, not the app. Install *Speech Services by Google* and download the Arabic voice, then pick it from the voice list (a short sample is spoken when you choose one). Text is read sentence by sentence at a slow default speed.

Package `com.mo7mdsalah.hawadeet`, no permissions, fully offline (fonts are bundled in `www/fonts`). The app name follows the phone language (حواديت / Hawadeet). Inside the APK the narration uses the native Android text-to-speech plugin (`@capacitor-community/text-to-speech`), in the browser it uses `speechSynthesis`.
`.github/workflows/android-apk-stories.yml` builds an installable debug APK on every push that touches `stories-app/` and publishes it as a GitHub pre-release (`stories-apk-<run>`).
Illustrations: `www/art.js` draws cel-shaded characters, animals and props; `www/scenes.js` composes layered backgrounds with light rays, particles and slow camera drift; scene data lives in `www/stories.js`.

Navigation: the phone's back button goes end screen/reader -> library -> exit (history API); the on-screen home button uses the same path.
