CBME Curriculum Planner (MBBS Phases I–III)

Competency-based planning and tracking aligned to NMC GMER and AETCOM. Schedule sessions across phases I–III with alignment/integration, innovative modalities, coverage tracking, blueprinting, and AI-generated materials.

Quick start

1) Install dependencies: `npm install`
2) Copy `.env.example` to `.env` and set values
3) Initialize DB: `npm run prisma:generate && npm run prisma:migrate -- --name init && npm run prisma:seed`
4) Run dev server: `npm run dev`

Environment

- `DATABASE_URL` (SQLite default) e.g. `file:./dev.db`
- `OPENAI_API_KEY` for AI generation

Notes

- Verify local alignment with the latest NMC GMER and curriculum committee decisions.
- AI outputs are drafts; faculty should review before use.

