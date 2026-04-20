

import React, { useState, useEffect } from 'react';

const AddGroupPopup = ({ group, onSave, onClose }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (group) {
            setName(group.name);
        }
    }, [group]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() === '') {
            return; // Prevent saving if name is empty
        }
        const newGroup = {
            id: group ? group.id : Date.now(), // Use existing ID if editing
            name
        };
        onSave(newGroup);
    };

    return (
        <div className="max-w-mobile fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 z-50">
        <div className="bg-white p-4 rounded shadow-lg w-full max-w-md mx-4 sm:mx-8">
            <h3 className="font-semibold mb-4 text-lg sm:text-xl">{group ? 'Yeniləyin Grupu' : 'Yeni Grup əlavə edin'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Grup Adı</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border rounded p-2 w-full"
                        required
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                        type="submit"
                        className="bg-sky-600 text-white py-2 px-4 rounded"
                    >
                        {group ? 'Güncelle' : 'əlavə edin'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-600 text-white py-2 px-4 rounded"
                    >
                        Kapat
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    );
};

export default AddGroupPopup;
