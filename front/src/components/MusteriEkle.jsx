

import React, { useState } from 'react';
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
function MusteriEkle({ setMusteriEkle }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [accessDenied, setAccessDenied] = useState(false); 
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Проверка обязательных полей
        if (!name || !phone) {
            setError('Ad soyad ve telefon alanları zorunludur.');
            return;
        }

        try {
            // Отправка POST-запроса
            await axios.post(`${base_url}/customers`, {
                name,
                phone,
                address,
                note
            },getHeaders());
            // Очистка формы и закрытие модального окна
            setName('');
            setPhone('');
            setAddress('');
            setNote('');
            setError('');
            setMusteriEkle(false);
            window.location.reload()
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
                console.error('Ошибка при отправке данных:', error);
                setError('Ошибка при отправке данных.');
               
            }
        }
    };
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <div className="absolute w-full h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
            <div className="w-4/5 h-full bg-white rounded m-auto overflow-hidden border">
                <div className="flex items-center bg-gray-50 justify-between py-1 px-4 uppercase border-b">
                    <h4>Müşteri bilgileri</h4>
                    <button className='py-1 px-3 bg-black text-white rounded' onClick={() => setMusteriEkle(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <form className="overflow-y-scroll h-[calc(100%-50px)]" onSubmit={handleSubmit}>
                    <div className='border rounded bg-gray-50 m-4 p-3'>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Ad soyad</h3>
                            <input
                                className='border rounded py-2 px-3 w-full outline-none text-sm font-medium'
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Telefon</h3>
                            <input
                                className='border rounded py-2 px-3 w-full outline-none text-sm font-medium'
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Adres</h3>
                            <textarea
                                className='border rounded py-2 px-3 w-full outline-none text-sm font-medium'
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            ></textarea>
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Açıklama/Hakkında/Not</h3>
                            <textarea
                                className='border rounded py-2 px-3 w-full outline-none text-sm font-medium'
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                        </div>
                        {error && <p className='text-red-500 mb-3'>{error}</p>}
                        <button type="submit" className='bg-sky-600 font-medium py-2 px-4 rounded text-white'>
                            Saxla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MusteriEkle;
