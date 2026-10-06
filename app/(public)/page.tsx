import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Radar
        </h1>
        <p className="mt-6 text-lg leading-8 text-[var(--muted-foreground)]">
          Understand what your organization produced, who it reached,
          how audiences responded, and what real-world changes occurred.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/sign-in"
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold leading-6 hover:opacity-70 transition-opacity"
          >
            Create account →
          </Link>
        </div>
      </div>
    </div>
  );
}
