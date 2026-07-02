import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Radar,
  MailCheck,
  Lightbulb,
  KanbanSquare,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InsureTrack — Renewal Automation for Insurance Agents",
  description:
    "Stop chasing renewals. InsureTrack automates follow-ups, tracks your book of business, and flags cross-sell opportunities for independent insurance agents.",
};

const features = [
  {
    icon: Radar,
    title: "Renewal radar",
    border: "#3B5E91",
    bg: "#EEF2FF",
    desc: "See every policy renewing in the next 30, 60, and 90 days. No more spreadsheets. No more surprises.",
  },
  {
    icon: MailCheck,
    title: "Automated sequences",
    border: "#C17B8A",
    bg: "#FFF0F3",
    desc: "Email and SMS follow-ups fire automatically before renewal dates. You write it once, InsureTrack sends it forever.",
  },
  {
    icon: Lightbulb,
    title: "Cross-sell nudges",
    border: "#6B9E7A",
    bg: "#F0FBF0",
    desc: "Spot clients with gaps in their coverage. InsureTrack flags who has Auto but not Home, or Life but not Health.",
  },
  {
    icon: KanbanSquare,
    title: "Lead pipeline",
    border: "#E8A838",
    bg: "#FFF8E6",
    desc: "Track every prospect from first contact to bound policy on a visual kanban board. Never let a lead go cold.",
  },
  {
    icon: HeartHandshake,
    title: "Client onboarding",
    border: "#9B72CF",
    bg: "#F5F0FF",
    desc: "Welcome new clients automatically with a warm, personal email series that sets the tone for a long relationship.",
  },
  {
    icon: TrendingUp,
    title: "Retention analytics",
    border: "#4A9CC1",
    bg: "#EDF7FC",
    desc: "See your retention rate, revenue protected, and sequence performance — so you know exactly what’s working.",
  },
];

const proofStats = [
  { big: "400+", small: "agents using InsureTrack" },
  { big: "4+ hrs", small: "saved per agent per week" },
  { big: "94%", small: "average retention rate" },
  { big: "$0", small: "to start, 14-day free trial" },
];

const steps = [
  {
    n: 1,
    title: "Sign up free",
    desc: "Create your account in under 60 seconds. No credit card needed.",
  },
  {
    n: 2,
    title: "Import your book",
    desc: "Upload a CSV or add clients manually. Your data, your way.",
  },
  {
    n: 3,
    title: "Activate sequences",
    desc: "Turn on pre-built follow-up sequences with one click.",
  },
  {
    n: 4,
    title: "Retain and grow",
    desc: "Watch renewals get handled automatically while you focus on new business.",
  },
];

const testimonials = [
  {
    quote:
      "I used to lose 2-3 renewals a month just because I forgot to follow up. InsureTrack handles all of it now. I haven’t missed one in four months.",
    initials: "KH",
    avatarBg: "#3B5E91",
    name: "Kaytlin H.",
    role: "Independent P&C Agent",
  },
  {
    quote:
      "The cross-sell alerts alone paid for a year of InsureTrack in the first week. I had 11 clients missing home insurance I had no idea about.",
    initials: "DM",
    avatarBg: "#C17B8A",
    name: "Denise M.",
    role: "Life & Health Agent, Texas",
  },
  {
    quote:
      "Finally a CRM that doesn’t feel like it was built for a Fortune 500 company. It’s simple, it does what I need, and my clients actually get my emails now.",
    initials: "RP",
    avatarBg: "#6B9E7A",
    name: "Rachel P.",
    role: "Independent Agent, Ohio",
  },
];

const pricingFeatures = [
  "Unlimited clients and policies",
  "Renewal radar (30 / 60 / 90 day)",
  "Email and SMS automation sequences",
  "Lead pipeline (kanban)",
  "Cross-sell opportunity alerts",
  "CSV import and manual entry",
  "Retention analytics dashboard",
  "Client onboarding sequences",
];

const cardShadow = "0 8px 32px rgba(0,0,0,0.08)";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`text-xl font-bold ${light ? "text-white" : "text-[#0f1923]"}`}
    >
      Insure<span className="text-[#C17B8A]">Track</span>
    </span>
  );
}

function Check() {
  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: "#6B9E7A" }}
      aria-hidden
    >
      ✓
    </span>
  );
}

