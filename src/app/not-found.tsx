import Link from "next/link";

export default function NotFound() {
  return (
    <main className="moriva-container flex min-h-screen flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-moriva-teal">404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-moriva-ink">We couldn't find that page</h1>
      <p className="moriva-reading mt-2 text-sm text-moriva-slate">
        The page may have moved, or the record may not be visible to you. If you need urgent help, it is always available.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="min-h-11 rounded-lg bg-moriva-teal px-4 py-2 text-sm font-semibold leading-6 text-white hover:bg-moriva-teal-soft">
          Go to the home page
        </Link>
        <Link href="/help-now" className="min-h-11 rounded-lg bg-state-critical px-4 py-2 text-sm font-bold leading-6 text-white hover:opacity-90">
          Get urgent help
        </Link>
      </div>
    </main>
  );
}
