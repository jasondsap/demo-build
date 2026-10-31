# Community Pulse

A one-minute anonymous community survey with live aggregate results and an AI-written summary.
Built as the live exercise for **Applying Artificial Intelligence Responsibly in Rural Public Health
Practice** (APHA 2026 Learning Institute, San Antonio).

Seven parts, same as any app:

| Part | Choice here | Why |
| --- | --- | --- |
| App | Next.js 15 + TypeScript + Tailwind | One framework for pages and API |
| Database | Neon Postgres, one table | Serverless, free tier, branches |
| Identity | None | Nothing here is worth protecting. With one real name this would be wrong. |
| AI | Claude via the Anthropic API | Summarizes counts, never a person |
| Files | None | Nothing to upload |
| Hosting | Vercel | Git push = deploy |
| Connected services | None | Keep the demo honest |

**Ground rules:** no names, no contact details, no identifying questions. Fake data only. Aggregate results only.

---

## Run it locally

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL and ANTHROPIC_API_KEY
npm run db:setup                  # creates the table (safe to run twice)
npm run dev                       # http://localhost:3000
```

Without `DATABASE_URL` the app runs in **demo mode**: responses live in memory and disappear on restart.
Without `ANTHROPIC_API_KEY` the counts still work; only the summarize button is disabled.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New Project**, import the repo, keep the defaults.
3. Under **Environment Variables** add `DATABASE_URL` and `ANTHROPIC_API_KEY` (and `ANTHROPIC_MODEL` if you want something other than `claude-opus-5-5`).
4. Deploy. Every later `git push` to `main` redeploys.

The table is created automatically on first write, so a missed `db:setup` will not break a deploy.

---

## Live demo runbook

### Set up before the session (prefab)

- [ ] GitHub repo created and this code pushed
- [ ] Neon project created, pooled connection string in `.env.local` and in Vercel
- [ ] Anthropic API key in `.env.local` and in Vercel
- [ ] Vercel project connected to the repo with one green deploy (this is also the **fallback URL**)
- [ ] `npm run dev` works on the laptop, survey submits, results show, summary runs
- [ ] Claude Code open in this folder with permissions set so it does not pause for every edit
- [ ] Phone hotspot tested as backup wifi
- [ ] QR code for the deployed URL in the deck (slide 15)
- [ ] A 60-second screen recording of the full flow, in case everything fails

### Timing (about 45 minutes)

| Min | What | Who talks |
| --- | --- | --- |
| 0–5 | Pick the topic with the room. Three backups below. | Room |
| 5–15 | Ask Claude Code to rewrite `lib/survey.ts` for the room's topic. Show the diff. Run it. | Jason + Claude Code |
| 15–20 | Everyone fills it out on their phone (QR). Watch the count climb on `/results`. | Room |
| 20–30 | Add one more thing live: a question, a chart tweak, or the AI summary route (see options). | Jason + Claude Code |
| 30–35 | `git push`. Watch Vercel build. Refresh the live URL. | Jason |
| 35–43 | Run the RURAL test on what was just built (slide 17). | Room |
| 43–45 | What would have to change before one real name went in here. | Jason |

### Backup topics (pick if the room stalls)

1. **Naloxone access**: where people would look for it, what stops them carrying it, how confident they feel using it.
2. **Transportation barriers**: how people get to appointments, how often a ride falls through, what they do then.
3. **Staff burnout**: workload, what one task they would hand to a machine, what they would never hand over.

### Prompts to paste into Claude Code

**Rewrite the survey for the room's topic**

```
Rewrite the survey in lib/survey.ts for this topic: <TOPIC FROM THE ROOM>.
Keep the same structure: five questions, a mix of single, multi, scale and one optional text.
Change SURVEY.id to a new value. Follow the rules in CLAUDE.md: nothing identifying, aggregate only.
Do not touch any other file.
```

**Add a question**

```
Add a "multi" question to lib/survey.ts asking <QUESTION>. Options: <A, B, C, D>. Not required.
```

**Build the AI summary from scratch (if you deleted it before the session for a bigger live build)**

```
Add an AI summary to the results page. Create app/api/summarize/route.ts that aggregates all
responses for the current SURVEY.id using lib/aggregate.ts, sends ONLY that aggregate text to
Claude using @anthropic-ai/sdk (model from ANTHROPIC_MODEL, default claude-opus-5-5), and returns
a short plain-text summary with the sections "What stands out", "What people say would help",
"Suggested next steps" and "Caveats". Add a client component with a button on /results that calls
it and shows the text. The model must never see or describe an individual respondent. Fail soft if
ANTHROPIC_API_KEY is missing.
```

To make that a live build, before the session run:

```bash
git rm -r app/api/summarize components/SummaryPanel.tsx lib/ai.ts
```

and remove the two `SummaryPanel` lines from `app/results/page.tsx`. Commit on a branch called
`starter`. Keep `main` deployed as the finished fallback.

### If something breaks

| Symptom | Do this |
| --- | --- |
| Wifi dies | Hotspot. Local `npm run dev` works offline except the AI call. |
| Vercel build fails | Fallback URL from the prefab deploy still works. Say so, move on. |
| AI call fails | Counts still show. Read the error on screen; it is a teaching moment about fail-soft design. |
| Claude Code stalls | Edit `lib/survey.ts` by hand. It is one array. |
| Everything fails | Play the 60-second recording. |

---

## How the data flows

```
phone ──POST /api/responses──▶ validateAnswers() ──▶ Neon: responses(answers jsonb)
                                                              │
/results ◀── aggregate() counts ◀─────────────────────────────┘
    │
    └─ "Summarize the room" ──POST /api/summarize──▶ aggregateToText() ──▶ Claude ──▶ 4 short sections
```

The model receives counts and anonymous sentences. It never receives a row, an id or a timestamp.
