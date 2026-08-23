import React from 'react';
import { motion } from 'framer-motion';

interface PredictionCardProps {
  disease: string;
  confidence: number;
  severity: string;
  specialist: string;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ disease, confidence, severity, specialist }) => {
  const severityColor =
    severity === 'Severe'
      ? 'text-red-400'
      : severity === 'Moderate'
      ? 'text-yellow-400'
      : 'text-green-400';

  return (
    <motion.div
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-cyan-400">{disease}</h3>
        <div className="text-2xl font-bold text-cyan-400">{confidence.toFixed(2)}%</div>
      </div>
      <div className="mt-4">
        <p className="text-gray-400">
          Severity: <span className={`${severityColor} font-bold`}>{severity}</span>
        </p>
        <p className="text-gray-400">
          Recommended Specialist: <span className="font-bold text-white">{specialist}</span>
        </p>
      </div>
    </motion.div>
  );
};

export default PredictionCard;
