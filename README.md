# Nour

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
- Windows: download `site/addin/manifest.xml` and `site/addin/install-on-windows.cmd` into one folder, run the .cmd, restart PowerPoint, then Insert › Add-ins › My Add-ins › Developer Add-ins › Nour.
- PowerPoint on the web: Home › Add-ins › More Add-ins › My Add-ins › Upload My Add-in › choose `manifest.xml`.

### PowerPoint side panel

Install `taskpane-manifest.xml` for **Nour**, alongside the original content add-in. The **Home → Nour → Add interaction** ribbon button opens a native PowerPoint task pane.

1. Choose an interaction type.
2. Write the question and its choices. Teaching options retain points, explanations, private notes, grouping and hinge rules. Group tasks retain a task for each tier.
3. Click **Add to presentation**. A new live interaction slide is inserted after the selected PowerPoint slide. No PDF import or second deck editor is involved.
4. Edit the question in the sidebar; its existing live slides read the updated question.

Insertion uses a one-slide PPTX template containing the original Nour content add-in, with an independent question setting and unique web-extension instance ID. It requires PowerPointApi 1.5 and the content manifest installed on the presenting computer. Question data and private answer keys stay in Firebase; the PPTX holds only the question reference and a preview without answers. Results and Groups stay in the pane. Automatic slideshow activation still needs verification in real PowerPoint; Launch remains available as a fallback.

Tests: `node --test tests/*.test.cjs`.

### Nour: presentation controls and student privacy

Each question can show projector results immediately, on click, or keep them hidden. Showing results does not reveal the correct answer. Accepted answers, teacher notes, answer keys, and class-response summaries are never published in the live-state document. Phones show only the active question and that student's own submitted response and group task. Legacy public key/summary fields are cleared when the owner opens the upgraded app.

A configured timer starts when the interaction starts, displays the remaining seconds, and closes voting at its deadline. Preview mode keeps voting closed. A short answer is ungraded by default; teachers can optionally turn on accepted-answer marking to retain scoring/grouping. Open responses never need an answer key.

**Windows installation:** the developer launcher is per presentation. `Nour.potx` is a reusable starter template, and the desktop Nour shortcut opens it. Run `install-nour-catalog.cmd` as administrator once to configure the supported shared-folder testing catalog, accessible through Home → Add-ins → Advanced → Shared Folder → Nour. The catalog installer shares only the manifest folder with the current Windows user and does not change macro security or other Office settings. Marketplace/organization deployment is needed for production-wide distribution.

Logo: `site/assets/nour-logo.png`; built-in ImageGen prompt in `site/assets/nour-logo-prompt.txt`.

### Quiz ranking, participants and question pictures

The Home ribbon button is labeled **Nour**. Multiple-choice questions offer **Allow multiple answers**, with checkbox answer keys and existing partial-credit scoring. Every question type supports a separately uploaded PNG/JPEG/WebP illustration; it appears before revealing answers on the projector and student devices. Images use the existing owner-write image store.

Poll bars show vote counts, percentages of respondents, and participant initials by default, with full-name and hidden-identity options. These are teacher/projector displays; participant lists are not sent in public live state. Quiz leaderboards use each current round's latest submission time: 1,000 accuracy points plus up to 500 speed points, multiplied by question points and partial credit. Incorrect answers earn zero. The speed window is the configured timer duration, or 30 seconds for untimed questions. Response time starts when that round is shown on the phone, using the same local clock at display and submission to avoid teacher/phone clock skew. Timing is recorded for new submissions; older responses do not receive invented speed scores. Group placement still uses accuracy, without speed bonuses.
