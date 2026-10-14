# حواديت / Hawadeet – kids' story book app

12 well-known tales (Arabian Nights, Egyptian folk tales, fables and classics) with illustrated scenes, in **Egyptian dialect** and **Modern Standard Arabic**. Every page has both versions plus a moral at the end.

- **Auto-narration**: the device reads the story aloud with its Arabic text-to-speech voice (prefers an `ar-EG` voice for the Egyptian version), highlights the word being read and turns the pages by itself. Speed: slow / normal / fast; voice picker; pauses when the app goes to the background.
- **Read-it-yourself**: large written text so a parent can tell the story; a "listen to this page" button is optional.
- Library with filters (Arabian Nights / folk / world tales), progress badges and resume, text-size control, swipe or buttons to turn pages. Fully offline, no ads, no tracking.

Stories: Ali Baba, Aladdin, Sindbad and the whale, El-Shater Hassan and Sitt el-Hosn, Goha and the donkey, the Lion and the Mouse, the Hare and the Tortoise, the Crow and the Fox, Little Red Riding Hood, Cinderella, the Ugly Duckling, the Ant and the Grasshopper.

Illustrations are drawn in code (`www/scenes.js`: 11 painted backgrounds + character emoji), so new stories only need text and a scene list in `www/stories.js`.

Run: open `www/index.html`. Tests: `node --test tests/data.test.cjs` (content checks) and `NODE_PATH=../node_modules node tests/e2e.cjs` (headless run with a fake speech engine).
Note: speech quality depends on the voices installed on the device (Android: Settings > Text-to-speech > install Arabic).
