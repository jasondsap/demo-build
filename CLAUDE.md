# CLAUDE.md

Community Pulse: a one-minute anonymous community survey with aggregate results and an AI summary.
Built live at the APHA 2026 Learning Institute as a teaching example. Keep it small and readable;
a room of public health people will be reading this code on a projector.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks)
npm run db:setup   # applies schema.sql to DATABASE_URL
```

## Stack

Next.js 15 App Router, TypeScript, Tailwind. Neon Postgres via `@neondatabase/serverless`.
Claude via `@anthropic-ai/sdk` (direct API, not Bedrock, because this app never holds PHI).
Deploys to Vercel. No auth on purpose: there is nothing here worth protecting, and that is a deliberate
teaching point. Do not add auth, cookies, analytics or tracking.

## Where things live

- `lib/survey.ts` — the ONLY file to edit to change the survey. Questions, labels, options, validation.
- `lib/db.ts` — save and list responses. Falls back to memory when `DATABASE_URL` is unset (demo mode).
- `lib/aggregate.ts` — turns rows into counts. This is the only data the AI ever sees.
- `lib/ai.ts` — the one Claude call. System prompt lives here.
- `app/page.tsx` + `components/SurveyForm.tsx` — the form, rendered from `SURVEY`.
- `app/results/page.tsx` + `components/ResultsCharts.tsx` + `components/SummaryPanel.tsx` — aggregate view and the summarize button.
- `app/api/responses/route.ts` — POST a submission. Validates against `SURVEY`, drops unknown keys.
- `app/api/summarize/route.ts` — POST, aggregates everything for the current `SURVEY.id`, calls Claude.
- `schema.sql` — one table, `responses(id, survey_id, answers jsonb, created_at)`.

## Rules that must not change

1. **No identifying data.** Never add a question that asks for a name, email, phone, date of birth,
   address, employer, or anything that could identify one person when combined. If asked to, push back.
2. **Aggregate only.** The AI receives counts and anonymous free-text answers, never a full row, never
   a per-respondent view. Results pages show totals, not individual submissions (free-text comments are
   shown as an unordered list without timestamps or ids).
3. **Validation stays server-side** in `validateAnswers()`. Unknown keys are dropped, options must match.
4. **Fail soft.** If the database or the API key is missing, the page still renders and says why.
5. **Change `SURVEY.id`** when the questions change in a way that makes old answers incomparable.

## Adding a question (the common live task)

Add an object to `SURVEY.questions` in `lib/survey.ts`. Types: `single`, `multi`, `scale`, `text`.
Nothing else needs to change: form, validation, results and the AI prompt all read from `SURVEY`.
To show a question only after a specific answer, add `showIf: { question: "<earlier id>", equals: "<option>" }`.
The form hides it, the server drops it if the condition is not met, and results note who was asked.

## Environment

`.env.local` for dev, Vercel project settings for prod: `DATABASE_URL`, `ANTHROPIC_API_KEY`,
optional `ANTHROPIC_MODEL` (default `claude-opus-5-5`).
