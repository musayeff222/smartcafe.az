// components/SelectCourierModal.js
import React from 'react';

function SelectCourierModal({updateCustomerInfo,DataItemOrder, couriers, onSelect, onClose }) {
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded shadow-lg w-1/3 p-4">
                <h4 className="text-lg font-semibold mb-3">Kurye Seçimi</h4>
                <ul>
                    {couriers.map(courier => (
                        <li onClick={()=>updateCustomerInfo(DataItemOrder,courier.id)} key={courier.id} className="mb-2">
                            <button 
                                onClick={() => onSelect(courier)}
                                className="w-full text-left px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                            >
                                {courier.name}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-end mt-3">
                    <button 
                        onClick={onClose}
                        className="bg-gray-500 text-white py-1 px-3 rounded"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SelectCourierModal;
