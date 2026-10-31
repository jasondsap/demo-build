export default function DemoModeBanner() {
  return (
    <div className="rounded-lg border border-gold/40 bg-amber-50 px-4 py-3 text-sm text-ink">
      <span className="font-semibold text-gold">Demo mode.</span> No database is connected, so
      responses live in this server&apos;s memory and vanish on restart. Set{" "}
      <code className="rounded bg-white px-1">DATABASE_URL</code> in <code className="rounded bg-white px-1">.env.local</code>{" "}
      to keep them.
    </div>
  );
}
