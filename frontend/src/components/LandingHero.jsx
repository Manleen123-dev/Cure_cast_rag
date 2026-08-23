import { motion } from 'framer-motion';

const trustIndicators = ['AI-assisted', 'Educational', 'Private'];

export default function LandingHero({ onCheckSymptoms }) {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full opacity-[0.15] blur-3xl"
        style={{ background: 'var(--primary)' }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--primary)',
            background: 'var(--primary-soft)',
          }}
        >
          Understand your symptoms
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--text-primary)] sm:text-5xl">
          A clearer first step toward
          <br className="hidden sm:block" /> understanding your health.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
          Select the symptoms you're experiencing. CureCast analyzes them
          against its medical knowledge base and provides a likely match.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <motion.button
            type="button"
            onClick={onCheckSymptoms}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white shadow-glow transition-colors"
            style={{ background: 'var(--primary)' }}
          >
            Check my symptoms
            <span aria-hidden="true">→</span>
          </motion.button>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[var(--text-muted)]">
            {trustIndicators.map((label, i) => (
              <span key={label} className="inline-flex items-center gap-2">
                {i > 0 && (
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: 'var(--border-strong)' }}
                    aria-hidden="true"
                  />
                )}
                {label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}