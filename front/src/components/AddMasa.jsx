
import React, { useState } from 'react';
import axios from 'axios';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';

const API_URL = `${base_url}/tables`;

function AddMasa({ onAdd, onClose, groups }) {
    const [name, setName] = useState('');
    const [group, setGroup] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({ name: '' });
    const [accessDenied, setAccessDenied] = useState(false);
    const handleAdd = async () => {
        if (isSubmitting) return; // Prevent multiple submissions

        let hasError = false;

        // Reset errors
        setErrors({ name: '' });

        // Validate inputs
        if (!name) {
            setErrors(prev => ({ ...prev, name: 'Masa adı is required' }));
            hasError = true;
        }

        if (hasError) {
            return; // Exit if there are validation errors
        }

        setIsSubmitting(true); // Set submitting state to true to disable the button

        const newMasa = {
            name,
            table_group_id: group ? parseInt(group, 10) : null // Allow null if no group is selected
        };

        try {
            // Send POST request
            const response = await axios.post(API_URL, newMasa, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            // onAdd(true); // Call the onAdd callback with the new data
            // onClose(); // Close the form
            window.location.reload()
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            }else{
                console.error('Error adding masa:', error);

            }
            // Optionally, set an error message state here
        } finally {
            setIsSubmitting(false); // Reset submitting state
        }
    };
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <div className='bg-white p-4 rounded shadow-lg'>
            <h4 className='font-semibold mb-3'>Yeni Masa əlavə edin</h4>
            <div className='mb-3'>
                <label className='block mb-1'>Masa adı</label>
                <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.name ? 'border-red-500' : ''}`}
                    required
                />
                {errors.name && <p className='text-red-500 text-sm'>{errors.name}</p>}
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Grup (Opsiyonel)</label>
                <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className='border rounded w-full p-2'
                >
                    <option value=''>Seçiniz (Opsiyonel)</option>
                    {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>
            <div className='flex justify-end gap-2'>
                <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>Kapat</button>
                <button 
                    onClick={handleAdd} 
                    className='bg-blue-500 text-white py-1 px-3 rounded' 
                    disabled={isSubmitting} // Disable the button if submitting
                >
                    {isSubmitting ? 'Əlavə olunur...' : 'Əlavə  et'}
                </button>
            </div>
        </div>
    );
}

export default AddMasa;
