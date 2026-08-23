import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const pipelineSteps = [
  'Symptoms',
  'Disease-symptom matching',
  'Semantic retrieval',
  'FAISS vector search',
  'Relevant medical documents',
  'Prediction + explanation',
];

function Collapsible({ label, expanded, onToggle, children }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold">{label}</h3>
        <span className="text-lg font-medium text-[var(--text-muted)]" aria-hidden="true">
          {expanded ? '\u2212' : '+'}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExplanationPanel({ explanation, prediction, disclaimer, retrievalMode }) {
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);

  if (!explanation || !prediction) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card sm:p-8"
    >

      {/* ---------------- HEADER ---------------- */}

      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--primary)' }}>
            Explanation
          </p>
          <h2 className="text-xl font-extrabold">{explanation.headline}</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{explanation.summary}</p>
        </div>
        <div
          className="rounded-xl px-4 py-3 text-sm sm:max-w-xs"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
        >
          <p className="font-bold">Consult a doctor</p>
          <p className="mt-1 leading-5 opacity-90">
            Predictions should guide a conversation with a clinician, not replace diagnosis.
          </p>
        </div>
      </div>

      {/* ---------------- WHY THIS RESULT ---------------- */}

      <div className="rounded-xl border border-[var(--border)] p-5">
        <h3 className="text-sm font-bold">Why CureCast suggested this</h3>
        <ul className="mt-3 space-y-2.5 text-sm leading-6 text-[var(--text-secondary)]">
          {(explanation.why_it_matches || []).map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true">
                {'\u2713'}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
          These symptoms were found in the retrieved medical information associated with this condition.
        </p>
      </div>

      {/* ---------------- MEDICAL CONTEXT / NEXT STEP / SAFETY ---------------- */}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] p-5">
          <h3 className="text-sm font-bold">Medical context</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{explanation.medical_context}</p>
        </article>

        <article
          className="rounded-xl p-5"
          style={{ background: 'var(--primary-soft)' }}
        >
          <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Next best step</h3>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--primary)' }}>{explanation.care_guidance}</p>
        </article>

        <article
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--warning)', background: 'var(--warning-bg)' }}
        >
          <h3 className="text-sm font-bold" style={{ color: 'var(--warning)' }}>Safety note</h3>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--warning)' }}>{explanation.triage_note}</p>
        </article>
      </div>

      {/* ---------------- READ MORE ---------------- */}

      {explanation.read_more && (
        <Collapsible label="Read more" expanded={readMoreOpen} onToggle={() => setReadMoreOpen((v) => !v)}>
          <div className="space-y-4 text-sm leading-6 text-[var(--text-secondary)]">
            <div>
              <p className="font-bold text-[var(--text-primary)]">Condition overview</p>
              <p>{explanation.read_more.description}</p>
            </div>
            <div>
              <p className="font-bold text-[var(--text-primary)]">Causes and background</p>
              <p>{explanation.read_more.causes}</p>
            </div>
            <div>
              <p className="font-bold text-[var(--text-primary)]">When to seek care</p>
              <p>{explanation.read_more.when_to_see_doctor}</p>
            </div>
          </div>
        </Collapsible>
      )}

      {/* ---------------- EVIDENCE USED ---------------- */}

      <div className="rounded-xl border border-[var(--border)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold">Evidence used</h3>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            Semantic retrieval {'\u00B7'} {retrievalMode || 'FAISS'}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {(explanation.sources || []).map((source) => (
            <article
              key={`${source.source}-${source.method}`}
              className="rounded-lg border border-[var(--border)] p-4"
              style={{ background: 'var(--bg)' }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{source.title}</h4>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">{source.source}</p>
                </div>
                <span
                  className="w-fit rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                >
                  Relevance {Math.round(source.relevance * 100)}%
                </span>
              </div>
              <p className="mt-2.5 text-sm leading-6 text-[var(--text-secondary)]">{source.excerpt}</p>
            </article>
          ))}
        </div>

        {disclaimer && (
          <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">{disclaimer}</p>
        )}
      </div>

      {/* ---------------- HOW WAS THIS GENERATED ---------------- */}

      <Collapsible
        label="How was this result generated?"
        expanded={pipelineOpen}
        onToggle={() => setPipelineOpen((v) => !v)}
      >
        <ol className="flex flex-col gap-0">
          {pipelineSteps.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                >
                  {i + 1}
                </span>
                {i < pipelineSteps.length - 1 && (
                  <span className="h-6 w-px" style={{ background: 'var(--border)' }} aria-hidden="true" />
                )}
              </div>
              <span className="pb-6 text-sm text-[var(--text-secondary)]">{step}</span>
            </li>
          ))}
        </ol>
      </Collapsible>

    </motion.section>
  );
}
