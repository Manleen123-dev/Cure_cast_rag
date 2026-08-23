import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './DiseaseDictionary.css';

const API_URL = 'http://127.0.0.1:5000';

const DiseaseDictionary = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [diseases, setDiseases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && diseases.length === 0) {
      const fetchDiseases = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${API_URL}/diseases`);
          setDiseases(response.data);
        } catch (error) {
          console.error('Error fetching diseases:', error);
        }
        setLoading(false);
      };
      fetchDiseases();
    }
  }, [isOpen, diseases.length]);

  const filteredDiseases = diseases.filter((disease) =>
    disease.Disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
  };

  return (
    <>
      <motion.button
        className="fixed top-1/3 right-0 z-20 bg-primary text-background font-bold py-4 px-2 rounded-l-lg"
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.9 }}
      >
        <span className="vertical-text">Disease Dictionary</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 h-full w-96 bg-gray-900 bg-opacity-80 backdrop-blur-lg z-50 shadow-2xl"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-primary">Disease Dictionary</h3>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <input
                  type="text"
                  placeholder="Search diseases..."
                  className="w-full p-2 mb-4 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex-grow overflow-y-auto">
                  {loading ? (
                    <p className="text-center text-gray-400">Loading...</p>
                  ) : (
                    <ul>
                      {filteredDiseases.map((disease) => (
                        <li key={disease.Disease} className="p-2 border-b border-gray-800">
                          <h4 className="font-bold text-white">{disease.Disease}</h4>
                          <p className="text-sm text-gray-400">Severity: {disease.Severity} | Specialist: {disease.Specialist}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DiseaseDictionary;