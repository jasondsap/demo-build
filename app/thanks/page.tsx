import Link from "next/link";

export default function ThanksPage() {
  return (
    <div className="bg-white rounded-xl border border-line p-8 text-center space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Thank you</h1>
      <p className="text-muted">Your answers were recorded anonymously.</p>
      <div className="flex justify-center gap-3">
        <Link href="/results" className="rounded-lg bg-teal px-4 py-2 text-white font-medium hover:opacity-90">
          See the results
        </Link>
        <Link href="/" className="rounded-lg border border-line px-4 py-2 font-medium hover:bg-mist">
          Submit another
        </Link>
      </div>
    </div>
  );
}
