# Live Lesson

A Slido-style live lesson website. Teachers sign in with Google and run their lesson from the board; students open the site on any device, type the lesson code and their name, and answer live. Students are sorted into groups from their answers and each group gets its own task.

- `site/` is the website (published to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`).
- `site/config.js` holds the Firebase web config.
- `firestore.rules` are the Firestore security rules (paste into Firebase console › Firestore › Rules).

## Setup

1. Firebase console: create a project, then create a Firestore database (production mode).
2. Authentication › Sign-in method: enable **Anonymous** and **Google**.
3. Authentication › Settings › Authorized domains: add your GitHub Pages domain (for example `yourname.github.io`).
4. Project settings › Your apps › Web app: copy the config into `site/config.js`.
5. Firestore › Rules: replace the rules with `firestore.rules` and publish.
6. GitHub repo › Settings › Pages › Source: **GitHub Actions**.

## Use

- Teacher: open `<site>/#teacher`, sign in, go to **Edit lesson** to write slides, load the sample lesson, or import your own slide design from a PDF. Press **Create join code**, then **Present**.
- Students: open `<site>`, type the code and their name.

## Data

- `codes/{CODE}` points a join code to its teacher.
- `spaces/{teacherUid}/deck|live|imgs` are readable by signed-in users (students sign in anonymously); only the teacher writes them.
- `spaces/{teacherUid}/keys` (answer keys, private notes) is teacher-only.
- `spaces/{teacherUid}/responses/{studentUid}`: each student writes only their own answers; only the teacher reads all of them.

## PowerPoint add-in

`site/addin/` is a PowerPoint content add-in served from the same site. Insert it on a slide and choose which lesson slide it shows (or let it follow the live lesson). In the slideshow, reaching that PowerPoint slide moves students' devices to the lesson slide, and the slide shows the class's answers with Close answers and Show answer buttons.

- One-time Google setup: Google Cloud console › APIs & Services › Credentials › the "Web client (auto created by Google Service)" OAuth client › Authorized redirect URIs › add `https://<your site>/addin/auth.html`. The add-in signs in through that page because PowerPoint blocks sign-in pop-ups. The client ID is `googleClientId` in `site/config.js`.
- Windows: download `site/addin/manifest.xml` and `site/addin/install-on-windows.cmd` into one folder, run the .cmd, restart PowerPoint, then Insert › Add-ins › My Add-ins › Developer Add-ins › Live Lesson.
- PowerPoint on the web: Home › Add-ins › More Add-ins › My Add-ins › Upload My Add-in › choose `manifest.xml`.

### PowerPoint side panel

Install `taskpane-manifest.xml` for **Live Lesson Studio**, alongside the original content add-in. The **Home → Live Lesson → Add interaction** ribbon button opens a native PowerPoint task pane. Choose an interaction type, edit and save, then use **Add to slide** to place a question card on the selected slide. **Launch** sends it to student devices. Results and Groups stay in the same pane.

Question cards are editable PowerPoint text, not embedded live charts. The original content add-in still supplies charts on slides. Native card insertion needs PowerPointApi 1.5. Select exactly one slide before adding a card. Slide associations are saved with the presentation; launching is manual.
