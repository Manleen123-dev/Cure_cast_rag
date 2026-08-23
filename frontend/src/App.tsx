import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SymptomSelector from './components/SymptomSelector';
import PredictionOutput from './components/PredictionOutput';
import { motion } from 'framer-motion';
import './index.css';

const API_URL = 'http://127.0.0.1:8000';

interface Prediction {
  Disease: string;
  Percent: number;
  Severity: string;
  Specialist: string;
}

function App() {
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await axios.get(`${API_URL}/symptoms`);
        setAllSymptoms(response.data);
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      }
    };
    fetchSymptoms();
  }, []);

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        symptoms: selectedSymptoms,
      });
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center py-10">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-bold text-primary">CureCast</h1>
        <p className="mt-2 text-lg text-secondary">Your AI Disease Navigator</p>
      </motion.div>

      <div className="w-full max-w-lg p-8 bg-gray-900 rounded-xl shadow-2xl shadow-cyan-500/10">
        <SymptomSelector
          allSymptoms={allSymptoms}
          selectedSymptoms={selectedSymptoms}
          setSelectedSymptoms={setSelectedSymptoms}
        />
        <motion.button
          onClick={handlePredict}
          disabled={loading}
          className="w-full mt-6 py-3 bg-secondary text-white font-bold rounded-lg disabled:bg-gray-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Analyzing...' : 'Get Prediction'}
        </motion.button>
      </div>

      {predictions.length > 0 && (
        <PredictionOutput predictions={predictions} />
      )}
    </div>
  );
}

export default App;