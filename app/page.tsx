import Link from "next/link";
import { BookOpen, Building2, Users, Zap, Shield, GitBranch } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const user = await getSession();

  const features = [
    { icon: Building2, title: "Organizations", desc: "Create a private or public org. Invite teammates, teachers, and students. Control who can see what." },
    { icon: BookOpen, title: "Structured Courses", desc: "Build rich courses with lessons, quizzes, whiteboards, and code gists. Human-authored or AI-generated." },
    { icon: Users, title: "Role-Based Access", desc: "ORG_OWNER, TEACHER, and STUDENT roles per org. ADMIN and SUPERADMIN govern the platform." },
    { icon: Zap, title: "Gamified Progress", desc: "Badges, XP, and streaks keep students engaged. Teachers track completion and quiz scores in real time." },
    { icon: Shield, title: "Notion-Style Pages", desc: "Create shareable notes with view, comment, and edit permissions. Attach them to courses or orgs." },
    { icon: GitBranch, title: "Git-Backed Storage", desc: "Every org gets a private GitHub repo. Each course is a directory. Lessons are versioned automatically." },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-black tracking-tight">Craft</Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard"
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
                <Link href="/register"
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border px-4 py-24 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Now with AI course generation
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              The learning platform<br />
              <span className="text-primary">built for teams.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Organizations, courses, lessons, badges, whiteboards, and versioned content — all in one place.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register"
                className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity">
                Start for free →
              </Link>
              <Link href="/login"
                className="rounded-xl border border-border bg-card px-8 py-3 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-b border-border px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-black tracking-tight">Everything your team needs</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-24 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-4xl font-black">Ready to build your org?</h2>
            <p className="mt-4 text-muted-foreground">Create an account, invite your team, and start teaching.</p>
            <Link href="/register"
              className="mt-8 inline-block rounded-xl bg-primary px-10 py-3.5 text-base font-bold text-primary-foreground shadow-xl hover:opacity-90 transition-opacity">
              Create free account →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Craft Platform
      </footer>
    </div>
  );
}
