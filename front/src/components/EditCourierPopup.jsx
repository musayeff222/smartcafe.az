import React, { useState } from 'react';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';
function EditCourierPopup({ courier, onSave, onClose }) {
    const [name, setName] = useState(courier.name);
    const [phone, setPhone] = useState(courier.phone);
    const [address, setAddress] = useState(courier.address);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${base_url}/couriers/${courier.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                body: JSON.stringify({ name, phone, address })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const updatedCourier = await response.json();
            onSave(updatedCourier);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
               
                console.error('Error updating courier:', error);
                setError('Failed to update courier. Please try again later.');

                
            }
        } finally {
            setLoading(false);
        }
    };
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <div className='max-w-mobile  fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50'>
            <div className='bg-white p-6 rounded shadow-lg w-full max-w-lg'>
                <h4 className='font-semibold mb-3'>Edit Courier</h4>
                {error && <p className='text-red-500 mb-3'>{error}</p>}
                <div className='mb-3'>
                    <label className='block mb-1'>Ad soyad</label>
                    <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='border rounded w-full p-2'
                    />
                </div>
                <div className='mb-3'>
                    <label className='block mb-1'>Telefon</label>
                    <input
                        type='text'
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className='border rounded w-full p-2'
                    />
                </div>
                <div className='mb-3'>
                    <label className='block mb-1'>Adres</label>
                    <input
                        type='text'
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className='border rounded w-full p-2'
                    />
                </div>
                <div className='flex justify-end gap-2'>
                    <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>Kapat</button>
                    <button 
                        onClick={handleSave} 
                        className='bg-blue-500 text-white py-1 px-3 rounded'
                        disabled={loading}
                    >
                        {loading ? 'Yenilənir...' : 'Yenilə'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditCourierPopup;
