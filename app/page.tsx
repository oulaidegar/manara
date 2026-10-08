import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { LighthouseScene } from "@/components/landing/lighthouse-scene";
import { LANDING_PARTNERS } from "@/lib/landing/partners";

const typewriter = {
  className: "font-mono",
};

export default function LandingPage() {
  return (
    <main className={`relative flex min-h-screen flex-col bg-black ${typewriter.className}`}>
      <header className="absolute inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-6 text-sm text-neutral-300">
        <span className="tracking-[0.3em] text-neutral-500">manara</span>
        <nav className="flex items-center gap-6">
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/~/select-org">
              <button className="cursor-pointer transition-colors hover:text-white">&gt; sign in</button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/~/select-org">
              <button className="cursor-pointer border border-neutral-600 px-3 py-1.5 transition-colors hover:border-white hover:text-white">
                create account
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/~/select-org" className="transition-colors hover:text-white">
              &gt; open workspace
            </Link>
            <UserButton />
          </Show>
        </nav>
      </header>

      <LighthouseScene partners={LANDING_PARTNERS} fontClassName={typewriter.className}>
        <h1 className="text-5xl tracking-[0.18em] text-white sm:text-6xl">manara</h1>
        <p lang="ar" dir="rtl" className="mt-2 font-sans text-lg text-neutral-500">
          منارة
        </p>
        <p className="mt-6 max-w-md text-sm leading-6 text-neutral-400">
          Shedding light on the work of independent media and civil society across the Middle East &amp; North Africa.
        </p>
      </LighthouseScene>
    </main>
  );
}
