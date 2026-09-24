'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { motion, useInView } from 'framer-motion';
import {
  Trophy,
  Dumbbell,
  Brain,
  BarChart3,
  ChevronRight,
  Check,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animation';

// ─────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────
function Hero() {
  const words = ['Track.', 'Train.', 'Dominate.'];

  return (
    <section className="relative h-dvh min-h-[600px] overflow-hidden">
      {/* Video bg */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/GOAL.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/55" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-white">Hustle</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-body text-sm text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="font-display font-semibold text-sm bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-body font-medium px-3 py-1.5 rounded-full mb-6"
        >
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          Youth Soccer Performance Platform
        </motion.div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-8">
          {words.map((word, i) => (
            <motion.h1
              key={word}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
              className="font-display text-6xl md:text-8xl font-semibold text-white leading-tight"
            >
              {word}
            </motion.h1>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="font-body text-lg md:text-xl text-white/70 max-w-xl mb-10"
        >
          The all-in-one platform for parents and coaches to track athlete
          performance, log games, and unlock AI-powered training.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/register">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-amber-500 text-white font-display font-semibold px-8 py-4 rounded-full hover:bg-amber-600 transition-colors text-lg shadow-lg shadow-amber-500/30"
            >
              Start Free Trial
              <ChevronRight className="w-5 h-5" />
            </motion.span>
          </Link>
          <a
            href="#features"
            className="font-body text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            See what&apos;s included ↓
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-2.5 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Features Section
// ─────────────────────────────────────────────
const features = [
  {
    icon: Trophy,
    color: 'bg-amber-100 text-amber-600',
    title: 'Game Stats Tracking',
    desc: 'Log every goal, assist, and performance metric. Build a complete history of your athlete\'s development.',
  },
  {
    icon: Dumbbell,
    color: 'bg-orange-100 text-orange-600',
    title: 'Dream Gym AI Training',
    desc: 'AI-powered workout plans, conditioning circuits, and mental wellness modules built for young athletes.',
  },
  {
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
    title: 'Mental Performance',
    desc: 'Journal entries, mood tracking, breathing exercises, and visualization tools for peak mental game.',
  },
  {
    icon: BarChart3,
    color: 'bg-blue-100 text-blue-600',
    title: 'Deep Analytics',
    desc: 'Visualize trends in goals, assists, and performance over time. Identify strengths and areas to improve.',
  },
  {
    icon: Shield,
    color: 'bg-green-100 text-green-600',
    title: 'COPPA Compliant',
    desc: 'Designed for youth athletes ages 8–18. Parent-controlled accounts with complete data privacy.',
  },
  {
    icon: TrendingUp,
    color: 'bg-red-100 text-red-600',
    title: 'Progress Milestones',
    desc: 'Track biometrics, fitness assessments, and skill development milestones season over season.',
  },
];

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  return (
    <section id="features" className="py-24 px-6 bg-gradient-to-br from-[#F5EEDD] to-[#EADBB8]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-zinc-900 mb-4">
            Everything your athlete needs
          </h2>
          <p className="font-body text-lg text-zinc-500 max-w-xl mx-auto">
            From game-day stats to weekly training — Hustle covers every corner
            of athlete development.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }}
              className="bg-white rounded-2xl p-6 shadow-sm transition-shadow"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-zinc-900 mb-2">
                {f.title}
              </h3>
              <p className="font-body text-sm text-zinc-500 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Pricing Section
// ─────────────────────────────────────────────
const plans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    athletes: 2,
    games: 10,
    storage: '100MB',
    features: ['Basic game stats', '2 athletes', '10 games/month', 'Dream Gym access'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    athletes: 5,
    games: 50,
    storage: '500MB',
    features: ['Everything in Free', '5 athletes', '50 games/month', 'Email support'],
    cta: 'Get Starter',
    highlighted: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 19,
    athletes: 15,
    games: 200,
    storage: '2GB',
    features: ['Everything in Starter', '15 athletes', 'Advanced analytics', 'Priority support'],
    cta: 'Get Plus',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    athletes: 'Unlimited',
    games: 'Unlimited',
    storage: '10GB',
    features: ['Everything in Plus', 'Unlimited athletes', 'CSV export', 'Dedicated support'],
    cta: 'Get Pro',
    highlighted: false,
  },
];

function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-zinc-900 mb-4">
            Simple, honest pricing
          </h2>
          <p className="font-body text-lg text-zinc-500">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              className={`rounded-2xl p-6 flex flex-col relative ${
                plan.highlighted
                  ? 'bg-zinc-900 text-white shadow-xl'
                  : 'bg-[#F7F5F0] shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-xs font-display font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`font-display text-lg font-semibold mb-1 ${
                    plan.highlighted ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-end gap-1">
                  <span
                    className={`font-display text-4xl font-semibold ${
                      plan.highlighted ? 'text-white' : 'text-zinc-900'
                    }`}
                  >
                    ${plan.price}
                  </span>
                  <span
                    className={`font-body text-sm mb-1.5 ${
                      plan.highlighted ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    /mo
                  </span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        plan.highlighted ? 'text-amber-400' : 'text-green-500'
                      }`}
                    />
                    <span
                      className={`font-body text-sm ${
                        plan.highlighted ? 'text-zinc-300' : 'text-zinc-600'
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <motion.span
                  whileTap={{ scale: 0.97 }}
                  className={`block text-center py-3 rounded-full font-display font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {plan.cta}
                </motion.span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CTA Section
// ─────────────────────────────────────────────
function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });

  return (
    <section
      className="relative py-24 px-6 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/tracks.jpg')" }}
    >
      <div className="absolute inset-0 bg-zinc-900/80" />
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-2xl mx-auto text-center"
      >
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">
          Ready to build a champion?
        </h2>
        <p className="font-body text-lg text-white/70 mb-10">
          Join hundreds of youth soccer families tracking progress and unlocking
          potential with Hustle.
        </p>
        <Link href="/register">
          <motion.span
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-amber-500 text-white font-display font-semibold px-8 py-4 rounded-full hover:bg-amber-600 transition-colors text-lg shadow-lg shadow-amber-500/30"
          >
            Start Free Today
            <ChevronRight className="w-5 h-5" />
          </motion.span>
        </Link>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-white">
                Hustle
              </span>
            </div>
            <p className="font-body text-sm max-w-xs">
              Youth soccer performance tracking for parents and coaches.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="font-display text-sm font-semibold text-white mb-3">
                Product
              </p>
              <ul className="space-y-2 font-body text-sm">
                {['Features', 'Pricing', 'Sign In'].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-white mb-3">
                Legal
              </p>
              <ul className="space-y-2 font-body text-sm">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-6 text-sm font-body">
          <p>© 2026 Hustle · hustlestats.io · All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main>
      <Script
        src="https://analytics.intentsolutions.io/script.js"
        data-website-id="677d7be1-466b-4f93-8958-39751d4b2c71"
        data-domains="hustlestats.io,www.hustlestats.io"
        data-auto-track="false"
        data-exclude-search="true"
        data-exclude-hash="true"
        onReady={() => {
          // Only the marketing landing page; no dashboard or authentication activity.
          if (window.location.pathname !== '/') return;
          const analytics = (window as Window & { umami?: { track: () => void } }).umami;
          analytics?.track();
        }}
      />
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
