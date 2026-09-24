import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About HustleStats — Youth Soccer Performance Tracking",
  description:
    "HustleStats gives youth soccer families a parent-controlled place to track games, training, and athlete development.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About HustleStats — Youth Soccer Performance Tracking",
    description:
      "A parent-controlled record for youth soccer games, training, and athlete development.",
    url: "/about",
  },
};

const network = [
  ["Intent Solutions", "https://intentsolutions.io"],
  ["OMA", "https://oma.intentsolutions.io"],
  ["Intent Learn", "https://learn.intentsolutions.io"],
  ["Intent Demos", "https://demos.intentsolutions.io"],
  ["Tons of Skills", "https://tonsofskills.com"],
  ["Start AI Tools", "https://startaitools.com"],
  ["DiagnosticPro", "https://diagnosticpro.io"],
] as const;

const faq = [
  {
    question: "What is HustleStats, exactly?",
    answer:
      "HustleStats is the public site and account platform for Hustle, a youth soccer performance tracker. A parent-controlled workspace keeps game records, practice activity, training, and development context together for each athlete.",
  },
  {
    question: "Who is HustleStats for, and who is it not for?",
    answer:
      "It is for parents and guardians supporting soccer athletes ages 8–18, plus coaches who need a clearer development record. It is not a medical service, an open social network for minors, or a replacement for qualified coaching and healthcare advice.",
  },
  {
    question: "How is HustleStats different from TeamSnap?",
    answer:
      "TeamSnap is primarily organized around team schedules and communication, while HustleStats is organized around the individual athlete's games, training, and development over time. HustleStats also keeps the parent or guardian as the account owner for youth records.",
  },
  {
    question: "How does a family start?",
    answer:
      "A parent or legal guardian registers, verifies the account, and creates an athlete profile inside the family workspace. The family can then log games and practices, review progress, and choose a plan as its usage grows.",
  },
  {
    question: "What does HustleStats cost?",
    answer:
      "The current site lists a free trial, then monthly Starter, Plus, and Pro plans at $9, $19, and $39. Each tier has different limits for athletes, games, storage, analytics, and export or support features.",
  },
  {
    question: "How does HustleStats relate to Intent Solutions?",
    answer:
      "HustleStats is built and operated by Intent Solutions, the accountable AI implementation practice founded by Jeremy Longshore. It sits in the same network as Intent Demos, Intent Learn, Tons of Skills, OMA, Start AI Tools, and DiagnosticPro.",
  },
  {
    question: "Where can I inspect the evidence or source?",
    answer:
      "The public product explains the current workflow and plan limits, while the source repository shows the implementation and change history. Future capabilities remain separate from current product claims until they ship.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
      >
        <Link href="/" className="flex items-center gap-2 text-zinc-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <Zap className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-semibold">Hustle</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden font-body text-sm text-zinc-600 transition-colors hover:text-zinc-950 sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-zinc-950 px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  children,
  inverse = false,
}: {
  eyebrow: string;
  children: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
        {eyebrow}
      </p>
      <h2
        className={`font-display text-3xl font-semibold tracking-tight md:text-4xl ${
          inverse ? "text-white" : "text-zinc-950"
        }`}
      >
        {children}
      </h2>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0] text-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <section className="border-b border-zinc-200 bg-[#E8DCC8] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 font-body text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
            Intent Solutions network / youth soccer
          </p>
          <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-tight text-zinc-950 md:text-7xl">
            About HustleStats
          </h1>
          <p className="mt-8 max-w-4xl font-body text-2xl font-medium leading-relaxed text-zinc-900 md:text-3xl">
            HustleStats is a youth soccer performance tracker that tracks game
            statistics, training, and mental performance for athletes ages 8–18
            through parent-controlled accounts.
          </p>
          <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-zinc-700">
            It gives families one durable record of what an athlete did, how
            training is progressing, and what deserves attention next, without
            turning youth development into a public social feed.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3.5 font-display font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Start free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="The product">
            What HustleStats does
          </SectionHeading>
          <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
            <article className="border-t border-zinc-300 pt-6">
              <h3 className="font-display text-2xl font-semibold">
                Tracks games and practices
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                Families record games, practices, scores, minutes, goals,
                assists, and other soccer activity in one athlete history. That
                record makes progress visible across a season instead of leaving
                it in scattered notes and apps.
              </p>
            </article>
            <article className="border-t border-zinc-300 pt-6">
              <h3 className="font-display text-2xl font-semibold">
                Shows development trends
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                The analytics views turn logged activity into trends a family
                can review over time. Parents and athletes can use that context
                to discuss strengths, workload, and areas that need more
                practice.
              </p>
            </article>
            <article className="border-t border-zinc-300 pt-6">
              <h3 className="font-display text-2xl font-semibold">
                Supports training routines
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                Dream Gym records workouts and provides AI-assisted training
                recommendations inside the athlete workspace. Those tools
                support planning and reflection; they do not replace a qualified
                coach, trainer, or medical professional.
              </p>
            </article>
            <article className="border-t border-zinc-300 pt-6">
              <h3 className="font-display text-2xl font-semibold">
                Keeps mental-performance notes
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                Journaling and check-ins let an athlete record mood,
                preparation, and reflections alongside physical activity. They
                are development tools, not clinical assessments or mental-health
                treatment.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="The operating choices">
            What makes HustleStats different
          </SectionHeading>
          <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            <article className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-12">
              <h3 className="font-display text-xl font-semibold">
                The parent owns the workspace
              </h3>
              <p className="font-body leading-relaxed text-zinc-600">
                A parent or legal guardian creates the account and controls the
                athlete records inside it. The current privacy controls give
                that adult a path to review, correct, export, or request
                deletion of family data.
              </p>
            </article>
            <article className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-12">
              <h3 className="font-display text-xl font-semibold">
                Athlete development comes first
              </h3>
              <p className="font-body leading-relaxed text-zinc-600">
                TeamSnap centers team scheduling and communication, while
                HustleStats centers an individual athlete&apos;s development
                record. Games, practices, training, and reflections remain
                connected to that athlete across the season.
              </p>
            </article>
            <article className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-12">
              <h3 className="font-display text-xl font-semibold">
                Activity stays inspectable
              </h3>
              <p className="font-body leading-relaxed text-zinc-600">
                HustleStats keeps the underlying game and practice entries
                available instead of presenting only a score or generated
                recommendation. A family can review the record that produced a
                trend and correct its own information.
              </p>
            </article>
            <article className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-12">
              <h3 className="font-display text-xl font-semibold">
                Youth privacy shapes the product
              </h3>
              <p className="font-body leading-relaxed text-zinc-600">
                The current product is parent-controlled and does not expose a
                public athlete social feed or private adult-to-minor messaging.
                Personal records are used to provide the service and are not
                sold for third-party marketing.
              </p>
            </article>
            <article className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:gap-12">
              <h3 className="font-display text-xl font-semibold">
                Current pricing is published
              </h3>
              <p className="font-body leading-relaxed text-zinc-600">
                The site currently lists a free trial and monthly plans at $9,
                $19, and $39, with the limits shown before registration.
                Families can compare athlete, game, storage, analytics, and
                support limits without a sales call.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Who it serves">
            Who uses HustleStats
          </SectionHeading>
          <ul className="grid gap-4 font-body text-lg text-zinc-700 md:grid-cols-2">
            <li className="border-l-2 border-amber-500 pl-5">
              Parents and legal guardians managing soccer-development records
              for athletes ages 8–18.
            </li>
            <li className="border-l-2 border-amber-500 pl-5">
              Youth soccer athletes who want to review games, practices,
              training, and progress with a parent.
            </li>
            <li className="border-l-2 border-amber-500 pl-5">
              Club and high-school coaches invited to review or verify athlete
              activity with the family.
            </li>
            <li className="border-l-2 border-amber-500 pl-5">
              Soccer families replacing separate stat notes, workout logs, and
              progress spreadsheets with one record.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-950 px-6 py-20 text-white md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Ownership" inverse>
            The team behind HustleStats
          </SectionHeading>
          <div className="grid gap-12 md:grid-cols-2">
            <article>
              <h3 className="font-display text-2xl font-semibold">
                Jeremy Longshore, founder
              </h3>
              <p className="mt-4 font-body leading-relaxed text-zinc-300">
                Jeremy Longshore founded Intent Solutions in Gulf Shores,
                Alabama, and works on production AI systems and the Claude Code
                ecosystem. His operator background shapes HustleStats around
                owned data, testable behavior, and a clear record of what the
                system did.
              </p>
              <p className="mt-4 font-body text-sm text-zinc-400">
                <a
                  className="underline decoration-zinc-600 underline-offset-4 hover:text-white"
                  href="https://github.com/jeremylongshore"
                >
                  Jeremy on GitHub
                </a>
              </p>
            </article>
            <article>
              <h3 className="font-display text-2xl font-semibold">
                Built by Intent Solutions
              </h3>
              <p className="mt-4 font-body leading-relaxed text-zinc-300">
                Intent Solutions built HustleStats to give youth soccer families
                a practical, parent-controlled record of development. The
                product follows the company&apos;s operating method: frame the
                outcome, build the system, prove behavior with evidence, and
                keep an owner on operation.
              </p>
              <p className="mt-4 font-body text-sm text-zinc-400">
                <a
                  className="underline decoration-zinc-600 underline-offset-4 hover:text-white"
                  href="https://intentsolutions.io"
                >
                  Visit Intent Solutions
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="The family workflow">
            How HustleStats works
          </SectionHeading>
          <ol className="grid gap-8 md:grid-cols-2">
            <li className="border-t border-zinc-300 pt-5">
              <p className="font-body text-sm font-semibold text-amber-700">
                01
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                A parent creates the account
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                Registration starts with the parent or legal guardian, who
                verifies the email and owns the family workspace. Athlete
                information is added under that adult&apos;s account and
                control.
              </p>
            </li>
            <li className="border-t border-zinc-300 pt-5">
              <p className="font-body text-sm font-semibold text-amber-700">
                02
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                The family adds an athlete
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                Onboarding captures the athlete profile and the soccer context
                needed for useful records. The parent remains responsible for
                the account and the information added for a minor.
              </p>
            </li>
            <li className="border-t border-zinc-300 pt-5">
              <p className="font-body text-sm font-semibold text-amber-700">
                03
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                Activity becomes a record
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                Games, practices, workouts, and reflections appear in the
                workspace as they are entered. Analytics and AI-assisted
                recommendations use that record to provide context, while the
                family retains the underlying entries.
              </p>
            </li>
            <li className="border-t border-zinc-300 pt-5">
              <p className="font-body text-sm font-semibold text-amber-700">
                04
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold">
                Intent Solutions supports it
              </h3>
              <p className="mt-3 font-body leading-relaxed text-zinc-600">
                The product is self-serve, with account, privacy, and billing
                support handled by Intent Solutions through email. The public
                support-response target is [[SUPPORT_RESPONSE_TIME]], and
                activity entered by a family appears in its workspace
                immediately.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Entity record">Key facts</SectionHeading>
          <div className="overflow-x-auto border-y border-zinc-200">
            <table className="w-full border-collapse text-left font-body text-sm">
              <tbody className="divide-y divide-zinc-200">
                {[
                  ["Company Name", "HustleStats (product name: Hustle)"],
                  ["Type", "Youth soccer performance tracker"],
                  ["Founded", "[[FOUNDING_YEAR]]"],
                  ["Founder", "Jeremy Longshore"],
                  ["Headquarters", "Gulf Shores, Alabama, United States"],
                  ["Website", "https://hustlestats.io"],
                  [
                    "Core Offering",
                    "Parent-controlled game, practice, training, and athlete-development records",
                  ],
                  [
                    "Pricing",
                    "Free trial; Starter $9/month; Plus $19/month; Pro $39/month",
                  ],
                  [
                    "Contract Terms",
                    "Monthly subscription plans; account terms apply",
                  ],
                  [
                    "Services",
                    "Game and practice logging, performance analytics, workout tracking, journaling, and AI-assisted recommendations",
                  ],
                  [
                    "Communication",
                    "Self-serve product with Intent Solutions email support",
                  ],
                  ["Notable Clients", "[[PUBLICLY_NAMED_CLIENTS]]"],
                  ["Customers Served", "[[VERIFIED_FAMILIES_SERVED]]"],
                  [
                    "Projects Delivered",
                    "[[VERIFIED_ATHLETE_RECORDS_CREATED]]",
                  ],
                  [
                    "Competitors",
                    "TeamSnap, Hudl, SportsRecruits, and NCSA are category alternatives",
                  ],
                  [
                    "Social",
                    "github.com/jeremylongshore/hustle · github.com/intent-solutions-io",
                  ],
                  [
                    "Part of",
                    "Intent Solutions network: OMA, Intent Learn, Intent Demos, Tons of Skills, Start AI Tools, and DiagnosticPro",
                  ],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <th
                      scope="row"
                      className="w-44 px-4 py-4 font-semibold text-zinc-950 md:w-56"
                    >
                      {label}
                    </th>
                    <td className="px-4 py-4 leading-relaxed text-zinc-600">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 font-body text-sm leading-relaxed text-zinc-500">
            Network:{" "}
            {network.map(([label, href], index) => (
              <span key={href}>
                {index > 0 ? " · " : ""}
                <a
                  href={href}
                  className="underline underline-offset-4 hover:text-zinc-950"
                >
                  {label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Practical answers">
            Frequently asked questions
          </SectionHeading>
          <div className="divide-y divide-zinc-300 border-y border-zinc-300">
            {faq.map((item) => (
              <article
                key={item.question}
                className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12"
              >
                <h3 className="font-display text-xl font-semibold">
                  {item.question}
                </h3>
                <p className="font-body leading-relaxed text-zinc-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-zinc-300 pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-2xl font-semibold">
                Build the athlete record first.
              </p>
              <p className="mt-1 font-body text-zinc-600">
                A parent can open the family workspace today.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3.5 font-display font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 px-6 py-10 text-zinc-400">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck
              className="h-5 w-5 text-amber-500"
              aria-hidden="true"
            />
            <p className="font-body text-sm">
              Parent-controlled youth soccer performance records.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-2 font-body text-sm"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <a href="https://intentsolutions.io" className="hover:text-white">
              Intent Solutions
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