export default function LandingPage() {
  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#FAFAF8] text-[#1a1a1a]`}
    >
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#eee] bg-white">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#" aria-label="InsureTrack home">
            <Logo />
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-[#5a6475] md:flex">
            <a href="#features" className="hover:text-[#3B5E91]">
              Features
            </a>
            <a href="#how" className="hover:text-[#3B5E91]">
              How it works
            </a>
            <a href="#pricing" className="hover:text-[#3B5E91]">
              Pricing
            </a>
          </div>
          <Link
            href="/signup"
            className="rounded-lg bg-[#3B5E91] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#31507c]"
          >
            Start free trial
          </Link>
        </nav>
      </header>

      {/* 2. Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: "#FFF0F3", color: "#C17B8A" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "#C17B8A" }}
            />
            Built for independent agents
          </span>
          <h1 className="mt-5 text-[2.2rem] font-bold leading-[1.1] tracking-tight sm:text-[2.8rem]">
            Stop chasing renewals.{" "}
            <span className="text-[#C17B8A]">Start retaining</span> clients.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[#5a6475]">
            InsureTrack automates your follow-ups, flags upcoming renewals, and
            nudges cross-sell opportunities — so you grow your book without
            growing your to-do list.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="rounded-lg bg-[#3B5E91] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#31507c]"
            >
              Start your free trial
            </Link>
            <a
              href="#how"
              className="px-2 py-3 text-center text-sm font-semibold text-[#3B5E91] hover:underline"
            >
              See how it works →
            </a>
          </div>
          <p className="mt-6 text-sm text-[#888]">
            <span className="text-[#6B9E7A]">✓</span> 14 days free ·{" "}
            <span className="text-[#6B9E7A]">✓</span> No credit card ·{" "}
            <span className="text-[#6B9E7A]">✓</span> Cancel anytime
          </p>
        </div>

        {/* Dashboard mockup */}
        <div
          className="overflow-hidden rounded-[14px] border border-[#eee] bg-white"
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center gap-2 bg-[#3B5E91] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-white/40" />
            <span className="h-3 w-3 rounded-full bg-white/40" />
            <span className="h-3 w-3 rounded-full bg-white/40" />
            <span className="ml-3 text-xs font-medium text-white/90">
              InsureTrack Dashboard
            </span>
          </div>
          <div className="grid grid-cols-[84px_1fr] sm:grid-cols-[110px_1fr]">
            <aside className="space-y-1 bg-[#f4f5f7] p-3 text-[11px] font-medium text-[#5a6475]">
              <div className="rounded-md bg-[#3B5E91] px-2 py-1.5 text-white">
                Dashboard
              </div>
              <div className="px-2 py-1.5">Clients</div>
              <div className="px-2 py-1.5">Renewals</div>
              <div className="px-2 py-1.5">Leads</div>
              <div className="px-2 py-1.5">Sequences</div>
            </aside>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#eee] p-2.5">
                  <p className="text-[10px] text-[#888]">Clients</p>
                  <p className="text-lg font-bold text-[#0f1923]">248</p>
                </div>
                <div className="rounded-lg border border-[#eee] p-2.5">
                  <p className="text-[10px] text-[#888]">Renewals due</p>
                  <p className="text-lg font-bold text-[#C17B8A]">12</p>
                </div>
                <div className="rounded-lg border border-[#eee] p-2.5">
                  <p className="text-[10px] text-[#888]">Retention</p>
                  <p className="text-lg font-bold text-[#6B9E7A]">94%</p>
                </div>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">
                Urgent renewals
              </p>
              <div className="space-y-2">
                {[
                  {
                    name: "Sarah Johnson",
                    type: "Auto",
                    tag: "7 days",
                    color: "#DC2626",
                    bg: "#FEE2E2",
                  },
                  {
                    name: "Marcus Brown",
                    type: "Home",
                    tag: "14 days",
                    color: "#B45309",
                    bg: "#FEF3C7",
                  },
                  {
                    name: "Lisa Chen",
                    type: "Life",
                    tag: "28 days",
                    color: "#15803D",
                    bg: "#DCFCE7",
                  },
                ].map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-lg border border-[#eee] px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#1a1a1a]">
                        {r.name}
                      </p>
                      <p className="text-[10px] text-[#888]">{r.type}</p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ color: r.color, backgroundColor: r.bg }}
                    >
                      {r.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proof bar */}
      <section className="border-y border-[#eee] bg-[#f4f5f7]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {proofStats.map((s) => (
            <div key={s.small} className="text-center">
              <p className="text-2xl font-bold text-[#3B5E91]">{s.big}</p>
              <p className="mt-1 text-sm text-[#5a6475]">{s.small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C17B8A]">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#0f1923]">
            Everything your book of business needs
          </h2>
          <p className="mt-3 text-[#5a6475]">
            Six tools in one dashboard, built around how independent agents
            actually work.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-[14px] border border-[#eee] bg-white p-6"
                style={{
                  borderTop: `3px solid ${f.border}`,
                  boxShadow: cardShadow,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: f.bg }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: f.border }}
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0f1923]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a6475]">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. How it works */}
      <section id="how" className="border-y border-[#eee] bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C17B8A]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#0f1923]">
              Up and running in minutes
            </h2>
            <p className="mt-3 text-[#5a6475]">
              No onboarding calls. No IT department. Just sign up and go.
            </p>
          </div>
          <div className="relative mt-14 grid gap-10 md:grid-cols-4">
            <div
              className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 md:block"
              style={{ backgroundColor: "#3B5E91", opacity: 0.2 }}
              aria-hidden
            />
            {steps.map((s) => (
              <div key={s.n} className="relative text-center">
                <div
                  className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: "#3B5E91" }}
                >
                  {s.n}
                </div>
                <h4 className="mt-5 text-base font-semibold text-[#0f1923]">
                  {s.title}
                </h4>
                <p className="mx-auto mt-2 max-w-xs text-sm text-[#5a6475]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section id="testimonials" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C17B8A]">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#0f1923]">
            Agents love it
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-[14px] border border-[#eee] bg-white p-6"
              style={{ boxShadow: cardShadow }}
            >
              <div
                className="text-sm tracking-wide"
                style={{ color: "#E8A838" }}
                aria-label="5 out of 5 stars"
              >
                ★★★★★
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[#1a1a1a]">
                “{t.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: t.avatarBg }}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0f1923]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[#888]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Pricing */}
      <section id="pricing" className="border-y border-[#eee] bg-[#f4f5f7] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C17B8A]">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#0f1923]">
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-[#5a6475]">
              One plan. Everything included. No per-seat fees.
            </p>
          </div>

          <div className="relative mx-auto mt-14 w-full max-w-[560px]">
            <span
              className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: "#C17B8A" }}
            >
              Most popular
            </span>
            <div
              className="rounded-[18px] border-2 bg-white p-8 sm:p-10"
              style={{ borderColor: "#3B5E91", boxShadow: cardShadow }}
            >
              <h3 className="text-lg font-semibold text-[#0f1923]">
                Independent Agent
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-[#0f1923]">$49</span>
                <span className="text-[#5a6475]">/ per month</span>
              </div>
              <p className="mt-1 text-sm text-[#888]">billed monthly</p>

              <ul className="mt-8 space-y-3">
                {pricingFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[#1a1a1a]">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 block rounded-lg bg-[#3B5E91] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#31507c]"
              >
                Start 14-day free trial
              </Link>
              <p className="mt-4 text-center text-xs text-[#888]">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-[#0f1923] sm:text-4xl">
          Your next renewal is due soon. Are you ready?
        </h2>
        <p className="mt-4 text-lg text-[#5a6475]">
          Join hundreds of independent agents who stopped losing clients to
          missed follow-ups.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-[#3B5E91] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#31507c]"
          >
            Start free trial
          </Link>
          <a
            href="#how"
            className="px-2 py-3 text-sm font-semibold text-[#3B5E91] hover:underline"
          >
            See a demo →
          </a>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-[#0f1923] text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <Logo light />
          <p className="mt-3 max-w-md text-sm text-white/60">
            Renewal automation and client retention for independent agents.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/70">
            <a href="#" className="hover:text-white">
              Privacy policy
            </a>
            <a href="#" className="hover:text-white">
              Terms of service
            </a>
            <a href="#" className="hover:text-white">
              Contact
            </a>
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-xs text-white/40">
            © 2026 InsureTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}