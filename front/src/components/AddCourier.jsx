import React, { useState } from 'react';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';
function AddCourier({ onAdd, onClose }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);
    
    const handleAdd = async () => {
        // Проверка обязательных полей
        if (name && phone) {
            const newCourier = {
                name,
                phone,
                address // Это поле может быть пустым
            };

            try {
                const response = await fetch(`${base_url}/couriers`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(newCourier)
                });
                if (response.status === 403) {
                    setAccessDenied(true); // Show access denied if response status is 403
                    return;
                }
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                onAdd(result);  // Передайте ответ с сервера, если это необходимо
                onClose();  // Закрыть форму добавления
            } catch (error) {
                console.error('Error adding courier:', error);
                setError('Failed to add courier. Please try again.');
            }
        } else {
            // Обновленная ошибка с учетом только обязательных полей
            setError('Name and phone are required.');
        }
    };
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <div className='p-4 bg-white rounded shadow-lg'>
            <h4 className='font-semibold mb-3'>Yeni Kurye əlavə edin</h4>
            {error && <p className='text-red-500 mb-3'>{error}</p>}
            <div className='mb-3'>
                <label className='block mb-1'>Ad Soyad</label>
                <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='border rounded w-full p-2'
                    required
                />
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Telefon</label>
                <input
                    type='text'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='border rounded w-full p-2'
                    required
                />
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Adres (Opsiyonel)</label>
                <input
                    type='text'
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className='border rounded w-full p-2'
                />
            </div>
            <div className='flex justify-end gap-2'>
                <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>Bağla</button>
                <button onClick={handleAdd} className='bg-green-500 text-white py-1 px-3 rounded'>Əlavə ele</button>
            </div>
        </div>
    );
}

export default AddCourier;
