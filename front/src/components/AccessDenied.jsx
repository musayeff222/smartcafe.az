
import React from 'react';
import nida from "../img/nida.png";

const AccessDenied = ({ onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative">
                <button
                    onClick={()=>onClose(false)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                <div className="text-center mb-4">
                    <img src={nida} alt="Access Denied" className="w-16 h-16 mx-auto mb-4" />
                </div>
                <div className="text-center text-xl font-semibold text-red-800">
                    Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
