import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';

const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

function MasaDegistir({ tableItemData }) {
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [accessDenied, setAccessDenied] = useState(false); 
    useEffect(() => {
        const fetchAvailableTables = async () => {
            try {
                const response = await axios.get(`${base_url}/tables`, {
                    ...getHeaders(),
                    params: {
                        is_available: 1
                    },
                });
                
                // Filter out the current table from the available tables
                const filteredTables = response.data.tables.filter(table => table.id !== tableItemData.id);
                setAvailableTables(filteredTables);
            } catch (error) {
                console.error('Error fetching available tables:', error);
            }
        };

        fetchAvailableTables();
    }, [tableItemData.id]);

    const handleChangeTable = async (event) => {
        event.preventDefault();
        if (selectedTable) {
            try {
                await axios.post(`${base_url}/tables/${tableItemData.id}/change-table`, {
                    table_id: selectedTable
                }, getHeaders());
                
                // Handle successful response if needed
                // alert('Table changed successfully!');
                window.location.reload()
            } catch (error) {
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                   
                    console.error('Error changing table:', error);
                    alert('Cədvəli dəyişmək alınmadı. Yenidən cəhd edin.');
                }
            }
        } else {
            // alert('Please select a table.');
        }
    };

    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <form onSubmit={handleChangeTable}>
            <div className='border rounded bg-gray-50 m-4 p-3'>
                <h3 className='mb-3'>Taşınacak masa - Hangi masaya taşınacak?</h3>
                <div className='flex items-center mb-3'>
                    <select
                        className='form-item w-full'
                        name="targetTable"
                        id="targetTable"
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        required
                    >
                        <option value="">Select a table</option>
                        {availableTables.map(table => (
                            <option key={table.id} value={table.id}>
                                {table.name || 'No name'}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className='block bg-sky-600 font-medium py-2 px-4 rounded text-white'>
                    Massa Degistir
                </button>
            </div>
        </form>
    );
}

export default MasaDegistir;
