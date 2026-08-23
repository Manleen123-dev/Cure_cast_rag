import { motion } from 'framer-motion';

const severityTokens = {
  Severe: { bg: 'var(--severe-bg)', fg: 'var(--severe)' },
  Moderate: { bg: 'var(--moderate-bg)', fg: 'var(--moderate)' },
  Mild: { bg: 'var(--mild-bg)', fg: 'var(--mild)' },
  Unknown: { bg: 'var(--border)', fg: 'var(--text-secondary)' },
};

function confidenceContext(value) {
  if (value < 30) {
    return {
      label: 'Low-confidence match',
      copy: 'Your symptoms do not strongly point to one specific condition.',
    };
  }
  if (value < 60) {
    return {
      label: 'Moderate-confidence match',
      copy: 'Your symptoms show a reasonably consistent pattern with this condition.',
    };
  }
  return {
    label: 'Strong match',
    copy: 'Your symptoms align closely with this condition in the retrieved data.',
  };
}

function PriorityBadge({ severity }) {
  const tokens = severityTokens[severity] || severityTokens.Unknown;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
      style={{ background: tokens.bg, color: tokens.fg }}
    >
      {severity} priority
    </span>
  );
}

export default function ResultsPanel({ prediction, alternatives }) {
  if (!prediction) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--primary)' }}>
          Results
        </p>
        <h2 className="mt-2 text-xl font-extrabold">Your prediction snapshot will appear here.</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
          Select symptoms, run a check, and CureCast will highlight the leading condition,
          match strength, and a few alternatives.
        </p>
      </section>
    );
  }

  const confidence = prediction.confidence ?? 0;
  const context = confidenceContext(confidence);
  const barWidth = `${Math.min(Math.max(confidence, 2), 100)}%`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card"
    >

      {/* ---------------- MAIN RESULT ---------------- */}

      <div className="border-b border-[var(--border)] px-6 py-6 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--primary)' }}>
          Analysis complete
        </p>

        <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">Most consistent with</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{prediction.disease}</h2>
          <PriorityBadge severity={prediction.severity} />
        </div>

        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          This is the model's leading match for the current symptom set. Use it as a
          screening guide and pair it with professional medical advice.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <span className="rounded-full px-3 py-1" style={{ background: 'var(--primary-soft)' }}>
            Specialist: {prediction.specialist}
          </span>
          {prediction.sample_count ? (
            <span className="rounded-full px-3 py-1" style={{ background: 'var(--primary-soft)' }}>
              Training samples: {prediction.sample_count}
            </span>
          ) : null}
        </div>

        {/* ---------------- MATCH STRENGTH (was: alarming confidence ring) ---------------- */}

        <div className="mt-6 rounded-xl border border-[var(--border)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
              Match strength
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {confidence.toFixed(1)}% {'\u00B7'} {context.label}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--primary)' }}
              initial={{ width: 0 }}
              animate={{ width: barWidth }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2.5 text-xs leading-5 text-[var(--text-muted)]">{context.copy}</p>
        </div>
      </div>

      {/* ---------------- ALTERNATIVES ---------------- */}

      {alternatives && alternatives.length > 0 && (
        <div className="grid gap-3 px-6 py-6 sm:px-8 md:grid-cols-3">
          {alternatives.map((item) => {
            const tokens = severityTokens[item.severity] || severityTokens.Unknown;
            return (
              <article
                key={item.disease}
                className="rounded-xl border border-[var(--border)] p-4"
                style={{ background: 'var(--bg)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)]">Alternative</p>
                    <h3 className="mt-0.5 text-sm font-bold">{item.disease}</h3>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: tokens.bg, color: tokens.fg }}
                  >
                    {item.severity}
                  </span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: tokens.fg }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Probability</span>
                  <span className="font-bold" style={{ color: tokens.fg }}>
                    {item.confidence.toFixed(1)}%
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
