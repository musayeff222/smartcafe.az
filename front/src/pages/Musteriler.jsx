

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MusteriInfo from '../components/MusteriInfo';
import MusteriEkle from '../components/MusteriEkle';
import AccessDenied from '../components/AccessDenied'; // Импортируем компонент AccessDenied
import { base_url } from '../api/index';
import { Helmet } from 'react-helmet';
import DontActiveAcount from '../components/DontActiveAcount';
const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

function Musteriler() {
    const [musteriId, setMusteriId] = useState(localStorage.getItem('selectedCustomerId') || null);
    const [musteriEkle, setMusteriEkle] = useState(false);
    const [customers, setCustomers] = useState([]); // Store customer data
    const [filteredCustomers, setFilteredCustomers] = useState([]); // Filtered customer data
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [nameFilter, setNameFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [accessDenied, setAccessDenied] = useState(false); // New state for access denied
    const [ActiveUser, setActiveUser] = useState(false);
    useEffect(() => {
        // Fetch customer data
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${base_url}/customers`, getHeaders());
                setCustomers(response.data);
                setFilteredCustomers(response.data); // Initially show all customers
            } catch (error) {
                if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                    setActiveUser(true); // Set access denied if response status is 403
                }
                if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                    setAccessDenied(true); // Set access denied if response status is 403
                } else {
                    console.error('Error loading customers:', error);
                    setError('Failed to load customer data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    useEffect(() => {
        // Filter customers by name and phone
        const filtered = customers.filter(customer =>
            customer.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
            customer.phone.includes(phoneFilter)
        );
        setFilteredCustomers(filtered);
    }, [nameFilter, phoneFilter, customers]);
    const handleDeleteMusteri = async (id) => {
        try {
            await axios.delete(`${base_url}/customers/${id}`, getHeaders());
            // setMasas(masas.filter(masa => masa.id !== id));
            localStorage.removeItem('selectedCustomerId')
            window.location.reload()
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
               
                console.error('Error deleting masa:', error);
            }
        }
    };
    const handleCustomerClick = (id) => {
        setMusteriId(id);
        localStorage.setItem('selectedCustomerId', id); // Save customer id in localStorage
    };
    // if (ActiveUser) return <DontActiveAcount onClose={setActiveUser}/>;
    if (accessDenied) return <AccessDenied onClose={() => setAccessDenied(false)} />;
    // if (loading) return <div className="p-4 text-center">Yüklənir...</div>;
    // if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

    return (
        <>
                                     <Helmet>
        <title>Müstərilər | Smartcafe</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet>
            <section className='p-4'>
                <div className='rounded border border-gray-200 shadow-md'>
                    <div className='p-4 border-b bg-gray-100 flex flex-col md:flex-row items-center justify-between'>
                        <h3 className='text-xl font-semibold mb-2 md:mb-0'>Müşteriler</h3>
                        <button
                            onClick={() => setMusteriEkle(true)}
                            className="text-green-600 hover:bg-green-100 rounded p-2 border border-green-200"
                        >
                            <i className="fa-solid fa-plus"></i> Yeni müşteri əlavə edin
                        </button>
                    </div>
                    <div className='flex flex-col md:flex-row'>
                        <div className="md:w-1/4 p-4 border-b md:border-r border-gray-200 bg-white">
                            <p className='mb-2 font-semibold text-gray-700'>
                            Siyahıda {filteredCustomers.length} qeyd var. 
                            </p>
                            <div className='mb-4'>
                                <input
                                    type="text"
                                    placeholder="Ad filtrele"
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                    className='w-full p-2 border rounded border-gray-300'
                                />
                            </div>
                            <div className='mb-4'>
                                <input
                                    type="text"
                                    placeholder="Telefon filtrele"
                                    value={phoneFilter}
                                    onChange={(e) => setPhoneFilter(e.target.value)}
                                    className='w-full p-2 border rounded border-gray-300'
                                />
                            </div>
                            <table className='w-full text-left border border-gray-300'>
                                <thead className='bg-gray-100'>
                                    <tr className='border-b border-gray-300'>

                                        <th className='p-2 md:p-3 font-semibold text-md md:text-base'>Telefon</th>
                                        <th className='p-2 md:p-3 font-semibold text-md md:text-base'>Ad Soyad</th>
                                        <th className='p-2 md:p-3 font-semibold text-md md:text-base'>Sil</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map(customer => (
                                        <tr
                                            key={customer.id}
                                            className='cursor-pointer hover:bg-gray-50'
                                            onClick={() => handleCustomerClick(customer.id)}
                                        >
                                            <td className='p-2 md:p-3 text-md md:text-base'>{customer.name}</td>
                                            <td className='p-2 md:p-3 text-md md:text-base'>{customer.phone}</td>
                                            <td onClick={()=>handleDeleteMusteri(customer.id)} className='p-2 md:p-3 text-md md:text-base'><i className="fa-solid fa-trash-can"></i></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className='md:w-3/4 p-4'>
                            {musteriId == null ?
                                (<div className='w-full border rounded p-4 text-center text-blue-500 bg-blue-50 font-medium'>
                                    <p>Zəhmət olmasa müşteri seçiniz</p>
                                </div>)
                                : 
                                (<MusteriInfo musteriId={musteriId}/>)}
                        </div>
                    </div>
                </div>
            </section>
            {musteriEkle && <MusteriEkle setMusteriEkle={setMusteriEkle} />}
        </>
    );
}

export default Musteriler;
