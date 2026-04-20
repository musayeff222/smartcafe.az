import React, { useState, useEffect } from 'react';
import AddPersonel from '../components/AddPersonel';
import EditPersonelPopup from '../components/EditPersonelPopup';
import axios from 'axios';
import AccessDenied from '../components/AccessDenied';
import { base_url,img_url } from '../api/index';
import { Helmet } from 'react-helmet';
// import DontActiveAcount from '../components/DontActiveAcount';
import PasswordScreen from '../components/ScreenPassword';
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    };
};

function PersonelTanimlari() {
    const [personelEkle, setPersonelEkle] = useState(false);
    const [editPersonel, setEditPersonel] = useState(null);
    const [personels, setPersonels] = useState([]);
    const [error, setError] = useState('');
    const [accessDenied, setAccessDenied] = useState(false); 
    const [ActiveUser, setActiveUser] = useState(false);
    console.log("ActiveUser",ActiveUser);
    
    useEffect(() => {
        axios.get(`${base_url}/personal`, getAuthHeaders())
            .then(response => {
                setPersonels(response.data.data.map(personel => ({
                    id: personel.id,
                    name: personel.name,
                    email: personel.email,
                    type: personel.roles.length > 0 ? personel.roles[0].name : 'Unknown',
                    permissions: personel.permissions || [] // Include permissions for general role
                })));
            })
            .catch(error => {
                if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                    setActiveUser(true); // Set access denied if response status is 403
                }
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                    console.error('Error loading customers:', error);
                    setError('Failed to load customer data.');
                }
            });
    }, []);

    const handleEdit = (personel) => {
        setEditPersonel(personel);
    };

    const handleSave = (updatedPersonel) => {
        axios.put(`${base_url}/personal/${updatedPersonel.id}`, updatedPersonel, getAuthHeaders())
            .then(response => {
                setPersonels(personels.map(personel =>
                    personel.id === updatedPersonel.id ? response.data : personel
                ));
                setEditPersonel(null);
                window.location.reload()
            })
            .catch(error => {
                if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                    setActiveUser(true); // Set access denied if response status is 403
                }
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                   
                    setError('Error updating personel');
                    console.error('Error updating personel:', error);
                }
            });
    };

    const handleDelete = (id) => {
        axios.delete(`${base_url}/personal/${id}`, getAuthHeaders())
            .then(() => {
                setPersonels(personels.filter(personel => personel.id !== id));
            })
            .catch(error => {
                if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                    setActiveUser(true); // Set access denied if response status is 403
                }
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                  
                    setError('Error deleting personel');
                    console.error('Error deleting personel:', error);
                }
            });
    };

    const handleAdd = (newPersonel) => {
        axios.post(`${base_url}/personal`, newPersonel, getAuthHeaders())
            .then(response => {
                setPersonels([...personels, response.data]);
                setPersonelEkle(false);
                window.location.reload()
            })
            .catch(error => {
                if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                    setActiveUser(true); // Set access denied if response status is 403
                }
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                   
                    setError('Error adding personel');
                    console.error('Error adding personel:', error);
                }
            });
    };
    // if (ActiveUser) return <DontActiveAcount onClose={setActiveUser}/>;
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <>
        <PasswordScreen/>
         <Helmet>
        <title>Kadr tərifləri | Smartcafe</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet>
      
        <section className='p-4'>
            <div className='rounded border bg-white'>
                <div className='p-3 border-b bg-[#fafbfc] flex items-center'>
                    <h3 className='font-semibold'>Kadr tərifləri</h3>
                    {!personelEkle &&
                        <button
                            onClick={() => setPersonelEkle(true)}
                            className='ml-auto mr-2 bg-sky-600 font-medium py-2 px-4 rounded text-white'
                        >
                            + Yeni personel əlavə edin
                        </button>
                    }
                    {personelEkle &&
                        <button
                            onClick={() => setPersonelEkle(false)}
                            className='ml-auto mr-2 bg-gray-700 flex items-center gap-1 font-medium py-2 px-4 rounded text-white'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-chevron-double-left" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
                                <path fillRule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
                            </svg>
                            Geri
                        </button>
                    }
                </div>
                <div className='p-3 w-full'>
                    {error && <p className='text-red-500'>{error}</p>}
                    {!personelEkle ? (
                       <div className="overflow-x-auto">
                       <table className='w-full text-left border rounded bg-gray-50'>
                           <thead className='border-b border-gray-300'>
                               <tr>
                                   <th className='p-3 font-semibold'>Ad soyad</th>
                                   <th className='p-3 font-semibold'>E-mail</th>
                                   <th className='p-3 font-semibold'>Tip</th>
                                   <th className='p-3 font-semibold w-1/12'>Detay</th>
                               </tr>
                           </thead>
                           <tbody className='text-sm'>
                               {personels.map(personel => (
                                   <tr key={personel.id} className='bg-white border-b border-gray-300'>
                                       <td className='p-3'>{personel.name}</td>
                                       <td className='p-3'>{personel.email}</td>
                                       <td className='p-3'>{personel.type}</td>
                                       <td className='p-3 flex gap-1'>
                                           <button
                                               onClick={() => handleEdit(personel)}
                                               className='rounded px-3 py-1 bg-red-600 text-white text-sm'
                                           >
                                               Yeniləyin
                                           </button>
                                           <button
                                               onClick={() => handleDelete(personel.id)}
                                               className='rounded px-3 py-1 bg-blue-500 text-white text-sm'
                                           >
                                               Sil
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
                   
                    ) : <AddPersonel onAdd={handleAdd} onClose={() => setPersonelEkle(false)} />}
                </div>
            </div>
            {editPersonel &&
                <EditPersonelPopup
                    personel={editPersonel}
                    onSave={handleSave}
                    onClose={() => setEditPersonel(null)}
                />
            }
        </section>
        </>
    );
}

export default PersonelTanimlari;
