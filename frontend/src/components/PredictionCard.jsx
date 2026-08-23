import React from 'react';
import { motion } from 'framer-motion';

const PredictionCard = ({ disease, confidence, severity, specialist }) => {
  const severityStyles = {
    Severe: {
      cardBg: 'bg-red-900/20',
      barBg: 'bg-red-500',
      text: 'text-red-400',
      border: 'border-red-500/50',
    },
    Moderate: {
      cardBg: 'bg-yellow-900/20',
      barBg: 'bg-yellow-500',
      text: 'text-yellow-400',
      border: 'border-yellow-500/50',
    },
    Mild: {
      cardBg: 'bg-green-900/20',
      barBg: 'bg-green-500',
      text: 'text-green-400',
      border: 'border-green-500/50',
    },
  };

  const styles = severityStyles[severity] || severityStyles.Mild;

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <motion.div
      className={`p-5 mb-4 rounded-2xl border ${styles.border} ${styles.cardBg} shadow-lg backdrop-blur-sm`}
      variants={cardVariants}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white w-2/3">{disease}</h3>
        <div className={`text-3xl font-bold ${styles.text}`}>{confidence.toFixed(1)}%</div>
      </div>

      <div className="w-full bg-gray-700/30 rounded-full h-3 mt-3 overflow-hidden">
        <motion.div
          className={`h-3 rounded-full ${styles.barBg}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, duration: 1.5 }}
        ></motion.div>
      </div>
      
      <div className="mt-4 text-sm flex justify-between">
        <p className="text-gray-300">
          Severity: <span className={`font-bold ${styles.text}`}>{severity}</span>
        </p>
        <p className="text-gray-300">
          Specialist: <span className="font-bold text-white">{specialist}</span>
        </p>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
