import React from 'react';
import FraudRiskDashboard from './fraud_dash';

// Mock window.fs functionality for development
if (!window.fs) {
  window.fs = {
    readFile: async (path) => {
      try {
        // Adjust the path to look in the public directory
        const response = await fetch(`/${path}`);
        return await response.text();
      } catch (error) {
        console.error('Error reading file:', error);
        throw error;
      }
    }
  };
}

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl sm:mx-auto w-full px-4">
        <FraudRiskDashboard />
      </div>
    </div>
  );
}

export default App; 