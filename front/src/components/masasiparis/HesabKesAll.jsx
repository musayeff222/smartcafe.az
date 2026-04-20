// HesabKesAll.jsx
import React from 'react';
import HesapKes from '../HesapKes';

// Dəyişiklik: prepaidAmount prop-u əlavə edildi
const HesabKesAll = ({ setHesabKes, tableName, orderId, totalAmount, orderStocks, prepaidAmount }) => {
  console.log("orderStocks", orderStocks);
  
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300 relative">
        {/* Header Section */}
        <div className="bg-gray-200 p-4 flex justify-between items-center border-b">
          <h3 className="text-xl font-semibold text-gray-800">{tableName}</h3>
          <button
            onClick={() => setHesabKes(false)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>
          
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {/* Dəyişiklik: prepaidAmount HesapKes-ə ötürüldü */}
          <HesapKes 
            orderStocks={orderStocks} 
            orderId={orderId} 
            totalAmount={totalAmount} 
            prepaidAmount={prepaidAmount} 
          />
        </div>
      </div>
    </div>
  );
};

export default HesabKesAll;