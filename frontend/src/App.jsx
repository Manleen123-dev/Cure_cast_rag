import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import LandingHero from './components/LandingHero.jsx';
import SymptomSelector from './components/SymptomSelector.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import ExplanationPanel from './components/ExplanationPanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';

import './index.css';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const HISTORY_STORAGE_KEY = 'curecast-history-v1';
const THEME_STORAGE_KEY = 'curecast-theme';

const loadingMessages = [
  'Reviewing the selected symptom pattern',
  'Comparing the pattern with the prediction model',
  'Preparing a grounded screening summary',
];

const processSteps = [
  {
    number: '01',
    title: 'Select symptoms',
    copy: 'Choose the symptoms you\u2019re experiencing.',
  },
  {
    number: '02',
    title: 'Analyze patterns',
    copy: 'CureCast compares the selected symptoms against its knowledge base.',
  },
  {
    number: '03',
    title: 'Understand results',
    copy: 'Review the most consistent possibilities and supporting information.',
  },
];

/* =========================================================
   LOCAL STORAGE HELPERS
========================================================= */

function loadHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function getInitialTheme() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [history, setHistory] = useState(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(getInitialTheme);

  const checkerRef = useRef(null);
  const resultsRef = useRef(null);

  /* ---------------- THEME ---------------- */

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  /* ---------------- LOAD SYMPTOMS ---------------- */

  useEffect(() => {
    const fetchSymptoms = async () => {
      setLoadingSymptoms(true);
      try {
        const response = await axios.get(`${API_URL}/symptoms`);
        setAllSymptoms(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to load symptoms:', err);
        setError('Unable to load the symptom library. Please make sure the Flask backend is running.');
      } finally {
        setLoadingSymptoms(false);
      }
    };
    fetchSymptoms();
  }, []);

  /* ---------------- SAVE HISTORY ---------------- */

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Unable to save history:', err);
    }
  }, [history]);

  /* ---------------- LOADING MESSAGE ROTATION ---------------- */

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setLoadingMessageIndex((value) => (value + 1) % loadingMessages.length);
    }, 1600);
    return () => window.clearInterval(interval);
  }, [loading]);

  /* ---------------- PREDICTION ---------------- */

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0 || loading) return;

    setLoading(true);
    setAssessment(null);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/predict`, { symptoms: selectedSymptoms });
      const nextAssessment = response.data;
      setAssessment(nextAssessment);

      const historyEntry = {
        id: `${nextAssessment.checked_at || Date.now()}-${nextAssessment.prediction?.disease || 'prediction'}`,
        checkedAt: nextAssessment.checked_at,
        selectedSymptoms: nextAssessment.selected_symptoms || selectedSymptoms,
        prediction: nextAssessment.prediction,
        alternatives: nextAssessment.alternatives || [],
        explanation: nextAssessment.explanation,
        disclaimer: nextAssessment.disclaimer,
        retrievalMode: nextAssessment.retrieval_mode,
      };

      setHistory((current) => [historyEntry, ...current].slice(0, 8));

      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (requestError) {
      console.error('Prediction error:', requestError);
      const backendMessage =
        requestError?.response?.data?.disclaimer || requestError?.response?.data?.error;
      setError(backendMessage || 'Prediction could not be completed. Please confirm that the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedSymptoms([]);
    setAssessment(null);
    setError('');
  };

  const handleScrollToChecker = () => {
    checkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRestoreHistory = (entry) => {
    setSelectedSymptoms(entry.selectedSymptoms || []);
    setAssessment({
      checked_at: entry.checkedAt,
      selected_symptoms: entry.selectedSymptoms || [],
      prediction: entry.prediction,
      alternatives: entry.alternatives || [],
      explanation: entry.explanation,
      disclaimer: entry.disclaimer,
      retrieval_mode: entry.retrievalMode,
    });
    setError('');
    window.setTimeout(() => {
      checkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleRemoveHistory = (entryId) => {
    setHistory((current) => current.filter((entry) => entry.id !== entryId));
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-200">

      {/* ============================ HEADER ============================ */}

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5"
            aria-label="Go to CureCast home"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold text-white"
              style={{ background: 'var(--primary)' }}
            >
              C
            </span>
            <span className="text-[15px] font-extrabold tracking-tight">CureCast</span>
          </button>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--text-secondary)] sm:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[var(--text-primary)]">
              How it works
            </a>
            <a href="#about" className="transition-colors hover:text-[var(--text-primary)]">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <span aria-hidden="true">{darkMode ? '\u2600' : '\u263E'}</span>
            </button>

            <button
              type="button"
              onClick={handleScrollToChecker}
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors sm:inline-flex"
              style={{ background: 'var(--primary)' }}
            >
              Check symptoms
            </button>
          </div>

        </div>
      </header>

      <main>

        {/* ============================ HERO ============================ */}

        <LandingHero onCheckSymptoms={handleScrollToChecker} />

        {/* ============================ HOW IT WORKS ============================ */}

        <section id="how-it-works" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold sm:text-3xl">How CureCast works</h2>
          </div>

          <div className="relative flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">

            {/* connecting line — desktop only */}
            <div
              className="absolute left-0 right-0 top-5 hidden h-px sm:block"
              style={{ background: 'var(--border)' }}
              aria-hidden="true"
            />

            {processSteps.map((step) => (
              <div key={step.number} className="relative flex flex-1 flex-col items-center gap-3 text-center">
                <span
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                >
                  {step.number}
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.08em]">{step.title}</h3>
                  <p className="mt-1.5 max-w-[220px] text-sm leading-6 text-[var(--text-secondary)]">
                    {step.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================ SYMPTOM CHECKER + RESULTS ============================ */}

        <section ref={checkerRef} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">

            {/* ---------------- PRIMARY COLUMN ---------------- */}

            <div className="flex flex-col gap-6">

              <SymptomSelector
                allSymptoms={allSymptoms}
                selectedSymptoms={selectedSymptoms}
                onChange={setSelectedSymptoms}
                onPredict={handlePredict}
                onClear={handleClear}
                loading={loading}
                loadingSymptoms={loadingSymptoms}
              />

              <AnimatePresence initial={false}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: 'var(--severe)',
                      background: 'var(--severe-bg)',
                      color: 'var(--severe)',
                    }}
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: 'var(--severe)' }}
                    >
                      !
                    </span>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">

                {loading && (
                  <motion.section
                    key="loading"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card sm:p-8"
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ background: 'var(--primary-soft)' }}
                      >
                        <span
                          className="h-2.5 w-2.5 animate-pulse rounded-full"
                          style={{ background: 'var(--primary)' }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-xs font-bold uppercase tracking-[0.14em]"
                          style={{ color: 'var(--primary)' }}
                        >
                          Screening in progress
                        </p>
                        <h3 className="mt-0.5 text-base font-semibold">
                          {loadingMessages[loadingMessageIndex]}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-5 h-1 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                      <motion.div
                        className="h-full w-2/5 rounded-full"
                        style={{ background: 'var(--primary)' }}
                        animate={{ x: ['-20%', '250%'] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-16 animate-pulse rounded-xl"
                          style={{ background: 'var(--primary-soft)' }}
                        />
                      ))}
                    </div>
                  </motion.section>
                )}

                {!loading && assessment && (
                  <motion.div
                    key="results"
                    ref={resultsRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col gap-6"
                  >
                    <ResultsPanel
                      prediction={assessment.prediction}
                      alternatives={assessment.alternatives || []}
                    />
                    <ExplanationPanel
                      explanation={assessment.explanation}
                      prediction={assessment.prediction}
                      disclaimer={assessment.disclaimer}
                      retrievalMode={assessment.retrieval_mode}
                    />
                  </motion.div>
                )}

                {!loading && !assessment && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 rounded-2xl border border-dashed p-8"
                    style={{ borderColor: 'var(--border-strong)' }}
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
                      +
                    </span>
                    <div>
                      <strong className="block text-sm font-semibold">
                        Your screening result will appear here
                      </strong>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Select symptoms above and run a check to continue.
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* ---------------- HISTORY SIDEBAR ---------------- */}

            <aside className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card lg:sticky lg:top-24">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={historyOpen}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Past checks
                  </span>
                  {history.length > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
                      {history.length}
                    </span>
                  )}
                </span>
                <span
                  className="text-[var(--text-muted)] transition-transform"
                  style={{ transform: historyOpen ? 'rotate(180deg)' : 'none' }}
                  aria-hidden="true"
                >
                  {'\u02C7'}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {historyOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[var(--border)]"
                  >
                    <div className="p-3">
                      <HistoryPanel
                        history={history}
                        onRestore={handleRestoreHistory}
                        onRemove={handleRemoveHistory}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </aside>

          </div>
        </section>

      </main>

      {/* ============================ FOOTER / DISCLAIMER ============================ */}

      <footer id="about" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)]">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-extrabold text-white"
            style={{ background: 'var(--primary)' }}
          >
            C
          </span>
          CureCast
        </div>

        <div
          className="rounded-xl border px-4 py-3 text-xs leading-6"
          style={{
            borderColor: 'var(--warning)',
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
          }}
        >
          CureCast provides AI-assisted educational information and is not a
          substitute for professional medical diagnosis or care.
        </div>
      </footer>

    </div>
  );
}

export default App;
