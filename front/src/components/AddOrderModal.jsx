
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';
const AddOrderModal = ({ onClose, }) => {
    const [name, setName] = useState('-');
    const [phone, setPhone] = useState('-');
    const [address, setAddress] = useState('-');
    const [accessDenied, setAccessDenied] = useState(false);
    const navigate = useNavigate(); // Initialize the useNavigate hook
    // const [alertSuccess, setAlertSuccess] = useState(false);

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${base_url}/quick-orders`, {
                name,
                phone,
                address
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            // setAlertSuccess(true);
            // Extract the order ID from the response, assuming it is returned
            const orderId = response.data.id; // Adjust according to your API response

            // Redirect to the `muster-siparis-ekle/id` page
          
            navigate(`/muster-siparis-ekle/${orderId}`);
            
            // onSuccess(); // Optionally call onSuccess handler

        } catch (error) {
            
            if (error.response && error.response.status === 403) {
                setAccessDenied(true); // Set access denied if response status is 403
            }else{

                console.error('Error adding order:', error);
            }
        }
    };
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <>
            <div className="max-w-mobile fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded shadow-md w-80">
                <h3 className="text-lg font-semibold mb-4">Yeni Sipariş əlavə edin</h3>
                <div className="flex flex-col mb-4">
                    <label className="mb-1 font-medium">Ad Soyad</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border rounded py-2 px-3 outline-none text-sm"
                    />
                </div>
                <div className="flex flex-col mb-4">
                    <label className="mb-1 font-medium">Telefon</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border rounded py-2 px-3 outline-none text-sm"
                    />
                </div>
                <div className="flex flex-col mb-4">
                    <label className="mb-1 font-medium">Adres</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="border rounded py-2 px-3 outline-none text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSubmit} 
                        className="bg-green-500 text-white font-medium py-2 px-4 rounded"
                    >
                        əlavə edin
                    </button>
                    <button 
                        onClick={onClose} 
                        className="bg-gray-500 text-white font-medium py-2 px-4 rounded"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
        {/* {alertSuccess && <AlertSuccess setAlertSuccess={setAlertSuccess}/>} */}
        </>
    
    );
};

export default AddOrderModal;
