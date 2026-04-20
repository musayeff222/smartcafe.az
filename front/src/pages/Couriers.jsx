import React, { useState, useEffect } from 'react';
import AccessDenied from '../components/AccessDenied';
import AddCourier from '../components/AddCourier';
import EditCourierPopup from '../components/EditCourierPopup';
import { base_url } from '../api/index';
import { Helmet } from 'react-helmet';

import PasswordScreen from '../components/ScreenPassword';
const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

function Couriers() {
    const [kurerEkle, setKurerEkle] = useState(false);
    const [editCourier, setEditCourier] = useState(null);
    const [couriers, setCouriers] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const [ActiveUser, setActiveUser] = useState(false);
    useEffect(() => {
        const fetchCouriers = async () => {
            try {
                const response = await fetch(`${base_url}/couriers`, {
                    method: 'GET',
                    ...getHeaders()
                });
                // console.log(response.data.message);
                if (response.status === 403) {
                    setActiveUser(true); // Set access denied if response status is 403
                    return;
                }

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setCouriers(data);
            } catch (error) {
                if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                    setActiveUser(true); // Set access denied if response status is 403
                }
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                }
                // console.error('Error loading couriers:', error);
                // setError('Failed to load courier data.');
            } finally {
                setLoading(false);
            }
        };

        fetchCouriers();
    }, []);

    const handleEdit = (courier) => {
        setEditCourier(courier);
    };

    const handleSave = (updatedCourier) => {
        setCouriers(couriers.map(courier =>
            courier.id === updatedCourier.id ? updatedCourier : courier
        ));
        setEditCourier(null);
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${base_url}/couriers/${id}`, {
                method: 'DELETE',
                ...getHeaders()
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 403) {
                setAccessDenied(true); // Show access denied if response status is 403
                return;
            }

            setCouriers(couriers.filter(courier => courier.id !== id));
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            }
            // console.error('Error deleting courier:', error);
            // setError('Failed to delete courier. Please try again later.');
        }
    };

    const handleAdd = (newCourier) => {
        setCouriers([...couriers, newCourier]);
    };

    if (loading) {
        return <p>Yüklənir...</p>;
    }
    // if (ActiveUser) return <DontActiveAcount onClose={setActiveUser}/>;
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;

    return (
        <>
        <PasswordScreen/>

                           <Helmet>
        <title>Kuryer | Smartcafe</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet>
        <section className='p-4'>
            <div className='rounded border bg-white'>
                <div className='p-3 border-b bg-[#fafbfc] flex items-center'>
                    <h3 className='font-semibold'>Kurye tanımları</h3>
                    {!kurerEkle && 
                        <button 
                            onClick={() => setKurerEkle(true)} 
                            className='ml-auto mr-2 bg-sky-600 font-medium py-2 px-4 rounded text-white'
                        >
                            + Yeni kurye əlavə edin
                        </button>
                    }
                    {kurerEkle && 
                        <button 
                            onClick={() => setKurerEkle(false)} 
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
                    {!kurerEkle ? (
                  <div className='overflow-x-auto'>
    <table className='w-full text-left border rounded bg-gray-50'>
        <thead className='border-b border-gray-300'>
            <tr>
                <th className='p-3 font-semibold'>Ad soyad</th>
                <th className='p-3 font-semibold'>Telefon</th>
                <th className='p-3 font-semibold'>Adres</th>
                <th className='p-3 font-semibold'>Detay</th>
            </tr>
        </thead>
        <tbody className='text-sm'>
            {couriers.map(courier => (
                <tr key={courier.id} className='bg-white'>
                    <td className='p-3'>{courier.name}</td>
                    <td className='p-3'>{courier.phone}</td>
                    <td className='p-3'>
                        <div className='whitespace-normal break-words'>
                            {courier.address}
                        </div>
                    </td>
                    <td className='p-3 flex gap-1'>
                        <button 
                            onClick={() => handleEdit(courier)} 
                            className='rounded px-3 py-1 bg-red-600 text-white'
                        >
                            Yeniləyin!!!
                        </button>
                        <button 
                            onClick={() => handleDelete(courier.id)} 
                            className='rounded px-3 py-1 bg-blue-500 text-white'
                        >
                            Sil
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>

                    ) : <AddCourier onAdd={handleAdd} onClose={() => setKurerEkle(false)} />}
                </div>
            </div>
            {editCourier && 
                <EditCourierPopup 
                    courier={editCourier} 
                    onSave={handleSave} 
                    onClose={() => setEditCourier(null)}
                />
            }
        </section>
        </>
    );
}

export default Couriers;
