import { motion } from 'framer-motion';

const features = [
  {
    title: 'Symptom Analysis',
    copy: 'Enter your symptoms and get predictions backed by curated medical data.',
    accent: 'from-cyan-400/40 via-cyan-300/20 to-transparent',
  },
  {
    title: 'Instant Predictions',
    copy: 'AI-powered results arrive in seconds with confidence scores.',
    accent: 'from-emerald-400/40 via-emerald-300/20 to-transparent',
  },
  {
    title: 'Actionable Insights',
    copy: 'See severity, recommendations, and next steps to act quickly.',
    accent: 'from-blue-400/40 via-blue-300/20 to-transparent',
  },
];

const glowPattern = {
  backgroundImage: `
    radial-gradient(circle at 20% 20%, rgba(0,170,255,0.12), transparent 25%),
    radial-gradient(circle at 80% 10%, rgba(0,245,195,0.14), transparent 20%),
    radial-gradient(circle at 50% 80%, rgba(0,170,255,0.12), transparent 25%)
  `,
  opacity: 0.9,
};

export default function Landing({ onLaunch }) {
  const handleLaunch = (event) => {
    if (onLaunch) {
      event.preventDefault();
      onLaunch();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white flex items-center justify-center px-6 py-12">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(120% 120% at 20% 10%, rgba(0,170,255,0.25), transparent), radial-gradient(120% 120% at 80% 10%, rgba(0,245,195,0.2), transparent)',
        }}
        animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 scale-105 blur-sm"
        style={{
          backgroundImage: 'url(/img_landing.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0" style={glowPattern} />

      <div className="relative z-10 w-full max-w-6xl space-y-12">
        <motion.header
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm uppercase tracking-[0.2em]">
            CureCast
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-cyan-300 drop-shadow-[0_0_15px_rgba(0,170,255,0.35)]">
            Your Personal AI Disease Navigator
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Predict. Prevent. Prevail. Leverage the power of AI to understand symptoms and unlock personalized health insights.
          </p>
        </motion.header>

        <motion.section
          className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/15 border border-cyan-400/25 text-cyan-200 text-sm w-fit">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
              Predictive insights in seconds
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">A calmer way to check your symptoms</h2>
            <p className="text-gray-200 leading-relaxed">
              CureCast combines an advanced CatBoost model with curated medical knowledge to give you clear, fast predictions—without the clutter.
              Get confidence scores, severity hints, and doctor recommendations in one place.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <motion.a
                href="#app"
                onClick={handleLaunch}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 font-semibold shadow-[0_15px_50px_rgba(0,170,255,0.35)] transition-all duration-300"
                whileHover={{ scale: 1.06, boxShadow: '0 25px 80px rgba(0,170,255,0.55)', y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Launch CureCast App
                <motion.span
                  aria-hidden="true"
                  className="text-xl"
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ↗
                </motion.span>
              </motion.a>
              <motion.div
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-200"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Trusted CatBoost model with curated medical data
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="sm:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl relative overflow-hidden"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 * index }}
                whileHover={{ y: -6, scale: 1.02, borderColor: 'rgba(0, 170, 255, 0.35)' }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 hover:opacity-100 transition-opacity duration-500`} />
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-cyan-200">{feature.title}</h3>
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                </div>
                <p className="text-sm text-gray-200 leading-relaxed relative z-10">{feature.copy}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.footer
          className="text-center text-sm text-gray-300 space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p>&copy; 2025 CureCast. All rights reserved.</p>
          <p className="text-gray-400">Disclaimer: CureCast is not a substitute for medical advice.</p>
        </motion.footer>
      </div>
    </div>
  );
}
