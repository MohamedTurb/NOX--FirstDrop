import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from './src/firebase';
import LiveWaitlistCounter from './src/components/LiveWaitlistCounter';
import ScarcityTimer from './src/components/ScarcityTimer';
import {
  createWaitlistEntry,
  subscribeConfig,
  getTotalWaitlistCount,
  subscribeLeaderboard,
} from './src/firebaseHelpers';

const testimonials = [
  {
    quote: 'The first NOX teaser felt like a private show invite.',
    name: 'Ari M.',
    role: 'Early supporter',
  },
  {
    quote: 'Minimal, sharp, and expensive-looking without trying too hard.',
    name: 'Mina K.',
    role: 'Streetwear collector',
  },
  {
    quote: 'It already feels like the kind of drop people talk about after it sells out.',
    name: 'Noah T.',
    role: 'Brand follower',
  },
];

const stats = [
  { value: '48h', label: 'private access window' },
  { value: '01', label: 'first limited drop' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

export default function NOXLandingPage() {
  const [joined, setJoined] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    instagram: '',
  });

// live count is handled by LiveWaitlistCounter component

  const glowBlobs = useMemo(
    () => [
      'absolute -top-24 right-[-5rem] h-72 w-72 rounded-full bg-white/10 blur-3xl',
      'absolute top-1/3 left-[-7rem] h-80 w-80 rounded-full bg-zinc-500/10 blur-3xl',
      'absolute bottom-[-5rem] right-1/4 h-56 w-56 rounded-full bg-amber-100/10 blur-3xl',
    ],
    []
  );

  const [referralLink, setReferralLink] = useState('');
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    // subscribe to config for scarcity rules
    const unsub = subscribeConfig((cfg) => {
      if (!cfg) return;
      if (cfg.soldOut) setIsSoldOut(true);
      if (cfg.maxSpots) {
        // check current count against max
        getTotalWaitlistCount().then((count) => {
          if (cfg.maxSpots <= count) setIsSoldOut(true);
        });
      }
    });

    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeLeaderboard((items) => setLeaders(items), 5);
    return () => unsub && unsub();
  }, []);

  // Signup with referral handling
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSoldOut) {
      alert('Sorry, the waitlist is sold out.');
      return;
    }

    try {
      // detect ref param
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || null;

      const res = await createWaitlistEntry({
        name: form.name,
        email: form.email,
        instagram: form.instagram,
        referredBy: ref,
      });

      if (res.success) {
        setJoined(true);
        setForm({ name: '', email: '', instagram: '' });
        const link = `${window.location.origin}${window.location.pathname}?ref=${res.referralId}`;
        setReferralLink(link);
      } else {
        console.error('Sign up failed', res.error);
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-10" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0,transparent_1px)] [background-size:6px_6px]" />
      {glowBlobs.map((className, index) => (
        <div key={index} className={className} />
      ))}

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.5em] text-white/90">NOX</div>
          <div className="hidden text-xs uppercase tracking-[0.35em] text-white/45 md:block">
            limited first drop / private waitlist
          </div>
          <a
            href="#waitlist"
            className="rounded-full border border-white/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-0.5"
          >
            Join waitlist
          </a>
          <div className="hidden md:block">
            <ScarcityTimer />
          </div>
        </header>

        <section className="relative flex min-h-[92vh] flex-1 items-center py-16 sm:py-20 lg:py-24">
          <motion.div
            className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="max-w-3xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.45em] text-white/50">
                First clothing drop / Vol. 01
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl md:text-7xl lg:text-[5.8rem]">
                Night-built streetwear for people who move like a secret.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
                NOX is a limited underground fashion drop with a dark luxury mood, early access
                energy, and zero tolerance for ordinary.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(255,255,255,0.18)]"
                >
                  Get early access
                </a>
                <span className="text-sm uppercase tracking-[0.22em] text-white/45">
                  Once sold out, never restocked.
                </span>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 items-stretch">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-0 backdrop-blur-xl flex items-center justify-center">
                  <LiveWaitlistCounter collectionName="waitlist" />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Top referrers</div>
                  <div className="mt-3">
                    {leaders.length === 0 ? (
                      <div className="text-sm text-white/60">Be the first to refer</div>
                    ) : (
                      leaders.map((l) => (
                        <div key={l.id} className="flex items-center justify-between py-1 text-sm">
                          <div className="truncate">{l.name || l.email || l.referralId}</div>
                          <div className="font-semibold">{l.invitesCount || 0}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl"
                  >
                    <div className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.28em] text-white/45">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
                <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 sm:p-7">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-xs uppercase tracking-[0.35em] text-white/45">
                      Drop signal
                    </span>
                    <span className="text-xs uppercase tracking-[0.28em] text-white/80">
                      NOX / 001
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/40 p-5">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                        Scarcity
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                        Limited quantities.
                      </p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">
                        Built to disappear fast, with a private launch window for the waitlist.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                          VIP access
                        </p>
                        <p className="mt-3 text-lg font-medium text-white">Early checkout priority</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                          Promise
                        </p>
                        <p className="mt-3 text-lg font-medium text-white">
                          Once sold out, never restocked
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <motion.section
          id="waitlist"
          className="grid gap-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/45">
              Waitlist
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              Reserve your place before the first drop becomes public.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
              Get private updates, early access, and first refusal on the limited NOX launch.
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white/70">
                Name
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white/70">
                Email
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white/70">
                Instagram
              </div>
            </div>
          </motion.div>

          <motion.form
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7"
          >
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-white/45">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-white/25"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-white/45">Email</span>
                <input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-white/25"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-white/45">Instagram</span>
                <input
                  value={form.instagram}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, instagram: event.target.value }))
                  }
                  type="text"
                  placeholder="@yourhandle"
                  className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-white/25"
                />
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(255,255,255,0.18)]"
              >
                Join the waitlist
              </button>

              <div className="text-center text-xs uppercase tracking-[0.3em] text-white/40">
                Private access only. No restock. No noise.
              </div>

              {joined ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75"
                >
                  <div className="font-semibold">You're early — welcome.</div>
                  <div className="mt-2">You are on the NOX waitlist. Watch for the private drop signal.</div>

                  {referralLink ? (
                    <div className="mt-4">
                      <div className="text-xs text-white/60">Your referral link</div>
                      <div className="mt-2 flex items-center gap-2">
                        <input readOnly value={referralLink} className="flex-1 rounded px-3 py-2 text-black" />
                        <button
                          onClick={() => navigator.clipboard.writeText(referralLink)}
                          className="rounded bg-white px-3 py-2 font-semibold text-black"
                        >
                          Copy
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`I joined NOX early — grab private access: ${referralLink}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-[#25D366] px-3 py-2 font-semibold text-black"
                        >
                          WhatsApp
                        </a>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="text-xs text-white/60">Quick follow-up templates</div>
                        <div className="mt-2">
                          <div className="mt-1">Email subject: "You're invited — NOX early access"</div>
                          <pre className="mt-1 rounded bg-black/40 p-3 text-xs">Hi — I just reserved early access to NOX, a limited streetwear drop. Use my link to join: {referralLink}</pre>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </div>
          </motion.form>
        </motion.section>

        <motion.section
          className="grid gap-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/45">
              Scarcity
            </p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              The first NOX drop is built like a rumor with receipts.
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['Limited drop', 'Small run, high demand, no excess.'],
                ['VIP early access', 'Waitlist gets the first private window.'],
                ['Never restocked', 'Sold out means gone for good.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/35 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">{title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/65">{copy}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 backdrop-blur-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/45">
                Social proof
              </p>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/55">
                Live
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/40 p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-white/45">People joined</div>
              <div className="mt-3">
                <LiveWaitlistCounter collectionName="waitlist" />
                <div className="mt-2 text-sm text-white/55">have already reserved early access.</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5"
                >
                  <p className="text-sm leading-7 text-white/75">"{testimonial.quote}"</p>
                  <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/45">
                    <span>{testimonial.name}</span>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="py-10 pb-16 sm:py-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-8 text-center backdrop-blur-2xl sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/45">
              Final call
            </p>
            <h3 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              The first drop is almost here. Join now or watch it disappear.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              NOX opens with a limited release, private access, and no second chance once it sells out.
            </p>
            <a
              href="#waitlist"
              className="mt-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-1"
            >
              Secure your access
            </a>
          </div>
        </motion.section>
      </main>
    </div>
  );
}