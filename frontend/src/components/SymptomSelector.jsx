import { useDeferredValue, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function normalize(value) {
  return (value || '').toLowerCase().trim();
}

export default function SymptomSelector({
  allSymptoms,
  selectedSymptoms,
  onChange,
  onPredict,
  onClear,
  loading,
  loadingSymptoms,
}) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const selectedSet = new Set(selectedSymptoms);
  const availableSymptoms = allSymptoms.filter((item) => !selectedSet.has(item));
  const term = normalize(deferredQuery);

  const filteredSymptoms = !term
    ? [...availableSymptoms].sort((l, r) => l.localeCompare(r)).slice(0, 10)
    : availableSymptoms
        .filter((item) => normalize(item).includes(term))
        .sort((l, r) => {
          const lStarts = normalize(l).startsWith(term);
          const rStarts = normalize(r).startsWith(term);
          if (lStarts !== rStarts) return lStarts ? -1 : 1;
          return l.localeCompare(r);
        })
        .slice(0, 10);

  const addSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) return;
    onChange([...selectedSymptoms, symptom]);
    setQuery('');
  };

  const removeSymptom = (symptom) => {
    onChange(selectedSymptoms.filter((item) => item !== symptom));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && filteredSymptoms.length > 0) {
      event.preventDefault();
      addSymptom(filteredSymptoms[0]);
      return;
    }
    if (event.key === 'Backspace' && !query && selectedSymptoms.length > 0) {
      removeSymptom(selectedSymptoms[selectedSymptoms.length - 1]);
    }
  };

  const showSuggestions = isFocused && filteredSymptoms.length > 0;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card sm:p-8">

      {/* ---------------- HEADING ---------------- */}

      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold sm:text-2xl">What are you experiencing?</h2>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Select all symptoms that apply.
          </p>
        </div>
        <div className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]" style={{ background: 'var(--primary-soft)' }}>
          {loadingSymptoms ? 'Loading symptoms...' : `${allSymptoms.length} known symptoms`}
        </div>
      </div>

      <div className="mt-6 space-y-6">

        {/* ---------------- SEARCH ---------------- */}

        <div className="relative">
          <label htmlFor="symptom-search" className="sr-only">Search symptoms</label>
          <input
            id="symptom-search"
            type="text"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="symptom-suggestions"
            aria-autocomplete="list"
            placeholder="Search symptoms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
            className="w-full rounded-xl border px-4 py-3.5 text-base outline-none transition-colors placeholder:text-[var(--text-muted)]"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-primary)',
            }}
          />

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                id="symptom-suggestions"
                role="listbox"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border shadow-soft"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                {filteredSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    role="option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addSymptom(symptom)}
                    className="flex w-full items-center justify-between border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-[var(--primary-soft)]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span>{symptom}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Add</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------------- SELECTED CHIPS ---------------- */}

        {selectedSymptoms.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Selected</h3>
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--severe)]"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {selectedSymptoms.map((symptom) => (
                  <motion.button
                    key={symptom}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => removeSymptom(symptom)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    <span aria-hidden="true">{'\u2713'}</span>
                    {symptom}
                    <span className="ml-0.5 opacity-70">{'\u00D7'}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ---------------- QUICK PICKS ---------------- */}

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {query ? 'Suggested matches' : 'Quick picks'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {filteredSymptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => addSymptom(symptom)}
                className="rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- FOOTER / ACTIONS ---------------- */}

        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {selectedSymptoms.length} symptom{selectedSymptoms.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClear}
              disabled={selectedSymptoms.length === 0}
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Reset
            </button>
            <motion.button
              type="button"
              onClick={onPredict}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || selectedSymptoms.length === 0}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Analyzing...' : 'Analyze symptoms'}
              {!loading && <span aria-hidden="true">{'\u2192'}</span>}
            </motion.button>
          </div>
        </div>

      </div>
    </section>
  );
}
