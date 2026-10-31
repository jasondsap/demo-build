-- Community Pulse: one table. Every row is one anonymous survey submission.
-- Run with: npm run db:setup   (or paste into the Neon SQL editor)

CREATE TABLE IF NOT EXISTS responses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id   text        NOT NULL,
  answers     jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS responses_survey_created_idx
  ON responses (survey_id, created_at DESC);
