# DASC513 — Tutorial Activities

Four escape-room tutorials in which students audit a fictional health-AI
company across the module's four themes: bias, transparency, the
privacy/economics/environment triad, and uncertainty. Each room takes about two
hours and works in groups of three or four.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploying to Cloudflare Pages

This app is exported as a static site; it has no server-side runtime or
backend. Connect the GitHub repository to Cloudflare Pages and use these build
settings:

- **Production branch:** `main`
- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Root directory:** `/` (the repository root)

The repository pins Node.js 22 with `.node-version`. The exported site includes
the landing page, all tutorial and gate routes, and a static 404 page. Student
progress is kept in browser `localStorage` and does not sync between devices.
After the first deployment, Cloudflare Pages will build and publish each push
to the production branch.

Students land on an introduction with a 2×2 grid of the four rooms. Each room
is a control room page plus three gates — an inbox, chat, wiki, blog,
brochure or document archive, each its own full-page app opened in a new
tab — that unlock in sequence (3 locks, then 3, then 4; ten in total). Every
lock asks one question and refuses an answer until the evidence it depends on
has been read. Solving a lock yields a debrief and one character of the
room's override code. Progress is kept in the browser; there is no login and
no backend.

All tutorial content lives in `lib/sessions/`. See `AGENTS.md` for the data
model, the rules the content validator enforces, and how to edit a room.
