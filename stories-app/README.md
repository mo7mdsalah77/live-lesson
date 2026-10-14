# حواديت / Hawadeet – kids' story book app

21 well-known tales (Arabian Nights, Egyptian folk tales, fables and classics) with illustrated scenes, in **Egyptian dialect** and **Modern Standard Arabic**. Every page has both versions plus a moral at the end.

- **Auto-narration**: the device reads the story aloud with its Arabic text-to-speech voice (prefers an `ar-EG` voice for the Egyptian version), highlights the word being read and turns the pages by itself. Speed: slow / normal / fast; voice picker; pauses when the app goes to the background.
- **Read-it-yourself**: large written text so a parent can tell the story; a "listen to this page" button is optional.
- Library with filters (Arabian Nights / folk tales / Kalila wa Dimna fables / world tales), progress badges and resume, text-size control, swipe or buttons to turn pages. Fully offline, no ads, no tracking.

Stories: Ali Baba, Aladdin, Sindbad, El-Shater Hassan, Goha and the donkey, Goha and the pot, the Fisherman and the Jinni, the Lion and the Mouse, the Hare and the Tortoise, the Crow and the Fox, the Fox and the Grapes, Little Red Riding Hood, Cinderella, the Ugly Duckling, the Ant and the Grasshopper, the Three Little Pigs, Goldilocks, the Monkey and the Crocodile, the Ringed Dove, the Lion and the Clever Hare, the Boy Who Cried Wolf.

New stories only need text and a scene list in `www/stories.js`.

Run: open `www/index.html`. Tests: `node --test tests/data.test.cjs` (content checks) and `NODE_PATH=../node_modules node tests/e2e.cjs` (headless run with a fake speech engine).
Note: speech quality depends on the voices installed on the device (Android: Settings > Text-to-speech > install Arabic).

## Android APK
Package `com.mo7mdsalah.hawadeet`, no permissions, fully offline (fonts are bundled in `www/fonts`). The app name follows the phone language (حواديت / Hawadeet). Inside the APK the narration uses the native Android text-to-speech plugin (`@capacitor-community/text-to-speech`), in the browser it uses `speechSynthesis`.
`.github/workflows/android-apk-stories.yml` builds an installable debug APK on every push that touches `stories-app/` and publishes it as a GitHub pre-release (`stories-apk-<run>`).
Illustrations: `www/art.js` draws cel-shaded characters, animals and props; `www/scenes.js` composes layered backgrounds with light rays, particles and slow camera drift; scene data lives in `www/stories.js`.
