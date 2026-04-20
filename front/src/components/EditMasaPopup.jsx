
// import React, { useState, useEffect } from 'react';

// function EditMasaPopup({ masa, onSave, onClose }) {
//     const [order, setOrder] = useState('');
//     const [name, setName] = useState('');
//     const [group, setGroup] = useState('');

//     useEffect(() => {
//         if (masa) {
//             setOrder(masa.order);
//             setName(masa.name);
//             setGroup(masa.group);
//         }
//     }, [masa]);

//     const handleSave = () => {
//         if (order && name && group) {
//             const updatedMasa = { ...masa, order: parseInt(order, 10), name, group };
//             onSave(updatedMasa);
//             onClose();
//         }
//     };

//     return (
//         <div className='fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50'>
//             <div className='bg-white p-4 rounded shadow-lg'>
//                 <h4 className='font-semibold mb-3'>Yeniləyin Masa</h4>
//                 <div className='mb-3'>
//                     <label className='block mb-1'>Sıra</label>
//                     <input
//                         type='number'
//                         value={order}
//                         onChange={(e) => setOrder(e.target.value)}
//                         className='border rounded w-full p-2'
//                     />
//                 </div>
//                 <div className='mb-3'>
//                     <label className='block mb-1'>Masa adı</label>
//                     <input
//                         type='text'
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         className='border rounded w-full p-2'
//                     />
//                 </div>
//                 <div className='mb-3'>
//                     <label className='block mb-1'>Grup</label>
//                     <input
//                         type='text'
//                         value={group}
//                         onChange={(e) => setGroup(e.target.value)}
//                         className='border rounded w-full p-2'
//                     />
//                 </div>
//                 <div className='flex justify-end gap-2'>
//                     <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>Cancel</button>
//                     <button onClick={handleSave} className='bg-blue-500 text-white py-1 px-3 rounded'>Save</button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default EditMasaPopup;

// import React, { useState, useEffect } from 'react';

// function EditMasaPopup({ masa, onSave, onClose }) {
//     const [order, setOrder] = useState('');
//     const [name, setName] = useState('');
//     const [group, setGroup] = useState('');

//     useEffect(() => {
//         if (masa) {
//             setOrder(masa.order);
//             setName(masa.name);
//             setGroup(masa.group || ''); // Allow for empty group
//         }
//     }, [masa]);

//     const handleSave = () => {
//         if (order && name) {
//             const updatedMasa = { ...masa, order: parseInt(order, 10), name, group };
//             onSave(updatedMasa);
//             onClose();
//         }
//     };

//     return (
//         <div className='fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50'>
//             <div className='bg-white p-4 rounded shadow-lg'>
//                 <h4 className='font-semibold mb-3'>Yeniləyin Masa</h4>
//                 <div className='mb-3'>
//                     <label className='block mb-1'>Sıra</label>
//                     <input
//                         type='number'
//                         value={order}
//                         onChange={(e) => setOrder(e.target.value)}
//                         className='border rounded w-full p-2'
//                     />
//                 </div>
//                 <div className='mb-3'>
//                     <label className='block mb-1'>Masa adı</label>
//                     <input
//                         type='text'
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         className='border rounded w-full p-2'
//                     />
//                 </div>
//                 <div className='mb-3'>
//                     <label className='block mb-1'>Grup</label>
//                     <input
//                         type='text'
//                         value={group}
//                         onChange={(e) => setGroup(e.target.value)}
//                         className='border rounded w-full p-2'
//                     />
//                 </div>
//                 <div className='flex justify-end gap-2'>
//                     <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>Kapat</button>
//                     <button onClick={handleSave} className='bg-blue-500 text-white py-1 px-3 rounded'>Kaydet</button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default EditMasaPopup;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';
const API_URL = `${base_url}/tables`;

function EditMasaPopup({ masa, onSave, onClose, groups }) {
    const [name, setName] = useState('');
    const [group, setGroup] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    useEffect(() => {
        if (masa) {
            setName(masa.name);
            setGroup(masa.table_group_id || '');
        }
    }, [masa]);

    const handleSave = async () => {
        if (name) {
            const updatedMasa = { ...masa, name, table_group_id: parseInt(group, 10) };
            try {
                await axios.put(`${API_URL}/${masa.id}`, updatedMasa, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                });
                onSave(updatedMasa);
                onClose();
                window.location.reload()
            } catch (error) {
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                   
                    console.error('Error updating masa:', error);
                    
                }
            }
        }
    };
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50'>
            <div className='bg-white p-4 rounded shadow-lg'>
                <h4 className='font-semibold mb-3'>Yeniləyin Masani</h4>
                <div className='mb-3'>
                    <label className='block mb-1'>Masa adı</label>
                    <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='border rounded w-full p-2'
                    />
                </div>
                <div className='mb-3'>
                    <label className='block mb-1'>Grup</label>
                    <select
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        className='border rounded w-full p-2'
                    >
                        <option value=''>Seçiniz</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
                <div className='flex justify-end gap-2'>
                    <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>Kapat</button>
                    <button onClick={handleSave} className='bg-blue-500 text-white py-1 px-3 rounded'>Saxla</button>
                </div>
            </div>
        </div>
    );
}

export default EditMasaPopup;
