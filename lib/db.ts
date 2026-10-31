import { neon } from "@neondatabase/serverless";
import type { Answers } from "./survey";

/**
 * Storage for survey responses.
 *
 * With DATABASE_URL set  -> Neon Postgres (the real thing).
 * Without it             -> an in-memory array, so the app runs before the
 *                           database exists. Restart the server and it is gone.
 *                           That is the point: it shows the room why we need one.
 */

export type StoredResponse = {
  id: string;
  survey_id: string;
  answers: Answers;
  created_at: string;
};

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// Lazy: do not touch env at module load (serverless platforms load env late).
function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

/** Creates the table on first use so a missed `npm run db:setup` never breaks a demo. */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS responses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id text NOT NULL,
        answers jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE INDEX IF NOT EXISTS responses_survey_created_idx
        ON responses (survey_id, created_at DESC)`;
    })().catch((e) => {
      schemaReady = null; // try again on the next request
      throw e;
    });
  }
  return schemaReady;
}

// ---- in-memory fallback (demo mode) ----
const memory: StoredResponse[] = [];

export async function saveResponse(surveyId: string, answers: Answers): Promise<StoredResponse> {
  if (!isDbConfigured()) {
    const row: StoredResponse = {
      id: crypto.randomUUID(),
      survey_id: surveyId,
      answers,
      created_at: new Date().toISOString(),
    };
    memory.push(row);
    return row;
  }

  await ensureSchema();
  const rows = await sql()`
    INSERT INTO responses (survey_id, answers)
    VALUES (${surveyId}, ${JSON.stringify(answers)}::jsonb)
    RETURNING id, survey_id, answers, created_at
  `;
  return rows[0] as StoredResponse;
}

export async function listResponses(surveyId: string): Promise<StoredResponse[]> {
  if (!isDbConfigured()) {
    return memory.filter((r) => r.survey_id === surveyId);
  }

  await ensureSchema();
  const rows = await sql()`
    SELECT id, survey_id, answers, created_at
    FROM responses
    WHERE survey_id = ${surveyId}
    ORDER BY created_at ASC
  `;
  return rows as StoredResponse[];
}
