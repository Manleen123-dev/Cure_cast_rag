import React from 'react';
import PredictionCard from './PredictionCard.jsx';
import { motion } from 'framer-motion';

const PredictionOutput = ({ predictions }) => {
  if (predictions.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger the animation of children by 0.2s
      },
    },
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto mt-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-2xl font-bold text-center mb-4 text-primary">Top 3 Predictions</h2>
      {predictions.map((prediction) => (
        <PredictionCard
          key={prediction.Disease}
          disease={prediction.Disease}
          confidence={prediction.Percent}
          severity={prediction.Severity}
          specialist={prediction.Specialist}
        />
      ))}
    </motion.div>
  );
};

export default PredictionOutput;
