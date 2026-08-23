import React, { useState } from 'react';

interface SymptomSelectorProps {
  allSymptoms: string[];
  selectedSymptoms: string[];
  setSelectedSymptoms: (symptoms: string[]) => void;
}

const SymptomSelector: React.FC<SymptomSelectorProps> = ({ allSymptoms, selectedSymptoms, setSelectedSymptoms }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const filteredSymptoms = allSymptoms.filter((symptom) =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Search for symptoms..."
        className="w-full px-4 py-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="h-64 overflow-y-auto border border-gray-700 rounded-lg">
        {filteredSymptoms.map((symptom) => (
          <div
            key={symptom}
            className={`px-4 py-2 cursor-pointer ${
              selectedSymptoms.includes(symptom)
                ? 'bg-cyan-500 text-white'
                : 'hover:bg-gray-800'
            }`}
            onClick={() => handleSelectSymptom(symptom)}
          >
            {symptom}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymptomSelector;
