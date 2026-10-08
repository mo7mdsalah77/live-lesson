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

Install `taskpane-manifest.xml` for **Live Lesson Studio**, alongside the original content add-in. The **Home → Live Lesson → Add interaction** ribbon button opens a native PowerPoint task pane.

1. Choose an interaction type.
2. Write the question and its choices. Teaching options retain points, explanations, private notes, grouping and hinge rules. Group tasks retain a task for each tier.
3. Click **Add to presentation**. A new live interaction slide is inserted after the selected PowerPoint slide. No PDF import or second deck editor is involved.
4. Edit the question in the sidebar; its existing live slides read the updated question.

Insertion uses a one-slide PPTX template containing the original Live Lesson content add-in, with an independent question setting and unique web-extension instance ID. It requires PowerPointApi 1.5 and the content manifest installed on the presenting computer. Question data and private answer keys stay in Firebase; the PPTX holds only the question reference and a preview without answers. Results and Groups stay in the pane. Automatic slideshow activation still needs verification in real PowerPoint; Launch remains available as a fallback.

Tests: `node --test tests/*.test.cjs`.
