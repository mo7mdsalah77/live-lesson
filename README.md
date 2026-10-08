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
