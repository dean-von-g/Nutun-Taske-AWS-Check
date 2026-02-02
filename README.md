# Nutun - Amazon Connect Optimization Scorecard (Static Site)

## What this is
A simple, backend-free website you can host on GitHub Pages.
- Loads questions from `questions.json`
- Users rate each question from 0 to 5
- Calculates:
  - Overall % of max score
  - Yes/No % using a threshold of 3+ as "yes"
  - Section breakdown

## Deploy to GitHub Pages
1. Create a repo (or use an existing one).
2. Put these files in the repo root:
   - index.html
   - styles.css
   - app.js
   - questions.json
3. In GitHub: Settings -> Pages
   - Source: Deploy from a branch
   - Branch: main / root
4. Open the Pages URL GitHub provides.

## Local testing
Because the app uses `fetch()` to load `questions.json`, run a tiny local server:
- Python: `python -m http.server 8000`
Then open: http://localhost:8000
