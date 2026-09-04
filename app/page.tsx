import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  Code2,
  Layers3,
  Play,
  Sparkles,
  UsersRound,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Learning paths that hold up",
    description:
      "Follow focused tracks, keep your progress visible, and return to exactly what matters next.",
  },
  {
    icon: BrainCircuit,
    title: "Make knowledge yours",
    description:
      "Turn ideas into structured notes, concept maps, quizzes, and useful mental models.",
  },
  {
    icon: UsersRound,
    title: "Built for the whole room",
    description:
      "Move seamlessly between your own learning, team workspaces, and thoughtful community feedback.",
  },
];

const outcomes = [
  "Clear, guided momentum",
  "One home for every learning mode",
  "Progress you can feel",
];

export default function Home() {
  return (
    <div className="-mx-4 -mt-10 overflow-hidden bg-[#090916] text-[#f7f6ff] selection:bg-violet-300 selection:text-[#161026]">
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-24 sm:px-8 sm:pb-24 lg:pb-32 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_26%,rgba(125,92,255,0.28),transparent_23%),radial-gradient(circle_at_18%_85%,rgba(35,160,255,0.14),transparent_24%),linear-gradient(180deg,#101022_0%,#090916_100%)]" />
        <div className="absolute right-[8%] top-16 -z-10 h-100 w-100 rounded-full border border-violet-300/10 bg-violet-500/5 blur-3xl" />
        <div className="absolute left-[10%] top-42 -z-10 h-px w-64 rotate-[-25deg] bg-linear-to-r from-transparent via-violet-300/40 to-transparent" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.93fr_1.07fr] lg:gap-8">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200 shadow-[0_0_30px_rgba(139,92,246,0.12)]">
              <Sparkles size={13} /> Your learning, in flow
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Learn with{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-200 via-white to-sky-200">
                real momentum.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-violet-100/65 sm:text-lg">
              Craft is the thoughtful space for building skills, exploring
              ideas, and turning curiosity into work you&apos;re proud of.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#f7f6ff] px-5 py-3 text-sm font-bold text-[#131222] transition-transform hover:-translate-y-0.5"
              >
                Start learning free{" "}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Play size={15} fill="currentColor" /> See your workspace
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 font-mono text-[10px] uppercase tracking-wide text-violet-100/55">
              <span>For curious builders</span>
              <span className="text-violet-400">•</span>
              <span>Made to grow with you</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-violet-500/15 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-white/12 bg-[#17152c]/85 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="rounded-2xl border border-white/8 bg-[#0d0c1c] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-white/7 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#ff6c87]" />
                    <span className="h-2 w-2 rounded-full bg-[#ffc75f]" />
                    <span className="h-2 w-2 rounded-full bg-[#77e5b5]" />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                    Craft / your learning
                  </span>
                  <span className="h-5 w-5 rounded-full bg-linear-to-br from-violet-300 to-indigo-500" />
                </div>
                <div className="grid gap-4 pt-5 sm:grid-cols-[1.22fr_0.78fr]">
                  <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-violet-300">
                          Continue learning
                        </p>
                        <h2 className="mt-2 text-lg font-semibold tracking-tight">
                          Systems design
                        </h2>
                      </div>
                      <div className="rounded-lg bg-violet-400/12 p-2 text-violet-300">
                        <Layers3 size={16} />
                      </div>
                    </div>
                    <div className="mt-7">
                      <div className="mb-2 flex justify-between font-mono text-[9px] uppercase text-white/45">
                        <span>Module 04</span>
                        <span className="text-violet-300">72%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full w-[72%] rounded-full bg-linear-to-r from-violet-400 to-sky-300" />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-3 rounded-lg border border-white/7 bg-[#0a0917] p-3">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-sky-400/12 text-sky-300">
                        <Code2 size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-medium">
                          Design a resilient API
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] text-white/35">
                          12 min challenge
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/8 bg-linear-to-br from-[#272052] to-[#16122e] p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-violet-200/65">
                        This week
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight">
                        4.5
                        <span className="text-base text-violet-200/70">h</span>
                      </p>
                      <p className="mt-1 text-xs text-violet-100/55">
                        of meaningful progress
                      </p>
                      <div className="mt-5 flex h-9 items-end gap-1.5">
                        {[35, 62, 43, 76, 55, 91, 70].map((height, index) => (
                          <span
                            key={index}
                            style={{ height: `${height}%` }}
                            className="flex-1 rounded-sm bg-violet-300/70"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                        Up next
                      </p>
                      <p className="mt-3 text-sm font-medium">
                        Retrieval practice
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/45">
                        A sharper way to make ideas stick.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.025] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">
          <span>Made for deliberate learning</span>
          <span>Courses · Topics · Challenges · Community</span>
          <span>Progress, without the pressure</span>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
              A better way through
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Everything you need to move from{" "}
              <span className="text-violet-300">interested</span> to capable.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="group rounded-2xl border border-white/9 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-300/30 hover:bg-violet-400/[0.07]"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10 text-violet-200">
                    <Icon size={20} />
                  </div>
                  <span className="font-mono text-xs text-white/20">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#25204a] via-[#171630] to-[#0d142b] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 sm:p-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-200">
              Craft your own path
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              A workspace that meets you where your curiosity leads.
            </h2>
            <p className="mt-5 text-sm leading-7 text-violet-100/60">
              Start with a course, unpack a topic, take on a practical
              challenge, or bring your team into the work. It all connects here.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide text-white hover:text-violet-200"
            >
              Make your first move <ArrowRight size={15} />
            </Link>
          </div>
          <div className="border-t border-white/10 bg-black/10 p-8 sm:p-12 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              {outcomes.map((outcome, index) => (
                <div
                  key={outcome}
                  className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.045] p-4"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-300 text-[#17132e]">
                    <Check size={15} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-violet-200/55">
                      0{index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium">{outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-sm text-white/40 sm:flex-row sm:items-center">
          <span className="font-semibold tracking-tight text-white/75">
            craft<span className="text-violet-300">.</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest">
            Build a learning life you love
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
            <Link href="/register" className="hover:text-white">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
