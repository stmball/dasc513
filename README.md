# DASC513 — Tutorial Activities

Four escape-room tutorials in which students audit a fictional health-AI
company across the module's four themes: bias, transparency, the
privacy/economics/environment triad, and uncertainty. Each room takes about two
hours and works in groups of three or four.

```bash
npm install
npm run dev      # http://localhost:3000
```

Students land on an introduction with a 2×2 grid of the four rooms. Each room
is a control room page plus three stages — an inbox, chat, wiki, blog,
brochure or document archive, each its own full-page app opened in a new
tab — that unlock in sequence (3 questions, then 3, then 4; ten in total).
Every question asks one thing and refuses an answer until the evidence it
depends on has been read. Solving a question yields a debrief and one
character of the room's override code. Progress is kept in the browser;
there is no login and no backend.

All tutorial content lives in `lib/sessions/`. See `AGENTS.md` for the data
model, the rules the content validator enforces, and how to edit a room.
